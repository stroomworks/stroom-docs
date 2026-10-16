---
title: "Expression Functions"
linkTitle: "Expression Functions"
weight: 60
date: 2026-10-15
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

Where a function has aliases, every name does the same thing.

There are **148** functions in **14** categories.
A few, such as `average`, have both an aggregate form and one that works across its arguments, so they appear in two categories.


## Aggregate

| Function | Does | Returns |
|---|---|---|
| `average`, `mean` | Determines the average (mean) value across all grouped records. | The average (mean) of all the values |
| `count` | Counts the number of records that are passed through it. Doesn't take any notice of the values of any fields. | Number of records |
| `countGroups` | This is used to count the number of unique group keys where there are multiple group levels. For example if records are grouped by Name then Type then for each Name, countGroups will give you the number of unique Type values for that Name. | Number of unique child group keys within the current group. |
| `countUnique` | Determines the number of unique values across all grouped records. | The number of unique values |
| `distinct` | Concatenates the distinct supplied values together with no delimiter. | The distinct values concatenated together into one string with no delimiter. Up to a maximum of 10 values. |
| `joining` | Concatenates the supplied values together with no delimiter. | The values concatenated together into one string with no delimiter. Up to a maximum of 10 values. |
| `max` | Determines the maximum value across all grouped records. | The largest value of all values. |
| `min` | Determines the minimum value across all grouped records. | The smallest of all values. |
| `period` | This function provides a way of selectively applying functions to values for a specific period when using the window feature | A value computed by the nested functions for the specified period |
| `stDev` | Determines the standard deviation across all grouped records. | The standard deviation of all values. |
| `sum` | Determines the sum of the value of expression across all grouped records | Sum of all values |
| `variance` | Determines the variance value across all grouped records. | The variance of all the values. |


## AI

| Function | Does | Returns |
|---|---|---|
| `askAi` | Ask a chat model a question and return its answer. The model is asked once per value, so prefer to use this on a grouped or otherwise small set of rows. | The model's answer. |


## Cast

| Function | Does | Returns |
|---|---|---|
| `toBoolean` | Converts the supplied value to a boolean (if it can be). For example if the value is numeric then any non-zero value is considered true. For a text value, any value (ignoring case) equal to "true" is considered true. | The value as the boolean type. |
| `toDouble` | Converts the supplied value to a double (if it can be). For example, converting the text "1.2" to the number 1.2 | The value as the double type. |
| `toFloat` | Converts the supplied value to a float (if it can be). For example, converting the text "1.2" to the number 1.2 | The value as the float type. |
| `toInteger` | Converts the supplied value to an integer (if it can be). For example, converting the text "12" to the number 12 | The value as the integer type. |
| `toLong` | Converts the supplied value to an long (if it can be). For example, converting the text "12" to the number 12. If the value looks like the default date format then this function will parse the date string and return the number of milliseconds since the epoch (1 Jan 1970). | The value as the long type. |
| `toString` | Converts the supplied value to a string, e.g. 1.23 becomes "1.23" and true() becomes "true". | The value as the string type. |


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
| `formatDate` | Convert the date to a string using the default date format pattern (yyyy-MM-dd'T'HH:mm:ss.SSSXX) and default timezone (UTC). | A date string in the default date format pattern. |
| `formatDuration` | Formats the supplied duration as a string | A duration formatted as a string. |
| `formatISODuration` | Formats the supplied duration as an ISO 8601 string | A duration formatted as an ISO 8601 string. |
| `hour` | Returns the current date and time to the nearest hour. | The current date and time to the nearest hour. |
| `isWeekend` | Returns whether a date is part of the weekend or not. | Is the date a weekend day or not. |
| `minute` | Returns the current date and time to the nearest minute. | The current date and time to the nearest minute. |
| `month` | Returns the current date and time truncated to the start of the month. | The current date and time truncated to the start of the month. |
| `now` | Returns the current date and time. | The current date and time. |
| `parseDate` | Parse dateString using the default date format pattern (yyyy-MM-dd'T'HH:mm:ss.SSSXX) and default timezone (UTC). | The date as number of milliseconds since the epoch. |
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
| `annotation` | Creates a hyperlink that will open the annotation edit screen showing the existing annotation with the supplied annotationId. | A hyperlink to open the annotation edit screen for an existing annotation. |
| `createAnnotation` | Creates a hyperlink that will open the annotation edit screen pre-populated with the supplied values ready to create a new annotation. | Forms a hyperlink to create a new annotation. |
| `dashboard` | Produces a hyperlink for opening a specific dashboard. | A hyperlink that will open a dashboard. |
| `data` | Produces a hyperlink for showing data within stroom. | A hyperlink that will open a popup or tab showing the required data. |
| `link` | Creates a stroom syntax hyperlink string using the supplied URL. | A Stroom syntax hyperlink string. |
| `stepping` | Produces a hyperlink for opening a stepping tab for the requested stream. | A hyperlink that will open the a stepping tab for the requested source data. |


