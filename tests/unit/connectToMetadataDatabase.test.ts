/* eslint-disable @typescript-eslint/no-unused-vars */
import { Connection } from 'typeorm'
import expect from '../utils/chaiAsPromisedSetup'
import {
  ConnectionFactory,
  connectToMetadataDatabase,
  DUPLICATE_DATABASE,
  getMetadataDatabaseConnectionOptions,
  INVALID_CATALOG_NAME,
  UNIQUE_VIOLATION,
} from '../../src/initialization/connectToMetadataDatabase'
import Substitute from '@fluffy-spoon/substitute'

describe('audioResolver', () => {
  context('database does not exist', () => {
    context(
      'createIfDoesntExist=false, error.code=INVALID_CATALOG_NAME',
      () => {
        it('throws error', async () => {
          // Arrange
          const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
          const createIfDoesntExist = false
          const connectionFactory: ConnectionFactory = (options) => {
            throw {
              message: 'database does not exist',
              code: INVALID_CATALOG_NAME,
            }
          }

          // Act
          const fn = () =>
            connectToMetadataDatabase(
              url,
              createIfDoesntExist,
              connectionFactory,
            )

          // Assert
          await expect(fn()).to.be.rejected
        })
      },
    )

    context('createIfDoesntExist=true, error.code=INVALID_CATALOG_NAME', () => {
      it('returns valid connection', async () => {
        // Arrange
        const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
        const createIfDoesntExist = true
        let counter = 0
        const connectionFactory: ConnectionFactory = (options) => {
          if (counter === 0) {
            counter += 1
            throw {
              message: 'database does not exist',
              code: INVALID_CATALOG_NAME,
            }
          } else if (counter === 1) {
            counter += 1
            // This represents the connection to the database named 'postgres'.
            const connection = Substitute.for<Connection>()
            connection.query(`CREATE DATABASE audio_db;`).resolves({})
            connection.close().resolves()
            return Promise.resolve(connection)
          }
          // This represents the connection to the target database.
          const connection = new Connection(options)
          return Promise.resolve(connection)
        }

        // Act
        const connection = await connectToMetadataDatabase(
          url,
          createIfDoesntExist,
          connectionFactory,
        )

        // Assert
        expect(connection).to.not.be.null
        expect(connection).to.not.be.undefined
        expect(connection.options).to.deep.equal(
          getMetadataDatabaseConnectionOptions(url),
        )
      })
    })

    context(
      'createIfDoesntExist=true, error.code=INVALID_CATALOG_NAME, error.code=INVALID_CATALOG_NAME',
      () => {
        it('throws error', async () => {
          // Arrange
          const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
          const createIfDoesntExist = true
          const connectionFactory: ConnectionFactory = (options) => {
            throw {
              message: 'database does not exist',
              code: INVALID_CATALOG_NAME,
            }
          }

          // Act
          const fn = () =>
            connectToMetadataDatabase(
              url,
              createIfDoesntExist,
              connectionFactory,
            )

          // Assert
          await expect(fn()).to.be.rejected
        })
      },
    )

    context(
      'createIfDoesntExist=true, error.code=INVALID_CATALOG_NAME, error.code=UNKNOWN_ERROR',
      () => {
        it('throws error', async () => {
          // Arrange
          const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
          const createIfDoesntExist = true
          let counter = 0
          const connectionFactory: ConnectionFactory = (options) => {
            if (counter === 0) {
              counter += 1
              throw {
                message: 'database does not exist',
                code: INVALID_CATALOG_NAME,
              }
            }
            throw {
              message: 'something went wrong',
              code: 'UNKNOWN_ERROR',
            }
          }

          // Act
          const fn = () =>
            connectToMetadataDatabase(
              url,
              createIfDoesntExist,
              connectionFactory,
            )

          // Assert
          await expect(fn()).to.be.rejected
        })
      },
    )

    context(
      'createIfDoesntExist=true, error.code=INVALID_CATALOG_NAME, error.code=UNIQUE_VIOLATION, connect succeeds',
      () => {
        it('returns valid connection', async () => {
          // Arrange
          const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
          const createIfDoesntExist = true
          let counter = 0
          const connectionFactory: ConnectionFactory = (options) => {
            if (counter === 0) {
              counter += 1
              throw {
                message: 'database does not exist',
                code: INVALID_CATALOG_NAME,
              }
            } else if (counter === 1) {
              counter += 1
              // This represents the connection to the database named 'postgres'.
              const connection = Substitute.for<Connection>()
              connection.query(`CREATE DATABASE audio_db;`).rejects({
                message: 'unique violation',
                code: UNIQUE_VIOLATION,
              })
              return Promise.resolve(connection)
            }
            // This represents the connection to the target database.
            const connection = new Connection(options)
            return Promise.resolve(connection)
          }

          // Act
          const connection = await connectToMetadataDatabase(
            url,
            createIfDoesntExist,
            connectionFactory,
          )

          // Assert
          expect(connection).to.not.be.null
          expect(connection).to.not.be.undefined
          expect(connection.options).to.deep.equal(
            getMetadataDatabaseConnectionOptions(url),
          )
        })
      },
    )

    context(
      'createIfDoesntExist=true, error.code=INVALID_CATALOG_NAME, error.code=DUPLICATE_DATABASE, connect succeeds',
      () => {
        it('returns valid connection', async () => {
          // Arrange
          const url = 'postgres://postgres:kidsloop@localhost:5432/audio_db'
          const createIfDoesntExist = true
          let counter = 0
          const connectionFactory: ConnectionFactory = (options) => {
            if (counter === 0) {
              counter += 1
              throw {
                message: 'database does not exist',
                code: INVALID_CATALOG_NAME,
              }
            } else if (counter === 1) {
              counter += 1
              // This represents the connection to the database named 'postgres'.
              const connection = Substitute.for<Connection>()
              connection.query(`CREATE DATABASE audio_db;`).rejects({
                message: 'duplicate database',
                code: DUPLICATE_DATABASE,
              })
              return Promise.resolve(connection)
            }
            // This represents the connection to the target database.
            const connection = new Connection(options)
            return Promise.resolve(connection)
          }

          // Act
          const connection = await connectToMetadataDatabase(
            url,
            createIfDoesntExist,
            connectionFactory,
          )

          // Assert
          expect(connection).to.not.be.null
          expect(connection).to.not.be.undefined
          expect(connection.options).to.deep.equal(
            getMetadataDatabaseConnectionOptions(url),
          )
        })
      },
    )
  })
})
