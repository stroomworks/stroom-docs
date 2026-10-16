---
title: "Pipeline Reference Data Example"
linkTitle: "Pipeline Reference Data Example"
weight: 100
date: 2026-10-14
tags:
description: >
  An example of using reference data
pageKind: concept
---

The event data provides a list of things that have happened.
Each event has a `thing-idref`, which links to information about the thing itself; for example its appearance.
The event also has a `location-idref`, which links to something that provides a location for where that thing has happened.

We want the [reference data]({{< relref "pipeline-reference-data.md" >}}) system to perform the lookup and add fields to the records with the thing's name, icon and location.

Here's a section of the event data:

```xml
<records xmlns="records:2">
  <record>
    <data name="type" value="badge-scan" />
    <data name="timestamp" value="2026-04-11T13:04:43.000000Z" />
    <data name="thing-idref" value="joe.blogs@example.org" />
    <data name="location-idref" value="G-EAST-04" />
    <data name="status" value="WARN" />
    <data name="message" value="Expired credentials" />
  </record>
  <record>
    <data name="type" value="gate-event" />
    <data name="timestamp" value="2026-04-21T19:39:29.000000Z" />
    <data name="thing-idref" value="jane.doe@stroomworks.io" />
    <data name="location-idref" value="G-SOUTH-22" />
    <data name="status" value="OK" />
    <data name="message" value="Jane Doe has safely exited building" />
  </record>
  <record>
    <data name="type" value="gate-event" />
    <data name="timestamp" value="2026-04-14T19:46:13.000000Z" />
    <data name="thing-idref" value="joe.blogs@example.org" />
    <data name="location-idref" value="G-NORTH-01" />
    <data name="status" value="OK" />
    <data name="message" value="Joe Blogs has safely exited building" />
  </record>
</records>
```


## Reference data

The reference data looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<referenceData xmlns="reference-data:2">

  <!-- Person facts -->
  <reference>
    <map>UserMap</map>
    <key>joe.blogs@example.org</key>
    <value>
      <fact>
        <name>Joe Blogs</name>
        <icon>/assets/1234-567-890/joe.png</icon>
      </fact>
    </value>
  </reference>
  <reference>
    <map>UserMap</map>
    <key>jane.doe@stroomworks.io</key>
    <value>
      <fact>
        <name>Jane Doe</name>
        <icon>/assets/1234-567-890/jane.png</icon>
      </fact>
    </value>
  </reference>
    <reference>
        <map>GateMap</map>
        <key>G-NORTH-01</key>
        <value>
            <fact>
                <name>North Entrance</name>
                <location>map3, 57.2, 17.1</location>
            </fact>
        </value>
    </reference>
    <reference>
        <map>GateMap</map>
        <key>G-SOUTH-22</key>
        <value>
            <fact>
                <name>South Entrance</name>
                <location>map3, 57.2, 17.1</location>
            </fact>
        </value>
    </reference>
    <reference>
        <map>GateMap</map>
        <key>G-EAST-04</key>
        <value>
            <fact>
                <name>East Entrance</name>
                <location>map3, 57.2, 17.1</location>
            </fact>
        </value>
    </reference>
