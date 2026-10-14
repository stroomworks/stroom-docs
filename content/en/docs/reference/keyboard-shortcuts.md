---
title: "Keyboard Shortcuts"
linkTitle: "Keyboard Shortcuts"
weight: 110
date: 2026-10-14
tags:
description: >
  Keyboard shortcuts for actions in Stroom.
pageKind: reference
aliases:
  - /docs/reference-section/keyboard-shortcuts/
---

This section describes all the keyboard shortcuts that are available to use in Stroom.
Some shortcuts apply everywhere and some are specific to the screen that you are in or the user interface component that has focus.

Keyboard shortcuts can take two forms:

* **Combination** - Multiple keys pressed at the same time, e.g. `ctrl+enter`.
* **Sequence** - Multiple keys pressed in sequence with only one key pressed at a time, e.g. `g+t`, press

{{% warning %}}
Currently these keyboard shortcuts will not work if a visualisation or documentation preview pane has focus.
This is a known issue that will be addressed in the future.
{{% /warning %}}


## General shortcuts

Action                             | Shortcut                                                           | Notes
-------                            | -------------                                                      | -------
Cancel | `esc` | Closes/cancels an open popup or dialog discarding any changes. Equivalent to clicking **Cancel** on a dialog.
Select / toggle | `space` | Selects a row/item in a table, list, selection box or tab bar. Toggles a focused checkbox. Selects a radio button.
Execute | `enter` | Selects a row/item in a table, list, selection box or tab bar. Opens a Document/Date picker dialog on a Document/Date field.
OK | `ctrl+enter` | Equivalent to clicking **OK** on a dialog, closes the dialog accepting any changes.
Context Menu | `menu` | Shows the context menu for the selected item, e.g. the selected item in the explorer tree.
Select all | `ctrl+a` |
Save | `ctrl+s` | Save the current tab.
Save all | `shift+ctrl+s` | Saves all open and un-saved tabs.
Close | `alt+w` | Close the current tab.
Close all | `shift+alt+w` | Closes all open tabs.


### Movement

Movement within lists, selection boxes or tab bars you can use the cursor keys, `hjkl` or `wasd` to move between items.

Action                             | Shortcut
-------                            | -------------
Up | `up` or `k` or `w`
Down | `down` or `j` or `s`
Left | `left` or `h` or `a`
Right | `right` or `l` or `d`

You can also move up or down by _page_ using:

Action                             | Shortcut
-------                            | -------------
Page Up | `pgup`
Page Down | `pgdn`
Home / Start | `home`
End | `end`


### Finding things

Action                             | Shortcut                                                           | Notes
-------                            | -------------                                                      | -------
Find documents by name             | `shift+alt+f` or `shift+shift` | Find [documents]({{< relref "glossary.md#document" >}}) by name, type, [UUID]({{< relref "glossary.md#uuid" >}}).
Find in content                    | `shift+ctrl+f`                                    | Find [documents]({{< relref "glossary.md#document" >}}) whose content contains the search term. This is the same as clicking the {{< stroom-icon "find.svg" "Find In Content" >}} icon on the explorer tree.
Recent items                       | `ctrl+e`                                          | Find a [document]({{< relref "glossary.md#document" >}}) in a list of the most recently opened items.
Locate document                    | `alt+l`                                           | Locate the currently open document in the explorer tree. This is the same as clicking the {{< stroom-icon "locate.svg" >}} icon on the explorer tree.
Help                               | `f1`                                              | Show the help popup for the currently focused screen control, e.g. a text box. This shortcut will only work if there is a help {{< stroom-icon "help.svg" >}} next to the control.
Focus the Explorer Tree filter     | `ctrl+/`                                          | Changes focus to the Quick Filter in the [Explorer Tree]({{< relref "../concepts/user-interface.md" >}}) pane.
Focus the current tab Quick Filter | `/`                                               | If the currently open tab has a Quick Filter bar it will change focus to that so a filter term can be entered.


### Direct access to screens

The following shortcuts are all of the sequential type with the mnemonic _Goto X_.
These shortcuts may not do anything if you do not have the required permissions for the screen in question.

Action                       | Shortcut                 | Notes
-------                      | -------------            | -------
Goto Application Permissions | `g+a` |
Goto Caches                  | `g+c` |
Goto Dependencies            | `g+d` |
Goto Explorer Tree           | `g+e` | Changes focus to the Explorer Tree so the user can use the [Movement]({{< relref "#movement" >}}) shortcuts to move around the tree to select different documents.
Goto Index Volumes           | `g+i` |
Goto Jobs                    | `g+j` |
Goto API Keys                | `g+k` |
Goto Nodes                   | `g+n` |
Goto Properties              | `g+p` |
Goto Data Retention          | `g+r` |
Goto Search Results          | `g+s` |
Goto Server Tasks            | `g+t` |
Goto User Preferences        | `g+u` |
Goto Data Volumes            | `g+v` |
Goto User Accounts           | `g+x` |


