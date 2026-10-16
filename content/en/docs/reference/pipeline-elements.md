---
title: "Pipeline Elements"
linkTitle: "Pipeline Elements"
weight: 40
date: 2026-10-15
tags:
description: >
  Every element you can put in a pipeline, by category, with its properties.
pageKind: reference
aliases:
  - /docs/reference-section/pipeline-elements/
---

A pipeline is a chain of elements.
Data enters at a source, is read, parsed into XML events, transformed by filters, written back into a format, and sent to a destination.

The categories below are that order.
An element's category tells you where in a chain it can go.

There are **45** elements.


## Reader

### BadTextXMLFilterReader

{{< pipe-elm "BadTextXMLFilterReader" >}}

Escapes the content of a configured list of named XML elements that are known to potentially contain un-escaped XML reserved characters.
For example the element `<Expression>$time < now()</Expression>` would be transformed to `<Expression>$time &lt; now()</Expression>` if property `leafList` is set to `Expression`.

| Property | Description | Default | Type |
|---|---|---|---|
| `tags` | A comma separated list of XML element names (case sensitive) between which non-escaped XML characters will be escaped, e.g. '>' => '&gt;'. | - | String |


### BOMRemovalFilterInput

{{< pipe-elm "BOMRemovalFilterInput" >}}

Removes the Byte Order Mark (if present) from the stream.


### FindReplaceFilter

{{< pipe-elm "FindReplaceFilter" >}}

Replaces strings or regexes with new strings.

| Property | Description | Default | Type |
|---|---|---|---|
| `bufferSize` | The number of characters to buffer when matching the regex. | `1000` | Integer |
| `dotAll` | Let '.' match all characters in a regex. | `false` | Boolean |
| `escapeFind` | Whether or not to escape find pattern or text. | `true` | Boolean |
| `escapeReplacement` | Whether or not to escape replacement text. | `true` | Boolean |
| `find` | The text or regex pattern to find and replace. | - | String |
| `maxReplacements` | The maximum number of times to try and replace text. There is no limit by default. | - | String |
| `regex` | Whether the pattern should be treated as a literal or a regex. | `false` | Boolean |
| `replacement` | The replacement text. | - | String |
| `showReplacementCount` | Show total replacement count | `true` | Boolean |


### InvalidCharFilterReader

{{< pipe-elm "InvalidCharFilterReader" >}}

Removes any characters that are not in the standard XML character set.
The version of XML (e.g. 1.0 or 1.1) can be set using the 'xmlVersion' property.

| Property | Description | Default | Type |
|---|---|---|---|
| `warnOnRemoval` | Log a warning if any characters have been removed from the input stream. | `true` | Boolean |
| `xmlVersion` | XML version, e.g. '1.0' or '1.1' | `1.1` | String |


### InvalidXMLCharFilterReader

{{< pipe-elm "InvalidXMLCharFilterReader" >}}

Replaces any characters that are not in the standard XML character set with a '�'.
The version of XML (e.g. 1.0 or 1.1) can be set using the 'xmlVersion' property.

| Property | Description | Default | Type |
|---|---|---|---|
| `warnOnReplacement` | Log a warning if any characters have been replaced in the input stream. | `true` | Boolean |
| `xmlVersion` | XML version, e.g. '1.0' or '1.1' | `1.1` | String |


### Reader

{{< pipe-elm "Reader" >}}

A basic reader that simply decodes the raw bytes using the Feed's configured character encoding.
It does not transform the data in any other way.


## Parser

### CombinedParser

{{< pipe-elm "CombinedParser" >}}

