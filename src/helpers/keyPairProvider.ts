import IKeyStorage from '../interfaces/keyStorage'
import { KeyPair } from './keyPair'

export class KeyPairProvider {
  public constructor(
    private readonly publicKeyStorage: IKeyStorage,
    private readonly privateKeyStorage: IKeyStorage,
    private readonly keyPairFactory: () => KeyPair,
  ) {}

  public async getPublicKey(objectKey: string): Promise<Uint8Array> {
    const keyPair = await this.getKeyPair(objectKey)
    return keyPair.publicKey
  }

  public async getPrivateKey(objectKey: string): Promise<Uint8Array> {
    const keyPair = await this.getKeyPair(objectKey)
    return keyPair.privateKey
  }

  private async getKeyPair(objectKey: string): Promise<KeyPair> {
    let publicKey = await this.publicKeyStorage.getKey(objectKey)
    let privateKey = await this.privateKeyStorage.getKey(objectKey)
    if (!publicKey || !privateKey) {
      const keyPair = this.keyPairFactory()
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
      try {
        await this.publicKeyStorage.saveKey(objectKey, publicKey)
      } catch (e) {
        throw new Error(`Saving public key to S3 failed: ${e}`)
      }
      try {
        await this.privateKeyStorage.saveKey(objectKey, privateKey)
      } catch (e) {
        throw new Error(`Saving private key to S3 failed: ${e}`)
      }
    }

    return { publicKey, privateKey }
  }
}
