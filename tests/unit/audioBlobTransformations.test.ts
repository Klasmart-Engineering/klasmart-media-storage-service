import { expect } from 'chai'
import { box } from 'tweetnacl'
import fs from 'fs'
import { decrypt, encrypt } from '../../src/helpers/tweetnaclUtil'
import path from 'path'

describe('audio blob transformations', () => {
  context('valid audio blob is provided', () => {
    it('output buffer deep equals the original', async () => {
      const orgKeyPair = box.keyPair()
      const userKeyPair = box.keyPair()

      const b64PublicKey = Buffer.from(userKeyPair.publicKey).toString('base64')
      const decodedPublicKey = Buffer.from(b64PublicKey, 'base64')
      expect(decodedPublicKey).to.deep.equal(userKeyPair.publicKey)

      const audioBlob = fs.readFileSync(path.join(__dirname, '../audioBlob'))
      const userSharedKey = box.before(
        orgKeyPair.publicKey,
        userKeyPair.secretKey,
      )
      const encrypted = encrypt(userSharedKey, audioBlob)
      const orgSharedKey = box.before(decodedPublicKey, orgKeyPair.secretKey)
      const decrypted = decrypt(orgSharedKey, encrypted)
      const b64 = Buffer.from(decrypted).toString('base64')
      const decoded = Buffer.from(b64, 'base64')

      // Uncomment the following statement if you want to listen to the output, as a sanity check.
      // fs.writeFileSync(
      //   path.join(__dirname, '../decryptedAudioBlob2.webm'),
      //   decoded,
      // )

      // Assert
      expect(decoded).to.deep.equal(audioBlob)
    })
  })

  context('blob test', () => {
    it('blob test', async () => {
      // Arrange
      const userPublicKey = Buffer.from(
        'BAPo6vS0OTVMTZyqCLbuHyiBXt8L++u2ERmxtO9zbj0=',
        'base64',
      )
      const encryptedSymmetricKey =
        'zuVWG9RmB+jnpgFxvDd7ICYGakxrur9BLFScVuPPdufw28MRKlMQgC97vmQ/t4u9zvd+JM3k4G+9PMhXH/uBYM77+w+90SiJ'
      const audioBlob = fs.readFileSync(path.join(__dirname, '../audioBlob2'))
      const orgPrivateKey = fs.readFileSync(
        path.join(__dirname, '../audioBlob2OrgPrivateKey'),
      )
      const orgSharedKey = box.before(userPublicKey, orgPrivateKey)
      const symmetricKey = decrypt(orgSharedKey, encryptedSymmetricKey)
      const decryptedAudio = decrypt(symmetricKey, audioBlob.toString())

      // Uncomment the following statement if you want to listen to the output, as a sanity check.
      // fs.writeFileSync(
      //   path.join(__dirname, '../decryptedAudioBlob2.webm'),
      //   decryptedAudio,
      // )
    })
  })
})
