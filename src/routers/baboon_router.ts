import {Elysia, t} from "elysia"
import {BucketService} from "../services/bucket_service"
import sharp from 'sharp'
import {OpenaiService} from "../services/openai_service";
import axios from 'axios'

const localBucketFilesLifespan = parseInt(process.env.IMAGE_RETENTION_LIFESPAN ?? '10_000')

export const baboonRouter = new Elysia()
    .group('/baboon', (app) =>
        app
            .group('/random', (app) =>
                app
                    .get('/', async () => {
                      const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")
                      if (!imageUrl) return {error: "No images found"}

                      return {url: imageUrl}
                    })
                    .get('/:width/:height', async ({params}) => {
                      const {width, height} = params

                      const imageUrl = await BucketService.getRandomImageUrl(process.env.BUCKET_FOLDER ?? "")
                      if (!imageUrl) return {error: "No images found"}

                      const response = await fetch(imageUrl)
                      if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`)
                      }

                      const arrayBuffer = await response.arrayBuffer()
                      const imageBuffer = Buffer.from(arrayBuffer)

                      const resizedImageBuffer = await sharp(imageBuffer)
                          .resize(width, height)
                          .toBuffer()

                      const resizedImageKey = `${process.env.BUCKET_FOLDER}/sized/${width}x${height}-${Date.now()}.webp`

                      const resizedImageUrl = await BucketService.uploadFile(
                          process.env.BUCKET_NAME!,
                          resizedImageKey,
                          resizedImageBuffer,
                          'image/webp'
                      )

                      setTimeout(() => BucketService.cleanSizedFolder(), localBucketFilesLifespan)

                      return {url: resizedImageUrl}
                    }, {
                      params: t.Object({
                        width: t.Number(),
                        height: t.Number()
                      })
                    })
            )
            .group('/ai', (app) =>
                app.get('/', async () => {

                  const imageUrl = await OpenaiService.generateBaboonImage()

                  const generatedImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });

                  const generatedImageKey = `${process.env.BUCKET_FOLDER}/generated/ai-baboon-${Date.now()}.webp`
                  const bucketUrl = await BucketService.uploadFile(
                      process.env.BUCKET_NAME!,
                      generatedImageKey,
                      Buffer.from(generatedImage.data),
                      generatedImage.headers['content-type']
                  );

                  console.log('imageUrl = ' + imageUrl)
                  console.log('bucketUrl = ' + bucketUrl)

                  setTimeout(() => BucketService.cleanSizedFolder(), localBucketFilesLifespan)

                  return {url: bucketUrl}
                })
            )
    )

