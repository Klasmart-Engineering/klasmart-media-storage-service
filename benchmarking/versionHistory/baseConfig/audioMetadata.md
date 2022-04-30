# audioMetadata: baseConfig

```gql
  query audioMetadata(
    $userId: String!
    $roomId: String!
    $h5pId: String!
    $h5pSubId: String
  ) {
    audioMetadata(
      userId: $userId
      roomId: $roomId
      h5pId: $h5pId
      h5pSubId: $h5pSubId
    ) {
      id
      userId
      roomId
      h5pId
      h5pSubId
      createdAt
    }
  }
```

| version | requests/sec | latency | throughput |
| ------- | ------------ | ------- | ---------- |
| v0.1.27 | 3872.28      | 1.94    | 2121588.37 |
| v0.1.26 | 4691.1       | 1.45    | 2570286.55 |
| v0.1.25 | 4596         | 1.48    | 2518667.64 |
| v0.1.24 | 4877.64      | 1.49    | 2672965.82 |
| v0.1.23 | 5285.64      | 1.41    | 2896151.28 |
| v0.1.22 | 4030.82      | 1.97    | 2208837.82 |
| v0.1.21 | 3239.73      | 2.51    | 1775010.91 |
| v0.1.20 | 1494.6       | 6.2     | 819097.6   |