export class CustomError extends Error {
  constructor(name: string) {
    super()
    this.name = name
  }
}
