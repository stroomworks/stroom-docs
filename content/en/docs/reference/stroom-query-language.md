---
title: "Stroom Query Language"
linkTitle: "Stroom Query Language"
weight: 50
date: 2026-10-14
tags:
description: >
  Stroom Query Language (StroomQL) is a query language for retrieving data in Stroom.
pageKind: reference
aliases:
  - /docs/user-guide/search/queries/stroom-query-language/
---

## Query format

Stroom Query Language (StroomQL) is a text based replacement for the existing [Dashboard]({{< relref "glossary.md#dashboard" >}}) query builder and allows you to express the same queries in text form as well as providing additional functionality.
It is currently used on the [_Query_]({{< relref "../concepts/query-language.md" >}}) entity as the means of defining a query.

The following shows the supported syntax for a StroomQL query.

```text
from <DATA_SOURCE>
where <FIELD> <CONDITION> <VALUE> [and|or|not]
[and|or|not]
[eval...] <FIELD> = <EXPRESSION>
[window] <TIME_FIELD> by <WINDOW_SIZE> [advance <ADVANCE_WINDOW_SIZE>]
[filter] <FIELD> <CONDITION> <VALUE> [and|or|not]
[and|or|not]
[group by] <FIELD>
[sort by] <FIELD> [desc|asc] // asc by default
[having] <FIELD> <CONDITION> <VALUE> [and|or|not]
[limit] <MAX_ROWS> 
select <FIELD> [as <COLUMN NAME>], ...
[show] <VIS_NAME> (<VIS_CONTROL_ID_1> = <COLUMN_1>, <VIS_CONTROL_ID_2> = <COLUMN_2>)
```

The clauses must appear in this order, or the query is rejected with an error such as `Unexpected token LIMIT after SELECT`.
The only exceptions are that `eval` and `window` can be mixed in any order, as can `group by` and `sort by`.


## Fields

Fields are the fields in a data source.
Fields are case-sensitive.

If the field name contains white space then it **must** be surround by braces and preceded by a dollar sign, e.g `${Create Time}`.

If the field name does not contain spaces it can be written with or without the braces, e.g. `Status` or `${Status}`.

Fields can added to the query text in one of three ways:

* Directly typing the field name (with braces as required).
* Double clicking the field name in the Field picker in the left hand pane.
  Field names with spaces will be pasted in with braces.
* Using code completion.
  In the query editor hit `ctrl+space` to bring up a list of context aware completion terms, e.g. field names, then hit tab to insert it.
  You could also type a few characters from the name before hitting `ctrl+space` to pre-filter the list.
  Field names with spaces will be pasted in with braces.


## Keywords

Keywords are the reserved words that define the structure of the query, e.g. `from`, `select`, `where`.
Unlike fields, they are case-insensitive.


### From

The first part of a StroomQL expression is the `from` clause that defines the single data source to query.
All queries must include the `from` clause.

Select the data source to query, e.g.

```text
from my_source
```

If the name of the data source contains white space then it must be quoted using `"` double quotes, e.g.

```text
from "my source"
```


### Where

Use `where` to construct query criteria, e.g.

```text
where feed = "my feed"
```

Add boolean logic with `and`, `or` and `not` to build complex criteria, e.g.

```text
where feed = "my feed"
or feed = "other feed"
```

Use brackets to group logical sub expressions, e.g.

```text
where user = "bob"
and (feed = "my feed" or feed = "other feed")
```


#### Conditions

Supported conditions are:

* `=` - Equals.
* `!=` - Not equals.
* `>` - Greater than.
* `>=` - Greater than or equal to.
* `<` - Less than.
* `<=` - Less than or equal to.
* `is null` - The value is `null`.
* `is not null` - The value is not `null`.
* `between` - The value is between two values.  
  e.g. `EventTime between 2024-01-01T00:00:00.000Z and 2024-02-01T00:00:00.000Z`.
* `in` - The value is in a list of allowed values.  
  e.g. `StreamId in (1001, 1002, 2009)`  
  or `Feed in ("FEED_X", "FEED_Y")`.
