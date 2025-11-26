import assert from 'node:assert/strict'
import test from 'node:test'

import { readFileSync } from 'fs'

import { firstWholeWordIndex } from './util.js'

const rawFile = readFileSync('./src/rtk_test_file.ts', 'utf8')

// eslint-disable-next-line @typescript-eslint/no-floating-promises
test('util functions', () => {
  // I have commented the not-supported versions such as "foobar" and ["foobar"]

  const FIRST_FOOBAR_LINE = 29

  assert.equal(getLineNumber(0), 1)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar')), FIRST_FOOBAR_LINE)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar2')), FIRST_FOOBAR_LINE + 3)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar3')), FIRST_FOOBAR_LINE + 6)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar4')), FIRST_FOOBAR_LINE + 9)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar5')), FIRST_FOOBAR_LINE + 13)
  assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar6')), FIRST_FOOBAR_LINE + 17)
  // assert.equal(getLineNumber(firstWholeWordIndex(rawFile, 'foobar7')), FIRST_FOOBAR_LINE + 20)
})

function getLineNumber(charIndex: number): number {
  return rawFile.slice(0, charIndex).split('\n').length
}
