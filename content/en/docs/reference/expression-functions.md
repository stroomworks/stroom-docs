---
title: "Expression Functions"
linkTitle: "Expression Functions"
weight: 60
date: 2026-10-14
tags:
description: >
  Every function available in dashboard expressions and StroomQL, by category.
pageKind: reference
aliases:
  - /docs/reference-section/expressions/
  - /docs/reference-section/expressions/aggregate/
  - /docs/reference-section/expressions/cast/
  - /docs/reference-section/expressions/date/
  - /docs/reference-section/expressions/link/
  - /docs/reference-section/expressions/logic/
  - /docs/reference-section/expressions/mathematics/
  - /docs/reference-section/expressions/selection/
  - /docs/reference-section/expressions/string/
  - /docs/reference-section/expressions/type-checking/
  - /docs/reference-section/expressions/uri/
  - /docs/reference-section/expressions/value/
---

These are the functions you can use in a dashboard's expression columns and in StroomQL `eval` expressions.

Where a function has an alias, both names do the same thing.

There are **148** functions in **14** categories.


## Aggregate

| Function | Does | Returns |
|---|---|---|
| `average`, `mean` | Determines the average (mean) value across all grouped records. | The average (mean) of all the values |
| `count` | *Not described in the source.* | - |
| `countGroups` | *Not described in the source.* | Number of unique child group keys within the current group. |
| `countUnique` | Determines the number of unique values across all grouped records. | The number of unique values |
| `distinct` | Concatenates the distinct supplied values together with no delimiter. | - |
| `joining` | Concatenates the supplied values together with no delimiter. | - |
| `max` | Determines the maximum value across all grouped records. | The largest value of all values. |
| `min` | Determines the minimum value across all grouped records. | The smallest of all values. |
| `period` | The window period to apply functions to. | - |
| `stDev` | Determines the standard deviation across all grouped records. | The standard deviation of all values. |
| `sum` | Determines the sum of the value of expression across all grouped records | Sum of all values |
| `variance` | Determines the variance value across all grouped records. | The variance of all the values. |


## AI

| Function | Does | Returns |
|---|---|---|
| `askAi` | The name or UUID of the OpenAI Model document to use. | The model's answer. |


## Cast

| Function | Does | Returns |
|---|---|---|
| `toBoolean` | Converts the supplied value to a boolean (if it can be). For example if the value is | The value as the boolean type. |
| `toDouble` | Converts the supplied value to a double (if it can be). For example, converting | The value as the double type. |
| `toFloat` | Converts the supplied value to a float (if it can be). For example, converting | The value as the float type. |
| `toInteger` | Converts the supplied value to an integer (if it can be). For example, converting | The value as the integer type. |
| `toLong` | Converts the supplied value to an long (if it can be). For example, converting | The value as the long type. |
| `toString` | Converts the supplied value to a string, | The value as the string type. |


## Date

