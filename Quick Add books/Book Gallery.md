---
cssClasses: cards
---

```dataview
table without id ("![](" + cover + ")") as Cover, file.link as Name, publish-date as "Date Published", "by " + author as author

from #sources/books📚  

where cover != null AND file.name != "Book Template"
sort file.name asc
```
