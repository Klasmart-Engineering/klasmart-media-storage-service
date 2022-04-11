export default function throwExpression(errorMessage: string): never {
  throw new Error(errorMessage)
}
