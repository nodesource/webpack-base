#! /usr/bin/env node
const shell = require('shelljs')
const { resolve, join } = require('path')
const { readFile, writeFile } = require('fs')

const templatePackage = require('../project-template/package.json')
const repoPackage = require('../package.json')

const testProjectDir = resolve(__dirname, '../test-project')
const templateProjectDir = resolve(__dirname, '../project-template')
const webpackConfigPath = join(templateProjectDir, 'webpack.config.js')

// Copy template project files
shell.cp('-R', templateProjectDir, testProjectDir)

// Add the dependencies from the project to the dev dependencies of the test project
// Normally these dependencies will be pulled down as part of this module
templatePackage.devDependencies = Object.assign(
  templatePackage.devDependencies,
  repoPackage.dependencies,
)
delete templatePackage.devDependencies['@inspirescript/webpack-configs']

writeFile(
  join(testProjectDir, 'package.json'),
  JSON.stringify(templatePackage, null, 2),
  () => {},
)

// Update the webpack config to use configs from this repo
readFile(webpackConfigPath, (err, data) => {
  if (err) return console.warn(err)

  let file = data.toString()
  file = file.replace('@inspirescript/webpack-configs', '../index')

  return writeFile(join(testProjectDir, 'webpack.config.js'), file, () => {})
})
