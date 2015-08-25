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
    { name: 'command/queue-key' },
    { name: 'command/reset-sitecues' },
    { name: 'command/reset-zoom' },
    { name: 'command/toggle-speech' },
    { name: 'command/zoom-increase' },
    { name: 'command/zoom-decrease' },
    { name: 'locale/lang/de' },
    { name: 'locale/lang/en' },
    { name: 'locale/lang/es' },
    { name: 'locale/lang/fr' },
    { name: 'locale/lang/pl' }
  ],
  namespace: 'sitecues',
  useStrict: true,
  uglify2: {
    compress: {
      dead_code: true
    },
    mangle: true
  }
})