## Logic

| Function | Does | Returns |
|---|---|---|
| `!=`, `notEquals`, `ne` | Tests the non equality of two values. It will attempt to convert the parameters to the type of the first parameter, e.g. ne(123, "123") returns true. | True if the two values are not equal. |
| `<`, `lessThan`, `lt` | Tests if arg1 is less than than arg2. It will attempt to convert the type of the second parameter to that of the first. Can be expressed as '${field1}>${field2}. | True if arg1 is less than than arg2. |
| `<=`, `lessThanOrEqualTo`, `lte` | Tests if arg1 is less than or equal to arg2. It will attempt to convert the type of the second parameter to that of the first. Can be expressed as '${field1}>${field2}. | True if arg1 is less than or equal arg2. |
| `=`, `equals`, `eq` | Tests the equality of two values. It will attempt to convert the parameters to the type of the first parameter, e.g. equals(123, "123") returns true. | True if the two values are equal even if the types are not. |
| `>`, `greaterThan`, `gt` | Tests if arg1 is greater than arg2. It will attempt to convert the type of the second parameter to that of the first. Can be expressed as '${field1}>${field2}'. | True if arg1 is greater than arg2. |
| `>=`, `greaterThanOrEqualTo`, `gte` | Tests if arg1 is greater than or equal to arg2. It will attempt to convert the type of the second parameter to that of the first. Can be expressed as '${field1}>${field2}. | True if arg1 is greater than or equal to arg2. |
| `and` | Logical 'and' operator. | If all supplied arguments evaluate to true then return true, else false. |
| `case` | Similar to a switch statement. The arguments are split into 3 parts: the input value to compare, pairs of test values with their respective output values and a default result if no matches are found. It must always have an even number of arguments and can have any number of test/result pairs. | One of the result arguments, if matched, or the value of the otherwise argument if no match is found. |
| `if` | Tests if the 1st parameter is true and if so returns parameter 2 else it returns parameter 3. | If condition is true, the value of the 2nd parameter else the value of the 3rd parameter. The type will match that of the selected parameter. |
| `inRange` | Returns true if the value is between the lower and upper bounds, inclusive. All parameters must be either numbers or ISO date strings. | - |
| `not` | Inverts boolean values making true, false etc. The value provided will be implicitly cast to a boolean, e.g 'not("true")' returns false | The inverse of the supplied value. |
| `or` | Logical 'or' operator. | If one or more of the supplied arguments evaluate to true then return true, else false. |


## Lookup

| Function | Does | Returns |
|---|---|---|
| `getState` | Lookup a value from a state map using a key and optional effective time for temporally sensitive states. | The state value if found else null. |


## Mathematics

