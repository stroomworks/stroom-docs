---
title: "New Features"
linkTitle: "New Features"
weight: 10
date: 2026-09-30
tags: 
description: >
  New features in Stroom version 7.14.
---

## S3 Storage

### Stroom-Proxy S3 forwarder

Stroom-Proxy can now forward data to S3 as well as to a file system or downstream HTTP destination.
Forward destinations of this kind are configured in the `proxyConfig.forwardS3Destinations` list, and data is written to S3 in the proxy ZIP format.

See [Where data goes next]({{< relref "/docs/operate/install/a-proxy.md#where-data-goes-next" >}}) for the forward destination types.


### Consuming S3 create events

Stroom can now consume S3 object creation events from an AWS SQS queue and create a {{< glossary "Stream" >}} meta record for each S3 based file, so that data placed in S3 by Stroom-Proxy can be processed by Stroom without it being sent over HTTP.

The queue is configured under the `stroom.receive.s3Event.sqs` property branch and the queue is polled by the new **S3 Event Notifications Poll** [job]({{< relref "/docs/reference/jobs.md" >}}).


### `S3 v1 (Read only)` volume type

A new data {{< glossary "Volume" >}} type, `S3 v1 (Read only)`, has been added for reading data from an S3 store that Stroom only has read access to.
It is intended for use when Stroom-Proxy creates the files on S3.
The files are read only from Stroom's perspective, so it cannot delete the files, only the stream metadata.

The existing S3 volume type is now shown as `S3 v1`.

See [S3 storage]({{< relref "/docs/concepts/volumes.md#s3-storage" >}}) for details.


## Traces

### Traces document type

Traces are now a first-class [Document]({{< relref "/docs/reference/documents.md" >}}) type, `Traces`, that can be created in the explorer tree.
A Traces document stores trace data on a shared file system, publishes it so it can be queried, and lets you browse the stored traces.
Traces documents hold trace data for the Pathways feature.


## AI

### `ask-ai()` XSLT function

A new XSLT function for asking an AI model a question and returning its answer.

```text
ask-ai(String model, String message)
ask-ai(String model, String message, String systemPrompt)
```

`model` is the name or UUID of an `OpenAI Model` document.
The model is asked once per call, so be careful calling it for every record in a stream.

See [ask-ai()]({{< relref "/docs/reference/xslt-functions/ai.md#ask-ai" >}}) for details.


### `askAi(...)` Dashboard & StroomQL function

The equivalent function for Dashboards and {{< glossary "StroomQL" >}}.

```text
askAi(model, message)
askAi(model, message, systemPrompt)
```

For example:

```clike
askAi('Event Classifier', concat('Is this user agent a bot? Answer yes or no. ', ${UserAgent}))
```

The model is asked once per value, so it is best used on a grouped or otherwise small set of rows.

See [askAi]({{< relref "/docs/reference/expression-functions.md" >}}) for details.


### AI summaries in Reports

A Report can now ask an AI model to summarise the report's data and deliver the summary with the report.
This is enabled with the new **AI Summary** setting on the Report, with the optional **AI Summary Model** and **AI Summary Prompt** settings to choose the model and what to ask it.

The summary is added as a sheet for Excel reports, as a section for Markdown reports, and as a separate file for CSV and TSV reports.
It is also available to email templates as `{{ aiSummary }}`.
If the model cannot be reached the report is still sent, without a summary.


## Processing

### Task creation backoff

Task creation now backs off from processor filters that keep finding no new data to process.
The wait before a filter is checked again starts at `stroom.processor.skipNonProducingFiltersDuration` and grows by that amount after each check that creates no tasks, up to `stroom.processor.skipNonProducingFiltersMaxDuration`.
This reduces futile attempts to create tasks for filters with little or no data.

A filter that needs its data picked up promptly, e.g. one raising alerts from data that arrives only occasionally, can set its own limit using the **Limit Task Creation Delay** and **Max Task Creation Delay** settings on the filter.
See [Add Filter]({{< relref "/docs/concepts/processing/processors-tab.md#add-filter" >}}).


### Task creation budgets per processing profile

The number of tasks to create (`stroom.processor.tasksToCreate`) and the task queue size (`stroom.processor.queueSize`) are now applied separately to each [processing profile]({{< relref "/docs/concepts/processing/_index.md#processing-profiles" >}}), and to the filters that have no profile.
This ensures a busy profile cannot use up all the task creation and leave the nodes of another profile with nothing they are allowed to process.

The total number of tasks created or queued therefore grows with the number of profiles in use.


