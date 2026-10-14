---
title: "Controlling What Is Accepted"
linkTitle: "Controlling What Is Accepted"
weight: 10
date: 2026-10-14
tags:
description: >
  Setting feed status and receipt rules, and proving which of receive, reject and drop is actually happening.
pageKind: guide
verification: required
---

Two settings decide what happens to arriving data: the **receipt check mode**, which chooses *how* the decision is made, and then either the feed's own status or the receipt rules, which make it.


## Choose how the decision is made

The property `receive.receiptCheckMode` selects the mechanism.
The default is `FEED_STATUS`, which asks the feed.

The mode must be the same on Stroom and on **every** proxy in front of it.
A chain where one hop checks differently from the next produces data accepted at one layer and discarded at another, which is very hard to see from either end.


## Then set the decision

With `FEED_STATUS`, each feed carries its own status on its **Settings** tab: Receive, Reject or Drop.

With `RECEIPT_POLICY`, receipt rules decide.
Each rule is an expression over the metadata (in practice, the headers of the request) and an action.
Rules are tested in order and the first match wins.

{{% warning %}}
**If no receipt rule matches, the data is rejected.**
A rule set that covers only the cases you thought about refuses everything else.
If you want to accept anything not otherwise matched, finish with a rule that has no terms and a Receive action.
{{% /warning %}}

Data that passes the rules must still be for a feed that exists, unless automatic feed creation is switched on.

{{< timing mode="async" >}}
Proxies fetch feed status and receipt rules from Stroom and cache them, so a change takes a short time to reach every hop rather than applying at once.

During that window different parts of the chain are making different decisions.
When testing a change, allow for the cache before concluding it did not work.
{{< /timing >}}

{{< verify >}}
Send one record to the feed and confirm it arrives, by finding that specific stream on the Data screen.
Then set the feed to Reject, send again, and confirm the sender gets an error.

{{< golden >}}
**A test send appears as a stream you can open, and a send that should be refused returns an error to the sender.**

Both directions are needed.
Confirming that accepted data arrives tells you nothing about whether the refusal path works, and the refusal path is the one protecting you.
{{< /golden >}}

{{< not-proof >}}
**A `200` from the datafeed endpoint is not proof the data was kept.**
A dropped send returns success.
This is the single most important thing to know about receipt: the only proof of receipt is the stream existing.

**Data arriving in the past is not proof it is arriving now.**
Feed status, rules and permissions all change, and the symptom of each is data that simply stops.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A feed set to Drop returns success and discards the data.**

The sender's logs show successful sends.
Stroom shows no errors, because nothing went wrong.
The data is gone, and the only evidence is the absence of streams nobody is counting.

Before investigating a sender that "stopped working", check the feed's status.
Drop is occasionally set deliberately and then forgotten, and it is also what a rule set does when a Drop rule matches more than its author expected.
{{< /trap >}}

{{< trap severity="silent" >}}
**A rule set with no catch-all rejects everything it did not anticipate.**

The default for an unmatched record is reject.
Add a final rule with no terms once you know what you want the fallback to be, and decide that deliberately rather than inheriting it.
{{< /trap >}}

{{< diagnose >}}
1. **Did a stream appear?**
   Search the Data screen for the feed over the last few minutes.
   This is the only question that distinguishes received from dropped, since both look like success to the sender.
1. **What is the feed's status?**
   Receive, Reject or Drop, on the feed's Settings tab.
1. **What is the receipt check mode, here and on every proxy?**
   A mismatch along the chain gives data that vanishes between hops.
1. **Which rule matched?**
   Rules are evaluated in order and the first wins, so a broad rule early in the list can shadow everything after it.
1. **Does the feed exist, and exactly as spelled?**
   Feed names normalise, so a name that looks new may be colliding with an existing feed, and one that looks right may not exist at all.
   See [Choosing a feed]({{< relref "../sending-data/choosing-a-feed.md" >}}).
1. **What did the sender actually get?**
   A status code and the `Stroom-Status` header together say why something was refused.
   See [Response codes]({{< relref "../../reference/response-codes.md" >}}).
{{< /diagnose >}}
