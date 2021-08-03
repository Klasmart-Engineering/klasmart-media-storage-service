export default interface IDecryptionProvider {
  decrypt(
    publicKey: Uint8Array,
    privateKey: Uint8Array,
    messageWithNonce: string,
  ): Uint8Array
}