The original general-purpose reader/parser that covers all source data types but provides less flexibility than the source format-specific parsers such as dsParser.
It effectively combines a BOMRemovalFilterInput, an InvalidCharFilterReader and Parser (based on the `type` property.
It is strongly recommended to instead use a combination of Readers and one of the type specific Parsers.
This will make the intent of the pipeline much clearer and allow for much greater control.

| Property | Description | Default | Type |
|---|---|---|---|
| `fixInvalidChars` | Fix invalid XML characters from the input stream. | `false` | Boolean |
| `namePattern` | A name pattern to load a text converter dynamically. | - | String |
| `suppressDocumentNotFoundWarnings` | If the text converter cannot be found to match the name pattern suppress warnings. | `false` | Boolean |
| `textConverter` | The text converter configuration that should be used to parse the input data. | - | Document |
| `type` | The parser type, e.g. 'JSON', 'XML', 'Data Splitter'. | - | String |


### DSParser

{{< pipe-elm "DSParser" >}}

A parser for handling structured plain text data (e.g. CSV or fixed width fields) using the Data Splitter domain specific language.
For more details see Data Splitter.

| Property | Description | Default | Type |
|---|---|---|---|
| `namePattern` | A name pattern to load a data splitter dynamically. | - | String |
| `suppressDocumentNotFoundWarnings` | If the data splitter cannot be found to match the name pattern suppress warnings. | `false` | Boolean |
| `textConverter` | The data splitter configuration that should be used to parse the input data. | - | Document |


### JSONParser

{{< pipe-elm "JSONParser" >}}

A built-in parser for parsing JSON source data (in JSON fragment format) into an XML representation of the JSON.
The Resulting XML will conform to the http://www.w3.org/2013/XSL/json namespace.

| Property | Description | Default | Type |
|---|---|---|---|
| `addRootObject` | Add a root map element. | `true` | Boolean |
| `allowBackslashEscapingAnyCharacter` | Feature that can be enabled to accept quoting of all character using backslash quoting mechanism: if not enabled, only characters that are explicitly listed by JSON specification can be thus escaped (see JSON spec for small list of these characters) | `false` | Boolean |
| `allowComments` | Feature that determines whether parser will allow use of Java/C++ style comments (both '/'+'*' and '//' varieties) within parsed content or not. | `false` | Boolean |
| `allowMissingValues` | Feature allows the support for "missing" values in a JSON array: missing value meaning sequence of two commas, without value in-between but only optional white space. | `false` | Boolean |
| `allowNonNumericNumbers` | Feature that allows parser to recognize set of "Not-a-Number" (NaN) tokens as legal floating number values (similar to how many other data formats and programming language source code allows it). | `false` | Boolean |
| `allowNumericLeadingZeros` | Feature that determines whether parser will allow JSON integral numbers to start with additional (ignorable) zeroes (like: 000001). | `false` | Boolean |
| `allowSingleQuotes` | Feature that determines whether parser will allow use of single quotes (apostrophe, character '\'') for quoting Strings (names and String values). If so, this is in addition to other acceptable markers but not by JSON specification). | `false` | Boolean |
| `allowTrailingComma` | Feature that determines whether we will allow for a single trailing comma following the final value (in an Array) or member (in an Object). These commas will simply be ignored. | `false` | Boolean |
| `allowUnquotedControlChars` | Feature that determines whether parser will allow JSON Strings to contain unquoted control characters (ASCII characters with value less than 32, including tab and line feed characters) or not. If feature is set false, an exception is thrown if such a character is encountered. | `false` | Boolean |
| `allowUnquotedFieldNames` | Feature that determines whether parser will allow use of unquoted field names (which is allowed by Javascript, but not by JSON specification). | `false` | Boolean |
| `allowYamlComments` | Feature that determines whether parser will allow use of YAML comments, ones starting with '#' and continuing until the end of the line. This commenting style is common with scripting languages as well. | `false` | Boolean |
| `maxDepth` | Maximum number of levels in the JSON document. An Error will be logged if this is exceeded. | `500` | Integer |
| `maxStringLength` | String values longer than this length will result in an Error being logged, regardless of the value of stringTruncateLength. Setting this to a very large value effectively disables this. | `100000000` | Integer |
| `stringTruncateLength` | String values will be truncated to this length. This is to protect Stroom from running out of memory when there are very large string values in the JSON. When a value is truncated a Warning will be logged.Setting this to a very large value effectively disables this. | `10000` | Integer |


### XMLFragmentParser

{{< pipe-elm "XMLFragmentParser" >}}

A parser to convert multiple XML fragments into an XML document.
For example the data may contain: ```xml <Event>...</Event> <Event>...</Event> ``` i.e. with no root element, so not valid XML.
The XMLFragmentParser will wrap the fragments with a root element as defined in the TextConverter document configured with the `textConverterRef` property.

