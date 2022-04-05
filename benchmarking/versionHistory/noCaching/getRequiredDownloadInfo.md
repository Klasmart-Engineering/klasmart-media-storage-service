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
| v0.1.20 | 264.46       | 37.25   | 202560     |