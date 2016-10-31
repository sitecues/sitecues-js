#!/usr/bin/env sh
node test/transpile-core.js && intern serve --open --config=config/intern;
