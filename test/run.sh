#!/usr/bin/env sh
open 'test/run.html' &&
intern-runner proxyOnly config=config/intern;
