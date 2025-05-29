import {Elysia} from "elysia"
import { swagger } from "@elysiajs/swagger"
import {baseRouter} from "./routers/base_router"
import {baboonRouter} from "./routers/baboon_router"
import {customizedLogger} from "./middlewares/customized_logger"
import { cors } from '@elysiajs/cors'
import {BucketService} from "./services/bucket_service"
import {version} from '../package.json'

const app = new Elysia()
    .use(customizedLogger)
    .use(swagger({
      documentation: {
        info: {
          version: version,
          title: 'Baboon API'
        }
      }
    }))
    .use(baseRouter)
    .use(baboonRouter)
    .use(cors())
    .listen({
      port: process.env.PORT ?? 3000,
      idleTimeout: 255,
    })

console.log(
  `🐒 Baboon API is running at ${app.server?.hostname}:${app.server?.port}`
);

(async () => {
  await BucketService.cleanFolder('sized')
  await BucketService.cleanFolder('generated')
})()



