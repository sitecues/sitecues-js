#!/usr/bin/env node
// Call thusly:
// finalize-loader-config [sitecues-config-filename] [bundle-config-filename] [allow-zepto]
// This inserts the runtime bundle configuration as created by the build process.
// The bundle configuration (what's in each js file) is written in rjs-build-options.js onModuleBundleComplete()eq

function getBundleText() {
  var bundleTextFilename = args[1],
    text = fs.readFileSync(bundleTextFilename, { encoding: 'utf8' } );  // Get the bundle config
  text = text.substring(0, text.lastIndexOf(',')); // Remove trailing comma
  return '{' + text + '}';  // Surround by object syntax
}

var fs = require('fs'),
  args = process.argv.slice(2),
  sitecuesLibraryFilename = args[0],
  matchText = '\"__SITECUES_BUNDLES__\"',
  bundleText = getBundleText(),
  text = fs.readFileSync(sitecuesLibraryFilename, { encoding: 'utf8' } ),
  newText = text.replace(matchText, bundleText)
    .replace('sitecues.__ALLOW_ZEPTO__', args[2]);

fs.writeFileSync(sitecuesLibraryFilename, newText);
