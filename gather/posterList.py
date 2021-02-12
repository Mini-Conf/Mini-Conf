from __future__ import print_function
import pickle
import os.path
import time
import json
import csv
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# Poster lists will be saved as csv spreadsheets in this directory.
rootCsvDir = "data/csv"

# Config file contains filenames with posters and towns information.
with open("config.json", "r") as inputFile:
    cfg = json.load(inputFile);
# This file contains the spawn links to teleport straight to a given poster.
posterJsonFilledFname = cfg["POSTER_JSON_FILLED_FNAME"]
with open(posterJsonFilledFname, "r") as inputFile:
    allPosterData = json.load(inputFile)

# Go through all posters, and assign them to correct room/town set.
allTowns = {}
# Looping of posters will be by increasing index, to ensure correct ordering.
maxIndex = 0
for iPoster in allPosterData:
    poster = allPosterData[iPoster]
    iTown = poster["town"]
    # Do only towns that were populated. The script saves "townCoord" when populating a town.
    notPopulated = not "townCoord" in poster
    if notPopulated:
        continue
    if not iTown in allTowns:
        allTowns[iTown] = {}
    allTowns[iTown]["townCoord"] = poster["townCoord"]
    posterIndex = poster["index"];
    allTowns[iTown][posterIndex] = poster
    if posterIndex > maxIndex:
        maxIndex = posterIndex

# Columns of the spreadsheets that will appear in poster list.
outKeys = ["townCoord", "posterCoord", "name", "page", "zoom", "spawnUrl"]

# Go town/room by town and save posters into csv.
for iTown in allTowns:
    townCoord = allTowns[iTown]["townCoord"]
    csvFname = f"{rootCsvDir}/{townCoord}.csv"
    with open(csvFname, 'w') as towncsv:
        print(f"Writing {csvFname}")
        towncsvWriter = csv.writer(towncsv);
        towncsvWriter.writerow(["If author isn't at poster, you can use RocketChat on their posterPage to chat"]);
        towncsvWriter.writerow(outKeys);
        # Looping by index to ensure correct ordering of posters.
        for iPoster in range(maxIndex + 1):
            if iPoster not in allTowns[iTown]:
                continue
            poster = allTowns[iTown][iPoster]
            outValues = [poster[k] for k in outKeys]
            towncsvWriter.writerow(outValues)

# These csv files can then be uploaded to Google sheets.
# The rest of this scripts does this automatically.

# OBTAINING CREDENTIALS
# First, obtain and download data/credentials/credentials.json:
# see https://cloud.google.com/docs/authentication/end-user
# Go to "console" (upper right)
# see https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests
# see https://cloud.google.com/docs/authentication/getting-started.
# Summary instructions for the cloud console:
# - log in to google cloud
# - create some project (upper right) or select existing one
# - go to API console (https://console.developers.google.com/apis/dashboard?project=[your project name]
# - select "Credentials" from menu on the left
# - Click '+ Create credentials', select OAuth client ID (this might require adding app name for consent screen)
# - select Desktop app
# - create credentials and download .json file to data/credentials/credentials.json
# - add yourself as test user for your app

# Then run rest of this file
SCOPES = ['https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive']


