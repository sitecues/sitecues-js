/* Extension config */
'use strict';

var extend = require('extend');

function getConfig(baseConfig) {
  // Fetch sources from common library and extension
  function getGlob(suffix) {
    return [baseConfig.extensionSourceDir + '/' + suffix, baseConfig.librarySourceDir + '/' + suffix];
  }

  // Fetch sources only from common library
  function getLibraryGlob(suffix) {
    return baseConfig.librarySourceDir + '/' + suffix;
  }

  // Fetch sources only from extension
  function getExtensionGlob(suffix) {
    return baseConfig.extensionSourceDir + '/' + suffix;
  }

  var config = extend({}, baseConfig, {
    isExtension: true,
    isLocal: process.env.LOCAL !== 'off', // Extension: default is local because of Google security requirements
    jsGlob: getGlob('js/**/*.js'),
    rasterGlob: getGlob('images/**/*.png'),
    svgGlob: getGlob('images/**/*.svg'),
    earconsGlob: getGlob('/earcons/**/*.ogg'),
    htmlGlob: getGlob('html/**/*.html')
      .concat('!' + getLibraryGlob('/html/prefs.html')), // Do not use iframe for prefs -- extension has better storage-backup module
    templateGlob: [
      // Anything that may affect final html, including .hbs, .json
      getLibraryGlob('/html/**/*.hbs'),
      getLibraryGlob('/html/**/*.json')
    ],
    cssGlob: getGlob('/css/*.css'),
    metaDataGlob: [getExtensionGlob('/manifest.json'), getExtensionGlob('/LICENSE')]
  });

  return config;
}

module.exports = getConfig;