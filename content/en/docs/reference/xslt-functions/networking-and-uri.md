---
title: "Networking and URI"
linkTitle: "Networking and URI"
weight: 40
date: 2026-10-14
tags:
description: >
  XSLT functions for networking and uri.
pageKind: reference
---

## cidr-to-numeric-ip-range()

Converts a CIDR IP address range to an array of numeric IP addresses representing the start and end (broadcast) of the range.

When storing the result in a variable, ensure you indicate the type as a string array (`xs:string*`), as shown in the below example.


### Example XSLT

```xml
<xsl:variable name="range" select="stroom:cidr-to-numeric-ip-range('192.168.1.0/24')" as="xs:string*" />
<Range>
  <Start><xsl:value-of select="$range[1]" /></Start>
  <End><xsl:value-of select="$range[2]" /></End>
</Range>
```


### Example output

```xml
<Range>
  <Start>3232235776</Start>
  <End>3232236031</End>
</Range>
```


## host-address()

Convert a hostname into an IP address.

```text
host-address(String hostname)
host-address(String hostname, Boolean ignoreWarnings)
```

Set `ignoreWarnings` to `true` to suppress the warning raised when the hostname cannot be resolved.


## host-name()

Convert an IP address into a hostname.

```text
host-name(String ipAddress)
host-name(String ipAddress, Boolean ignoreWarnings)
```

Set `ignoreWarnings` to `true` to suppress the warning raised when the IP address cannot be resolved.


## ip-in-cidr()

Return whether an IPv4 address is within the specified CIDR (e.g. `192.168.1.0/24`).

```text
ip-in-cidr(String ipAddress, String cidr)
```


## numeric-ip()

Convert an IP address to a numeric representation for range comparison, such as a [range lookup]({{< relref "reference-data.md#range-lookups" >}})

```text
numeric-ip(String ipAddress)
```


## parse-uri()

The parse-uri() function takes a Uniform Resource Identifier (URI) in string form and returns an XML node with a namespace of `uri` containing the URI's individual components of `authority`, `fragment`, `host`, `path`, `port`, `query`, `scheme`, `schemeSpecificPart` and `userInfo`.
See either {{< external-link "RFC 2306: Uniform Resource Identifiers (URI): Generic Syntax" "http://www.ietf.org/rfc/rfc2396.txt" >}} or Java's java.net.URI Class for details regarding the components.

The following xml

```xml
<!-- Display and parse the URI contained within the text of the rURI element -->
<xsl:variable name="uri" select="stroom:parse-uri(rURI)" />

<URI>
  <xsl:value-of select="rURI" />
</URI>
<URIDetail>
  <xsl:copy-of select="$uri"/>
</URIDetail>
```

Given the rURI text contains

```text
http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&amp;p2=v2#more-details
```

Would provide

```xml
<URI>http://foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&amp;p2=v2#more-details</URI>
<URIDetail>
  <authority xmlns="uri">foo:bar@w1.superman.com:8080</authority>
  <fragment xmlns="uri">more-details</fragment>
  <host xmlns="uri">w1.superman.com</host>
  <path xmlns="uri">/very/long/path.html</path>
  <port xmlns="uri">8080</port>
  <query xmlns="uri">p1=v1&amp;p2=v2</query>
  <scheme xmlns="uri">http</scheme>
  <schemeSpecificPart xmlns="uri">//foo:bar@w1.superman.com:8080/very/long/path.html?p1=v1&amp;p2=v2</schemeSpecificPart>
  <userInfo xmlns="uri">foo:bar</userInfo>
</URIDetail>
```
