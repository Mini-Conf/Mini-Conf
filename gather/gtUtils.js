const { createCanvas } = require('canvas');
const { exec } = require("child_process");
const CFG = require("./config.json");
const fs = require("fs");
const fsp = require('fs').promises;
const axios = require("axios");
// Some online image that can be used as placeholder in a poster when building a town. It's an icon for a zoom call.
const DEFAULT_IMAGE = "https://cdn.gather.town/v0/b/gather-town.appspot.com/o/assets%2Fb2c9fbf1-4fc1-4b59-9ef1-e3de6b69981f?alt=media&token=cb74684a-3c6e-4260-b51c-c917e078124d";


// Opens json file and loads it into js object.
// Usage: myObj = exports.readJson("myFile.json")
exports.readJson = function(inFname){
  let rawSessionData = fs.readFileSync(inFname);
  let data = JSON.parse(rawSessionData);
  return data;
};

// Saves json object into file.
// Usage: exports.writeJson(myObj, "myFile.json")
exports.writeJson = function (jsonObject, outFname) {
  let data = JSON.stringify(jsonObject, null, 2)
  console.log("Saving to " + outFname);
  fs.writeFileSync(outFname, data);
};


// Updates config file with user owned space id.
// Creates a blank space and returns its space Id, and updates the placeholder in the config file with that space id.
// This is done because uploading image in gather town requires to associate the uploaded image to a space id.
// Usage: exports.getMySpace();
let getMySpace = async () => {
		let blankRoom = await exports.createBlankRoom("blankRoom");
		let mySpace = blankRoom.replace('/', '\\');
		console.log("Updating CFG.SPACE_ID in config.json to " + mySpace.replace('\\', '\\\\') + ". You can replace with other id of a space you own, with the double backslashes.");
		// Update config file
		CFG.SPACE_ID = mySpace;
		exports.writeJson(CFG, "config.json");
		return mySpace;
}


// Upload image as a bytes buffer to Gather Town.
// Used in textImageURL below to upload text as an image to Gather Town.
exports.uploadBytes = async function(bytesBuffer) {
	let mySpace = CFG.SPACE_ID == "null" ? await getMySpace() : CFG.SPACE_ID;
    let res = await axios.post("https://staging.gather.town/api/uploadImage",
        {
            bytes: bytesBuffer,
            spaceId: mySpace,
        },
        { maxContentLength: Infinity, maxBodyLength: Infinity }
    );
    let resUrl = res.data;
    console.log(resUrl);
    return resUrl;
};


// Uploads image file to gather town.
// Usage: myUrl = exports.uploadImage("myFile.png")
// If upload failed, will return the URL of some default image
exports.uploadImage = async function(inFname) {
	let mySpace = CFG.SPACE_ID == "null" ? await getMySpace() : CFG.SPACE_ID;
    let defaultImage = DEFAULT_IMAGE;
    let data = {};
    try {
        data = await fsp.readFile(inFname, async function (err, data) {
            if (err) {
                reject(err); // Fail if the file can't be read.
            }
        });
    } catch {
        console.log("Error reading " + inFname);
        return defaultImage;
    }
    let posterPath = await axios
        .post(
            "https://gather.town/api/uploadImage",
            {
                bytes: data,
                spaceId: mySpace,
            },
            { maxContentLength: Infinity, maxBodyLength: Infinity }
        )
        .then((res) => {
            console.log(inFname + " successfully uploaded");
            console.log(res.data);
            return res.data;
        })
        .catch((err) => {console.log("Error uploading " + inFname);
            return defaultImage});
    return posterPath;
};


// Uploads a batch of images and returns a dictionary containing the resulting URLs, keyed
// on the keys in the input dictionary.
// Input dictionary should be keyed some keys (e.g. poster id keys), with values being poster filenames.
// Current version is uploading synchronously to minimize upload failures.
// If not uploading too many, you can uncomment the async version and comment out the "await" one.
exports.uploadImageBatch = async function(filenameDict, outputDict) {
    if (outputDict == null) outputDict = {};
    for (let imgKey in filenameDict) {
        let inFname = filenameDict[imgKey];
        if (! (imgKey in outputDict)) {
            outputDict[imgKey] = DEFAULT_IMAGE;
        }
        let attemptUpload = outputDict[imgKey] == DEFAULT_IMAGE;
        if (attemptUpload) {
            // If too many failures with async upload, sequential version with await:
            await exports.uploadImage(inFname).then((res) => {outputDict[imgKey] = res});
            //exports.uploadImage(inFname).then((res) => {outputDict[imgKey] = res});
        }
    }
    return outputDict;
};


