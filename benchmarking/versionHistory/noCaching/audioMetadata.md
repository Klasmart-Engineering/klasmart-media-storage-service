# audioMetadata: noCaching

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
| v0.1.25 | 949.1        | 10.02   | 520102.4   |
| v0.1.24 | 1039.1       | 9.12    | 569536     |
| v0.1.23 | 1098.1       | 8.59    | 601766.4   |
| v0.1.22 | 1306.73      | 7.15    | 716078.55  |
| v0.1.21 | 1164.91      | 8.07    | 638400     |
| v0.1.20 | 1422.6       | 6.53    | 779571.2   |