| Property | Description | Default | Type |
|---|---|---|---|
| `namePattern` | A name pattern to load a text converter dynamically. | - | String |
| `suppressDocumentNotFoundWarnings` | If the text converter cannot be found to match the name pattern suppress warnings. | `false` | Boolean |
| `textConverter` | The XML fragment wrapper that should be used to wrap the input XML. | - | Document |


### XMLParser

{{< pipe-elm "XMLParser" >}}

A parser to parse data that is expected to be XML into a series of XML events that can be consumed by a Filter element.


## Filter

### DynamicIndexingFilter

{{< pipe-elm "DynamicIndexingFilter" >}}

A filter to send source data to an index.

| Property | Description | Default | Type |
|---|---|---|---|
| `index` | The index to send records to. | - | Document |


### DynamicSearchResultOutputFilter

{{< pipe-elm "DynamicSearchResultOutputFilter" >}}

Used in a search extraction pipeline for extracting field values that have not been stored in the index and where the fields are dynamic and derived from the data rather than being defined in the Index settings.
Consumes XML events in the `index-documents:1` namespace to convert them into a form so that they can be used in a Dashboard/Query/Analytic.


### ElasticIndexingFilter

{{< pipe-elm "ElasticIndexingFilter" >}}

A filter consuming XML events in the `records:2` namespace to index/store the fields and their values in an Elasticsearch Index.

| Property | Description | Default | Type |
|---|---|---|---|
| `batchSize` | Maximum number of documents to index in each bulk request. | `10000` | Integer |
| `cluster` | Target Elasticsearch cluster. | - | Document |
| `indexName` | Name of the Elasticsearch index. Variables specified such as `{year}` are replaced with the corresponding field values contained in the document root. Field names beginning with an underscore are not written to the document and are only used in the index name pattern. | - | String |
| `ingestPipeline` | Name of the Elasticsearch ingest pipeline to execute when indexing. | - | String |
| `purgeOnReprocess` | When reprocessing a stream, first delete any documents from the index matching the source stream ID. | `true` | Boolean |
| `refreshAfterEachBatch` | Refresh the index after each batch is processed, making the indexed documents visible to searches. | `false` | Boolean |


### HttpPostFilter

{{< pipe-elm "HttpPostFilter" >}}

This element is deprecated, you should instead use the much more flexible {{< pipe-elm "HTTPAppender" >}}.
This element will simply POST the output of the XML events to the configured URL.

| Property | Description | Default | Type |
|---|---|---|---|
| `receivingApiUrl` | The URL of the receiving API. | - | String |


### IdEnrichmentFilter

{{< pipe-elm "IdEnrichmentFilter" >}}

Adds the attributes 'StreamId' and 'EventId' to the 'event' element to enrich the event with its ordinal number in the stream and the ID of the stream that it belongs to.
ID enrichment is required to be able to index events as it provides them with an ID that is unique within Stroom.
It assumes that an record/event is an XML element at the first level below the root element, i.e. for 'event-logging:3' XML this means the `<Event>` element.


### IndexingFilter

{{< pipe-elm "IndexingFilter" >}}

A filter consuming XML events in the `records:2` namespace to index/store the fields and their values in a Lucene Index.

| Property | Description | Default | Type |
|---|---|---|---|
| `index` | The index to send records to. | - | Document |


### MergeFilter

{{< pipe-elm "MergeFilter" >}}

Merges XML that has been split into separate XML instances.

| Property | Description | Default | Type |
|---|---|---|---|
| `mergeDepth` | The depth of XML elements to merge at. | `1` | Integer |


### PlanBFilter

{{< pipe-elm "PlanBFilter" >}}

Takes XML input (conforming to the reference-data:2 schema) and loads the data into the Plan B State Store.
Reference data values can be either simple strings or XML fragments.


### RecordCountFilter

{{< pipe-elm "RecordCountFilter" >}}

Counts events/records in the stream.
An event/record is taken to be an XML element that is at the first level below the root element, i.e. for 'event-logging:3' XML this means the `<Event>` element.

