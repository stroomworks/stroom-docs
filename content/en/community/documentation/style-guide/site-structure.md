---
title: "Site Structure"
linkTitle: "Site Structure"
weight: 10
date: 2022-01-25
tags:
description: >
  Describes the file and directory structure for the site.
---

## File names

Ideally files and directories should be named using _lower-kebab-case_, e.g. `site-structure.md`.


## Directory structure

All page content, i.e. markdown, is located underneath `content/en`.
This directory has one sub-directory for each of the top nav bar items.

### Stroom-Docs top level sections

Each of the following sections can have a different styling that is appropriate to its content, e.g. documentation vs blog.


#### Landing Page

The landing page is located at `content/en/_index.html`.
This is the page that users will initially see, unless visiting via a direct link.


#### About (`about`)

A single page describing what stroom is.


#### Documentation (`docs`)

This is where all the documentation for installing, administering and using stroom is located.
It is split into five sections by what the reader is doing, not by which part of Stroom the page is about:

| Section       | Directory      | The reader is...                          | Typical page                                   |
|---------------|----------------|-------------------------------------------|------------------------------------------------|
| Get Started   | `get-started/` | following a thread, start to finish       | Install for evaluation, send your first data   |
| Concepts      | `concepts/`    | building a mental model                   | Streams, pipelines, reference data             |
| Guides        | `guides/`      | doing a specific job                      | Connecting a shipper, building an index        |
| Reference     | `reference/`   | looking one thing up                      | Pipeline elements, configuration properties    |
| Operate       | `operate/`     | installing, running, fixing or resetting  | Troubleshooting, resetting an index            |

Within these, `guides/` is divided by job (`sending-data/`, `receiving-and-routing/`, `translating/`, `reference-data/`, `indexing/`, `searching/`, `detection/` and `automation/`), and `operate/` has sub-sections for `install/`, `checking-it-works/`, `resetting/` and `troubleshooting/`.
`concepts/` and `reference/` are mostly flat, with a few sub-sections where a topic has several pages (e.g. `concepts/streams/`, `reference/xslt-functions/`).

When adding a page, decide which of these the reader is doing first; that decides the section.
A page that explains a model and also tells you how to do something is usually two pages: a concept and a guide.

Every page in `docs` declares what kind of page it is in its front matter, and pages that tell the reader to do something must also say how to tell it worked.
See [Page Contract]({{< relref "page-contract" >}}).

Some pages in `reference/` are generated from the Stroom source and must not be edited by hand.
See [Building the Documentation]({{< relref "../building#regenerating-the-reference-pages" >}}).


#### Release Notes (`releases`)

This section contains the release notes for each major and minor version of Stroom.
It is a `docs` type section, so it is ordered by the [weight]({{< relref "front-matter#weight" >}}) of each item, with the newest version at the top (lowest weight) after `unreleased.md`.
It is not covered by the [page contract]({{< relref "page-contract" >}}).

Versions up to 7.1 have a single page each, e.g. `v07.01.md`.
From 7.2 onwards each minor version has a directory, e.g. `v07.14/`, containing:

```text
└── v07.14/
    ├── _index.md              Overview of the version
    ├── new-features.md
    ├── preview-features.md
    ├── breaking-changes.md
    ├── upgrade-notes.md
    └── change-log.md
```

Files and directories are named in the form `vXX.YY` where `XX` is the zero padded major version and `YY` is the zero padded minor version, e.g. `v07.01`.
The zero padding keeps them in order in the source tree.

The front matter of a version's `_index.md` should be set along these lines:

```yaml
---
title: "Version 7.14"
linkTitle: "7.14"
weight: 20
date: 2026-09-30
tags:
description: >
  Key new features and changes present in v7.14 of Stroom and Stroom-Proxy.
---
```

When adding a new version, give it a weight between that of `unreleased.md` and the previous newest version, re-numbering the others with `change_weights.sh` if there is no gap (see [Weight]({{< relref "front-matter#weight" >}})).


#### News (`news`)

This is a `blog` type section containing blog posts for Stroom news items, displayed in reverse chronological order based on the `date` key in each page's front matter.

It has a flat structure with one `.md` file per news item.
Each file should be named in the form `YYYYMMDD-<name>.md`.
The `date` key should be set in the front matter to match the date of the file.
The date should be set in ISO 8601 date format, i.e.

