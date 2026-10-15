---
title: "New Features"
linkTitle: "New Features"
weight: 10
date: 2026-03-04
tags: 
description: >
  New features in Stroom version 7.11.
---

## Data Receipt

### Data Receipt Rules

A new {{< stroom-menu "Administration" "Data Receipt Rules" >}} screen lets you define rules that decide whether received data is accepted, rejected or silently dropped.
Each rule is an expression over the meta attributes (headers) of the received data, and the first matching rule wins.
Access to the screen requires the new `Manage Data Receipt Rules` application permission.

The rules are used when `.receive.receiptCheckMode` is set to `RECEIPT_POLICY`.
Stroom-Proxy fetches the rules from the Stroom (or Stroom-Proxy) downstream of it, so every Stroom-Proxy in the chain must use the same mode.

The following properties have been added to Stroom:

* `stroom.receiptPolicy.obfuscatedFields` - The fields whose values in the rules are hashed before the rules are passed to Stroom-Proxy.
* `stroom.receiptPolicy.obfuscationHashAlgorithm` - The hash algorithm used for those fields.
* `stroom.receiptPolicy.receiptRulesInitialFields` - The initial set of fields (and their types) offered on the Data Receipt Rules screen.

Stroom-Proxy has the new property `proxyConfig.receiptPolicy.receiveDataRulesUrl`, which defaults to using the downstream host.

See [Data receipt rules]({{< relref "/docs/concepts/data-receipt.md#data-receipt-rules" >}}).


### Receipt Check Mode

The new property `.receive.receiptCheckMode` controls how Stroom and Stroom-Proxy check received data.
It takes one of these values:

* `FEED_STATUS` - The default; the feed's status decides.
* `RECEIPT_POLICY` - The Data Receipt Rules decide.
* `FEED_EXISTENCE` - Data is accepted if its feed exists, whatever the feed's status.
* `RECEIVE_ALL` - All data is accepted, with no feed check.
* `DROP_ALL` - All data is silently dropped.
* `REJECT_ALL` - All data is rejected.

On Stroom-Proxy this replaces `feedStatus.enabled`.
See [Deciding what to accept]({{< relref "/docs/concepts/data-receipt.md#deciding-what-to-accept" >}}) and [Upgrade Notes]({{< relref "upgrade-notes" >}}).


### Maximum Request Size

The new property `.receive.maxRequestSize` sets the maximum size of a request to `/datafeed` on Stroom and Stroom-Proxy (uncompressed, for gzip requests).
Requests that exceed it are rejected with HTTP status `413` and Stroom status `410` (_Content too large_).
It is unset by default, i.e. no limit.

See [Response codes]({{< relref "/docs/reference/response-codes.md" >}}).


## Stroom-Proxy

### Downstream Host

Stroom-Proxy now has a single `proxyConfig.downstreamHost` branch that describes the Stroom or Stroom-Proxy immediately downstream of it.
It is used for forwarding, feed status checks, fetching the Data Receipt Rules and verifying API keys.

The properties `forwardUrl`, `livenessCheckUrl`, `apiKeyVerificationUrl` and `feedStatus.url` are now empty by default and can hold either just a path or a full URL.
If they are empty or only hold a path, the host details come from `downstreamHost`.

See [`downstreamHost`]({{< relref "/docs/operate/install/a-proxy.md#downstreamhost" >}}).


### Forward Destination Liveness Checks

The new property `livenessCheckEnabled` on each item in `forwardHttpDestinations` controls whether Stroom-Proxy checks that the destination is live.
It defaults to `true`.


## Content Management

### Content Store

The new {{< stroom-menu "Tools" "Content Store" >}} screen lists ready-made content packs and installs them.
Installing a pack creates a Git Repo document for it and pulls its content from Git.
When a newer version of an installed pack is available, it can be upgraded from the same screen.

The content stores to list are set by `stroom.contentStore.urls`, which defaults to the public Stroom content store.

See [The content store]({{< relref "/docs/guides/content-management.md#the-content-store" >}}).


### Git Repos and the Credentials Manager

The Git Repo document now refers to a stored credential by name rather than holding a username and password itself.
Credentials are managed on the new {{< stroom-menu "Security" "Credentials Manager" >}} screen, which requires the `Credentials` application permission.
A credential can be a username and password, an access token, an SSH key or a key store.

A Git Repo can also now be pinned to a specific commit using the _Git commit_ setting.

See [Git-backed content]({{< relref "/docs/guides/content-management.md#git-backed-content" >}}).


### Importing Content Using `autoImport`

A new `autoImport` servlet allows a content export ZIP file to be imported by posting it to Stroom, without the confirmation step of the import screen.
This is intended to simplify importing content as part of automated deployment.