| Property | Description | Default | Type |
|---|---|---|---|
| `countRead` | Is this filter counting records read or records written? | `true` | Boolean |
| `recordDepth` | The depth of XML elements to count records. | `1` | Integer |


### RecordOutputFilter

{{< pipe-elm "RecordOutputFilter" >}}

Filters out records/events that have raised an Error or Fatal Error during processing.
If all records/events have raised at least an Error then no XML events will be output.
It assumes that an record/event is an XML element at the first level below the root element, i.e. \ for 'event-logging:3' XML this means the `<Event>` element.""\",


### ReferenceDataFilter

{{< pipe-elm "ReferenceDataFilter" >}}

Takes XML input (conforming to the reference-data:2 schema) and loads the data into the Reference Data Store.
Reference data values can be either simple strings or XML fragments.

| Property | Description | Default | Type |
|---|---|---|---|
| `overrideExistingValues` | Allow duplicate keys to override existing values? | `true` | Boolean |
| `warnOnDuplicateKeys` | Warn if there are duplicate keys found in the reference data? | `false` | Boolean |


### SafeXMLFilter

{{< pipe-elm "SafeXMLFilter" >}}

Restricts the characters to a very simple set consisting of `[a-zA-Z0-9]` and `[ .:-_/]`.
All other characters are replaced by `~NNN`, where `NNN` is a three digit codepoint for the replaced character.


### SchemaFilter

{{< pipe-elm "SchemaFilter" >}}

Checks the format of the source data against one of a number of XML schemas.
This ensures that if non-compliant data is generated, it will be flagged as in error and will not be passed to any subsequent processing elements.

| Property | Description | Default | Type |
|---|---|---|---|
| `namespaceURI` | Limits the schemas that can be used to validate data to those with a matching namespace URI. | - | String |
| `schemaGroup` | Limits the schemas that can be used to validate data to those with a matching schema group name. | - | String |
| `schemaLanguage` | The schema language that the schema is written in. | `XMLConstants.W3C_XML_SCHEMA_NS_URI` | String |
| `schemaValidation` | Should schema validation be performed? | `true` | Boolean |
| `systemId` | Limits the schemas that can be used to validate data to those with a matching system id. | - | String |


### SearchResultOutputFilter

{{< pipe-elm "SearchResultOutputFilter" >}}

Used in a search extraction pipeline for extracting field values that have not been stored in the index and where the field definitions are defined in the Index settings.
Consumes XML events in the `records:2` namespace to convert them into a form so that they can be used in a Dashboard/Query/Analytic.


### SolrIndexingFilter

{{< pipe-elm "SolrIndexingFilter" >}}

Delivers source data to the specified index in an external Solr instance/cluster.

| Property | Description | Default | Type |
|---|---|---|---|
| `batchSize` | How many documents to send to the index in a single post. | `1000` | Integer |
| `commitWithinMs` | Commit indexed documents within the specified number of milliseconds. | `-1` | Integer |
| `index` | The index to send records to. | - | Document |
| `softCommit` | Perform a soft commit after every batch so that docs are available for searching immediately (if using NRT replicas). | `true` | Boolean |


### SplitFilter

{{< pipe-elm "SplitFilter" >}}

Splits multi-record source data into smaller groups of records prior to delivery to an XSLT.
This allows the XSLT to process data more efficiently than loading a potentially huge input stream into memory.

| Property | Description | Default | Type |
|---|---|---|---|
| `splitCount` | The number of elements at the split depth to count before the XML is split. | `10000` | Integer |
| `splitDepth` | The depth of XML elements to split at. | `1` | Integer |
| `storeLocations` | Should this split filter store processing locations. | `true` | Boolean |


### SqlStoreFilter

{{< pipe-elm "SqlStoreFilter" >}}

Takes XML input (conforming to the reference-data:2 schema) and loads the data into the SQL Updatable Temporal Store.


### StatisticsFilter

{{< pipe-elm "StatisticsFilter" >}}

An element to allow the source data (conforming to the `statistics` XML Schema) to be sent to the MySQL based statistics data store.

| Property | Description | Default | Type |
|---|---|---|---|
| `statisticsDataSource` | The statistics data source to record statistics against. | - | Document |


### XPathExtractionOutputFilter

{{< pipe-elm "XPathExtractionOutputFilter" >}}

