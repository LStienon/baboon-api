import {Elysia} from "elysia";
import { swagger } from "@elysiajs/swagger";
import {baseRouter} from "./routers/base_router";
import {baboonRouter} from "./routers/baboon_router";
import {customizedLogger} from "./middlewares/customized_logger";
import { cors } from '@elysiajs/cors'

const app = new Elysia()
    .use(customizedLogger)
    .use(swagger())
    .use(baseRouter)
    .use(baboonRouter)
    .use(cors())
    .listen(process.env.PORT ?? 3000);

console.log(
  `🐒 Baboon API is running at ${app.server?.hostname}:${app.server?.port}`
)



