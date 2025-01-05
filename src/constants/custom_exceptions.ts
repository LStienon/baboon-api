export class BaboonApiException extends Error {
  errMessage?: string
  errCode: number
  constructor(error: string, code: number) {
    super(error)
    this.errCode = code
  }
}

export class ImageGenerationFailedException extends BaboonApiException {
  constructor() {
    super('IMAGE_GENERATION_FAILED', 500)
    this.errMessage = "AI Image generation failed"
  }
}

export class NoImagesFoundException extends BaboonApiException {
  constructor() {
    super('FOUND_NO_IMAGES', 204)
    this.errMessage = "No images found"
  }
}

export class FailedUploadException extends BaboonApiException {
  constructor() {
    super('UPLOAD_FAILED_EXCEPTION', 500)
    this.errMessage = "The file upload on the DO bucket space failed"
  }
}

export class ImageFetchFailedException extends BaboonApiException {
  url: string
  constructor(url: string) {
    super('IMAGE_FETCH_FAILED', 500)
    this.errMessage = "AI Image generation failed"
    this.url = url
  }
}

