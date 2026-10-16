---
title: "Pipeline Elements"
linkTitle: "Pipeline Elements"
weight: 40
date: 2026-10-14
tags:
description: >
  Detailed information about the categories and individual elements used in Stroom pipelines.
pageKind: concept
---

A Stroom [pipeline]({{< relref "pipelines.md" >}}) is built by connecting various **Elements**.
Each element belongs to a specific category and has a defined role in the data processing flow.


## Element categories

Pipeline elements are grouped into several logical categories based on their function.
Every element and all of its properties are listed in the [pipeline elements reference]({{< relref "../reference/pipeline-elements.md" >}}).


### Source

The entry point of a pipeline.
It defines where the data comes from.

* {{< pipe-elm "Source" >}}: The standard element that provides the input stream from the Stroom data store.
  See [Pipeline data sources]({{< relref "pipelines-source.md" >}}).


### Parsers

Parsers convert raw input data (bytes) into XML events (SAX events).

* {{< pipe-elm "DSParser" >}}: The Data Splitter parser.
  It uses a {{< stroom-icon "document/TextConverter.svg" "Text Converter" >}} Text Converter (defined in a separate document, see [Data Splitter]({{< relref "../guides/translating/data-splitter/_index.md" >}})) to parse structured text like CSV, TSV, or fixed-width logs into XML.
* {{< pipe-elm "XMLParser" >}}: Used when the input data is already XML.
  It checks that the input is well formed and parses it into SAX events.
* {{< pipe-elm "JSONParser" >}}: Converts input JSON into XML events conforming to the standard XSLT-JSON XML schema.
* {{< pipe-elm "XMLFragmentParser" >}}: Wraps non-well-formed XML fragments with a root element to make them processable.


### Filters

Filters act upon the stream of XML events.
They can modify, split, or supplement the data.

* {{< pipe-elm "XSLTFilter" >}}: The workhorse of Stroom [transformations]({{< relref "translation.md" >}}).
  It applies an XSLT stylesheet to the XML event stream.
  It is used for renaming fields, restructuring data, and performing lookups.
* {{< pipe-elm "SchemaFilter" >}}: Performs inline XML schema (XSD) validation of the XML event stream.
  It ensures that the XML produced by a parser or XSLT conforms to a defined schema.
* {{< pipe-elm "ReferenceDataFilter" >}}: A specialised filter used to load [reference data]({{< relref "pipeline-reference-data.md" >}}) into an internal map for high-speed lookups in other pipelines.
* {{< pipe-elm "RecordCountFilter" >}}: Simply counts the number of records passing through and can provide statistics.
* {{< pipe-elm "SplitFilter" >}}: Splits multi-record source data into smaller groups of records before they are delivered to an XSLT, so the XSLT does not have to load a potentially huge input stream into memory.
* {{< pipe-elm "IdEnrichmentFilter" >}}: Adds unique IDs to records.
* {{< pipe-elm "RecordOutputFilter" >}}: Drops records that raised an error during processing, so only clean records are output.


### Writers

Writers take the stream of XML events and convert them back into a serialised format.

* {{< pipe-elm "XMLWriter" >}}: Serialises XML events back into a well-formed XML string.
* {{< pipe-elm "JSONWriter" >}}: Converts XML events (conforming to the XSLT-JSON schema) into a JSON string.
* {{< pipe-elm "TextWriter" >}}: Converts XML events into plain text, often used after an XSLT that has flattened the data.


### Destinations (appenders)

Destinations define where the serialised output should be saved.
See [Pipeline data destinations]({{< relref "pipelines-destination.md" >}}).

* {{< pipe-elm "StreamAppender" >}}: Writes the output back into the Stroom data store as a new stream.
  You can specify the Feed and Stream Type for the output.
