import IAudioFileStorage from '../interfaces/audioFileStorage'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import { ConsoleLogger, ILogger } from './logger'

export class AudioFileRetriever {
  public constructor(
    private readonly audioFileStorage: IAudioFileStorage,
    private readonly decryptionProvider: IDecryptionProvider,
    private readonly logger: ILogger = new ConsoleLogger('AudioFileRetriever'),
  ) {}

  public async getBase64AudioFile(
    audioId: string,
    publicKey: Uint8Array,
    privateKey: Uint8Array,
  ): Promise<string> {
    const base64EncryptedAudioFile =
      await this.audioFileStorage.getBase64EncryptedAudioFile(audioId)
    const decrypted = this.decryptionProvider.decrypt(
      publicKey,
      privateKey,
      base64EncryptedAudioFile,
    )
    return Buffer.from(decrypted).toString('base64')
  }
}