// Creates a canvas with a text, and uploads it to Gather Town.
// You can choose fontsize, width, color, and highlight color.
// Default color: white.
// You can also experiment with more fonts, types of highlights, etc inside the function; this was just
// a set up that worked ok for our use.
// You can look at the files locally by setting testLocal to true within the function;
// once you are happy with it, setting to false reverts to uploading to Gather Town.
exports.textImageURL = async function(text, assetFontsize, totalWidth, color, highlightColor){
    let myColor = color == null ? "white" : color;
    let hasHighlight = highlightColor != null;
    let trimWidth = (totalWidth == -1);
    let width = 370;
    if (! (trimWidth)) {
        width = totalWidth;
    };
    let height = 50;
    let canvas = createCanvas(width, height);
    let ctx = canvas.getContext('2d');

    // Font
    let txtFont = 'bold ' + assetFontsize + 'pt Helvetica'
    ctx.font = txtFont;

    let textWidth = ctx.measureText(text).width;
    let textWidthGauge = ctx.measureText("Text").width;
    ctx.canvas.width = textWidth;
    if (! (trimWidth)) {
        ctx.canvas.width = totalWidth
    }
    ctx.canvas.height = textWidthGauge;
    ctx.font = txtFont;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = myColor;
    if (hasHighlight) {
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = highlightColor;
    }
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    let buffer = canvas.toBuffer('image/png')

    let testLocal = false;
    if (testLocal) {
        // Local version to test image creation and tweak appearance:
        fs.writeFileSync('./image.png', buffer)
        exec("open ./image.png");
        return;
    }

    // API version uploads to Gather Town.
    let res = {
        url: await exports.uploadBytes(buffer),
        width: parseInt(1 + ctx.canvas.width/32),
    }
    return res
};


// MAP FUNCTIONS
// Pulls map object for a given space id and map id.
exports.pullMap = async (spaceId, map_id) => {
    let res = await axios.get("https://gather.town/api/getMap?apiKey=" + CFG.API_KEY +  "&spaceId=" + spaceId + "&mapId=" + map_id);
    output = res.data;
    return output;
};


// Pulls map object for a space id and map id entered as an object with two fields:
// 'url': the end of the map url, i.e., same as the space id but with / instead of \,
// and 'map', the id of the map.
// Usage: exports.pullMapSpaceMap({ url: 'xxpoiqpoi/myBeautifulSpaceName', map: 'custom-entrance'})
exports.pullMapSpaceMap = async (spaceMap) => {
    let spaceId = spaceMap.url.replace('/', '\\');
    return exports.pullMap(spaceId, spaceMap.map);
}


// Sets a given target map to a map object.
// spaceMapId: object with 'url' and 'map' fields:
// 'url': the end of the map url, i.e., same as the space id but with / instead of \,
// and 'map', the id of the map.
// mapContent: object containing the map to inject, e.g. obtained by calling exports.pullMap.
exports.setMap = async function(spaceMapId, mapContent) {
    let spaceId = spaceMapId.url.replace('/', '\\');
    let res = await axios.post("https://gather.town/api/setMap", {
        apiKey: CFG.API_KEY,
        spaceId: spaceId,
        mapId: spaceMapId.map,
        mapContent: mapContent
    });
    console.log('Set map:\n' + CFG.URLBASE + spaceMapId.url);
    return res;
}


