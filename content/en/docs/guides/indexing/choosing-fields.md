---
title: "Choosing Fields"
linkTitle: "Choosing Fields"
weight: 20
date: 2026-10-14
tags:
description: >
  What to index, what to store, and why the decision is hard to revisit.
pageKind: guide
verification: required
---

A field definition says what a value is, whether it can be searched on, and whether its value comes back with a search result.
Those choices decide how fast searches are, how large the index is, and what questions can be asked at all.


## Indexed and stored are different

* **Indexed** means the value is searchable.
  A field that is not indexed cannot appear in a query term, whatever else is true of it.
* **Stored** means the value is kept in the index and returned with the result.
  A field that is indexed but not stored can be searched on, but its value has to be fetched from the original data by an extraction pipeline before anyone can see it.

The two are independent, and all four combinations are useful:

| Indexed | Stored | Use for |
|---|---|---|
| Yes | Yes | The handful of fields a results table shows: time, feed, user, host |
| Yes | No | Fields people filter by but do not need to read back directly |
| No | Yes | Values worth returning cheaply but never searched on |
| No | No | Nothing: remove the field instead |


## Type and analyser

Two separate settings on each field decide how its value can be *queried*, and both should be chosen for that rather than for what the value looks like.

**Type** is one of `Id`, `Boolean`, `Integer`, `Long`, `Float`, `Double`, `Date`, `Text` or `DenseVector`.

* The numeric types and **Date** support range queries.
  A date held as text can be matched but not asked for "between these two times".
* **Text** is for everything matched as words or strings, and how it is matched is up to its analyser.

**Analyser** applies to a **Text** field and decides how its value is broken into searchable terms:

* **Keyword** keeps the whole value as one term, so it matches whole, exact values.
  That is what you want for identifiers, hostnames and user names, where partial matches are noise.
* The others, such as **Standard**, **Whitespace** and **Alpha numeric**, split the value into words, so it is matched term by term.
  That is what you want for messages and free prose.

**Case Sensitive** decides whether matching respects case.

Getting this wrong is the most common reason a query returns nothing with no error: a Keyword-analysed field searched with a partial term matches nothing, and that is a correct result for the definition given.


## Why it is hard to change later

Shards are written with the field definitions in force at the time.
Changing a definition changes how *new* data is written; it does not rewrite what already exists.

Nor does it change new data straight away.
Indexing reads field definitions through the **Index Field Cache**, whose entries expire 10 hours after they are loaded, and saving the index does not clear it.
Until the cached definition expires, newly arriving data is still indexed with the old one.
To make a change take effect now, clear **Index Field Cache** under **Monitoring** → **Caches**.
See [Clear caches]({{< relref "../../operate/resetting/clear-caches.md" >}}).

So an index whose fields changed in March holds data written two ways, and a query that assumes the new definition is right about recent data and wrong about older data, without saying so.

The ways out are both deliberate: keep the old definition and live with it, or reindex the affected period, which means reprocessing it.
See [Reset an index]({{< relref "../../operate/resetting/reset-an-index.md" >}}).

{{< verify >}}
Search for one value through each kind of field you have defined: an exact term on a Keyword-analysed field, a word within a sentence on a field with a word-splitting analyser, and a range on a date or numeric field.

{{< golden >}}
**Each kind of field answers the kind of query it was defined for, on data you can see in the source.**

Checking one field type tells you the index works.
Checking one of each tells you the definitions are what you meant, which is the part that is expensive to get wrong.
{{< /golden >}}

{{< not-proof >}}
**A field appearing in the field list is not proof it holds values.**
A field defined but never populated by the translation looks identical to one that is.

**A query returning nothing is not proof the data is missing.**
On a Keyword-analysed field it is the expected result for a partial term.

**A saved definition is not proof new data uses it.**
Until the **Index Field Cache** entry expires or is cleared, new data is indexed with the definition that was cached.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="immutable" >}}
**Changing a field definition does not change shards already written.**

There is no error and no warning.
Queries simply behave differently either side of the change, and the boundary is invisible unless you know when it happened.
Note the date somewhere you will find it again, and treat a definition change as a reason to consider reprocessing rather than a free edit.

The boundary is also later than the save.
New data keeps being indexed with the old definition for up to 10 hours, until its **Index Field Cache** entry expires: a field set to **Index** No stays searchable in new data, and one set to **Store** No keeps being stored.
Clear **Index Field Cache** under **Monitoring** → **Caches** straight after saving, so the boundary is the moment you chose.
{{< /trap >}}

{{< diagnose >}}
1. **Is the field indexed?**
   The field list marks an unindexed field as not queryable.
   Do not expect a query on it to find anything.
1. **Is the term a partial match on a Keyword-analysed field?**
   The commonest cause of an empty result on data you can see.
1. **Is the field populated for the period you are searching?**
   Step the translation for a record from that period and confirm the field is produced.
1. **Did the definition change?**
   Compare results either side of the date you changed it.
   A clean break at one date is the signature.
   If new data still follows the old definition, the **Index Field Cache** has not been cleared or expired since the save.
1. **Is it stored, if you expected to see the value?**
   An indexed, unstored field with no extraction pipeline gives results with empty columns.
{{< /diagnose >}}
