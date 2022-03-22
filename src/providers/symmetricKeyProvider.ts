import IDecryptionProvider from '../interfaces/decryptionProvider'
import { IKeyPairProvider } from '../interfaces/keyPairProvider'

export default class SymmetricKeyProvider {
  constructor(
    private readonly keyPairProvider: IKeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
  ) {}

  public async getBase64SymmetricKey(
    roomId: string,
    base64UserPublicKey: string,
    base64EncryptedSymmetricKey: string,
  ): Promise<string> {
    const serverPrivateKey = await this.keyPairProvider.getPrivateKeyOrThrow(
      roomId,
    )
    const userPublicKey = Buffer.from(base64UserPublicKey, 'base64')
    const symmetricKey = this.decryptionProvider.decrypt(
      userPublicKey,
      serverPrivateKey,
      base64EncryptedSymmetricKey,
    )
    const base64SymmetricKey = Buffer.from(symmetricKey).toString('base64')
    return base64SymmetricKey
  }
}
