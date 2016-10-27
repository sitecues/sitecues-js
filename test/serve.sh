#!/usr/bin/env sh
node test/build-core.js && intern serve --open --config=config/intern;