* `in dictionary` - The value is in a list of allowed values that are contained in a {{< stroom-icon "document/Dictionary.svg" "Dictionary" >}} Dictionary.  
  See [Dictionaries]({{< relref "../concepts/dictionary.md" >}}).  
  e.g. `Feed in dictionary "My Dict"` (using the dictionary's unique name)  
  or  `Feed in dictionary "fb7a8cea-e6b4-4d94-8f7e-47ff3b3c7711"` (using the dictionary's [UUID]({{< relref "glossary.md#uuid" >}})).  


#### And|Or|Not

Logical operators to add to where and filter clauses.


#### Bracket groups

You can force evaluation of items in a specific order using bracketed groups.

```text
and X = 5 OR (name = foo and surname = bar)
```


### Window

```text
window <TIME_FIELD> by <WINDOW_SIZE> [advance <ADVANCE_WINDOW_SIZE>]
```

Windowing groups data by a specified window size applied to a time field.
A window inserts additional rows for future periods so that rows for future periods contain count columns for previous periods.

Specify the field to window by and a duration.
Durations are specified in simple terms e.g. `1d`, `2w` etc.

By default, a window will insert a count into the next period row.
This is because by default we advance by the specified window size.
If you wish to advance by a different duration you can specify the advance amount which will insert counts into multiple future rows.


### Filter

Use `filter` to filter values that have not been indexed during search retrieval.
This is used the same way as the `where` clause but applies to data after being retrieved from the index, e.g.

```text
filter obscure_field = "some value"
```

Add boolean logic with `and`, `or` and `not` to build complex criteria as supported by the `where` clause.
Use brackets to group logical sub expressions as supported by the `where` clause.

{{% note %}}
As filters do not make use of the index they can be considerably slower than a `where` clause, however they allow filtering on fields that have not been indexed for some reason.
Frequent use of `filter` on a field suggests you may want to consider including that field in an index.
{{% /note %}}


### Eval

Use `eval` to assign the value returned from an [Expression Function]({{< relref "expression-functions.md" >}}) to a named variable, e.g.

```text
eval my_count = count()
```

Here the result of the `count()` function is being stored in a variable called `my_count`.
Functions can be nested and applied to variables, e.g.

```text
eval new_name = concat(
  substring(name, 3, 5),
  substring(name, 8, 9))
```

Note that all fields in the data source selected using `from` will be available as variables by default.

Multiple `eval` statements can also be used to breakup complex function expressions and make it easier to comment out individual evaluations, e.g.

```text
eval name_prefix = substring(name, 3, 5)
eval name_suffix = substring(name, 8, 9)
eval new_name = concat(
  name_prefix,
  name_suffix)
```

Variables can be reused, e.g.

```text
eval name_prefix = substring(name, 3, 5)
eval new_name = substring(name, 8, 9)
eval new_name = concat(
  name_prefix,
  new_name)
```

In this example, the second assignment of `new_name` will override the value initially assigned to it.
Note that when reusing a variable name, the assignment can depend on the previous value assigned to that variable.

Add boolean logic with `and`, `or` and `not` to build complex criteria, e.g.

```text
where feed = "my feed" or feed = "other feed"
```

Use brackets to group logical sub expressions, e.g.

```text
where user = "bob" and (feed = "my feed" or feed = "other feed")
```


### Having

A post aggregate filter that is applied at query time to return only rows that match the `having` conditions.

```text
having count > 3
```


### Group by

Use to group by columns, e.g.

```text
group by feed
```

You can group across multiple columns, e.g.

```text
group by feed, name
```

You can create nested groups, e.g.

```text
group by feed
group by name
```


### Sort by

Use to sort by columns, e.g.

```text
sort by feed
```

You can sort across multiple columns, e.g.

```text
sort by feed, name
```

You can change the sort direction, e.g.

```text
sort by feed asc
```

Or

```text
sort by feed desc
```


### Limit

Limit the number of results, e.g.

```text
limit 10
```


### Select

The `select` keyword is used to define the fields that will be selected out of the data source (and any `eval`'d fields) for display in the table output.

```text
select feed, name
```

You can optionally rename the fields so that they appear in the table with more human friendly names.

```text
select feed as 'my feed column',
  name as 'my name column'
```


### Show

The `show` keyword is used to tell StroomQL how to show the data resulting from the `select`.
A Stroom [visualisation]({{< relref "../concepts/visualisations.md" >}}) can be specified and then passed column values from the `select` for the visualisation control properties.

```text
show LineChart(x = EventTime, y = count)
show Doughnut(names = Feed, values = count)
```

For visualisations that contain spaces in their names it is necessary to use quotes, e.g.

```text
show "My Visualisation" (x = EventTime, y = count)
```


## Comments

### Single line

StroomQL supports single line comments using `//`.
For example:

```text
from "index_view" // view
where EventTime > now() - 1227d
// and StreamId = 1210
select StreamId as "Stream Id", EventTime as "Event Time"
```


### Multi line

Multiple lines can be commented by surrounding sections with `/*` and `*/`.
For example:

```text
from "index_view" // view
where EventTime > now() - 1227d
/*
eval FirstName = lowerCase(substringBefore(UserId, '.'))
eval FirstName = any(FirstName)
*/
select StreamId as "Stream Id", EventTime as "Event Time"
```


## Examples

The following are various example queries.

```text
// add a where
from "index_view" // view
where EventTime > now() - 1227d
// and StreamId = 1210
eval UserId = any(upperCase(UserId))
eval FirstName = lowerCase(substringBefore(UserId, '.'))
eval FirstName = any(FirstName)
eval Sl = stringLength(FirstName)
eval count = count()
group by StreamId
sort by Sl desc
limit 10
select Sl, StreamId as "Stream Id", EventId as "Event Id", EventTime as "Event Time", UserId as "User Id", FirstName, count
```

```text
from "index_view" // view
// add a where
where EventTime > now() - 1227d
// and StreamId = 1210
eval UserId = any(upperCase(UserId))
eval FirstName = lowerCase(substringBefore(UserId, '.'))
eval FirstName = any(FirstName)
eval Sl = stringLength(FirstName)
eval count = count()
group by StreamId
sort by Sl desc
limit 10
select Sl, StreamId as "Stream Id", EventId as "Event Id", EventTime as "Event Time", UserId as "User Id", FirstName, count
```

```text
from "index_view" // view
// add a where
where EventTime > now() - 1227d
// and StreamId = 1210
eval UserId = any(upperCase(UserId))
eval FirstName = lowerCase(substringBefore(UserId, '.'))
eval FirstName = any(FirstName)
eval Sl = stringLength(FirstName)
// eval count = count()
// group by StreamId
// sort by Sl desc
// limit 10
select StreamId as "Stream Id", EventId as "Event Id"
```

```text
from "index_view" // view
// add a where
where EventTime > now() - 1227d
// and StreamId = 1210
eval UserId = any(upperCase(UserId))
eval FirstName = lowerCase(substringBefore(UserId, '.'))
eval FirstName = any(FirstName)
eval Sl = stringLength(FirstName)
eval count = count()
group by StreamId
sort by Sl desc
limit 10
select Sl, StreamId as "Stream Id", EventId as "Event Id", EventTime as "Event Time", UserId as "User Id", FirstName, count
```


## Help pane

The left hand pane of the Query editor provides help for building a StroomQL query.
It contains the following items:

* _Data Sources_ - The list of data sources (visible to the user) that can be queried.
* _Structure_ - The list of keywords available to use, e.g. `select`.
* _Annotation Fields_ - The list of special fields for accessing data from [Annotations]({{< relref "../guides/detection/annotations.md" >}}) linked to the data being queried.
  The fields list will only be available once a complete `from ...` clause has been added that uses a data source that supports Annotations, e.g. an Index.
* _Fields_ - The list of fields that can be used in the Query.
  The fields list will only be available once a complete `from ...` clause has been added.
* _Functions_ - The list of [Expression Functions]({{< relref "expression-functions.md" >}}) that can be used.
* _Visualisations_ - The list of {{< stroom-icon "document/Visualisation.svg" "Visualisation" >}} Visualisation documents that can be included in the {{< stroom-icon "document/Query.svg" "Query" >}} Query.
* _Dictionaries_ - The list of {{< stroom-icon "document/Dictionary.svg" "Dictionary" >}} Dictionary documents that can be used in [`in dictionary`]({{< relref "#conditions" >}}) terms.

Clicking on an item will show some detailed help about that item in the bottom of the pane.

Double clicking on the item will insert it into the query editor.
It will be inserted with double quotes or braces as appropriate to the item being inserted.


## Code completion

The StroomQL editor benefits from code completion to speed up the writing of queries.

Pressing `ctrl+space` in the query editor will bring up a context aware context menu listing items that can be inserted into the query, e.g. fields, functions, keywords, dictionaries, data sources, etc.

If you type some letters of the item you want, e.g. `sub` then `ctrl+space`, it will bring up a list of items that contain the letters `sub` in that order, e.g. `substring(..)`, `isDouble(..)`, etc.

You can either use the cursor keys to scroll up/down the list or continue typing letters to further refine the filtering of the list.
Hit `enter` or `tab` to insert the item into the editor.

The context menu also includes [completion snippets]({{< relref "snippet-reference.md#stroom-query-language-snippets" >}}).

The context menu also shows some more detailed help, e.g. to describe the argument to functions.


### Functions

[Expression Functions]({{< relref "expression-functions.md" >}}) are inserted with _tab stops_ to enable fast population of the function arguments.
For example:

1. Type `sub` then hit `ctrl+space`.
1. Select `substring(..)` from the list and hit `tab`.  
   `substring(input, startIndex, endIndex)` is inserted, with `input` highlighted.
1. Type `Feed` to replace `input` with `Feed`, then hit `tab`.  
   `substring(Feed, startIndex, endIndex)` is displayed, with `startIndex` highlighted.
1. Type `0` to replace `startIndex` with `0`, then hit `tab`.  
   `substring(Feed, 0, endIndex)` is displayed, with `endIndex` highlighted.
1. Type `5` to replace `endIndex` with `5`, then hit `tab`.  
   `substring(Feed, 0, 5)` is displayed, with the cursor now positioned after the closing bracket.
