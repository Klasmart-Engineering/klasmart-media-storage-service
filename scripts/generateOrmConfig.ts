#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { getMetadataDatabaseConnectionOptions } from '../src/initialization/connectToMetadataDatabase'

const databaseUrl = process.env.METADATA_DATABASE_URL
if (!databaseUrl) {
  throw new Error('Please specify a value for METADATA_DATABASE_URL')
}

const config = getMetadataDatabaseConnectionOptions(databaseUrl)
const configPath = path.join(__dirname, '../ormConfig.json')

fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

console.log(
  `TyprORM config saved to ${path.relative(process.cwd(), configPath)}`,
)
