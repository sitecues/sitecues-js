/**
 * Use closure compiler to remove dead code -- it does a much better job than uglify
 */

'use strict';

const closureCompiler = require('closure-compiler'),
  fs = require('fs'),
  glob = require('glob'),
  closureOptions = {
    // DON'T USE 'ADVANCED':
    // Saves lots more space (~10%), but breaks code by mangling property names such as chrome.storage -> chrome.b
    // If we want to try this, we must protect ourselves from bad optimizations. More info here:
    // https://developers.google.com/closure/compiler/docs/api-tutorial3?hl=en
    //compilation_level: 'ADVANCED'
  },
  MAX_CONCURRENT_COMPILE_JOBS = 10,
  pLimit = require('p-limit'),
  limit = pLimit(MAX_CONCURRENT_COMPILE_JOBS);

function removeDeadCode(jsFileName) {
  return new Promise((resolve) => {
    function onCompileComplete(err, compiledJsText) {
      if (err) {
        throw err;
      }
      fs.writeFile(jsFileName, compiledJsText, resolve);
    }

    function beginCompile(err, sourceBuffer) {
      if (err) {
        throw err;
      }
      console.log('Removing dead code for ' + jsFileName);
      closureCompiler.compile(sourceBuffer, closureOptions, onCompileComplete);
    }

    fs.readFile(jsFileName, beginCompile);
  });
}

function removeAllDeadCode() {
  return new Promise((resolve) => {
    glob(global.build.path + '/js/**/*.js', (err, jsFileNames) => {
      if (err) {
        throw err;
      }
      resolve(jsFileNames);
    });
  })
  .then((jsFileNames) => {
    const conversionJobs = jsFileNames.map((jsFileName) => {
      return limit(() => removeDeadCode(jsFileName));
    });
    return Promise.all(conversionJobs);
  });
}

removeAllDeadCode.displayName = 'remove-all-dead-code';

module.exports = removeAllDeadCode;