| Function | Does | Returns |
|---|---|---|
| `-`, `subtract` | Subtracts arg2 from arg1. Minimum of two arguments. If more than two arguments are supplied then each argument is subtracted from the previous result, e.g. subtract(10, 5, 2) returns 3. Can be expressed as '${field1}-${field2}'. | The result of subtracting each argument from the last argument or result of the last subtraction. |
| `*`, `multiply` | The value of arg1 multiplied by arg2. If more than two arguments are supplied then it will multiply by each argument in turn, e.g. multiply(10, 5, 2) returns 100. Can be expressed as '${field1}*${field2}'. | The value of arg1 multiplied by arg2. |
| `/`, `divide` | The value of arg1 divided by arg2. If more than two arguments are supplied then it will divide by each argument in turn, e.g. divide(1000, 10, 5, 2) returns 10. Can be expressed as '${field1}/${field2}'. | The value of arg1 divided by arg2. |
| `%`, `mod`, `modulo` | Calculates the modulus after dividing the dividend by the divisor. If more than one divisor is provided then the each subsequent divisor will be used to calculate the modulus using the previous result as the dividend, e.g. modulo(100, 30, 4) returns 2, i.e. (100 % 30) % 4. | The remainder (modulus) after dividing the dividend by the divisor. |
| `^`, `power` | The value of arg1 raised to the power of arg2. If more than two arguments are supplied then it will each argument to the power of the next, e.g. power(2, 4, 3) returns 4096. Can be expressed as '${field1}^${field2}'. | The value of arg1 raised to the power of arg2. |
| `add`, `+` | Adds the value of all arguments together. Minimum of two arguments. Can be expressed as '${field1}+${field2}'. | The sum of all values |
| `average`, `mean` | Determines the average (mean) value of all arguments. | The average (mean) of all the values |
| `ceiling` | Rounds the supplied value up to the next whole number. e.g. ceiling(1.2) returns 2. | The rounded value. |
| `floor` | Rounds the supplied value down to the next whole number. e.g. ceiling(1.8) returns 1. | The rounded value. |
| `max` | Determines the maximum value from all the arguments. | The largest value of all values. |
| `min` | Determines the minimum value from all the arguments. | The smallest of all values. |
| `negate` | Multiplies the supplied value by -1 | The result of multiplying the supplied number by -1 |
| `random` | Returns a double value with a positive sign, greater than or equal to 0.0 and less than 1.0. Returned values are chosen pseudorandomly with (approximately) uniform distribution from that range. | A random number between 0.0 (inc.) and 1.0 (excl.) |
| `round` | Rounds the supplied value to the nearest whole number. e.g. ceiling(1.8) returns 2. | The rounded value. |
| `stDev` | Determines the standard deviation from all the arguments. | The standard deviation of all values. |
| `sum` | Determines the sum of all the arguments. | Sum of all values |
| `variance` | Determines the variance value from all the arguments. | The variance of all the values. |


## Param

| Function | Does | Returns |
|---|---|---|
| `currentUser` | Returns the display name (or subjectId if there isn't one) of the current logged in user. | Display name (or subjectId if there isn't one) of the logged in user. |
| `currentUserDisplayName` | Returns the display name of the current logged in user. | The display name of the logged in user. |
| `currentUserFullName` | Returns the full name of the current logged in user. | The full name of the logged in user. |
| `currentUserSubjectId` | Returns the subject id of the current logged in user. | Subject id of the logged in user. |
| `currentUserUuid` | Returns the UUID of the current logged in user. | UUID of the logged in user. |


## Selection

| Function | Does | Returns |
|---|---|---|
| `any` | Selects the first value found in the group that is not null() or err(). If no explicit ordering is set then the value selected is indeterminate. | The first value of the group. |
| `bottom` | Selects the bottom N values and returns them as a delimited string in the order they are read. E.g. for values [1, 2, 3, 4, 5], bottom(${field}, ',', 2) returns '4,5'. | The bottom N values as a delimited string. |
| `first` | Selects the first value found in the group even if it is null() or err(). If no explicit ordering is set then the value selected is indeterminate. | The first value of the group. |
| `last` | Selects the last value found in the group even if it is null() or err(). If no explicit ordering is set then the value selected is indeterminate. | The last value of the group. |
| `nth` | Selects the Nth value in a set of grouped values. If there is no explicit ordering on the field selected then the value returned is indeterminate. E.g. for values [20, 40, 10, 30, 50], nth(${field}, 2) returns 40. | The Nth value of the grouped set. |
| `top` | Selects the top N values and returns them as a delimited string in the order they are read. E.g. for values [1, 2, 3, 4, 5], top(${field}, ',', 2) returns '1,2'. | The top N values as a delimited string. |


## String

