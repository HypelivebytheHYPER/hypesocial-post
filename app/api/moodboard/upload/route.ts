import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_FILE_SIZES: Record<string, number> = {
  image: 8 * 1024 * 1024, // 8MB
  video: 512 * 1024 * 1024, // 512MB
};

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
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { filename, content_type, size, project_id } = body;

    if (!filename || !content_type || !project_id) {
      return NextResponse.json(
        { error: "filename, content_type, and project_id are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(content_type.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid content_type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (size !== undefined) {
      const maxSize = content_type.startsWith("video/")
        ? MAX_FILE_SIZES.video
        : MAX_FILE_SIZES.image;
      if (size > maxSize) {
        return NextResponse.json(
          {
            error: `File too large. Max ${maxSize / (1024 * 1024)}MB for ${content_type.startsWith("video/") ? "videos" : "images"}`,
          },
          { status: 400 },
        );
      }
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!bucketName || !publicUrl) {
      return NextResponse.json(
        { error: "R2 bucket not configured" },
        { status: 500 },
      );
    }

    const ext = filename.split(".").pop() || "";
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
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
