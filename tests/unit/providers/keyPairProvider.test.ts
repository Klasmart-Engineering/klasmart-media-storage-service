import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import IKeyStorage from '../../../src/interfaces/keyStorage'
import KeyPairProvider from '../../../src/providers/keyPairProvider'
import KeyPair from '../../../src/helpers/keyPair'
import ErrorMessage from '../../../src/helpers/errorMessages'

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

        const objectKey = 'room1'
        const publicKey = Buffer.from([1, 2, 3])
        const base64PublicKey = publicKey.toString('base64')
        const privateKey = Uint8Array.from([4, 5, 6])

        publicKeyStorage.getKey(objectKey).resolves(publicKey)
        privateKeyStorage.getKey(objectKey).resolves(privateKey)

        // Act
        const expected = base64PublicKey
        const actual = await sut.getPublicKeyOrCreatePair(objectKey)

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
        const publicKey = Buffer.from([1, 2, 3])
        const base64PublicKey = publicKey.toString('base64')
        const privateKey = Uint8Array.from([4, 5, 6])
        const keyPairFactory = () => new KeyPair(publicKey, privateKey)
        const sut = new KeyPairProvider(
          publicKeyStorage,
          privateKeyStorage,
          keyPairFactory,
        )

        const objectKey = 'room1'

        publicKeyStorage.getKey(objectKey).resolves(undefined)
        privateKeyStorage.getKey(objectKey).resolves(undefined)

        // Act
        const expected = base64PublicKey
        const actual = await sut.getPublicKeyOrCreatePair(objectKey)

        // Assert
        expect(actual).equal(expected)
        publicKeyStorage.received(1).saveKey(objectKey, publicKey)
        privateKeyStorage.received(1).saveKey(objectKey, privateKey)
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
          const newPublicKey = Buffer.from([1, 2, 3])
          const base64NewPublicKey = newPublicKey.toString('base64')
          const newPrivateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(newPublicKey, newPrivateKey)
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const objectKey = 'room1'

          publicKeyStorage.getKey(objectKey).resolves(storedPublicKey)
          privateKeyStorage.getKey(objectKey).resolves(undefined)

          // Act
          const expected = base64NewPublicKey
          const actual = await sut.getPublicKeyOrCreatePair(objectKey)

          // Assert
          expect(actual).equal(expected)
          publicKeyStorage.received(1).saveKey(objectKey, newPublicKey)
          privateKeyStorage.received(1).saveKey(objectKey, newPrivateKey)
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
          const newPublicKey = Buffer.from([1, 2, 3])
          const base64NewPublicKey = newPublicKey.toString('base64')
          const newPrivateKey = Uint8Array.from([4, 5, 6])
          const keyPairFactory = () => new KeyPair(newPublicKey, newPrivateKey)
          const sut = new KeyPairProvider(
            publicKeyStorage,
            privateKeyStorage,
            keyPairFactory,
          )

          const objectKey = 'room1'

          publicKeyStorage.getKey(objectKey).resolves(undefined)
          privateKeyStorage.getKey(objectKey).resolves(storedPrivateKey)

          // Act
          const expected = base64NewPublicKey
          const actual = await sut.getPublicKeyOrCreatePair(objectKey)

          // Assert
          expect(actual).equal(expected)
          publicKeyStorage.received(1).saveKey(objectKey, newPublicKey)
          privateKeyStorage.received(1).saveKey(objectKey, newPrivateKey)
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

          const objectKey = 'room1'
          publicKeyStorage.saveKey(objectKey, publicKey).rejects(awsError)

          publicKeyStorage.getKey(objectKey).resolves(undefined)
          privateKeyStorage.getKey(objectKey).resolves(undefined)

          // Act
          const fn = () => sut.getPublicKeyOrCreatePair(objectKey)

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.publicKeySaveFailed,
          )
          publicKeyStorage.received(1).saveKey(objectKey, publicKey)
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

          const objectKey = 'room1'
          privateKeyStorage.saveKey(objectKey, privateKey).rejects(awsError)

          publicKeyStorage.getKey(objectKey).resolves(undefined)
          privateKeyStorage.getKey(objectKey).resolves(undefined)

          // Act
          const fn = () => sut.getPublicKeyOrCreatePair(objectKey)

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.privateKeySaveFailed,
          )
          publicKeyStorage.received(1).saveKey(objectKey, publicKey)
          privateKeyStorage.received(1).saveKey(objectKey, privateKey)
        })
      },
    )
  })
})
