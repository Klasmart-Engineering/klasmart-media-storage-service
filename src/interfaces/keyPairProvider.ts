export interface IKeyPairProvider {
  getPublicKeyOrCreatePair(objectKey: string): Promise<string>
  getPrivateKeyOrThrow(objectKey: string): Promise<Uint8Array>
}
