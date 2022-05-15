import { Redis } from 'ioredis'
import delay from '../helpers/delay'

export class StatsProvider {
  constructor(
    private readonly redisClient: Redis,
    private readonly delayMs = 5 * 1000,
    private readonly keyPrefix = 'stats',
  ) {}

  public async calculateTotals(statsInput: StatsInput): Promise<StatsOutput> {
    await this.appendToSharedStorage(statsInput)
    // GIVE THE OTHER CONTAINER INSTANCES TIME TO WRITE TO REDIS.
    await delay(this.delayMs)
    const results = await this.consumeAccumulatedResults(statsInput)
    const output = this.mapResultsToOutput(statsInput, results)
    // GIVE THE OTHER CONTAINER INSTANCES TIME TO READ FROM REDIS.
    await delay(this.delayMs)
    await this.resetStats()

    return output
  }

  public async appendToSharedStorage(statsInput: StatsInput) {
    let pipeline = this.redisClient.pipeline()
    for (const [key, value] of Object.entries(statsInput)) {
      for (const [statKey, count] of Object.entries(value.counts)) {
        pipeline = pipeline.incrby(`${this.keyPrefix}.${key}.${statKey}`, count)
      }
      for (const [statKey, set] of Object.entries(value.sets)) {
        pipeline = pipeline.sadd(`${this.keyPrefix}.${key}.${statKey}`, ...set)
      }
    }
    await pipeline.exec()
  }

  private async consumeAccumulatedResults(statsInput: StatsInput) {
    let pipeline = this.redisClient.pipeline()
    for (const [key, value] of Object.entries(statsInput)) {
      for (const statKey of Object.keys(value.counts)) {
        pipeline = pipeline.get(`${this.keyPrefix}.${key}.${statKey}`)
      }
      for (const statKey of Object.keys(value.sets)) {
        pipeline = pipeline.scard(`${this.keyPrefix}.${key}.${statKey}`)
      }
    }
    const results = await pipeline.exec()
    return results
  }

  private mapResultsToOutput(
    statsInput: StatsInput,
    results: [Error | null, unknown][],
  ) {
    const output: StatsOutput = {}
    let i = 0
    for (const [key, value] of Object.entries(statsInput)) {
      output[key] = {}
      for (const statKey of Object.keys(value.counts)) {
        const result = results[i][1]
        output[key][statKey] = Number(result)
        i += 1
      }
      for (const statKey of Object.keys(value.sets)) {
        const result = results[i][1]
        output[key][statKey] = Number(result)
        i += 1
      }
    }
    return output
  }

  private async resetStats() {
    const keys = await this.redisClient.keys(`media:${this.keyPrefix}.*`)
    for (let i = 0; i < keys.length; i++) {
      keys[i] = keys[i].substring('media:'.length)
    }
    if (keys.length > 0) {
      return
    }
    await this.redisClient.del(keys)
  }
}

export interface ResolverStatsInput {
  counts: Record<string, number>
  sets: Record<string, Set<string>>
}

export type StatsInput = Record<string, ResolverStatsInput>

export type StatsOutput = Record<string, Record<string, number>>
