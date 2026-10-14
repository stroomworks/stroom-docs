/**
 * Converts a page written in the Markdoc dialect used by the stroomworks-website docs into
 * the Hugo/Docsy markdown this site is built from, following the house style in
 * content/en/community/documentation/style-guide/.
 *
 * Used twice:
 *
 *   · once, by scripts/docs/migrate-from-markdoc.mjs, to bring the restructured docs in
 *   · on every run of scripts/docs/gen-docs-reference.mjs, whose page builders still
 *     write Markdoc so that the two repositories' generators stay comparable
 *
 * What it does, in order:
 *
 *   front matter   order → weight, summary → description, title → Title Case, plus
 *                  linkTitle, date, tags and aliases; the page-contract keys are kept
 *                  (kind is renamed pageKind, because newer Hugo reserves `kind`)
 *   tags           {% callout %} → note/warning, {% element %} → pipe-elm,
 *                  {% icon %} → stroom-icon, {% figure %} → image, and the contract tags
 *                  (timing, verify, golden, not-proof, trap, diagnose) → the shortcodes
 *                  of the same name in layouts/shortcodes/
 *   links          relative .md links → relref, external links → external-link
 *   layout         one sentence per line, no hard wraps, `* ` and `1. ` list markers,
 *                  two blank lines before a heading
 *
 * Problems that need a human (a link to a page that does not exist, a tag it does not
 * know) are collected in `problems` rather than thrown, so one run reports all of them.
 */

/* ------------------------------------------------------------------ title case */

/** Words that stay lower case in a title unless they start or end it. */
const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by',
  'in', 'of', 'on', 'to', 'via', 'vs', 'with', 'from', 'into', 'per', 'over',
])

/** Names whose own capitalisation is lower case, and must survive title casing. */
const KEEP_AS_IS = new Set(['rsyslog', 'syslog-ng', 'cron', 'npm', 'curl', 'stroom.conf'])

/**
 * "Each word capitalised" (style-guide/_index.md), done the way the existing titles do
 * it: small words stay lower case, anything with a capital, a digit, a dot or a backtick
 * already in it is left alone (XSLT, StroomQL, Plan B, v7.1, `stroom.conf`).
 */
export function toTitleCase(title) {
  const words = title.split(/(\s+)/)
  const last = words.length - 1
  return words
    .map((word, i) => {
      if (/^\s+$/.test(word) || word === '') return word
      if (KEEP_AS_IS.has(word.toLowerCase())) return word
      if (/[A-Z0-9.`]/.test(word.slice(1)) || /^[`"(]/.test(word)) return word
      const lower = word.toLowerCase()
      if (i !== 0 && i !== last && SMALL_WORDS.has(lower.replace(/[^a-z]/g, ''))) return lower
      return word
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join('-')
    })
    .join('')
}

/* ---------------------------------------------------------------- front matter */

/** The website's front matter is flat `key: value` lines, which is all this reads. */
export function parseFrontMatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!m) throw new Error(`${file}: no front matter`)
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
  }
  return { meta, body: text.slice(m[0].length) }
}

const yamlString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

/**
 * Front matter in the shape style-guide/front-matter.md asks for, then the page-contract
 * keys, which layouts/partials/docs-page-contract.html checks and renders.
 */
