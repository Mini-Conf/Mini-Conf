#!/usr/bin/env bash

# Change to the current directory (where version.json placed)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

# prepare the information
# If we would like to use a short SHA, we could add '--short' option
#   e.g. 339384ee5ec7c4d63d685ff625d9a81c328ef156 -> 339384e
#SHA=`git rev-parse --short HEAD`
SHA=`git rev-parse HEAD`
DATE=`date -Iminutes`
FILE='version.json'
echo "date: $DATE"
echo "sha: $SHA"
sed -i -E "s/\"date\" *: *\"([^\"]+)\",$/\"date\": \"$DATE\",/g" $FILE
sed -i -E "s/\"sha\" *: *\"([^\"]+)\"/\"sha\": \"$SHA\"/g" $FILE
