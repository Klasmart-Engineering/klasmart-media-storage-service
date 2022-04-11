import { expect } from 'chai'
import { box } from 'tweetnacl'
import ErrorMessage from '../../../src/helpers/errorMessages'
import { decrypt, encrypt } from '../../../src/helpers/tweetnaclUtil'

describe('tweetnaclUtil', () => {
  describe('decrypt', () => {
    context('non-shared key is passed as argument', () => {
      it('throws a decryption error', async () => {
        // Arrange
        const keyPairA = box.keyPair()
        const keyPairB = box.keyPair()
        const sharedKey = box.before(keyPairB.publicKey, keyPairA.secretKey)
        const encryptedMessage = encrypt(sharedKey, Uint8Array.from([1, 2, 3]))

        // Act
        const fn = () => decrypt(keyPairA.secretKey, encryptedMessage)

        // Assert
        expect(fn).to.throw(ErrorMessage.decryptionFailed)
      })
    })
  })
})
