import {Elysia} from "elysia"
import {BucketService} from "../services/bucket_service"
import sharp from 'sharp'

export const baboonRouter = new Elysia()
  .get('/baboon/random', async () => {

    const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")
    if (!imageUrl) return { error: "No images found" }

    return { url: imageUrl }
  })
  .get('/baboon/random/:width/:height', async ({ params }) => {
    const { width, height } = params

    const w = parseInt(width, 10)
    const h = parseInt(height, 10)

    if (isNaN(w) || isNaN(h)) {
      return { error: "Invalid width or height parameters" }
    }

    const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")
    if (!imageUrl) return { error: "No images found" }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    const resizedImageBuffer = await sharp(imageBuffer)
        .resize(w, h)
        .toBuffer()

    const resizedImageKey = `${process.env.BUCKET_FOLDER}/sized/${w}x${h}-${Date.now()}.webp`

    const resizedImageUrl = await BucketService.uploadFile(
        process.env.BUCKET_NAME!,
        resizedImageKey,
        resizedImageBuffer,
        'image/webp'
    )

    setTimeout(() => BucketService.cleanSizedFolder(), 10000)

    return { url: resizedImageUrl }
  })
