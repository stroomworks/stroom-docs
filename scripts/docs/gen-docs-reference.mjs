#!/usr/bin/env node
/**
 * Generates the Reference pages that mirror Stroom's source.
 *
 *   STROOM_SRC=../stroom node scripts/docs/gen-docs-reference.mjs
 *
 *   STROOM_SRC        a checkout of the Stroom source, at the version these docs describe
 *                     (default ../stroom)
 *   STROOM_DOCS_JSON  document type descriptions (default data/stroom/documents.json)
 *   DOCS_DATE         the date written into a page that changed (default today)
 *
 * Writes, into content/en/docs/reference/:
 *   documents.md             every document type, by group
 *   jobs.md                  every scheduled job
 *   response-codes.md        every datafeed status code
 *   pipeline-elements.md     every pipeline element and its properties
 *   expression-functions.md  every dashboard and StroomQL function
 *   configuration-properties.md  every configuration property and its default
 *
 * plus the element to icon map in layouts/shortcodes/pipe-elm.html (between the
 * GENERATED CONTENT markers) and the element and document type icons in
 * assets/images/stroom-ui/. The rest of Stroom's icon set is refreshed by
 * update_stroom_icons.sh.
 *
 * HUGO. The page builders below write Markdoc, as they do in the stroomworks-website
 * generator this was ported from, and every page then goes through
 * lib/markdoc-to-hugo.mjs: the same conversion the rest of the docs were migrated with.
 * So a generated page follows the house style (front matter, one sentence per line,
 * relref links, pipe-elm and note shortcodes) without the builders knowing about it, and
 * the two generators stay easy to compare. A page keeps its aliases across a re-run, and
 * keeps its date unless its content changed.
 *
 * WHY GENERATED. These pages are lists the source already holds, and a
 * hand-maintained copy of a list rots: upstream's `response-codes.md` documents 8 of the
 * 26 codes that exist, and its `jobs.md` is missing at least six jobs including both Plan
 * B ones. Transcribing them again would buy the same problem. Re-run this when the
 * Stroom version these docs describe moves.
 *
 * The output is committed, so the Hugo build (and CI) never needs the Stroom source.
 *
 * PROVENANCE. Everything here is read from the Stroom source, except the document type
 * descriptions, which the source does not carry: those come from
 * `data/stroom/documents.json`, which Stroom itself generates. That file is older than
 * the branch, so newer types have no description and are marked as such rather than
 * being given one we invented.
 */

import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { sentenceCase } from './lib/sentence-case.mjs'
import { convertBody, hugoFrontMatter, parseFrontMatter } from './lib/markdoc-to-hugo.mjs'

const SRC = resolve(process.env.STROOM_SRC ?? '../stroom')
const DOCS_JSON = resolve(process.env.STROOM_DOCS_JSON ?? 'data/stroom/documents.json')
const DOCS = resolve('content/en/docs')
const OUT = join(DOCS, 'reference')
const IMAGES = resolve('assets/images')
const ICON_OUT = resolve('assets/images/stroom-ui')
const PIPE_ELM = resolve('layouts/shortcodes/pipe-elm.html')
const DATE = process.env.DOCS_DATE ?? new Date().toISOString().slice(0, 10)

if (!statSync(SRC, { throwIfNoEntry: false })?.isDirectory())
  throw new Error(`No Stroom source at ${SRC}. Set STROOM_SRC to a checkout of Stroom.`)

/** Every .java file under a directory, for the brute-force scans below. */
function javaFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    // .claude holds agent worktrees, whole second copies of the tree; content-cache holds
    // downloaded content packs. Neither is the source these docs describe.
    if (['build', '.git', 'node_modules', '.claude', 'content-cache'].includes(entry)) continue
    const full = join(dir, entry)
    // A dangling symlink has nothing to read.
    const st = statSync(full, { throwIfNoEntry: false })
    if (!st) continue
    if (st.isDirectory()) javaFiles(full, out)
    else if (entry.endsWith('.java') && !full.includes('/test/')) out.push(full)
  }
  return out
}

/**
 * Finds exactly one source file by its path suffix.
 *
 * Taking the first match would have been wrong: the tree holds two `StroomStatusCode.java`
 * files, and the one that turns up first is an unreferenced legacy copy carrying 10 of the
 * 26 codes. Generating from it produced a page that looked complete and was not, which is
 * precisely the failure this generator exists to prevent. So: name the path, and refuse to
 * guess.
 */
function findOne(files, suffix) {
  const matches = files.filter((f) => f.endsWith(suffix))
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) throw new Error(`No source file matching "${suffix}".`)
  throw new Error(
    `"${suffix}" matches ${matches.length} files:\n  ${matches.join('\n  ')}\n` +
      `Name the one that is authoritative rather than letting the scan pick.`,
  )
}

const FRONT_MATTER = (title, order, summary) =>
  `---\ntitle: ${title}\norder: ${order}\nsummary: ${summary}\nkind: reference\n---\n`

/** The body of a named class, by brace matching — slicing a fixed span runs into the next one. */
function classBody(src, cls) {
  const m = new RegExp(`(?:class|interface|enum)\\s+${cls}\\b`).exec(src)
  if (!m) return ''
  const b = src.indexOf('{', m.index)
  return b < 0 ? '' : (balanced(src, b, '{', '}') ?? '')
}

/** Markdown table cells must not contain a bare pipe, and should not contain newlines. */
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim()

/* --------------------------------------------------------------- document types */

function documentTypes() {
  const src = readFileSync(
    findOne(javaFiles(SRC), 'stroom/docstore/shared/DocumentTypeRegistry.java'),
    'utf8',
  )

  // new DocumentType(DocumentTypeGroup.INDEXING, "FloorMap", "Floor Map", SvgImage.X)
  //
  // The icon separates two different things the registry holds. A handful of entries are
  // not documents anyone creates: they are Stroom's built-in queryable data sources
  // (the stream store, the task manager, index shards), registered so a dashboard can
  // select them. They all carry DOCUMENT_SEARCHABLE, and listing them beside Feed and
  // Pipeline as though you could create one would be misleading. They get their own
  // section instead, because they are worth knowing about.
  const types = [
    ...src.matchAll(
      /new DocumentType\(\s*DocumentTypeGroup\.(\w+),\s*"([^"]+)",\s*"([^"]+)",\s*SvgImage\.(\w+)/g,
    ),
  ].map((m) => ({ group: m[1], type: m[2], displayName: m[3], searchable: m[4] === 'DOCUMENT_SEARCHABLE' }))

  const deprecated = new Set(
    (/DEPRECATED_TYPES = Set\.of\(([^)]*)\)/.exec(src)?.[1] ?? '')
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''))
      .filter(Boolean),
  )

  // Descriptions, where the generated upstream data has one. Hugo shortcodes and links
  // are stripped: this is a one-line summary in a table, not a document.
  let described = {}
  try {
    described = JSON.parse(readFileSync(DOCS_JSON, 'utf8'))
  } catch {
    console.warn('  (no stroom-docs documents.json; generating without descriptions)')
  }
  const describe = (type) => {
    const raw = described[type.toLowerCase()]?.description
    if (!raw) return ''
    return raw
      .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .split('\n')[0]
      .trim()
  }

  const groups = new Map()
  const searchables = []
  for (const t of types) {
    if (deprecated.has(t.type)) continue
    if (['SYSTEM', 'STRUCTURE'].includes(t.group)) continue
    const row = { ...t, description: describe(t.type) }
    if (t.searchable) {
      searchables.push(row)
      continue
    }
    if (!groups.has(t.group)) groups.set(t.group, [])
    groups.get(t.group).push(row)
  }

  // DOC_NOTES must describe types that exist and are still undescribed upstream.
  const all = [...searchables, ...[...groups.values()].flat()]
  const byType = new Map(all.map((r) => [r.type, r]))
  const gone = Object.keys(DOC_NOTES).filter((t) => !byType.has(t))
  if (gone.length)
    throw new Error(
      `gen-docs-reference: DOC_NOTES describes document types that are not in the list: ` +
        `${gone.join(', ')}`,
    )
  const nowUpstream = Object.keys(DOC_NOTES).filter((t) => byType.get(t).description)
  if (nowUpstream.length)
    throw new Error(
      `gen-docs-reference: these types now carry an upstream description, so their ` +
        `DOC_NOTES entry is redundant and should be deleted: ${nowUpstream.join(', ')}`,
    )

  // House style is sentence case, and these headings come from SCREAMING_SNAKE source
  // names. Run them through the same rule the one-off pass used, so regenerating this
  // file does not quietly undo it.
  const title = (g) =>
    sentenceCase(g.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' '))
  let body = ''
  for (const [group, rows] of [...groups].sort()) {
    body += `\n## ${title(group)}\n\n| Document | Type | What it is |\n|---|---|---|\n`
    for (const r of rows.sort((a, b) => a.displayName.localeCompare(b.displayName))) {
      const described = r.description || DOC_NOTES[r.type]
      body += `| ${cell(r.displayName)} | \`${cell(r.type)}\` | ${cell(described) || '*Not yet described.*'} |\n`
    }
  }

  body +=
    `\n## Built-in data sources\n\n` +
    `These are not documents and you do not create them. Stroom registers them as types so ` +
    `that a dashboard or query can select them as a data source, alongside the indexes and ` +
    `stores you build yourself.\n\n| Data source | Type |\n|---|---|\n`
  for (const r of searchables.sort((a, b) => a.displayName.localeCompare(b.displayName)))
    body += `| ${cell(r.displayName)} | \`${cell(r.type)}\` |\n`

  const n = [...groups.values()].flat().length
  return (
    FRONT_MATTER(
      'Document types',
      30,
      `Every kind of document Stroom holds in its explorer tree, by group.`,
    ) +
    `\nStroom stores everything you create as a **document** in the explorer tree. There are ` +
    `${n} types, in ${groups.size} groups.\n\nThe **Type** column is the identifier used in ` +
    `exports, in the API, and anywhere a document is referred to by type rather than by name.\n` +
    body
  )
}

/**
 * Document types the upstream description file does not cover.
 *
 * Descriptions come from gchq/stroom-docs' `data/stroom/documents.json`, which is older
 * than this branch, so types added since have none. They still appear in Stroom's Explorer
 * for everyone to see, and a reference page that says "not yet described" against eight of
 * them answers nobody.
 *
 * Written here rather than guessed at render time, and checked against what the source
 * actually produces, so a type gaining an upstream description or disappearing fails
 * generation rather than leaving a stale note behind.
 */
