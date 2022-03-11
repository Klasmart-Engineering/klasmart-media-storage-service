import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { expect } from 'chai'
import buildDefaultSchema from '../../../src/initialization/buildDefaultSchema'
import { CompositionRoot } from '../../../src/initialization/compositionRoot'
import { createApolloServer } from '../../../src/initialization/createApolloServer'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('createApolloServer', () => {
  context('NODE_ENV is set to production', () => {
    let nodeEnvOriginal: string | undefined
    let sut: ApolloServer<ExpressContext>

    before(async () => {
      nodeEnvOriginal = setEnvVar('NODE_ENV', 'production')
      const schema = await buildDefaultSchema(new CompositionRoot())
      sut = createApolloServer(schema)
      await sut.start()
    })

    after(async () => {
      restoreEnvVar('NODE_ENV', nodeEnvOriginal)
      await sut?.stop()
    })

    it('server.landingPage is null', async () => {
      expect(sut['landingPage']).to.be.null
    })
  })

  context('NODE_ENV is not set', () => {
    let nodeEnvOriginal: string | undefined
    let sut: ApolloServer<ExpressContext>

    before(async () => {
      nodeEnvOriginal = setEnvVar('NODE_ENV', undefined)
      const schema = await buildDefaultSchema(new CompositionRoot())
      sut = createApolloServer(schema)
      await sut.start()
    })

    after(async () => {
      restoreEnvVar('NODE_ENV', nodeEnvOriginal)
      await sut?.stop()
    })

    it('server.landingPage is not null', async () => {
      expect(sut['landingPage']).to.not.be.null
    })
  })
})
