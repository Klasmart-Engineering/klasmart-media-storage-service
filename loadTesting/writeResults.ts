import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { join } from 'path'
import markdownTable from 'markdown-table'
import {
  CustomResult,
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
  previousVersion: Record<string, CustomResult>,
  currentVersion: Record<string, CustomResult>,
) {
  const keys = new Set([
    ...Object.keys(previousVersion),
    ...Object.keys(currentVersion),
  ])

  const results = new Map<string, CustomResult>()
  for (const queryName of keys) {
    const previousResult = previousVersion[queryName]
    const currentResult = currentVersion[queryName]

    const result: CustomResult = {
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
    console.log(`${category}/${queryName} requests/sec: ${result.requests}`)
    results.set(queryName, result)
  }
  return results
}

function getDiff(previous: string, current: string, fractionDigits: number) {
  const previousNum = Number(previous).toFixed(fractionDigits)
  const currentNum = Number(current).toFixed(fractionDigits)
  let diff = Number(current) - Number(previous)
  diff = Number(diff.toFixed(fractionDigits))
  const prefix = diff >= 0 ? '+' : ''
  const result = `${prefix}${diff} (${previousNum} -> ${currentNum})`
  return result
}

async function updateJson(results: ReadonlyMap<string, CustomResult>) {
  for (const [queryName, result] of results) {
    let resultHistory: CustomResult[] = []
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
  results: ReadonlyMap<string, CustomResult>,
) {
  for (const [queryName, result] of results) {
    const { default: resultHistory } = await import(
      `./rawResults/${category}/${queryName}.json`
    )
    const rows: string[][] = resultHistory.map((x: CustomResult) => [
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
