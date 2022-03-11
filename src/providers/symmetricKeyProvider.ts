import { KeyPairProvider } from './keyPairProvider'
import IDecryptionProvider from '../interfaces/decryptionProvider'

export default class SymmetricKeyProvider {
  constructor(
    private readonly keyPairProvider: KeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
  ) {}

  public async getBase64SymmetricKey(
    roomId: string,
    userPublicKey: Uint8Array,
    base64EncryptedSymmetricKey: string,
  ): Promise<string> {
    const serverPrivateKey = await this.keyPairProvider.getPrivateKey(roomId)
    const symmetricKey = this.decryptionProvider.decrypt(
      userPublicKey,
      serverPrivateKey,
      base64EncryptedSymmetricKey,
    )
    const base64SymmetricKey = Buffer.from(symmetricKey).toString('base64')
    return base64SymmetricKey
  }
}
