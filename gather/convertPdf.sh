#!/bin/bash
# USAGE: bash convertPdfs.sh myOrigPDF.pdf myDestinationImage.png method
inputFile=$1
outputFile=$2
method=$3
if [ $method = 0 ] ; then
    # Adjust density as needed
    convert -density 300 -trim $1 -quality 100 -flatten $2
elif [ $method = 1 ] ; then
    # JPG conversion
    convert $1 -define jpeg:extent=3000kb $2
else
    # this will sometimes yield higher quality png
    sips -s format png $1 --out $2
fi