</referenceData>
```


## Building up structures in Stroom

## Folder

Create a folder within Stroom so you can keep everything together.
My folder is called `Floor Mapping`.


## Feeds

Since Stroom doesn't provide a visual indication of how everything is linked together, it is important to use consistent naming conventions so you can find what you need.

First, we're going to create two [Feeds]({{< relref "feed.md" >}}):
* REFDATA_REF to hold the reference data XML;
* REFDATA_EVENTS to hold the events XML.

For each feed, use the Up Arrow in the feed to upload the file containing the XML into Stroom.

  * Make sure that you set the effective time in the upload dialogue for the reference data to be a long time ago.
    Setting the year to 2000 is fine.
    If the effective date is too recent then the reference data will be ignored.
  * Set the Type for the uploaded data:
    * REFDATA_REF should have a Type of `Raw Reference`
    * REFDATA_EVENTS should have a Type of `Raw Events`


## Reference pipeline

Next step is to get the reference data working.

Create a [pipeline]({{< relref "pipelines.md" >}}) named `Refdata ref pipeline`.
Click on the `Structure` tab within the pipeline page.

In the next steps, if something doesn't appear then click the Save button and it should appear.

1. Right click on the Source pipeline element, Add/Reader/Reader.
   Use the default name `Reader`.
1. Right click on the Reader pipeline element, Add/Parser/XML Parser.
   Use the default name `XML Parser`.
1. Right click on the XML Parser pipeline element, Add/Filter/XSLT Filter.
   Use the default name `XSLT Filter`.
1. Right click on the XSLT Filter pipeline element, Add/Filter/Reference Data Filter.
   Use the default name `Reference Data Filter`.

Save the document using the icon in the top-left of the page.


### Reference pipeline XSLT

To make the pipeline do something useful we're going to need an XSLT script.
XSLT is a flexible powerful transformation language for XML.
However, that power and flexibility comes at the cost of complexity.

Create an `XSL Translation` document and name it `Refdata ref xslt`.
The XSLT tab within this document should contain this text:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet
    version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="reference-data:2"
    xpath-default-namespace="reference-data:2">

    <!-- Match the root -->
    <xsl:template match="/referenceData">
        <referenceData xmlns="reference-data:2">
            <xsl:apply-templates select="node()"/>
        </referenceData>
    </xsl:template>

    <xsl:template match="reference">
        <xsl:variable name="key"           select="key/text()"/>
        <xsl:variable name="nameValue"     select="value/fact/name"/>
        <xsl:variable name="locationValue" select="value/fact/location"/>
        <xsl:variable name="iconValue"     select="value/fact/icon"/>
        <xsl:variable name="value"         select="value/fact"/>

        <xsl:if test="$value">
            <reference>
                <map>FMID_TO_XMLVALUE_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:copy-of select="$value"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$nameValue">
            <reference>
                <map>FMID_TO_NAME_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$nameValue"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$locationValue">
            <reference>
                <map>FMID_TO_LOCATION_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$locationValue"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$iconValue">
            <reference>
                <map>FMID_TO_ICON_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$iconValue"/></value>
            </reference>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
```

There is quite a lot going on here, so let's break it down.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet
    version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="reference-data:2"
    xpath-default-namespace="reference-data:2">
    ...
</xsl:stylesheet>
```

This sets up crucial information for the XSLT script.
Notably:

* This is an XML document using version 1.0 of XML, encoded in UTF-8.
  You won't want to change this.
* The version of the script is `2.0`, which sets which version of the XSLT processor will be used to run the script.
  You are unlikely to want to change this.
* `xmlns:xsl` defines the namespace for the script itself.
  This means that anything that starts `xsl:` will be part of the scripting languge.
* `xmlns="reference-data:2"` means that anything that doesn't start with a prefix will be in the `reference-data:2` namespace, which is the namespace that our reference data must be in.
* `xpath-default-namespace="reference-data:2"` means that any XPath expressions (generally the bit in quotes later on in the script) will be assumed to be in the `reference-data:2` namespace, which makes our script much simpler.

On to the script contents:

```xml
    <xsl:template match="/referenceData">
        <referenceData xmlns="reference-data:2">
            <xsl:apply-templates select="node()"/>
        </referenceData>
    </xsl:template>
```

XSLT can be structured in lots of different ways, but here we're using an `<xsl:template>` structure.

This chunk will match the element `<referenceData>` in the root of the incoming document.
When it finds that element it will create a matching `<referenceData>` in the outgoing document, and then look for another template to match the bit inside that root document.

Next chunk:

```xml
    <xsl:template match="reference">
        <xsl:variable name="key"           select="key/text()"/>
        <xsl:variable name="nameValue"     select="value/fact/name"/>
        <xsl:variable name="locationValue" select="value/fact/location"/>
        <xsl:variable name="iconValue"     select="value/fact/icon"/>
        <xsl:variable name="value"         select="value/fact"/>

        <xsl:if test="$value">
            <reference>
                <map>FMID_TO_XMLVALUE_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:copy-of select="$value"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$nameValue">
            <reference>
                <map>FMID_TO_NAME_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$nameValue"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$locationValue">
            <reference>
                <map>FMID_TO_LOCATION_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$locationValue"/></value>
            </reference>
        </xsl:if>
        <xsl:if test="$iconValue">
            <reference>
                <map>FMID_TO_ICON_MAP</map>
                <key><xsl:value-of select="$key"/></key>
                <value><xsl:value-of select="$iconValue"/></value>
            </reference>
        </xsl:if>
    </xsl:template>
