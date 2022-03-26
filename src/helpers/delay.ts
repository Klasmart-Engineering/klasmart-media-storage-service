export function delay(ms: number): Promise<boolean> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
