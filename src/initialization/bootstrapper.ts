import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('Bootstrapper')

export class Bootstrapper {
  public run(): void {
    log.info('running bootstrapper...')
  }
}
