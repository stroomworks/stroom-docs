---
title: "Reading the Logs"
linkTitle: "Reading the Logs"
weight: 60
date: 2026-10-14
tags:
description: >
  Which log holds what, where they are, and what to search for when no screen tells you anything.
pageKind: operate
verification: required
---

A good deal of what Stroom knows is not on any screen.
Startup failures, store-full warnings, forwarding errors, permission problems on a data path: all of these are logged and none of them appear in the UI.
When a problem has no visible symptom, this is where to go.


## Which log

Both Stroom and [Stroom Proxy]({{< relref "../../concepts/data-receipt.md" >}}) write several logs, split by purpose.
The paths are set in the `logging:` section of each application's configuration, and the defaults are relative to the installation directory.

**Stroom**

| Log | Holds |
|---|---|
| `logs/app/app.log` | The application log. Startup, errors, warnings, job activity. **Start here.** |
| `logs/access/access.log` | HTTP requests, including [data posts]({{< relref "../../reference/the-datafeed-contract.md" >}}) to `/datafeed`. |
| `logs/user/user.log` | User activity, as event-logging records. |
| `logs/migration/migration.log` | Database migrations: which one is running, and the SQL each applies. Look here when a first start or an upgrade seems to hang. |

**Stroom Proxy**

| Log | Holds |
|---|---|
| `logs/app/app.log` | The application log. |
| `logs/receive/receive.log` | What the proxy accepted. |
| `logs/send/send.log` | What the proxy forwarded, and what failed. |
| `logs/access/access.log` | HTTP requests. |

In a container, the application log is also on standard output, so `docker logs` or `journalctl` reaches it without a shell on the container.


## What to search for

Problems that are invisible on screen have distinctive log lines.
These are the ones worth knowing:

| Looking for | Search for |
|---|---|
| A [Plan B store]({{< relref "plan-b-problems.md" >}}) that has filled and stopped accepting writes | `Plan B` together with `is full` |
| Plan B storage or schema failures | `Plan B`, `LMDB` |
| An [index]({{< relref "index-problems.md" >}}) that cannot write shards | `volume group` |
| Why a post was rejected | `Sending error response`, in the application log, which gives the status and the reason. The access log has the request and its status code, but not the feed |
| Why a [proxy forward]({{< relref "proxy-problems.md" >}}) failed | `send.log`, and the destination host name |
| A node that will not start | the first error after startup begins, not the last |

{{< timing mode="immediate" >}}
Logs are written as things happen, so a line appears at the moment of the event.

The useful consequence: reproduce the problem while watching the log, rather than searching history afterwards.
`tail -f` on `app.log` while you retry the failing operation is the single most efficient debugging loop Stroom offers.
{{< /timing >}}

{{< verify >}}
Reproduce the problem while tailing the application log, and confirm a line appears that corresponds to what you did.

{{< golden >}}
**A log line that appears when you reproduce the problem, and not when you do not.**

Correlating the line with the action is what distinguishes the cause from the ambient noise of a busy system.
{{< /golden >}}

{{< not-proof >}}
**An error in the log is not necessarily your error.**
A busy Stroom logs routine failures: a transient database retry, a node briefly unreachable.
Check the timestamp against your action before building a theory on it.

**No error in the log does not mean nothing failed.**
Silent failures are silent in the log too.
A feed set to drop, a static index ignoring an undefined field, and an XSLT matching nothing all log nothing at all.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**On a cluster, the log you want is on a different node.**

Work is distributed, so a failure during processing is logged by whichever node ran the task, which is usually not the node serving your UI session.
Searching one node's log and finding nothing proves very little.

Either check every node, or use a log aggregator.
Stroom can of course ingest its own logs, which is the tidiest answer and worth setting up before you need it.
{{< /trap >}}

{{< diagnose >}}
1. **Which node?**
   On a cluster, establish this before reading anything.
   See the trap.
1. **Which log?**
   Receive and send problems are in the proxy's own logs, not the application log.
   HTTP-level questions are in the access log.
1. **Does the timestamp match the action?**
   Reproduce while tailing rather than searching history, and you remove the ambiguity entirely.
1. **Is it the first error or a consequence?**
   Startup failures cascade.
   The first error after startup begins is the useful one; the last is usually a symptom of it.
1. **Is anything logged at all?**
   If not, the failure is probably one of the silent ones.
   Go back to [Checking it works]({{< relref "../checking-it-works/_index.md" >}}) and verify each stage instead.
{{< /diagnose >}}
