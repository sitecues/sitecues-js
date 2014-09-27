// Herein lies the default configuration for the testing framework.
// Other files can use this as an AMD module.

define({
    proxyPort: 9000,
    proxyUrl: 'http://127.0.0.1:9000/',

    // Default Selenium capabilities (can be overridden in each environment object)...
    capabilities: {
        // To see some examples, visit...
        // https://code.google.com/p/selenium/wiki/DesiredCapabilities
        'name': 'sitecues tests',
        'selenium-version': '2.41.0'
    },
    // Where unit and/or functional tests will be run...
    environments: [
        // local-style...
        // { browserName: 'phantomjs' },
        { browserName: 'chrome' },
        // { browserName: 'firefox' },
        // { browserName: 'safari' }
        // { browserName: 'internet explorer' }
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

    // Options to pass to the AMD module loader...
    loader: {

    },

    // Choose the type of functional test tunnel,
    // which imports config for test clouds...
    // tunnel: 'NullTunnel',          // default if none provided
    // tunnel: 'SauceLabsTunnel',
    // tunnel: 'BrowserStackTunnel',
    // tunnel: 'TestingBotTunnel',

    // Options to pass to the functional test tunnel service...
    tunnelOptions: {
        host: '127.0.0.1:4447'  // custom location to find the selenium server
        // port: 4447  // custom port number to find the selenium server
    },

    // Unit tests, for verifying the return values of functions, etc...
    suites: [
        // 'test/unit/foobar'
    ],

    // Functional tests, for verifying high-level behavior in the browser as a user would...
    functionalSuites: [
        'test/functional/simple'
    ],

    // The paths that match this regex will NOT be included in code coverage reports...
    excludeInstrumentation: /^(?:config|test|node_modules)\//
});
