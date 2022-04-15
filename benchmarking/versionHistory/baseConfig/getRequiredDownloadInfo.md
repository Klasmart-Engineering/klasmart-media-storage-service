# getRequiredDownloadInfo: baseConfig

```gql
query getRequiredDownloadInfo($mediaId: String!, $roomId: String!) {
  getRequiredDownloadInfo(
    mediaId: $mediaId,
    roomId: $roomId,
  ) {
    base64SymmetricKey
    presignedUrl
  }
}
```

| version | requests/sec | latency | throughput |
| ------- | ------------ | ------- | ---------- |
| v0.1.24 | 4908.91      | 1.35    | 3765248    |
| v0.1.23 | 1638.28      | 5.81    | 1254912    |
| v0.1.22 | 1536.1       | 5.96    | 1176669.1  |
| v0.1.21 | 1535.46      | 6       | 1176064    |
| v0.1.20 | 341          | 28.78   | 261213.1   |