```

This is the template that matches `<reference>` elements in the incoming stream.

Purely as an example, this script shows a couple of ways of doing the same thing.
You can choose the method that works for your needs.

The script looks for certain elements and puts them into variables.
Once in variables, the script constructs `<reference/>` elements with `<map/>`, `<key/>` and `<value/>` sub-elements.

We've got three sections to construct simple values - `FMID_TO_NAME_MAP`, `FMID_TO_LOCATION_MAP`, `FMID_TO_ICON_MAP` store a single string value.

The other - `FMID_TO_XMLVALUE_MAP` - stores XML that looks like this:

```xml
<fact>
    <name>Joe Blogs</name>
    <icon>/assets/1234-567-890/joe.png</icon>
</fact>
```
We can then pull out relevant values later, in the events pipeline.

Once this XSLT is complete, we can save it and link it to the reference data pipeline.

* Save the XSLT using the Save icon at the top-left of the page;
* Open the `Refdata ref pipeline`, `Structure` tab:
  1. Select the `XSLT Filter`.
     In the middle of the page the properties are listed.
  1. Double-click the `xslt` property to open the `Edit Property` dialogue box.
  1. Click on the `Value` and set this to the `Refdata ref xslt`.


### Testing the reference pipeline

Open the `REFDATA_REF` feed.
Look for the Stepping button in the lower-right-hand-side of the Data tab.
Click the Stepping button.

You'll get a dialogue titled `Choose Pipeline To Step With`.
Find your `Refdata ref pipeline` and click `OK`.

You'll see the stepping view of the pipeline (see [Pipeline debugging]({{< relref "pipeline-debugging.md" >}})).
You can see the state of the data at each stage of the pipeline by clicking on the pipeline elements across the top of the page.

Click on the `XSLT Filter` element.
There are three panes:

  1. The XSLT script.
     You can edit this and see the effect of any changes.
     This is the best way to debug the script.
  1. The incoming data to the script.
  1. The outgoing data from the script.

At the top right of the page you have stepping controls.
Step through some of the data and check that the output is correct.
Make sure that the right `<key/><value/>` pair ends up in the right `<map/>`.

To get out of Stepping Mode click the highlighted stepping button at the top-left of the page.

It is possible to edit the XSLT script within the `Refdata ref xslt` document tab.
However, you'd find that the pipeline document doesn't pick up the changes, so you'd have to close the pipeline document and reopen it to pull the changes from the XSLT document.
It is much easier to edit everything within the pipeline itself.


#### What might go wrong

Assuming that your XSLT is valid XML, you are most likely to get namespace errors.

Namespaces are a way to tell the system that an element belongs to a particular set of elements.
In our case, the sets are:

  * The elements that define XSLT itself - the `xsl` namespace.
  * The stroom lookup function - the `stroom` namespace.
  * The reference-data:2 namespace - in our document this is the default namespace with no prefix.

Deciding which namespace prefix should be used can be tricky.
The easiest way to diagnose issues is with your favourite AI - put the incoming data, outgoing data and XSLT stylesheet in, and tell it what should be coming out and see what it suggests.


## Events pipeline

Next step is to get the events pipeline in.

Create a pipeline named `Refdata events pipeline`.
Click on the `Structure` tab within the pipeline page.

In the next steps, if something doesn't appear then click the Save button and it should appear.

1. Right click on the Source pipeline element, Add/Reader/Reader.
   Use the default name `Reader`.
1. Right click on the Reader pipeline element, Add/Parser/XML Parser.
   Use the default name `XML Parser`.
1. Right click on the XML Parser pipeline element, Add/Filter/XSLT Filter.
   Use the default name `XSLT Filter`.
1. Right click on the XSLT Filter pipeline element, Add/Filter/Schema Filter.
   Use the default name `Schema Filter`.

During development and testing we're not going to write the output of the events pipeline anywhere.
This means we don't need to reset anything or delete any data if we make changes.
Later on we'd need to add an `XML Writer` and `Stream Appender` to the end of the pipeline.

Save the document using the icon in the top-left of the page.


### Events pipeline XSLT

Create an `XSL Translation` document and name it `Refdata events xslt`.
The XSLT tab within this document should contain this text:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:stroom="stroom"
    xmlns="records:2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ref="reference-data:2"
    version="2.0"
    xpath-default-namespace="records:2"
    exclude-result-prefixes="stroom">

    <!-- Match the root element in the records:2 namespace -->
    <xsl:template match="/">
        <records
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="records:2 file://records-v2.0.xsd">
          <xsl:apply-templates/>
        </records>
    </xsl:template>

    <!-- Match the record element -->
    <xsl:template match="record">
        <xsl:variable name="type"           select="data[@name='type']/@value"/>
        <xsl:variable name="timestamp"      select="data[@name='timestamp']/@value"/>
        <xsl:variable name="thing-idref"    select="data[@name='thing-idref']/@value"/>
        <xsl:variable name="location-idref" select="data[@name='location-idref']/@value"/>
        <xsl:variable name="status"         select="data[@name='status']/@value"/>
        <xsl:variable name="message"        select="data[@name='message']/@value"/>

        <!-- Enrichment lookups -->
        <xsl:variable name="name"     select="stroom:lookup('FMID_TO_NAME_MAP', $thing-idref, $timestamp)"/>
        <xsl:variable name="icon"     select="stroom:lookup('FMID_TO_ICON_MAP', $thing-idref, $timestamp)"/>
        <xsl:variable name="location" select="stroom:lookup('FMID_TO_LOCATION_MAP', $location-idref, $timestamp)"/>
        <xsl:variable name="nameXml"    select="stroom:lookup('FMID_TO_XMLVALUE_MAP', $thing-idref, $timestamp)"/>

        <record>
            <data name="type" value="{$type}"/>
            <data name="timestamp" value="{$timestamp}" />
            <data name="thing-idref" value="{$thing-idref}" />
            <data name="location-idref" value="{$location-idref}" />
            <data name="status" value="{$status}" />
            <data name="message" value="{$message}" />
            <data name="name" value="{$name}"/>
            <data name="icon" value="{$icon}"/>
            <data name="location" value="{$location}"/>
            <data name="nameXml" value="{$nameXml/ref:fact/ref:name}"/>
        </record>
    </xsl:template>

</xsl:stylesheet>
```