export function hugoFrontMatter(meta, { date, aliases = [], linkTitle } = {}) {
  const title = toTitleCase(meta.title)
  const lines = [
    '---',
    `title: ${yamlString(title)}`,
    `linkTitle: ${yamlString(linkTitle ?? title)}`,
    `weight: ${meta.order}`,
    `date: ${date}`,
    'tags:',
    'description: >',
    `  ${meta.summary}`,
  ]
  // The page contract. See content/en/community/documentation/style-guide/page-contract.md.
  if (meta.kind) lines.push(`pageKind: ${meta.kind}`)
  if (meta.verification) lines.push(`verification: ${meta.verification}`)
  if (meta.status) lines.push(`status: ${meta.status}`)
  if (meta.betaNote) lines.push(`betaNote: ${yamlString(meta.betaNote)}`)
  if (meta.thirdParty) lines.push(`thirdParty: ${yamlString(meta.thirdParty)}`)
  if (aliases.length) {
    lines.push('aliases:')
    for (const a of aliases) lines.push(`  - ${a}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

/* --------------------------------------------------------------- tag attributes */

/** `name="X" label="Y"` → { name: 'X', label: 'Y' } */
function attrs(src) {
  const out = {}
  for (const m of src.matchAll(/([\w-]+)=("((?:[^"\\]|\\.)*)"|[\w.-]+)/g))
    out[m[1]] = m[3] !== undefined ? m[3].replace(/\\"/g, '"') : m[2]
  return out
}

/** A Hugo shortcode string argument. Backticks are a raw string, so they survive quotes. */
function arg(s) {
  if (!s.includes('"')) return `"${s}"`
  if (!s.includes('`')) return `\`${s}\``
  return `"${s.replace(/"/g, '&quot;')}"`
}

/** Block tags, and the shortcode each one becomes. */
const CONTRACT_TAGS = ['timing', 'verify', 'golden', 'not-proof', 'trap', 'diagnose']
const BLOCK_TAG = /^\s*\{%\s*(\/?)([\w-]+)((?:\s+[^%]*?)?)\s*(\/?)%\}\s*$/

/* ------------------------------------------------------------------ inline */

const PH_OPEN = ''
const PH_CLOSE = ''

/**
 * Parks spans that must be neither rewritten nor split across lines: code spans, and
 * then (once converted) shortcodes and whole links. Returns the text with placeholders
 * and a function to put them back.
 */
function park(text, patterns) {
  const parked = []
  let out = text
  for (const re of patterns)
    out = out.replace(re, (m) => {
      parked.push(m)
      return `${PH_OPEN}${parked.length - 1}${PH_CLOSE}`
    })
  const restore = (s) => {
    let prev
    do {
      prev = s
      s = s.replace(new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, 'g'), (_, i) => parked[+i])
    } while (s !== prev)
    return s
  }
  return { text: out, restore }
}

const CODE_SPAN = /(`+)(?:(?!\1)[\s\S])+?\1/g

/**
 * The inline conversions: element and icon tags, and links. `ctx.resolveLink(target)`
 * returns the relref path for a relative link, or null when it points at nothing.
 */
export function convertInline(text, ctx) {
  const { text: parked, restore } = park(text, [CODE_SPAN])
  let out = parked

  out = out.replace(/\{%\s*element\s+([^%]*?)\s*\/%\}/g, (_, a) => {
    const { name, label } = attrs(a)
    return label && label !== name ? `{{< pipe-elm ${arg(name)} ${arg(label)} >}}` : `{{< pipe-elm ${arg(name)} >}}`
  })
  out = out.replace(/\{%\s*icon\s+([^%]*?)\s*\/%\}/g, (_, a) => {
    const { name, title } = attrs(a)
    return title ? `{{< stroom-icon ${arg(name)} ${arg(title)} >}}` : `{{< stroom-icon ${arg(name)} >}}`
  })

  // [text](target "title") — link text may itself hold a parked code span.
  out = out.replace(/(!?)\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g, (m, bang, label, target) => {
    if (bang) {
      ctx.problems.push(`${ctx.file}: inline image ${m}; use {% figure %}`)
      return m
    }
    if (/^(https?:|mailto:)/.test(target)) {
      // external-link renders its text verbatim, so markdown in it would show.
      const plain = restore(label).replace(/`([^`]*)`/g, '$1').replace(/\*\*?([^*]+)\*\*?/g, '$1')
      return plain === target
        ? `{{< external-link ${arg(target)} >}}`
        : `{{< external-link ${arg(plain)} ${arg(target)} >}}`
    }
    if (target.startsWith('#')) return `[${label}]({{< relref ${arg(target)} >}})`
    const resolved = ctx.resolveLink(target)
    if (!resolved) {
      ctx.problems.push(`${ctx.file}: link to "${target}" points at no page`)
      return m
    }
    return `[${label}]({{< relref ${arg(resolved)} >}})`
  })

  if (/\{%/.test(out)) ctx.problems.push(`${ctx.file}: unconverted inline tag in: ${restore(out).slice(0, 120)}`)
  return restore(out)
}

