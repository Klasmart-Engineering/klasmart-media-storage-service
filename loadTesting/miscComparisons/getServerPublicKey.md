# getServerPublicKey: 2022/04/05

```gql
query getServerPublicKey {
  getServerPublicKey
}
```

_NOTE: return value is a string so caching is really effective here_

| category      | requests/sec | latency | throughput |
| ------------- | ------------ | ------- | ---------- |
| baseConfig    | 2955.55      | 2.83    | 942661.82  |
| apolloExpress | 1384.64      | 6.69    | 533050.19  |
| logging       | 2986.28      | 2.71    | 952529.46  |
| noCaching     | 688          | 14.02   | 219467.64  |