### Creating new documents

The following shortcuts will open the dialog to create a new document in the currently selected explorer tree folder.
If a document is currently selected in the explorer tree then the new document will be created in the same folder as the selected document.
If nothing is selected or multiple items are selected then these key sequences have no effect.

Action                                                                | Shortcut
-------                                                               | -------------
Create Elastic Index {{< stroom-icon "document/ElasticIndex.svg" >}}   | `c+c`
Create Dashboard {{< stroom-icon "document/Dashboard.svg" >}}          | `c+d`
Create Feed {{< stroom-icon "document/Feed.svg" >}}                    | `c+e`
Create Folder {{< stroom-icon "document/Folder.svg" >}}                | `c+f`
Create Dictionary {{< stroom-icon "document/Dictionary.svg" >}}        | `c+i`
Create Lucene Index {{< stroom-icon "document/Index.svg" >}}           | `c+l`
Create Documentation {{< stroom-icon "document/Documentation.svg" >}}  | `c+o`
Create Pipeline {{< stroom-icon "document/Pipeline.svg" >}}            | `c+p`
Create Query {{< stroom-icon "document/Query.svg" >}}                  | `c+q`
Create Analytic Rule {{< stroom-icon "document/AnalyticRule.svg" >}}   | `c+r`
Create Text Converter {{< stroom-icon "document/TextConverter.svg" >}} | `c+t`
Create View {{< stroom-icon "document/View.svg" >}}                    | `c+v`
Create XSLT {{< stroom-icon "document/XSLT.svg" >}}                    | `c+x`


## Screen specific shortcuts

### Dashboard

The following shortcuts are available when editing a [Dashboard]({{< relref "../concepts/dashboards.md" >}}) {{< stroom-icon "document/Dashboard.svg" >}}.

Action              | Shortcut                      | Notes
-------             | -------------                 | -------
Execute all queries | `ctrl+enter` | Executes all queries on the Dashboard. This is the same as clicking {{< stroom-icon "play.svg" >}}.


### Pipeline stepping

The following shortcuts are available when [stepping]({{< relref "../concepts/pipeline-debugging.md" >}}) {{< stroom-icon "step.svg" >}} a pipeline.

Action       | Shortcut                      | Notes
-------      | -------------                 | -------
Step refresh | `ctrl+enter` | Refresh the current step. This is the same as clicking {{< stroom-icon "refresh.svg" >}}.


### Query

The following shortcuts are available when editing a [Query]({{< relref "../concepts/query-language.md" >}}) {{< stroom-icon "document/Query.svg" >}}.

Action        | Shortcut                      | Notes
-------       | -------------                 | -------
Execute query | `ctrl,enter` | Execute the current query. This is the same as clicking {{< stroom-icon "play.svg" >}}.


### Text editor

The following common shortcuts are available when editing text editing text in the {{< external-link "Ace" "https://ace.c9.io" >}} text editor that is used on many screens in Stroom, e.g. when editing a Pipeline or Query.

Action               | Shortcut                        | Notes
-------              | -------------                   | -------
Undo                 | `ctrl+z`       | Undo last action.
Redo                 | `ctrl+shift+z` | Redo previously undone action.
Toggle comment       | `ctrl+/`       | Toggle commenting of current line/selection. Applies when editing XML, XSLT or Javascript.
Move line up         | `alt+up`       | Move line/selection up.
Move line down       | `alt+down`     | Move line/selection down.
Delete line          | `ctrl+d`       | Delete the current line.
Find                 | `ctrl+f`       | Open find dialog.
Find/replace         | `ctrl+h`       | Open find/replace dialog.
Find next match      | `ctrl+k`       | Find next match.
Find previous match  | `ctrl+shift+k` | Find previous match.
Indent selection     | `tab`          | Indent the selected text.
Outdent selection    | `shift+tab`    | Un-indent the selected text.
Upper-case           | `ctrl+u`       | Make the selected text upper-case.
Open Completion list | `ctrl+space`   | Open the code completion list to show suggestions based on the current word. See Auto-Completion.
Trigger snippet      | `tab`          | Trigger the insertion of a snippet for the currently entered snippet trigger text. See [Tab triggers]({{< relref "snippet-reference.md#tab-positions" >}}).

See {{< external-link "Ace Default keyboard shortcuts" "https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" >}} for more.

If you know Vim key bindings then the Ace editor supports a reasonable sub-set of them, see Vim Key Bindings.
