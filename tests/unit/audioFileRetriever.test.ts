import { expect } from 'chai'
import { v4 } from 'uuid'
import { Substitute } from '@fluffy-spoon/substitute'
import { AudioFileRetriever } from '../../src/helpers/audioFileRetriever'
import IAudioFileStorage from '../../src/interfaces/audioFileStorage'
import IDecryptionProvider from '../../src/interfaces/decryptionProvider'

describe('AudioFileRetriever', () => {
  describe('getBase64AudioFile', () => {
    context('matching audio file exists; valid keys are provided', () => {
      it('returns Base64 encoded audio', async () => {
        // Arrange
        const audioFileStorage = Substitute.for<IAudioFileStorage>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const sut = new AudioFileRetriever(audioFileStorage, decryptionProvider)

        const audioId = v4()
        const publicKey = Buffer.from('abc')
        const privateKey = Buffer.from('xyz')
        const decryptedBlob = Uint8Array.from([1, 2, 3])
        const base64EncryptedBlob = '321'

        audioFileStorage
          .getBase64EncryptedAudioFile(audioId)
          .resolves(base64EncryptedBlob)
        decryptionProvider
          .decrypt(publicKey, privateKey, base64EncryptedBlob)
          .returns(decryptedBlob)

        // Act
        const expected = 'AQID'
        const actual = await sut.getBase64AudioFile(
          audioId,
          publicKey,
          privateKey,
        )

        // Assert
        expect(actual).equal(expected)
      })
    })
  })
})
