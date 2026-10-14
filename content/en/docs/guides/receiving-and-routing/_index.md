---
title: "Receiving and Routing"
linkTitle: "Receiving and Routing"
weight: 20
date: 2026-10-14
tags:
description: >
  Deciding what Stroom accepts, what it quietly discards, and what it refuses outright.
pageKind: concept
---

Everything arriving at Stroom is checked before it is kept.
The check decides one of three things: accept it, refuse it, or take it and throw it away.

That third option is deliberate and useful, and it is also the reason this part of Stroom deserves care.
A sender whose data is being dropped is told the send succeeded, so nothing on either side reports a problem while the data goes nowhere.

* [Controlling what is accepted]({{< relref "controlling-what-is-accepted.md" >}}) covers setting it up and, more importantly, proving which of the three is happening.

[Data receipt]({{< relref "../../concepts/data-receipt.md" >}}) in Concepts explains the mechanism: the receipt check modes, feed status, and how receipt rules are evaluated.


## The three outcomes

| Outcome | The sender sees | The data |
|---|---|---|
| Receive | Success | Stored |
| Reject | An error, with a status code saying why | Not stored |
| Drop | Success | Discarded |

**Reject** is for senders that should correct something: a feed that does not exist, or data that fails a rule.
The error gives them something to act on.

**Drop** is for when the sender should not know.
That is occasionally exactly what is wanted, and the rest of the time it is a configuration mistake that is almost impossible to notice from either end.

{{< image src="guides/receiving-and-routing/receipt-outcomes.svg" alt="Data arriving at the datafeed endpoint passes through feed status or receipt rules and reaches one of three outcomes. Receive: the sender sees success and the data is stored. Reject: the sender sees an error and nothing is stored. Drop, highlighted: the sender sees success and the data is discarded." >}}Only one of the three tells the sender anything is wrong. Drop and Receive look identical from both ends, which is why the stream existing is the only proof of receipt.{{< /image >}}
