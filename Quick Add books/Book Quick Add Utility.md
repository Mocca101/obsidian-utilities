# Book Quick Add Utillity

A combination of a script and Template to quickly fetch and Add books using [Open Library's](https://openlibrary.org/) API as well as to achieve something like the Movie Gallery from [Kepano](https://github.com/kepano) & [chhoumann](https://github.com/chhoumann) (To achieve this you'll have to use the minimal Theme).

I haven't tested it extensively but I hope most bugs should have been ironed out. Please feel free to open an Issue if you notice anything.

Currently there are 2 ways to Add Books:
1. By the Open Library Id of a book (I recommend this, as it yields the proper book more often). For this:
	1. Go to [Open Library's](https://openlibrary.org/) 
	2. Search the Book you Want
	3. Scroll down to the "This Edition" Section and find the Open Library Id under "ID numbers"
	4. Copy it
	5. Start the Quick Add Macro 
	6. Enter "OL:++++++++++" where "++++++++++" is the OL Id
	7. This should add the book, if the Script doesn't find some of the Properties in your Template it will ask you to add them yourself ^510404
2. Search for the name of the Book, or ISBN, ...
	1. Start the Quick Add Macro 
	2. Enter the name of the Book, or ISBN, ...
	3. This will result in a list of entries. 
	4. Select the one you want
	5. Same as [7](Book Quick Add Utillity#^510404)

To Add the Macro please follow the same steps as [chhoumann](https://github.com/chhoumann)'s [Macro: Fetching movies and TV shows into your vault](https://github.com/chhoumann/quickadd/blob/master/docs/Examples/Macro_MovieAndSeriesScript.md). Just with the Book Script and Template (though there won't be the same properties available).

### Template:
```
---
aliases: 
- 
tags: 
- WIP
- sources/books📚
cover: {{VALUE:coverLink}}
---
[[📕 Books]]

Author:: {{VALUE:authorLinks}}
Subject:: {{VALUE:genreLinks}}
ISBN:: {{VALUE:isbn}}
Publish Date:: {{VALUE:publish_date}}
Pages:: {{VALUE:pagination}}

DOI::
Edition::
Date Finished::
Rating::
Reviewed Date:: 


![poster]({{VALUE:coverLink}})

# {{VALUE:fileName}}

###### Description
{{VALUE:description}}

```

### Script