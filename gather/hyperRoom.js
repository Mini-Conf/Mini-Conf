const axios = require("axios");
const gtUtils = require("./gtUtils.js");
const CFG = require("./config.json");


// Gets map coordinates for poster house located
// at col and row coordinates; for example,
// getCoord(0,0) will give the coordinates of the top left poster house.
// col, row starting from 0.
// Used in portalsSingleRoom.
let getCoord = function(col, row) {
  let xBoundaries = [col*28 + 20, col*28 + 31];
  let yBoundaries = [row*16 + 8, row*16 + 15];
  let finalCoord = [];
  for (let x = xBoundaries[0]; x <= xBoundaries[1]; x++){
    for (let y = yBoundaries[0]; y <= yBoundaries[1]; y++){
      finalCoord.push([x,y]);
    }
  }
  return finalCoord;
}


// Gets the x,y ranges delimiting a rectangle for a poster house
// at coordinates col, row.
// Used in connectSingleRoomMap.
let getCoordRange = function(col, row) {
    let boundaries = {
        x: [col*28 + 20, col*28 + 31],
        y: [row*16 + 8, row*16 + 15],
    };
    return boundaries;
}


// Returns array of portals into a target room, for a given poster room.
// This style of creating portal does not specify a precise spawn point,
// instead the avatar gets spawned at the last spot it was seen for that space.
// The examples in this repo do not use this style of portal, instead
// creates proportional portals over the whole perimeter of the poster house.
let portalsSingleRoom = function(xMap, yMap, targetRoomURL) {
  let portalCoords = getCoord(xMap, yMap);
  let portals = [];
  portalCoords.forEach(function(item){
    let currPortal = {
      targetY: null,
        targetX: null,
        x: item[0],
        y: item[1],
        targetMap: '',
        targetUrl: targetRoomURL,
    }
    portals.push(currPortal);
  });
  return portals;
}

// Connects a hyper room to a poster room.
// posterRoomInfo:
// - spaceMapId
// - room title
let connectSingleRoomMap = async (hyperRoomSpaceMap, posterRoomBuildingIndex, posterRoomInfo, mapData) => {
    let nrowsHypermap = 5;
    let posterRoomBuildingLabel = gtUtils.getLabels(posterRoomBuildingIndex, nrowsHypermap);
    let xMap = parseInt(posterRoomBuildingIndex / nrowsHypermap);
    let yMap = posterRoomBuildingIndex % nrowsHypermap;
    let posterRoomHouseCoord = getCoordRange(xMap, yMap);
    let ulCorner = [posterRoomHouseCoord.x[0], posterRoomHouseCoord.y[0]];
    // 1) add title
    let titleObjects = [];
    titleObjects[0] = await gtUtils.textObject(ulCorner[0] + 2, ulCorner[1] + 0.5, 'Poster Room ' + posterRoomBuildingLabel, 24, "white");
    titleObjects[1] = await gtUtils.textObject(ulCorner[0] + 5, ulCorner[1] + 2.5, posterRoomInfo.name, 20, "white");
    titleObjects[1].offsetX = -titleObjects[1].width*12;
    mapData = mapData == null? await gtUtils.pullMapSpaceMap(hyperRoomSpaceMap) : mapData;
    let mapData2 = await gtUtils.pullMapSpaceMap(posterRoomInfo.spaceMap);
    mapData = gtUtils.addObjectsToMap(mapData, titleObjects);
    // 2) add impassables
    mapData = gtUtils.setImpassable(mapData, posterRoomHouseCoord.x, posterRoomHouseCoord.y, 1);
    // 3) connect the rooms: left and right side in hyperroom lead to left and right side of poster room, top and bottom too.
    let xHyper = posterRoomHouseCoord.x;
    let yHyper = posterRoomHouseCoord.y;
    // Portals are buggy when destination has coordinate 0, so setting to 1 for left wall.
    let updatedMaps = [mapData, mapData2];
    updatedMaps[0] = gtUtils.addPortalsFromSpaceMapId(hyperRoomSpaceMap, [xHyper[0],xHyper[0]], yHyper, updatedMaps[0], posterRoomInfo.spaceMap, [1, 1], [2,54]);
    updatedMaps[1] = gtUtils.addPortalsFromSpaceMapId(posterRoomInfo.spaceMap, [0,0], [2,54], updatedMaps[1], hyperRoomSpaceMap, [xHyper[0], xHyper[0]], yHyper);
    updatedMaps = gtUtils.addPortalsReciprocal(hyperRoomSpaceMap, [xHyper[1],xHyper[1]], yHyper, updatedMaps[0], posterRoomInfo.spaceMap, [93, 93], [2,54], updatedMaps[1]);
    updatedMaps = gtUtils.addPortalsReciprocal(hyperRoomSpaceMap, xHyper, [yHyper[0], yHyper[0]], updatedMaps[0], posterRoomInfo.spaceMap, [2, 92], [1,1], updatedMaps[1]);
    updatedMaps = gtUtils.addPortalsReciprocal(hyperRoomSpaceMap, xHyper, [yHyper[1], yHyper[1]], updatedMaps[0], posterRoomInfo.spaceMap, [2, 92], [55,55], updatedMaps[1]);
    await gtUtils.setMap(posterRoomInfo.spaceMap, updatedMaps[1]);
    return updatedMaps[0];
}


// This could be done a lot more asynchronously,
// if not batching a huge number of rooms at the same time.
exports.connectAllRooms = async (hyperRoomSpaceMap, posterRoomArray) => {
    let index = 0;
    let mapData = await gtUtils.pullMapSpaceMap(hyperRoomSpaceMap);
    for (const posterRoom of posterRoomArray) {
        mapData = await connectSingleRoomMap(hyperRoomSpaceMap, index, posterRoom, mapData);
        index++;
    }
    await gtUtils.setMap(hyperRoomSpaceMap, mapData);
}


