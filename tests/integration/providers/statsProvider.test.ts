import '../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import RedisClient, { Redis } from 'ioredis'
import {
  StatsInput,
  StatsOutput,
  StatsProvider,
} from '../../../src/providers/statsProvider'
import Config from '../../../src/config/config'

describe('StatsProvider', () => {
  let redis: Redis

  before(async () => {
    redis = new RedisClient({
      port: Config.getRedisPort(),
      host: Config.getRedisHost(),
      keyPrefix: 'media:',
    })
    await redis.flushall()
  })

  after(async () => {
    await redis?.quit()
  })

  context(
    'input1: resolver1.counts.count1 = 2; input1: resolver1.sets.users = ["user1", "user2"]; ' +
      'input2: resolver1.counts.count1 = 1; input2: resolver1.sets.users = ["user2"];',
    () => {
      let output1: StatsOutput
      let output2: StatsOutput

      before(async () => {
        const sut1 = new StatsProvider(redis, 50)
        const sut2 = new StatsProvider(redis, 50)
        const input1: StatsInput = {
          resolver1: {
            counts: { count1: 2 },
            sets: { users: new Set<string>(['user1', 'user2']) },
          },
        }
        const input2: StatsInput = {
          resolver1: {
            counts: { count1: 1 },
            sets: { users: new Set<string>(['user2']) },
          },
        }
        const results = await Promise.all([
          sut1.calculateTotals(input1),
          sut2.calculateTotals(input2),
        ])
        output1 = results[0]
        output2 = results[1]
      })

      it('output1 and output2 have same result: resolver1.count1 = 3; resolver1.users = 2', async () => {
        const expected: StatsOutput = {
          resolver1: { count1: 3, users: 2 },
        }
        expect(output1).to.deep.equal(expected)
        expect(output2).to.deep.equal(expected)
      })
    },
  )
})
