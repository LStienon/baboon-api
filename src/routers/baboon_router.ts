import {Elysia} from "elysia";
import {getRandomImageUrl} from "../services/bucket_service";

export const baboonRouter = new Elysia()
  .get('/baboon/random', async () => {

    const imageUrl = await getRandomImageUrl();
    if (!imageUrl) return { error: "No images found" };

    return { url: imageUrl };
  })