const DOC_NOTES = {
  ReceiveDataRuleSet:
    'The rules that decide whether arriving data is received, rejected or silently ' +
    'dropped. One per system rather than one per feed.',
  Processor:
    "A pipeline's processing configuration. Created for you when you add a processor " +
    'filter, rather than something you make directly.',
  ProcessorFilter:
    'Selects which streams a pipeline processes. This is the document behind a row on a ' +
    "pipeline's Processors tab.",
  SqlTemporalStore:
    'A temporal key-value store held in the database, loaded from pipelines and editable ' +
    'in place. Used for facts that change over time and need correcting, including the ' +
    'facts behind a floor map.',
  FloorMapEventStore:
    'Holds the events a floor map draws, keyed by the entity they are about. Part of the ' +
    'floor map feature rather than a general-purpose store.',
  FloorMap:
    'A plan of a physical space with live events drawn on it. Reads one store for the ' +
    'shape of the site and another for what is happening on it.',
  Traces:
    'Holds trace data for the pathways feature, which turns traces into the routes ' +
    'entities take. Specialised rather than general-purpose.',
  AnnotationGroup:
    'Groups related annotations so an investigation spanning several events is worked as ' +
    'one thing.',
}

/* ------------------------------------------------------------------------- jobs */

/**
 * Editorial guidance per job: which group it belongs in, how many nodes should run it,
 * and why you might turn it off. The facts around it — name, description, schedule,
 * default state, whether it takes a cluster lock — all come from the source.
 *
 * `nodes` is one of:
 *   'cluster' — the job takes a cluster lock, so one node does the work at a time
 *   'every'   — the work is local to a node, so every node needs it
 *   'one'     — shared state and no lock, so one node is enough
 *
 * `nodes: 'cluster'` is checked against the source: if a job gains or loses its cluster
 * lock upstream and this map disagrees, generation fails rather than publishing a claim
 * about failover that is no longer true.
 */
const JOB_NOTES = {
  // ---- processing
  'Processor Task Creator': ['Processing', 'cluster',
    'The source of all pipeline processing. With it off, no new tasks are created and ' +
    'processing stops cluster-wide, however many workers are running.'],
  'Data Processor': ['Processing', 'every',
    'Runs the processing tasks this node claims. Off on a node, that node processes ' +
    'nothing; off on every node, tasks are created and queue up but no stream is ever ' +
    'processed, and nothing reports an error.'],
  'Processor Task Heartbeat': ['Processing', 'every',
    'Marks the tasks this node is working on as alive. Off, this node\'s running tasks ' +
    'look abandoned and another node will take them back and repeat the work.'],
  'Processor Task Reaper': ['Processing', 'cluster',
    'Recovers tasks from a node that died. Off, work in flight on a lost node is never ' +
    'picked up again and those streams are silently never processed.'],
  'Processor Task Retention': ['Processing', 'cluster',
    'Deletes finished task records. Off, the task table grows without limit and the ' +
    'processing screens get slower.'],
  'Processor Task Manager Release Old Queued Tasks': ['Processing', 'one',
    'Frees tasks queued by a master node that has gone. Only does anything when ' +
    '`claimTasksOnWorker` is off.'],
  'Processor Task Queue Statistics': ['Processing', 'one',
    'Records queue depth for monitoring. Safe to leave off if you do not chart it. Only ' +
    'does anything when `claimTasksOnWorker` is off.'],
  'Pipeline Destination Roll': ['Processing', 'every',
    'Closes and rolls this node\'s open output files on their schedule. Off, rolling ' +
    'destinations on this node stay open and downstream systems see nothing arrive.'],

  // ---- data lifecycle
  'Data Delete': ['Data lifecycle', 'cluster',
    'Does the real deletion of data already marked as deleted. Off, nothing is reclaimed ' +
    'and the volumes keep filling.'],
  'Policy Based Data Retention': ['Data lifecycle', 'cluster',
    'Applies your retention policy. Off, data is kept past its policy, which is usually a ' +
    'compliance question rather than a disk one.'],
  'Annotation Retention': ['Data lifecycle', 'cluster',
    'Removes annotations past their retention. Off, old annotations stay.'],
  'Attribute Value Data Retention': ['Data lifecycle', 'cluster',
    'Trims stored stream attribute values. Off, that table grows and attribute searches slow down.'],

  // ---- storage
  'File System Volume Status': ['Storage', 'cluster',
    'Refreshes how full each data volume is. Off, Stroom writes against stale free-space ' +
    'figures and can fill a volume it believes has room.'],
  'Orphan File Finder': ['Storage', 'cluster',
    'Reports files on disk with no metadata. A diagnostic: turn it on when you suspect ' +
    'the store and the database disagree, rather than leaving it running.'],
  'Orphan Meta Finder': ['Storage', 'cluster',
    'Reports metadata with no files behind it. The same diagnostic from the other side.'],

  // ---- indexing
  'Index Writer Flush': ['Indexing', 'every',
    'Commits this node\'s index writers to disk. Searches see new documents without it, ' +
    'but off, the Shards tab\'s Doc Count never updates and uncommitted documents are lost ' +
    'if the node stops without shutting down cleanly.'],
  'Index Writer Cache Sweep': ['Indexing', 'every',
    'Closes index writers this node has finished with. Off, the node holds file handles ' +
    'and memory it no longer needs.'],
  'Index Shard Retention': ['Indexing', 'one',
    'Marks shards past their retention as deleted. Off, old shards are kept and searched.'],
  'Index Shard Delete': ['Indexing', 'every',
    'Removes shard files already marked deleted from this node\'s disks. Off, the space ' +
    'is never returned.'],
  'Index Volume Status': ['Indexing', 'every',
    'Refreshes free space for the index volumes this node owns. Off, this node can fill ' +
    'an index volume it believes has room.'],
  'Solr Index Optimise': ['Indexing', 'cluster',
    'Compacts Solr indexes. Only relevant if you use Solr indexing.'],
  'Solr Index Retention': ['Indexing', 'cluster',
    'Applies deletion queries to Solr indexes. Only relevant if you use Solr indexing.'],

  // ---- state stores
  'Plan B Merge Processor': ['State stores', 'every',
    'Merges this node\'s incoming state batches into its shards. Off, state stores stop ' +
    'advancing and lookups return increasingly stale answers.'],
  'Plan B Maintenance Processor': ['State stores', 'every',
    'Applies condense and retention rules to this node\'s shards. Off, shards keep growing.'],
  'Plan B Snapshot Creator': ['State stores', 'every',
    'Publishes snapshots other nodes read. Off, readers fall back to older snapshots.'],
  'Plan B Snapshot Cleanup': ['State stores', 'every',
    'Deletes snapshots nothing is reading. Off, snapshot storage grows.'],
  'Plan B Shared FS Merge': ['State stores', 'cluster',
    'The shared-filesystem form of the merge. Only relevant with a shared file store.'],
  'Plan B Shared FS Housekeeping': ['State stores', 'every',
    'Clears orphaned directories and unused local copies from the shared store. Only ' +
    'relevant with a shared file store.'],

  // ---- reference data
  'Ref Data Off-heap Store Purge': ['Reference data', 'every',
    'Purges old reference loads from this node\'s own off-heap store. The store is per ' +
    'node, so a node where this is off keeps growing on disk whatever the others do.'],

  // ---- statistics
  'SQL Stats In Memory Flush': ['Statistics', 'every',
    'Writes this node\'s buffered statistics to the database. Off, this node\'s ' +
    'statistics are never recorded and are lost on restart.'],
  'SQL Stats Database Aggregation': ['Statistics', 'cluster',
    'Rolls fine-grained statistics up into coarser buckets. Off, the statistics tables ' +
    'grow quickly and statistic queries slow down.'],

  // ---- analytics and reporting
  'Analytic Executor: Table Builder': ['Analytics', 'one',
    'Builds the tables scheduled analytics query. On only if you use analytics.'],
  'Analytic Executor: Scheduled Query': ['Analytics', 'one',
    'Runs scheduled analytic queries. On only if you use analytics.'],
  'Analytic Execution History Retention': ['Analytics', 'one',
    'Trims the record of past analytic runs. On if you run analytics and want the history bounded.'],
  'Process Pathways': ['Analytics', 'cluster',
    'Turns trace data into pathways. On only if you use pathways.'],
  'Reports': ['Analytics', 'one',
    'Runs scheduled reports. On only if you have reports to run.'],

  // ---- content
  'Doc Store - Physical Delete': ['Content', 'one',
    'Really deletes documents left in the recycle state past their retention. Off, they ' +
    'stay and remain recoverable.'],
  'Reindex Content': ['Content', 'cluster',
    'Rebuilds the index behind "Find in content". Needed only on nodes serving the user ' +
    'interface, and on shared storage one node of any kind is enough.'],
  'Git Repo Push': ['Content', 'cluster',
    'Pushes content changes to a remote Git repository. On only if you have set one up.'],
  'Query History Clean': ['Content', 'one',
    'Trims saved query history. Off, the history table grows.'],

  // ---- identity
  'Account Maintenance': ['Identity', 'one',
    'Disables accounts that have gone unused. Only applies to the internal identity ' +
    'provider, and off means dormant accounts stay enabled.'],
  'Identity Key Rotation': ['Identity', 'one',
    'Rotates the token signing keys. Off, keys are never retired. Internal identity ' +
    'provider only.'],
  'Identity Token Purge': ['Identity', 'one',
    'Clears expired token rows. Housekeeping only: expired tokens are already refused ' +
    'on every read, so this reclaims space rather than enforcing anything.'],

  // ---- node and cluster
  'Node Status': ['Node and cluster', 'every',
    'Records this node\'s CPU and memory as internal statistics. Off, that node\'s figures ' +
    'stop while it carries on working.'],
  'Property Cache Reload': ['Node and cluster', 'every',
    'Picks up property changes made on another node. Off, this node keeps running on the ' +
    'values it started with and quietly behaves differently from the rest.'],
  'Java Heap Histogram Statistics': ['Node and cluster', 'every',
    'A deep JVM diagnostic that pauses the JVM while it runs. Leave it off unless you are ' +
    'chasing a memory problem and accept the pause.'],

  // ---- ingest and testing
  'S3 Event Notifications Poll': ['Receiving data', 'one',
    'Polls an AWS SQS queue for S3 event notifications. On only if you ingest from S3.'],
  'Data Generator': ['Receiving data', 'one',
    'Generates synthetic data into a feed. A testing aid: leave it off on a real system.'],
}

const NODE_SCOPE = {
  cluster: 'One at a time',
  every: 'Every node',
  one: 'One node',
}

