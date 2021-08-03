export default interface IKeyStorage {
  getKey(objectKey: string): Promise<Uint8Array | undefined>
  saveKey(objectKey: string, key: Uint8Array): Promise<void>
}
