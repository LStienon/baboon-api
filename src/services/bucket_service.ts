import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3"
import {NoImagesFoundException} from "../constants/custom_exceptions"
import {LoggingService} from "./logging_service"

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
   * Returns a string with the URL of a random image from the given bucket folder
   * @param bucketFolder The folder in the bucket to search for images
   * @returns URL of a random image or null if no image is found
   */
  getRandomImageUrl: async (bucketFolder: string): Promise<string> => {
    const bucketName = process.env.BUCKET_NAME!

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${bucketFolder}/`,
      Delimiter: '/'
    })

    const { Contents } = await s3.send(command)

    if (!Contents || Contents.length === 0) {
      LoggingService.warn('No images found on the DO bucket', { command: command })
      throw new NoImagesFoundException()
    }

    const imageFiles = Contents.filter(item =>
        item.Key?.match(/\.(webp|png|jpeg)$/i)
    )

    if (imageFiles.length === 0) {
      LoggingService.warn('Images were found on the DO bucket, but none were valid', { fetchedContent: Contents })
      throw new NoImagesFoundException()
    }

    const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)]
    return `${process.env.BUCKET_CDN_ENDPOINT}/${randomFile.Key}`
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
      body: Buffer | string,
      contentType: string
  ): Promise<string> => {
    await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
          ACL: 'public-read',
        })
    )
    const newUrl = `${process.env.BUCKET_CDN_ENDPOINT}/${key}`
    LoggingService.info('Just uploaded a new image to the DO bucket', { url: newUrl })
    return newUrl
  },

  /**
   * Deletes all objects within the specified folder in the S3 bucket.
   * @param folderName Name of the folder to clean
   */
  cleanFolder: async (folderName: string) => {
    const prefix = `${process.env.BUCKET_FOLDER}/${folderName}/`
    const bucketName = process.env.BUCKET_NAME!

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
      LoggingService.info(`Just cleaned the ${folderName} folder, nice !`)
    }
    else {
      LoggingService.warn(`Couldn't clean the ${folderName} folder, either it didn't exist, was empty, or the command to check that failed`, { response: response })
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
      const connSuccess = "Connection successfully established !"
      LoggingService.info(connSuccess)
      console.log(connSuccess)
    }
    catch (error) {
      const connError = "Something went wrong while trying to establish the connection ..."
      LoggingService.error(connError, { error: error })
      console.error("Something went wrong while trying to establish the connection :", error)
    }
  }

}
