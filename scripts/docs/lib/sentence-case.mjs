/**
 * Sentence case for headings, as the restructured documentation writes them.
 *
 * Only titles (front matter) are Title Case in this site; headings within a page keep
 * the sentence case they were written in. gen-docs-reference.mjs generates its category
 * headings from SCREAMING_SNAKE source names and runs them through this, so that a
 * regenerated page reads the same as one written by hand.
 *
 * Copied from the stroomworks-website's scripts/sentence-case-headings.mjs, which also
 * did a one-off pass over the pages; only the function is needed here.
 */

/**
 * Proper nouns the source cannot tell us about: stream types, the parts of the UI, and
 * the third-party names the connector guides use.
 */
const KEEP = new Set([
  // Products, tools and places. Deliberately NOT the common nouns Stroom also uses as
  // UI labels — "data", "filter", "settings", "store", "server", "index" and the rest
  // are ordinary words far more often than they are the name of a screen, and keeping
  // them capitalised turns "How Data Goes In" into "How Data goes in".
  'Stroom', 'Stroomworks', 'Apache', 'NiFi', 'Cribl', 'Vector', 'Fluent', 'Fluentd',
  'Logstash', 'Kafka', 'Debezium', 'Elasticsearch', 'Solr', 'Lucene', 'Splunk', 'Datadog',
  'Beats', 'Filebeat', 'Java', 'Docker', 'Kubernetes', 'MySQL', 'Saxon', 'Windows',
  'Linux', 'Unix', 'Vim', 'Crown', 'Copyright', 'Proxy',
  // Plan B is a product name, and "B" alone would otherwise be lower-cased.
  'Plan', 'B',
])

/** True when a word must keep whatever capitals it has. */
function keep(word) {
  if (word.includes('\u0000')) return true // a parked phrase
  const bare = word.replace(/[^\w/-]/g, '')
  if (!bare) return true
  if (/`/.test(word)) return true // inside code
  if (/\d/.test(bare)) return true // v7.14, S3, UTF-8
  if (bare === bare.toUpperCase() && bare.length > 1) return true // XSLT, JSON, URI
  if (/[a-z][A-Z]/.test(bare)) return true // NiFi, StroomQL, PlanB
  return KEEP.has(bare)
}

/** `1.`, `2)`, `-` — a list marker, not the heading's first word. */
const isMarker = (w) => /^(\d+[.)]|[-*•])$/.test(w)

/**
 * Cases one whitespace-separated token.
 *
 * A token can carry leading punctuation ("(The") and can be several words joined by a
 * slash or hyphen ("Import/Export", "Auto-Completion"). Each segment is decided on its
 * own; only the very first segment of the heading's first word keeps its capital.
 */
/**
 * Multi-word proper nouns, which word-by-word rules cannot see.
 *
 * "Stroom Query Language" is the name of a language and "Stroom Proxy" the name of a
 * component; both would otherwise come out lower-cased past the first word. Protected as
 * whole phrases before anything else runs.
 */
const PHRASES = ['Stroom Query Language', 'Stroom Proxy', 'Plan B']

function caseWord(word, isFirstWord) {
  const [, lead, bodyText, trail] = /^([^\p{L}\p{N}`]*)(.*?)([^\p{L}\p{N}`]*)$/su.exec(word)
  let first = isFirstWord
  const body = bodyText
    .split(/([/-])/)
    .map((seg) => {
      if (/^[/-]$/.test(seg) || !seg) return seg
      const wasFirst = first
      first = false
      if (wasFirst || keep(seg)) return seg
      return /^[A-Z][a-z]/.test(seg) ? seg[0].toLowerCase() + seg.slice(1) : seg
    })
    .join('')
  return lead + body + trail
}

export function sentenceCase(heading) {
  // Park the phrases, case the rest, put them back.
  const parked = []
  let text = heading
  for (const phrase of PHRASES) {
    text = text.replaceAll(phrase, () => {
      parked.push(phrase)
      return `\u0000${parked.length - 1}\u0000`
    })
  }
  const restore = (t) => t.replace(/\u0000(\d+)\u0000/g, (_, i) => parked[Number(i)])

  const words = text.split(/(\s+)/)
  let seenWord = false
  const cased = words
    .map((w) => {
      if (/^\s+$/.test(w)) return w
      if (!seenWord && isMarker(w)) return w // skip "1." and friends
      const isFirst = !seenWord
      seenWord = true
      return keep(w) ? w : caseWord(w, isFirst)
    })
    .join('')
  return restore(cased)
}
