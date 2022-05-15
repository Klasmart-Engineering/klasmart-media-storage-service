export default interface IMediaStorageService {
  readonly server: unknown
  readonly path: string
  listen(port: number, callback: () => void): Promise<void>
  close(): Promise<void>
}
