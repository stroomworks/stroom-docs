#!/usr/bin/env node
/**
 * One-shot migration: the restructured documentation, written in Markdoc for the
 * stroomworks-website, → Hugo pages under content/en/docs/.
 *
 *   node scripts/docs/migrate-from-markdoc.mjs [--dry-run]
 *
 *   MARKDOC_DOCS    the Markdoc docs tree     (default reference/stroomworks-website/content/docs)
 *   MARKDOC_MEDIA   its screenshots           (default reference/stroomworks-website/public/media)
 *   MARKDOC_DIAGRAMS its SVG diagrams         (default reference/stroomworks-website/content/docs-diagrams)
 *
 * Kept in the repository as the record of how the restructure was brought in, in the same
 * way the website keeps its own convert-stroom-docs.mjs. It is not part of the build.
 *
 * The conversion itself is lib/markdoc-to-hugo.mjs, shared with gen-docs-reference.mjs.
 * This script adds the parts that only make sense once:
 *
 *   · aliases, so every URL the old content/en/docs tree had redirects to the page that
 *     now holds its material (the rules below are the website's upstream-coverage map)
 *   · figures, copied into assets/images/ beside the page that uses them; the diagrams
 *     take their colours from CSS custom properties on the website, so the light-theme
 *     values are written into each SVG, which an <img> cannot otherwise reach
 *
 * Exits non-zero, listing every problem, if any link points at nothing or any tag is not
 * understood. Nothing is written in that case.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { convertBody, hugoFrontMatter, parseFrontMatter } from './lib/markdoc-to-hugo.mjs'

const dryRun = process.argv.includes('--dry-run')
const SRC = resolve(process.env.MARKDOC_DOCS ?? 'reference/stroomworks-website/content/docs')
const MEDIA = resolve(process.env.MARKDOC_MEDIA ?? 'reference/stroomworks-website/public/media')
const DIAGRAMS = resolve(process.env.MARKDOC_DIAGRAMS ?? 'reference/stroomworks-website/content/docs-diagrams')
const DEST = resolve('content/en/docs')
const IMAGES = resolve('assets/images')
const DATE = process.env.DOCS_DATE ?? new Date().toISOString().slice(0, 10)

/**
 * Corrections to the source, applied before conversion. Each is a slip that renders the
 * same way on the website (Markdoc joins the lines too), but which one sentence per line
 * makes visible: a label or a statement with no full stop runs into the next sentence.
 */
