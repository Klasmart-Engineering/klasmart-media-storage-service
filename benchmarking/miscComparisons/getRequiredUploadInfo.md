# getRequiredUploadInfo: 2022/04/05

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

_NOTE: despite the slightly better numbers, this query doesn't use caching_

| category      | requests/sec | latency | throughput |
| ------------- | ------------ | ------- | ---------- |
| baseConfig    | 932.64       | 10.21   | 694760.73  |
| apolloExpress | 609.3        | 15.9    | 494796.8   |
| logging       | 872.9        | 10.95   | 650291.2   |
| noCaching     | 887.9        | 10.75   | 661452.81  |