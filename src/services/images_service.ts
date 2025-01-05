import {ImageFetchFailedException} from "../constants/custom_exceptions"
import sharp from "sharp"
import {SizedImageArgs} from "./baboon_service"
import axios from "axios"

interface FetchedBufferResponse {
  buffer: Buffer
  contentType: string
}

/**
 * Service for handling image-related operations.
 */
export const ImagesService = {

  /**
   * Fetches an image from a given URL, optionally resizes it, and returns its buffer and content type.
   *
   * @param dlUrl - The URL of the image to fetch.
   * @param sizedArgs - Optional resizing arguments specifying width and height of the image.
   * @returns A promise resolving to an object containing:
   *  - `buffer`: The image as a Buffer.
   *  - `contentType`: The MIME type of the fetched image.
   * @throws {ImageFetchFailedException} If the HTTP request fails or the status code is not 200.
   */
  fetchAndGetBuffer: async (dlUrl: string, sizedArgs?: SizedImageArgs): Promise<FetchedBufferResponse> => {
    const response = await axios.get(dlUrl, { responseType: 'arraybuffer' })
    if (response.status !== 200) {
      throw new ImageFetchFailedException(response.statusText)
    }

    const imageBuffer = Buffer.from(response.data)

    if (sizedArgs) {
      return {
        contentType: response.headers['content-type'],
        buffer: await sharp(imageBuffer)
            .resize(sizedArgs.width, sizedArgs.height)
            .toBuffer()
      }
    }
    else {
      return {
        contentType: response.headers['content-type'],
        buffer: await sharp(imageBuffer).toBuffer()
      }
    }
  }

}
