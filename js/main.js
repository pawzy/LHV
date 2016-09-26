// used sources
// for noise words http://xpo6.com/list-of-english-stop-words/
// for names - random name generators

var hasNameFileBeenRead = false;
var hasNoiseWordsFileBeenRead = false;

var noisewords;
var names;
var originalNames;

$(function () {

    //these two checks exist so the file is read in and sorted only once during the session
    if (!hasNameFileBeenRead) {
        readNamesFromFile();
    }
    if (!hasNoiseWordsFileBeenRead) {
        readNoiseWordsFromFile();
    }

    //loads noisewords and names to page
    loadListToPage(".js-names-list ul", originalNames);
    loadListToPage(".js-noisewords-list ul", noisewords);

    //what happens when button is clicked
    $(".ja-submit-name").click(function () {
        $(".js-search-result").empty();
        var nameToCheck = $("#nameToCheck").val();

        //preserve the original name
        var originalName = nameToCheck;

        //remove possible commas from name and replace them with spaces, then removes possible double spaces.
        //this may sound unreasonable but it seems more reasonable than to run a check every time a comma is
        //removed to see if there is a space already there.
        nameToCheck = nameToCheck.replace(/\,/g, " ").replace(/\s+/g, " ");

        //transform the name to all-lowercase before putting parts of the name to alphabetical order
        //as uppercase words have different value from lowercase
        nameToCheck = nameToCheck.toLowerCase();

        //sets the subnames in alphabetical order so it matches the way the list of names is presented
        nameToCheck = nameToAlphabeticalOrder(nameToCheck);

        // remove noisewords from the name - this returns string without noise words
        //remove possible trailing and leading whitespaces as well
        nameToCheck = removeNoiseWordsFromName(nameToCheck, noisewords).trim();

        //at this point we are checking for an exact match using binary search
        var nameMatch = checkIfNameIsInList(nameToCheck, names);

        if (nameMatch === null) { //exact match was not found
            //this is the point where I realize that I should have handled names as objects if I want to
            //check if any combinations of the name contain exact match of the name
            //e.g. Osama Bin Laden -> Osama Bin, Osama Laden, Bin Laden
            //this could be done by running for cycle over all the names instead of expanding the
            //name to its subnames

            //maybe regex instead?
            //apparently works, may return false positives
            var possibleMatches = checkForPartialMatch(nameToCheck, names);
            if(possibleMatches.length == 0) {
                $(".js-search-result").append("Did not find any matches to <strong>" + originalName + "</strong>");
            } else {
                $(".js-search-result").append("Found possible matches to <strong>" + originalName + "</strong><br>");
                $(".js-search-result").append("Match could be <strong>" + possibleMatches.toString() + "</strong>");
            }
        } else {
            $(".js-search-result").append("Found exact match to <strong>" + originalName + "</strong><br>");
            $(".js-search-result").append("Match is <strong>" + nameMatch + "</strong>");
        }
    });
});

function checkForPartialMatch(name, names) {
    var possibleMatches = [];

    var nameParts = name.split(" ");
    var expression = "^([a-z]*\\s)*";
    for (var i = 0; i < nameParts.length; i++) {
        if (i == 0 && nameParts.length != 1) {
            expression += nameParts[i];
            expression += "(\\s[a-z]*)*";
        } else if (i == nameParts.length - 1) {
            expression += nameParts[i];
            expression += "(\\s[a-z]*)?$";
        }
    }

    var regex = new RegExp(expression, "gi");
    $.each(names, function (i, name) {
       if(regex.test(name)) {
           possibleMatches.push(name);
       }
    });

    return possibleMatches;
}

function checkIfNameIsInList(name, names) {
    var nameMatch = null;

    //binary search over names
    var first = 0;
    var last = names.length;
    var mid;

    var i = 0;
    while (first < last) {
        mid = Math.floor((first + last) / 2);
        if (name.localeCompare(names[mid].toLowerCase()) === -1) {
            last = mid;
        } else if (name.localeCompare(names[mid].toLowerCase()) === 1) {
            first = mid + 1;
        } else {
            nameMatch = names[mid];
            break;
        }
        i++;
    }
    return nameMatch;
}

function removeNoiseWordsFromName(name, noisewords) {
    //have to split up name according to spaces in between names to check for exact match between noise words
    //and parts of the name.
    var checkedName = name.split(" ");
    $.each(checkedName, function (i, namePart) {
        checkedName[i] = namePart;
    });

    $.each(noisewords, function (i, word) {
        //as at this point all noisewords are in lowercase by default we can skip lowercasing the noise word.
        while (checkedName.indexOf(word) != -1) {
            checkedName.splice(checkedName.indexOf(word), 1);
        }
    });
    return checkedName.join(" ");
}

function readNamesFromFile() {
    var commaSeparatedNames = readTextFile("data/namesToSearchFrom.txt");
    names = stringToArray(commaSeparatedNames);

    originalNames = names.sort();

    //sort individual names in alphabetical order (Osama Bin Laden -> Bin Laden Osama)
    names = namesToAlphabeticalOrder(names);

    //remove leading and trailing whitespaces
    names = trimWhiteSpacesFromNames(names);

    //sort array in alphabetical order
    names.sort();
}

function readNoiseWordsFromFile() {
    var commaSeparatedNoiseWords = readTextFile("data/noiseWords.txt");
    noisewords = stringToArray(commaSeparatedNoiseWords);
}

function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    var fileContent;
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                fileContent = rawFile.responseText;
            }
        }
    };
    rawFile.send(null);
    return fileContent;
}

function namesToAlphabeticalOrder(list) {
    var sortedNames = [];
    $.each(list, function (i, name) {
        sortedNames.push(nameToAlphabeticalOrder(name));
    });
    return sortedNames;
}

function nameToAlphabeticalOrder(name) {
    var separateNames = name.split(" ");
    separateNames.sort();
    sortedName = separateNames.join(" ");
    return sortedName;
}

function trimWhiteSpacesFromNames(names) {
    var trimmedNames = [];
    $.each(names, function (i, name) {
        trimmedNames.push(name.trim());
    });
    return trimmedNames;
}
function stringToArray(list) {
    list = list.split(",");
    return list;
}

function loadListToPage(element, list) {
    $.each(list, function (i, el) {
        $(element).append("<li>" + el + "</li>");
    });
}