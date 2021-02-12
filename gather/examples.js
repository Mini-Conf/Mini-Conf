const fs = require('fs')
const { execSync } = require('child_process');
const CFG = require("./config.json");
const gtUtils = require("./gtUtils.js");
const posterUtils = require("./posterRoom.js");
const hypermapUtils = require("./hyperRoom.js");


const UPLOAD_IMG = 0;
const BATCH_UPLOAD = 1;
const POSTER_SESSION = 2;
const POSTER_SESSION_WITH_POSTER_LIST = 3;
const ADD_POSTER_LISTS_TO_POSTER_SESSIONS = 4;
let exampleToRun = CFG.EXAMPLE_TO_RUN;
// Set to lower for faster testing. Max 25.
const MAX_TOWN = CFG.MAX_TOWN;


let imgUploadTest = async() => {
    console.log("Testing image upload");
    let myImg = await gtUtils.uploadImage("data/exampleImages/myImg0.png");
}

// Uploads local image files to Gather Town servers,
// Saves uploaded images addresses at data/exampleImages/allAddresses.json.
// Note that upload will fail if size of file is 5Mb or more.
let batchImgUploadTest = async() => {
    let myFilesNameDict = {
        0: "data/exampleImages/myImg0.png",
        1: "data/exampleImages/myImg1.jpg",
        2: "data/exampleImages/myImg2.png",
    };
    let posterAddressesFname = "data/exampleImages/allAddresses.json";
    let imgAddresses = {};
    await gtUtils.uploadImageBatch(myFilesNameDict, imgAddresses).then(res => {imgAddresses = res; console.log(imgAddresses)});
    gtUtils.writeJson(imgAddresses, posterAddressesFname);
}

// Example of a poster session with MAX_TOWN poster rooms.
let buildPosterSession = async (withPosterList) => {
    // This file will contains the base room urls for the towns and hypermap.
    const posterTownUrlFname = CFG.POSTER_TOWN_URLS_FNAME;
    //const posterTownUrlFname = "data/posterTownUrls.json";
    let postersDataFname = "data/postersData.json";
    let postersJsonAllTowns = gtUtils.readJson(postersDataFname);
    // Load or prepare to save poster town urls.
    let posterTownsUrls = {};
    if (fs.existsSync(CFG.POSTER_TOWN_URLS_FNAME)) {
        posterTownsUrls = gtUtils.readJson(CFG.POSTER_TOWN_URLS_FNAME);
        console.log("Loading town urls from " + CFG.POSTER_TOWN_URLS_FNAME);
    }
    // Hyper room
    let newRoom = "hyperMap" in posterTownsUrls ? posterTownsUrls.hyperMap.url : await gtUtils.createHyperRoom('sessionHub');
    let newHyperRoomSpaceMap = {
        url:  newRoom,
        map: 'neurips-hypermapcustom-entrance',
    };
    posterTownsUrls["hyperMap"] = {
        url: newRoom,
    };
    console.log(newRoom);
    // Create poster rooms.
    // Note: this could be made a lot more asynchronous, ran into
    // issues when trying to do too many rooms at once.
    let allPosterRooms = [];
    for (let iTown = 0; iTown < MAX_TOWN; iTown++) {
        let postersJson = {};
        let posterRoomName = '';
        let townCoordinates = gtUtils.getLabels(iTown, 5);
        // Exctracts posters that are in that specific room
        for (let iPoster in postersJsonAllTowns) {
            let poster = postersJsonAllTowns[iPoster];
            if (poster.town == iTown) {
                postersJson[iPoster] = poster;
                posterRoomName = poster.townName;
            }
        }
        let fullPosterRoomName = townCoordinates + ": " + posterRoomName;
        let initPosterRoom = iTown in posterTownsUrls ? posterTownsUrls[iTown].url : null;
        let newPosterRoom = await posterUtils.writeMap('posterRoom' + townCoordinates,  postersJson, fullPosterRoomName, initPosterRoom);
        posterTownsUrls[iTown] = {
            url: newPosterRoom,
            coordinates: townCoordinates,
        };
        let posterInfo = {
            spaceMap: {
                url: newPosterRoom,
                map: 'custom-entrance',
            },
            name: posterRoomName,
        }
        allPosterRooms.push(posterInfo);
        // Updates poster info with spawn Urls
        for (let iPoster in postersJson) {
            let poster = postersJson[iPoster];
            poster.townCoord = townCoordinates;
            poster.posterCoord = gtUtils.getLabels(poster.index, 4);
            poster.spawnUrl = posterUtils.getSpawnLink(poster.index, newPosterRoom);
        }
    }
    gtUtils.writeJson(posterTownsUrls, posterTownUrlFname);
    gtUtils.writeJson(postersJsonAllTowns, CFG.POSTER_JSON_FILLED_FNAME);
    await hypermapUtils.connectAllRooms(newHyperRoomSpaceMap, allPosterRooms);
    if (withPosterList) addAllPosterLists(posterTownsUrls, true);
}


// Set populateGSheets to true if needing to populate the sheets.
// Otherwise, script will copy the sheets addresses that were already saved.
let addAllPosterLists = async (posterTownsUrls, populateGSheets) => {
    if (populateGSheets != null) {
        // Creates the Google sheets for the sessions
        let myGsheetCmd = 'python posterList.py';
        console.log("Creating or updating Google sheets with poster lists");
        const stdout = execSync(myGsheetCmd);
        console.log(stdout.toString('utf-8'));
    }
    // Adds the poster lists to the sessions
    let gsheetsUrls = gtUtils.readJson(CFG.POSTER_LIST_GSHEET_FNAME);
    // This iSession is useless if doing a single poster session.
    let iSession = 0;
    for (let iTown = 0; iTown < MAX_TOWN; iTown++) {
        let posterTownUrl = posterTownsUrls[iTown];
        let gsheetUrlBase = gsheetsUrls[iSession + posterTownUrl.coordinates];
        console.log("List for " + posterTownUrl.coordinates + ": " + gsheetUrlBase);
        let spaceMap = {
            url: posterTownUrl.url,
            map: 'custom-entrance',
        };
        let gsheetEmbedUrl = 'https://docs.google.com/spreadsheets/d/' + gsheetUrlBase + '/edit?usp=sharing';
        posterUtils.addPosterLists(spaceMap, gsheetEmbedUrl);
    }
};


switch (exampleToRun) {
    case UPLOAD_IMG:
        imgUploadTest();
        break;
    case BATCH_UPLOAD:
        batchImgUploadTest();
        break;
    case POSTER_SESSION:
        buildPosterSession(false);
        break;
    case POSTER_SESSION_WITH_POSTER_LIST:
        buildPosterSession(true);
        break;
    case ADD_POSTER_LISTS_TO_POSTER_SESSIONS:
        let posterTownsUrls = gtUtils.readJson(CFG.POSTER_TOWN_URLS_FNAME);
        addAllPosterLists(posterTownsUrls);
        break;
}
