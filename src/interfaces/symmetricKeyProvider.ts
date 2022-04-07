export default interface ISymmetricKeyProvider {
  getBase64SymmetricKey(
    mediaId: string,
    roomId: string,
    base64UserPublicKey: string,
    base64EncryptedSymmetricKey: string,
  ): Promise<string>
}
