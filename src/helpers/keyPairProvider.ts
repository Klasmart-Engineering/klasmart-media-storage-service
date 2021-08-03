import IKeyStorage from '../interfaces/keyStorage'
import { KeyPair } from './keyPair'
import { ConsoleLogger, ILogger } from './logger'

export class KeyPairProvider {
  public constructor(
    private readonly publicKeyStorage: IKeyStorage,
    private readonly privateKeyStorage: IKeyStorage,
    private readonly keyPairFactory: () => KeyPair,
    private readonly logger: ILogger = new ConsoleLogger('KeyPairProvider'),
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
      await this.publicKeyStorage.saveKey(objectKey, publicKey)
      await this.privateKeyStorage.saveKey(objectKey, privateKey)
    }

    return { publicKey, privateKey }
  }
}
