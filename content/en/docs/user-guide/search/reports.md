---
title: "Reports"
linkTitle: "Reports"
weight: 50
date: 2025-01-08
tags:
  - reporting
description: >
  The process of querying data from an index to produce a tablular output.

---

Reports are built from a {{< glossary "StroomQL" >}} query.

The output of a Report is a table of data that can be emailed to a user, or directed to a Stream.
Supported formats for the table are Excel, {{< glossary "CSV" >}} or {{< glossary "TSV" >}}.

## Creating
Right click on a folder in the explorer tree that you want to create a report in.\
Choose ‘New/Search/Report’ from the popup menu:

{{< stroom-menu "New" "Search" "Report" >}}

Call the report something like ‘My Report’ and click {{< stroom-btn "OK" >}}.
## Details
A new blank Report will the created, there are multiple panes that must now be completed to produce your report.
### Query pane
Specify a  {{< glossary "StroomQL" >}} query in the Query pane.\
An example query is shown below
```stroomql
from "Meta Store"
where Type = "Raw Events"

select Feed, count()
```
### Settings pane
Specify an report format, select from Excel, {{< glossary "CSV" >}} or {{< glossary "TSV" >}}.
### Notifications pane
Notifications are used to specify the destination of the generated Report.\
Click the {{< stroom-icon "add.svg" "Add" >}} icon to add a new destination.\
Choose either  {{< glossary "Stream" >}}  or Email.\
If you choose  {{< glossary "Stream" >}} , the report will be created in the chosen Stream with a type of Report.\
If you choose Email, the report will be sent to the email addresses specified.
### Execution pane
Click the {{< stroom-icon "add.svg" "Add" >}} icon to add a new Execution schedule.\
 [Schedules]({{< relref "scheduler" >}}) can either be Frequency or  {{< glossary "Cron" >}} based.