function jobs() {
  const files = [...javaFiles(SRC)]
  const consts = stringConstants(files)
  const byClass = new Map()
  for (const f of files) {
    const n = f.split('/').pop().replace('.java', '')
    if (!byClass.has(n)) byClass.set(n, [])
    byClass.get(n).push(f)
  }

  const found = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    if (!src.includes('bindJobTo')) continue

    for (const m of src.matchAll(/\.bindJobTo\(\s*(\w+)\.class/g)) {
      // Skip a commented-out binding. Analytic Executor: Streaming is one, and listing it
      // sent readers looking for a job the Jobs screen does not have.
      const lineStart = src.lastIndexOf('\n', m.index) + 1
      if (src.slice(lineStart, m.index).trim().startsWith('//')) continue
      if (src.lastIndexOf('/*', m.index) > src.lastIndexOf('*/', m.index)) continue

      const seg = balanced(src, src.indexOf('(', m.index))

      // The name is a literal on most jobs and a constant on about a dozen. Reading only
      // literals is how the first version of this page came to be missing Data Delete,
      // Policy Based Data Retention and twelve others.
      const ref = /\.name\(([\w.]+)\)/.exec(seg)?.[1]
      const name =
        /\.name\("((?:[^"\\]|\\.)*)"\)/.exec(seg)?.[1] ??
        (ref ? consts.get(ref) ?? consts.get(ref.split('.').slice(-2).join('.')) : undefined)
      if (!name) throw new Error(`${file}: a job's name could not be resolved (${ref ?? '?'})`)

      const d = /\.description\(\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)\)/.exec(seg)?.[1]
      const wrapper = classBody(src, m[1])
      const ctor = new RegExp(`${m[1]}\\s*\\(([^)]*)\\)`).exec(wrapper)?.[1] ?? ''

      // A job holds a cluster lock if its own wrapper takes one, or the thing it calls
      // does. The interface is what gets injected and the lock lives in the Impl, so
      // both are checked — without that, Processor Task Creator reads as unlocked.
      let lock = /ClusterLockService/.test(wrapper)
      for (const [, type] of ctor.matchAll(/final\s+([A-Z]\w+)/g))
        for (const p of [...(byClass.get(type) ?? []), ...(byClass.get(`${type}Impl`) ?? [])])
          if (/ClusterLockService/.test(readFileSync(p, 'utf8'))) lock = true

      found.push({
        name,
        description: d ? d.match(/"(?:[^"\\]|\\.)*"/g).map((s) => JSON.parse(s)).join('') : '',
        cron: /\.cronSchedule\(/.test(seg),
        every: /\.frequencySchedule\("([^"]+)"\)/.exec(seg)?.[1] ?? null,
        enabled: !/\.enabled\(false\)/.test(seg),
        managed: !/\.managed\(false\)/.test(seg),
        lock,
      })
    }
  }

  // Distributed jobs are declared on their task factory rather than bound, and JobBootstrap
  // creates them disabled unless enableJobsOnBootstrap is set. Data Processor is one: the
  // first version of this page left out the job that does all pipeline processing.
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    const at = src.indexOf('@DistributedTaskFactoryDescription(')
    if (at === -1) continue
    const body = balanced(src, at + '@DistributedTaskFactoryDescription'.length)
    const ref = /jobName\s*=\s*([\w.]+)/.exec(body)?.[1]
    const name =
      /jobName\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(body)?.[1] ??
      (ref ? consts.get(ref) ?? consts.get(ref.split('.').slice(-2).join('.')) : undefined)
    if (!name) throw new Error(`${file}: a distributed job's name could not be resolved (${ref ?? '?'})`)
    found.push({
      name,
      description: annotationString(body, 'description', consts),
      cron: false,
      every: null,
      enabled: false,
      managed: true,
      lock: /ClusterLockService/.test(src),
    })
  }

  // Managed jobs are the ones the Jobs screen shows and a user can switch. The rest run
  // regardless and there is nothing to decide about them, so they are listed apart.
  const managed = [...new Map(found.filter((j) => j.managed).map((j) => [j.name, j])).values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  )
  const unmanaged = [...new Set(found.filter((j) => !j.managed).map((j) => j.name))].sort()

  // The map and the source must agree, both ways.
  const missing = managed.filter((j) => !JOB_NOTES[j.name]).map((j) => j.name)
  if (missing.length)
    throw new Error(
      `gen-docs-reference: these jobs have no entry in JOB_NOTES, so the page would list ` +
        `them with no guidance:\n  ${missing.join('\n  ')}`,
    )
  const names = new Set(managed.map((j) => j.name))
  const extra = Object.keys(JOB_NOTES).filter((n) => !names.has(n))
  if (extra.length)
    throw new Error(
      `gen-docs-reference: JOB_NOTES describes jobs that no longer exist:\n  ${extra.join('\n  ')}`,
    )
  for (const j of managed) {
    const [, nodes] = JOB_NOTES[j.name]
    if ((nodes === 'cluster') !== j.lock)
      throw new Error(
        `gen-docs-reference: "${j.name}" is marked ${nodes} in JOB_NOTES but the source ` +
          `says cluster lock = ${j.lock}. The upstream job changed; re-read it and update the note.`,
      )
  }

  const groups = new Map()
  for (const j of managed) {
    const [group] = JOB_NOTES[j.name]
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(j)
  }

  const ORDER = [
    'Receiving data', 'Processing', 'Data lifecycle', 'Storage', 'Indexing', 'State stores',
    'Reference data', 'Statistics', 'Analytics', 'Content', 'Identity', 'Node and cluster',
  ]
  const ordered = [...groups.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const unknownGroup = ordered.filter((g) => !ORDER.includes(g))
  if (unknownGroup.length)
    throw new Error(`gen-docs-reference: JOB_NOTES uses groups not in ORDER: ${unknownGroup.join(', ')}`)

  let body = ''
  for (const group of ordered) {
    body += `\n## ${group}\n\n| Job | What it does | Nodes | On by default |\n|---|---|---|---|\n`
    for (const j of groups.get(group)) {
      const [, nodes, why] = JOB_NOTES[j.name]
      body += `| **${cell(j.name)}** | ${cell(why)} | ${NODE_SCOPE[nodes]} | ${j.enabled ? 'Yes' : 'No'} |\n`
    }
  }

  body += `\n## Jobs you do not control\n\nThese run on every node and are not listed in the Jobs screen, because there is no ` +
    `useful reason to turn them off: ${unmanaged.map((n) => `**${n}**`).join(', ')}.\n`

  return (
    FRONT_MATTER(
      'Scheduled jobs',
      100,
      'Every background job Stroom runs, which nodes should run it, and what stops when it is off.',
    ) +
    `\nStroom does most of its work in scheduled background jobs: processing, retention, ` +
    `indexing, statistics and housekeeping are all jobs rather than things that happen by ` +
    `themselves. They are listed under **Monitoring** → **Jobs**, where each can be ` +
    `enabled, disabled and rescheduled.\n\n` +
    `There are **${managed.length}** jobs you can control, and ${unmanaged.length} more that ` +
    `always run.\n\n` +
    `{% callout type="warning" %}\n` +
    `A disabled job does not report anything. The work simply never happens, and the ` +
    `symptom turns up somewhere else entirely and much later: data that never merges, ` +
    `streams that are never retained, indexes that never flush, disks that never empty. ` +
    `Before investigating anything that looks like slowness or missing data, check this ` +
    `screen first.\n` +
    `{% /callout %}\n\n` +
    `{% callout type="note" %}\n` +
    `**On a new installation, pipeline processing is off.** *Processor Task Creator* ships ` +
    `disabled, and it is the job that turns processor filters into work; *Data Processor*, ` +
    `which does that work on each node, ships disabled too. Until both are ` +
    `enabled nothing is processed, however many worker nodes are running and however ` +
    `correct the pipelines are, and nothing says so. It is the first thing to check on a ` +
    `system that receives data happily but never processes any.\n` +
    `{% /callout %}\n\n` +
    `{% figure capture="StroomJobs.png" alt="The job list in Stroom, each job with a ` +
    `checkbox showing whether it is enabled and a description of what it does. Enabled ` +
    `jobs include Data Delete, Data Processor, Git Repo Push, Node Status, Processor Task ` +
    `Creator, Query History Clean and Account Maintenance." caption="The Jobs screen. The ` +
    `checkbox is the job's own switch; opening a row shows one like it per node, which is ` +
    `where the decision actually gets made." /%}\n\n` +
    `## How jobs and nodes fit together\n\n` +
    `Each node keeps its own switch for every job. The Jobs screen shows a row per job, ` +
    `which opens to a row per node, so "enabled" is really a decision per node rather than ` +
    `one for the cluster. A new node writes its own set of these rows when it first starts, ` +
    `taking each job's default, which is why a node added later comes up running everything ` +
    `the others do.\n\n` +
    `The **Nodes** column in the tables below says what to aim for.\n\n` +
    `{% figure diagram="job-node-scope.svg" alt="Three rows, each showing the same three ` +
    `nodes. Every node: all three run the job. One at a time: all three are enabled but ` +
    `one holds the cluster lock and the other two skip that turn. One node: one is ` +
    `enabled and the other two are off." caption="The three patterns. Only the third is ` +
    `a decision about which nodes to enable; the first two are enabled everywhere and ` +
    `differ in whether a lock decides who actually does the work." /%}\n\n` +
    `*   **Every node.** The job acts on the node it runs on: its caches, its open files, ` +
    `its share of the index, its own tasks. Turning it off on one node silently stops that ` +
    `part of the work on that node alone, which is the hardest kind of fault to spot: the ` +
    `cluster looks healthy and one node quietly misbehaves. Leave these on everywhere.\n` +
    `*   **One at a time.** The job takes a cluster lock, so although it is enabled ` +
    `everywhere only one node runs it at a time and the rest skip that turn. Leave these on ` +
    `everywhere too: the lock stops duplicate work, and having every node willing to run it ` +
    `means the work still happens when any one node is down. Narrowing one of these to a ` +
    `single node removes that cover without saving anything.\n` +
    `*   **One node.** The work is on shared state and takes no lock, so one node is enough. ` +
    `Leaving these on everywhere is safe rather than harmful (the work is repeated and ` +
    `mostly finds nothing to do), but on a large cluster it is needless database traffic, ` +
    `and confining them to a node or two is a reasonable tidy-up.\n\n` +
    `## Turning a job off\n\n` +
    `Most of these jobs are housekeeping, and the cost of switching one off is paid later ` +
    `rather than immediately: a table that grows, a disk that fills, an index that drifts ` +
    `out of date. The **What it does** column says what stops in each case.\n\n` +
    `Worth turning on deliberately: the analytics and reporting jobs, which do nothing ` +
    `until you use those features, and the two orphan finders, which are diagnostics to run ` +
    `when you suspect the data store and the database disagree.\n\n` +
    `Worth leaving off: **Data Generator**, which makes synthetic data, and ` +
    `**Java Heap Histogram Statistics**, which pauses the JVM while it runs.\n\n` +
    `{% callout type="note" %}\n` +
    `After changing a job, confirm it on the same screen: the node row shows its last run ` +
    `and its next scheduled run. A job that is enabled but whose last-run time does not ` +
    `move is a job that is failing rather than working, and the cause will be in that ` +
    `node's logs.\n` +
    `{% /callout %}\n` +
    body
  )
}

