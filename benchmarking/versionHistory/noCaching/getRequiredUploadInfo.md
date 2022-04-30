# getRequiredUploadInfo: noCaching

```gql
query getRequiredUploadInfo(
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!,
    $userId: String) {
  getRequiredUploadInfo(
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
    description: $description
    userId: $userId
  ) {
    mediaId
    presignedUrl
  }
}
```

| version | requests/sec | latency | throughput |
| ------- | ------------ | ------- | ---------- |
| v0.1.27 | 606.6        | 15.96   | 451916.8   |
| v0.1.26 | 631.37       | 15.31   | 470376.73  |
| v0.1.25 | 689.73       | 13.98   | 513757.1   |
| v0.1.24 | 721          | 13.36   | 537053.1   |
| v0.1.23 | 711.1        | 13.53   | 529803.64  |
| v0.1.22 | 768.3        | 12.5    | 572396.81  |
| v0.1.21 | 592.46       | 16.36   | 441378.91  |
| v0.1.20 | 887.9        | 10.75   | 661452.81  |