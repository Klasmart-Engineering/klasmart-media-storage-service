import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'
const readFile = promisify(fs.readFile)

export function getTransientResultsFilePath(category: string) {
  const transientResultsPath = join(__dirname, 'transientResults')
  if (!fs.existsSync(transientResultsPath)) {
    fs.mkdirSync(transientResultsPath, { recursive: true })
  }
  const transientResultsFilePath = join(
    transientResultsPath,
    category + '.json',
  )
  return transientResultsFilePath
}

export type UnprocessedResult = {
  version: string
  requests: number
  latency: number
  throughput: number
  query: string
}

export type ProcessedResult = {
  version: string
  requests: string
  latency: string
  throughput: string
  query: string
}

export type TransientResult = {
  [version: string]: { [queryName: string]: UnprocessedResult }[]
}

export async function readJsonFile<T>(transientResultsFilePath: string) {
  if (fs.existsSync(transientResultsFilePath)) {
    const buffer = await readFile(transientResultsFilePath)
    const result = JSON.parse(buffer.toString())
    return result as T
  }
  return undefined
}
