import { withLogger } from 'kidsloop-nodejs-logger'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import IKeyPairProvider from '../interfaces/keyPairProvider'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'

const logger = withLogger('SymmetricKeyProvider')

export default class SymmetricKeyProvider implements ISymmetricKeyProvider {
  constructor(
    private readonly keyPairProvider: IKeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
  ) {}

  public async getBase64SymmetricKey(
    mediaId: string,
    roomId: string,
    base64UserPublicKey: string,
    base64EncryptedSymmetricKey: string,
  ): Promise<string> {
    logger.silly(
      `[getBase64SymmetricKey] roomId: ${roomId}; mediaId: ${mediaId}`,
    )
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
