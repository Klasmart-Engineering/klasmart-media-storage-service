# getRequiredDownloadInfo: noCaching

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
| v0.1.23 | 239.4        | 41.16   | 183411.2   |
| v0.1.22 | 226          | 43.67   | 173132.8   |
| v0.1.21 | 241.9        | 40.73   | 185305.6   |
| v0.1.20 | 264.46       | 37.25   | 202560     |