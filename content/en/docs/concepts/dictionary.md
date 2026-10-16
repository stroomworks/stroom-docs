---
title: "Dictionary"
linkTitle: "Dictionary"
weight: 130
date: 2026-10-14
tags:
description: >
  Understanding Dictionaries in Stroom: managing word lists for filtering and data enrichment.
pageKind: concept
aliases:
  - /docs/user-guide/search/dictionaries/
---

A **Dictionary** in Stroom is essentially a list of 'words', where each 'word' is a single line of text.
Dictionaries are primarily used to define sets of values that can be reused across different parts of Stroom, such as filtering in search expressions or data enrichment in XSLT.


## How data goes in

Data can be added to a Dictionary in several ways:


### 1. Manual entry via UI

Users can directly type or paste a list of words into the **Words** tab of a Dictionary document.
Each word must be on a new line.


### 2. Import/export

Dictionaries are standard Stroom documents and can be imported or exported as part of a content pack (ZIP file).
See [Content management]({{< relref "../guides/content-management.md" >}}).


### 3. DictionaryAppender

The `DictionaryAppender` pipeline element can be used to write the output of a pipeline into a Dictionary.
Note that the `DictionaryAppender` **overwrites** all previous data in the target dictionary.


### 4. Inheritance (imports)

Dictionaries support inheritance.
One dictionary can **import** the contents of other dictionaries.
When a dictionary is used, Stroom combines its own data with the data from all its imported dictionaries (recursively).


## How data comes out

Dictionaries are used in several contexts:


### 1. Filtering with `IN DICTIONARY`

In [Stroom QL]({{< relref "query-language.md" >}}) or [Dashboard]({{< relref "dashboards.md" >}}) expressions, you can use the `in dictionary` condition to check if a field value exists within a specific dictionary.

```text
where IPAddress in dictionary "Internal Networks"
```


### 2. Receive data rules

Dictionaries can be used in [Receive Data Rules]({{< relref "data-receipt.md" >}}) to filter data as it is being received by Stroom (e.g., dropping data from certain source IPs).


### 3. XSLT functions

The [`stroom:dictionary`]({{< relref "../reference/xslt-functions/reference-data.md" >}}) XSLT function allows you to retrieve the combined content of a dictionary as a single newline-separated string.

```xml
<xsl:variable name="wordList" select="stroom:dictionary('Internal Networks')"/>
```


## When to use dictionaries

Dictionaries are best used when:
* You have a set of values (e.g., IP addresses, usernames, status codes) that change frequently and are used in multiple places.
* You want to simplify search expressions by grouping related values.
* You need to share common lists of values across multiple feeds or dashboards.
* You want to define a hierarchy of values (e.g., a "All Servers" dictionary that imports "Web Servers" and "DB Servers").


## Configuration options

A Dictionary document has the following main configuration areas:


### Words tab

This is where the actual list of words is stored.
Each line is treated as a separate entry.


### Imports tab

A list of other Dictionary documents that this dictionary should inherit data from.
The order of imports is typically not significant as the result is a combined set of unique lines.


### Effective Words tab

A read-only list of the combined words from this dictionary and all of its imports, recursively.
Use it to check what `IN DICTIONARY` will match.


## Considerations

* **Performance**: Very large dictionaries (hundreds of thousands of lines) can impact search performance when used with `in dictionary`.
  Consider using [Reference Data]({{< relref "pipeline-reference-data.md" >}}) for extremely large lookup sets.
* **Overwriting**: Using `DictionaryAppender` will completely replace the content of the dictionary.
  If you need to append data, you may need a more complex pipeline or manual management.
* **Recursion**: Stroom handles recursive imports, but it is best practice to keep the inheritance hierarchy simple to maintain readability.
* **Permissions**: To use a dictionary in a search or pipeline, the user running the process must have at least **Read** permission on the Dictionary document (see [Users, groups and permissions]({{< relref "../operate/users-and-permissions.md" >}})).


## Limitations

* **Flat structure**: A dictionary is a simple list of strings.
  It does not support key-value pairs or structured data.
  For those use cases, use **Reference Data**.
* **Case sensitivity**: The `in dictionary` condition's case sensitivity depends on the underlying index or field configuration, but generally, dictionaries are treated as case-sensitive lists.
* **No metadata**: You cannot associate metadata with individual words in a dictionary.
