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
| v0.1.27 | 183.1        | 53.97   | 140435.21  |
| v0.1.26 | 221.4        | 44.56   | 169843.2   |
| v0.1.25 | 220.46       | 44.75   | 169117.1   |
| v0.1.24 | 233.7        | 42.22   | 179289.6   |
| v0.1.23 | 239.4        | 41.16   | 183411.2   |
| v0.1.22 | 226          | 43.67   | 173132.8   |
| v0.1.21 | 241.9        | 40.73   | 185305.6   |
| v0.1.20 | 264.46       | 37.25   | 202560     |