## Stroom AI

### Ask Stroom AI

Stroom can now use an AI model to answer questions about the data in Dashboard and Query tables.
Click the **Ask Stroom AI** button on a table, or right-click on the table and choose **Ask Stroom AI About** followed by the cell, row, selected rows, column or whole table that you want to ask about.
Only the visible columns of the table are passed to the AI model.

The AI model is defined using the new _OpenAI Model_ document, which holds the base URL, API key, model ID and maximum context window tokens for any OpenAI compatible API.
The document's _Set Http Client Config_ button controls how Stroom connects to the API, including the TLS key stores to use.

The chat memory and table summary limits are set under the `stroom.askStroomAi` property branch.


### Dense Vector Fields in Lucene Indexes

Lucene indexes now support a dense vector field type for k-nearest neighbour (KNN) vector search.
This allows searches that match documents that are semantically related to the search text rather than matching specific terms.

The settings for a dense vector field include the _Embedding Model_ (an OpenAI Model document), the _Vector Similarity Function Type_, the _Segment Size_ and _Overlap Size_ for splitting the text, and the _Nearest Neighbour Count_.

See [Fields tab]({{< relref "/docs/concepts/lucene-index.md#fields-tab" >}}).


### Elasticsearch kNN Search

Searches on an {{< glossary "Elasticsearch" >}} index now support kNN search on `dense_vector` fields.

See [Elasticsearch]({{< relref "/docs/guides/indexing/elasticsearch.md" >}}).


## Dashboard & StroomQL Functions

### `inRange(...)`

Returns `true` if a value is between the lower and upper bounds (inclusive).
All arguments must be either numbers or ISO date strings.

```text
inRange(value, lower, upper)
```

For example, `inRange(${Bytes}, 1000, 2000)`.

See [inRange]({{< relref "/docs/reference/expression-functions.md" >}}).


### `hostName(...)` & `hostAddress(...)`

`hostName` returns the host name for an IP address and `hostAddress` returns the IP address for a host name.

```text
hostName(host)
hostAddress(host)
```

See [hostName]({{< relref "/docs/reference/expression-functions.md" >}}) and [hostAddress]({{< relref "/docs/reference/expression-functions.md" >}}).


## Stroom XSLT Functions

### `add-meta(...)`

Adds a meta attribute to the meta data of the stream being processed.

```text
add-meta(key, value)
```

This can be used, for example, to set HTTP headers that a {{< pipe-elm "HTTPAppender" >}} will send (subject to its header allow and deny lists).

See [add-meta()]({{< relref "/docs/reference/xslt-functions/output-and-logging.md#add-meta" >}}).


## Pipelines

### Stepping Mode

A Pipeline now has an **Enter Stepping Mode** button on its toolbar.
This replaces the _Structure_ tab with the stepper so that you can step data through the pipeline without leaving it, choosing the streams to step through using the **Filter Streams** dialog.

The stepping filters on an element now also have the match types _Does not contain_ and _Does not exist_.

See [Debugging with stepping mode]({{< relref "/docs/concepts/pipeline-debugging.md#debugging-with-stepping-mode" >}}).


### Pipeline Element Names & Descriptions

Pipeline elements can now be renamed and given an optional description using the **Edit Pipeline Element** dialog.
The description is shown when hovering over the element in the pipeline structure.


### DictionaryAppender

Added in v7.11.4.

The new {{< pipe-elm "DictionaryAppender" >}} pipeline destination writes the output of a pipeline into a {{< glossary "Dictionary" >}}, overwriting all previous content of the Dictionary.

See [DictionaryAppender]({{< relref "/docs/reference/pipeline-elements.md#dictionaryappender" >}}).


### XMLWriter Escape Switching

Added in v7.11.1.

The {{< pipe-elm "XMLWriter" >}} has a new property `preventEscapeSwitching`.
Some input data contains the control character `0`, which turns off output escaping; set this property to `true` to prevent that.

See [XMLWriter]({{< relref "/docs/reference/pipeline-elements.md#xmlwriter" >}}).


### XML Schema Validation on Save

An XML Schema document is now validated when it is saved.


## Processing

### Feed Dependencies

A {{< glossary "Processor filter" >}} can now have feed dependencies, which delay the processing of its data until data for the dependent feeds (e.g. reference data) is available.
Each dependency names a feed and a stream type.

The **Set Feed Dependencies** dialog also has optional _Minimum Processing Delay_ and _Maximum Processing Delay_ settings.
The minimum delay is how long to wait after the dependencies are satisfied before processing, and the maximum delay is how long to wait for unsatisfied dependencies before processing anyway.


### Processor Filter Tasks

