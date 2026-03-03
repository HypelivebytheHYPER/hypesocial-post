import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function main() {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [
              "http://localhost:3000",
              "https://hypesocial-post.vercel.app",
            ],
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedHeaders: ["Content-Type", "x-amz-*"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  console.log(
    "✅ R2 CORS updated: GET + PUT + HEAD for localhost:3000 and production",
  );
}

main().catch((err) => {
  console.error("Failed to update CORS:", err.message);
  process.exit(1);
});