const SOURCE_FIXES = {
  'concepts/intro-pipeline-elements.md': (t) =>
    t
      .replace('1. Prepare your XML Data\n', '1. **Prepare your XML data.**\n')
      .replace('1. Configure the Pipeline\n', '1. **Configure the pipeline.**\n'),
  // The pattern letter notes are adapted from Java's DateTimeFormatter, one statement per
  // line with the full stops lost.
  'reference/dates.md': (t) =>
    t.replace(/^((?:\* \*\*[^*\n]+\*\*: |  )[A-Z][^\n]*[A-Za-z0-9`)])$/gm, '$1.'),
  // The docs root: a new reader is pointed at Get started, which the source predates.
  '_index.md': (t) =>
    t
      .replace(/^order: 0$/m, 'order: 20')
      .replace(
        'Start with **[Concepts](concepts/_index.md)** if Stroom is new to you:',
        'New to Stroom? **[Get started](get-started/_index.md)** takes you from installing it to a ' +
          'working dashboard. Then read **[Concepts](concepts/_index.md)**:',
      )
      // Kept from this site's own docs root: which version this copy of the docs is for.
      .replace(
        /(\n---\n)/,
        '$1\n> Applicable Stroom version: "**{{< param "version" >}}**"  \n' +
          '> Documentation generated on: **{{< build-date >}}**  \n' +
          '> Documentation release version: **{{< build-version >}}**  \n' +
          '>  \n' +
          '> To see the documentation for other versions of Stroom click the version drop-down at the top of the screen.\n',
      ),
}

/** Shorter sidebar names, where the title is too long to fit (style-guide/front-matter.md). */
const LINK_TITLES = {
  'guides/translating/data-splitter/complex-example.md': 'Complex Example',
}

/** The page this site's docs root carries regardless of what the source's says. */
const ROOT_EXTRA_FRONT_MATTER = ['menu:', '  main:', '    weight: 20']

/* ------------------------------------------------------------------- aliases */

/**
 * Where each page of the old content/en/docs tree went. Matched in order, first wins.
 * Adapted from the website's scripts/check-upstream-coverage.mjs, which is the record of
 * those decisions; `where` is a page of the new tree.
 */
const RULES = [
  // ---- one old page, one new page: more specific than the section rules below
  { match: /^reference-section\/documents\.md$/, where: 'reference/documents.md' },
  { match: /^reference-section\/jobs\.md$/, where: 'reference/jobs.md' },
  { match: /^reference-section\/pipeline-elements\.md$/, where: 'reference/pipeline-elements.md' },
  { match: /^user-guide\/concepts\/streams\.md$/, where: 'concepts/streams.md' },
  { match: /^user-guide\/indexing\/elasticsearch\//, where: 'guides/indexing/elasticsearch.md' },
  { match: /^user-guide\/indexing\/solr\.md$/, where: 'guides/indexing/solr.md' },
  { match: /^user-guide\/indexing\/lucene\.md$/, where: 'guides/indexing/building-an-index.md' },
  { match: /^user-guide\/search\/dashboards\//, where: 'guides/searching/building-a-dashboard.md' },
  { match: /^user-guide\/search\/dictionaries\.md$/, where: 'concepts/dictionary.md' },
  { match: /^user-guide\/search\/data-sources\/elastic-data-source\.md$/, where: 'guides/indexing/elasticsearch.md' },
  { match: /^user-guide\/search\/data-sources\/lucene-data-source\.md$/, where: 'concepts/lucene-index.md' },
  { match: /^user-guide\/api\/.+/, where: 'guides/automation/rest-api.md' },
  { match: /^user-guide\/pipelines\/reference-data\.md$/, where: 'guides/reference-data/_index.md' },
  { match: /^user-guide\/pipelines\/xslt\/xslt-functions\.md$/, where: 'reference/xslt-functions/_index.md' },
  { match: /^HOWTOs\/ReferenceFeeds\//, where: 'guides/reference-data/building-a-reference-feed.md' },
  { match: /^HOWTOs\/Search\/elasticsearch\.md$/, where: 'guides/indexing/elasticsearch.md' },
  { match: /^HOWTOs\/Search\/solr\.md$/, where: 'guides/indexing/solr.md' },
  { match: /^HOWTOs\/Search\/stroom-api\.md$/, where: 'guides/automation/rest-api.md' },
  { match: /^HOWTOs\/EventFeeds\/translation-how-to\.md$/, where: 'guides/translating/writing-a-translation.md' },
  { match: /^HOWTOs\/Authentication\//, where: 'operate/users-and-permissions.md' },
  { match: /^HOWTOs\/General\/EnablingProcessorsHowTo\.md$/, where: 'concepts/processing.md' },
  { match: /^HOWTOs\/General\/FeedManagementHowTo\.md$/, where: 'concepts/feed.md' },
  { match: /^install-guide\/air-gapped\.md$/, where: 'operate/install/air-gapped.md' },
  { match: /^install-guide\/setup\/(open-id|securing-stroom)/, where: 'operate/security-setup.md' },
  { match: /^install-guide\/configuration\//, where: 'operate/configuration.md' },

  // ---- sections: where the bulk of each old section went
  { match: /^glossary(\.md|\/)/, where: 'reference/glossary.md' },
  { match: /^quick-start-guide\//, where: 'get-started/_index.md' },
  // Not converted (the docs say what Stroom needs and leave delivery to the estate), but
  // an old bookmark is better landing on the install section than on nothing.
  { match: /^install-guide\/kubernetes\//, where: 'operate/install/_index.md' },
  { match: /^install-guide\//, where: 'operate/install/_index.md' },
  { match: /^HOWTOs\/Install\//, where: 'operate/install/_index.md' },
  { match: /^proxy\//, where: 'operate/install/a-proxy.md' },
  { match: /^architecture\//, where: 'concepts/nodes-and-clusters.md' },
  { match: /^sending-data\/example-clients\//, where: 'guides/sending-data/connecting-a-shipper/_index.md' },
  { match: /^sending-data\//, where: 'reference/the-datafeed-contract.md' },
  { match: /^user-guide\/data-receipt\//, where: 'concepts/data-receipt.md' },
  { match: /^user-guide\/data-splitter\//, where: 'guides/translating/data-splitter/_index.md' },
  { match: /^user-guide\/pipelines\/xslt\/xslt-functions\//, where: 'reference/xslt-functions/_index.md' },
  { match: /^user-guide\/pipelines\//, where: 'guides/translating/_index.md' },
  { match: /^user-guide\/indexing\//, where: 'guides/indexing/_index.md' },
  { match: /^user-guide\/search\/analytics\//, where: 'guides/detection/analytic-rules.md' },
  { match: /^user-guide\/search\//, where: 'guides/searching/_index.md' },
  { match: /^user-guide\/content\//, where: 'guides/content-management.md' },
  { match: /^user-guide\/api\//, where: 'guides/automation/_index.md' },
  { match: /^user-guide\/security\//, where: 'operate/security-setup.md' },
  { match: /^user-guide\/jobs\//, where: 'reference/jobs.md' },
  { match: /^user-guide\/concepts\//, where: 'concepts/_index.md' },
  { match: /^user-guide\/tools\//, where: 'guides/automation/command-line.md' },
  { match: /^user-guide\/(properties|nodes)\.md$/, where: 'operate/nodes-and-jobs.md' },
  { match: /^user-guide\/volumes\.md$/, where: 'concepts/volumes.md' },
  { match: /^user-guide\/feeds\.md$/, where: 'concepts/feed.md' },
  { match: /^user-guide\/data-retention\.md$/, where: 'operate/resetting/_index.md' },
  { match: /^user-guide\/viewing-data\.md$/, where: 'concepts/streams.md' },
  { match: /^user-guide\/processing-profiles\.md$/, where: 'concepts/processing.md' },
  { match: /^user-guide\/_index\.md$/, where: '_index.md' },
  { match: /^user-guide\//, where: 'guides/_index.md' },
  { match: /^reference-section\/expressions\//, where: 'reference/expression-functions.md' },
  { match: /^reference-section\//, where: 'reference/_index.md' },
  { match: /^HOWTOs\//, where: 'guides/_index.md' },
  { match: /^_index\.md$/, where: null }, // the docs root is still the docs root
]

/** content/en/docs-relative path → the URL Hugo gave it (lower-cased, trailing slash). */
const urlOf = (rel) =>
  ('/docs/' + rel.replace(/(^|\/)_index\.md$/, '$1').replace(/\.md$/, '/')).toLowerCase().replace(/\/+$/, '/')

/** The old tree, read from git so that it does not matter whether it is still on disk. */
function oldPages() {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', 'content/en/docs'], { encoding: 'utf8' })
  return out
    .split('\n')
    .filter((p) => p.endsWith('.md'))
    .map((p) => p.slice('content/en/docs/'.length))
}

/**
 * The redirect target for each old page. Where a new page records the old one it was
 * adapted from (`source`), that wins over the coverage rules.
 */
function aliasMap(newPages) {
  const bySource = new Map()
  for (const [rel, { meta }] of newPages)
    if (meta.source) bySource.set(meta.source.replace(/^en\/docs\//, ''), rel)

  const aliases = new Map()
  const unmapped = []
  for (const old of oldPages()) {
    const where = bySource.get(old) ?? RULES.find((r) => r.match.test(old))?.where
    if (where === null) continue
    if (!where) {
      unmapped.push(old)
      continue
    }
    if (!newPages.has(where)) throw new Error(`alias rule for ${old} points at ${where}, which is not a page`)
    const url = urlOf(old)
    if (url === urlOf(where)) continue
    if (!aliases.has(where)) aliases.set(where, new Set())
    aliases.get(where).add(url)
  }
  // An alias may not shadow a real page.
  const realUrls = new Set([...newPages.keys()].map(urlOf))
  for (const [where, set] of aliases) for (const u of set) if (realUrls.has(u)) set.delete(u)
  return { aliases, unmapped }
}

/* ------------------------------------------------------------------- figures */

/** Light-theme values of the website tokens the diagrams use. */
const DIAGRAM_STYLE =
  '<style>svg{--bg:#ffffff;--surface-2:#eef1f5;--hair-strong:#c6ccd6;--fg:#14161a;' +
  '--fg-muted:#576070;--fg-faint:#646d7c;--accent:#bb4b00;--accent-tint:#fff1e6;' +
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;' +
  'background:#ffffff}</style>'

function figureCopier(pageRel, pending) {
  // assets/images/<page path without .md>/, as style-guide/using-images.md asks.
  const dir = pageRel.replace(/(^|\/)_index\.md$/, '$1').replace(/\.md$/, '').replace(/\/$/, '')
  return ({ capture, diagram }) => {
    const name = capture ?? diagram
    if (!name) return null
    const from = capture ? join(MEDIA, capture) : join(DIAGRAMS, diagram)
    if (!existsSync(from)) return null
    const to = join(IMAGES, dir, name)
    pending.push(() => {
      mkdirSync(dirname(to), { recursive: true })
      if (capture) copyFileSync(from, to)
      else {
        const svg = readFileSync(from, 'utf8').replace(/<svg\b[^>]*>/, (tag) => `${tag}\n  ${DIAGRAM_STYLE}`)
        writeFileSync(to, svg)
      }
    })
    return posix.join(dir, name)
  }
}

/* ---------------------------------------------------------------------- main */

function* walk(dir) {
  for (const e of readdirSync(dir).sort()) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (e.endsWith('.md')) yield p
  }
}

const pages = new Map()
for (const file of walk(SRC)) {
  const rel = relative(SRC, file).split('\\').join('/')
  let text = readFileSync(file, 'utf8')
  if (SOURCE_FIXES[rel]) {
    const fixed = SOURCE_FIXES[rel](text)
    if (fixed === text) throw new Error(`SOURCE_FIXES for ${rel} no longer changes anything; remove it`)
    text = fixed
  }
  pages.set(rel, parseFrontMatter(text, rel))
}

const { aliases, unmapped } = aliasMap(pages)
const problems = unmapped.map((p) => `old page content/en/docs/${p} matches no alias rule`)
const pending = []
const outputs = []

for (const [rel, { meta, body }] of pages) {
  const pageDir = posix.dirname(rel)
  const ctx = {
    file: rel,
    problems,
    figure: figureCopier(rel, pending),
    resolveLink: (target) => {
      const [path] = target.split('#')
      if (!path.endsWith('.md')) return null
      const abs = posix.normalize(posix.join(pageDir, path))
      return pages.has(abs) ? target : null
    },
  }
  let fm = hugoFrontMatter(meta, { date: DATE, aliases: [...(aliases.get(rel) ?? [])].sort(), linkTitle: LINK_TITLES[rel] })
  if (rel === '_index.md') fm = fm.replace(/\n---\n$/, '\n' + ROOT_EXTRA_FRONT_MATTER.join('\n') + '\n---\n')
  outputs.push([join(DEST, rel), fm + convertBody(body, ctx)])
}

if (problems.length) {
  console.error(`${problems.length} to fix:\n  ` + problems.join('\n  '))
  process.exit(1)
}

const aliasCount = [...aliases.values()].reduce((n, s) => n + s.size, 0)
if (dryRun) {
  console.log(`dry run: ${outputs.length} pages, ${pending.length} figures, ${aliasCount} aliases`)
  process.exit(0)
}
for (const [to, text] of outputs) {
  mkdirSync(dirname(to), { recursive: true })
  writeFileSync(to, text)
}
for (const copy of pending) copy()
console.log(`${outputs.length} pages, ${pending.length} figures, ${aliasCount} aliases → ${relative('.', DEST)}`)
