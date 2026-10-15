---
title: "Change Log"
linkTitle: "Change Log"
weight: 50
date: 2026-09-30
tags: 
description: >
  Full list of changes in this release.
---

<!--
To build this list run diff_changelog.sh in the root of the stroom repo.
E.g. ./diff_changelog.sh 7.13 7.14 | sed -E -e 's/^/\n/' -e 's|Issue \*\*#([0-9]+)\*\*|Issue **{{< external-link "#\1" "https://github.com/gchq/stroom/issues/\1" >}}**|g'
-->

## Features and Changes

* Issue **{{< external-link "#5551" "https://github.com/gchq/stroom/issues/5551" >}}** : Display API key expiry date in red when the key is expired or will expire in <30 days. Change the text in brackets to show `(EXPIRED)` when the key has expired.

* Log warnings when an API is used that has expired or will expire in <30days.

* Change the Credentials Manager Expires column to use formatting consisten with the API keys screen.

* Issue **{{< external-link "#5775" "https://github.com/gchq/stroom/issues/5775" >}}** : Add `dropwizard-json-logging` runtime dependency so that JSON format app/request logging can be used. See https://www.dropwizard.io/en/stable/manual/configuration.html#json-layout for details of the YAML configuration required to enable it. Add new proxy config property `proxyConfig.logStream.useMappedDiagnosticContext` to support structured JSON logging. Add `type` to the `proxyConfig.logStream.metaKeys` default list so the stream type gets logged.

* Change all uses of `Math.random()` to instead use `ThreadLocalRandom` instead. Affects `random` xslt/expr funcs, appender output path selection and data/index volume selection.

* Fix the random distribution of `outputPaths` values in `(File|HDFS|Rolling)Appender`. First and last items in the list were getting a lower share than other values.

* Fix NPE if `outputPaths` is null on `(Rolling|Hdfs|File)Appender`.

* Uplift AWS SDK to v2.40.5.

* Issue **{{< external-link "#5771" "https://github.com/gchq/stroom/issues/5771" >}}** : Traces: store, publish and browse as a first-class document type on a shared fs.

* Issue **{{< external-link "#5546" "https://github.com/gchq/stroom/issues/5546" >}}** : Add an S3 forwarder to proxy to forward proxy format ZIPs to S3. Add an SQS consumer to Stroom to consume S3 create events and create a meta record for the S3 based file. Add the volume type `S3 v1 (Read only)` for reading data from an S3 store that Stroom only has read access to.

* Issue **{{< external-link "#5279" "https://github.com/gchq/stroom/issues/5279" >}}** : Add experimental volume type `S3 v2 (Experimental)` that uses framed ZStandard compression. This is work in progress and not for production use.

* Issue **{{< external-link "#5662" "https://github.com/gchq/stroom/issues/5662" >}}** : Add stepping data store to cache stepping data and improve stepping performance.

* Issue **{{< external-link "#5690" "https://github.com/gchq/stroom/issues/5690" >}}** : Add task creation linear backoff to reduce futile attempts to create tasks for filters with less/no data to process.

* Issue **{{< external-link "#5691" "https://github.com/gchq/stroom/issues/5691" >}}** : Add task creation budgets per processor profile to ensure all profiles get tasks to process.

* Issue **{{< external-link "#5699" "https://github.com/gchq/stroom/issues/5699" >}}** : Add a per-task heartbeat job that renews the status time of tasks a node is processing, so live long-running tasks can be told apart from tasks owned by a dead node. Note that for processing tasks the Status Time now shows the time of the last heartbeat.

* Issue **{{< external-link "#5699" "https://github.com/gchq/stroom/issues/5699" >}}** : Replace the master-only Disown Dead Tasks job with a cluster-locked Processor Task Reaper driven by per-task heartbeats: stale processing tasks are returned to the task queue even when there is no master node, a node that cannot renew its heartbeats terminates its own in-flight tasks to prevent duplicate output, and a task status write that loses its optimistic lock is abandoned instead of forced. The stroom.processor.disownDeadTasksAfter property is replaced by stroom.processor.taskLeaseTimeout. This must not be deployed in the same release as the task heartbeat change - every node must already be heart-beating before the reaper replaces the node-contact check, or long-running tasks on not-yet-upgraded nodes will be falsely reaped.

* Issue **{{< external-link "#5699" "https://github.com/gchq/stroom/issues/5699" >}}** : Add the per node processor task availability summary and eligible filter computation that let a worker node work out for itself which processor filters it is allowed to process and which of them have tasks waiting, in a single query rather than one per filter. Not yet used to claim tasks. Adds the stroom.processor.taskAvailabilityInterval property.

* Issue **{{< external-link "#5699" "https://github.com/gchq/stroom/issues/5699" >}}** : Restoring a logically deleted processor filter, e.g. by importing a filter over one that was deleted, now replaces it with a new filter that takes over its UUID and records the deleted filter as its parent, instead of resetting the deleted filter's tracker and reusing it. This keeps a processor filter ID meaning one fixed body of work, so that the completed tasks of the old filter still refer to a tracker that reflects them, and adds the processor_filter.parent_filter_id column. Note that restoring a filter that still has active tasks no longer fails.

