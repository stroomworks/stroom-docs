---
title: "Page Contract"
linkTitle: "Page Contract"
weight: 45
date: 2026-10-14
tags:
  - style
description: >
  The front matter keys and shortcodes that make every instruction in the documentation say how to tell it worked.
---

## Why there is a contract

Stroom fails silently in many places.
A misconfigured feed still accepts data.
A broken pipeline reference produces empty output rather than an error.
An index with no volume group reports healthy fields and indexes nothing.
In each case the user cannot tell from the UI whether the thing they did worked, so the documentation has to.

The rule is that **every page that tells the reader to do something must also tell them how to know it worked**, what could have silently not worked, and what to do about it.
The front matter keys and shortcodes on this page give that a shape the build can check, rather than leaving it to each author's prose.

The contract only applies to pages in the `docs` section.
Community, news and release pages share the same layouts but are not checked.


## Front matter

| Key            | Required                             | Values                                                  |
|----------------|--------------------------------------|---------------------------------------------------------|
| `pageKind`     | Always                               | `tutorial`, `concept`, `guide`, `reference`, `operate`  |
| `verification` | For `tutorial`, `guide` and `operate` | `required`, `not-applicable`                            |
| `status`       | No                                   | `stable` (the default), `beta`                          |
| `betaNote`     | No                                   | A sentence added to the beta banner                     |
| `thirdParty`   | No                                   | The name of a third-party tool the page configures      |

`pageKind` says what the reader is doing on the page:

tutorial
: Following a thread from start to finish, as in Get Started.

concept
: Building a mental model.
  A concept page explains; it does not instruct.

guide
: Doing a specific job.

reference
: Looking one thing up.

operate
: Installing, running, fixing or resetting the system.

`verification: required` means the page has a `verify` block.
`verification: not-applicable` is allowed on an instructing page, but it has to be written down, so that skipping verification is a visible decision in a diff rather than an omission nobody notices.

`status: beta` renders a banner saying the page describes work that is not yet in a released version of Stroom.
Use it instead of a hand-written note, which drifts.

`thirdParty` renders a banner saying that the Stroom side of the page is verified against the Stroom source, but the named tool's configuration is written from that tool's documentation, has not been run, and should be checked against the reader's version.
A page with `thirdParty` must have `verification: required`: an unrun configuration snippet is exactly where the reader needs to be able to check their data arrived.

The build fails, naming the file, if:

* `pageKind` is missing or not one of the values above.
* An instructing page has no `verification`, or a non-instructing page has one.
* A page says `verification: required` and has no `verify` block.
* `status` is not `stable` or `beta`.
* A page has `thirdParty` without `verification: required`.

These checks are in `layouts/partials/docs-page-contract.html`.

The shortcodes check themselves too, on any page that uses them, not only pages in `docs`.
The build fails, naming the file and position, if:

* A `verify`, `golden`, `not-proof`, `trap` or `timing` block has no content.
* A `golden` or `not-proof` block is not directly inside a `verify` block.
* A `trap` has no `severity`, or one that is not `silent`, `destructive` or `immutable`.
* A `timing` has no `mode`, or one that is not `immediate` or `async`.
* A `diagnose` block does not contain a numbered list, i.e. no line starting with a number followed by a full stop, such as `1. `.
  An empty `diagnose` block fails this check.

These checks are in the shortcode templates in `layouts/shortcodes/`.


## Shortcodes

The blocks are called with angle brackets, `{{</* verify */>}}`, not `{{%/* verify */%}}`.
They render their own content as markdown, so links, code blocks, tables, lists and inline shortcodes such as `pipe-elm` and `stroom-icon` all work inside them.
Put each opening and closing tag on a line of its own, with a blank line before and after the block.


### Timing

How long the action should take, and whether it is asynchronous.
Put it first, because it governs how to read every check below it: in an asynchronous system, "no output yet" usually means not finished rather than failed.

`mode` is `immediate` or `async`.

{{< timing mode="async" >}}
Processing runs on a schedule.
Expect the first `Events` stream within a minute or two of the data arriving.
{{< /timing >}}

```markdown
{{</* timing mode="async" */>}}
Processing runs on a schedule.
Expect the first `Events` stream within a minute or two of the data arriving.
{{</* /timing */>}}
```


### Verify, golden and not-proof

`verify` says how to tell it worked: specific, observable and falsifiable.
A screen and a field, a count that changes, a response code, a stream that appears.
Never "it should now work".

Inside it, `golden` is the one check worth running above all others, and `not-proof` names what looks like confirmation but is not.
Both must be inside a `verify` block; the build fails otherwise.

{{< verify >}}
Open the feed and check the **Data** tab.

{{< golden >}}
**An `Events` stream exists for the data you sent.**
{{< /golden >}}

{{< not-proof >}}
**A `200` response from the datafeed is not proof.**
A receipt rule can drop data and still return success.
{{< /not-proof >}}

{{< /verify >}}

```markdown
{{</* verify */>}}
Open the feed and check the **Data** tab.

{{</* golden */>}}
**An `Events` stream exists for the data you sent.**
{{</* /golden */>}}

{{</* not-proof */>}}
**A `200` response from the datafeed is not proof.**
A receipt rule can drop data and still return success.
{{</* /not-proof */>}}

{{</* /verify */>}}
```


### Trap

Something that fails without saying so, destroys data, or cannot be undone.
Flag it; don't bury it in prose.

`severity` is one of:

silent
: Reports success and does nothing, e.g. an unpublished draft, or a `200` carrying `success: false`.

destructive
: Loses data when run.

immutable
: Cannot be changed later without a destructive rebuild.

{{< trap severity="immutable" >}}
**A field's type cannot be changed once data has been indexed.**
Changing it means resetting the index and reprocessing.
{{< /trap >}}

```markdown
{{</* trap severity="immutable" */>}}
**A field's type cannot be changed once data has been indexed.**
Changing it means resetting the index and reprocessing.
{{</* /trap */>}}
```


### Diagnose

An ordered diagnostic sequence, where each step rules out a class of cause.
It renders with an instruction not to skip ahead, and it must contain a numbered list: the order is the content.

{{< diagnose >}}
1. **Did the data arrive?**
   Check for a `Raw Events` stream on the feed.
1. **Is a processor filter enabled for the pipeline?**
1. **Are there `Error` streams on the feed?**
{{< /diagnose >}}

```markdown
{{</* diagnose */>}}
1. **Did the data arrive?**
   Check for a `Raw Events` stream on the feed.
1. **Is a processor filter enabled for the pipeline?**
1. **Are there `Error` streams on the feed?**
{{</* /diagnose */>}}
```


## How to reset it

Where a component can be reset, the page has a heading that links to the procedure in Operate > Resetting and says what resetting costs: what data is lost and what has to be reprocessed.
This is a heading convention rather than a shortcode, because a plain `relref` link is already checked by the build.


## Not every page, and not mechanically

A glossary entry has nothing to verify, and a concept page explains a model rather than instructing.
The contract binds pages that tell the reader to do something.
When reviewing, the test is whether a page that instructs also says how to confirm the instruction worked.