* {{< pipe-elm "FileAppender" >}}: Writes the output to a file on the local file system.
* {{< pipe-elm "HDFSFileAppender" >}}: Writes the output to a Hadoop Distributed File System (HDFS).
* {{< pipe-elm "HTTPAppender" >}}: Posts the output to a remote HTTP(S) endpoint.
* {{< pipe-elm "RollingStreamAppender" >}}: Similar to StreamAppender but "rolls" the stream based on size or time thresholds.
* {{< pipe-elm "IndexingFilter" >}}: Technically a filter, but often acts as a destination by sending data directly into a [Lucene]({{< relref "lucene-index.md" >}}) index (use {{< pipe-elm "ElasticIndexingFilter" >}} for Elasticsearch).


## Schema validation

Using the {{< pipe-elm "SchemaFilter" >}} (see [Schema filter]({{< relref "pipeline-schema-filter.md" >}})) allows Stroom to ensure the structural integrity of the XML data as it flows through the pipeline.
Schemas are typically provided by the `core-xml-schemas` and `event-logging-xml-schemas` content packs.


### Advantages

* **Data quality**: Guarantees that the data conforms to the expected structure before it is indexed or stored.
* **Early error detection**: Identifies issues in XSLT or parser logic immediately as they occur in the pipeline.
* **Documentation**: Schemas act as a formal definition of the data format.
* **Standardisation**: Encourages the use of standard formats like the Event Logging schema.


### Disadvantages

* **Performance overhead**: XML schema validation is a computationally expensive process and can significantly reduce pipeline throughput.
* **Schema maintenance**: Requires schemas to be kept up to date as data formats evolve.
* **Rigidity**: If an unexpected but valid variation in data occurs, the pipeline may fail or drop records if the schema is too restrictive.

{{% note %}}
It is common practice to enable schema validation during pipeline development and testing, but disable it in high-volume production environments once the processing logic is proven, to maximise performance.
{{% /note %}}


### Configuration

To validate your data against a schema, follow these steps:

1. **Prepare your XML data.**
   Your XML must include a namespace and a schemaLocation attribute on its root element(s).

    ```xml
    <Events xmlns="event-logging:3"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="event-logging:3 file://event-logging-v3.4.2.xsd">
        ...
    </Events>
    ```

1. Create an XML Schema Document in Stroom
1. Upload your XSD file to Stroom as a new XML Schema document.
1. Configure the following properties on the document:
    * Namespace URI: Must match the xmlns in your XML (e.g., event-logging:3).
    * System Id: Must match the location part of xsi:schemaLocation (e.g., file://event-logging-v3.4.2.xsd).
    * Schema Group: (Recommended) Give it a name like EVENTS or REFERENCE_DATA.
      This allows you to group different versions of the same schema.

1. **Configure the pipeline.**
   Add the SchemaFilter element to your pipeline (usually after a Parser or XSLTFilter) and configure its properties:
    * schemaGroup: Set this to match the Schema Group you defined on your XML Schema document.
      This is the most robust way to ensure the correct schema is selected.
    * schemaValidation: Set to true (default) to enable validation.
    * namespaceURI / systemId: (Optional) Can be used to further restrict which schemas are considered valid for this filter.


## Common element properties

Most elements have properties that control their behaviour.
Common ones include:

| Property | Description |
| :--- | :--- |
| **Feed** | (Appenders) The feed to which the output stream should be assigned. |
| **Stream Type** | (Appenders) The type of data (e.g., Raw Events, Events, Context). |
| **XSLT** | (XSLTFilter) The DocRef of the XSLT stylesheet to apply. |
| **Text Converter** | (DSParser) The DocRef of the Text Converter configuration to use. |
| **Encoding** | (Writers) The character encoding (e.g., UTF-8) to use for the output. |


## Role and visibility

When viewing elements in the Pipeline UI, you may see different roles:

* **Target**: The element receives data from a previous element.
* **Mutator**: The element modifies the data as it passes through.
* **Destination**: The element is an end-point for the data.

Elements also have different **Visibility**:

* **Simple**: Visible in the standard pipeline editor.
* **Stepping**: Visible and interactive during the debugging/stepping process (see [Pipeline debugging]({{< relref "pipeline-debugging.md" >}})).
