import IKeyStorage from '../interfaces/keyStorage'
import ErrorMessage from '../helpers/errorMessages'
import KeyPair from '../helpers/keyPair'
import throwExpression from '../helpers/throwExpression'
import IKeyPairProvider from '../interfaces/keyPairProvider'
import { ApplicationError } from '../errors/applicationError'

export default class KeyPairProvider implements IKeyPairProvider {
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
    const getTasks = [
      this.publicKeyStorage.getKey(objectKey),
      this.privateKeyStorage.getKey(objectKey),
    ]
    const result = await Promise.allSettled(getTasks)
    let publicKey: Uint8Array | undefined
    if (result[0].status === 'fulfilled') {
      publicKey = result[0].value
    } else {
      throw new ApplicationError(
        ErrorMessage.publicKeyGetFailed,
        result[0].reason,
      )
    }
    let privateKey: Uint8Array | undefined
    if (result[1].status === 'fulfilled') {
      privateKey = result[1].value
    } else {
      throw new ApplicationError(
        ErrorMessage.privateKeyGetFailed,
        result[1].reason,
      )
    }

    if (!publicKey || !privateKey) {
      const keyPair = this.keyPairFactory()
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
      const saveTasks = [
        this.publicKeyStorage.saveKey(objectKey, publicKey),
        this.privateKeyStorage.saveKey(objectKey, privateKey),
      ]
      const result = await Promise.allSettled(saveTasks)
      if (result[0].status === 'rejected') {
        throw new ApplicationError(
          ErrorMessage.publicKeySaveFailed,
          result[0].reason,
        )
      }
      if (result[1].status === 'rejected') {
        throw new ApplicationError(
          ErrorMessage.privateKeySaveFailed,
          result[1].reason,
        )
      }
    }

    return { publicKey, privateKey }
  }
}
