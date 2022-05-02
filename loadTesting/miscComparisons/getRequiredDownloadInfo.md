# getRequiredDownloadInfo: 2022/04/05

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

_NOTE: only caches part of the result; not the whole thing_

| category      | requests/sec | latency | throughput |
| ------------- | ------------ | ------- | ---------- |
| baseConfig    | 341          | 28.78   | 261213.1   |
| apolloExpress | 284.61       | 34.58   | 237056     |
| logging       | 321.46       | 30.54   | 246208     |
| noCaching     | 264.46       | 37.25   | 202560     |