/* -------------------------------------------------- configuration properties */

/**
 * The full property tree with its default values, from the file Stroom's own
 * `GenerateExpectedYaml` test writes and commits. That file is the authority for *which*
 * properties exist and *what they default to*, which is exactly the half that is painful
 * to reconstruct from the Java: a default may be a field initialiser, a constant, or
 * assigned in a no-arg constructor.
 */
const EXPECTED_YAML = join(
  SRC,
  'stroom-config/stroom-config-app/src/test/resources/stroom/config/app/expected.yaml',
)

/** Flattens the expected YAML into `path -> default`, dropping the `appConfig` root. */
function configDefaults() {
  const text = readFileSync(resolve(EXPECTED_YAML), 'utf8')
  const stack = []
  const leaves = []
  const lines = text.split('\n')

  // A double-quoted scalar may wrap across lines: seventeen do, among them the AI prompts,
  // the HTML templates and a heap-histogram regex. Reading only the first line publishes a
  // truncated default, which is worse than publishing none, so these are consumed to their
  // closing quote and then reported as long rather than reproduced.
  const unterminated = (v) => v.startsWith('"') && (v.match(/(?<!\\)"/g) ?? []).length % 2 === 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue
    // Map keys may hold spaces and hyphens: metaTypeExtensions has `Raw Events`, and
    // receiptRulesInitialFields `X-Forwarded-For`. A narrower pattern dropped all eight.
    const m = /^(\s*)([A-Za-z0-9_][A-Za-z0-9_ -]*):(?:\s+(.*))?$/.exec(line)
    if (!m) continue
    const depth = m[1].length / 2
    stack.length = depth
    stack[depth] = m[2]
    m[3] ??= ''
    if (m[3] === '') {
      // A key with no value on its line is a branch, unless what follows is a block
      // sequence: `metaTypes:` then `- "Context"` and so on. Those are properties with a
      // list value, and treating them as branches dropped 35 of them from the page,
      // among them data.meta.metaTypes and the OpenID request scopes.
      //
      // An item may itself be a map, as each of statistics.internal's DocRefs is: `- type:`
      // with `uuid:` and `name:` indented beneath it. Those lines belong to the item, and
      // reading them as properties of their own published 32 rows that do not exist.
      const items = []
      let dash = -1
      let j = i + 1
      for (; j < lines.length; j++) {
        const l = lines[j]
        if (!l.trim()) continue
        const indent = l.length - l.trimStart().length
        if (/^\s*-\s/.test(l)) {
          dash = indent
          items.push([l.trim().replace(/^-\s*/, '')])
        } else if (dash >= 0 && indent > dash) items.at(-1).push(l.trim())
        else break
      }
      if (!items.length) continue
      leaves.push({
        path: stack.slice(1).join('.'),
        value: `[${items.map((it) => (it.length > 1 ? `{${it.join(', ')}}` : it[0])).join(', ')}]`,
        list: true,
      })
      i = j - 1
      continue
    }

    let value = m[3].trim()
    let wrapped = false
    while (unterminated(value) && i + 1 < lines.length) {
      i++
      wrapped = true
      value += lines[i].trim()
    }
    leaves.push({ path: stack.slice(1).join('.'), value, wrapped })
  }
  if (leaves.length < 900)
    throw new Error(
      `gen-docs-reference: only ${leaves.length} properties read from ${EXPECTED_YAML}. ` +
        `That file is generated and committed by Stroom's GenerateExpectedYaml test; if its ` +
        `shape has changed, this parser needs to change with it.`,
    )
  return leaves
}

/**
 * `path -> { description, restart }` by walking the config classes from AppConfig.
 *
 * Two things make this more than a regex over getters. Nested config objects give a
 * property its path, so the walk has to follow them; and most properties are inherited
 * (every module's `db` block comes from AbstractDbConfig), so superclasses have to be
 * followed too, or two thirds of the tree goes missing.
 */
function configDescriptions(files) {
  const byClass = new Map()
  for (const f of files) {
    const n = f.split('/').pop().replace('.java', '')
    if (!byClass.has(n)) byClass.set(n, [])
    byClass.get(n).push(f)
  }
  const consts = stringConstants(files)
  const cache = new Map()
  const sourceOf = (file) => {
    if (!cache.has(file)) cache.set(file, file ? readFileSync(file, 'utf8') : null)
    return cache.get(file)
  }
  /**
   * The file a class name refers to, from the file that names it. Several config class
   * names exist more than once (ActivityConfig, SearchConfig, EmailConfig), and taking the
   * first one found read the wrong class, so its settings came out undescribed. An import
   * decides it; failing that, the same package; failing that, the first.
   */
  const resolveClass = (cls, from) => {
    const fs = byClass.get(cls) ?? []
    if (fs.length < 2 || !from) return fs[0]
    const src = sourceOf(from)
    const imp = new RegExp(`^import\\s+([\\w.]+)\\.${cls}\\s*;`, 'm').exec(src)?.[1]
    const byImport = imp && fs.find((f) => f.endsWith(`/${imp.replace(/\./g, '/')}/${cls}.java`))
    return byImport ?? fs.find((f) => dirname(f) === dirname(from)) ?? fs[0]
  }

  /**
   * The getters of a class, each with the annotations that precede it.
   *
   * A scanner rather than a regex, because neither a regex nor a backwards scan is safe.
   * A lazy `(...)` group in front of a getter expands across the whole class, which gave
   * sixteen properties a neighbouring property's description; and scanning back to the
   * previous `;` lands inside any description containing one, losing the annotation
   * entirely. Both failures are silent and both put wrong text on a published page, so
   * parentheses and string literals are walked properly.
   */
  const GETTER_AT = /^public\s+(?:final\s+)?([\w<>,.[\] ]+?)\s+(?:get|is)([A-Z]\w*)\s*\(\s*\)/
  // An instance field. Many classes (UiConfig, PasswordPolicyConfig, the token and email
  // settings) put @JsonPropertyDescription on the field rather than the getter, and reading
  // getters alone marked about ninety described settings "Not described in the source".
  const FIELD_AT = /^(?:private|protected)\s+(?:final\s+)?([\w<>,.?[\] ]+?)\s+(\w+)\s*;/

  function gettersOf(src) {
    const out = []
    let i = 0
    let annStart = 0
    while (i < src.length) {
      const c = src[i]
      if (c === '@') {
        let j = i + 1
        while (j < src.length && /[\w.]/.test(src[j])) j++
        let k = j
        while (k < src.length && /\s/.test(src[k])) k++
        if (src[k] === '(') {
          const arg = balanced(src, k)
          i = arg === null ? k + 1 : k + arg.length + 2
        } else i = j
        continue
      }
      // Comments must be skipped before anything else. A javadoc containing a single
      // quote — 'the "License"' in a header, an apostrophe in prose — otherwise flips
      // string parity for the rest of the file, and every getter after it is swallowed.
      if (c === '/' && src[i + 1] === '/') {
        const end = src.indexOf('\n', i)
        i = end < 0 ? src.length : end + 1
        continue
      }
      if (c === '/' && src[i + 1] === '*') {
        const end = src.indexOf('*/', i + 2)
        i = end < 0 ? src.length : end + 2
        continue
      }
      if (c === '"') {
        if (src.startsWith('"""', i)) {
          const end = src.indexOf('"""', i + 3)
          i = end < 0 ? src.length : end + 3
        } else {
          i++
          while (i < src.length && src[i] !== '"') i += src[i] === '\\' ? 2 : 1
          i++
        }
        continue
      }
      if (c === "'") {
        // A char literal, which may hold a quote: '"'.
        i += src[i + 1] === '\\' ? 4 : 3
        continue
      }
      if (c === 'p') {
        const m = GETTER_AT.exec(src.slice(i))
        if (m) {
          out.push({ type: m[1].trim(), rest: m[2], anns: src.slice(annStart, i) })
          i += m[0].length
          annStart = i
          continue
        }
        const f = FIELD_AT.exec(src.slice(i))
        if (f) {
          const anns = src.slice(annStart, i)
          if (anns.includes('@JsonProperty'))
            out.push({ type: f[1].trim(), rest: f[2][0].toUpperCase() + f[2].slice(1), anns, field: true })
          i += f[0].length
          annStart = i
          continue
        }
      }
      if (c === ';' || c === '{' || c === '}') annStart = i + 1
      i++
    }
    return out
  }

  /**
   * A class's properties: its own getters plus those it inherits. Following superclasses
   * is not optional — every module's `db` block comes from AbstractDbConfig, so without
   * it two thirds of the tree goes missing.
   */
  const members = (cls, file, depth = 0) => {
    const src = sourceOf(file)
    if (!src || depth > 4) return []
    const out = []
    const ext = new RegExp(`class\\s+${cls}\\b[^{]*?\\bextends\\s+([A-Z]\\w+)`).exec(src)
    if (ext && byClass.has(ext[1])) out.push(...members(ext[1], resolveClass(ext[1], file), depth + 1))

    // Constants in a description are resolved, preferring the class's own: dropping them
    // left "before aborting the '' job" and "Valid values are \"\"".
    const local = scoped(consts, file)
    const fields = new Map()
    for (const { type, rest, anns, field } of gettersOf(src)) {
      const jp = /@JsonProperty\s*\(\s*(?:"([^"]+)"|([\w.]+))\s*\)/.exec(anns)
      const name =
        jp?.[1] ??
        (jp?.[2] ? constant(local, jp[2]) : null) ??
        rest[0].toLowerCase() + rest.slice(1)

      let description = ''
      const at = anns.indexOf('@JsonPropertyDescription')
      if (at >= 0) {
        const open = anns.indexOf('(', at)
        const arg = open < 0 ? null : balanced(anns, open)
        if (arg) description = stringExpr(arg, local)
      }
      const restart = /@RequiresRestart/.test(anns)

      if (field) fields.set(name, { description, restart })
      else out.push({ name, type, description, restart, values: enumValues(type, file) })
    }
    // A getter takes its field's description when it has none of its own.
    for (const m of out) {
      const f = fields.get(m.name)
      if (!f) continue
      m.description ||= f.description
      m.restart ||= f.restart
    }
    return out
  }

  /**
   * The constants of an enum-typed setting, so a row can say what values it takes:
   * data.store.fsyncMode's description named none of DISABLED, FILE_ONLY, DIR_ONLY or
   * ENABLED.
   */
  function enumValues(type, from) {
    if (!/^[A-Z]\w*$/.test(type)) return null
    const file = resolveClass(type, from)
    if (!file) return null
    const body = classBody(sourceOf(file), type)
    if (!new RegExp(`\\benum\\s+${type}\\b`).test(sourceOf(file))) return null
    // The constants run to the first `;`, or the end of the body.
    let head = body
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    // Constructor arguments may hold commas, so they go before the list is split.
    while (/\([^()]*\)/.test(head)) head = head.replace(/\([^()]*\)/g, '')
    head = head.split(';')[0]
    const names = [...head.matchAll(/(?:^|,)\s*(?:@\w+(?:\([^)]*\))?\s*)*([A-Z][A-Z0-9_]*)\b/g)].map((m) => m[1])
    return names.length ? names : null
  }

  const found = new Map()
  const seen = new Set()
  const walk = (file, cls, path, depth) => {
    if (depth > 8 || seen.has(`${file}|${path}`)) return
    seen.add(`${file}|${path}`)
    for (const m of members(cls, file)) {
      const p = path ? `${path}.${m.name}` : m.name
      const bare = m.type.replace(/<.*>/, '').trim()
      // A nested config is recorded as well as walked: one left unset, such as
      // receive.s3Event.sqs, is a single row on the page and needs its description.
      found.set(p, m)
      if (/Config$/.test(bare) && byClass.has(bare)) walk(resolveClass(bare, file), bare, p, depth + 1)
    }
  }
  walk(findOne(files, 'stroom/config/app/AppConfig.java'), 'AppConfig', '', 0)
  return found
}