*Not described in the source.*

| Property | Description | Default | Type |
|---|---|---|---|
| `multipleValueDelimiter` | The string to delimit multiple simple values. | `,` | String |


### XSLTFilter

{{< pipe-elm "XSLTFilter" >}}

An element used to transform XML data from one form to another using XSLT.
The specified XSLT can be used to transform the input XML into XML conforming to another schema or into other forms such as JSON, plain text, etc.

| Property | Description | Default | Type |
|---|---|---|---|
| `pipelineReference` | A list of places to load reference data from if required. | - | PipelineReference |
| `suppressXSLTNotFoundWarnings` | If XSLT cannot be found to match the name pattern suppress warnings. | `false` | Boolean |
| `usePool` | Advanced: Choose whether or not you want to use cached XSLT templates to improve performance. | `true` | Boolean |
| `xslt` | The XSLT to use. | - | Document |
| `xsltNamePattern` | A name pattern to load XSLT dynamically. | - | String |


## Writer

### JSONWriter

{{< pipe-elm "JSONWriter" >}}

Writer to convert XML data conforming to the http://www.w3.org/2013/XSL/json XML Schema into JSON format.

| Property | Description | Default | Type |
|---|---|---|---|
| `encoding` | The output character encoding to use. | `UTF-8` | String |
| `indentOutput` | Should output JSON be indented and include new lines (pretty printed)? | `false` | Boolean |


### TextWriter

{{< pipe-elm "TextWriter" >}}

Writer to convert XML character data events into plain text output.

| Property | Description | Default | Type |
|---|---|---|---|
| `encoding` | The output character encoding to use. | `UTF-8` | String |
| `footer` | Footer text that can be added to the output at the end. | - | String |
| `header` | Header text that can be added to the output at the start. | - | String |


### XMLWriter

{{< pipe-elm "XMLWriter" >}}

Writer to convert XML events data into XML output in the specified character encoding.

| Property | Description | Default | Type |
|---|---|---|---|
| `encoding` | The output character encoding to use. | `UTF-8` | String |
| `indentOutput` | Should output XML be indented and include new lines (pretty printed)? | `false` | Boolean |
| `preventEscapeSwitching` | Some inputs might contain control character 0 which turns off output escaping. Set this to true to prevent that behaviour. | `false` | Boolean |
| `suppressXSLTNotFoundWarnings` | If XSLT cannot be found to match the name pattern suppress warnings. | `false` | Boolean |
| `xslt` | A previously saved XSLT, used to modify the output via xsl:output attributes. | - | Document |
| `xsltNamePattern` | A name pattern for dynamic loading of an XSLT, that will modfy the output via xsl:output attributes. | - | String |


## Destination

### AnnotationWriter

{{< pipe-elm "AnnotationWriter" >}}

Consume XML documents in the `annotation:1` namespace and writes them as Stroom Annotations.
Allows for the annotating of events that meet some criteria.


### DictionaryAppender

{{< pipe-elm "DictionaryAppender" >}}

A destination used to write the output stream to a dictionary overwriting all previous data.

| Property | Description | Default | Type |
|---|---|---|---|
| `dictionary` | The dictionary that output text should be written to. | - | Document |


### FileAppender

{{< pipe-elm "FileAppender" >}}

A destination used to write an output stream to a file on the file system.
If multiple paths are specified in the 'outputPaths' property it will pick one at random to write to.

| Property | Description | Default | Type |
|---|---|---|---|
| `compressionMethod` | Compression method to apply, if compression is enabled. Supported values: bzip2, deflate, gz, lz4-block, lz4-framed, lzma, pack200, snappy-framed, xz, zip, zstd. | `gz` | String |
| `filePermissions` | Set file system permissions of finished files (example: 'rwxr--r--') | - | String |
| `outputPaths` | One or more destination paths for output files separated with commas. Replacement variables can be used in path strings such as ${feed}. | - | String |
| `rollSize` | When the current output file exceeds this size it will be closed and a new one created. | - | String |
| `splitAggregatedStreams` | Choose if you want to split aggregated streams into separate output files. | `false` | Boolean |
| `splitRecords` | Choose if you want to split individual records into separate output files. | `false` | Boolean |
| `useCompression` | Apply compression to output files. | `false` | Boolean |


