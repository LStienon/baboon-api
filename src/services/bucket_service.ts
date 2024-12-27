import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.BUCKET_ENDPOINT, // Ton endpoint personnalisé
  region: "fra1", // Région arbitraire
  credentials: {
    accessKeyId: process.env.BUCKET_KEY!, // Utilise l'Access Key ID
    secretAccessKey: process.env.BUCKET_SECRET!, // Utilise la Secret Access Key
  },
  forcePathStyle: false,
});

export const getRandomImageUrl = async () => {
  const bucketFolder = process.env.BUCKET_FOLDER!;
  const command = new ListObjectsCommand({
    Bucket: bucketFolder, // Ton dossier est traité comme un "Bucket" logique
  });

  const { Contents } = await s3.send(command);
  if (!Contents || Contents.length === 0) return null;

  const randomFile = Contents[Math.floor(Math.random() * Contents.length)];
  return `${process.env.BUCKET_ENDPOINT}/${randomFile.Key}`;
};
