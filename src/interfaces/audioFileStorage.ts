export default interface IAudioFileStorage {
  getBase64EncryptedAudioFile(objectKey: string): Promise<string>
}