### HDFSFileAppender

{{< pipe-elm "HDFSFileAppender" >}}

A destination used to write an output stream to a file on a Hadoop Distributed File System.
If multiple paths are specified in the 'outputPaths' property it will pick one at random.

| Property | Description | Default | Type |
|---|---|---|---|
| `fileSystemUri` | URI for the Hadoop Distributed File System (HDFS) to connect to, e.g. hdfs://mynamenode.mydomain.com:8020 | - | String |
| `outputPaths` | One or more destination paths for output files separated with commas. Replacement variables can be used in path strings such as ${feed}. | - | String |
| `rollSize` | When the current output file exceeds this size it will be closed and a new one created. | - | String |
| `runAsUser` | The user to connect to HDFS as | - | String |
| `splitAggregatedStreams` | Choose if you want to split aggregated streams into separate output files. | `false` | Boolean |
| `splitRecords` | Choose if you want to split individual records into separate output files. | `false` | Boolean |


### HTTPAppender

{{< pipe-elm "HTTPAppender" >}}

A destination used to write an output stream to a remote HTTP(S) server.
This element should be preferred over the deprecated {{< pipe-elm "HttpPostFilter" >}}.

| Property | Description | Default | Type |
|---|---|---|---|
| `compressionMethod` | Compression method to apply, if compression is enabled. Supported values: bzip2, deflate, gz, lz4-block, lz4-framed, lzma, pack200, snappy-framed, xz, zip, zstd. | `gz` | String |
| `connectionRequestTimeout` | Returns the connection lease request timeout used when requesting a connection from the connection manager. Default: 3 minutes. The timeout is specified as either milliseconds, e.g. '60000' or with a duration suffix, e.g. '500ms', '2s', '1m', etc. | - | String |
| `connectionTimeout` | Determines the timeout until a new connection is fully established. This may also include transport security negotiation exchanges such as SSL or TLS protocol negotiation. A timeout value of zero is interpreted as an infinite timeout. Default: 3 minutes. The timeout is specified as either milliseconds, e.g. '60000' or with a duration suffix, e.g. '500ms', '2s', '1m', etc. | - | String |
| `contentType` | The content type | `application/json` | String |
| `forwardChunkSize` | Should data be sent in chunks and if so how big should the chunks be. Size is either specified in bytes e.g. '1024' or with a IEC unit suffix, e.g. '1K', '1M', '1G', etc. | - | String |
| `forwardUrl` | The URL to send data to. | - | String |
| `hostnameVerificationEnabled` | Set this to true to verify that the destination host name matches against the host names in the certificate supplied by the destination server. | `true` | Boolean |
| `httpHeadersIncludeStreamMetaData` | Provide stream metadata as HTTP headers | `true` | Boolean |
| `httpHeadersStreamMetaDataAllowList` | Comma delimited list of stream meta data keys to include as HTTP headers. Only works when httpHeadersIncludeStreamMetaData is set to true. If empty all headers are sent, unless httpHeadersStreamMetaDataDenyList is used. If httpHeadersStreamMetaDataAllowList contains keys, httpHeadersStreamMetaDataDenyList is ignored. | - | String |
| `httpHeadersStreamMetaDataDenyList` | Comma delimited list of stream meta data keys to exclude as HTTP headers. Only works when httpHeadersIncludeStreamMetaData is set to true. If empty all headers are sent, unless httpHeadersStreamMetaDataAllowList is used. If httpHeadersStreamMetaDataAllowList contains keys, httpHeadersStreamMetaDataDenyList is ignored. | - | String |
| `httpHeadersUserDefinedHeader1` | Additional HTTP Header 1, format is 'HeaderName: HeaderValue' | - | String |
| `httpHeadersUserDefinedHeader2` | Additional HTTP Header 2, format is 'HeaderName: HeaderValue' | - | String |
| `httpHeadersUserDefinedHeader3` | Additional HTTP Header 3, format is 'HeaderName: HeaderValue' | - | String |
| `keyStorePassword` | The key store password | - | String |
| `keyStorePath` | The key store file path on the server | - | String |
| `keyStoreType` | The key store type. Valid values are ['JCEKS', 'JKS', 'DKS', 'PKCS11', 'PKCS12']. | `JKS` | String |
| `logMetaKeys` | Specifies Which meta data keys will have their values logged in the send log. A Comma delimited string of keys. | `guid,receiptid,feed,system,environment,remotehost,remoteaddress` | String |
| `readTimeout` | How long to wait for data to be available before closing the connection. The timeout is specified as either milliseconds, e.g. '60000' or with a duration suffix, e.g. '500ms', '2s', '1m', etc. | - | String |
| `requestMethod` | The HTTP request method. Valid values are GET, POST, HEAD, OPTIONS, PUT, DELETE and TRACE. | `POST` | String |
| `rollSize` | When the current output exceeds this size it will be closed and a new one created. Size is either specified in bytes e.g. '1024' or with a IEC unit suffix, e.g. '1K', '1M', '1G', etc. | - | String |
| `splitAggregatedStreams` | Choose if you want to split aggregated streams into separate output. | `false` | Boolean |
| `splitRecords` | Choose if you want to split individual records into separate output. | `false` | Boolean |
| `sslProtocol` | The SSL protocol to use | `TLSv1.2` | String |
| `timeout` | Determines the timeout until arrival of a response from the opposite endpoint. A timeout value of zero is interpreted as an infinite timeout. Default: 3 minutes. The timeout is specified as either milliseconds, e.g. '60000' or with a duration suffix, e.g. '500ms', '2s', '1m', etc. | - | String |
| `timeToLive` | The maximum time a pooled connection can stay idle (not leased to any thread) before it is shut down. Default: 1 hour. The timeout is specified as either milliseconds, e.g. '60000' or with a duration suffix, e.g. '500ms', '2s', '1m', etc. | - | String |
| `trustStorePassword` | The trust store password | - | String |
| `trustStorePath` | The trust store file path on the server | - | String |
| `trustStoreType` | The trust store type Valid values are ['JCEKS', 'JKS', 'DKS', 'PKCS11', 'PKCS12']. | `JKS` | String |
| `useCompression` | Should data be compressed when sending | `true` | Boolean |
| `useContentEncodingHeader` | Whether to use the 'Content-Encoding' HTTP header when useCompression is 'true'. If 'false' (the default), the 'Compression' header will be used, which is supported by .Stroom/Stroom-Proxy destinations. 'Content-Encoding' would be required for other destinations, but is only applicable for compression types 'gz', 'zstd' or 'deflate'. | `false` | Boolean |
| `useJvmSslConfig` | Use JVM SSL config. Set this to true if the Stroom node has been configured with key/trust stores using java system properties like 'javax.net.ssl.keyStore'.Set this to false if you are explicitly setting key/trust store properties on this HttpAppender. | `true` | Boolean |


