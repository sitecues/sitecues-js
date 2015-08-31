#!/usr/bin/env node
// Call thusly:
// insert-bundle-config [sitecues-config-filename] [bundle-config-filename]
// This inserts the runtime bundle configuration as created by the build process.
// The bundle configuration (what's in each js file) is written in requirejs-build-options.js onModuleBundleComplete()eq

function getBundleText() {
  var bundleTextFilename = args[1],
    text = fs.readFileSync(bundleTextFilename, { encoding: 'utf8' } );  // Get the bundle config
  text = text.substring(0, text.lastIndexOf(',')); // Remove trailing comma
  return '{' + text + '\n  }';  // Surround by object syntax
}

var fs = require('fs'),
  args = process.argv.slice(2),
  sitecuesLibraryFilename = args[0],
  matchText = '\'__SITECUES_BUNDLES__\'',
  bundleText = getBundleText(),
  text = fs.readFileSync(sitecuesLibraryFilename, { encoding: 'utf8' } ),
  newText = text.replace(matchText, bundleText);

fs.writeFileSync(sitecuesLibraryFilename, newText);
