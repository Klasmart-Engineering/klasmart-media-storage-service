export function setEnvVar(envName: string, value: string | undefined) {
  const original = process.env[envName]
  process.env[envName] = value
  return original
}

export function restoreEnvVar(envName: string, original: string | undefined) {
  if (original === undefined) {
    delete process.env[envName]
    return
  }
  process.env[envName] = original
}