// Copies a map that can be accessed by one API key, to a new space that can be access by another API key.
// This is useful in particular when dealing with SSO, for which each SSO space needs its own key.
// townShortUrl: end of the URL of the space (same as the 'url' field of a spaceMap object in
// setMap or pullMapSpaceMap).
// newTownName: custom name that the newly created space will finish with.
exports.copyMap = async function(townShortUrl, mapId, sourceApiKey, targetApiKey, newTownName) {
    let spaceId = townShortUrl.replace('/', '\\');
    // Extract source map data
    let res1 = await axios.get("https://gather.town/api/getMap?apiKey=" + sourceApiKey +  "&spaceId=" + spaceId + "&mapId=" + mapId);
    let mapData = res1.data;
    console.log(mapData.id);
    // Create new blank map to receive the map
    // Using "custom-entrance" in case original map is not public.
    let mapName = 'custom-entrance';
    // Set id, as API setMap used to not set the id to the chosen mapId.
    mapData.id = mapName;
	console.log(mapId, mapName);
    console.log(mapData.id);
    let roomUrl = await axios
        .post("https://gather.town/api/createRoom",
            { apiKey : targetApiKey,
                name: newTownName,
                map: mapName,
            })
        .then(response => {return response.data});
    // Set map
    let newSpaceId = roomUrl.replace('/', '\\');
    await axios.post("https://gather.town/api/setMap", {
        apiKey: targetApiKey,
        spaceId: newSpaceId,
        mapId: mapName,
        mapContent: mapData,
    });
    console.log('View your copied map at:\n' + 'https://gather.town/app/' + roomUrl);
    return roomUrl;
}


// Copies a map to a new one, with the default API key (in the config file).
// townShortUrl: end of the URL of the space (same as the 'url' field of a spaceMap object in
// setMap or pullMapSpaceMap).
// newTownName: custom name that the newly created space will finish with.
exports.copyMapSingle = async function(townShortUrl, mapId, newTownName) {
    let spaceId = townShortUrl.replace('/', '\\');
    let mapData = await exports.pullMap(spaceId, mapId);
    let newMapId = 'custom-entrance';
    mapData.id = newMapId;
    let newRoom = await exports.createBlankRoom(newTownName);
    let spaceMap = {
        url: newRoom,
        map: newMapId,
    }
    await exports.setMap(spaceMap, mapData);
}


// Removes all portals from a map defined by an object that contains two fields:
// 'url': the end of the map url, i.e., same as the space id but with / instead of \,
// and 'map', the id of the map.
exports.wipePortals = async(spaceMapId) => {
    let spaceId = spaceMapId.url.replace('/', '\\');
    let mapObj = await exports.pullMap(spaceId, spaceMapId.map);
    mapObj.portals = [];
    axios.post("https://gather.town/api/setMap", {
        apiKey: CFG.API_KEY,
        spaceId: spaceId,
        mapId: spaceMapId.map,
        mapContent: mapObj,
    });
    console.log(CFG.URLBASE + spaceMapId.url + " has no more portals.");
}


// Removes all objects from a map defined by an object that contains two fields:
// 'url': the end of the map url, i.e., same as the space id but with / instead of \,
// and 'map', the id of the map.
exports.wipeObjects = async(spaceMapId) => {
    let spaceId = spaceMapId.url.replace('/', '\\');
    let mapObj = await exports.pullMap(spaceId, spaceMapId.map);
    mapObj.objects = [];
    axios.post("https://gather.town/api/setMap", {
        apiKey: CFG.API_KEY,
        spaceId: spaceId,
        mapId: spaceMapId.map,
        mapContent: mapObj,
    });
    console.log(CFG.URLBASE + spaceMapId.url + " has no more objects.");
}


// Sets all the squares in a map object in the rectangle defined by
// a range of x and y coordinates to 0 (not impassable) or 1 (impassable).
// Returns the resulting map objects.
// Used in connectSingleRoomMap in hyperRoom.js.
exports.setImpassable = (mapData, xMapRange, yMapRange, oneOrZero) => {
    let collisions = mapData.collisions;
    let collisionBytes = new Buffer(collisions, 'base64');
    let collisionValue = oneOrZero == 1 ? 0x01 : 0x00;
    // X, then Y
    let mapXY = mapData.dimensions;
    for (let x = xMapRange[0]; x <= xMapRange[1]; x++) {
        for (let y = yMapRange[0]; y <= yMapRange[1]; y++) {
            let byteIndex = mapXY[0]*y + x;
            collisionBytes[byteIndex] = collisionValue;
        }
    }
    mapData.collisions = collisionBytes.toString("base64");
    return mapData;
}