```yaml
date: 2021-07-09
```


#### Community (`community`)

This section provides information for people wanting to contribute to the development of Stroom and its peripheral repositories.
This can include developer documentation for building and developing Stroom.
It has a tree structure like `docs`, but is not split into the five reader-task sections and is not covered by the page contract.


### Documentation content

The `docs` and `community` top level sections have a tree structure for their content.
Each of these directories will contain three different types of entities:

* Section directories
* Section index files (`_index.md`)
* Pages (e.g. `building.md`)

The following is an example of part of the structure of the `community` section.

```text
├── documentation/                 Documentation section directory
│   ├── building.md                Page
│   ├── _index.md                  Documentation section index page
│   ├── style-guide/               Style guide section directory
│   │   ├── basic-elements.md      Page
│   │   ├── icon-gallery.md        Page     
│   │   ├── _index.md              Style guide section index page
│   │   ├── site-structure.md      Page
│   │   └── using-images.md        Page
│   └── versions.md                Page
└── roadmap.md                     Page
```

A section can essentially contain branches (sections) and leaves (pages).
A branch (i.e. a section) is defined by a directory that contains an `_index.md` file.
The front matter in this index file defines the meta data for that section, e.g. the title, date, tags, description, etc.
A leaf (i.e. a page with no children) is just a markdown file with front matter.
The front matter for branches and leaves works in the same way.

## How do I...?

### Add a child page

If you already have a section that you want to add a new child page to then you will already have a structure like this:

```text
└── my-section/
    ├── _index.md
    ├── a-page.md
    └── another-page.md
```

To add a new page simple create a `.md` file for the new page in the section directory, e.g.

```text
└── my-section/
    ├── _index.md
    ├── a-page.md
    ├── another-page.md
    └── new-page.md
```

Add the [front matter]({{< relref "front-matter" >}}) to the top of the new page file. e.g.

```yaml
---
title: "My Long Wordy Title"
linkTitle: "My Short Title"
weight: 20
date: 2022-01-27
tags: 
pageKind: guide
verification: required
description: >
  A new page describing stuff.
---
```

`pageKind` and `verification` are required for pages under `docs` and are checked by the build; `verification` is only allowed on `tutorial`, `guide` and `operate` pages, and `required` means the page must contain a `verify` block.
See [Page Contract]({{< relref "page-contract" >}}).
Leave them out for pages in other sections.

The new page should now appear in the list of child pages on the section page and in the left hand navigation pane.

If you want to control the position of the new page relative to its siblings then adjust the [weight]({{< relref "front-matter#weight" >}}) of this page and that of its siblings to get the order that you want.

### Add a new section

If you want to add a sub-section to an existing section then you will already have a structure like this:

```text
└── my-section/
    ├── _index.md
    ├── a-page.md
    └── another-page.md
```

To add a new sub-section create a sub-directory within the existing directory (with a name that roughly matches the section name) and create an `_index.md` file within it, e.g.

```text
└── my-section/
    ├── my-new-sub-section/
    │   └── _index.md
    ├── _index.md
    ├── a-page.md
    └── another-page.md
```

In the `_index.md` file add front matter to the top, e.g.

```yaml
---
title: "My Long Wordy Section Title"
linkTitle: "My Short Section Title"
weight: 20
date: 2022-01-27
tags: 
pageKind: concept
description: >
  A new section for stuff.
---
```

Under `docs` a section's `_index.md` is checked against the [page contract]({{< relref "page-contract" >}}) like any other page.
An index page that only introduces and lists its children uses `pageKind: concept`, as the existing section indexes do, and so has no `verification` key.
If the index page itself tells the reader to do something, give it the matching `pageKind` and a `verification` key.
Leave these keys out for sections outside `docs`.

As with pages, adjust the [weight]({{< relref "front-matter#weight" >}}) of the section and its siblings to get the order you require.

To add pages to this new section see [Add a new child page]({{< relref "#add-a-child-page" >}}) above.

If you are not sure if you need to add a whole new sub-section or just a child page you can just add a new sub-section and add content to the `_index.md` file as if it were a simple page.
If you later realise that you need child pages then move the content out into a child page and create other sibling pages to it.
