/* eslint-disable @typescript-eslint/no-namespace */

declare namespace NodeJS {
  export type ProcessEnv = {
    NODE_ENV?: string
    npm_package_version?: string
    SERVER_IMPL?: string
    PORT?: string
    ROUTE_PREFIX?: string
    DOMAIN?: string
    METADATA_DATABASE_URL?: string
    PUBLIC_KEY_BUCKET?: string
    PRIVATE_KEY_BUCKET?: string
    MEDIA_FILE_BUCKET?: string
    CMS_API_URL?: string
    USER_SERVICE_ENDPOINT?: string
    S3_BUCKET_ENDPOINT?: string
    REDIS_HOST?: string
    REDIS_PORT?: string
    DATABASE_LOGGING?: string
    MERCURIUS_LOG_LEVEL?: string
    CACHE?: string
    MOCK_WEB_APIS?: string
    LOG_LEVEL?: string
    CDN_URL?: string
    AWS_REGION?: string
    AWS_ACCESS_KEY_ID?: string
    AWS_SECRET_ACCESS_KEY?: string
  }
}
