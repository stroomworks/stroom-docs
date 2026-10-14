---
title: "Schema Filter"
linkTitle: "Schema Filter"
weight: 70
date: 2026-10-14
tags:
description: >
  Validating XML against a schema as it flows through a pipeline.
pageKind: concept
---

The `SchemaFilter` [pipeline element]({{< relref "intro-pipeline-elements.md" >}}) is used to perform inline XML schema validation of XML data as it flows through a [pipeline]({{< relref "pipelines.md" >}}).
This ensures that the data conforms to the expected structure and data types defined in one or more XML Schemas.


## Important: incoming XML

You must ensure that the XML coming into the Schema Filter has the correct namespace.
This generally means ensuring that the default XML Namespace is defined.

You will also need schema information on the XML going into the Schema Filter.
For example, you could add this to the root XML element:

```xml
    <xsl:template match="/">
        <records
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="records:2 file://records-v2.0.xsd">
          <xsl:apply-templates/>
        </records>
    </xsl:template>
```

The schemaLocation is vital so that the Schema Filter can identify which schema to apply.


## Parameters

| Parameter | Description | Default Value |
| --- | --- | --- |
| `schemaGroup` | Limits the schemas that can be used to validate data to those with a matching schema group name. | (None) |
| `systemId` | Limits the schemas that can be used to validate data to those with a matching system id. | (None) |
| `namespaceURI` | Limits the schemas that can be used to validate data to those with a matching namespace URI. | (None) |
| `schemaLanguage` | The schema language that the schema is written in. Usually `http://www.w3.org/2001/XMLSchema`. | `http://www.w3.org/2001/XMLSchema` |
| `schemaValidation` | A boolean flag to enable or disable schema validation. | `true` |


## How to choose parameters

### 1. `schemaGroup` (recommended)

The `schemaGroup` is the most common way to filter which schemas Stroom should consider for validation.

* **When to use:** Use this when you have multiple schemas in Stroom and you want to ensure the pipeline only validates against a specific set (e.g., all versions of the "EVENTS" schema).
* **How to set:** Set this to the value matching the **Schema Group** field defined in your XML Schema document(s).
  For example, if your schemas for event data are grouped under "EVENTS", set this parameter to `EVENTS`.
* **How to find:** Install the XML Schemas content packs (see [Content management]({{< relref "../guides/content-management.md" >}})).
  Open up your schema and look at the Settings tab.
  The Schema Group is defined there.


### 2. `systemId`

The `systemId` is a unique identifier for a specific schema document in Stroom.
It typically corresponds to the file name or a URI used in the `xsi:schemaLocation` attribute of your XML.

* **When to use:** Use this if you want to force validation against one specific schema version or if you have specific system IDs defined in your XML's `schemaLocation` that you want to match explicitly.
* **How to set:** Set this to match the **System Id** field in the XML Schema document.
* **How to find:** Install the XML Schemas content packs.
  Open up your schema and look at the Settings tab.
  The System ID is defined there.


### 3. `namespaceURI`

The `namespaceURI` is the target namespace of the XML schema.

* **When to use:** Use this if you want to limit validation to a specific XML namespace.
* **How to set:** Set this to the namespace URI defined in your XML and schema (e.g., `records:2`).
* **How to find:** Install the XML Schemas content packs.
  Open up your schema and look at the Settings tab.
  The Namespace URI is defined there.


### 4. `schemaLanguage`

* **When to use:** Almost always left as the default (`http://www.w3.org/2001/XMLSchema`).
  Only change this if you are using a different schema language that Stroom supports (though W3C XML Schema is the standard).


### 5. `schemaValidation`

* **When to use:** Set to `true` (default) to perform validation.
  Set to `false` if you want to temporarily disable validation without removing the element from the pipeline, perhaps for troubleshooting performance issues.


## Configuration strategy

For most pipelines, you should:
1. Add the `SchemaFilter` after your `XSLTFilter` or `Parser` (see [Parsers and translation]({{< relref "translation.md" >}})).
1. Set the `schemaGroup` to match the logical group of schemas you are using (e.g., `RECORDS`).
1. Ensure your XML data includes the correct `xmlns` and `xsi:schemaLocation` attributes in the root element to help the `SchemaFilter` locate the correct schema within the specified group.
