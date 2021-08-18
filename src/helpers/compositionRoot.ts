import { getRepository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import IKeyStorage from '../interfaces/keyStorage'
import IUploadUrlProvider from '../interfaces/presignedUrlProvider'
import { AudioResolver } from '../resolvers/audioResolver'
import { KeyPairProvider } from './keyPairProvider'
import { S3KeyStorage } from './s3KeyStorage'
import { S3PresignedUrlProvider } from './s3PresignedUrlProvider'
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
      this.getDecryptionProvider(),
      this.getPresignedUrlProvider(),
    )
  }

  private getKeyPairProvider(): KeyPairProvider {
    return new KeyPairProvider(
      this.getPublicKeyStorage(),
      this.getPrivateKeyStorage(),
      this.getKeyPairFactory(),
    )
  }

  private getPresignedUrlProvider(): IUploadUrlProvider {
    return new S3PresignedUrlProvider(
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
