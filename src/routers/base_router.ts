import {Elysia, t} from "elysia";

const clinchouResponse = {
  200: t.Object({
    message: t.String()
  })
}

export const baseRouter = new Elysia()
  .get('/clinchou', () => {
    return { message: 'BONJOUR MON CLINCHOU' }
  }, {
    response: clinchouResponse,
  })


