// This file was modified from https://github.com/gathertown/api-examples
const axios = require("axios");
const gtUtils = require("./gtUtils.js");
const CFG = require("./config.json");
const MAP_ID = "custom-entrance";
const WIDTH = 94;
const HEIGHT = 57;
const zoomZoneImg =
	"https://cdn.gather.town/v0/b/gather-town.appspot.com/o/assets%2Fb2c9fbf1-4fc1-4b59-9ef1-e3de6b69981f?alt=media&token=cb74684a-3c6e-4260-b51c-c917e078124d";
const zoomZoneImgActive =
	"https://cdn.gather.town/v0/b/gather-town.appspot.com/o/assets%2F8933cfdc-d180-4324-b8ba-5a191dfdb6dc?alt=media&token=4711da59-bf68-4c22-a53e-96944b4204c7";
const mapImg =
"https://cdn.gather.town/v0/b/gather-town.appspot.com/o/assets%2Ff34f6bf2-3bf9-4d95-9fe5-280e5da132a0?alt=media&token=9bc3f3c3-b691-4688-b633-2b0082e3f014";
const mapImgActive =
"https://cdn.gather.town/v0/b/gather-town.appspot.com/o/assets%2Fbd842123-b038-4cf9-8e73-0fe335d56f0f?alt=media&token=86879c6d-2625-4379-8f23-6af0b22487d7";
// Spawns
const spawnInspo = gtUtils.readJson("jsonFiles/spawnsExample.json");


// Local spawn to spawn into area of poster iPoster
exports.getSpawnLink = function(iPoster, townUrl) {
  let baseUrl = CFG.URLBASE + townUrl ;
  let spawnX = parseInt(iPoster / 4) * 13 + 7;
  let spawnY = (iPoster % 4) * 13 + 9;
  return baseUrl + "?spawnx=" + spawnX + "&spawny=" + spawnY + "&map=" + MAP_ID;
}


// Creates poster object and private spaces
// for one poster, based on json spec.
// Used in writeMap.
let posterObject = async (posterJson) => {
    let index = posterJson.index;
    let posterImg = posterJson.posterImgUrl;
    // If using a lower-res preview, update posterJson and line below
    let posterImgPreview = posterJson.posterImgUrl;
    const topleft = {
        x: parseInt(index / 4) * 13 + 3,
        y: (index % 4) * 13 + 4,
    };
    let newPoster = {
        x: topleft.x,
        y: topleft.y,
        type: 2,
        distThreshold: 1,
        width: 10,
        height: 8,
        normal: mapImg,
        highlighted: mapImgActive,
        properties: {
            image: posterImg,
            preview: posterImgPreview,
        },
    };
    // TODO: do this a single time? or comment to note this can be done only once.
    // This labels posterboards with a letter + number coordinate -- substitute newLabel with other text if desired
    let newLabel = gtUtils.getLabels(index, 4);
    let xLabel = topleft.x + 3.3;
    let yLabel = topleft.y + 2.7;
    let labelObject = await gtUtils.textObject(xLabel, yLabel, newLabel, 20, "black");

    // Adding zoom area
    let zoomObject = {
        x: topleft.x,
        y: topleft.y + 8,
        type: 4,
        width: 10,
        height: 2,
        distThreshold: 0,
        previewMessage: "press x for Zoom",
        properties: {
            zoomLink: posterJson.zoom,
        },
        normal: zoomZoneImg,
        highlighted: zoomZoneImgActive,
    };
    let privateSpaces = [];
    for (let x = topleft.x; x < topleft.x + 10; x++) {
        for (let y = topleft.y; y < topleft.y + 8; y++) {
            privateSpaces.push({ x, y, spaceId: "p" + index });
        }
    }
    // zoom private space
    for (let x = topleft.x; x < topleft.x + 10; x++) {
        for (let y = topleft.y + 8; y < topleft.y + 10; y++) {
            privateSpaces.push({ x, y, spaceId: "z" + index });
        }
    }

    let mapPoster = {
        objects: [newPoster, labelObject, zoomObject],
        privateSpaces: privateSpaces,
    };
    return mapPoster;
};




