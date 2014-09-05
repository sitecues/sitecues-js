// Herein lies the default configuration for the testing framework.
// Other files can use this as an AMD module.

define({
    proxyPort: 9000,
    proxyUrl: 'http://localhost:9000/',

    capabilities: {
        'name': 'sitecues tests',
        'selenium-version': '2.41.0'
    },
    environments: [
        // local-style...
        { browserName: 'phantomjs' },
        { browserName: 'chrome' },
        { browserName: 'firefox' }
        // BrowserStack-style...
        // { os: "Windows", os_version: "8.1", browser: "chrome", browser_version: "34.0" }
        // SuaceLabs-style...
        // { platform: 'Mac 10.8', browserName: 'safari', version: '6' }
        // { platform: 'Windows 8.1', browserName: 'internet explorer', version: '11' },
        // { platform: 'Windows 8', browserName: 'internet explorer', version: '10' },
        // { platform: 'Windows 7', browserName: 'internet explorer', version: '9' }
        // { platform: [ 'OS X 10.6', 'Windows 7', 'Linux' ], browserName: 'firefox', version: '25' },
        // { platform: 'Windows 7', browserName: 'chrome', version: '31' },
        // { platform: 'Linux', browserName: 'chrome', version: '30' },
        // { platform: 'OS X 10.8', browserName: 'chrome', version: '27' },
        // { platform: 'OS X 10.8', browserName: 'safari', version: '6' }
    ],

    maxConcurrency: 3,  // how many browsers may be open at once

    // This configures the AMD loader...
    loader: {

    },

    // tunnel: 'NullTunnel', // imports config for test clouds like BrowserStack
    tunnelOptions: {
        // These options are passed to the tunnel service
        // to configure how it behaves...
        host: '127.0.0.1:4447'  // custom location or port for the selenium server
    },

    // Unit tests, for verifying the return values of functions, etc...
    suites: [
        // 'test/unit/foobar'
    ],

    // Functional tests, for verifying high-level behavior in the browser as a user would...
    functionalSuites: [
        // 'test/functional/foobar'
    ],

    // The paths that match this regex will NOT be included in code coverage reports...
    excludeInstrumentation: /^(?:config|test|node_modules)\//
});
