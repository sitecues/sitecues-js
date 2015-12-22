/**
 * 1. Create bundle.js files for bundles, e.g. bp-expanded.js -- each bundle can contain multiple sources
 * 2. Move over other orphaned .js files that are not included in a bundle but are used individually
 * All .js gets the rjs namespacing treatment (sitecues.define, etc.) and is minified if the config. isMinifying option is set.
 * Definitions:
 * - Source: a small individual .js source file
 * - Bundle: a compiled bundle .js file
 * @type {Gulp|*|exports|module.exports}
 */

var gulp = require('gulp'),
  bundleIncludesSourcesMap = {}, // Store the array of source files used in each bundle
  requirejs = require('requirejs'),
  jshint = require('gulp-jshint'),
  extend = require('extend'),
  config = require('./build-config'),
  size = config.isShowingSizes && require('gulp-size'),
  pkgDir = require('pkg-dir'),
  Promise_ = require('bluebird'),   // TODO update bamboo to use node 3+ and remove this polyfill dependency
  absoluteSourceFolder,
  absoluteSourceFolderStringLength,
  RUNTIME_CONFIG = 'sitecues.version="' + config.version + '";var SC_LOCAL=' + !!config.isLocal + ',SC_DEV=' + !!config.isDebugOn + ';\n',
  AMD_BASE_CONFIG = {
    wrap: {
      start: "'use strict';"
    },
    baseUrl: 'source/js',
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourcemaps,
    removeCombined: true,
    namespace: 'sitecues',
    useStrict: true,
    paths: {
      '$': 'empty:'
    },
    //logLevel: 4,
    uglify2: {
      compress: {
        dead_code: true
      },
      mangle: true
    },
    onModuleBundleComplete: onModuleBundleComplete
  },
  AMD_CONFIGS = {
    'core': {
      out: config.buildDir + '/js/sitecues.js',
      wrap: {   // Override default wrap.start to add runtime config
        start: RUNTIME_CONFIG + "'use strict';\n"
      },
      include: [
        'core/alameda-custom',  // Was: '../../../node_modules/alameda/alameda.js'
        'core/core'
      ],
      insertRequire: ['core/core'],
    },
    'locale-data': {
      baseUrl: 'source/js/locale-data',
      dir: config.resourceDir + '/js/locale-data'
    },
    'bp-expanded': {
      include: [
        'bp-expanded/bp-expanded'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto',
        'core/metric',
        'core/conf/urls',
        'core/conf/user/manager',
        'page/zoom/zoom'
      ]
    },
    'bp-secondary': {
      include: [
        'bp-secondary/bp-secondary'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'bp-expanded/bp-expanded',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/bp/view/markup-finalizer',
        'core/util/xhr',
        'page/util/common',
        'bp-expanded/view/transform-animate',
        'bp-expanded/view/transform-util',
        'page/cursor/cursor',
        'core/metric',
        'core/conf/urls',
        'core/conf/user/manager'
      ]
    },
    'page': {
      include: [
        'page/keys/keys',
        'page/keys/commands',
        'page/util/element-classifier',
        'page/highlight/highlight',
        'page/util/common',
        'page/zepto/zepto',
        'page/highlight/move-keys',
        'page/zoom/zoom',
        'page/hpan/hpan',
        'page/zoom/fixed-position-fixer',
        'page/focus/focus',
        'page/cursor/cursor'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'core/metric',
        'core/conf/urls',
        'core/conf/site',
        'core/conf/user/manager',
        'core/conf/user/storage'
      ]
    },
    'hlb': {
      include: [
        'hlb/hlb'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto',
        'core/conf/site',
        'core/conf/user/manager',
        'core/metric',
        'core/conf/urls',
        'page/util/element-classifier',
        'page/util/geo'
      ]
    },
    'theme': {
      include: [
        'theme/theme',
        'theme/color-choices',
        'theme/img-classifier'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'page/util/color',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto',
        'core/conf/urls',
        'core/conf/site',
        'core/conf/user/manager',
        'page/style-service/user-agent-css.js',
        'core/conf/site.js',
        'page/style-service/media-queries.js',
        'page/style-service/css-aggregator.js',
        'page/style-service/style-service.js',
        'core/metric',
        'zoom-forms/zoom-forms.js',
        'page/zoom/zoom.js'
      ]
    },
    'audio': {
      include: [
        'audio/audio',
        'audio/text-select'
      ],
      exclude: [
        'core/metric',
        'page/zepto/zepto'
      ]
    },
    'audio-cues': {
      include: [
        'audio-cues/audio-cues'
      ],
      exclude: [
        'audio/audio',
        'core/metric',
        'core/conf/user/manager',
        'page/zepto/zepto'
      ]
    },
    'status': {
      include: [
        'status/status'
      ],
      exclude: [
        'core/conf/user/manager',
        'core/util/xhr',
        'core/conf/urls'
      ]
    },
    'info': {
      include: [
        'info/info'
      ],
      exclude: [
        'page/util/color',
        'core/locale',
        'hlb/dimmer',
        'core/conf/urls'
      ]
    },
    'pick-debug': {
      include: [
        'pick-debug/pick-debug'
      ]
    },
    'labs': {
      include: [
        'labs/labs'
      ],
      exclude: [
        'core/conf/user/manager'
      ]
    },
    'inverter': {
      include: [
        'inverter/inverter'
      ],
      exclude: [
        'core/conf/user/manager',
        'page/style-service/style-service',
        'core/platform'
      ]
    },
    'zoom-forms': {
      include: [
        'zoom-forms/zoom-forms'
      ],
      exclude: [
        'core/conf/user/manager',
        'core/platform'
      ]
    }
  },
  sourceFolders = Object.keys(AMD_CONFIGS),
  compileSourceFolderMap = {};