| Function | Does | Returns |
|---|---|---|
| `ceilingDay` | Rounds the supplied time up to the start of the next day. | The result date and time. |
| `ceilingHour` | Rounds the supplied time up to the start of the next hour. | The result date and time. |
| `ceilingMinute` | Rounds the supplied time up to the start of the next minute. | The result date and time. |
| `ceilingMonth` | Rounds the supplied time up to the start of the next month. | The result date and time. |
| `ceilingSecond` | Rounds the supplied time up to the start of the next second. | The result date and time. |
| `ceilingTime` | Rounds the supplied time up to the nearest duration. | The result date and time. |
| `ceilingWeek` | Rounds the supplied time up to the end of the current week. | The result date and time. |
| `ceilingYear` | Rounds the supplied time up to the start of the next year. | The result date and time. |
| `day` | Returns the current date and time truncated to the start of the day. | The current date and time truncated to the start of the day. |
| `floorDay` | Rounds the supplied time down to the start of the current day. | The result date and time. |
| `floorHour` | Rounds the supplied time down to the start of the current hour. | The result date and time. |
| `floorMinute` | Rounds the supplied time down to the start of the current minute. | The result date and time. |
| `floorMonth` | Rounds the supplied time down to the start of the current month. | The result date and time. |
| `floorSecond` | Rounds the supplied time down to the start of the current second. | The result date and time. |
| `floorTime` | Floors the supplied time to the nearest duration. | The result date and time. |
| `floorWeek` | Rounds the supplied time down to the start of the current week. | The result date and time. |
| `floorYear` | Rounds the supplied time down to the start of the current year. | The result date and time. |
| `formatDate` | The date as milliseconds since the epoch (1 Jan 1970) | - |
| `formatDuration` | Formats the supplied duration as a string | A duration formatted as a string. |
| `formatISODuration` | Formats the supplied duration as an ISO 8601 string | A duration formatted as an ISO 8601 string. |
| `hour` | Returns the current date and time to the nearest hour. | The current date and time to the nearest hour. |
| `isWeekend` | Returns whether a date is part of the weekend or not. | Is the date a weekend day or not. |
| `minute` | Returns the current date and time to the nearest minute. | The current date and time to the nearest minute. |
| `month` | Returns the current date and time truncated to the start of the month. | The current date and time truncated to the start of the month. |
| `now` | Returns the current date and time. | The current date and time. |
| `parseDate` | The date string, e.g. '2014 02 22' | The date as number of milliseconds since the epoch. |
| `parseDuration` | Parses the supplied value as a duration | The parsed duration. |
| `parseISODuration` | Parses the supplied value as an ISO duration, e.g. PTH3 | The parsed ISO duration. |
| `roundDay` | Rounds the supplied time up or down to the nearest start of a day. | The result date and time. |
| `roundHour` | Rounds the supplied time up or down to the nearest start of a hour. | The result date and time. |
| `roundMinute` | Rounds the supplied time up or down to the nearest start of a minute. | The result date and time. |
| `roundMonth` | Rounds the supplied time up or down to the nearest start of a month. | The result date and time. |
| `roundSecond` | Rounds the supplied time up or down to the nearest start of a second. | The result date and time. |
| `roundTime` | Rounds the supplied time to the nearest duration. | The result date and time. |
| `roundWeek` | Rounds the supplied time up or down to the nearest start of a week. | The result date and time. |
| `roundYear` | Rounds the supplied time up or down to the nearest start of a year. | The result date and time. |
| `second` | Returns the current date and time to the nearest second. | The current date and time to the nearest second. |
| `week` | Returns the current date and time truncated to the start of the week. | The current date and time truncated to the start of the week. |
| `year` | Returns the current date and time truncated to the start of the year. | The current date and time truncated to the start of the year. |


## Link

| Function | Does | Returns |
|---|---|---|
| `annotation` | Creates a hyperlink that will open the annotation edit screen showing | - |
| `createAnnotation` | Creates a hyperlink that will open the annotation edit screen pre-populated | - |
| `dashboard` | The text that the hyperlink will display. | A hyperlink that will open a dashboard. |
| `data` | Produces a hyperlink for showing data within stroom. | - |
| `link` | Creates a stroom syntax hyperlink string using the supplied URL. | A Stroom syntax hyperlink string. |
| `stepping` | Produces a hyperlink for opening a stepping tab for the requested stream. | A hyperlink that will open the a stepping tab for the requested source data. |


## Logic

