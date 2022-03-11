import { expect } from 'chai'
import { getCorsOptions } from '../../../src/initialization/getCorsOptions'

describe('getCorsOptions', () => {
  context('origin matches defined DOMAIN; multiple subdomains', () => {
    it('error is null and origin result is true', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('https://hub.alpha.kidsloop.net', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.true
        })
      }
    })
  })

  context('origin matches defined DOMAIN; single subdomain', () => {
    it('error is null and origin result is true', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('https://hub.kidsloop.net', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.true
        })
      }
    })
  })

  context('origin matches defined DOMAIN; http', () => {
    it('error is null and origin result is true', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('http://kidsloop.net', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.true
        })
      }
    })
  })

  context('origin matches defined DOMAIN; port', () => {
    it('error is null and origin result is true', async () => {
      // Arrange
      const domain = 'localhost:8080'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('http://localhost:8080', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.true
        })
      }
    })
  })

  context('origin does not match defined DOMAIN', () => {
    it('error is null and origin result is false', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('http://kidsloopfake.net', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.false
        })
      }
    })
  })

  context('origin is undefined', () => {
    it('error is null and origin result is false', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin(undefined, (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.false
        })
      }
    })
  })

  context('origin is empty', () => {
    it('error is null and origin result is false', async () => {
      // Arrange
      const domain = 'kidsloop.net'

      // Act
      const corsOptions = getCorsOptions(domain)

      // Assert
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin('', (e, o) => {
          expect(e).to.be.null
          expect(o).to.be.false
        })
      }
    })
  })
})
