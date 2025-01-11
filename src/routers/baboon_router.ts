import {Context, Elysia, t, TSchema} from "elysia"
import {BaboonService} from "../services/baboon_service"
import {LoggingService} from "../services/logging_service";

export type ErrHandler = Context["error"]

const createValidationError = (fields: Record<string, TSchema>) => {
  return t.Object({
    type: t.String(),
    on: t.String(),
    summary: t.String(),
    property: t.String(),
    message: t.String(),
    expected: t.Optional(t.Object(fields)),
    found: t.Object(fields),
    errors: t.Array(
        t.Object({
          type: t.Number(),
          schema: t.Any(),
          path: t.String(),
          value: t.Any(),
          message: t.String(),
          summary: t.String(),
          errors: t.Optional(t.Array(t.Any())),
        })
    ),
  });
}


export const baboonRouter = new Elysia()
    .group('/baboon', (app) =>
        app
            .group('/random', (app) =>
                app
                    // @ts-ignore
                    .get('/', async ({error}) => {
                      LoggingService.info('Someone just requested a random image of a baboon !')
                      return await BaboonService.getRandomBaboonImage(error as ErrHandler)
                    }, {
                      response: {
                        200: t.Object({
                          url: t.String()
                        }),
                        204: t.Object({
                          error: t.String()
                        }),
                        500: t.Object({
                          error: t.String()
                        }),
                      }
                    })
                    // @ts-ignore
                    .get('/:width/:height', async ({params, error}) => {
                      LoggingService.info('Someone just requested a sized, random image of a baboon !')
                      return BaboonService.getRandomBaboonImage(error as ErrHandler, params)
                    }, {
                      params: t.Object({
                        width: t.Number(),
                        height: t.Number()
                      }),
                      response: {
                        200: t.Object({
                          url: t.String()
                        }),
                        204: t.Object({
                          error: t.String()
                        }),
                        422: createValidationError({
                          width: t.Number(),
                          height: t.Number(),
                        }),
                        500: t.Object({
                          error: t.String()
                        }),
                      }
                    })
                    // @ts-ignore
                    .get('/many', async ({query, error}) => {
                      LoggingService.info(`Someone just requested ${query.quantity} random images of baboons !`)
                      return await BaboonService.getManyRandomBaboonImages(error as ErrHandler, query)
                    }, {
                      query: t.Object({
                        quantity: t.Number({
                          minimum: 1,
                          maximum: 20
                        })
                      }),
                      response: {
                        200: t.Object({
                          urls: t.Array(t.String())
                        }),
                        204: t.Object({
                          error: t.String()
                        }),
                        500: t.Object({
                          error: t.String()
                        }),
                      }
                    })
            )
            .group('/ai', (app) =>
                // @ts-ignore
                app.get('/', async ({error}) => {
                  LoggingService.info('Someone just requested originally created by AI image of a baboon !')
                  return await BaboonService.getGeneratedBaboonImage(error as ErrHandler)
                }, {
                  response: {
                    200: t.Object({
                      url: t.String()
                    }),
                    500: t.Object({
                      error: t.String()
                    }),
                  }
                })
            )
    )

