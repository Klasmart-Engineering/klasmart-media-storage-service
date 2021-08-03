import { getRepository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import IAudioFileStorage from '../interfaces/audioFileStorage'
import IKeyStorage from '../interfaces/keyStorage'
import IUploadUrlProvider from '../interfaces/uploadUrlProvider'
import { AudioResolver } from '../resolvers/audioResolver'
import { KeyPairProvider } from './keyPairProvider'
import { AudioFileRetriever } from './audioFileRetriever'
import { S3KeyStorage } from './s3KeyStorage'
import { S3UploadUrlProvider } from './s3UploadUrlProvider'
import { S3AudioFileStorage } from './s3AudioFileStorage'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import TweetnaclDecryption from './tweetnaclDecryption'
import { Config } from './config'
import { box } from 'tweetnacl'
import { KeyPair } from './keyPair'

export class CompositionRoot {
  public constructAudioResolver(): AudioResolver {
    return new AudioResolver(
      getRepository(AudioMetadata),
      this.getKeyPairProvider(),
      this.getAudioFileRetriver(),
      this.getUploadUrlProvider(),
    )
  }

  private getKeyPairProvider(): KeyPairProvider {
    return new KeyPairProvider(
      this.getPublicKeyStorage(),
      this.getPrivateKeyStorage(),
      this.getKeyPairFactory(),
    )
  }

  private getUploadUrlProvider(): IUploadUrlProvider {
    return new S3UploadUrlProvider(
      Config.getAudioFileBucket(),
      Config.getS3Client(),
    )
  }

  private getAudioFileRetriver(): AudioFileRetriever {
    return new AudioFileRetriever(
      this.getAudioFileStorage(),
      this.getDecryptionProvider(),
    )
  }

  private getAudioFileStorage(): IAudioFileStorage {
    return new S3AudioFileStorage(
      Config.getAudioFileBucket(),
      Config.getS3Client(),
    )
  }

  private getDecryptionProvider(): IDecryptionProvider {
    return new TweetnaclDecryption()
  }

  private getPublicKeyStorage(): IKeyStorage {
    return new S3KeyStorage(Config.getPublicKeyBucket(), Config.getS3Client())
  }

  private getPrivateKeyStorage(): IKeyStorage {
    return new S3KeyStorage(Config.getPrivateKeyBucket(), Config.getS3Client())
  }

  private getKeyPairFactory(): () => KeyPair {
    return () => {
      const boxKeyPair = box.keyPair()
      return new KeyPair(boxKeyPair.publicKey, boxKeyPair.secretKey)
    }
  }
}
