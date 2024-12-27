import {logger} from "@bogeychan/elysia-logger";

export const customizedLogger = logger({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
})