#!/usr/bin/env node
/**
 * One-shot, run after migrate-from-markdoc.mjs: points the rest of the site's relref/ref
 * links (release notes, community pages) at the restructured docs.
 *
 *   node scripts/docs/retarget-old-doc-links.mjs [--dry-run]
 *
 * A link is rewritten only if its target no longer exists. The new page is found through
 * the `aliases` the migration wrote, which already record where every old page went.
 * Targets given as a bare page name ("running") are looked up in the old tree in git.
 *
 * Anchors are kept where the new page has a heading with that id, and dropped (and
 * reported) where it does not, because the restructure split and merged pages and a
 * dead anchor silently lands at the top of the page.
 *
 * Glossary shortcode terms are checked against the new glossary's headings and reported,
 * not changed: a term is prose, and choosing a replacement is an editorial decision.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative } from 'node:path'

const dryRun = process.argv.includes('--dry-run')
const CONTENT = 'content/en'
const DOCS = join(CONTENT, 'docs')

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (e.endsWith('.md')) yield p
  }
}

const urlOf = (rel) =>
  ('/docs/' + rel.replace(/(^|\/)_index\.md$/, '$1').replace(/\.md$/, '/')).toLowerCase().replace(/\/+$/, '/')

/** goldmark's auto heading id, close enough for the headings these pages have. */
const anchorOf = (text) =>
  text
    .toLowerCase()
    .replace(/\{\{<[^>]*>\}\}/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

/* ---- the new tree: its pages, their anchors, and the old URLs that alias to them */
const pages = new Map() // rel → Set(anchor)
const byUrl = new Map() // url (own or alias) → rel
for (const file of walk(DOCS)) {
  const rel = relative(DOCS, file).split('\\').join('/')
  const text = readFileSync(file, 'utf8')
  const anchors = new Set()
  let fence = false
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const h = !fence && /^#{2,6}\s+(.*?)\s*$/.exec(line)
    if (!h) continue
    const explicit = /\{#([\w-]+)\}$/.exec(h[1])
    anchors.add(explicit ? explicit[1] : anchorOf(h[1]))
  }
  pages.set(rel, anchors)
  byUrl.set(urlOf(rel), rel)
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  for (const m of (/^aliases:\n((?:\s+- .*\n?)*)/m.exec(fm)?.[1] ?? '').matchAll(/- (\S+)/g)) byUrl.set(m[1], rel)
}

/* ---- the old tree, for bare page names */
const oldByName = new Map()
for (const p of execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', DOCS], { encoding: 'utf8' }).split('\n')) {
  if (!p.endsWith('.md')) continue
  const rel = p.slice(DOCS.length + 1)
  const name = posix.basename(rel, '.md') === '_index' ? posix.basename(posix.dirname(rel)) : posix.basename(rel, '.md')
  oldByName.set(name.toLowerCase(), oldByName.has(name.toLowerCase()) ? null : rel)
}

/** Does `target`, as written in `file`, already resolve to a page Hugo can find? */
function resolvesNow(target, file) {
  const path = target.split('#')[0]
  if (!path) return true
  const fromContent = (p) => {
    const bare = p.replace(/^\//, '').replace(/\/$/, '').replace(/\.md$/, '')
    return [`${bare}.md`, `${bare}/_index.md`].some((c) => statSync(join(CONTENT, c), { throwIfNoEntry: false }))
  }
  if (path.startsWith('/')) return fromContent(path)
  return fromContent(posix.join(posix.dirname(relative(CONTENT, file)), path)) || fromContent(path)
}

const report = []
let changed = 0

for (const file of walk(CONTENT)) {
  if (file.startsWith(DOCS + '/')) continue
  const src = readFileSync(file, 'utf8')
  const next = src.replace(/\{\{<\s*(relref|ref)\s+"([^"]+)"\s*>\}\}/g, (m, kind, target) => {
    if (resolvesNow(target, file)) return m
    const [path, anchor] = target.split('#')
    let url
    if (/^\/?docs\//.test(path)) url = '/' + path.replace(/^\//, '').replace(/\.md$/, '').replace(/\/?$/, '/').toLowerCase()
    else {
      const old = oldByName.get(posix.basename(path, '.md').toLowerCase())
      if (old) url = urlOf(old)
    }
    const rel = url && byUrl.get(url)
    if (!rel) {
      report.push(`${file}: no new home for "${target}"`)
      return m
    }
    let newTarget = `/docs/${rel}`
    if (anchor) {
      if (pages.get(rel).has(anchor)) newTarget += `#${anchor}`
      else report.push(`${file}: "${target}" → ${newTarget} (anchor #${anchor} dropped, no such heading)`)
    }
    changed++
    return `{{< ${kind} "${newTarget}" >}}`
  })
  for (const m of next.matchAll(/\{\{<\s*glossary\s+"([^"]+)"/g)) {
    const id = m[1].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    if (!pages.get('reference/glossary.md').has(id)) report.push(`${file}: glossary term "${m[1]}" has no heading #${id}`)
  }
  if (next !== src && !dryRun) writeFileSync(file, next)
}

console.log(`${changed} links ${dryRun ? 'would be ' : ''}retargeted`)
if (report.length) console.log(`\n${report.length} to review:\n  ` + report.join('\n  '))
