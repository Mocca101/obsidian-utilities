// Based on Christian B. B. Houmann's Script for fetching movies from OMDB
// https://github.com/chhoumann/quickadd/blob/master/docs/Examples/Attachments/movies.js

const notice = (msg) => new Notice(msg, 5000);
const log = (msg) => console.log(msg);
const BASE_API_URL = "https://openlibrary.org"
const SEARCH_API_URL = "http://openlibrary.org/search.json?";
const ISBN_API_URL = "https://openlibrary.org/isbn/";
const COVER_API_URL = "https://covers.openlibrary.org/b/id/";
const BOOK_API_URL = "https://openlibrary.org/api/books?";
const BOOK_URL = "https://openlibrary.org/books/";
const JUST_TITLE = false;
const ALL_AUTHORS = false;


const COVER_SIZE = "L";

module.exports = {
    entry: start,
    settings: {
        name: "Book Script",
        author: "Mocca101",
        options: {
            [COVER_SIZE]: {
                type: "text",
                defaultValue: "L",
                placeholder: "Set to 'L', 'M' or 'S'",
            },
        },
    },
};

let QuickAdd;
let Settings;


async function start(params, settings) {
    QuickAdd = params;
    Settings = settings;

    const query = await QuickAdd.quickAddApi.inputPrompt(
        "Enter Book title or Open Libary ID (Start with search with 'OL:'): "
    );
    if (!query) {
        notice("No query entered.");
        throw new Error("No query entered.");
    }

    let selectedBook;
    let olid;

    if(query.substring(0, 3).contains('OL:')) {
        olid = query.substring(3, query.length);
        selectedBook = await getInfoByOLID(olid);

        selectedBook = selectedBook[`OLID:${olid}`];
    } else {

        const results = await getByQuery(query);
        const choice = await QuickAdd.quickAddApi.suggester(
            results.map(formatTitleForSuggestion),
            results
        );
        if (!choice) {
            notice("No choice selected.");
            throw new Error("No choice selected.");
        }
        olid = choice.edition_key[0];

        selectedBook = await getInfoByOLID(olid);
        selectedBook = selectedBook[`OLID:${olid}`];


    }
    book = await getBookByOLID(olid);
    // log('Sel book:');
    // log(selectedBook);
    // log('Book: ')
    // log(book);


    const authors = mapAuthors(selectedBook.authors);
    const subjects = mapSubjects(selectedBook.subjects);
    const description = await getDesrciption(book.works[0].key, book);

    QuickAdd.variables = {
        ...selectedBook,
        authorLinks: Array.isArray(authors) ? linkifyList(authors) : authors,
        genreLinks: Array.isArray(subjects) ? linkifyList(subjects) : subjects,
        fileName: generateFilename(selectedBook, authors),
        coverLink: selectedBook.cover ? selectedBook.cover.large : 'Cover Missing',
        description: description,
        isbn: getIsbnFromResult(book),
    };
}

function generateFilename(selectedBook, authors) {
    let fn = 'Missing Title';

    if(JUST_TITLE) {
        fn = `${replaceIllegalFileNameCharactersInString(selectedBook.title)}`
    } else if (!ALL_AUTHORS) {
        fn = `${replaceIllegalFileNameCharactersInString(selectedBook.title)} - ${authors[0]}`
    } else {
        fn = `${replaceIllegalFileNameCharactersInString(selectedBook.title)} - ${authors.join(' - ')}`
    }

    return fn;
}

function formatTitleForSuggestion(resultItem) {
    isbn = getIsbnFromResult(resultItem);

    return `${resultItem.title ?  resultItem.title : 'Missing Title'} - ${resultItem.author_name ? resultItem.author_name : 'Missing Author'} \
    (${resultItem.publisher ? resultItem.publisher : 'Missing Publisher'}, \
    ${resultItem.publish_date ? resultItem.publish_date : 'Missing Publish date'})\
         \n ISBN: ${isbn}  -  Open Libary ID: ${resultItem.edition_key ? resultItem.edition_key[0] : 'Missing OL ID don\'t pick this' }`;
}

function getIsbnFromResult(resultItem) {
    return resultItem.isbn ? resultItem.isbn[0] :
        (
            resultItem.isbn_10 ? resultItem.isbn_10 :
            (
                resultItem.isbn_13 ? resultItem.isbn_13 : 'Missing'
            )
        );
}

function linkifyList(list) {
    if (list.length === 0) return "";
    if (list.length === 1) return `[[${list[0]}]]`;

    return list.map((item) => `[[${item.trim()}]]`).join(", ");
}

