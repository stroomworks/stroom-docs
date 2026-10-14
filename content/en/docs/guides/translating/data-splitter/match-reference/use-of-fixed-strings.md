---
title: "Use of Fixed Strings"
linkTitle: "Use of Fixed Strings"
weight: 30
date: 2026-10-14
tags:
description: >
  Any `<group>` value or `<data>` name and value can use references to matched content, but in addition to this it is possible just to output a known string, e.g.
pageKind: reference
aliases:
  - /docs/user-guide/data-splitter/match-reference/use-of-fixed-strings/
---

Any `<group>` value or `<data>` name and value can use [references to matched content]({{< relref "expression-match-references.md" >}}), but in addition to this it is possible just to output a known string, e.g.

```xml
<data name="somename" value="$" />
```

The above example would output `somename` as the `<data>` name attribute.
This can often be useful where there are no headings specified in the input data but we want to associate certain names with certain values.

Given the following data:

```csv
01/01/2010,00:00:00,192.168.1.100,SOMEHOST.SOMEWHERE.COM,user1,logon,
```

We could provide useful headings with the following configuration:

```xml
<regex pattern="([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),">
  <data name="date" value="$1" />
  <data name="time" value="$2" />
  <data name="ipAddress" value="$3" />
  <data name="hostName" value="$4" />
  <data name="user" value="$5" />
  <data name="action" value="$6" />
</regex>
```