// Convert to relative paths and remove .js extension
function convertAbsolutePathToRequireJsName(absolutePath) {
  return absolutePath.substring(absoluteSourceFolderStringLength, absolutePath.length - 3);
}

function onModuleBundleComplete(data) {
  // Record bundle info so we can use it in amd loader config
  bundleIncludesSourcesMap[data.name] = data.included;
}

function validate(callback) {
  var sourceIncludedByBundleMap = {}, // Store the bundle for each module
    errors = [];

  Object.keys(bundleIncludesSourcesMap).forEach(function(bundleName) {
    var includedInBundle = bundleIncludesSourcesMap[bundleName],
      bundlePath = bundleName + '/',
      bundlePathLength = bundlePath.length;

    includedInBundle.forEach(function(includedItemAbsPath) {
      // Get relative path
      var includedItem = convertAbsolutePathToRequireJsName(includedItemAbsPath);

      // Check for sources outside of the bundle's folder
      if (includedItem !== bundleName && includedItem.substring(0, bundlePathLength) !== bundlePath) {
        errors.push('The module ' + includedItem + ' was not in it\'s bundle\'s folder ' + bundleName + '/.\n');
      }

      // Check for duplicated source (same source file included in multiple bundles)
      if (sourceIncludedByBundleMap[includedItem]) {
        errors.push('The module ' + includedItem + ' was included both in ' + sourceIncludedByBundleMap[includedItem] + ' and ' + bundleName + '.\n' +
          'Source modules must only be included once in order to avoid code duplication.');
      }
      sourceIncludedByBundleMap[includedItem] = bundleName;
    });
  });

  if (errors.length) {
    console.log('JS validation errors:\n' + errors);
  }

  callback(errors.length && errors);
}

function optimize(name, amdConfig) {
  amdConfig.optimize = config.isMinifying ? 'uglify2' : 'none';
  if (!amdConfig.dir) {  // Output file name if not outputting a dir as we do for locale-data
    amdConfig.name = name;
    amdConfig.out = amdConfig.out || (config.resourceDir + '/js/' + name + '.js');
    amdConfig.create = true;
  }

  return new Promise_(
    function(resolve, reject) {
      requirejs.optimize(
        amdConfig,
        resolve,
        reject
      );
    });
}

// Create source folder compilation function map, e.g.
// {
//   'bp-expanded': function() { /* compiles bp-expanded */ }
//   ...
// }
sourceFolders.forEach(function(sourceFolder) {
  compileSourceFolderMap[sourceFolder] = function() {
    var amdConfig = extend({ }, AMD_BASE_CONFIG, AMD_CONFIGS[sourceFolder]);
    return optimize(sourceFolder, amdConfig);
  };
  compileSourceFolderMap[sourceFolder].displayName = sourceFolder;
});

function lint() {
  return gulp.src(['source/js/**/*.js', '!source/js/**/jquery.js', '!source/js/**/zepto.js'])
    .pipe(jshint(config.isDebugOn ? 'source/js/.jshintrc-debug' : 'source/js/.jshintrc'))   // Could also pass jshintrc filename as a string
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter("fail"));
}

function prepareValidation() {
  return pkgDir(__dirname)
    .then(
      function(appRoot) {
        absoluteSourceFolder = appRoot + '/source/js/';
        absoluteSourceFolderStringLength = absoluteSourceFolder.length;
        console.log(absoluteSourceFolder);
      });
}

function showSizes() {
  return gulp.src(config.buildDir + '/**/*.js')
    .pipe(size({ pretty: true, gzip: true, showFiles: true }));
}

module.exports = {
  all: gulp.task('all'),
  lint: lint,
  showSizes: showSizes,
  prepareValidation: prepareValidation,
  validate: validate,
  sourceFolders: sourceFolders,
  compileSourceFolderMap: compileSourceFolderMap
};
