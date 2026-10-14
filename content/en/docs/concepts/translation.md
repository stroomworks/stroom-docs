---
title: "Parsers and Translation"
linkTitle: "Parsers and Translation"
weight: 45
date: 2026-10-14
tags:
description: >
  How a pipeline turns raw text, XML or JSON into XML, then translates it into a common event schema with XSLT.
pageKind: concept
---

Data arrives in Stroom in whatever format the source system writes: CSV, syslog lines, JSON, XML.
Before it can be searched, indexed or alerted on, a [pipeline]({{< relref "pipelines.md" >}}) turns it into XML, then translates that XML into one common schema.
Two steps do the work:

1. A **parser** reads the raw stream and turns it into XML.
1. One or more {{< pipe-elm "XSLTFilter" >}} elements translate that XML, usually into `event-logging:3` XML, the schema Stroom uses for normalised audit events.

Once every feed is in the same schema, the indexing, searching and alerting further down the pipeline only have to understand one format.


## Choosing a parser

The parser comes straight after the {{< pipe-elm "Source" >}}.
Pick the one that matches the shape of the data:

| Parser | Use it for |
|---|---|
| {{< pipe-elm "DSParser" >}} | Structured text, such as CSV, fixed-width or log lines. It uses a Data Splitter Text Converter. |
| {{< pipe-elm "JSONParser" >}} | JSON. |
| {{< pipe-elm "XMLParser" >}} | Data that is already a well-formed XML document. |
| {{< pipe-elm "XMLFragmentParser" >}} | A series of XML elements with no XML declaration or root element. It uses an XML Fragment Text Converter. |
| {{< pipe-elm "CombinedParser" >}} | The original general-purpose parser, which takes a `type` property. It is kept for older pipelines. For new ones, use the specific parser. |

The {{< pipe-elm "JSONParser" >}} produces an XML representation of the JSON, in the `http://www.w3.org/2013/XSL/json` namespace, with `map`, `array`, `string` and similar elements.
Its properties let it accept relaxed JSON, such as comments, single quotes or trailing commas.
String values longer than `stringTruncateLength` (10,000 characters by default) are truncated, with a warning.


## Text converters

The {{< pipe-elm "DSParser" >}} and {{< pipe-elm "XMLFragmentParser" >}} each take a {{< stroom-icon "document/TextConverter.svg" "Text Converter" >}} **Text Converter** document, set with the parser's `textConverter` property.
A Text Converter has a **Settings** tab, where **Converter Type** is `Data Splitter` or `XML Fragment`, and a **Conversion** tab that holds the configuration itself.

Instead of naming a document, a parser can find one by name with its `namePattern` property.
The pattern can use `${feed}` and `${pipeline}`, so one pipeline can serve many feeds, each with its own Text Converter.


### Data splitter

Data Splitter is a small XML language for splitting text into records and fields.
It reads its input through a tree of expressions (the full language is in [Data Splitter]({{< relref "../guides/translating/data-splitter/_index.md" >}})):

* `<split>` divides content at a delimiter, such as a new line or a comma.
  It handles quoted values and escape characters.
* `<regex>` matches content with a regular expression and exposes its groups.
* `<group>` takes what its parent matched and passes it on to further expressions.
* `<var>` stores a value for later use, such as a header row.
* `<data>` writes a value out, with an optional name.

Expressions are tried in order, and the first that matches is used.
The output is `records:2` XML: one `<record>` per record, holding `<data name="..." value="..."/>` elements.

This converter reads a CSV file whose first line holds the field names:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataSplitter
    xmlns="data-splitter:3"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="data-splitter:3 file://data-splitter-v3.0.xsd"
    version="3.0">

  <!-- The first line holds the field names -->
  <split delimiter="\n" maxMatch="1">
    <group>
      <split delimiter=",">
        <var id="heading" />
      </split>
    </group>
  </split>

  <!-- Every other line is a record -->
  <split delimiter="\n">
    <group>
      <split delimiter=",">
        <data name="$heading$1" value="$1" />
      </split>
    </group>
  </split>
</dataSplitter>
```

Given this input:

```text
time,user,action
01/10/2026 09:00:00,jbloggs,logon
```

it produces (namespace declarations trimmed):

```xml
<records xmlns="records:2" version="3.0">
  <record>
    <data name="time" value="01/10/2026 09:00:00" />
    <data name="user" value="jbloggs" />
    <data name="action" value="logon" />
  </record>
</records>
```


### XML fragments

Some sources write a stream of XML elements with no declaration and no root element, which isn't a valid XML document.
An XML Fragment Text Converter supplies the wrapper.
The `&fragment;` entity marks where the input goes:

```xml
<?xml version="1.1" encoding="UTF-8"?>
<!DOCTYPE records [
<!ENTITY fragment SYSTEM "fragment">
]>
<records
    xmlns="records:2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="records:2 file://records-v2.0.xsd"
    version="2.0">
  &fragment;