function mapAuthors(authors) {
    let mappedAuthors = 'Unknown';
    if (authors) {
        mappedAuthors = Array.from(new Set(authors.map(({name}) => name)));
    }
    return mappedAuthors
}

function mapSubjects(subjects) {
    let mappedSubjects = 'Unknown';
    if(subjects) {
        mappedSubjects = Array.from(new Set(subjects.map(({name}) => name)));
    }
    return mappedSubjects
}

function replaceIllegalFileNameCharactersInString(string) {
    return string.replace(/[\\,#%&\{\}\/*<>$\'\":@]*/g, "");
}

async function getByQuery(query) {
    const searchResults = await searchApiGet(SEARCH_API_URL, {
        q: query,
        limit: 15,
    });

    if (!searchResults.docs || !searchResults.docs.length) {
        notice("No results found.");
        throw new Error("No results found.");
    }

    return searchResults.docs;
}

var isValidIsbn = function(str) {

    // https://stackoverflow.com/questions/11104439/how-do-i-check-if-an-input-contains-an-isbn-using-javascript
    var sum,
        weight,
        digit,
        check,
        i;

    str = str.replace(/[^0-9X]/gi, '');

    if (str.length !== 10 && str.length !== 13) {
        return false;
    }

    if (str.length === 13) {
        sum = 0;
        for (i = 0; i < 12; i++) {
            digit = parseInt(str[i]);
            if (i % 2 === 1) {
                sum += 3*digit;
            } else {
                sum += digit;
            }
        }
        check = (10 - (sum % 10)) % 10;
        return (check === str[str.length-1]);
    }

    if (str.length === 10) {
        weight = 10;
        sum = 0;
        for (i = 0; i < 9; i++) {
            digit = parseInt(str[i]);
            sum += weight*digit;
            weight--;
        }
        check = (11 - (sum % 11)) % 11
        if (check === 10) {
            check = 'X';
        }
        return (check === str[str.length-1].toUpperCase());
    }
}

async function getInfoByOLID(OLID) {
    const res = await bibindexApiGet(BOOK_API_URL, {
        bibkeys: 'OLID:' + OLID,
        format: 'json'
    });

    if (!res) {
        notice("No results found.");
        throw new Error("No results found.");
    }

    return res;
}

async function getBookByOLID(OLID) {
    const res = await bookApiGet(BOOK_URL, OLID + '.json');

    if (!res) {
        notice("No results found.");
        throw new Error("No results found.");
    }

    return res;
}

async function getByISBN(isbn) {
    const res = await bibindexApiGet(BOOK_API_URL, {
        bibkeys: 'ISBN:' + isbn,
        format: 'json'
    });

    if (!res) {
        notice("No results found.");
        throw new Error("No results found.");
    }

    return res;
}

async function getDesrciption(key, book) {
    // console.log(`BaseUrls: ${BASE_API_URL} and key: ${key}`);

    let description = 'Missing';


    if(!book.description) {
        const res = await worksApiGet(BASE_API_URL, key + '.json');

        if (!res) {
            notice("No results found.");
            throw new Error("No results found.");
        }

        // log('Des res:')
        // log(res);


        if(res.description) {
            if(res.description.value) {
                description = res.description.value;
            } else {
                description = res.description;
            }
        }
    } else {
        description = book.description;
    }

    return description;
}

async function worksApiGet(url, key) {
    let finalURL = new URL(key, url);

    const res = await request({
        url: finalURL.href,
        method: "GET",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
        },
    });



    return JSON.parse(res);
}

async function bibindexApiGet(url, data) {
    let finalURL = new URL(url);

    if (data)
        Object.keys(data).forEach((key) =>
            finalURL.searchParams.append(key, data[key])
        );

    finalURL.searchParams.append('jscmd', 'data');

    const res = await request({
        url: finalURL.href,
        method: "GET",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return JSON.parse(res);
}

async function bookApiGet(url, OLid) {
    let finalURL = new URL(OLid, url);

    const res = await request({
        url: finalURL.href,
        method: "GET",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return JSON.parse(res);
}

async function searchApiGet(url, searchData) {
    let finalURL = new URL(url);
    if (searchData)
        Object.keys(searchData).forEach((key) =>
            finalURL.searchParams.append(key, searchData[key])
        );

    const res = await request({
        url: finalURL.href,
        method: "GET",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return JSON.parse(res);
}