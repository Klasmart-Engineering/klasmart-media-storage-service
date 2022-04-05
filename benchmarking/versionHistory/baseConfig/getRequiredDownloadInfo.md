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
| v0.1.20 | 341          | 28.78   | 261213.1   |