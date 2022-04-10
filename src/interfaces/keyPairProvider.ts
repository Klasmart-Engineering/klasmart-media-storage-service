export interface IKeyPairProvider {
  /**
   * Returns the base64 encoded public key corresponding to the provided object key.
   * @description Creates a new key pair if the public and/or
   *     private key doesn't exist, and saves them for future use.
   * @throws If there's an issue saving or retriving the public and/or private key from storage.
   */
  getPublicKeyOrCreatePair(objectKey: string): Promise<string>

  /**
   * Returns the private key corresponding to the provided object key.
   * @throws If there's an issue retrieving the private key from storage
   *     OR if the private key doesn't exist.
   */
  getPrivateKeyOrThrow(objectKey: string): Promise<Uint8Array>
}