Breaking this down, the root template section matches the root `<records>` and creates a matching `<records>` element in the output document.
Note that this element contains schema information for the [Schema Filter]({{< relref "pipeline-schema-filter.md" >}}) later in the pipeline.

The second template matches the `<record>` element.
It pulls all the data we're interested in from the input document into variables using XPath expressions.
It also uses the [`stroom:lookup()`]({{< relref "../reference/xslt-functions/reference-data.md" >}}) function to pull data from the reference data pipeline.

The `stroom:lookup()` function has a varient that takes a timestamp and returns the valid event for that timestamp.
We want data that is valid for the timestamp of the event, so we're passing in the timestamp of the event.

Note that there are two ways to get the data out:

  * Using the single value maps; for example `stroom:lookup('FMID_TO_NAME_MAP', $thing-idref, $timestamp)`.
    The single value can be output using the variable notation in XSLT: `$variableName`.
    This is the easiest route and probably the most efficient, as you will be storing less data.
  * Storing the whole XML data and pulling out parameters from it.
    Loading the XML into the variable from the map looks the same: `stroom:lookup('FMID_TO_XMLVALUE_MAP', $thing-idref, $timestamp)`.
    When pulling the data out, we can add an XPATH selector to get the value we want: `<data name="nameXml" value="{$nameXml/ref:fact/ref:name}"/>`.
    Note that the namespace for this selector is the reference-data:2 namespace from the stored data.
    If this isn't correct then the selector won't return anything.

Once this XSLT is complete, we can save it and link both it and the reference data to the events pipeline.

* Save the XSLT using the Save icon at the top-left of the page;
* Open the `Refdata events pipeline`, `Structure` tab:
  1. Select the `XSLT Filter`.
     In the middle of the page the properties are listed.
  1. Double-click the `xslt` property to open the `Edit Property` dialogue box.
  1. Click on the `Value` and set this to the `Refdata events xslt`.
  1. In the `Pipeline References` table below the properties, add a pipeline reference.
     Set the `Pipeline` to `Refdata ref pipeline`, the `Feed` to `REFDATA_REF` and the `Type` to `Raw Reference`.
  1. Save the pipeline.

`stroom:lookup()` only searches the pipeline references on its own XSLT Filter, so without this reference every lookup returns nothing.
