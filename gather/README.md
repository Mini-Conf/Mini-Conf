# Create Poster Sessions in GatherTown

-------------------------------------------------------------------------------------
See an [example poster session with 25 towns and 2 fake posters / town](https://gather.town/app/0qDQijFg96QVt3Zv/sessionHub), 
with [poster lists as Google Sheets in each room](https://gather.town/app/fqYKZyOAnXGK2J7U/posterRoomE3?spawnx=11&spawny=40&map=custom-entrance) (open the list by pressing 'x' when walking over the text).

**Disclaimer:** This folder contains scripts and functions that were used to create and manage poster sessions and other spaces on Gather Town during NeurIPS 2020. 
They were written by Y-Lan Boureau, adapting a [poster upload example supplied by Gather Town.](https://www.notion.so/EXTERNAL-Gather-http-API-3bbf6c59325f40aca7ef5ce14c677444#e0a6c5277fd443458c4a9c0f4359738c) 
I am not a web programmer and we were in a time crunch, so this code might have a lot of eyebrow-raising bits. 
It errs on the side of doing things synchronously whenever running things async for our scale led to API errors, so there is a lot you can optimize for your own use.

-------------------------------------------------------------------------------------
Table of Content: 
 
- [BUILDING AN EXAMPLE GATHER TOWN POSTER SESSION](#building-an-example-gather-town-poster-session)
  * [1) Install Node & Dependencies](#1-install-node--dependencies)
  * [2) Obtain Credentials for Gather Town API](#2-obtain-credentials-for-gather-town-api)
  * [3) Update Configuration](#3-update-configuration)
  * [4) Run the Example](#4-run-the-example)
- [CREATE A LIST OF ALL POSTERS IN A ROOM AND STORE IN GOOGLE SPREADSHEET](#create-a-list-of-all-posters-in-a-room-and-store-in-google-spreadsheet)
  * [1) Obtain Google Cloud credentials](#1-obtain-google-cloud-credentials)
  * [2) Run Example to Create Publicly Readable Google Sheets](#2-run-example-to-create-publicly-readable-google-sheets)
  * [3) Add Google Sheets to Poster Rooms](#3-add-google-sheets-to-poster-rooms)
- [POSTER FILES](#poster-files)
- [ADDITIONAL NOTES](#additional-notes)
- [RECAP OF EXAMPLES SCRIPTS](#recap-of-examples-scripts)

------

## BUILDING AN EXAMPLE GATHER TOWN POSTER SESSION

The example is run using fake posters (as in the example town).
To run it with real posters, edit `data/postersData.json` 
(see the [Poster Files section](#poster-files) for instructions on what images to use, and how to serve them).
There, you can also update the zoom call links with real zoom call join links.

### 1) Install Node & Dependencies

- Install NodeJS
- ```npm install``` to install axios library for NodeJS, and canvas for text generation.
  

### 2) Obtain Credentials for Gather Town API

- Get an API key from Gather Town here:
https://gather.town/apiKeys <br/> 
  (OR iff using SSO with NeurIPS [replace with appropriate domain]  https://neurips.gather.town/apiKeys) 
  
- Replace the placeholder API Key in `config.json`

FYI: [official GatherTown API documentation,](https://www.notion.so/EXTERNAL-Gather-http-API-3bbf6c59325f40aca7ef5ce14c677444)
with their original poster upload example.

### 3) Update Configuration

- Set "EXAMPLE_TO_RUN" to 2 in `config.json`, to build an example poster session.

MAX_TOWN in `config.json` determines how many towns are created (up to 25. Lower will run faster). 
The `TUTORIAL_VID_URL` address contains the Neurips poster session tutorial; update to your custom tutorial if you created one.

### 4) Run the Example
   
- In a shell, from the folder where this README is, run:
`node examples.js`
  
This will create the poster session on Gather Town, with URLs printed out in the terminal. 
This will also create two files:

- `data/outPosterTownUrls.json` containing the base url addresses of the towns being created (the variable part at the end of the Gather Town URL)
- `data/outPosterSpawns.json` containing the list of all posters, with links to spawn right at the poster.

The paths of the files being created can be changed in `config.json`:
```
"POSTER_TOWN_URLS_FNAME": "data/outPosterTownUrls.json"
"POSTER_JSON_FILLED_FNAME": "data/outPosterSpawns.json"
```
-------------------------------------------------------------------------------------
## CREATE A LIST OF ALL POSTERS IN A ROOM AND STORE IN GOOGLE SPREADSHEET 
See an example [poster list as Google Sheet in a poster room.](https://gather.town/app/fqYKZyOAnXGK2J7U/posterRoomE3?spawnx=11&spawny=40&map=custom-entrance)
The example below fills such lists automatically based on `data/outPosterSpawns.json` created above.
The resulting Google sheet addresses are also saved at `data/outSpreadsheetAddresses.json`.

### 1) Obtain Google Cloud credentials
 
First, obtain and download data/credentials/credentials.json:

 - log in to google cloud
 - create some project (upper right) or select existing one
 - go to API console (https://console.developers.google.com/apis/dashboard?project=[your project name])
 - select "Credentials" from menu on the left
 - Click '+ Create credentials', select OAuth client ID (this might require adding app name for consent screen)
 - select Desktop app
 - create credentials and download .json file to data/credentials/credentials.json
 - add yourself as test user for your app
 
More info:
- https://cloud.google.com/docs/authentication/end-user
- https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests
- https://cloud.google.com/docs/authentication/getting-started.


### 2) Run Example to Create Publicly Readable Google Sheets

- In a shell, from the folder where this README is, run:
`python posterList.py`

This will first create csv lists of posters which will be saved in data/csv.  
This will then open a token creation flow in a browser to save a 'data/credentials/token.pickle' file, and then create the google sheets.  
After creating and populating google sheets, the google sheet ids will be saved in:
```
"POSTER_LIST_GSHEET_FNAME": "data/outSpreadsheetAddresses.json".
```

### 3) Add Google Sheets to Poster Rooms
- Set "EXAMPLE_TO_RUN" to 4 in config.json, to add the created google sheets to the poster rooms.
- Then run: `node examples.js`

Your poster rooms should now have embedded poster lists that you can open when walking in Gather Town.

-------------------------------------------------------------------------------------
## POSTER FILES
The poster session content is given by `data/postersData.json`.
- The Poster objects in Gather Town require an image to be served from the web (PNG or JPG will work). **Updates to posters will be considerably easier if you are using a stable URL from a website you control, with poster presenters able to update the file themselves.**
- If serving images from your website is not possible, you can upload them to Gather Town and serve from there. Note that the URL will change every time you need to upload a new version of a poster, requiring to also update the poster objects. **In particular, if poster presenters want to make last minute changes to their poster images (and they will), they will need you to re-build the poster towns, so you might want to reconsider whether it really isn't possible to serve from a website with stable URLs.** Images up to 5Mb can be uploaded to Gather Town; larger images will fail. You can run examples by setting `EXAMPLE_TO_RUN` in `config.json` to 0 or 1 (for single or batch upload).
- If you need to convert PDFs to PNG, an example script `convertPdf.sh` is also provided; it requires installing imageMagick (for convert), or using sips (usually available without install on Macs). 
- A lower-res preview can also be uploaded for faster display when walking around -- this example code doesn't do this, but you can update the code that creates poster objects in posterRoom.js to load lower-res images for the preview.


-------------------------------------------------------------------------------------
## ADDITIONAL NOTES
`gtUtils.js` contains additional utility functions for creating rooms using the Gather API:
- a function to copy a room from an account to another (e.g. if you created a room under a given SSO and want to copy it into another SSO or no SSO)
- functions to create matching portals over an entire length of wall between two spaces

It's also useful to view a room in the old mapmaker on Gather to get the coordinates for a portal or object. You can access it by inserting "/old/" in the mapmaker url, for example:  https://gather.town/old/mapmaker/0qDQijFg96QVt3Zv/sessionHub (but this won't work because you don't have edit access to this particular space).

Make sure to encode space IDs in gather with \\, not /.

This code uses one URL per poster room. This choice was made to allow for separate dedicated server space for each room, for large capacity.  
If this is not a concern, portals can be made without specifying a URL (simply changing the map within a URL), which has several advantages:
- Faster move from a room to another, without requesting permissions again
- All attendees across all rooms appear as a single list, and you can locate them across rooms

If you want examples of how to do this, you can request them and we will add examples if there is a lot of demand.

-------------------------------------------------------------------------------------
## RECAP OF EXAMPLES SCRIPTS
You can set the `EXAMPLE_TO_RUN` paramater in `config.json` to these values/tasks:
```
0 = UPLOAD_IMG;  ---> uploading image to Gather Town storage
1 = BATCH_UPLOAD ---> Uploading images as a batch
2 = POSTER_SESSION ---> poster session without poster lists
3 = POSTER_SESSION_WITH_POSTER_LIST  ---> poster session with poster lists created and added; may stall a the Google sheets creation step if the API calls fail.
4 = ADD_POSTER_LISTS_TO_POSTER_SESSIONS ---> adds previously created Google sheets to existing poster rooms.
```


