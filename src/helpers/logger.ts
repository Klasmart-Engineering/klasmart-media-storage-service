export interface ILogger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

export class ConsoleLogger implements ILogger {
  private readonly prefix: string

  constructor(key?: string) {
    this.prefix = key !== undefined ? `[${key}] ` : ''
  }

  public debug(message: string): void {
    this.log('debug', message)
  }
  public info(message: string): void {
    this.log('info', message)
  }
  public warn(message: string): void {
    this.log('warn', message)
  }
  public error(message: string): void {
    this.log('error', message)
  }

  private log(
    logLevel: 'debug' | 'info' | 'warn' | 'error',
    message: string,
  ): void {
    console[logLevel](`${this.prefix}${message}`)
  }
}
