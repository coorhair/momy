#!/usr/bin/env node

'use strict'

const Tailer = require('../lib/tailer.js')
const fs = require('fs')
const path = require('path')
const program = require('commander')
const pkjson = require('../package.json')

const DEFAULT_CONFIG_PATH = 'momyfile.json'

function import_collections(value, previous) {
  if (typeof(value) === 'string'){
    return value.split(',').filter(x => !!x)
  }
  return value
}

program
  .version(`${pkjson.version}`)
  .description('A simple cli tool for replicating MongoDB to MySQL in realtime.')
  .option('--config <filepath>', 'path to momy mapping file', DEFAULT_CONFIG_PATH)
  .option('--import [collections]', 'list of collection name to import, no collection provided means import all avail collections', import_collections)
  .option('--cli-mode', 'turn on cli mode', false)
  .option('--one-time', 'run forever or one time, by default run forever', false)
  .parse(process.argv);

// const refresh = process.argv.some(c => c === '--import')
// const cliMode = !process.argv.some(c => c === '--service')
// const finder = (p, c, i, a) => c === '--config' && a[i + 1] ? a[i + 1] : p
// const file = process.argv.reduce(finder, DEFAULT_CONFIG_PATH)
// const config = JSON.parse(fs.readFileSync(path.isAbsolute(file) ? file : (process.cwd() + '/' + file)))
// const findCollections = (p, c, i, a) => c === '--import' && a[i + 1] ? a[i + 1] : p
// const collections = process.argv.reduce(findCollections, '')

const configFile = path.isAbsolute(program.config) ? program.config : path.join(process.cwd(), program.config)
if (!fs.existsSync(configFile)) {
  program.help()
  process.exit()
}
const config = JSON.parse(fs.readFileSync(configFile))
const cliMode = program.cliMode
const collections = program.import === true ? [] : program.import
const refresh = !!collections
const run_forever = !program.one_time

const tailer = new Tailer(config, cliMode)

if (refresh) {
  // tailer.importAndStart(true, collections.split(',').map(c => c.trim()).filter(c => !!c))
  tailer.importAndStart(run_forever, collections)
} else {
  tailer.start(run_forever)
}