### Task heartbeats and the Processor Task Reaper

A new **Processor Task Heartbeat** job renews the status time of the tasks a node is processing, so that live long-running tasks can be told apart from tasks owned by a node that has died.
For processing tasks the **Status Time** now shows the time of the last heartbeat.

The master-only **Processor Task Manager Disown Dead Tasks** job has been replaced by a cluster-locked **Processor Task Reaper** job.
This returns processing tasks whose heartbeat has not been renewed within `stroom.processor.taskLeaseTimeout` to the task queue, even when there is no master node.
A node that cannot renew its heartbeats terminates its own in-flight tasks to prevent duplicate output.

See [Jobs]({{< relref "/docs/reference/jobs.md" >}}).

The `stroom.processor.disownDeadTasksAfter` property has been replaced by `stroom.processor.taskLeaseTimeout`.
See [Upgrade Notes]({{< relref "upgrade-notes" >}}).


### Streams no longer skipped during task creation

A stream that was still being committed when task creation read the maximum stream ID could be silently skipped by a processor filter and never processed.
Task creation is now bounded by the maximum stream ID seen on the previous poll, giving such streams time to become visible.

This costs up to one poll interval of extra latency before a new stream gets a task.
It can be turned off by setting `stroom.processor.useMaxMetaIdFromPreviousPoll` to `false`, though this risks streams never being processed.


### Restoring a deleted processor filter

Restoring a logically deleted processor filter, e.g. by importing a filter over one that was deleted, now creates a new filter that takes over its UUID and records the deleted filter as its parent.
Previously the deleted filter's tracker was reset and the filter reused.

This keeps a processor filter ID meaning one fixed body of work, so the completed tasks of the old filter still refer to a tracker that reflects them.
Restoring a filter that still has active tasks no longer fails.


## Pipelines

### Faster stepping

Stepping now uses a stepping data store that caches the data captured while stepping through a pipeline, improving stepping performance.
The store is held on disk under the Stroom temp directory and is configured under the `stroom.pipeline.stepping` property branch.

See [Debugging with stepping mode]({{< relref "/docs/concepts/pipeline-debugging.md#debugging-with-stepping-mode" >}}).


### `bitmap-lookup()` delimiter

The [`bitmap-lookup()`]({{< relref "/docs/reference/xslt-functions/reference-data.md#bitmap-lookup" >}}) XSLT function has an optional sixth argument to set the delimiter placed between the values of the matched bit positions.
It defaults to a single space.

```text
bitmap-lookup(String map, String key, String time, Boolean ignoreWarnings, Boolean trace, String delimiter)
```


## Data Durability

### fsync options for Stroom and Stroom-Proxy

Stroom and Stroom-Proxy can now force data to durable storage (`fsync`) so that data that has been written and acknowledged is not lost if the machine loses power.
Each fsync setting takes one of the values `DISABLED`, `FILE_ONLY`, `DIR_ONLY` or `ENABLED`, so file and directory fsync can be enabled separately.

In Stroom, `stroom.data.store.fsyncMode` controls whether a stream's files and directories are forced to durable storage before the stream is unlocked.

In Stroom-Proxy, the modes are set for each phase of the proxy pipeline under `proxyConfig.fsync`, e.g. `receivingMode` forces received data to durable storage before a receipt response is returned to the sender.
Each forward file destination also has an `fsyncMode` to force forwarded data to durable storage before the proxy's own copy is removed.

All of these default to `ENABLED`.
See [Upgrade Notes]({{< relref "upgrade-notes" >}}).


## Logging

### JSON logging

The `dropwizard-json-logging` library is now included in Stroom and Stroom-Proxy, so the application and request logs can be output in JSON format.
See the {{< external-link "Dropwizard JSON layout documentation" "https://www.dropwizard.io/en/stable/manual/configuration.html#json-layout" >}} for the YAML configuration needed to enable it.

The new Stroom-Proxy property `proxyConfig.logStream.useMappedDiagnosticContext` enables structured logging of the send/receive meta data when using JSON logging.
`Type` has also been added to the default list of `proxyConfig.logStream.metaKeys` so the stream type gets logged.


## Security

### API key expiry

The expiry date of an {{< glossary "API Key" >}} is now shown in red when the key has expired or will expire within 30 days, and the text in brackets shows `(EXPIRED)` once the key has expired.
The **Expires** column of the Credentials Manager now uses the same formatting.

A warning is also logged when an API key is used that has expired or will expire within 30 days.

See [API Keys]({{< relref "/docs/guides/automation/api-keys.md" >}}).
