#!/bin/bash
cd $1
find . -type f -name "$2" -exec ls -lS {} \;| awk '{ printf("%10'\''d   %s\n",$5,$9) }' | sort -k1 -r | sed 's/\.\///'