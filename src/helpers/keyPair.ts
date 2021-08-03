export class KeyPair {
  public constructor(
    public readonly publicKey: Uint8Array,
    public readonly privateKey: Uint8Array,
  ) {}
}
