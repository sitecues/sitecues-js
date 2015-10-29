#!/usr/bin/env node

'use strict';

// Call thusly:
// finalize-loader-config [sitecues-config-filename] [bundle-config-filename] [allow-zepto]
// This inserts the runtime bundle configuration as created by the build process.
// The bundle configuration (what's in each js file) is written in rjs-build-options.js onModuleBundleComplete()eq

function getBundleText() {
  const bundleTextFilename = args[1];
  // Get the bundle config
  let text = fs.readFileSync(bundleTextFilename, { encoding: 'utf8' } );
  text = text.substring(0, text.lastIndexOf(',')); // Remove trailing comma
  // Surround by object syntax
  return '{' + text + '}';
}

const fs = require('fs'),
  args = process.argv.slice(2),
  sitecuesLibraryFilename = args[0],
  matchText = '\"__SITECUES_BUNDLES__\"',
  bundleText = getBundleText(),
  text = fs.readFileSync(sitecuesLibraryFilename, { encoding: 'utf8' } ),
  newText = text.replace(matchText, bundleText)
    .replace('sitecues.__ALLOW_ZEPTO__', args[2])
    .replace(/__VERSION__/g, args[3]);

fs.writeFileSync(sitecuesLibraryFilename, newText);
