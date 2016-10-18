/* Extension config */
'use strict';

const extend = require('extend'),
  EXTENSION_SOURCE_DIR = 'extension/source';

function getConfig(baseConfig) {
  // Fetch sources from common library and extension
  function getGlob(suffix) {
    return [ EXTENSION_SOURCE_DIR + '/' + suffix, baseConfig.librarySourceDir + '/' + suffix ];
  }

  // Fetch sources only from common library
  function getLibraryGlob(suffix) {
    return baseConfig.librarySourceDir + '/' + suffix;
  }

  // Fetch sources only from extension
  function getExtensionGlob(suffix) {
    return EXTENSION_SOURCE_DIR + '/' + suffix;
  }

  const config = extend(true, {}, baseConfig, {
    isExtension: true,
    extensionSourceDir: EXTENSION_SOURCE_DIR,
    tmpDir: require('os').tmpdir(),
    isLocal: process.env.LOCAL !== 'off', // Extension: default is local because of Google security requirements
    autoSpeechStrategy: process.env.AUTO_SPEECH || 'local',
    allowBrowserNetworkSpeech: process.env.BROWSER_NETWORK_SPEECH === 'on', // Allow window.speechSynthesis via network -- off by default
    jsGlob: getGlob('js/**/*.js'),
    rasterGlob: getGlob('images/**/*.png'),
    svgGlob: getGlob('images/**/*.svg'),
    earconsGlob: getGlob('earcons/**/*.ogg'),
    htmlGlob: getGlob('html/**/*.html')
      .concat('!' + getLibraryGlob('html/prefs.html')), // Do not use iframe for prefs -- extension has better storage-backup module
    templateGlob: [
      // Anything that may affect final html, including .hbs, .json
      getLibraryGlob('html/**/*.hbs'),
      getLibraryGlob('html/**/*.json')
    ],
    cssGlob: getGlob('css/*.css'),
    metaDataGlob: [getExtensionGlob('manifest.json'), getExtensionGlob('LICENSE')]
  });

  return config;
}

module.exports = getConfig;