### RollingFileAppender

{{< pipe-elm "RollingFileAppender" >}}

A destination used to write an output stream to a file on the file system.
If multiple paths are specified in the 'outputPaths' property it will pick one at random to write to.
This is distinct from the FileAppender in that when the `rollSize` is reached it will move the current file to the path specified in `rolledFileName` and resume writing to the original path.
This allows other processes to follow the changes to a single file path, e.g. when using `tail`.
On system shutdown all active files will be rolled.

| Property | Description | Default | Type |
|---|---|---|---|
| `compressionMethod` | Compression method to apply, if compression is enabled. Supported values: bzip2, deflate, gz, lz4-block, lz4-framed, lzma, pack200, snappy-framed, xz, zip, zstd. | `gz` | String |
| `fileName` | Choose the name of the file to write. | - | String |
| `filePermissions` | Set file system permissions of finished files (example: 'rwxr--r--') | - | String |
| `frequency` | Choose how frequently files are rolled. | `1h` | String |
| `outputPaths` | One or more destination paths for output files separated with commas. Replacement variables can be used in path strings such as ${feed}. | - | String |
| `rolledFileName` | Choose the name that files will be renamed to when they are rolled. | - | String |
| `rollSize` | When the current output file exceeds this size it will be closed and a new one created, e.g. 10M, 1G. | `100M` | String |
| `schedule` | Provide a cron expression to determine when files are rolled. | - | String |
| `useCompression` | Apply GZIP compression to output files | `false` | Boolean |


