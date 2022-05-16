import AppConfig from '../../src/config/config'

export default class TestAppConfig extends AppConfig {
  private _corsDomain?: string
  get corsDomain(): string {
    return this._corsDomain ?? super.corsDomain
  }
  withCorsDomain(value: string) {
    this._corsDomain = value
    return this
  }

  private _metadataDatabaseUrl?: string
  get metadataDatabaseUrl(): string {
    return this._metadataDatabaseUrl ?? super.metadataDatabaseUrl
  }
  withMetadataDatabaseUrl(value: string) {
    this._metadataDatabaseUrl = value
    return this
  }

  private _publicKeyBucket?: string
  get publicKeyBucket(): string {
    return this._publicKeyBucket ?? super.publicKeyBucket
  }
  withPublicKeyBucket(value: string) {
    this._publicKeyBucket = value
    return this
  }

  private _privateKeyBucket?: string
  get privateKeyBucket(): string {
    return this._privateKeyBucket ?? super.privateKeyBucket
  }
  withPrivateKeyBucket(value: string) {
    this._privateKeyBucket = value
    return this
  }

  private _mediaFileBucket?: string
  get mediaFileBucket(): string {
    return this._mediaFileBucket ?? super.mediaFileBucket
  }
  withMediaFileBucket(value: string) {
    this._mediaFileBucket = value
    return this
  }

  private _useMockWebApis?: boolean
  get useMockWebApis(): boolean {
    return this._useMockWebApis ?? super.useMockWebApis
  }
  withUseMockWebApis(value: boolean) {
    this._useMockWebApis = value
    return this
  }

  private _cmsApiUrl?: string
  get cmsApiUrl(): string {
    return this._cmsApiUrl ?? super.cmsApiUrl
  }
  withCmsApiUrl(value: string) {
    this._cmsApiUrl = value
    return this
  }

  private _userServiceEndpoint?: string
  get userServiceEndpoint(): string {
    return this._userServiceEndpoint ?? super.userServiceEndpoint
  }
  withUserServiceEndpoint(value: string) {
    this._userServiceEndpoint = value
    return this
  }

  private _fileValidationDelayMs?: number
  get fileValidationDelayMs(): number {
    return this._fileValidationDelayMs ?? super.fileValidationDelayMs
  }
  withFileValidationDelayMs(value: number) {
    this._fileValidationDelayMs = value
    return this
  }

  private _statsLogConfig?: { offset: number; period: number }
  get statsLogConfig(): { offset: number; period: number } {
    return this._statsLogConfig ?? super.statsLogConfig
  }
  withStatsLogConfig(value: { offset: number; period: number }) {
    this._statsLogConfig = value
    return this
  }

  private _cache?: 'redis' | 'memory'
  private _cacheOverwritten = false
  get cache(): 'redis' | 'memory' | undefined {
    if (this._cacheOverwritten) {
      return this._cache
    }
    return super.cache
  }
  withCache(value: 'redis' | 'memory' | undefined) {
    this._cacheOverwritten = true
    this._cache = value
    return this
  }

  private _redisHost?: string
  private _redisHostOverwritten = false
  get redisHost(): string | undefined {
    if (this._redisHostOverwritten) {
      return this._redisHost
    }
    return super.redisHost
  }
  withRedisHost(value: string | undefined) {
    this._cacheOverwritten = true
    this._redisHost = value
    return this
  }

  private _redisPort?: number
  get redisPort(): number {
    return this._redisPort ?? super.redisPort
  }
  withRedisPort(value: number) {
    this._redisPort = value
    return this
  }

  private _cdnUrl?: URL
  private _cdnUrlOverwritten = false
  get cdnUrl(): URL | undefined {
    if (this._cdnUrlOverwritten) {
      return this._cdnUrl
    }
    return super.cdnUrl
  }
  withCdnUrl(value: URL | undefined) {
    this._cdnUrlOverwritten = true
    this._cdnUrl = value
    return this
  }
}
