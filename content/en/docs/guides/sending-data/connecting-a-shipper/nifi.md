---
title: "Apache NiFi"
linkTitle: "Apache NiFi"
weight: 70
date: 2026-10-14
tags:
description: >
  Posting flowfiles with InvokeHTTP, the property name that changed between versions, and the relationships you must connect.
pageKind: guide
verification: required
thirdParty: "Apache NiFi"
---

NiFi's `InvokeHTTP` processor posts flowfiles to the datafeed endpoint.
If NiFi is already deployed this adds no infrastructure, and it brings NiFi's processor catalogue with it: every source processor becomes a Stroom connector through this one output.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Flow shape

```text
[ source ] → [ UpdateAttribute ] → [ InvokeHTTP ] → Response / Retry / No Retry / Failure
```

1. **Source**: `TailFile`, `ListenSyslog`, `GetFile`, `ConsumeKafka`, `FetchS3Object`, and so on.
1. **`UpdateAttribute`**: set the feed name and any other metadata as flowfile attributes.
1. **`InvokeHTTP`**: post to Stroom, with headers supplied as dynamic properties.


## InvokeHTTP

| Property | Value |
|---|---|
| HTTP Method | `POST` |
| URL | `https://stroom.example.com/<base>/datafeed` |
| Send Message Body | `true` |
| Content-Type | e.g. `application/octet-stream`, matching your payload |

{{< trap severity="silent" >}}
**The URL property has two names, and which you need depends on the version.**

| NiFi version | Display name | Persisted name |
|---|---|---|
| 2.x | `HTTP URL` | `HTTP URL` |
| 1.17.0 to 1.28.x | `HTTP URL` | `Remote URL` |
| 1.16.x and earlier | `Remote URL` | `Remote URL` |

The display name changed in 1.17.0 while the persisted name stayed `Remote URL` for all of 1.x.
It matters when templating flow definitions or scripting through the API: use the **persisted** name there and the display name in the UI.
Getting it wrong produces a flow that imports without the URL set.
{{< /trap >}}


### Headers as dynamic properties

Any dynamic property on `InvokeHTTP` whose name is a valid HTTP header name is sent as a request header:

| Dynamic property | Value |
|---|---|
| `Feed` | `NIFI_EVENTS`, or `${feed.name}` if set upstream |
| `Type` | `Events` |
| `Compression` | `NONE` |
| `Authorization` | `Bearer #{stroom.token}` |

One exception: a dynamic property named `post:form:<NAME>` is treated as multipart form data rather than a header.
Avoid that prefix.


## Authentication

Do not put the key in the processor configuration literally: it is exported with the flow definition and visible in the UI.
Use a **Parameter Context** parameter marked sensitive, ideally backed by a sensitive parameter provider, and reference it as a parameter.

Note the distinction, which is easy to get backwards: `#{…}` is a NiFi **parameter**, `${…}` is a **flowfile attribute or variable**.
Sensitive values belong in parameters.


## Deriving the feed

Set a `feed.name` attribute with `UpdateAttribute` upstream, then reference it in the `Feed` dynamic property.
Use `RouteOnAttribute` where different sources need different feeds.

NiFi makes it very easy to derive the feed from something high-cardinality, such as a filename or hostname.
Resist that: see [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).


## Compression

If you compress content before `InvokeHTTP`, with a `CompressContent` processor set to gzip, set the `Compression` dynamic property to `GZIP`.
NiFi will not set it for you: `CompressContent` sets no `Content-Encoding` header, so without `Compression` the gzip bytes are stored as they are.


## Batch shape

`InvokeHTTP` sends **one flowfile per request**.
For high volumes, use `MergeContent` upstream to combine many records into one flowfile, with the demarcator set to a newline so the result is newline-delimited and a [pipeline]({{< relref "../../../concepts/translation.md" >}}) can split it.


## Failure handling

{{< trap severity="silent" >}}
**Connect every relationship.**

`InvokeHTTP` has `Original`, `Response`, `Retry`, `No Retry` and `Failure`.
Leaving `Failure` or `No Retry` unconnected either makes the processor invalid or lets flowfiles accumulate silently, which is data loss that looks like a queue.

* `Retry`, for 5xx, back into `InvokeHTTP` or a `RetryFlowFile` with a penalty.
* `No Retry`, for 4xx, to a dead-letter funnel.
  A 4xx from Stroom usually means a bad feed name or authentication, and retrying will not fix either.
* `Failure` to dead-letter, plus alerting.
* `Original` auto-terminated once you are confident, or archived.
{{< /trap >}}

Set a penalty duration and use backpressure on the incoming connection, so a Stroom outage queues rather than spins.

{{< timing mode="immediate" >}}
Each post is synchronous.
A queued flowfile waits for the processor's schedule and any penalty, so allow for both before concluding a flow has stopped.
{{< /timing >}}

{{< verify >}}
Use NiFi's **Data Provenance** view to trace a flowfile through `InvokeHTTP`.

{{< golden >}}
**Data Provenance shows the response code and body Stroom returned**, including `Stroom-Status` and `Stroom-Error` when the request was rejected.

This is the best diagnostic of any tool in these guides: it tells you what Stroom actually said, per flowfile, without leaving NiFi.
Then confirm the stream is on the feed.
{{< /golden >}}

{{< not-proof >}}
**A flowfile leaving `InvokeHTTP` on `Response` is not proof of success** unless you have checked the status code it carries.

**An empty queue is not proof of delivery** if `Failure` auto-terminates.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without NiFi.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Read Data Provenance.**
   It carries Stroom's response, which usually ends the investigation immediately.
1. **Is the URL property actually set?**
   On an imported flow, check the version trap above.
1. **Are flowfiles accumulating on an unconnected relationship?**
   See the failure trap.
1. **Did the parameter resolve?**
   `#{…}` and `${…}` are not interchangeable, and the wrong one produces an empty header rather than an error.
1. **Is the stream present but unreadable?**
   Check for a `CompressContent` upstream without a matching `Compression` property.
1. **Check property names against your NiFi version.**
   The in-UI processor documentation is authoritative for the version you are running; this page is written from the documentation rather than from a run.
{{< /diagnose >}}