// Sets all the squares in the rectangle defined by
// a range of x and y coordinates to 0 (not impassable) or 1 (impassable), but also pulls and sets the map.
// Map is defined by an object that contains two fields:
// 'url': the end of the map url, i.e., same as the space id but with / instead of \,
// and 'map', the id of the map.
exports.setImpassableSpacemap = async (spaceMap, xMapRange, yMapRange, oneOrZero) => {
    let mapData = await exports.pullMapSpaceMap(spaceMap);
    mapData = exports.setImpassable(mapData, xMapRange, yMapRange, oneOrZero);
    exports.setMap(spaceMap, mapData);
};


// Creates a room based on a given public map,
// for example 'custom-entrance' for a blank map,
// 'neuripscustom-entrance' for a template poster room
// as used in the poster session at neurips 2020,
// 'neurips-hypermapcustom-entrance' for a hyperroom as used
// in the poster session at neurips 2020.
exports.createRoomFromMap = async (roomName, mapName) => {
    let roomUrl = await axios
        .post("https://gather.town/api/createRoom",
            { apiKey : CFG.API_KEY,
                name: roomName,
                map: mapName,
            })
        .then(response => {return response.data});
    console.log("Visit your new room at:\n" + CFG.URLBASE + roomUrl);
    return roomUrl;
};


exports.createPosterRoom = async (roomName) => {
    return exports.createRoomFromMap(roomName, 'neuripscustom-entrance');
}


exports.createHyperRoom = async(roomName) => {
    return exports.createRoomFromMap(roomName, 'neurips-hypermapcustom-entrance');
}


exports.createBlankRoom = async(roomName) => {
    return exports.createRoomFromMap(roomName, 'custom-entrance');
}


// Adds proportional portals from a line in an origin map,
// to another line in a target map.
// Useful to create wide doors / use an entire wall as portal
// without creating congestions.
// If url is empty, encode as same space portal.
// targetMapAndUrlRoot: object with fields map and url,
// same as in pullMapSpaceMap.
// This updates the source map to contain the portals,
// but does not return it or sets it through the API.
exports.addPortalsProportional = function(sourceMap, xRange, yRange, targetMapAndUrlRoot, xSpawnRange, ySpawnRange){
    let urlBase = CFG.URLBASE;
    let targetMap = targetMapAndUrlRoot.map;
    let targetUrlRoot = targetMapAndUrlRoot.url;
    let sameSpace = targetUrlRoot == '';
    // if portals exist, update instead of adding
    for (let x = xRange[0]; x <= xRange[1]; x++) {
        let xFrac = xRange[1] == xRange[0]? 1 :(x - xRange[0])/(xRange[1] - xRange[0]);
        for (let y = yRange[0]; y <= yRange[1]; y++) {
            let yFrac = yRange[1] == yRange[0]? 1 :(y - yRange[0])/(yRange[1] - yRange[0]);
            let isnew = true;
            let iFrac = Math.min(xFrac, yFrac);
            let xySpawn = [xSpawnRange[0] + parseInt(iFrac*(xSpawnRange[1] - xSpawnRange[0])),
                ySpawnRange[0] + parseInt(iFrac*(ySpawnRange[1] - ySpawnRange[0]))];
            targetUrl= sameSpace? '' : urlBase + targetUrlRoot + "?spawnx=" + xySpawn[0] + "&spawny=" + xySpawn[1] + "&map="+targetMap;
            let newPortal = {
                x:x,
                y:y,
                targetUrl: targetUrl,
                targetMap: targetMap,
                targetX: xySpawn[0],
                targetY: xySpawn[1],
            };

            sourceMap.portals.forEach(portal =>{
                if ((portal.x == x) && (portal.y == y)) {
                    isnew = false;
                    portal.targetUrl = newPortal.targetUrl;
                    portal.sourceMap = newPortal.sourceMap;
                    portal.targetX = newPortal.targetX;
                    portal.targetY = newPortal.targetY;
                }});
            if (isnew) sourceMap.portals.push(newPortal);
}}}


