({
  generateSourceMaps: true,
  preserveLicenseComments: false,
  modules: [
    {
      name: 'sitecues',
      include : [
        '../../build-config/config.js',
        'core/sitecues',
        'core/run',
        '../../../node_modules/requirejs/require.js',
        'bp/bp',
        'keys/keys',
        'metric/metric',
        'util/xhr',
        'conf/urls'
      ],
      create: true,
      namespace: 'sitecues',
      insertRequire: ['../../build-config/config.js', 'core/sitecues']
    },
    {
      name: 'utils',
      create: true,
      include: [
        'util/jquery',
        '$',
        'util/common',
        'util/jquery-utils'
      ],
      exclude: [
        'metric/metric',
        'conf/urls',
        'util/element-classifier'
      ]
    },
    {
      name: 'bp-expanded',
      create: true,
      include: [
        'bp/controller/slider-controller',
        'bp/controller/focus-controller',
        'bp/controller/shrink-controller',
        'bp/view/elements/tts-button',
        'bp/view/elements/more-button'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'util/transform',
        'metric/metric',
        'conf/urls',
        'conf/user/manager'
      ]
    },
    {
      name: 'bp-secondary',
      create: true,
      include: [
        'bp/view/elements/secondary/secondary-panel'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/animate',
        'util/jquery-utils',
        'util/transform',
        'metric/metric',
        'conf/urls',
        'conf/user/manager'
      ]
    },
    {  // We could split into audio and zoom features
      name: 'page-features',
      create: true,
      include: [
        'mouse-highlight/mouse-highlight',
        'util/transform',
        'audio/audio',
        'mouse-highlight/move-keys',
        'zoom/zoom',
        'hpan/hpan',
        'zoom/fixed-position-fixer',
        'keys/focus',
        'cursor/cursor'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'metric/metric',
        'conf/urls',
        'conf/site',
        'conf/user/manager'
      ]
    },
    {
      name: 'zoom-forms',
      create: true,
      include: [
        'zoom/zoom-forms'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'util/transform',
        'metric/metric',
        'conf/urls',
        'conf/site',
        'conf/user/manager'
      ]
    },
    {
      name: 'audio-cues',
      create: true,
      include: [
        'audio/audio-cues'
      ],
      exclude: [
        'audio/audio',
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'util/transform',
        'metric/metric',
        'conf/urls',
        'conf/site',
        'conf/user/manager'
      ]
    },
    {
      name: 'hlb',
      create: true,
      include: [
        'hlb/hlb'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'conf/site',
        'conf/user/manager',
        'metric/metric',
        'conf/urls',
        'util/geo',
        'util/transform'
      ]
    },
    {
      name: 'info',
      create: true,
      include: [
        'info/info'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'util/color',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'conf/urls',
        'conf/site',
        'conf/user/manager',
        'style-service/user-agent-css.js',
        'conf/site.js',
        'style-service/media-queries.js',
        'style-service/css-aggregator.js',
        'style-service/style-service.js',
        'util/transform.js',
        'metric/metric',
        'hlb/dimmer',
        'zoom/zoom-forms.js',
        'zoom/zoom.js'
      ]
    },
    {
      name: 'themes',
      create: true,
      include: [
        'theme/color-engine',
        'theme/color-choices',
        'theme/img-classifier'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'util/color',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/xhr',
        'util/common',
        'util/jquery-utils',
        'conf/urls',
        'conf/site',
        'conf/user/manager',
        'style-service/user-agent-css.js',
        'conf/site.js',
        'style-service/media-queries.js',
        'style-service/css-aggregator.js',
        'style-service/style-service.js',
        'util/transform.js',
        'metric/metric',
        'zoom/zoom-forms.js',
        'zoom/zoom.js'
      ]
    },
    {
      name: 'status',
      create: true,
      include: [
        'util/status'
      ],
      exclude: [
        'conf/urls'
      ]
    }
  ],
  onBuildRead: function(module, path, contents) {
    if (module.indexOf('/requirejs') > 0) {
      var loaderConfig = fs.readFileSync('requirejs-loader-config.js', 'utf8');
      // Prepend our runtime configuration to the loader itself,
      // so that we can use options like "skipDataMain" in it.
      return loaderConfig + contents;
    }

    return contents;
  },
  onModuleBundleComplete: function (data) {
    // Check for dupes
    // TODO this should use require with a state module we build instead of a global
    global.scIncludedBy = global.scIncludedBy || {};
    var index = data.included.length;
    while (index--) {
      var includedItem = data.included[index];
      if (global.scIncludedBy[includedItem]) {
        throw new Error('The module ' + includedItem + ' was included both in ' + global.scIncludedBy[includedItem] + ' and ' + data.name + '.\n' +
        'Modules must only be included once in order to avoid code duplication.');
      }
      global.scIncludedBy[includedItem] = data.name;
    }

    // Build loader config
    var includedStr = data.included.join("','");
    includedStr = includedStr.replace(/\.js/g, ''); // Remove .js
    fs.appendFileSync('target/build-config/sitecues-bundles.js', "'" + data.name + "':['" + includedStr + "'],");
  },
  map: {
    // All modules get 'jquery-private' when they ask for '$',
    // so that we can secretly return a customized value which
    // implements .noConflict() to avoid puking on customers.
    '*': {
      '$': 'util/jquery-private'
    }
  },
  paths: {
    jquery: 'util/jquery'
  },
  namespace: 'sitecues',
  useStrict: true,
  uglify2: {
    compress: {
      dead_code: true
    },
    mangle: true
  }
})
