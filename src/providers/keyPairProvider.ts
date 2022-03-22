import IKeyStorage from '../interfaces/keyStorage'
import { ErrorMessage } from '../helpers/errorMessages'
import { KeyPair } from '../helpers/keyPair'
import { throwExpression } from '../helpers/throwExpression'
import { IKeyPairProvider } from '../interfaces/keyPairProvider'

export class KeyPairProvider implements IKeyPairProvider {
  public constructor(
    private readonly publicKeyStorage: IKeyStorage,
    private readonly privateKeyStorage: IKeyStorage,
    private readonly keyPairFactory: () => KeyPair,
  ) {}

  public async getPublicKeyOrCreatePair(objectKey: string): Promise<string> {
    const keyPair = await this.getKeyPair(objectKey)
    const base64PublicKey = Buffer.from(keyPair.publicKey).toString('base64')
    return base64PublicKey
  }

  public async getPrivateKeyOrThrow(objectKey: string): Promise<Uint8Array> {
    const privateKey = await this.privateKeyStorage.getKey(objectKey)
    return (
      privateKey ??
      throwExpression(`Server private key doesn't exist: ${objectKey}`)
    )
  }

  private async getKeyPair(objectKey: string): Promise<KeyPair> {
    let publicKey = await this.publicKeyStorage.getKey(objectKey)
    let privateKey = await this.privateKeyStorage.getKey(objectKey)
    if (!publicKey || !privateKey) {
      const keyPair = this.keyPairFactory()
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
      // TODO: Consider using Promise.allSettled
      try {
        await this.publicKeyStorage.saveKey(objectKey, publicKey)
      } catch (e) {
        throw new Error(ErrorMessage.publicKeySaveFailed(e))
      }
      try {
        await this.privateKeyStorage.saveKey(objectKey, privateKey)
      } catch (e) {
        throw new Error(ErrorMessage.privateKeySaveFailed(e))
      }
    }

    return { publicKey, privateKey }
  }
}
