import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import { connectToMetadataDatabase } from '../../src/initialization/connectToMetadataDatabase'
import Config from '../../src/initialization/config'
import { Connection } from 'typeorm'
import { InitDatabase1646365428128 } from '../../src/migrations/1646365428128-InitDatabase'

describe('1646365428128-InitDatabase', () => {
  let connection: Connection

  before(async () => {
    connection = await connectToMetadataDatabase(
      Config.getMetadataDatabaseUrl(),
    )
  })

  after(async () => {
    await connection?.close()
  })

  context('media_metadata exists', () => {
    it('media_metadata does not exist', async () => {
      // Arrange
      const sut = new InitDatabase1646365428128()
      const queryRunner = connection.createQueryRunner()

      // Act
      await sut.down(queryRunner)

      // Assert
      const exists = await queryRunner.hasTable('media_metadata')
      expect(exists).to.be.false
    })
  })
})