/* ------------------------------------------------------------- sentences */

/** Abbreviations whose full stop does not end a sentence. */
const ABBREVIATIONS = /(?:^|[\s(])(?:e\.g|i\.e|etc|vs|cf|approx|incl|No|Fig|Mr|Mrs|Dr|St)\.$/i

/**
 * One sentence per line (style-guide/markdown-style.md). Splits after . ! or ? (and any
 * closing quote, bracket or emphasis) where the next sentence starts with a capital, a
 * digit, or a span. Shortcodes, links and code are parked first so that a full stop
 * inside one is never a boundary.
 */
export function splitSentences(text) {
  const { text: parked, restore } = park(text, [
    CODE_SPAN,
    /\{\{[<%][\s\S]*?[>%]\}\}/g,
    /\[(?:[^\[\]]|\[[^\]]*\])*\]\([^)]*\)/g,
  ])
  const sentences = []
  let start = 0
  const boundary = new RegExp(
    `([.!?])(["')\\]*_]*)\\s+(?=[A-Z0-9"'(\\[*_${PH_OPEN}{])`,
    'g',
  )
  let m
  while ((m = boundary.exec(parked))) {
    const end = m.index + m[1].length + m[2].length
    const before = parked.slice(start, m.index + 1)
    if (m[1] === '.' && ABBREVIATIONS.test(before)) continue
    // "1. ", "v7. " and the like: a bare number before the stop is a list or a version.
    if (m[1] === '.' && /(?:^|\s)\d+\.$/.test(before) && before.trim().length < 4) continue
    sentences.push(parked.slice(start, end))
    start = m.index + m[0].length
  }
  sentences.push(parked.slice(start))
  return sentences.map((s) => restore(s).trim()).filter(Boolean)
}

/* ------------------------------------------------------------------ blocks */

const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/

/**
 * Code fences must name a language this site's Prism build includes
 * (style-guide/additional-elements.md, "Supported languages"); plain text is `text`.
 * Prism's own aliases (`markdown`, `shell`, `html`, `yml`, ...) are included too.
 */
const PRISM_LANGUAGES = new Set([
  'sh', 'bash', 'css', 'csv', 'groovy', 'http', 'java', 'javascript', 'jq', 'json',
  'python', 'regex', 'scss', 'sql', 'text', 'toml', 'xml', 'yaml',
  'shell', 'js', 'py', 'html', 'markup', 'markdown', 'md', 'yml',
])
const LANGUAGE_FALLBACK = { xslt: 'xml', xsl: 'xml', xsd: 'xml' }

