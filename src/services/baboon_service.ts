import {BucketService} from "./bucket_service"
import {ImagesService} from "./images_service"
import {OpenaiService} from "./openai_service"
import {
  BaboonApiException,
} from "../constants/custom_exceptions"
import {ErrHandler} from "../routers/baboon_router"

export interface SizedImageArgs {
  width: number
  height: number
}

const localBucketFilesLifespan = parseInt(process.env.IMAGE_RETENTION_LIFESPAN ?? '10_000')

const handleError = (error: any, handler: ErrHandler) => {
  if (error instanceof BaboonApiException) {
    return handler(error.errCode, { error: error.message })
  }
  else if (error instanceof Error) {
    return handler(500, { error: error.message })
  }
  else {
    return handler(500, { error: "An unexpected error occurred" })
  }
}

export const BaboonService = {

  /**
   * Returns a random image of a baboon, eventually sized in pixels if the width and height are given
   * @param ctx
   * @param sizedArgs
   */
  getRandomBaboonImage: async (ctx: ErrHandler, sizedArgs?: SizedImageArgs) => {
    try {
      const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")

      // STOPPING HERE FOR THE /random ENDPOINT
      if (!sizedArgs) return {url: imageUrl}

      // GOING FURTHER FOR ENDPOINT /random/:width/:height
      const {width, height} = sizedArgs
      const resizedImageBuffer = await ImagesService.fetchAndGetBuffer(imageUrl, sizedArgs)

      const resizedImageKey = `${process.env.BUCKET_FOLDER}/sized/${width}x${height}-${Date.now()}.webp`

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
      return handleError(e, ctx)
    }
  },

  /**
   * Returns an AI generated image of a baboon
   * @param ctx
   */
  getGeneratedBaboonImage: async (ctx: ErrHandler) => {
    try {
      const imageUrl = await OpenaiService.generateBaboonImage()

      const genImgBuffer = await ImagesService.fetchAndGetBuffer(imageUrl)

      const generatedImageKey = `${process.env.BUCKET_FOLDER}/generated/ai-baboon-${Date.now()}.webp`
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
      return handleError(e, ctx)
    }
  }

}