### RollingStreamAppender

{{< pipe-elm "RollingStreamAppender" >}}

A destination used to write one or more output streams to a new stream which is then rolled when it reaches a certain size or age.
A new stream will be created after the size or age criteria has been met.
On system shutdown all active streams will be rolled.

| Property | Description | Default | Type |
|---|---|---|---|
| `feed` | The feed that output stream should be written to. If not specified the feed the input stream belongs to will be used. | - | Document |
| `frequency` | Choose how frequently streams are rolled. | `1h` | String |
| `rollSize` | Choose the maximum size that a stream can be before it is rolled. | `100M` | String |
| `schedule` | Provide a cron expression to determine when streams are rolled. | - | String |
| `segmentOutput` | Should the output stream be marked with indexed segments to allow fast access to individual records? | `true` | Boolean |
| `streamType` | The stream type that the output stream should be written as. This must be specified. | - | String |
| `volumeGroup` | Optionally override the default volume group of the destination feed. | - | String |


### S3Appender

{{< pipe-elm "S3Appender" >}}

A destination used to write an output stream to an S3 bucket.

| Property | Description | Default | Type |
|---|---|---|---|
| `bucketNamePattern` | Set the bucket name pattern if you want to override the one provided by the S3 config. | - | String |
| `cacheControl` | A general header field used to specify caching policies. | - | String |
| `compressionMethod` | Compression method to apply, if compression is enabled. Supported values: bzip2, deflate, gz, lz4-block, lz4-framed, lzma, pack200, snappy-framed, xz, zip, zstd. | `gz` | String |
| `contentDisposition` | Object presentational information. | - | String |
| `contentEncoding` | The content encodings (like compression) that have been applied to the object's data. | - | String |
| `contentType` | The object type. | - | String |
| `keyNamePattern` | Set the key name pattern if you want to override the one provided by the S3 config. | `${type}/${year}/${month}/${day}/${idPath}/${feed}/${idPadded}.gz` | String |
| `rollSize` | When the current output object exceeds this size it will be closed and a new one created. | - | String |
| `s3Config` | The S3 bucket config to use. | - | Document |
| `splitAggregatedStreams` | Choose if you want to split aggregated streams into separate output objects. | `false` | Boolean |
| `splitRecords` | Choose if you want to split individual records into separate output objects. | `false` | Boolean |
| `useCompression` | Apply compression to output objects. | `true` | Boolean |


### StandardKafkaProducer

{{< pipe-elm "StandardKafkaProducer" >}}

Consumes XML documents in the `kafka-records:2` namespace.
For each `<kafkaRecord>` element converts it into a Kafka message that is passed to the Kafka producer defined by the `kafkaConfig` property

| Property | Description | Default | Type |
|---|---|---|---|
| `flushOnSend` | At the end of the stream, wait for acknowledgement from the Kafka broker for all the messages sent. This ensures errors are caught in the pipeline process. | `true` | Boolean |
| `kafkaConfig` | Kafka configuration details relating to where and how to send Kafka messages. | - | Document |


### StreamAppender

{{< pipe-elm "StreamAppender" >}}

A destination used to write the output stream to a new stream in the stream store.
The configuration allows for starting a new stream once a size threshold is reached.

| Property | Description | Default | Type |
|---|---|---|---|
| `feed` | The feed that output stream should be written to. If not specified the feed the input stream belongs to will be used. | - | Document |
| `rollSize` | When the current output stream exceeds this size it will be closed and a new one created. | - | String |
| `segmentOutput` | Should the output stream be marked with indexed segments to allow fast access to individual records? | `true` | Boolean |
| `splitAggregatedStreams` | Choose if you want to split aggregated streams into separate output streams. | `false` | Boolean |
| `splitRecords` | Choose if you want to split individual records into separate output streams. | `false` | Boolean |
| `streamType` | The stream type that the output stream should be written as. This must be specified. | - | String |
| `volumeGroup` | Optionally override the default volume group of the destination feed. | - | String |


## Internal

### Source

{{< pipe-elm "Source" >}}

The source is the input to the pipeline.
