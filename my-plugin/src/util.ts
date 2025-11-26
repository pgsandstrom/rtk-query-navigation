// A word of warning: This is AI-genereated slop.

export function firstWholeWordIndex(rawFileContent: string, word: string): number {
  const fileContent = maskStringsAndComments(rawFileContent)
  // word boundary for TS identifiers (letters/digits/_/$), not using \b (bad with _/$)
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Prefix guard: (?:^|[\\s,{])
  //   - `^`          => start of line (multiline)
  //   - `\\s`        => whitespace before a key is fine
  //   - `,` or `{`   => common characters that precede object keys
  //   - This EXCLUDES '.' and '?.' so we don't match `obj.foobar:` or `obj?.foobar:`
  //
  // Key: (esc)
  //   - The literal identifier we’re hunting for.
  //
  // Optional TS modifier before colon: (?:\\s*[?!])?
  //   - Allow `foobar? :` or `foobar! :` (optional/definite)
  //
  // Whitespace and colon: \\s*:
  //   - Real code often has spaces before the colon.
  const rx = new RegExp(`(?:^|[\\s,{])(${esc})(?:\\s*[?!])?\\s*:`, 'm')

  const m = rx.exec(fileContent)
  if (!m) {
    return -1
  }
  return m.index + (m[1] ? m[1].length : 0)
}

/**
 * Replace the contents of strings (', ", ` …including template ${...}…`) and comments
 * (// ... , /* ... *\/) with spaces, preserving length and line structure.
 */
function maskStringsAndComments(src: string): string {
  const n = src.length
  const out = src.split('')
  let i = 0

  const spaceRange = (s: number, e: number) => {
    for (let k = s; k < e && k < n; k++) {
      out[k] = ' '
    }
  }

  const skipEscapes = () => {
    i += 2
  }

  const skipQuoted = (quote: "'" | '"') => {
    i++
    while (i < n) {
      const c = src[i]
      if (c === '\\') {
        skipEscapes()
        continue
      }
      if (c === quote) {
        i++
        break
      }
      i++
    }
  }

  const skipLineComment = () => {
    i += 2
    while (i < n && src[i] !== '\n') {
      i++
    }
  }

  const skipBlockComment = () => {
    i += 2
    while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
      i++
    }
    i = Math.min(n, i + 2)
  }

  const skipRegex = () => {
    i++ // past opening /
    while (i < n) {
      const c = src[i]
      if (c === '\\') {
        skipEscapes()
        continue
      }
      if (c === '/') {
        i++ // past closing /
        // skip flags (g, i, m, etc.)
        while (i < n && /[a-z]/i.test(src[i])) {
          i++
        }
        break
      }
      if (c === '\n') {
        break
      } // invalid regex
      i++
    }
  }

  const skipTemplate = () => {
    i++ // past initial backtick
    while (i < n) {
      const c = src[i]
      if (c === '\\') {
        skipEscapes()
        continue
      }
      if (c === '`') {
        i++
        break
      } // end of this template
      if (c === '$' && src[i + 1] === '{') {
        // enter expression; balance braces while skipping nested literals/comments
        i += 2
        let depth = 1
        while (i < n && depth > 0) {
          const d = src[i]
          if (d === '\\') {
            skipEscapes()
            continue
          }
          if (d === "'") {
            skipQuoted("'")
            continue
          }
          if (d === '"') {
            skipQuoted('"')
            continue
          }
          if (d === '/' && src[i + 1] === '/') {
            skipLineComment()
            continue
          }
          if (d === '/' && src[i + 1] === '*') {
            skipBlockComment()
            continue
          }
          if (d === '`') {
            skipTemplate()
            continue
          } // nested template in expression
          if (d === '{') {
            depth++
            i++
            continue
          }
          if (d === '}') {
            depth--
            i++
            continue
          }
          i++
        }
        continue
      }
      i++
    }
  }

  while (i < n) {
    const c = src[i]
    const c2 = src[i + 1]

    // Check for regex before checking for comments
    // Regex can appear after: =, (, [, {, :, ;, !, &, |, ?, +, -, *, /, %, ,, return, throw, etc.
    if (c === '/') {
      const prevNonWs = i - 1
      let j = prevNonWs
      while (j >= 0 && /\s/.test(src[j])) {
        j--
      }

      const prevChar = j >= 0 ? src[j] : ''
      const isRegexContext = j < 0 || /[=([{:;!&|?+\-*/%,]/.test(prevChar)

      if (isRegexContext && c2 !== '/' && c2 !== '*') {
        const start = i
        skipRegex()
        spaceRange(start, i)
        continue
      }
    }

    // // line comment
    if (c === '/' && c2 === '/') {
      const start = i
      skipLineComment()
      spaceRange(start, i)
      continue
    }

    // /* block comment */
    if (c === '/' && c2 === '*') {
      const start = i
      skipBlockComment()
      spaceRange(start, i)
      continue
    }

    // 'single'
    if (c === "'") {
      const start = i
      skipQuoted("'")
      spaceRange(start, i)
      continue
    }

    // "double"
    if (c === '"') {
      const start = i
      skipQuoted('"')
      spaceRange(start, i)
      continue
    }

    // `template`
    if (c === '`') {
      const start = i
      skipTemplate()
      spaceRange(start, i)
      continue
    }

    i++
  }

  return out.join('')
}
