export function error2Json(
  error: Error | unknown | null | undefined,
): string | undefined {
  if (error == null) {
    return undefined
  }
  return JSON.stringify(error, jsonFriendlyErrorReplacer)
}

export function error2Obj(
  error: Error | unknown | null | undefined,
): Record<string, unknown> | undefined {
  const json = error2Json(error)
  if (json == null) {
    return undefined
  }
  return JSON.parse(json)
}

function jsonFriendlyErrorReplacer(key: string, value: unknown) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors.
      ...value,
      // Explicitly pull Error's non-enumerable properties.
      name: value.name,
      message: value.message,
      stack: process.env.LOG_LEVEL === 'silly' ? value.stack : undefined,
    }
  }

  return value
}
