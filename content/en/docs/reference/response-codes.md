---
title: "Datafeed Response Codes"
linkTitle: "Datafeed Response Codes"
weight: 20
date: 2026-10-14
tags:
description: >
  Every status a post to the datafeed endpoint can return, and what each one means.
pageKind: reference
---

Every post to the datafeed endpoint returns an HTTP status.
When something is wrong it also returns a **`Stroom-Status`** header carrying the more specific code below, and a **`Stroom-Error`** header carrying the reason in words.

On success the response body is the post's receipt id, such as `1791981748008_0000_S_node1a`: the receive time, a sequence number, `S` for Stroom or `P` for Stroom Proxy, and the node.
It is not a header.
The same id is stored on the stream as its `ReceiptId` attribute, which is what lets you trace a delivery through a chain of proxies.

**A sender that records none of these cannot tell you why data is missing.**
Capture all three.

There are **26** codes.

| HTTP | `Stroom-Status` | Message | What it means |
|---|---|---|---|
| `200` | `0` | OK | Post of data successful |
| `406` | `100` | Feed must be specified | You must provide Feed as a header argument in the request |
| `406` | `101` | Feed is not defined | The feed you have provided is not known within Stroom |
| `406` | `102` | Data type is invalid | If you provide a data type it must be valid |
| `406` | `103` | A mandatory header is missing | You must provide all mandatory headers. |
| `406` | `104` | Data format is invalid | If you provide a data Format header, its value must be valid |
| `406` | `110` | Feed is not set to receive data | The feed you have provided has not been setup to receive data |
| `406` | `111` | Feed is not valid | The feed you have provided does not match an agreed pattern |
| `406` | `112` | Data Feed key and/or accountId is not valid | The Data Feed Key and/or AccountId you have provided do not match |
| `406` | `113` | Data has been rejected by the receipt policy rules | The meta data provided with the data has been rejected by the receipt policy rules. |
| `406` | `120` | Unexpected data type | The data type supplied is not expected |
| `406` | `200` | Unknown compression | Compression argument must be one of ZIP, GZIP and NONE |
| `401` | `300` | Client Certificate Required | The feed you have provided requires a client HTTPS certificate to send data |
| `401` | `301` | Client Token Required | A client token is required to send data |
| `401` | `302` | Client token or certificate required | The feed you have provided requires a client HTTPS certificate or token to send data |
| `401` | `303` | Client data feed key required | A client data feed key is required to send data |
| `401` | `304` | Authentication of the client is required | Some form of client authentication is required, e.g. certificate, token, data feed key, etc. |
| `401` | `310` | Client Certificate failed authentication | The provided client certificate could not be authenticated |
| `401` | `311` | Client Token failed authentication | The provided client token cannot be authorised |
| `401` | `312` | Client Token or Certificate failed authentication | The provided client token or certificate cannot be authorised |
| `401` | `313` | Data feed key failed authentication | The provided data feed key cannot be authorised |
| `401` | `314` | Data feed key has expired | The provided data feed key has passed its expiry date |
| `401` | `315` | Client Certificate DN failed authentication | The provided client certificate DN could not be authenticated |
| `500` | `400` | Compressed stream invalid | The stream of data sent does not form a valid compressed file.  Maybe it terminated |
| `413` | `410` | Content too large | The stream of data exceeded the configured max number of bytes. |
| `500` | `999` | Unknown error | An unknown unexpected error occurred |
