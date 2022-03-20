export function setEnvVar(
  envName: keyof NodeJS.ProcessEnv,
  value: string | undefined,
) {
  const original = process.env[envName]
  if (value === undefined) {
    delete process.env[envName]
    return original
  }
  process.env[envName] = value
  return original
}

export function restoreEnvVar(
  envName: keyof NodeJS.ProcessEnv,
  original: string | undefined,
) {
  if (original === undefined) {
    delete process.env[envName]
    return
  }
  process.env[envName] = original
}
