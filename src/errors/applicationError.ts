export class ApplicationError extends Error {
  // TODO: Consider passing an object rather than individual parameters.
  // Otherwise, we have to pass undefined to skip innerError.
  constructor(
    message: string,
    public readonly innerError?: unknown,
    public readonly meta?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    Error.captureStackTrace(this, this.constructor)
  }
}