/** The language a fence's info string names, made one Prism can highlight. */
function fenceLanguage(info) {
  const [lang = '', ...rest] = info.trim().split(/\s+/)
  const lower = lang.toLowerCase()
  const mapped = PRISM_LANGUAGES.has(lower) ? lower : (LANGUAGE_FALLBACK[lower] ?? 'text')
  return [mapped, ...rest].join(' ')
}
const LIST_ITEM = /^(\s*)([*+-]|\d+[.)])( +)(.*)$/
const HEADING = /^(#{1,6})\s+(.*?)\s*$/
const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/

/**
 * Converts a page body. `ctx`:
 *
 *   file          for messages
 *   resolveLink   relative .md target → relref path, or null
 *   figure        ({ capture | diagram, alt, caption }) → image shortcode path, or null
 *   problems      collects what needs a human
 */
export function convertBody(body, ctx) {
  const src = body.replace(/\r\n/g, '\n').split('\n')
  const out = []
  const stack = [] // open list items: { oldContent, newContent }
  const tagStack = []
  let fence = null // { marker, oldIndent, newIndent }

  const mapIndent = (n) => {
    const top = stack[stack.length - 1]
    return top ? Math.max(0, top.newContent + (n - top.oldContent)) : n
  }
  const indentOf = (line) => /^ */.exec(line)[0].length

  const blank = () => {
    if (out.length && out[out.length - 1] !== '') out.push('')
  }

  let i = 0
  while (i < src.length) {
    const line = src[i]

    /* ---- inside a fence: copied, re-indented with its list item */
    if (fence) {
      const n = indentOf(line)
      const rest = line.slice(Math.min(n, fence.oldIndent))
      out.push(line.trim() === '' ? '' : ' '.repeat(fence.newIndent) + rest)
      if (new RegExp(`^\\s*${fence.marker[0]}{${fence.marker.length},}\\s*$`).test(line)) fence = null
      i++
      continue
    }

    if (line.trim() === '') {
      blank()
      i++
      continue
    }

    const n = indentOf(line)
    while (stack.length && n < stack[stack.length - 1].oldContent) stack.pop()

    /* ---- fence open */
    const f = FENCE.exec(line)
    if (f) {
      const newIndent = mapIndent(n)
      // Markdoc's {% process=false %} annotation, which Hugo would read as attributes.
      const info = fenceLanguage(f[3].replace(/\s*\{%[^%]*%\}\s*/g, ''))
      if (out.length && out[out.length - 1] !== '' && !LIST_ITEM.test(out[out.length - 1])) blank()
      out.push(' '.repeat(newIndent) + f[2] + info)
      fence = { marker: f[2], oldIndent: n, newIndent }
      i++
      continue
    }

    /* ---- block tags, each on a line of its own */
    const t = BLOCK_TAG.exec(line)
    if (t && !['element', 'icon'].includes(t[2])) {
      const [, closing, name, rawAttrs, selfClosing] = t
      const a = attrs(rawAttrs ?? '')
      const ind = ' '.repeat(mapIndent(n))
      if (name === 'figure') {
        const path = ctx.figure(a)
        if (!path) ctx.problems.push(`${ctx.file}: figure with no usable source: ${line.trim()}`)
        blank()
        out.push(`${ind}{{< image src=${arg(path ?? '')} alt=${arg(a.alt ?? '')} >}}${a.caption ?? ''}{{< /image >}}`)
        out.push('')
      } else if (name === 'callout') {
        if (closing) {
          const kind = tagStack.pop()?.kind ?? 'note'
          out.push(`${ind}{{% /${kind} %}}`)
          out.push('')
        } else {
          const kind = a.type === 'warning' ? 'warning' : 'note'
          tagStack.push({ name, kind })
          blank()
          out.push(`${ind}{{% ${kind} %}}`)
        }
      } else if (CONTRACT_TAGS.includes(name)) {
        if (closing) {
          tagStack.pop()
          out.push(`${ind}{{< /${name} >}}`)
          out.push('')
        } else {
          tagStack.push({ name })
          const args =
            name === 'timing' ? ` mode=${arg(a.mode ?? '')}` : name === 'trap' ? ` severity=${arg(a.severity ?? '')}` : ''
          blank()
          out.push(`${ind}{{< ${name}${args} >}}`)
          if (selfClosing) ctx.problems.push(`${ctx.file}: self-closing {% ${name} /%}`)
        }
      } else {
        ctx.problems.push(`${ctx.file}: unknown block tag {% ${closing}${name} %}`)
        out.push(line)
      }
      i++
      continue
    }

    /* ---- headings: two blank lines above, one below */
    const h = HEADING.exec(line)
    if (h && n === 0) {
      while (out.length && out[out.length - 1] === '') out.pop()
      const prev = out[out.length - 1]
      if (out.length && !HEADING.test(prev ?? '')) out.push('', '')
      else if (out.length) out.push('')
      out.push(`${h[1]} ${convertInline(h[2], ctx)}`)
      out.push('')
      stack.length = 0
      i++
      continue
    }

    /* ---- a table written without leading pipes: the delimiter row gives it away */
    if (line.includes('|') && TABLE_DELIMITER.test(src[i + 1] ?? '')) {
      const ind = ' '.repeat(mapIndent(n))
      while (i < src.length && src[i].trim() !== '' && src[i].includes('|')) {
        out.push(ind + convertInline(src[i].trim(), ctx))
        i++
      }
      continue
    }

    /* ---- lines that are kept as they are: tables, HTML, rules, definitions */
    if (/^\s*\|/.test(line) || /^\s*</.test(line) || /^\s*(-{3,}|\*{3,})\s*$/.test(line) || /^\s*:\s/.test(line)) {
      const ind = ' '.repeat(mapIndent(n))
      out.push(ind + convertInline(line.trim(), ctx))
      i++
      continue
    }

    /* ---- block quotes: reflowed inside the quote marker */
    if (/^\s*>/.test(line)) {
      const ind = ' '.repeat(mapIndent(n))
      const parts = []
      while (i < src.length && /^\s*>/.test(src[i])) {
        parts.push(src[i].replace(/^\s*>\s?/, ''))
        i++
      }
      const joined = parts.join('\n')
      if (/^\s*([*+-]|\d+\.)\s|^\s*$/m.test(joined)) for (const p of parts) out.push(`${ind}> ${p}`.trimEnd())
      else for (const s of splitSentences(convertInline(parts.map((p) => p.trim()).join(' '), ctx))) out.push(`${ind}> ${s}`)
      continue
    }

    /* ---- paragraphs and list items: joined, converted, one sentence per line */
    let firstPrefix
    let restPrefix
    const li = LIST_ITEM.exec(line)
    let text
    if (li) {
      const newIndent = mapIndent(n)
      const marker = /\d/.test(li[2]) ? '1.' : '*'
      const spaces = li[3].length > 4 ? 1 : li[3].length
      stack.push({ oldContent: n + li[2].length + spaces, newContent: newIndent + marker.length + 1 })
      firstPrefix = ' '.repeat(newIndent) + marker + ' '
      restPrefix = ' '.repeat(newIndent + marker.length + 1)
      text = [li[4]]
    } else {
      firstPrefix = restPrefix = ' '.repeat(mapIndent(n))
      text = [line.trim()]
    }
    let hardBreak = / {2,}$|\\$/.test(line)
    i++
    while (!hardBreak && i < src.length) {
      const next = src[i]
      if (
        next.trim() === '' ||
        LIST_ITEM.test(next) ||
        FENCE.test(next) ||
        HEADING.test(next) ||
        BLOCK_TAG.test(next) ||
        /^\s*(\||<|>|:\s|-{3,}\s*$)/.test(next) ||
        (next.includes('|') && TABLE_DELIMITER.test(src[i + 1] ?? ''))
      )
        break
      text.push(next.trim())
      hardBreak = / {2,}$|\\$/.test(next)
      i++
    }
    const sentences = splitSentences(convertInline(text.join(' '), ctx))
    sentences.forEach((s, k) => out.push((k === 0 ? firstPrefix : restPrefix) + s))
    if (hardBreak) out[out.length - 1] += '  '
  }

  if (tagStack.length) ctx.problems.push(`${ctx.file}: unclosed tag(s): ${tagStack.map((t) => t.name).join(', ')}`)

  // One blank line between blocks; the two above a heading were added deliberately.
  const tidy = []
  for (let k = 0; k < out.length; k++) {
    const isBlank = out[k] === ''
    let blanks = 0
    while (blanks < tidy.length && tidy[tidy.length - 1 - blanks] === '') blanks++
    if (isBlank && blanks >= 1) {
      const nextNonBlank = out.slice(k).find((l) => l !== '')
      if (!(nextNonBlank && HEADING.test(nextNonBlank) && blanks < 2)) continue
    }
    tidy.push(out[k])
  }
  while (tidy.length && tidy[0] === '') tidy.shift()
  while (tidy.length && tidy[tidy.length - 1] === '') tidy.pop()
  return '\n' + tidy.join('\n') + '\n'
}