/**
 * The database block carries no `@JsonPropertyDescription` upstream, and it is the part of
 * the file people actually edit, so saying "not described in the source" thirteen times
 * would fail the reader at exactly the wrong moment.
 *
 * These are standard JDBC and HikariCP connection-pool settings, described as such. The
 * generator checks this map against the names the source actually produces, so a name
 * appearing or disappearing upstream fails generation rather than publishing silently.
 */
const DB_NOTES = {
  'connection.jdbcDriverClassName':
    'The JDBC driver class. Leave it unset unless you are using a driver Stroom does not ' +
    'already know about.',
  'connection.jdbcDriverUrl':
    'The JDBC URL of the database, including host, port and schema. One of the few settings ' +
    'that genuinely belongs in the file rather than the user interface.',
  'connection.jdbcDriverUsername': 'The user Stroom connects to the database as.',
  'connection.jdbcDriverPassword':
    'That user\'s password. Treat the file as a secret once this is in it, or supply it ' +
    'through your deployment\'s own secret handling.',
  'connectionPool.maxPoolSize':
    'The most connections this module will open. Every module has its own pool, so the ' +
    'database must allow for the total across all of them and across every node, which is ' +
    'the usual cause of running out of connections.',
  'connectionPool.minimumIdle':
    'How many connections are kept open while idle. Raising it trades a little database ' +
    'memory for not paying connection setup under sudden load.',
  'connectionPool.connectionTimeout':
    'How long a request waits for a free connection before failing. Raising it hides pool ' +
    'exhaustion rather than fixing it; the pool size is usually the real question.',
  'connectionPool.idleTimeout': 'How long an idle connection is kept before being closed.',
  'connectionPool.maxLifetime':
    'How long any connection is kept before being replaced. Keep it shorter than any idle ' +
    'timeout imposed by the database or a firewall, so Stroom retires connections before ' +
    'something else closes them underneath it.',
  'connectionPool.leakDetectionThreshold':
    'Logs a warning when a connection is held longer than this. Zero turns it off. A ' +
    'diagnostic for a pool that empties with no obvious cause.',
  'connectionPool.cachePrepStmts': 'Whether prepared statements are cached by the driver.',
  'connectionPool.prepStmtCacheSize': 'How many prepared statements are cached per connection.',
  'connectionPool.prepStmtCacheSqlLimit':
    'The longest statement that will be cached, in characters.',
}

/**
 * Notes added to a setting's own description, where the source's says too little for
 * these docs. Each is `[note, check]`: the check is run on the default, and generation
 * fails when it no longer holds, so a note cannot outlive the fact it describes.
 */
const CONFIG_NOTES = {
  'ui.helpUrl': [
    "The default is the upstream (gchq) Stroom documentation, not these pages, so Stroom's " +
      'Help menu and help links open that site unless this is changed. The `helpSubPath*` ' +
      'settings are paths on that site.',
    (v) => /gchq\.github\.io/.test(v),
  ],
  'data.store.fsyncMode': [
    'Replaced the true/false `fsyncEnabled` in Stroom 7.14, so a configuration file that ' +
      'sets `fsyncEnabled` needs changing.',
  ],
}

/** The two shapes that repeat across modules, explained once instead of hundreds of times. */
const isDbBoilerplate = (p) => /(^|\.)db\.(connection|connectionPool)\./.test(p)
const isCacheBoilerplate = (p) =>
  /\.(expireAfterWrite|expireAfterAccess|refreshAfterWrite|maximumSize|statisticsMode)$/.test(p)

/**
 * `"PT30S"` reads better as `PT30S`, and an unset value reads better than `null`.
 *
 * Long defaults — prompts, HTML templates, skeleton config files — are reported as long
 * rather than reproduced: pasted into a table cell they destroy the table and still cannot
 * be read, and a truncated one would be wrong.
 */
const MAX_DEFAULT = 90
const defaultCell = (v, wrapped) => {
  if (v === 'null') return '*unset*'
  if (v === '{}' || v === '[]') return '*empty*'
  if (v.startsWith('[') && v.endsWith(']')) {
    const items = v.slice(1, -1)
    if (!items) return '*empty*'
    // A comma-separated list stays readable at more than the single-value limit, and
    // these lists are usually the interesting part of the setting.
    const pretty = items.replace(/"/g, '').replace(/\|/g, '\\|')
    return pretty.length > MAX_DEFAULT * 2 ? '*A long value; see the file.*' : `\`${pretty}\``
  }
  // A double-quoted YAML scalar is escaped: the file's `^stroom\\..*$` is the regex
  // `^stroom\..*$`, and showing the escaped form would give anyone who pastes it into the
  // Properties screen a different regex.
  const unquoted = /^"([\s\S]*)"$/.exec(v)?.[1]?.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t' })[c] ?? c)
  if (unquoted === '') return '*empty*'
  const text = unquoted ?? v
  if (text.includes('\n')) return '*A long value; see the file.*'
  if (wrapped || text.length > MAX_DEFAULT) return '*A long value; see the file.*'
  return `\`${text.replace(/\|/g, '\\|')}\``
}

function configurationProperties() {
  const files = [...javaFiles(SRC)]
  const leaves = configDefaults()
  const described = configDescriptions(files)

  const real = leaves.filter((l) => !isDbBoilerplate(l.path) && !isCacheBoilerplate(l.path))
  const dbShape = new Map()
  for (const l of leaves.filter((l) => isDbBoilerplate(l.path))) {
    const short = l.path.replace(/^.*?\bdb\./, '')
    if (!dbShape.has(short))
      dbShape.set(short, { value: l.value, wrapped: l.wrapped, meta: described.get(l.path) })
  }
  const cacheShape = new Map()
  const caches = new Set()
  for (const l of leaves.filter((l) => isCacheBoilerplate(l.path))) {
    const short = l.path.split('.').pop()
    if (!cacheShape.has(short)) cacheShape.set(short, { meta: described.get(l.path) })
    caches.add(l.path.split('.').slice(0, -1).join('.'))
  }

  const sections = new Map()
  for (const l of real) {
    const top = l.path.split('.')[0]
    if (!sections.has(top)) sections.set(top, [])
    sections.get(top).push(l)
  }

  const restartCount = real.filter((l) => described.get(l.path)?.restart).length

  const noted = Object.keys(CONFIG_NOTES).filter((p) => !real.some((l) => l.path === p))
  if (noted.length)
    throw new Error(`gen-docs-reference: CONFIG_NOTES names settings that do not exist: ${noted.join(', ')}`)

  // A map's entries are keys of one setting, not settings the source describes one by one.
  // The first of each carries the map's own description.
  const introduced = new Set()
  let undescribed = 0
  const row = (path, label) => {
    const meta = described.get(path)
    // commonDbDetails and documentAssetDb are the same standard connection settings, but
    // at the top level rather than under a module's `db` key, so the boilerplate rule does
    // not catch them. They get the same notes rather than 26 rows saying "not described".
    const dbNote = DB_NOTES[label]
    const leaf = leaves.find((l) => l.path === path)
    const value = leaf?.value ?? 'null'
    const parent = path.split('.').slice(0, -1).join('.')
    const map = !meta && /^(?:java\.util\.)?Map\b/.test(described.get(parent)?.type ?? '') ? described.get(parent) : null
    let what
    if (meta?.description) what = cell(meta.description)
    else if (dbNote) what = cell(dbNote)
    else if (map) {
      what = `An entry in the \`${parent.split('.').pop()}\` map.`
      if (!introduced.has(parent) && map.description) what += ` ${cell(map.description)}`
      introduced.add(parent)
    } else {
      what = '*Not described in the source.*'
      undescribed++
    }
    if (meta?.values && !meta.values.every((v) => what.includes(v)))
      what += ` One of ${meta.values.map((v) => `\`${v}\``).join(', ')}.`
    if (CONFIG_NOTES[path]) {
      const [note, holds] = CONFIG_NOTES[path]
      if (holds && !holds(value))
        throw new Error(`gen-docs-reference: the CONFIG_NOTES entry for ${path} no longer holds (default ${value}); re-read it.`)
      what += ` ${cell(note)}`
    }
    if (meta?.restart) what += ' **Needs a restart.**'
    return `| \`${label}\` | ${defaultCell(value, leaf?.wrapped)} | ${what} |\n`
  }

  let body = ''
  body +=
    `\n## Settings every module's database block has\n\n` +
    `Each module keeps its own database settings under its own \`db\` key, so these ` +
    `${dbShape.size} names repeat for every one of them. They mean the same thing each time.\n\n` +
    `Setting them per module is only worth doing when a module genuinely needs its own ` +
    `connection behaviour. Otherwise set \`commonDbDetails\` once and leave these alone.\n\n` +
    `| Setting | Default | What it does |\n|---|---|---|\n`
  const dbMissing = [...dbShape.keys()].filter((k) => !DB_NOTES[k])
  const dbExtra = Object.keys(DB_NOTES).filter((k) => !dbShape.has(k))
  if (dbMissing.length || dbExtra.length)
    throw new Error(
      `gen-docs-reference: DB_NOTES and the source disagree.` +
        (dbMissing.length ? `\n  no note for: ${dbMissing.join(', ')}` : '') +
        (dbExtra.length ? `\n  note for a setting that no longer exists: ${dbExtra.join(', ')}` : ''),
    )
  for (const [short, { value, wrapped, meta }] of [...dbShape].sort()) {
    const what = meta?.description ? cell(meta.description) : cell(DB_NOTES[short])
    body += `| \`db.${short}\` | ${defaultCell(value, wrapped)} | ${what} |\n`
  }

  body +=
    `\n## Settings every cache has\n\n` +
    `There are ${caches.size} caches in the tree and they all take the same ` +
    `${cacheShape.size} settings. A cache entry is evicted when any limit it has is ` +
    `reached.\n\n` +
    `| Setting | What it does |\n|---|---|\n`
  for (const [short, { meta }] of [...cacheShape].sort()) {
    const what = meta?.description ? cell(meta.description) : '*Not described in the source.*'
    body += `| \`${short}\` | ${what} |\n`
  }

  body +=
    `\nThe caches themselves are listed below. Each takes the settings above, under its own ` +
    `key, so \`${[...caches][0]}.maximumSize\` is how the first one's size is set.\n\n` +
    [...caches].sort().map((c) => `*   \`${c}\``).join('\n') + '\n'

  body += `\n## Every other property\n\nBy section, as the file nests them.\n`
  for (const [top, rows] of [...sections].sort((a, b) => a[0].localeCompare(b[0]))) {
    body += `\n### ${top}\n\n| Property | Default | What it does |\n|---|---|---|\n`
    for (const l of rows.sort((a, b) => a.path.localeCompare(b.path)))
      body += row(l.path, l.path.split('.').slice(1).join('.') || l.path)
  }

  return (
    FRONT_MATTER(
      'Configuration properties',
      140,
      'Every Stroom setting in the configuration file, what it defaults to, and how to decide where to set it.',
    ) +
    `\nStroom reads its settings from a YAML file on each node. Most of them you will never ` +
    `touch; the ones you do are easier to get right knowing what the defaults already are.\n\n` +
    `This page covers Stroom itself. Stroom Proxy has its own configuration file, under ` +
    `\`proxyConfig\`, and its settings are not listed here: see ` +
    `[Running a Proxy](../operate/install/a-proxy.md).\n\n` +
    `There are **${leaves.length}** settings in total. ` +
    `${leaves.length - real.length} of those are the database and cache blocks that repeat ` +
    `for every module, so they are explained once below rather than ${leaves.length - real.length} ` +
    `times, leaving **${real.length}** distinct settings.\n\n` +
    `## Two names for the same setting\n\n` +
    `A setting has one name in the file and a different one on the **Properties** screen, ` +
    `and it catches everybody once.\n\n` +
    `In the file, everything here sits under the \`appConfig\` key:\n\n` +
    `\`\`\`yaml\nappConfig:\n  data:\n    store:\n      deletePurgeAge: "P7D"\n\`\`\`\n\n` +
    `On the Properties screen the same setting is called ` +
    `\`stroom.data.store.deletePurgeAge\`. Same setting, two spellings: **\`appConfig\` in ` +
    `the file, \`stroom\` in the user interface.** The paths in the tables below are written ` +
    `the way the file nests them.\n\n` +
    `## Deciding where to set it\n\n` +
    `A value in the file beats a value set in the user interface, which beats the default. ` +
    `That order has consequences worth understanding before you edit anything: see ` +
    `[Configuration](../operate/configuration.md).\n\n` +
    `The short version:\n\n` +
    `*   **Put it in the file** when it genuinely differs per node, such as paths and ports, ` +
    `or when it must be right before the database can be reached.\n` +
    `*   **Set it in the user interface** for everything else. It applies to the whole ` +
    `cluster and can be changed later without a deployment.\n\n` +
    `Putting a value in the file because it is the same everywhere is the common mistake: it ` +
    `works, and it puts that setting permanently out of reach of the user interface.\n\n` +
    `## Reading the tables\n\n` +
    `*   **Default** is what Stroom uses when you say nothing. *unset* means no value at ` +
    `all, which for most settings turns the feature off.\n` +
    `*   Settings marked **Needs a restart** are read once while a node starts. Changing ` +
    `one stores the new value without changing how the running node behaves. ` +
    `${restartCount} of the settings below are marked this way.\n` +
    (undescribed
      ? `*   ${undescribed} of the ${real.length} settings are marked *Not described in the ` +
        `source*. That is a gap upstream rather than something we have left out.\n\n`
      : '\n') +
    `## Value formats\n\n` +
    `| Kind | Written as | Example |\n|---|---|---|\n` +
    `| Duration | ISO-8601, or a number with a unit (\`ms\`, \`s\`, \`m\`, \`h\`, \`d\`) | \`PT30S\` or \`30s\` is thirty seconds, \`PT10M\` or \`10m\` ten minutes, \`P7D\` or \`7d\` seven days |\n` +
    `| Size | A number with a unit | \`32KiB\`, \`1GiB\` |\n` +
    `| Boolean | \`true\` or \`false\` | \`true\` |\n` +
    `| List | A YAML list | one \`- value\` per line |\n` +
    `| Unset | Omit it, or \`null\` | |\n\n` +
    `A duration with no unit at all is read as milliseconds, so \`30\` is thirty milliseconds, ` +
    `not thirty seconds. A value that fits neither form, such as \`T30S\`, is rejected ` +
    `rather than being quietly ignored.\n` +
    body
  )
}

