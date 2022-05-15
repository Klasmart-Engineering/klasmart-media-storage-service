import { expect } from 'chai'
import supertest from 'supertest'
import buildDefaultSchema from '../../../src/initialization/buildDefaultSchema'
import CompositionRoot from '../../../src/initialization/compositionRoot'
import createMercuriusService from '../../../src/initialization/createMercuriusService'
import IMediaStorageService from '../../../src/interfaces/mediaStorageService'
import { TestCompositionRoot } from '../testCompositionRoot'
import { version } from '../../../package.json'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('createMercuriusService', () => {
  context('call service.listen and service.close', () => {
    let compositionRoot: CompositionRoot
    let service: IMediaStorageService

    after(async () => {
      await service.close()
      await compositionRoot.cleanUp()
    })

    it('service.listen callback executes', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      service = await createMercuriusService(schema, compositionRoot)

      // Act
      let callbackInvoked = false
      await service.listen(8080, () => {
        callbackInvoked = true
      })

      // Assert
      expect(callbackInvoked).to.be.true
    })
  })

  context('call version endpoint', () => {
    let compositionRoot: CompositionRoot

    after(async () => {
      await compositionRoot.cleanUp()
    })

    it('returns 200 and version matching package.json', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      const service = await createMercuriusService(schema, compositionRoot)
      const request = supertest(service.server)

      // Act
      const response = await request.get('/version').send().expect(200)

      // Assert
      expect(response.body.version).to.equal(version)
    })
  })

  context('call health endpoint', () => {
    let compositionRoot: CompositionRoot

    after(async () => {
      await compositionRoot.cleanUp()
    })

    it('returns 200', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      const service = await createMercuriusService(schema, compositionRoot)
      const request = supertest(service.server)

      // Act & Assert
      const response = await request.get('/health').send().expect(200)
    })
  })

  context("ROUTE_PREFIX = '/my-service'", () => {
    let compositionRoot: CompositionRoot
    let originalPrefix: string | undefined

    before(() => {
      originalPrefix = setEnvVar('ROUTE_PREFIX', '/my-service')
    })

    after(async () => {
      restoreEnvVar('ROUTE_PREFIX', originalPrefix)
      await compositionRoot.cleanUp()
    })

    it("graphql path equals '/my-service/graphql'", async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)

      // Act
      const service = await createMercuriusService(schema, compositionRoot)

      // Assert
      expect(service.path).to.equal('/my-service/graphql')
    })
  })

  context('ROUTE_PREFIX not defined', () => {
    let compositionRoot: CompositionRoot
    let originalPrefix: string | undefined

    before(() => {
      originalPrefix = setEnvVar('ROUTE_PREFIX', undefined)
    })

    after(async () => {
      restoreEnvVar('ROUTE_PREFIX', originalPrefix)
      await compositionRoot.cleanUp()
    })

    it("graphql path equals '/graphql'", async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)

      // Act
      const service = await createMercuriusService(schema, compositionRoot)

      // Assert
      expect(service.path).to.equal('/graphql')
    })
  })
})
