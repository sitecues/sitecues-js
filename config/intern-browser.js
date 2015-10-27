// Herein lies the base configuration for the testing framework.
// Other files can use this as an AMD module.

define(
    [   // dependencies...
        'intern',   // public API for the test framework itself
        'test/all'
    ],
    function (intern, testSuites) {
        'use strict';

        var build = 'UNKNOWN',
            proxyPort = 9000,
            testDir = '../../test/';

        if (intern.args.build) {
            build = intern.args.build;
        }
        // make sure we are in Node and not a browser...
        else if (typeof process === 'object' && process && process.env) {
            build = process.env.BUILD || process.env.COMMIT;
        }

        return {
            proxyPort: proxyPort,
            proxyUrl: 'http://localhost:' + proxyPort + '/',

            // Miscellaneous configuration, mainly for Selenium.
            // Examples: https://code.google.com/p/selenium/wiki/DesiredCapabilities
            capabilities: {
                name  : 'Automated Test - sitecues-js',   // name of the test run, for logging purposes
                build : build                             // useful to log success history tied to code changes
            },
            // Places where unit and/or functional tests will be run...
            environments: [
                // local-style...
                // {
                //     browserName: 'phantomjs',  // command line browser, very fast for tests
                //     // pretend to be Chrome, to avoid fallbacks...
                //     'phantomjs.page.settings.userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
                // },
                // { browserName: 'safari' },
                 { browserName: 'firefox' },
             //   { browserName: 'chrome' }
                // BrowserStack-style...
                // { os: 'Windows', os_version: '10',       browser: 'edge',    browser_version: '12.0' },
                // { os: 'Windows', os_version: '10',       browser: 'firefox', browser_version: '40.0' },
                // { os: 'Windows', os_version: '10',       browser: 'chrome',  browser_version: '44.0' },
                // { os: 'OS X',    os_version: 'Yosemite', browser: 'safari',  browser_version: '8.0' },
                // SauceLabs-style...
                // { platform: 'Windows 10', browserName: 'internet explorer', version: '11' },
                // { platform: 'Windows 10', browserName: 'firefox',           version: '40' },
                // { platform: 'Windows 10', browserName: 'chrome',            version: '44' },
                // { platform: 'OS X 10.10', browserName: 'safari',            version: '8' }
            ],

            maxConcurrency: 3,  // how many browsers may be open at once

            // Specify which AMD module loader to use...
          //   loaders: {
            //    packages: ['node']
             //},
            // Options to pass to the AMD module loader...
            loaderOptions: {
                baseUrl: 'source/js',
                packages: [
                    { name: 'unit', location: testDir + 'unit' },
                    { name: 'functional', location: testDir + 'functional' },
                    { name: 'page-object', location: testDir + 'page-object', main: 'index' }
                ]
            },

            // Each cloud testing service has their own weird quirks and different APIs,
            // so load up the necessary configuration to talk to them...
            tunnel: 'NullTunnel',         // no tunnel (default, if none provided)
            // tunnel: 'BrowserStackTunnel', // BrowserStack
            // tunnel: 'SauceLabsTunnel',    // SauceLabs
            // tunnel: 'TestingBotTunnel',   // TestingBot
            tunnelOptions: {
                host: 'localhost:4447'  // custom location to find the selenium server
                // verbose: true           // more logging, only supported by BrowserStack
            },

            // These are unit tests, which check the APIs of our application...
            suites: testSuites.unit,
            // These are functional tests, which check the user-facing behavior of our application...
            //functionalSuites: testSuites.functional,

            // Any test IDs ("suite name - test name") which do NOT match this regex will be skipped...
            grep: /.*/,

            // The paths that match this regex will NOT be included in code coverage reports...
            excludeInstrumentation: /^(?:config|test|node_modules)\//

            //Disabled Node.js dependent reporter for running in the browser
            /*// How to display or save test run info.
            reporters: [
                // Test result reporters.
                { id : 'Runner' }
                // { id : 'JUnit',    filename : 'report/test/junit.xml' },
                // // Code coverage reporters.
                // { id : 'Cobertura', filename  : 'report/coverage/info/cobertura.info' },
                // { id : 'Lcov',      filename  : 'report/coverage/info/lcov.info' },
                // { id : 'LcovHtml',  directory : 'report/coverage/html' }
            ]*/
        };
    });