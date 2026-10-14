---
title: "Fluent Bit"
linkTitle: "Fluent Bit"
weight: 20
date: 2026-10-14
tags:
description: >
  Pointing Fluent Bit at Stroom with its generic HTTP output, including the compression formats that have no Stroom equivalent.
pageKind: guide
verification: required
thirdParty: "Fluent Bit"
---

Fluent Bit is a single static C binary, smaller and lighter than [Vector]({{< relref "vector.md" >}}), with a large input catalogue and a generic `http` output.
Either is a good default for anything greenfield.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Minimal configuration

```text
[SERVICE]
    flush     5
    log_level info

[INPUT]
    Name tail
    Path /var/log/app/*.log
    Tag  app.log

[OUTPUT]
    Name   http
    Match  app.log
    Host   stroom.example.com
    Port   443
    URI    /<base>/datafeed
    tls    on
    Format json
    Header Feed APP_LOGS
    Header Type Events
    Header Compression NONE
    Header Authorization Bearer ${STROOM_TOKEN}
```

Each header is its own `Header <key> <value>` line.
The `Authorization` value contains a space, which is fine: only the first token after `Header` is treated as the key.

Set `STROOM_TOKEN` in the environment of the Fluent Bit process.
`${VAR}` is expanded from the environment at config load, so do not put the key in the file.


## Batch shape

The `http` output's `Format` controls the post body.
`json` sends a JSON array of records, `json_lines` sends newline-delimited JSON, and `msgpack` sends binary.

`json_lines` is usually the easiest to split downstream.
Whichever you choose, the receiving pipeline's [parser]({{< relref "../../../concepts/translation.md" >}}) has to match, so tell whoever builds it.


## Compression

{{< trap severity="silent" >}}
**Two of Fluent Bit's compression options have no Stroom equivalent.**

`compress` accepts `gzip`, `snappy` and `zstd`.
**Only `gzip` is usable here.**
Stroom's `Compression` header accepts `ZIP`, `GZIP` and `NONE` only, so `snappy` and `zstd` have no valid counterpart: the data is stored as unparseable bytes and the post still returns `200`.

With `compress gzip`, Fluent Bit sets `Content-Encoding: gzip`, which Stroom's web server decodes before Stroom reads the body.
**Leave the `Compression` header at `NONE`.**
Setting it to `GZIP` as well decompresses the body twice, and every post fails with `500` and `Stroom-Status` `400`.
{{< /trap >}}

```text
[OUTPUT]
    Name     http
    Match    app.log
    Host     stroom.example.com
    Port     443
    URI      /<base>/datafeed
    tls      on
    Format   json_lines
    compress gzip
    Header   Feed APP_LOGS
    Header   Compression NONE
    Header   Authorization Bearer ${STROOM_TOKEN}
```


## Buffering

By default Fluent Bit buffers in memory only, so a restart or a Stroom outage loses data.
For production, enable filesystem-backed storage:

```text
[SERVICE]
    storage.path              /var/lib/fluent-bit/storage
    storage.sync              normal
    storage.backlog.mem_limit 64M

[INPUT]
    Name         tail
    Path         /var/log/app/*.log
    Tag          app.log
    storage.type filesystem
```

`storage.type filesystem` is set **per input**; `storage.path` once in `[SERVICE]`.
Setting the path without the per-input type is a common mistake and leaves you buffering in memory.


## Other inputs

Swap the `[INPUT]` block; the output is unchanged.
The catalogue includes `tail`, `syslog`, `systemd`, `kubernetes_events`, `winevtlog`, `exec`, `http` and `docker_events`, plus metric inputs.

Two naming points worth knowing:

* Container **logs** are normally collected with `tail` over the container log files.
  The `docker` input collects Docker **metrics**, which is not the same thing.
* `winevtlog` is the current Windows Event Log input; older configurations may reference `winlog`.

`Feed` is a static header per output, so **one output means one feed**.
To send different sources to different feeds, define one `[OUTPUT]` per feed and select with `Match` or `Match_Regex` on the tags.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous, but `flush` controls how often Fluent Bit sends, so an event is not posted the moment it is read.
Allow at least one flush interval before concluding nothing arrived.
{{< /timing >}}

{{< verify >}}
Validate the configuration, then confirm the data landed in Stroom:

```bash
fluent-bit --dry-run -c fluent-bit.conf
```

Then open the feed's **Data** tab in Stroom and find the stream.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

Readable matters as much as present: a compressed body that reaches Stroom with neither a `Compression` nor a `Content-Encoding` header produces a stream that exists and cannot be parsed.
{{< /golden >}}

{{< not-proof >}}
**`--dry-run` passing proves the configuration parses**, not that it reaches Stroom.

**A `stdout` output showing records proves the input works**, which is worth knowing, but says nothing about the HTTP output.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without Fluent Bit.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
   If that fails, no Fluent Bit change will help.
1. **Does the configuration validate?**
   `--dry-run` is available in current releases; check your build's `--help` if it is rejected.
1. **Is the input producing?**
   Add a temporary `[OUTPUT] Name stdout` with the same `Match` to see what the records actually look like before they are sent.
1. **Does every post fail with `500` and `Stroom-Status` `400`?**
   `compress gzip` is on and the `Compression` header says `GZIP`.
   Set the header back to `NONE`.
1. **Is the stream present but unreadable?**
   Check you did not choose `snappy` or `zstd`.
1. **Is the token reaching the process?**
   `${STROOM_TOKEN}` is expanded from the environment at config load, so a value set in your shell but not in the service environment resolves to nothing.
1. **Is data lost across restarts?**
   That is memory buffering.
   Check `storage.type` is set on the input, not just `storage.path` in `[SERVICE]`.
1. **Check plugin and option names against your installed version.**
   Input plugin availability varies by version and build, and this page is written from the documentation rather than from a run.
{{< /diagnose >}}
