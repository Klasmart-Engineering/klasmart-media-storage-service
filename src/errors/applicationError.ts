export class ApplicationError extends Error {
  constructor(message: string, public readonly innerError?: unknown) {
    super(message)
    this.name = this.constructor.name
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    Error.captureStackTrace(this, this.constructor)
  }
}
