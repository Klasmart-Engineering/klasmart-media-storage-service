# getRequiredUploadInfo: noCaching

```gql
query getRequiredUploadInfo(
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!) {
  getRequiredUploadInfo(
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
    description: $description
  ) {
    mediaId
    presignedUrl
  }
}
```

| version | requests/sec | latency | throughput |
| ------- | ------------ | ------- | ---------- |
| v0.1.20 | 887.9        | 10.75   | 661452.81  |