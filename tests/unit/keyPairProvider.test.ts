import expect from '../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import IKeyStorage from '../../src/interfaces/keyStorage'
import { KeyPairProvider } from '../../src/providers/keyPairProvider'
import { KeyPair } from '../../src/helpers/keyPair'
import { ErrorMessage } from '../../src/helpers/errorMessages'

describe('KeyPairProvider', () => {
  describe('getPublicKey', () => {
    context('matching public and private keys exist in storage', () => {
      it('returns matching public key', async () => {
        // Arrange
        const publicKeyStorage = Substitute.for<IKeyStorage>()
        const privateKeyStorage = Substitute.for<IKeyStorage>()
        const keyPairFactory = () =>
          new KeyPair(Uint8Array.from([10]), Uint8Array.from([100]))
        const sut = new KeyPairProvider(
          publicKeyStorage,
          privateKeyStorage,
          keyPairFactory,
        )

        const organizationId = 'org1'
        const publicKey = Uint8Array.from([1, 2, 3])
        const privateKey = Uint8Array.from([4, 5, 6])

        publicKeyStorage.getKey(organizationId).resolves(publicKey)
        privateKeyStorage.getKey(organizationId).resolves(privateKey)

        // Act
        const expected = publicKey
        const actual = await sut.getPublicKey(organizationId)

        // Assert
        expect(actual).equal(expected)
        publicKeyStorage.didNotReceive().saveKey(Arg.all())
        privateKeyStorage.didNotReceive().saveKey(Arg.all())
      })
    })

    context('0 key pairs exist in storage', () => {
      it('returns new public key', async () => {
        // Arrange
        const publicKeyStorage = Substitute.for<IKeyStorage>()
        const privateKeyStorage = Substitute.for<IKeyStorage>()
        const publicKey = Uint8Array.from([1, 2, 3])
        const privateKey = Uint8Array.from([4, 5, 6])
        const keyPairFactory = () => new KeyPair(publicKey, privateKey)
        const sut = new KeyPairProvider(
          publicKeyStorage,
          privateKeyStorage,
          keyPairFactory,
        )

        const organizationId = 'org1'

        publicKeyStorage.getKey(organizationId).resolves(undefined)
        privateKeyStorage.getKey(organizationId).resolves(undefined)

        // Act
        const expected = publicKey
        const actual = await sut.getPublicKey(organizationId)

        // Assert
        expect(actual).equal(expected)
        publicKeyStorage.received(1).saveKey(organizationId, publicKey)
        privateKeyStorage.received(1).saveKey(organizationId, privateKey)
      })
    })

    context(
      'matching public key exists in storage, but matching private key does not',
      () => {
        it('returns new public key', async () => {
          // Arrange
          const publicKeyStorage = Substitute.for<IKeyStorage>()
          const privateKeyStorage = Substitute.for<IKeyStorage>()
          const storedPublicKey = Uint8Array.from([7, 8, 9])
          const newPublicKey = Uint8Array.from([1, 2, 3])
          const newPrivateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(newPublicKey, newPrivateKey)
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const organizationId = 'org1'

          publicKeyStorage.getKey(organizationId).resolves(storedPublicKey)
          privateKeyStorage.getKey(organizationId).resolves(undefined)

          // Act
          const expected = newPublicKey
          const actual = await sut.getPublicKey(organizationId)

          // Assert
          expect(actual).equal(expected)
          publicKeyStorage.received(1).saveKey(organizationId, newPublicKey)
          privateKeyStorage.received(1).saveKey(organizationId, newPrivateKey)
        })
      },
    )

    context(
      'matching private key exists in storage, but matching public key does not',
      () => {
        it('returns new public key', async () => {
          // Arrange
          const publicKeyStorage = Substitute.for<IKeyStorage>()
          const privateKeyStorage = Substitute.for<IKeyStorage>()
          const storedPrivateKey = Uint8Array.from([7, 8, 9])
          const newPublicKey = Uint8Array.from([1, 2, 3])
          const newPrivateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(newPublicKey, newPrivateKey)
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const organizationId = 'org1'

          publicKeyStorage.getKey(organizationId).resolves(undefined)
          privateKeyStorage.getKey(organizationId).resolves(storedPrivateKey)

          // Act
          const expected = newPublicKey
          const actual = await sut.getPublicKey(organizationId)

          // Assert
          expect(actual).equal(expected)
          publicKeyStorage.received(1).saveKey(organizationId, newPublicKey)
          privateKeyStorage.received(1).saveKey(organizationId, newPrivateKey)
        })
      },
    )

    context(
      '0 key pairs exist in storage; publicKeyStorage.saveKey throws an unhelpful error',
      () => {
        it('throws a public key storage error', async () => {
          // Arrange
          const publicKeyStorage = Substitute.for<IKeyStorage>()
          const privateKeyStorage = Substitute.for<IKeyStorage>()
          const publicKey = Uint8Array.from([1, 2, 3])
          const privateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(publicKey, privateKey)
          const awsError = 'some AWS error'
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const organizationId = 'org1'
          publicKeyStorage.saveKey(organizationId, publicKey).rejects(awsError)

          publicKeyStorage.getKey(organizationId).resolves(undefined)
          privateKeyStorage.getKey(organizationId).resolves(undefined)

          // Act
          const fn = () => sut.getPublicKey(organizationId)

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.publicKeySaveFailed(awsError),
          )
          publicKeyStorage.received(1).saveKey(organizationId, publicKey)
          privateKeyStorage.didNotReceive().saveKey(Arg.all())
        })
      },
    )

    context(
      '0 key pairs exist in storage; privateKeyStorage.saveKey throws an unhelpful error',
      () => {
        it('throws a private key storage error', async () => {
          // Arrange
          const publicKeyStorage = Substitute.for<IKeyStorage>()
          const privateKeyStorage = Substitute.for<IKeyStorage>()
          const publicKey = Uint8Array.from([1, 2, 3])
          const privateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(publicKey, privateKey)
          const awsError = 'some AWS error'
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const organizationId = 'org1'
          privateKeyStorage
            .saveKey(organizationId, privateKey)
            .rejects(awsError)

          publicKeyStorage.getKey(organizationId).resolves(undefined)
          privateKeyStorage.getKey(organizationId).resolves(undefined)

          // Act
          const fn = () => sut.getPublicKey(organizationId)

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.privateKeySaveFailed(awsError),
          )
          publicKeyStorage.received(1).saveKey(organizationId, publicKey)
          privateKeyStorage.received(1).saveKey(organizationId, privateKey)
        })
      },
    )
  })
})
