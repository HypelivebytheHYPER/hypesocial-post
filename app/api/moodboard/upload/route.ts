import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { ALLOWED_CONTENT_TYPES, getMaxFileSize } from "@/lib/media-constants";
import { parseBody } from "@/lib/validations";
import { MoodboardUploadSchema } from "@/lib/validations/moodboard";

function getS3Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * POST /api/moodboard/upload
 * Generate a presigned PUT URL for direct R2 upload.
 */
export async function POST(request: NextRequest) {
  try {
    const jsonBody = await request.json().catch(() => null);

    const parsed = parseBody(MoodboardUploadSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const { filename, content_type, size, project_id } = parsed.data;

    if (!ALLOWED_CONTENT_TYPES.includes(content_type.toLowerCase() as typeof ALLOWED_CONTENT_TYPES[number])) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: `Invalid content_type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    if (size !== undefined) {
      const maxSize = getMaxFileSize(content_type as typeof ALLOWED_CONTENT_TYPES[number]);
      if (size > maxSize) {
        return NextResponse.json(
          {
            error: "Validation Error",
          message: `File too large. Max ${maxSize / (1024 * 1024)}MB for ${content_type.startsWith("video/") ? "videos" : "images"}`,
          statusCode: 400,
          },
          { status: 400 },
        );
      }
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!bucketName || !publicUrl) {
      return NextResponse.json(
        { error: "Internal Server Error", message: "R2 bucket not configured", statusCode: 500 },
        { status: 500 },
      );
    }

    const key = `moodboard/${project_id}/${randomUUID()}-${filename}`;

    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: content_type,
    });

    const upload_url = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 min
    const media_url = `${publicUrl}/${key}`;

    return NextResponse.json({ upload_url, media_url, key }, { status: 201 });
  } catch (error) {
    console.error("[API] Moodboard upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to generate upload URL", statusCode: 500 },
      { status: 500 },
    );
  }
}