| Function | Does | Returns |
|---|---|---|
| `!=` | Tests the non equality of two values. It will attempt to convert the parameters | True if the two values are not equal. |
| `<` | Tests if arg1 is less than than arg2. It will attempt to convert the type of the | True if arg1 is less than than arg2. |
| `<=` | Tests if arg1 is less than or equal to arg2. It will attempt to convert the | True if arg1 is less than or equal arg2. |
| `=` | Tests the equality of two values. It will attempt to convert the parameters | True if the two values are equal even if the types are not. |
| `>` | Tests if arg1 is greater than arg2. It will attempt to convert the type of the | True if arg1 is greater than arg2. |
| `>=` | Tests if arg1 is greater than or equal to arg2. It will attempt to convert the | True if arg1 is greater than or equal to arg2. |
| `and` | Logical 'and' operator. | If all supplied arguments evaluate to true then return true, else false. |
| `case` | Similar to a switch statement. The arguments are split into 3 parts: | One of the result arguments, if matched, or the value of the otherwise |
| `if` | Tests if the 1st parameter is true and if so returns parameter 2 else it returns | If condition is true, the value of the 2nd parameter else the value of the 3rd |
| `inRange` | Returns true if the value is between lower and upper (inclusive). | - |
| `not` | Inverts boolean values making true, false etc. The value provided will be implicitly | The inverse of the supplied value. |
| `or` | Logical 'or' operator. | If one or more of the supplied arguments evaluate to true then return true, |


## Lookup

| Function | Does | Returns |
|---|---|---|
| `getState` | Lookup a value from a state map using a key and optional effective time for | The state value if found else null. |


## Mathematics

| Function | Does | Returns |
|---|---|---|
| `-`, `subtract` | Field, the result of another function or a constant. | The result of subtracting each argument from the last argument or result of the |
| `*`, `multiply` | Field, the result of another function or a constant. | The value of arg1 multiplied by arg2. |
| `/`, `divide` | Field, the result of another function or a constant. | The value of arg1 divided by arg2. |
| `%` | Calculates the modulus after dividing the dividend by the divisor. If more than one | - |
| `^`, `power` | Field, the result of another function or a constant. | The value of arg1 raised to the power of arg2. |
| `add`, `+` | Field, the result of another function or a constant. | The sum of all values |
| `ceiling` | Rounds the supplied value up to the next whole number. e.g. ceiling(1.2) | The rounded value. |
| `floor` | Rounds the supplied value down to the next whole number. e.g. ceiling(1.8) | The rounded value. |
| `negate` | Multiplies the supplied value by -1 | The result of multiplying the supplied number by -1 |
| `random` | Returns a double value with a positive sign, greater than or equal to 0.0 and | A random number between 0.0 (inc.) and 1.0 (excl.) |
| `round` | Rounds the supplied value to the nearest whole number. e.g. ceiling(1.8) | The rounded value. |


## Param

| Function | Does | Returns |
|---|---|---|
| `currentUser` | Returns the display name (or subjectId if there isn't one) of the current | Display name (or subjectId if there isn't one) of the logged in user. |
| `currentUserDisplayName` | Returns the display name of the current logged in user. | The display name of the logged in user. |
| `currentUserFullName` | Returns the full name of the current logged in user. | The full name of the logged in user. |
| `currentUserSubjectId` | Returns the subject id of the current logged in user. | Subject id of the logged in user. |
| `currentUserUuid` | Returns the UUID of the current logged in user. | UUID of the logged in user. |


## Selection

| Function | Does | Returns |
|---|---|---|
| `any` | Selects the first value found in the group that is not | - |
| `bottom` | Selects the bottom N values and returns them as a delimited string in the order they | - |
| `first` | Selects the first value found in the group even if it is | - |
| `last` | Selects the last value found in the group even if it is | - |
| `nth` | Selects the Nth value in a set of grouped values. If there is no explicit ordering | - |
| `top` | Selects the top N values and returns them as a delimited string in the order they | - |


## String

