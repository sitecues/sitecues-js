#!/bin/bash
cd $1
ls -lS $2 | awk '{ printf("%10'\''d   %s\n",$5,$9) }'