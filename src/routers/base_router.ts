import {Elysia} from "elysia";

export const baseRouter = new Elysia()
  .get('/clinchou', () => {
    return { message: 'BONJOUR MON CLINCHOU' }
  })


