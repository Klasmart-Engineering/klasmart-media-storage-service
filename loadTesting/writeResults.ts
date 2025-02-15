import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { join } from 'path'
import markdownTable from 'markdown-table'
import {
  ProcessedResult,
  UnprocessedResult,
  readJsonFile,
  getTransientResultsFilePath,
  TransientResult,
} from './common'

const writeFile = promisify(fs.writeFile)

const previousVersion = process.argv[2]
if (!previousVersion) {
  throw new Error('previous version must be passed as the first argument.')
}
const currentVersion = process.argv[3]
if (!currentVersion) {
  throw new Error('current version must be passed as the second argument.')
}
// Examples: caching, noCaching, loggingEnabled, etc.
const category = process.argv[4]
if (!category) {
  throw new Error('category must be passed as the third argument.')
}
const resultsDirectory = join(__dirname, 'rawResults', category)
if (!fs.existsSync(resultsDirectory)) {
  fs.mkdirSync(resultsDirectory, { recursive: true })
}
const versionHistoryDirectory = join(__dirname, 'versionHistory', category)
if (!fs.existsSync(versionHistoryDirectory)) {
  fs.mkdirSync(versionHistoryDirectory, { recursive: true })
}

const transientResultsFilePath = getTransientResultsFilePath(category)

async function mapToRelativeResults(
  previousVersionResults: Record<string, UnprocessedResult>[],
  currentVersionResults: Record<string, UnprocessedResult>[],
) {
  const keys = new Set([
    ...Object.keys(previousVersionResults[0]),
    ...Object.keys(currentVersionResults[0]),
  ])

  const previousVersion: Record<string, UnprocessedResult> = {}
  for (let index = 0; index < previousVersionResults.length; index++) {
    const element = previousVersionResults[index]
    for (const queryName of Object.keys(previousVersionResults[0])) {
      if (!previousVersion[queryName]) {
        previousVersion[queryName] = element[queryName]
        continue
      }
      previousVersion[queryName].requests += element[queryName].requests
      previousVersion[queryName].latency += element[queryName].latency
      previousVersion[queryName].throughput += element[queryName].throughput
    }
  }
  for (const queryName of Object.keys(previousVersion)) {
    previousVersion[queryName].requests /= previousVersionResults.length
    previousVersion[queryName].latency /= previousVersionResults.length
    previousVersion[queryName].throughput /= previousVersionResults.length
  }

  const currentVersion: Record<string, UnprocessedResult> = {}
  for (let index = 0; index < currentVersionResults.length; index++) {
    const element = currentVersionResults[index]
    for (const queryName of Object.keys(currentVersionResults[0])) {
      if (!currentVersion[queryName]) {
        currentVersion[queryName] = element[queryName]
        continue
      }
      currentVersion[queryName].requests += element[queryName].requests
      currentVersion[queryName].latency += element[queryName].latency
      currentVersion[queryName].throughput += element[queryName].throughput
    }
  }
  for (const queryName of Object.keys(currentVersion)) {
    currentVersion[queryName].requests /= currentVersionResults.length
    currentVersion[queryName].latency /= currentVersionResults.length
    currentVersion[queryName].throughput /= currentVersionResults.length
  }

  const results = new Map<string, ProcessedResult>()
  for (const queryName of keys) {
    const previousResult: UnprocessedResult | undefined =
      previousVersion[queryName]
    const currentResult: UnprocessedResult | undefined =
      currentVersion[queryName]
    if (!currentResult) {
      continue
    }

    let result: ProcessedResult
    if (previousResult) {
      result = {
        version: currentResult.version,
        requests: getDiff(previousResult.requests, currentResult.requests, 0),
        latency: getDiff(previousResult.latency, currentResult.latency, 2),
        throughput: getDiff(
          previousResult.throughput,
          currentResult.throughput,
          0,
        ),
        query: currentResult.query,
      }
    } else {
      result = {
        version: currentResult.version,
        requests: currentResult.requests.toFixed(0),
        latency: currentResult.latency.toFixed(2),
        throughput: currentResult.throughput.toFixed(0),
        query: currentResult.query,
      }
    }
    console.log(`${category}/${queryName} requests/sec: ${result.requests}`)
    results.set(queryName, result)
  }
  return results
}

function getDiff(previous: number, current: number, fractionDigits: number) {
  const previousNum = previous.toFixed(fractionDigits)
  const currentNum = current.toFixed(fractionDigits)
  let diff = current - previous
  diff = Number(diff.toFixed(fractionDigits))
  const prefix = diff >= 0 ? '+' : ''
  const result = `${prefix}${diff} (${previousNum} -> ${currentNum})`
  return result
}

async function updateJson(results: ReadonlyMap<string, ProcessedResult>) {
  for (const [queryName, result] of results) {
    let resultHistory: ProcessedResult[] = []
    if (fs.existsSync(join(resultsDirectory, `${queryName}.json`))) {
      const file = await import(`./rawResults/${category}/${queryName}.json`)
      resultHistory = file.default
    }
    resultHistory.unshift(result)
    const dest = path.join(resultsDirectory, `${queryName}.json`)
    await writeFile(dest, JSON.stringify(resultHistory, null, 2))
  }
}

async function updateMarkdownTables(
  results: ReadonlyMap<string, ProcessedResult>,
) {
  for (const [queryName, result] of results) {
    const { default: resultHistory } = await import(
      `./rawResults/${category}/${queryName}.json`
    )
    const rows: string[][] = resultHistory.map((x: UnprocessedResult) => [
      x.version,
      x.requests,
      x.latency,
      x.throughput,
    ])
    const table = markdownTable([
      ['version', 'requests/sec', 'latency', 'throughput'],
      ...rows,
    ])
    const queryCodeBlock = '```gql' + result.query + '```'
    const md = `# ${queryName}: ${category}\n\n${queryCodeBlock}\n\n${table}`
    const dest = path.join(versionHistoryDirectory, `${queryName}.md`)
    await writeFile(dest, md)
  }
}

async function writeResults() {
  const transientResults = await readJsonFile<TransientResult>(
    transientResultsFilePath,
  )
  if (!transientResults) {
    throw new Error(
      `File doesn't exist: ${transientResultsFilePath}. Make sure to run the load tests first.`,
    )
  }
  // TODO: Generically consume all version keys in the transient results
  // instead of specifically looking for two versions.
  const previousVersionResults = transientResults[previousVersion]
  if (!previousVersionResults) {
    throw new Error(`No load test results exist for version ${previousVersion}`)
  }
  const currentVersionResults = transientResults[currentVersion]
  if (!previousVersionResults) {
    throw new Error(`No load test results exist for version ${currentVersion}`)
  }
  const results = await mapToRelativeResults(
    previousVersionResults,
    currentVersionResults,
  )
  await updateJson(results)
  await updateMarkdownTables(results)
  fs.rmSync(transientResultsFilePath, { recursive: true, force: true })
}

writeResults().then(() => console.log('load test results saved!'))
