import { encrypt } from '../../src/helpers/tweetnaclUtil'
import { box } from 'tweetnacl'

export function getSampleEncryptedData() {
  const serverKeyPair = box.keyPair()
  const userKeyPair = box.keyPair()
  const base64UserPublicKey = Buffer.from(userKeyPair.publicKey).toString(
    'base64',
  )
  const userSharedKey = box.before(
    serverKeyPair.publicKey,
    userKeyPair.secretKey,
  )
  const symmetricKey = box.keyPair().secretKey
  const base64EncryptedSymmetricKey = encrypt(userSharedKey, symmetricKey)
  const base64SymmetricKey = Buffer.from(symmetricKey).toString('base64')

  return {
    serverPrivateKey: serverKeyPair.secretKey,
    userPublicKey: userKeyPair.publicKey,
    base64UserPublicKey,
    symmetricKey,
    base64SymmetricKey,
    base64EncryptedSymmetricKey,
  }
}
