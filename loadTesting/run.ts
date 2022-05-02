import autocannon, { Result, Options } from 'autocannon'

export function run(options: Options): Promise<Result> {
  return autocannon(options)
}
