import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import IKeyStorage from '../../src/interfaces/keyStorage'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { KeyPair } from '../../src/helpers/keyPair'

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
      })
    })
  })
})
