import { verify, decode, VerifyOptions, Secret, JwtPayload } from 'jsonwebtoken'

export interface KidsloopAuthenticationToken {
  id?: string
  email: string

  // Standard JWT properties
  iat?: number
  exp: number
  iss: string
}

type Issuer = {
  options: VerifyOptions
  secretOrPublicKey: Secret
}

const issuers = new Map<string, Issuer>([
  [
    'kidsloop',
    {
      options: {
        issuer: 'kidsloop',
        algorithms: ['RS256', 'RS384', 'RS512'],
      },
      secretOrPublicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxdHMYTqFobj3oGD/JDYb
DN07icTH/Dj7jBtJSG2clM6hQ1HRLApQUNoqcrcJzA0A7aNqELIJuxMovYAoRtAT
E1pYMWpVyG41inQiJjKFyAkuHsVzL+t2C778BFxlXTC/VWoR6CowWSWJaYlT5fA/
krUew7/+sGW6rjV2lQqxBN3sQsfaDOdN5IGkizsfMpdrETbc5tKksNs6nL6SFRDe
LoS4AH5KI4T0/HC53iLDjgBoka7tJuu3YsOBzxDX22FbYfTFV7MmPyq++8ANbzTL
sgaD2lwWhfWO51cWJnFIPc7gHBq9kMqMK3T2dw0jCHpA4vYEMjsErNSWKjaxF8O/
FwIDAQAB
-----END PUBLIC KEY-----`,
    },
  ],
])

if (process.env.NODE_ENV !== 'production') {
  console.log("WARNING: NODE_ENV is not set to 'production'")
  const issuer = 'calmid-debug'
  const secretOrPublicKey =
    process.env.DEV_JWT_SECRET || 'iXtZx1D5AqEB0B9pfn+hRQ=='
  console.log(
    `Accepting JWTs issued by '${issuer}', signed with symetric secret '${secretOrPublicKey}'`,
  )

  issuers.set(issuer, {
    options: {
      issuer,
      algorithms: ['HS512', 'HS384', 'HS256'],
    },
    secretOrPublicKey,
  })
}

export async function checkToken(
  token?: string,
): Promise<KidsloopAuthenticationToken> {
  if (!token) {
    throw new Error('No token provided')
  }
  const payload = decode(token)
  if (!payload || typeof payload === 'string') {
    throw new Error('Invalid token type')
  }
  const issuer = payload.iss
  if (!issuer || typeof issuer !== 'string') {
    throw new Error('Token must specify issuer')
  }
  const issuerOptions = issuers.get(issuer)
  if (!issuerOptions) {
    throw new Error('Token has unknown issuer')
  }
  const { options, secretOrPublicKey } = issuerOptions
  const verifiedToken = await new Promise<KidsloopAuthenticationToken>(
    (resolve, reject) => {
      verify(token, secretOrPublicKey, options, (err, decoded) => {
        if (err) {
          reject(err)
        }
        if (decoded) {
          const typeSafeToken = checkTypes(decoded)
          resolve(typeSafeToken)
        }
        reject(new Error('Unexpected authorization error'))
      })
    },
  )
  return verifiedToken
}

function checkTypes(token: JwtPayload): KidsloopAuthenticationToken {
  const id = token.id
  if (!(typeof id === 'string' || typeof id === 'undefined')) {
    throw new Error(
      `Malformed token: id must be a string or undefined but was '${typeof id}'`,
    )
  }

  const email = token.email
  if (typeof email !== 'string') {
    throw new Error(
      `Malformed token: email must be be a string but was '${typeof email}'`,
    )
  }

  const iat = token.iat
  if (!(typeof iat === 'number' || typeof iat === 'undefined')) {
    throw new Error(
      `Malformed token: iat must be be a number or undefined but was '${typeof iat}'`,
    )
  }

  const exp = token.exp
  if (typeof exp !== 'number') {
    throw new Error(
      `Malformed token: exp must be be a number but was '${typeof exp}'`,
    )
  }

  const iss = token.iss
  if (typeof iss !== 'string') {
    throw new Error(
      `Malformed token: iss must be be a string but was '${typeof iss}'`,
    )
  }

  return {
    id,
    email,
    exp,
    iss,
    iat,
  }
}
