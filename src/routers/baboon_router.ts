import {Context, Elysia, t} from "elysia"
import {BaboonService} from "../services/baboon_service"

export type ErrHandler = Context["error"]

export const baboonRouter = new Elysia()
    .group('/baboon', (app) =>
        app
            .group('/random', (app) =>
                app
                    .get('/', async ({error}) => {
                      return await BaboonService.getRandomBaboonImage(error)
                    })
                    .get('/:width/:height', async ({params, error}) => {
                      return BaboonService.getRandomBaboonImage(error, params)
                    }, {
                      params: t.Object({
                        width: t.Number(),
                        height: t.Number()
                      })
                    })
            )
            .group('/ai', (app) =>
                app.get('/', async ({error}) => {
                  return await BaboonService.getGeneratedBaboonImage(error)
                })
            )
    )