/* -------------------------------------------------------------- response codes */

function responseCodes() {
  // stroom.proxy.StroomStatusCode, which is what the receive path imports. There is a
  // second, unreferenced copy under stroom-pipeline/writer carrying an older, shorter list.
  const src = readFileSync(findOne(javaFiles(SRC), 'stroom/proxy/StroomStatusCode.java'), 'utf8')

  // NAME(HttpServletResponse.SC_X, 123, "Message", "Reason"). Entries wrap across lines
  // freely and some put every argument on its own, so the whitespace between arguments is
  // matched as \s* rather than assuming any particular layout.
  const entries = [
    ...src.matchAll(
      /\n\s{4}([A-Z][A-Z_0-9]*)\(\s*HttpServletResponse\.(SC_\w+)\s*,\s*(\d+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"/g,
    ),
  ].map((m) => ({ name: m[1], http: m[2], code: Number(m[3]), message: m[4], reason: m[5] }))

  // The source is the list; if the scrape falls short of it, the page would be quietly
  // incomplete in exactly the way this generator exists to prevent.
  const declared = (src.match(/\n\s{4}[A-Z][A-Z_0-9]*\(/g) ?? []).length
  if (entries.length < declared)
    throw new Error(
      `StroomStatusCode: parsed ${entries.length} of ${declared} declared codes. ` +
        `The enum's shape has changed; fix the pattern rather than shipping a short list.`,
    )

  const HTTP = {
    SC_OK: 200,
    SC_UNAUTHORIZED: 401,
    SC_FORBIDDEN: 403,
    SC_NOT_ACCEPTABLE: 406,
    SC_REQUEST_ENTITY_TOO_LARGE: 413,
    SC_INTERNAL_SERVER_ERROR: 500,
  }

  let body = '\n| HTTP | `Stroom-Status` | Message | What it means |\n|---|---|---|---|\n'
  for (const e of entries.sort((a, b) => a.code - b.code))
    body += `| \`${HTTP[e.http] ?? e.http}\` | \`${e.code}\` | ${cell(e.message)} | ${cell(e.reason)} |\n`

  return (
    FRONT_MATTER(
      'Datafeed response codes',
      20,
      'Every status a post to the datafeed endpoint can return, and what each one means.',
    ) +
    `\nEvery post to the datafeed endpoint returns an HTTP status. When something is wrong ` +
    `it also returns a **\`Stroom-Status\`** header carrying the more specific code below, ` +
    `and a **\`Stroom-Error\`** header carrying the reason in words.\n\n` +
    `On success the response body is the post's receipt id, such as ` +
    `\`1791981748008_0000_S_node1a\`: the receive time, a sequence number, \`S\` for Stroom ` +
    `or \`P\` for Stroom Proxy, and the node. It is not a header. Each hop that receives ` +
    `the data, whether a Stroom Proxy or Stroom, sets the \`ReceiptId\` attribute to the id ` +
    `it issued and appends that id to \`ReceiptIdPath\`. So a stream stored in Stroom has ` +
    `Stroom's own id as its \`ReceiptId\`, and every id in the chain, including the one the ` +
    `original sender was given, in \`ReceiptIdPath\`. \`ReceiptIdPath\` is what lets you ` +
    `trace a delivery through a chain of proxies, and the sender's recorded id is what you ` +
    `search it for.\n\n` +
    `**A sender that records none of these cannot tell you why data is missing.** Capture ` +
    `all three.\n\nThere are **${entries.length}** codes.\n` +
    body
  )
}

/* --------------------------------------------------------------- pipeline elements */

/**
 * The text inside the parentheses beginning at `from`, respecting nesting, string
 * literals and `"""` text blocks.
 *
 * A regex cannot do this: the annotations nest other annotations, and their descriptions
 * are text blocks that contain brackets. Matching to the first `)` truncates half of them,
 * which is how an earlier attempt produced a page missing every parser.
 *
 * `open`/`close` default to parentheses; braces are passed in to take a class body.
 */
function balanced(src, from, open = '(', close = ')') {
  let depth = 0
  for (let i = from; i < src.length; i++) {
    const c = src[i]
    if (c === '"') {
      if (src.startsWith('"""', i)) {
        const end = src.indexOf('"""', i + 3)
        if (end < 0) return null
        i = end + 2
        continue
      }
      i++
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') i++
        i++
      }
      continue
    }
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return src.slice(from + 1, i)
    }
  }
  return null
}

/**
 * Every `static final String NAME = "value"` in the tree, keyed by both `NAME` and
 * `Class.NAME`, so an annotation that names a constant rather than a literal can be
 * resolved. Several elements do: the parsers use `PipelineElementType.TYPE_DS_PARSER`
 * and `JSONParser.ELEMENT_TYPE`.
 */
function stringConstants(files) {
  // Constants from libraries outside the Stroom tree that a default refers to. FileAppender
  // and friends default compressionMethod to Commons Compress's GZIP, and without this the
  // page showed the Java name instead of the value.
  const byName = new Map(Object.entries(EXTERNAL_CONSTANTS))
  // A constant may be built from literals and other constants: CompressionUtil's
  // SUPPORTED_COMPRESSORS is a concatenation, and DEFAULT_COMPRESSION_METHOD_PROP_VALUE is
  // another constant. Reading only single literals left both blank on the page.
  const pending = []
  for (const file of files) {
    const cls = file.split('/').pop().replace('.java', '')
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/static\s+final\s+String\s+(\w+)\s*=/g)) {
      // The expression runs to the `;`, and is only read if it is nothing but literals,
      // names and `+`. Tokenised rather than matched with one regex, which backtracks
      // exponentially over a long identifier.
      const tok = /\s*("(?:[^"\\\n]|\\.)*"|[A-Za-z_][\w.]*|\+|;)/y
      tok.lastIndex = m.index + m[0].length
      let t
      let end = -1
      while ((t = tok.exec(src))) if (t[1] === ';') { end = t.index; break }
      if (end < 0) continue
      m[2] = src.slice(m.index + m[0].length, end)
      // The constant may belong to a nested class and be referred to by that name —
      // `RefDataPurge.JOB_NAME` lives inside RefDataStoreModule.java. Without this the
      // Ref Data Off-heap Store Purge job cannot be resolved.
      const owner = [...src.slice(0, m.index).matchAll(/(?:class|interface|enum)\s+(\w+)/g)].pop()?.[1]
      // `file#NAME` lets a class's own constant win over a same-named one elsewhere:
      // FileAppender's DEFAULT_USE_COMPRESSION_PROP_VALUE is "false", HTTPAppender's "true".
      const keys = [m[1], `${cls}.${m[1]}`, `${file}#${m[1]}`, ...(owner ? [`${owner}.${m[1]}`] : [])]
      pending.push({ keys, expr: m[2], file })
    }
  }
  // Whole-number constants too, since descriptions quote them: "Up to a maximum of " +
  // Joining.DEFAULT_LIMIT + " values." lost its number.
  for (const file of files) {
    const cls = file.split('/').pop().replace('.java', '')
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/static\s+final\s+(?:int|long)\s+(\w+)\s*=\s*(-?[\d_]+)[lL]?\s*;/g))
      for (const k of [`${cls}.${m[1]}`, `${file}#${m[1]}`])
        if (!byName.has(k)) byName.set(k, m[2].replace(/_/g, ''))
  }
  // References are resolved in rounds, since a constant may name one defined later.
  let todo = pending
  for (let round = 0; round < 5 && todo.length; round++) {
    const next = []
    for (const p of todo) {
      const value = stringExpr(p.expr, scoped(byName, p.file), true)
      if (value === undefined) next.push(p)
      else for (const k of p.keys) byName.set(k, value)
    }
    todo = next
  }
  return byName
}