// Takes json with poster data, and generates the map from it.
exports.writeMap = async (roomUrlBase, postersJson, posterRoomName, roomShortUrl) => {
    let base_map = {
        id: MAP_ID,
        backgroundImagePath:
        "https://cdn.gather.town/v0/b/gather-town.appspot.com/o/maps%2F8225d335-2e81-4264-a94f-5be4e31b5f63?alt=media&token=0d6c2671-1a65-4e2d-83f5-46da93acb82b",
        dimensions: [WIDTH, HEIGHT],
        // generally, adding many more than one is good practice so people don't all stack up in the same place
        spawns: spawnInspo,
        objects: [], // add random plants and whatever else here
        // portals will be added by connecting poster rooms to one another and to hyperrooms
    };
    let impassable = {}; // maps r,c to true if impassable
    let posters = [];
    let privateSpaces = [];

    // create blank room if roomShortUrl is null
    let newRoom = roomShortUrl == null ? await gtUtils.createBlankRoom(roomUrlBase) : roomShortUrl;
    //let newRoom = await gtUtils.createBlankRoom(roomUrlBase);
    let newSpace = newRoom.replace('/','\\');


    for (let index in postersJson) {
        let posterJson = postersJson[index];
        let posterObj = await posterObject(posterJson);
        posters = posters.concat(posterObj.objects);
        privateSpaces = privateSpaces.concat(posterObj.privateSpaces);
    }

    // generate impassable bytemask
    let collBytes = [];
    for (let r = 0; r < HEIGHT; r++) {
        for (let c = 0; c < WIDTH; c++) {
            // edges are just definitely impassable
            if (r < 2 || r > HEIGHT - 3 || c < 1 || c > WIDTH - 2)
                collBytes.push(0x01);
            // otherwise see if it's marked or not
            // edit impassable map to mark more impassable tiles
            else collBytes.push(impassable[[r, c]] ? 0x01 : 0x00);
        }
    }

    // Optional floor markers:
    // Name of room, tutorial video, poster list
    let posterRoomNameUrlObj = await gtUtils.textImageURL(posterRoomName, 36, -1, "teal");
    // To pick x,y coordinates: visit
    // [ssodomain.]gather.town/old/mapmaker/[newroom]
    let posterRoomNameObj = await gtUtils.textObject(24, 26.5, null, null, null, posterRoomNameUrlObj);
    posters.push(posterRoomNameObj);
    let posterRoomNameObj1 = await gtUtils.textObject(55, 26.5, null, null, null, posterRoomNameUrlObj);
    posters.push(posterRoomNameObj1);

    // Add tutorial video
    let tutorialObj = await gtUtils.linkObject(11, 14.5, CFG.TUTORIALVID_URL, "Press x while walking here for poster room interaction tutorial", 24, "aquamarine", "white");
    posters.push(tutorialObj);

    // Write map
    await axios.post("https://gather.town/api/setMap", {
        apiKey: CFG.API_KEY,
        spaceId: newSpace,
        mapId: MAP_ID,
        mapContent: Object.assign(base_map, {
            objects: base_map.objects.concat(posters),
            spaces: privateSpaces,
            collisions: new Buffer(collBytes).toString("base64"),
            // ^ base64 encoded array of dimensions[1] x dimensions[0] bytes (each either 0x00 or 0x01)
        }),
    });
    console.log("See your room at:\n" + CFG.URLBASE + newRoom);
    return newRoom;
};


// Adds url objects of poster lists as interactable object on the floor of the map.
exports.addPosterLists = async (spaceMap, posterListUrl) => {
    // Add poster list
    let posterListObj = await gtUtils.linkObject(11, 38.5, posterListUrl, "Poster List", 24, "aquamarine", "white");
    let posterListObj2 = await gtUtils.linkObject(50, 38.5, posterListUrl, "Poster List", 24, "aquamarine", "white");
    let mapData = await gtUtils.pullMapSpaceMap(spaceMap);
    mapData.objects.push(posterListObj);
    mapData.objects.push(posterListObj2);
    gtUtils.setMap(spaceMap, mapData)
};
