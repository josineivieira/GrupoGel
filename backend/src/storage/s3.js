const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION;

let client = null;
function getClient() {
  if (client) return client;
  if (!bucket || !region) throw new Error('S3_BUCKET or S3_REGION not configured');
  client = new S3Client({ region, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } });
  return client;
}

async function uploadBuffer(buffer, key, contentType) {
  const s3 = getClient();
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
    ACL: 'public-read'
  };
  await s3.send(new PutObjectCommand(params));
  // Return public URL (works for standard AWS S3)
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

async function deleteKey(key) {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = { uploadBuffer, deleteKey };