/** Library constants the Stroom source refers to but does not define. */
const EXTERNAL_CONSTANTS = {
  'CompressorStreamFactory.GZIP': 'gz',
}

/** A constant lookup that prefers the named file's own constants. */
const scoped = (constants, file) => ({
  get: (k) => constants.get(`${file}#${k}`) ?? constants.get(k),
})

/** Resolves a constant by name, as written, or by its last two segments (`Class.NAME`). */
const constant = (constants, ref) =>
  constants.get(ref) ?? constants.get(ref.split('.').slice(-2).join('.'))

/**
 * A Java string expression, literals and constants joined with `+`, as its value. With
 * `strict`, an unresolved constant gives undefined rather than being dropped.
 */
function stringExpr(expr, constants, strict = false) {
  const unescape = (t) => t.replace(/\\(["'\\nrt])/g, (_, c) => ({ n: '\n', r: '\r', t: '\t' })[c] ?? c)
  let joined = ''
  for (const tok of expr.matchAll(/"((?:[^"\\\n]|\\.)*)"|([A-Za-z_][\w.]*)/g)) {
    if (tok[1] !== undefined) joined += unescape(tok[1])
    else {
      const v = constant(constants, tok[2])
      if (v === undefined && strict) return undefined
      joined += v ?? ''
    }
  }
  return joined
}

/** A Java description, as Markdown. Upstream's Hugo shortcodes and links do not survive. */
function prose(raw) {
  return raw
    .replace(/\\\n\s*/g, ' ') // a text block's line continuation
    .replace(/"\s*\+\s*"/g, '') // concatenated string literals
    .replace(/\[([^\]]*)\]\(\{\{[<%][\s\S]*?[>%]\}\}\)/g, '$1') // a link to an upstream page
    // An element reference is kept, as Markdoc's element tag: stripping it left
    // "use the much more flexible ." on HttpPostFilter.
    .replace(/\{\{<\s*pipe-elm\s+"([^"]+)"\s*>\}\}/g, '{% element name="$1" /%}')
    .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s{2,}/g, ' ') // a text block's line continuation leaves a double space
    .trim()
}

const JAVA_TYPES = {
  String: 'String',
  boolean: 'Boolean',
  Boolean: 'Boolean',
  int: 'Integer',
  Integer: 'Integer',
  long: 'Long',
  Long: 'Long',
  DocRef: 'Document',
}

/**
 * The value of a string attribute of a Java annotation, e.g. `description = ...`.
 *
 * A description is a text block, a single literal, or a concatenation of literals and
 * constants split across lines. Reading only the first literal of a concatenation
 * silently truncated 53 pipeline element property descriptions and many function
 * descriptions ("...to connect to, e.g." with the example lost), so the whole
 * expression, up to the next attribute, is tokenised and its constants resolved.
 */
function annotationString(body, key, constants) {
  const textBlock = new RegExp(`\\b${key}\\s*=\\s*"""([\\s\\S]*?)"""`).exec(body)?.[1]
  if (textBlock !== undefined) return textBlock
  const expr = new RegExp(`\\b${key}\\s*=\\s*([\\s\\S]*?)(?=,\\s*\\w+\\s*=|\\n\\s*\\w+\\s*=|\\n?\\s*\\)?\\s*$)`).exec(body)?.[1]
  if (!expr) return undefined
  return stringExpr(expr, constants) || undefined
}

function parseElements(files) {
  const constants = stringConstants(files)
  const elements = []

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    const local = scoped(constants, file)
    let at = -1
    while ((at = src.indexOf('@ConfigurableElement(', at + 1)) !== -1) {
      const body = balanced(src, at + '@ConfigurableElement'.length)
      if (body == null) throw new Error(`${file}: could not read a @ConfigurableElement annotation`)

      const typeExpr = /type\s*=\s*([^,\n]+)/.exec(body)?.[1]?.trim()
      if (!typeExpr) continue
      const type = typeExpr.startsWith('"')
        ? typeExpr.slice(1, -1)
        : constants.get(typeExpr) ?? constants.get(typeExpr.split('.').slice(-2).join('.'))
      if (!type) throw new Error(`${file}: cannot resolve element type from "${typeExpr}"`)

      // Test-only elements exist in the main source tree but are not for users.
      if (/^Test/.test(type)) continue

      const description = annotationString(body, 'description', local)
      const category = /category\s*=\s*(?:\w+\.)*Category\.(\w+)/.exec(body)?.[1] ?? 'INTERNAL'

      // Properties live on the setters of the same class.
      const properties = []
      let pAt = -1
      while ((pAt = src.indexOf('@PipelineProperty(', pAt + 1)) !== -1) {
        // Skip a commented-out annotation.
        const lineStart = src.lastIndexOf('\n', pAt) + 1
        if (src.slice(lineStart, pAt).trim().startsWith('//')) continue

        const pBody = balanced(src, pAt + '@PipelineProperty'.length)
        if (pBody == null) continue
        const after = src.slice(pAt, pAt + 2000)
        const setter = /public\s+void\s+set(\w+)\s*\(\s*(?:final\s+)?([\w<>.]+)/.exec(after)
        if (!setter) continue

        const defaultExpr = /defaultValue\s*=\s*([^,)\n]+)/.exec(pBody)?.[1]?.trim()
        const defaultValue = !defaultExpr
          ? ''
          : defaultExpr.startsWith('"')
            ? defaultExpr.slice(1, -1)
            : (constant(local, defaultExpr) ?? defaultExpr)

        properties.push({
          name: setter[1][0].toLowerCase() + setter[1].slice(1),
          description: prose(annotationString(pBody, 'description', local) ?? ''),
          defaultValue,
          valueType: JAVA_TYPES[setter[2]] ?? setter[2],
        })
      }

      elements.push({
        type,
        category,
        icon: /icon\s*=\s*SvgImage\.(\w+)/.exec(body)?.[1],
        description: prose(description ?? ''),
        properties: properties.sort((a, b) => a.name.localeCompare(b.name)),
      })
    }
  }

  return elements
}

