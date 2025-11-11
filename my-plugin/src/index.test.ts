import assert from 'node:assert/strict'
import test from 'node:test'

import { readFileSync } from 'fs'

import { firstWholeWordIndex } from './util.js'

const rawFile = readFileSync('./src/rtk_test_file.ts', 'utf8')

// eslint-disable-next-line @typescript-eslint/no-floating-promises
test('util functions', () => {
  // I have commented the not-supported versions such as "foobar" and ["foobar"]

  assert.equal(getLineNumber(0), 1)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar')), 20)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar2')), 23)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar3')), 26)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar4')), 29)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar5')), 33)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar6')), 37)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar7')), 40)
})

function getLineNumber(charIndex: number): number {
  return rawFile.slice(0, charIndex).split('\n').length
}