</records>
```

The fragments must still be well-formed XML.


## Translating with XSLT

The parser's XML still follows the source's own structure.
An {{< pipe-elm "XSLTFilter" >}} applies an {{< stroom-icon "document/XSLT.svg" "XSL Translation" >}} **XSL Translation** document, which you write on the document's **XSLT** tab, to translate it into the target schema.
Raw event feeds are usually translated into `event-logging:3`, and raw reference feeds into `reference-data:2`.

This cut-down translation turns the records above into events.
A real one also fills in `EventSource` and `EventDetail`, which the schema requires.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns="event-logging:3"
    xpath-default-namespace="records:2"
    xmlns:stroom="stroom"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="2.0">

  <xsl:template match="records">
    <Events>
      <xsl:apply-templates select="record" />
    </Events>
  </xsl:template>

  <xsl:template match="record">
    <Event>
      <EventTime>
        <TimeCreated>
          <xsl:value-of select="stroom:format-date(data[@name='time']/@value, 'dd/MM/yyyy HH:mm:ss')" />
        </TimeCreated>
      </EventTime>
      <!-- EventSource and EventDetail go here -->
    </Event>
  </xsl:template>
</xsl:stylesheet>
```

`xpath-default-namespace` lets the templates match `record` and `data` without a prefix.
The call to `stroom:format-date` turns `01/10/2026 09:00:00` into `2026-10-01T09:00:00.000Z`.

A pipeline can have several XSLT filters in a row.
A common pattern is one to normalise the source's records into `event-logging:3`, then a second to decorate the events, for example with user details from reference data.
The decorating XSLT can then be shared by every feed.

Like the parsers, the {{< pipe-elm "XSLTFilter" >}} can find its XSLT by name with `xsltNamePattern`, using `${feed}` and `${pipeline}`.


### XSLT includes

Code shared between translations goes in its own XSL Translation document, which other translations bring in with `xsl:import` or `xsl:include`.
The `href` is the name of the document:

```xml
<xsl:import href="ApacheAccessCommon" />
```

The name must belong to exactly one XSL Translation.
If two documents share it, the import fails.


## Stroom's XSLT functions

Stroom adds its own [functions to XSLT]({{< relref "../reference/xslt-functions/_index.md" >}}).
Declare the namespace `xmlns:stroom="stroom"` and call them with the `stroom:` prefix.
They fall into these groups:

| Group | What they do | Examples |
|---|---|---|
| Date and time | Parse and format dates, convert to and from Unix time. | `format-date`, `parse-dateTime`, `current-time` |
| Reference data | Look values up in reference data and dictionaries. | `lookup`, `bitmap-lookup`, `dictionary` |
| Stream and source | Read details of the stream being processed and its metadata. | `feed-name`, `meta`, `stream-id`, `record-no` |
| Networking and URI | Work with IP addresses, CIDR ranges, host names and URIs. | `ip-in-cidr`, `host-name`, `parse-uri` |
| String and encoding | Hash, URL-encode and convert hex. | `hash`, `encode-url`, `hex-to-dec` |
| HTTP and JSON | Call a web service or convert JSON to XML. | `http-call`, `fetch-json`, `json-to-xml` |
| Output and logging | Log a message at a chosen severity, add metadata to the output, build links for dashboard tables. | `log`, `add-meta`, `link` |
| Values and context | Hold values while processing a stream, and read the user and pipeline. | `put`, `get`, `pipeline-name` |
| Maths and vectors | Geometry and vector comparison. | `pointIsInsideXYPolygon`, `cosine-similarity` |

Lookups need the reference data loaded first.
[Reference data]({{< relref "pipeline-reference-data.md" >}}) explains how.


## Context data

A stream can carry a `Context` sub-stream alongside its events: data from the sending system that applies to the whole stream, such as the name of the machine.
The translation reads it with `stroom:lookup`, as if it were reference data, but it is held only while that one stream is processed.
See [Reference data]({{< relref "pipeline-reference-data.md" >}}) for how to set it up.


## Checking the result

Add a {{< pipe-elm "SchemaFilter" >}} after the last XSLT to check its output against the schema, so that a translation that produces invalid events fails visibly instead of quietly.
See [Schema Filter]({{< relref "pipeline-schema-filter.md" >}}).

To develop a parser or translation, step through real data, as in [Your first translation]({{< relref "../get-started/your-first-translation.md" >}}).
The **Stepper** {{< stroom-icon "step.svg" >}} shows the input and output of every element, record by record, and you can edit the Text Converter or XSLT and see the effect at once.
See [Pipeline debugging]({{< relref "pipeline-debugging.md" >}}).
Once the translation is right, reprocess any data the old version got wrong, as described in [Processor filters and tasks]({{< relref "processing/_index.md" >}}).


## Related pages

* [Pipelines]({{< relref "pipelines.md" >}})
* [Pipeline Elements]({{< relref "intro-pipeline-elements.md" >}})
* [Schema Filter]({{< relref "pipeline-schema-filter.md" >}})
* [Pipeline debugging]({{< relref "pipeline-debugging.md" >}})
* [Reference data]({{< relref "pipeline-reference-data.md" >}})
* [Processor filters and tasks]({{< relref "processing/_index.md" >}})