function pipelineElements(elements) {
  // Reader, parser, filter, writer, destination: the order data moves through a pipeline.
  const ORDER = ['READER', 'PARSER', 'FILTER', 'WRITER', 'DESTINATION', 'INTERNAL']
  const title = (c) => sentenceCase(c[0] + c.slice(1).toLowerCase())

  let body = ''
  for (const category of ORDER) {
    const rows = elements.filter((e) => e.category === category)
    if (!rows.length) continue
    body += `\n## ${title(category)}\n`
    for (const e of rows.sort((a, b) => a.type.localeCompare(b.type))) {
      body += `\n### ${e.type}\n\n{% element name="${e.type}" /%}\n\n${e.description || '*Not described in the source.*'}\n`
      if (e.properties.length) {
        body += `\n| Property | Description | Default | Type |\n|---|---|---|---|\n`
        for (const p of e.properties)
          body += `| \`${cell(p.name)}\` | ${cell(p.description)} | ${p.defaultValue ? `\`${cell(p.defaultValue)}\`` : '-'} | ${cell(p.valueType)} |\n`
      }
    }
  }

  return (
    FRONT_MATTER(
      'Pipeline elements',
      40,
      'Every element you can put in a pipeline, by category, with its properties.',
    ) +
    `\nA pipeline is a chain of elements. Data enters at a source, is read, parsed into XML ` +
    `events, transformed by filters, written back into a format, and sent to a destination.\n\n` +
    `The categories below are that order. An element's category tells you where in a chain it ` +
    `can go.\n\nThere are **${elements.length}** elements.\n` +
    body
  )
}

/* ------------------------------------------------------------------ element icons */

/**
 * Regenerates the element to icon map in layouts/shortcodes/pipe-elm.html, and copies the
 * icons it and the document types need into assets/images/stroom-ui/.
 *
 * That map used to be maintained by hand, because, as its own comment said, a shortcode
 * cannot reach the Java source to find an element's icon. This can:
 * `@ConfigurableElement` names an `SvgImage`, and `SvgImage` carries the icon's path.
 * The hand-kept copy was missing `SqlStoreFilter` and `DictionaryAppender`, and the build
 * found both the moment a page referred to them.
 */
function elementIcons(elements, files) {
  const svg = readFileSync(findOne(files, 'stroom/svg/shared/SvgImage.java'), 'utf8')
  const paths = new Map(
    [...svg.matchAll(/^\s{4}([A-Z][A-Z_0-9]*)\("([^"]+\.svg)"/gm)].map((m) => [m[1], m[2]]),
  )

  // The document types' icons, for the same reason and from the same place: the docs name
  // them with stroom-icon "document/<Type>.svg", and newer types had no file here.
  const registry = readFileSync(
    findOne(files, 'stroom/docstore/shared/DocumentTypeRegistry.java'),
    'utf8',
  )
  const docIcons = new Set()
  for (const m of registry.matchAll(
    /new DocumentType\(\s*DocumentTypeGroup\.(\w+),\s*"([^"]+)",\s*"([^"]+)",\s*SvgImage\.(\w+)/g,
  )) {
    const path = paths.get(m[4])
    if (path) docIcons.add(path)
  }

  const map = {}
  for (const e of elements) {
    if (!e.icon) continue
    const path = paths.get(e.icon)
    if (!path) throw new Error(`SvgImage.${e.icon}, used by ${e.type}, has no .svg path`)
    map[e.type] = path
  }

  const iconSrc = join(SRC, 'stroom-app/src/main/resources/ui/images')
  let copied = 0
  for (const rel of new Set([...Object.values(map), ...docIcons])) {
    const from = join(iconSrc, rel)
    if (!statSync(from, { throwIfNoEntry: false })) {
      console.warn(`  (no icon file for ${rel}; leaving any existing one in place)`)
      continue
    }
    const dest = join(ICON_OUT, rel)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(from, dest)
    copied++
  }

  const entries = Object.keys(map)
    .sort()
    .map((k) => `"${k}" "${map[k]}"`)
    .join('\n')

  const html = readFileSync(PIPE_ELM, 'utf8')
  // Test that the block is there, rather than that the rewrite changed anything: a
  // re-run with no upstream change produces identical text, which is success, not failure.
  const pattern = /(GENERATED CONTENT START[^\n]*\n)[\s\S]*?\n(\{\{- \/\* #~#~#~#~#~# GENERATED CONTENT END)/
  if (!pattern.test(html)) throw new Error(`No GENERATED CONTENT block in ${PIPE_ELM}`)
  writeFileSync(PIPE_ELM, html.replace(pattern, (_, start, end) => `${start}{{- $element_map := dict\n${entries}\n-}}\n${end}`))
  return { count: Object.keys(map).length, copied, docTypes: docIcons.size }
}

/* ------------------------------------------------------------ expression functions */

/**
 * The dashboard and StroomQL expression functions, from `@FunctionDef`.
 *
 * Upstream splits these across 15 hand-written pages. They are one annotated list in the
 * source, so they are one generated page here, grouped by the category the source gives
 * them.
 */
function expressionFunctions(files) {
  const constants = stringConstants(files)
  const functions = []

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    let at = -1
    while ((at = src.indexOf('@FunctionDef(', at + 1)) !== -1) {
      const body = balanced(src, at + '@FunctionDef'.length)
      if (body == null) throw new Error(`${file}: could not read a @FunctionDef annotation`)

      const nameExpr = /name\s*=\s*([^,\n]+)/.exec(body)?.[1]?.trim()
      if (!nameExpr) continue
      const name = nameExpr.startsWith('"')
        ? nameExpr.slice(1, -1)
        : (constants.get(nameExpr) ?? constants.get(nameExpr.split('.').slice(-2).join('.')))
      if (!name) throw new Error(`${file}: cannot resolve function name from "${nameExpr}"`)

      // A function's own description is commonDescription; failing that, each signature
      // has one. A bare `description =` search finds whichever comes first, which is often
      // an argument's: askAi was described as "The name or UUID of the OpenAI Model
      // document to use.", and count, which only has commonDescription, as nothing.
      const signatures = []
      let sAt = -1
      while ((sAt = body.indexOf('@FunctionSignature(', sAt + 1)) !== -1) {
        let sig = balanced(body, sAt + '@FunctionSignature'.length) ?? ''
        sAt += sig.length
        // Drop the arguments, whose descriptions are not the signature's.
        let aAt
        while ((aAt = sig.indexOf('@FunctionArg(')) !== -1) {
          const arg = balanced(sig, aAt + '@FunctionArg'.length) ?? ''
          sig = sig.slice(0, aAt) + sig.slice(aAt + '@FunctionArg'.length + arg.length + 2)
        }
        signatures.push({
          category: /\bcategory\s*=\s*(?:\w+\.)*FunctionCategory\.(\w+)/.exec(sig)?.[1],
          description: prose(annotationString(sig, 'description', constants) ?? ''),
          returns: prose(annotationString(sig, 'returnDescription', constants) ?? ''),
        })
      }
      const common = {
        category: /commonCategory\s*=\s*(?:\w+\.)*FunctionCategory\.(\w+)/.exec(body)?.[1],
        description: prose(annotationString(body, 'commonDescription', constants) ?? ''),
        returns: prose(annotationString(body, 'commonReturnDescription', constants) ?? ''),
      }

      // Most declare commonCategory; the aggregates declare it per signature instead, and
      // average, max, min and the like have a second, non-aggregate signature under
      // Mathematics, so they are listed under each category a signature names.
      // A signature's own category overrides commonCategory, as variance's does.
      const categories = [
        ...new Set(
          (signatures.length ? signatures.map((s) => s.category ?? common.category) : [common.category])
            .filter(Boolean),
        ),
      ]
      if (!categories.length) throw new Error(`${file}: no category for function "${name}"`)

      // `aliases = X.ALIAS` or `aliases = {X.ALIAS, X.SHORT_ALIAS}`.
      const aliasExpr = /aliases\s*=\s*(\{[^}]*\}|[^,\n]+)/.exec(body)?.[1]?.trim()
      const aliases = !aliasExpr
        ? []
        : [...aliasExpr.matchAll(/"((?:[^"\\]|\\.)*)"|([A-Za-z_][\w.]*)/g)]
            .map((t) => t[1] ?? constant(constants, t[2]))
            .filter(Boolean)

      for (const category of categories) {
        const sig = signatures.find((s) => s.category === category) ?? signatures[0] ?? {}
        functions.push({
          name,
          aliases,
          category,
          description: common.description || sig.description || '',
          returns: common.returns || sig.returns || '',
        })
      }
    }
  }

  // The enum names are shouted, so they are title-cased — except where that would
  // un-capitalise an acronym.
  const ACRONYMS = { AI: 'AI', URI: 'URI' }
  const title = (c) =>
    ACRONYMS[c] ??
    sentenceCase(c.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' '))

  const groups = new Map()
  for (const f of functions) {
    if (!groups.has(f.category)) groups.set(f.category, [])
    groups.get(f.category).push(f)
  }

  const names = new Set(functions.map((f) => f.name))
  const twice = [...names].filter((n) => functions.filter((f) => f.name === n).length > 1).sort()

  let body = ''
  for (const [category, rows] of [...groups].sort()) {
    body += `\n## ${title(category)}\n\n| Function | Does | Returns |\n|---|---|---|\n`
    for (const f of rows.sort((a, b) => a.name.localeCompare(b.name))) {
      const names = [f.name, ...f.aliases].map((n) => `\`${cell(n)}\``).join(', ')
      body += `| ${names} | ${cell(f.description) || '*Not described in the source.*'} | ${cell(f.returns) || '-'} |\n`
    }
  }

  return (
    FRONT_MATTER(
      'Expression functions',
      60,
      'Every function available in dashboard expressions and StroomQL, by category.',
    ) +
    `\nThese are the functions you can use in a dashboard's expression columns and in ` +
    `StroomQL \`eval\` expressions.\n\nWhere a function has aliases, every name does the same ` +
    `thing.\n\nThere are **${names.size}** functions in **${groups.size}** categories.` +
    (twice.length
      ? ` A few, such as \`${twice[0]}\`, have both an aggregate form and one that works ` +
        `across its arguments, so they appear in two categories.`
      : '') +
    `\n` +
    body
  )
}

/* ------------------------------------------------------------------------ hugo */

function* markdownFiles(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* markdownFiles(p)
    else if (e.endsWith('.md')) yield p
  }
}

const docsPages = new Set([...markdownFiles(DOCS)].map((p) => p.slice(DOCS.length + 1).split('\\').join('/')))
const problems = []

/**
 * Converts a generated Markdoc page to Hugo and writes it, keeping what a regeneration
 * must not lose: the page's aliases (old URLs that redirect to it), and its date unless
 * the content actually changed.
 */
function writeHugoPage(name, markdoc) {
  const rel = `reference/${name}`
  const file = join(OUT, name)
  const { meta, body } = parseFrontMatter(markdoc, rel)

  let aliases = []
  let date = DATE
  let previous = null
  if (statSync(file, { throwIfNoEntry: false })) {
    previous = readFileSync(file, 'utf8')
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(previous)?.[1] ?? ''
    aliases = [...(/^aliases:\n((?:\s+- .*\n?)*)/m.exec(fm)?.[1] ?? '').matchAll(/- (\S+)/g)].map((m) => m[1])
    date = /^date: (\S+)/m.exec(fm)?.[1] ?? DATE
  }

  const ctx = {
    file: rel,
    problems,
    resolveLink: (target) => {
      const [path] = target.split('#')
      if (!path.endsWith('.md')) return null
      return docsPages.has(posix.normalize(posix.join('reference', path))) ? target : null
    },
    // Figures are not generated: the builders name ones already beside the page.
    figure: ({ capture, diagram }) => {
      const rel = posix.join('reference', name.replace(/\.md$/, ''), capture ?? diagram ?? '')
      return statSync(join(IMAGES, rel), { throwIfNoEntry: false }) ? rel : null
    },
  }
  const converted = convertBody(body, ctx)
  const withDate = (d) => hugoFrontMatter(meta, { date: d, aliases }) + converted
  let text = withDate(date)
  if (previous !== text) text = withDate(DATE)
  writeFileSync(file, text)
  return { text, changed: previous !== text }
}

/* -------------------------------------------------------------------------- main */

mkdirSync(OUT, { recursive: true })

// The element parse feeds both the page and the icon map, so it happens once, first.
const allFiles = javaFiles(SRC)
const elements = parseElements(allFiles)
const icons = elementIcons(elements, allFiles)
console.log(
  `  layouts/shortcodes/pipe-elm.html — ${icons.count} elements, ${icons.docTypes} document type icons, ${icons.copied} icons copied`,
)

for (const [name, build] of [
  ['documents.md', documentTypes],
  ['response-codes.md', responseCodes],
  ['jobs.md', jobs],
  ['pipeline-elements.md', () => pipelineElements(elements)],
  ['expression-functions.md', () => expressionFunctions(allFiles)],
  ['configuration-properties.md', configurationProperties],
]) {
  const { text, changed } = writeHugoPage(name, build())
  const rows = (text.match(/^\|/gm) ?? []).length
  console.log(`  ${name} — ${Math.max(0, rows - 2)} rows${changed ? '' : ', unchanged'}`)
}

if (problems.length) {
  console.error(`\n${problems.length} to fix:\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log(`\nWritten to ${OUT}`)
