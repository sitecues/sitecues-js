/**
 * Use closure compiler to remove dead code -- it does a much better job than uglify
 */

const closureCompiler = require('closure-compiler'),
  fs = require('fs'),
  glob = require('glob'),
  closureOptions = {
    // DON'T USE 'ADVANCED':
    // Saves lots more space (~10%), but breaks code by mangling property names such as chrome.storage -> chrome.b
    // If we want to try this, we must protect ourselves from bad optimizations. More info here:
    // https://developers.google.com/closure/compiler/docs/api-tutorial3?hl=en
    //compilation_level: 'ADVANCED'
  };

function removeDeadCode(jsFileName, onErrorCallback, onWriteComplete) {
  function onCompileComplete(errCode, compiledJsText, errorMessage) {
    if (errCode) {
      onErrorCallback(errorMessage);
    }
    else {
      fs.writeFile(jsFileName, compiledJsText, onWriteComplete);
    }
  }

  const sitecuesJsFileName = jsFileName;

  function beginCompile(err, sourceBuffer) {
    if (err) {
      throw err;
    }
    closureCompiler.compile(sourceBuffer, closureOptions, onCompileComplete);
  }

  fs.readFile(sitecuesJsFileName, beginCompile);
}

function removeAllDeadCode(callback) {
  let numFilesRemaining;

  function onWriteComplete(err) {
    if (err) {
      throw err;
    }
    if (-- numFilesRemaining === 0) {
      callback(); // All complete
    }
  }

  function onJsListingRetrieved(err, jsFileNames) {
    if (err) {
      throw err;
    }
    numFilesRemaining = jsFileNames.length;
    jsFileNames.forEach(function(jsFile) {
      removeDeadCode(jsFile, callback, onWriteComplete);
    });
  }

  glob(global.buildDir + '/js/**/*.js', onJsListingRetrieved);
}

removeAllDeadCode.displayName = 'remove-all-dead-code';

module.exports = removeAllDeadCode;
