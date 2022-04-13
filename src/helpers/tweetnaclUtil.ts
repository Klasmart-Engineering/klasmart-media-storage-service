import { box, randomBytes } from 'tweetnacl'
import { ApplicationError } from '../errors/applicationError'
import ErrorMessage from '../errors/errorMessages'

const newNonce = () => randomBytes(box.nonceLength)

export const encrypt = (
  secretOrSharedKey: Uint8Array,
  buffer: Uint8Array,
): string => {
  const nonce = newNonce()
  const encrypted = box.after(buffer, nonce, secretOrSharedKey)

  const fullMessage = new Uint8Array(nonce.length + encrypted.length)
  fullMessage.set(nonce)
  fullMessage.set(encrypted, nonce.length)

  const base64FullMessage = Buffer.from(fullMessage).toString('base64')
  return base64FullMessage
}

export const decrypt = (
  secretOrSharedKey: Uint8Array,
  messageWithNonce: string,
): Uint8Array => {
  const messageWithNonceAsUint8Array = Buffer.from(messageWithNonce, 'base64')
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength)
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length,
  )

  const decrypted = box.open.after(message, nonce, secretOrSharedKey)

  if (!decrypted) {
    throw new ApplicationError(ErrorMessage.decryptionFailed)
  }

  return decrypted
}
