---
title: "HTTP and JSON"
linkTitle: "HTTP and JSON"
weight: 60
date: 2026-10-14
tags:
description: >
  XSLT functions for http and json.
pageKind: reference
---

## fetch-json()

```text
fetch-json(String url)
fetch-json(String url, String clientConfig)
```

* `fetch-json(String url)` - Simplistic version of `http-call` that sends a request to the passed `url` and converts the JSON response body to XML using `json-to-xml`.
* `fetch-json(String url, String clientConfig)` - As above, with the HTTP client configured using the same JSON object as [`http-call()`]({{< relref "#clientconfig" >}}), e.g. to supply SSL configuration.


## http-call()

Executes an HTTP(S) request to a remote server and returns the response.

```text
http-call(String url, [String headers], [String mediaType], [String data], [String clientConfig])
```

The arguments are as follows:

* `url` - The URL to send the request to.
* `headers` - A newline (`&#10;`) delimited list of HTTP headers to send.
  Each header is of the form `key:value`.
* `mediaType` - The media (or MIME) type of the request `data`, e.g. `application/json`.
  If not set `application/json; charset=utf-8` will be used.
* `data` - The data to send.
  The data type should be consistent with `mediaType`.
  The request is always sent as a POST, and `data`, if supplied, is sent as the request body.
  Use `fetch-json()` to send a GET.
* `clientConfig` - A JSON object containing the configuration for the HTTP client to use, including any SSL configuration.

The function returns the response as XML with namespace `stroom-http`.
The XML includes the body of the response in addition to the status code, success status, message and any headers.


### `clientConfig`

The client can be configured using a JSON object containing various optional configuration items.
The following is an example of the client configuration object with all the keys that Stroom uses populated.

```json
{
  "callTimeout": "PT30S",
  "connectionTimeout": "PT30S",
  "sslConfig": {
    "keyStorePassword": "password",
    "keyStorePath": "/some/path/client.jks",
    "keyStoreType": "JKS",
    "trustStorePassword": "password",
    "trustStorePath": "/some/path/ca.jks",
    "trustStoreType": "JKS",
    "sslProtocol": "TLSv1.2",
    "hostnameVerificationEnabled": false
  }
}
```

If you supply a `clientConfig`, set both timeouts, as an omitted timeout defaults to 500 milliseconds.
Other keys from older versions of this object, such as `followRedirects`, `httpProtocols`, `readTimeout`, `retryOnConnectionFailure` and `writeTimeout`, are accepted but ignored.


### Example output

The following is an example of the XML returned from the `http-call` function:

```xml
<response xmlns="stroom-http">
  <successful>true</successful>
  <code>200</code>
  <message>OK</message>
  <headers>
    <header>
      <key>cache-control</key>
      <value>public, max-age=600</value>
    </header>
    <header>
      <key>connection</key>
      <value>keep-alive</value>
    </header>
    <header>
      <key>content-length</key>
      <value>108</value>
    </header>
    <header>
      <key>content-type</key>
      <value>application/json;charset=iso-8859-1</value>
    </header>
    <header>
      <key>date</key>
      <value>Wed, 29 Jun 2022 13:03:38 GMT</value>
    </header>
    <header>
      <key>expires</key>
      <value>Wed, 29 Jun 2022 13:13:38 GMT</value>
    </header>
    <header>
      <key>server</key>
      <value>nginx/1.21.6</value>
    </header>
    <header>
      <key>vary</key>
      <value>Accept-Encoding</value>
    </header>
    <header>
      <key>x-content-type-options</key>
      <value>nosniff</value>
    </header>
    <header>
      <key>x-frame-options</key>
      <value>sameorigin</value>
    </header>
    <header>
      <key>x-xss-protection</key>
      <value>1; mode=block</value>
    </header>
  </headers>
  <body>{"buildDate":"2022-06-29T09:22:41.541886118Z","buildVersion":"SNAPSHOT","upDate":"2022-06-29T11:06:26.869Z"}</body>
</response>
```


### Example usage

This is an example of how to use the function call in your XSLT.
It is recommended to place the `clientConfig` JSON in a [Dictionary]({{< relref "../glossary.md#dictionary" >}}) to make it easier to edit and to avoid having to escape all the quotes.

```xml
  ...
  <xsl:template match="record">
    ...
    <!-- Read the client config from a Dictionary into a variable -->
    <xsl:variable name="clientConfig" select="stroom:dictionary('HTTP Client Config')" />
    <!-- Make the HTTP call and store the response in a variable -->
    <xsl:variable name="response" select="stroom:http-call('https://reqbin.com/echo', null, null, null, $clientConfig)" />
    <!-- Apply 'response' templates to the response -->
    <xsl:apply-templates mode="response" select="$response" />
    ...
  </xsl:template>

  <xsl:template mode="response" match="http:response">
    <!-- Extract just the body of the response -->
    <val><xsl:value-of select="./http:body/text()" /></val>
  </xsl:template>
  ...
```


## json-to-xml()

Returns an XML representation of the supplied JSON value for use in XPath expressions

```text
json-to-xml(String json)
```