| Function | Does | Returns |
|---|---|---|
| `concat` | Appends all the arguments end to end in a single string. | A string containing all the arguments concatenated together. |
| `contains` | Tests if inputString contains subString. | True if string contains substring |
| `decode` | Similar to a switch/case statement. The arguments are split into 3 parts: the input value to test, pairs of regex patterns with their respective output values and a default result if no matches are found. It must always have an even number of arguments and can have any number of pattern/result pairs. Result values in the format '$n' can be used to return the appropriate capture group values from the regex. | One of the result arguments, if matched, or the value of the otherwise argument if no match is found. |
| `decodeUrl` | Decodes a URL or other string that is the product of standard URL encoding, e.g. replacing '%20' with a space. | The input value with all URL encoding converted back to its plain text form. |
| `encodeUrl` | Encodes a URL or other string using standard URL encoding, e.g. replacing a space with '%20'. | The input value in URL encoded form. |
| `exclude` | If the supplied string matches one of the supplied regex patterns then return null, otherwise return the supplied string. | Null if the input matches one of the patterns, otherwise the input value. |
| `hash` | Generate a SHA-256 hash of the input string. | The hash string. |
| `hostAddress` | Returns the IP address for the supplied host name or address. | - |
| `hostName` | Returns the host name for the supplied host name or address. | - |
| `include` | If the supplied input string matches one of the supplied regex patterns then return the input string, otherwise return null. | The input value if one of the patterns matches it, otherwise null. |
| `indexOf` | Finds the first position (zero based) of subString in inputString or `-1` if it cannot be found. Uses a simple literal match. | The first position of subString. |
| `jq` | Extracts values from a JSON string using a JQ expression. Where the expression matches more than one element the string values of all the matched elements are concatenated. | The string value of the matched JSON element(s). |
| `lastIndexOf` | Finds the last position (zero based) of subString in inputString or `-1` if it cannot be found. Uses a simple literal match. | The last position of subString. |
| `lowerCase` | Convert the supplied string to lower case. | The string in lower case. |
| `match` | Tests an input string using a regular expression pattern. | True if pattern matches input |
| `param` | Fetches the value of named query parameter or null() if the key cannot be found. | The value associated with the supplied parameter key. |
| `params` | Returns all the query parameters for the current query, e.g. 'user=jbloggs site=HQ'. | All query parameters as a space delimited string. |
| `replace` | Perform text replacement on an input string using a regular expression to match part (or all) of the input string and a replacement string to insert in place of all matches. | - |
| `stringLength` | Return the length of the provided string. | The length of the string in characters. |
| `substring` | Extract a sub-string based on the start/end index values. | The requested sub-string. |
| `substringAfter` | Extract a sub-string from input after the first occurrence of delimiter. e.g. substringAfter('key=>value', '=>') returns 'value'. | The requested sub-string. |
| `substringBefore` | Extract a sub-string from input before the first occurrence of delimiter. e.g. substringBefore('key=>value', '=>') returns 'key'. | The requested sub-string. |
| `upperCase` | Convert the supplied string to upper case. | The string in upper case. |
| `xpath` | Extracts values from an XML string using an XPath 3.1 expression. The string values of all matched items are concatenated in document order. If no namespace prefix mappings are supplied then the XML is treated as being namespace unaware, i.e. element and attribute names are matched on their local name only. | The concatenated string values of all the items matched by the expression. |


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
| `extractAuthorityFromUri` | Extract the authority component from a URI. | The authority from the URI or null if not found or the URI is mall-formed. e.g. extractAuthorityFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'foo:bar@w1.superman.com:8080'. |
| `extractFragmentFromUri` | Extract the fragment component from a URI. | The fragment from the URI or null if not found or the URI is mall-formed. e.g. extractFragmentFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'more-details'. |
| `extractHostFromUri` | Extract the host component from a URI. | The host from the URI or null if not found or the URI is mall-formed. e.g. extractHostFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'w1.superman.com'. |
| `extractPathFromUri` | Extract the path component from a URI. | The path from the URI or null if not found or the URI is mall-formed. e.g. extractPathFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'very/long/path.html'. |
| `extractPortFromUri` | Extract the port component from a URI. | The port from the URI or null if not found or the URI is mall-formed. e.g. extractPortFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns '8080'. |
| `extractQueryFromUri` | Extract the query component from a URI. | The query from the URI or null if not found or the URI is mall-formed. e.g. extractQueryFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'p1=v1&p2=v2'. |
| `extractSchemeFromUri` | Extract the scheme component from a URI. | The scheme from the URI or null if not found or the URI is mall-formed. e.g. extractSchemeFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'http'. |
| `extractSchemeSpecificPartFromUri` | Extract the scheme specific part component from a URI. | The scheme specific part from the URI or null if not found or the URI is mall-formed. e.g. extractSchemeSpecificPartFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns '//foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2'. |
| `extractUserInfoFromUri` | Extract the user info component from a URI. | The user info from the URI or null if not found or the URI is mall-formed. e.g. extractUserInfoFromUri('http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&p2=v2#more-details') returns 'foo:bar'. |


## Value

| Function | Does | Returns |
|---|---|---|
| `err` | Returns an error. | An error. |
| `false` | Returns the boolean false. | The boolean false. |
| `formatIECByteSize` | Convert a number of bytes into a more human readable form. | A more human readable IEC representation of byte size. |
| `formatMetricByteSize` | Convert a number of bytes into a more human readable form. | A more human readable metric representation of byte size. |
| `null` | Returns a null value. | A null value. |
| `true` | Returns the boolean true. | The boolean true. |
