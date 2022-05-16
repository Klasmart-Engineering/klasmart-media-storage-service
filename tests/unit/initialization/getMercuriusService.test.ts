import { errorFormatter } from '../../../src/initialization/createMercuriusService'
import Fastify from 'fastify'

describe('getMercuriusService', () => {
  describe('errorFormatter', () => {
    context('executionResult.errors is undefined', () => {
      it('executes without error', async () => {
        const app = Fastify()
        errorFormatter({ errors: undefined }, { app })
      })
    })
  })
})