def credentials():
    """Gets API credentials token.
    Note data/credentials/credentials.json must be created and downladed before running,
    see https://cloud.google.com/docs/authentication/getting-started.
    If no data/credentials/token.pickle file exists, opens a flow that:
    - requests to login,
    - potentially confirm wish to proceed with unsafe developer app referenced in data/credentials/credentials.json:
    - click on "Advanced", and "Go to [name of the app];
    - confirms authorizing drive and sheets permissions
    - OR if choosing test app, add yourself as test user and confirm that you've been invited by the developer (yourself).
    - saves data/credentials/token.pickle file in directory.
    """
    creds = None
    # User tokens, created automatically by this function
    if os.path.exists('data/credentials/token.pickle'):
        with open('data/credentials/token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # See here: https://cloud.google.com/docs/authentication/getting-started to obtain the data/credentials/credentials.json file
            flow = InstalledAppFlow.from_client_secrets_file(
                    'data/credentials/credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('data/credentials/token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return creds

creds = credentials()

# This file contains the Google Sheets ids that are used to form Google Sheets URLs.
spreadsheetFname = cfg["POSTER_LIST_GSHEET_FNAME"];
try:
    with open(spreadsheetFname, "r") as input_file:
        uploadedSessionFiles = json.load(input_file)
except FileNotFoundError:
    print(f"{spreadsheetFname} not found");
    uploadedSessionFiles = {}


# Setting up required services.
def callback(requestId, response, exception):
    if exception:
        print(exception)

# To avoid hitting quota problems
maxBatch = 10;
# This first service will populate the spreadsheets.
API = build('sheets', 'v4', credentials=creds)
service = API;
sheet = service.spreadsheets()
gsheetBatch = API.new_batch_http_request(callback = callback)

# This service can update permissions of Google drive files to make them readable by anyone.
drive_service = build('drive', 'v3', credentials=creds)
all_permission = {
	'type': 'anyone',
	'role': 'reader'
}
batch = drive_service.new_batch_http_request(callback=callback)



# This creates a request to insert the content of a csv file into a Google sheet.
def csvToGsheetRequest(gsheetId, csvFname, iSession, townCoord):
    with open(csvFname, 'r') as csvFile:
        csvContents = csvFile.read()
    body = {
            'requests': [
                {
                    'pasteData': {
                        "coordinate": {
                            "sheetId": 0,
                            "rowIndex": "0",
                            "columnIndex": "0",
                            },
                        "data": csvContents,
                        "type": 'PASTE_NORMAL',
                        "delimiter": ',',
                        }
                    },
                {
                    "mergeCells": {
                        "range": {
                            "sheetId": 0,
                            "startRowIndex": 0,
                            "endRowIndex": 0,
                            "startColumnIndex": 0,
                            "endColumnIndex": 15
                            },
                        "mergeType": "MERGE_ALL"
                        }
                    },
                {
                    "updateSheetProperties": {
                        "properties": {
                            "sheetId": 0,
                            "title": "Poster pages",
                            },
                        "fields": "title",
                        }},
                    {"updateSpreadsheetProperties": {
                        "properties": {
                            "title": f"session {iSession}, town {townCoord}",
                            },
                        "fields": "title",
                        }},
                    ]
            }
    request = API.spreadsheets().batchUpdate(spreadsheetId=gsheetId, body=body)
    return request


# This is assuming we are building the lists for the rooms in poster session 0.
# This only changes the names in the spreadsheets.
iSession = 0;
# For testing with small number of requests, set nRoomMax to a small value.
i = 0;
nRoomMax = min(1000, cfg["MAX_TOWN"]);
for row in range(5):
    for col in ['A', 'B', 'C', 'D', 'E']:
        if i >= nRoomMax:
            break
        i += 1
        # To avoid hitting quota problem, occasionally run batch so far and sleep.
        emptyBatch = i % maxBatch == 0
        if emptyBatch:
            gsheetBatch.execute()
            batch.execute()
            # Avoids errors about too many requests / sec -- adjust as needed.
            time.sleep(2)
            batch = drive_service.new_batch_http_request(callback=callback)
            gsheetBatch = API.new_batch_http_request(callback = callback)

        # get csv file
        townCoord = f"{col}{row}"
        townId=f"{iSession}{townCoord}"
        print(f"Town {townId}")
        townCsv = f"{rootCsvDir}/{townCoord}.csv"
        if not os.path.exists(townCsv):
            print(f"no {townCsv}")
            continue
        # Creates empty spreadsheet. This requires enabling Google sheets for project in the console --
        # if not yet done, script output will prompt to do that.
        spreadsheet_body = {}
        if not townId in uploadedSessionFiles:
            response = service.spreadsheets().create(body=spreadsheet_body).execute()
            # Avoids errors about too many requests / sec -- adjust as needed.
            time.sleep(2)
            uploadedSessionFiles[townId] = response['spreadsheetId'];
            gsheetId = uploadedSessionFiles[townId]
            print(f"Url for spreadsheet {townId}: {response['spreadsheetUrl']}")
            # Following updates permissions to allow everyone to read
            # This requires to enable Drive API for the project -- will be prompted
            # to do so in script output if not done before.
            batch.add(drive_service.permissions().create(
                fileId=gsheetId,
                body=all_permission,
                fields='id',
                ))
        else:
            print(f"{townId} already created: {uploadedSessionFiles[townId]}");
        # Other keys of interest: spreadsheetUrl, sheets
        gsheetId = uploadedSessionFiles[townId]
        gsheetBatch.add(csvToGsheetRequest(
            gsheetId = gsheetId,
            csvFname=townCsv,
            iSession=iSession,
            townCoord=townCoord
            ))

gsheetBatch.execute()
batch.execute()

# Save ids of created spreadsheets
with open(spreadsheetFname, "w") as ofile:
    print(f"Saving spreadsheet ids as {spreadsheetFname}")
    json.dump(uploadedSessionFiles, ofile, indent=2)
