import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "node:crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET;
const prefix = process.env.S3_PREFIX || "";

export default async function handler(req, res) {
  try {
    const { filename="upload", type="application/octet-stream", size=0 } = req.query;
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g,"_");
    const key = `${prefix}${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Conditions: [["content-length-range",0,50*1024*1024],["eq","$Content-Type",type]],
      Expires: 60
    });
    res.status(200).json({ url, fields });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error:"sign failed" });
  }
}