({
  generateSourceMaps: true,
  preserveLicenseComments: false,
  modules: [
    {
      name: 'sitecues',
      include : [
        'requirejs-loader-config.js',
        '../config/config.js',
        'require.js',
        'core',
        'launch'
      ],
      create: true,
      namespace: 'sitecues',
      insertRequire: ['core']
    },
    { name: 'command/speak-highlight' },
    { name: 'command/queue-key' },
    { name: 'command/reset-sitecues' },
    { name: 'command/reset-zoom' },
    { name: 'command/toggle-speech' },
    { name: 'command/increase-zoom' },
    { name: 'command/decrease-zoom' },
    { name: 'locale/lang/de' },
    { name: 'locale/lang/en' },
    { name: 'locale/lang/es' },
    { name: 'locale/lang/fr' },
    { name: 'locale/lang/pl' }
  ],
  onModuleBundleComplete: function (data) {
    var includedStr = '';
    for (var index = 0; index < data.included.length; index ++) {
      var name = data.included[index],
        shortName = name.substring(name.lastIndexOf('/') + 1);
      includedStr += shortName + Array(Math.max(1, 30 - shortName.length)).join(' ');
    }
    console.log('** ' + data.name + ':');
    console.log('   ' + includedStr);
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