| Function | Does | Returns |
|---|---|---|
| `concat` | Appends all the arguments end to end in a single string. | A string containing all the arguments concatenated together. |
| `contains` | Tests if inputString contains subString. | True if string contains substring |
| `decode` | Similar to a switch/case statement. The arguments are split into 3 parts: | One of the result arguments, if matched, or the value of the otherwise |
| `decodeUrl` | Decodes a URL or other string that is the product of standard URL encoding, e.g. | The input value with all URL encoding converted back to its plain text form. |
| `encodeUrl` | Encodes a URL or other string using standard URL encoding, e.g. replacing a space | The input value in URL encoded form. |
| `exclude` | If the supplied string matches one of the supplied regex patterns then return | Null if the input matches one of the patterns, otherwise the input value. |
| `hash` | Generate a | The hash string. |
| `hostAddress` | Returns the host address (IP) for the given host string. | - |
| `hostName` | Returns the host name for the given host string. | - |
| `include` | If the supplied input string matches one of the supplied regex patterns then return | The input value if one of the patterns matches it, otherwise null. |
| `indexOf` | Finds the first position (zero based) of subString in inputString or `-1` if it | The first position of subString. |
| `jq` | Extracts values from a JSON string using a JQ expression. Where the expression | The string value of the matched JSON element(s). |
| `lastIndexOf` | Finds the last position (zero based) of subString in inputString or `-1` if it | The last position of subString. |
| `lowerCase` | Convert the supplied string to lower case. | The string in lower case. |
| `match` | Tests an input string using a regular expression pattern. | True if pattern matches input |
| `param` | Fetches the value of named query parameter or | - |
| `params` | Returns all the query parameters for the current query, e.g. 'user=jbloggs site=HQ'. | - |
| `replace` | Perform text replacement on an input string using a regular expression to match part | - |
| `stringLength` | Return the length of the provided string. | The length of the string in characters. |
| `substring` | Extract a sub-string based on the start/end index values. | The requested sub-string. |
| `substringAfter` | Extract a sub-string from input after the first occurrence of delimiter. | The requested sub-string. |
| `substringBefore` | Extract a sub-string from input before the first occurrence of delimiter. | The requested sub-string. |
| `upperCase` | Convert the supplied string to upper case. | The string in upper case. |
| `xpath` | Extracts values from an XML string using an XPath 3.1 expression. The string values | The concatenated string values of all the items matched by the expression. |


## Type checking

| Function | Does | Returns |
|---|---|---|
| `isBoolean` | Checks if the passed value has a boolean data type. | True if value is a boolean. |
| `isDouble` | Checks if the passed value has a double data type. | True if value is a double. |
| `isError` | Checks if the passed value has a error data type. | True if value is an error. |
| `isInteger` | Checks if the passed value has an integer data type. | True if value is an integer. |
| `isLong` | Checks if the passed value has a long data type. | True if value is a long. |
| `isNull` | Checks if the passed value has a null data type. | True if value is null. |
| `isNumber` | Checks if the passed value has a numeric data type. | True if value is a number. |
| `isString` | Checks if the passed value has a string data type. | True if value is a string. |
| `isValue` | Checks if the passed value has a value data type, i.e. not null or error. | True if value is a value. |
| `typeOf` | Determine the data type of the passed value. | The name of the data type of the value, e.g. 'null', 'error', 'string', etc. |


## URI

| Function | Does | Returns |
|---|---|---|
| `extractAuthorityFromUri` | Extract the authority component from a URI. | The authority from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractFragmentFromUri` | Extract the fragment component from a URI. | The fragment from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractHostFromUri` | Extract the host component from a URI. | The host from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractPathFromUri` | Extract the path component from a URI. | The path from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractPortFromUri` | Extract the port component from a URI. | The port from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractQueryFromUri` | Extract the query component from a URI. | The query from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractSchemeFromUri` | Extract the scheme component from a URI. | The scheme from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractSchemeSpecificPartFromUri` | Extract the scheme specific part component from a URI. | The scheme specific part from the URI or null if not found or the URI is mall-formed. e.g. |
| `extractUserInfoFromUri` | Extract the user info component from a URI. | The user info from the URI or null if not found or the URI is mall-formed. e.g. |


## Value

| Function | Does | Returns |
|---|---|---|
| `err` | Returns an error. | An error. |
| `false` | Returns the boolean false. | The boolean false. |
| `formatIECByteSize` | The number of bytes | - |
| `formatMetricByteSize` | The number of bytes | - |
| `null` | Returns a null value. | A null value. |
| `true` | Returns the boolean true. | The boolean true. |
