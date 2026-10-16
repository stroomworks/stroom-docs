---
title: "ZIP Drop Folder"
linkTitle: "ZIP Drop Folder"
weight: 90
date: 2026-10-14
tags:
description: >
  Writing files to a directory for Stroom Proxy to pick up, for systems that cannot make an HTTP request.
pageKind: guide
verification: required
---

The cheapest integration Stroom has: anything that can write a file to a directory is a connector.
No HTTP client, no authentication in the sender, no library.
Useful for batch jobs, legacy exports, and appliances whose only output is SFTP or a file share.

**This is proxy-only.**
It does not use the datafeed endpoint and does not exist on a bare Stroom with no proxy in front of it.


## How it works

[Stroom Proxy]({{< relref "../../../concepts/data-receipt.md#stroom-proxy" >}}) polls configured directories for proxy-format ZIP files, ingests them, and moves anything it cannot ingest to a failure directory.

| Setting | Default | Notes |
|---|---|---|
| Enabled | **`true`** | On by default |
| Scan directories | `zip_file_ingest` | A list, scanned in list order |
| Failure directory | `zip_file_ingest_failed` | Where un-ingestable ZIPs go |
| Scan frequency | 1 minute | All directories scanned on each run |

Confirm the configured paths with whoever operates your proxy: all four are configurable and a deployment may differ.

Two operational details worth knowing.
**There is no ordering guarantee within a directory**: files are scanned in list order across directories, but the order of ZIPs within one is explicitly unspecified, so do not depend on filenames for sequencing.
And changing the failure directory or the scan frequency **requires a proxy restart**, while changing the directory list or enabling does not.


## What the ZIP must contain

A proxy-format ZIP holds one or more **entry groups**: files sharing a base name, distinguished by extension.

| Purpose | Canonical extension | Also accepted |
|---|---|---|
| Manifest | `.mf` | `.manifest` |
| **Metadata** | `.meta` | `.hdr`, `.header`, `.met` |
| Context | `.ctx` | `.context` |
| **Data** | `.dat` | |

In practice you need two per group: `<base>.meta` and `<base>.dat`.


## The metadata file

UTF-8, one `Key:Value` per line, keys and values trimmed, blank lines skipped.
A line with no colon is stored as a key with no value.

The keys are exactly the header names from [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}): the same vocabulary, a different transport.

```text
Feed:BATCH_EXPORT
Type:Events
Compression:NONE
EffectiveTime:2026-08-28T09:15:00.000Z
```

The **`.dat` entry must be uncompressed**: the ZIP container does the compression.
A `Compression` key here does not make the proxy decompress the entry, so a gzipped `.dat` is stored as gzip bytes whatever the `.meta` says.


## Building a file

```bash
cat > 001.meta <<'EOF'
Feed:BATCH_EXPORT
Type:Events
Compression:NONE
EOF

cp /path/to/export.csv 001.dat
zip batch-20260828-0915.zip 001.meta 001.dat

mv batch-20260828-0915.zip /path/to/zip_file_ingest/
```

{{< trap severity="destructive" >}}
**Write atomically, or the scanner will ingest a half-written file.**

The scan is on a timer and has no way to know a file is still being written.
Build the ZIP elsewhere and move it into the scan directory as the final step: a rename within the same filesystem is atomic.
Write temporary files outside the scan directory too: anything that is not a `.zip` is moved to the failure directory.

Streaming a growing file directly into the scan path produces truncated ingests, and the part that was not written is simply gone.
{{< /trap >}}


## Failure handling

Un-ingestable ZIPs are **moved** to the failure directory, not deleted and not retried.

**Nothing re-drives that directory for you.**
Monitor it.
A growing backlog usually means a malformed metadata file, an unrecognised feed, or a ZIP whose entries do not follow the base-name and extension convention.
Fix the producer, then move the corrected files back into a scan directory yourself.


## Choosing a feed

The same guidance as everywhere else, written directly into the metadata file you generate: a small number of stable names, one per export source.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="async" >}}
The scan runs on an interval, one minute by default.
**Allow a full interval before concluding a file was ignored.**

There is no response to read, unlike the HTTP routes, so patience is the only way to tell "not yet" from "not at all".
{{< /timing >}}

{{< verify >}}
Hand-build **one** ZIP and watch it: it should disappear from the scan directory and the stream should appear on the feed in Stroom.

{{< golden >}}
**The file left the scan directory, is not in the failure directory, and the stream exists.**

Check all three.
A file that has left the scan directory has gone somewhere, and the failure directory is the other possibility.
{{< /golden >}}

{{< not-proof >}}
**The file disappearing is not proof of success.**
It may have been moved to the failure directory.

**An empty failure directory is not proof either**, if someone has been tidying it.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Has a full scan interval passed?**
   One minute by default.
   Wait before investigating.
1. **Is the file in the failure directory?**
   That is the scanner rejecting it, and it is where almost every problem on this page ends up.
1. **Check the metadata key spelling first.**
   It is the most common cause, and unlike the HTTP route there is no response header to tell you.
1. **Does the ZIP follow the base-name convention?**
   Each group needs matching base names with the right extensions.
1. **Does the feed exist and is it set to receive?**
   An unrecognised feed fails the ingest.
1. **Was the file written atomically?**
   A truncated ZIP fails to open.
   See the trap.
1. **Is the scanner enabled, and scanning the directory you are writing to?**
   Both are configurable, and a deployment may not use the defaults.
{{< /diagnose >}}
