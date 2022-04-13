import { ApplicationError } from '../errors/applicationError'

export default function throwExpression(errorMessage: string): never {
  throw new ApplicationError(errorMessage)
}
