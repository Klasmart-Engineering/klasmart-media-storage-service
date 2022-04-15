# getRequiredUploadInfo: baseConfig

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
| v0.1.24 | 842.46       | 11.36   | 627642.19  |
| v0.1.23 | 825.82       | 11.6    | 615214.55  |
| v0.1.22 | 993.5        | 9.55    | 740096     |
| v0.1.21 | 827.4        | 11.57   | 616435.2   |
| v0.1.20 | 932.64       | 10.21   | 694760.73  |