The [Processors tab]({{< relref "/docs/concepts/processing/processors-tab.md" >}}) has a new **Show Tasks** button to show the tasks for the selected processor filter.

On the {{< stroom-menu "Monitoring" "Server Tasks" >}} screen, the context menu for a task now has items to open the feed, pipeline and stream that the task relates to, and to show the tasks for the processor filter.


## Analytic Rules & Reports

### Empty Reports

A Report has a new _Send Empty Reports_ setting.
Untick it to stop a report being sent when its query finds no data.


### Report Email Templates

The template context for Report emails now includes `rowCount`, `fileType` (`EXCEL`, `CSV` or `TSV`) and `fileName`.

See [Report context]({{< relref "/docs/reference/templating.md#report-context" >}}).


### Rule Documentation in Detections

The notification settings of an Analytic Rule have a new _Include Rule Documentation_ option, to control whether the rule's documentation is included in its detections.


### Rerun Scheduled Executions

The execution history of a scheduled Analytic Rule or Report has a new **Rerun** button.


## Annotations

Annotations have been improved further, following the changes in 7.10:

* Annotations can now hold the row data from the table that they were created from.
* Events can be added to an existing annotation using the **Add To Annotation** table context menu item.
* Annotations can be linked to other annotations and to events.
  Comments can also refer to events and to other annotations.
* Annotation entries can be edited and deleted, using **Edit Entry** and **Delete Entry**.
* Changing an annotation's status no longer needs the query to be re-run to show the change.
* Users with access to an annotation can now edit its labels.

See [Annotations]({{< relref "/docs/guides/detection/annotations.md" >}}).


## Dashboards & Tables

### Table Filter Component

A new _Table Filter_ dashboard component provides a filter control for the columns of a table.


### Dictionaries in Column Filters

The include and exclude filters on a table column can now use {{< glossary "Dictionary" "Dictionaries" >}}, using the _Include Dictionaries_ and _Exclude Dictionaries_ settings.


### Copy & Export

Tables now have a **Copy** context menu with items to copy the cell, row, selected rows, column, column for selected rows or the whole table.
There is also an **Export Table** item.


### Maximum String Field Length

The table settings have a new _Override Maximum String Field Length_ option, to set the maximum length of string values in that table rather than using the system default.


### Other Dashboard Changes

* Dashboard panes can be maximised and restored.
* Grouped table rows can be expanded and collapsed, including **Expand All** and **Collapse All**.
* Components can be copied to another dashboard using **Duplicate To...**.
* Links in table cells can be opened in the current tab using **Open In This Tab**, as well as in a new tab.
* Hovering over a column header shows the column's details, e.g. its expression, format, sort, grouping and filters.
* Dashboards only refresh automatically when their tab is selected.
* Search error messages now show their severity.


## User Interface

* Document tabs can be re-ordered by dragging and dropping.
* The tab context menu has new **Close Tabs to the Left**, **Close Tabs to the Right**, **Move First** and **Move Last** items.
* The colour of the selected tab can be set with the property `stroom.ui.theme.selectedTabColour`.
* Property names can be copied from the Properties screen.
* Find in Content now searches document tags.
* A user's groups and permissions can be copied from another user using **Copy user groups and permissions from...**.


## Security

### Auto-Creation of the Admin Account

The new property `stroom.security.identity.autoCreateAdminAccountOnBoot` controls the creation of the default `admin` account when Stroom uses the `INTERNAL_IDP` or `TEST_CREDENTIALS` identity provider type.
If set to `true`, Stroom will create the `admin` account and user on boot, create the `Administrators` group with the `Administrator` application permission, and add `admin` to it.
It defaults to `false`.
This was also released in later v7.10 patch releases.

`TEST_CREDENTIALS` was removed in v7.13; see the [v7.13 breaking changes]({{< relref "../v07.13/breaking-changes#test_credentials-identity-provider-type-removed" >}}).

See [First administrator]({{< relref "/docs/operate/install/first-administrator.md" >}}).


## Monitoring

### Prometheus Metrics

Stroom and Stroom-Proxy now have an admin servlet for Prometheus to scrape metrics from:

```text
http://<host>:<admin port>/stroomAdmin/prometheusMetrics
http://<host>:<admin port>/proxyAdmin/prometheusMetrics
```

Build information metrics `buildVersion`, `buildDate` and `upTime` have also been added.


### Node Status Statistics

The node status statistics now include operating system memory statistics, e.g. `OS Free Memory Size`, `OS Free Swap Space` and `OS Committed Virtual Memory`.


## Query API

A new `GET` endpoint, `/api/query/v1/csv/search`, runs a {{< glossary "StroomQL" >}} query and returns the results as CSV.
It takes the query parameters `query`, `offset` and `length` (default `100`).