* Issue **{{< external-link "#5699" "https://github.com/gchq/stroom/issues/5699" >}}** : Add an experimental mode, stroom.processor.claimTasksOnWorker, **off by default**, in which each worker node finds and claims its own processor tasks directly from the database rather than being fed by the task queue held in memory on the master node. It is not yet proven in production, so leave it off unless you have been asked to trial it; with it off Stroom behaves as before, using the master's task queue. A worker knows which filters its own processing profiles allow it to run, so it no longer has to be guessed at on its behalf, and task assignment no longer depends on there being a master node. Tasks are claimed with SKIP LOCKED so that nodes claiming at the same time get different tasks, oldest first. A new ProcessorTaskClaiming system info entry gathers what every node is doing at the moment it is asked, replacing the master only view of the task queue. This must be set the same on every node and changing it is a hard cutover: stop the whole cluster, change the value everywhere, then start it again. Running a mixed cluster is not supported. Tasks left behind by either mode are returned to the created state and reprocessed, so switching either way loses no work, though tasks that were in flight when the cluster stopped wait for stroom.processor.taskLeaseTimeout before another node picks them up. The Processor Task Reaper also returns any tasks left behind by the master's queue to the created state once this mode is on.

* Issue **{{< external-link "#1890" "https://github.com/gchq/stroom/issues/1890" >}}** : Add an optional sixth argument to `bitmap-lookup` to set the delimiter placed between the values of the matched bit positions. Defaults to a single space.

* Issue **{{< external-link "#5751" "https://github.com/gchq/stroom/issues/5751" >}}** : Add `ask-ai()` XSLT and `askAi()` StroomQL functions to ask a named OpenAI model a question and return its answer.

* Issue **{{< external-link "#5761" "https://github.com/gchq/stroom/issues/5761" >}}** : Add AI summaries to reports.


## Bug Fixes

* Fix null pointer exception when entering an empty expiry date for an API key.

* Add missing cache invalidation to API Key Cache when API keys are updated/deleted.

* Fix API authentication on proxy and stroom datafeed. Proxy can now use either the forwarder configured API key or the downstream host configured API key to forward to stroom.

* Issue **{{< external-link "#5817" "https://github.com/gchq/stroom/issues/5817" >}}** : Change fsync configuration to allow file and directory fsync to be enabled/disabled separately. All fsync props have been changed from a boolean to an enum with values (DISALBED|FILE_ONLY|DIR_ONLY|ENABLED). The proxy config prop `proxyConfig.forwardFileDestinations[*].fsyncEnabled` has changed to `proxyConfig.forwardFileDestinations[*].fsyncMode`. The proxy props `proxyConfig.fsync.(aggregateInputQueue|forwardingInputQueue|preAggregateInputQueue|receiving|zipSplittingInputQueue)` have been renamed to `proxyConfig.fsync.(aggregateInputQueueMode|forwardingInputQueueMode|preAggregateInputQueueMode|receivingMode|zipSplittingInputQueueMode)`. The stroom prop `appConfig.data.store.fsyncEnabled` has been reanamed to `appConfig.data.store.fsyncMode`.

* Issue **{{< external-link "#5818" "https://github.com/gchq/stroom/issues/5818" >}}** : Add missing `lucene-backward-codecs:10.3.2` runtime dependency.

* Issue **{{< external-link "#5809" "https://github.com/gchq/stroom/issues/5809" >}}** : Change the Admin account bootstrap process to use `tryLock` rather than `lock` to save holding up the other nodes.

* Issue **{{< external-link "#5811" "https://github.com/gchq/stroom/issues/5811" >}}** : Fix json deserialisation of data feed identities file that was causing `No value type configured for ObjectReader`.

* Issue **{{< external-link "#5721" "https://github.com/gchq/stroom/issues/5721" >}}** : Fix Git sync failing with `Not in GZIP format` when something between Stroom and the Git server decompresses the response but leaves the `Content-Encoding: gzip` header in place. Stroom now ignores a `Content-Encoding` that the body contradicts, and logs a warning naming the problem.

* Issue **{{< external-link "#5801" "https://github.com/gchq/stroom/issues/5801" >}}** : Fix Jackson deserialisation of primitives where value is null.

* Issue **{{< external-link "#5799" "https://github.com/gchq/stroom/issues/5799" >}}** : Add fsync options to Stroom-Proxy so data can be forced to durable storage before receipt is acknowledged and after forwarding. Configured per pipeline phase under `proxyConfig.fsync` and per forward file destination via `fsyncEnabled`.

* Issue **{{< external-link "#5804" "https://github.com/gchq/stroom/issues/5804" >}}** : Add fsync option to the app to improve data durability.

* Issue **{{< external-link "#5773" "https://github.com/gchq/stroom/issues/5773" >}}** : Report a clear error when a dense vector rerank score field is queried without its matching rerank value field, rather than failing with a null pointer error.

* Issue **{{< external-link "#5800" "https://github.com/gchq/stroom/issues/5800" >}}** : Log audit events for node group membership changes and for setting a global config property. Both were silently producing no audit event because the automatic logger could not determine a before or after value.

* Issue **{{< external-link "#5793" "https://github.com/gchq/stroom/issues/5793" >}}** : Fix `No enabled forward destinations are configured` error when booting proxy with only an S3 forward destination enabled.

* Fix error handling in stream viewer when data does not exist in S3.

* Issue **{{< external-link "#5683" "https://github.com/gchq/stroom/issues/5683" >}}** : Fix processor filters silently skipping a stream that was still being committed when task creation read the max stream id, leaving it permanently unprocessed. Task creation is now bounded by the max stream id seen on the previous poll, which costs up to one poll interval of extra latency before a new stream gets a task and can be turned off with the property `stroom.processor.useMaxMetaIdFromPreviousPoll`.

* Issue **{{< external-link "#5713" "https://github.com/gchq/stroom/issues/5713" >}}** : Fix `bitmap-lookup` returning the values of the matched bit positions concatenated with no delimiter. The values are now space delimited as documented.

* DataGen Issues.

