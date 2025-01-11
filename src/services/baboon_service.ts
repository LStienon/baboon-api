import {BucketService} from "./bucket_service"
import {ImagesService} from "./images_service"
import {OpenaiService} from "./openai_service"
import {
  BaboonApiException, ImageFetchFailedException, NoImagesFoundException,
} from "../constants/custom_exceptions"
import {ErrHandler} from "../routers/baboon_router"
import {LoggingService} from "./logging_service";

export interface SizedImageParams {
  width: number
  height: number
}

export interface ManyImagesQuery {
  quantity: number
}

const localBucketFilesLifespan = parseInt(process.env.IMAGE_RETENTION_LIFESPAN ?? '10_000')

const getErrorResponse = (error: any) => {
  if (error instanceof BaboonApiException) {
    LoggingService.error("An expected error occurred and got handled", { details: error.errMessage })
    return { error: error.message, code: error.errCode }
  }
  else if (error instanceof Error) {
    LoggingService.error("An unexpected error occurred, check the logs for more infos", { details: error.stack })
    return { error: error.message, code: 500 }
  }
  else {
    LoggingService.error("An unexpected error occurred, check the logs for more infos", { details: error.stack })
    return { error: "An unexpected error occurred", code: 500 }
  }
}

export const BaboonService = {

  /**
   * Fetches a random image of a baboon. If width and height are provided,
   * the image is resized to the specified dimensions.
   *
   * @param context - The error handling context used to handle and return errors.
   * @param sizedArgs - Optional parameters specifying the desired width and height
   *                    for resizing the image.
   * @returns An object containing the URL of the random baboon image.
   *          - If resizing parameters are provided, the URL will point to the resized image.
   *          - If no resizing parameters are provided, the URL will point to the original image.
   * @throws Throws errors handled by the provided context, including:
   *         - 204: No images found.
   *         - 500: Internal server error.
   */
  getRandomBaboonImage: async (context: ErrHandler, sizedArgs?: SizedImageParams) => {
    try {

      LoggingService.info('Step 1 : choosing a random baboon image from the bucket')
      const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")

      // STOPPING HERE FOR THE /random ENDPOINT
      if (!sizedArgs) {
        return { url: imageUrl }
      }

      // GOING FURTHER FOR ENDPOINT /random/:width/:height
      LoggingService.info('Step 2 : resizing the baboon image at the desired resolution', { size: sizedArgs })
      const {width, height} = sizedArgs
      const resizedImageBuffer = await ImagesService.fetchAndGetBuffer(imageUrl, sizedArgs)

      const resizedImageKey = `${process.env.BUCKET_FOLDER}/sized/${width}x${height}-${Date.now()}.webp`

      LoggingService.info('Step 3 : reuploading the resized baboon image on the bucket, in the temporary folder', { filePath: resizedImageKey })
      const resizedImageUrl = await BucketService.uploadFile(
          process.env.BUCKET_NAME!,
          resizedImageKey,
          resizedImageBuffer.buffer,
          resizedImageBuffer.contentType
      )

      setTimeout(() => BucketService.cleanFolder('sized'), localBucketFilesLifespan)

      return {url: resizedImageUrl}
    }
    catch (e) {
      const formattedErr = getErrorResponse(e)
      return context(formattedErr.code, { error: formattedErr.error })
    }
  },

  /**
   * Fetches multiple random images of baboons.
   *
   * @param context - The error handling context used to handle and return errors.
   * @param params - Parameters specifying the number of random images to fetch.
   *                 - `quantity`: The number of images to fetch.
   * @returns An object containing an array of URLs pointing to the random baboon images.
   * @throws Throws errors handled by the provided context, including:
   *         - 204: No images found.
   *         - 500: Internal server error.
   */
  getManyRandomBaboonImages: async (context: ErrHandler, params: ManyImagesQuery) => {
    try {
      const { quantity } = params

      const imageUrls = await Promise.all(
          Array.from({ length: quantity }).map(() =>
              BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")
          )
      )

      return { urls: imageUrls }
    }
    catch (e) {
      const formattedErr = getErrorResponse(e)
      return context(formattedErr.code, { error: formattedErr.error })
    }
  },

  /**
   * Generates a custom image of a baboon using AI and uploads it to a bucket.
   *
   * @param context - The error handling context used to handle and return errors.
   * @returns An object containing the URL of the generated baboon image stored in the bucket.
   * @throws Throws errors handled by the provided context, including:
   *         - 500: Internal server error or issues with the AI generation process.
   */
  getGeneratedBaboonImage: async (context: ErrHandler) => {
    try {
      LoggingService.info('Step 1 : calling Open AI to generate the baboon image')
      const imageUrl = await OpenaiService.generateBaboonImage()

      LoggingService.info('Step 2 : downloading the AI generated baboon image', { url: imageUrl })
      const genImgBuffer = await ImagesService.fetchAndGetBuffer(imageUrl)

      const generatedImageKey = `${process.env.BUCKET_FOLDER}/generated/ai-baboon-${Date.now()}.webp`
      LoggingService.info('Step 2 : reuploading the AI generated baboon image', { filePath: generatedImageKey })
      const bucketUrl = await BucketService.uploadFile(
          process.env.BUCKET_NAME!,
          generatedImageKey,
          genImgBuffer.buffer,
          genImgBuffer.contentType
      )

      console.log('imageUrl = ' + imageUrl)
      console.log('bucketUrl = ' + bucketUrl)

      setTimeout(() => BucketService.cleanFolder('generated'), localBucketFilesLifespan)

      return {url: bucketUrl}
    }
    catch (e) {
      const formattedErr = getErrorResponse(e)
      return context(formattedErr.code, { error: formattedErr.error })
    }
  }

}