// Same as above but with the name of the map in the
// arguments, to see if the portals are in the same space
// or not. Returns the updated map.
exports.addPortalsFromSpaceMapId = function(spaceMapId, xRange, yRange, mapContent, portalMapAndUrlRoot, xSpawnRange, ySpawnRange){
    // Make internal portal if same URL;
    let sameUrl = spaceMapId.url == portalMapAndUrlRoot.url
    let newPortalMapAndUrlRoot = {
        url: sameUrl? '' : portalMapAndUrlRoot.url,
        map: portalMapAndUrlRoot.map,
    }
    let spaceId = spaceMapId.url.replace('/','\\');
    let mapId = spaceMapId.map;
    exports.addPortalsProportional(mapContent, xRange, yRange, newPortalMapAndUrlRoot, xSpawnRange, ySpawnRange);
    return mapContent;
}


// Adds portals on both sides between two spaces, so
// that people can return to a map the way they came.
exports.addPortalsReciprocal = function(spaceMap, xRange, yRange, mapContent1, spaceMap2, xRange2, yRange2, mapContent2) {
    mapContent1 = exports.addPortalsFromSpaceMapId(spaceMap, xRange, yRange, mapContent1, spaceMap2, xRange2, yRange2);
    mapContent2 = exports.addPortalsFromSpaceMapId(spaceMap2, xRange2, yRange2, mapContent2, spaceMap, xRange, yRange);
    return [mapContent1, mapContent2];

}


// Adds the objects in an object array to a map object.
exports.addObjectsToMap = (mapContent, newObjects) => {
    newObjects.forEach(obj => mapContent.objects.push(obj));
    return mapContent;
};


// Creates and returns a text object at coordinates x,y.
// If urlObjOpt is specified, that url is used for the text
// rather than uploading a new text image to Gather Town.
exports.textObject = async(x, y, text, fontSize, textColor, urlObjOpt) => {
    let color = textColor == null ? "black" : textColor;
    let myFontSize = fontSize == null ? 20 : fontSize;
    let urlObj = urlObjOpt == null ? await exports.textImageURL(text, myFontSize, -1, color) : urlObjOpt;
    let newObj = {
        normal: urlObj.url,
        width: urlObj.width,
        height: 1,
        type: 0,
        x: x,
        y: y,
    };
    return newObj;
};


// Creates a link object at coordinates x, y, which will show
// up on a map with text linkText and allow people to interact
// with url linkUrl when walking over that object and pressing x.
// You can probably make it a lot prettier than what I did,
// with canvas effects etc.
exports.linkObject = async(x, y, linkUrl, linkText, fontSize, linkColor, highlightColor) => {
    let color = linkColor == null ? "black" : linkColor;
    let myFontSize = fontSize == null ? 20 : fontSize;
    let myHighlightColor = highlightColor == null ? "white" : highlightColor;
    let urlNoShadowObj = await exports.textImageURL(linkText, myFontSize, -1, color)
    let urlShadowObj = await exports.textImageURL(linkText, myFontSize, -1, color, myHighlightColor);
    let newObj = {
        normal: urlNoShadowObj.url,
        highlighted: urlShadowObj.url,
        width: urlShadowObj.width,
        height: 1,
        type: 1,
        scale: 1,
        properties: {
            url: linkUrl,
        },
        x: x,
        y: y,
    };
    return newObj;
}


// Turns a coordinates label (e.g., A8)
// and a number of rows (e.g., 4) into an
// index (e.g., 33)
exports.getIndex = function(label, nrows) {
  // Filling row by row, max 5 rows
  let rows = ['A', 'B', 'C', 'D', 'E'];
  let col = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] == label[0]) col = i;
  }
  res = label[1]*nrows + col
  return res
};


// Turns an index (e.g., 33) and a number of rows (e.g., 4)
// into a label (e.g., A8).
exports.getLabels = function(i, nrows) {
    // Filling row by row, max 5 rows
    // Poster rooms have 4 rows.
    // Hyperrooms have 5 rows.
    let rows = ['A', 'B', 'C', 'D', 'E'];
    let currRow = rows[i % nrows];
    let currCol = parseInt(i / nrows);
    return currRow + currCol;
};
