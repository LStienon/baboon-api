import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3"

const s3 = new S3Client({
  endpoint: process.env.BUCKET_ENDPOINT,
  region: "fra1",
  credentials: {
    accessKeyId: process.env.BUCKET_KEY!,
    secretAccessKey: process.env.BUCKET_SECRET!,
  },
  forcePathStyle: true,
})

export const BucketService = {

  /**
   * Returns a string with the url of a random image from the given bucket folder
   * @param bucketFolder
   */
  getRandomImageUrl: async (bucketFolder: string): Promise<string | null> => {
    const bucketName = process.env.BUCKET_NAME!

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${bucketFolder}/`,
    })

    try {
      const { Contents } = await s3.send(command)
      console.log(Contents)

      if (!Contents || Contents.length === 0) {
        console.log("No file found")
        return null
      }

      const imageFiles = Contents.filter(item => item.Key?.endsWith('.webp'))

      if (imageFiles.length === 0) {
        console.log("No file found")
        return null
      }

      const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)]
      return `${process.env.BUCKET_CDN_ENDPOINT}/${randomFile.Key}`
    }
    catch (e) {
      console.error("Something went wrong while fetching a random image from the bucket:", e)
      return null
    }
  },

  /**
   * Upload a file or any content to the specified bucket.
   * @param bucketName Name of the bucket
   * @param key Path or file name for the content
   * @param body Content to upload (Buffer or binary data)
   * @param contentType MIME type of the content
   * @returns URL of the uploaded file
   */
  uploadFile: async (
      bucketName: string,
      key: string,
      body: Buffer | string, // Prend en charge Buffer ou texte brut
      contentType: string
  ): Promise<string> => {
    try {
      await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
            ACL: 'public-read',
          })
      );
      console.log(`File uploaded to bucket: ${bucketName}, key: ${key}`);
      return `${process.env.BUCKET_CDN_ENDPOINT}/${key}`;
    } catch (err) {
      console.error('Error uploading file to bucket:', err);
      throw new Error('Failed to upload file to the bucket');
    }
  },

  cleanSizedFolder: async () => {
    const prefix = `${process.env.BUCKET_FOLDER}/sized/`
    const bucketName = process.env.BUCKET_NAME!

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix
      })
      const response = await s3.send(listCommand)

      if (response.Contents && response.Contents.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: response.Contents.map(item => ({ Key: item.Key! })),
          },
        })

        await s3.send(deleteCommand)
        console.log('SIZED folder cleaned')
      }
    } catch (err) {
      console.error('Error cleaning SIZED folder:', err)
    }
  },

  /**
   * Just for testing the bucket's connection and credentials
   */
  testConnection: async () => {
    const bucketName = process.env.BUCKET_NAME!

    const command = new HeadBucketCommand({
      Bucket: bucketName,
    })

    try {
      await s3.send(command)
      console.log("Connection successfully established !")
    }
    catch (error) {
      console.error("Something went wrong while trying to establish the connection :", error)
    }
  }

}
