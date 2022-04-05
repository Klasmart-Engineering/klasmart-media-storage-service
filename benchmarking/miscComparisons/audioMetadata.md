# audioMetadata: 2022/04/05

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

_NOTE: no caching logic for this query yet_

| category      | requests/sec | latency | throughput |
| ------------- | ------------ | ------- | ---------- |
| baseConfig    | 1494.6       | 6.2     | 819097.6   |
| apolloExpress | 776.55       | 12.36   | 477579.64  |
| logging       | 1251.19      | 7.49    | 685637.82  |
| noCaching     | 1422.6       | 6.53    | 779571.2   |