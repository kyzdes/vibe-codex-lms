import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
};

export const minioClient =
  globalForMinio.minio ??
  new Minio.Client({
    endPoint: new URL(process.env.S3_ENDPOINT || "http://localhost:9000")
      .hostname,
    port: parseInt(
      new URL(process.env.S3_ENDPOINT || "http://localhost:9000").port || "9000"
    ),
    useSSL: process.env.S3_ENDPOINT?.startsWith("https") || false,
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minioClient;

const BUCKET = process.env.S3_BUCKET || "vibelearn";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  }
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await ensureBucket();
  const path = `uploads/${Date.now()}-${fileName}`;
  await minioClient.putObject(BUCKET, path, file, file.length, {
    "Content-Type": contentType,
  });
  return `${process.env.NEXT_PUBLIC_S3_URL}/${path}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_S3_URL || "";
  const path = fileUrl.replace(`${baseUrl}/`, "");
  await minioClient.removeObject(BUCKET, path);
}
