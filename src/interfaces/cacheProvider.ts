export default interface ICacheProvider {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<'OK' | null>
  delete(key: string): Promise<void>
}
