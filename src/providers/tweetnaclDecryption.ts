import { box } from 'tweetnacl'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import { decrypt } from '../helpers/tweetnaclUtil'

export default class TweetnaclDecryption implements IDecryptionProvider {
  public decrypt(
    publicKey: Uint8Array,
    privateKey: Uint8Array,
    messageWithNonce: string,
  ): Uint8Array {
    const sharedKey = box.before(publicKey, privateKey)
    const decrypted = decrypt(sharedKey, messageWithNonce)
    return decrypted
  }
}
