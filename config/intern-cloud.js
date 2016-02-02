// This module modifies the configuration for the testing framework to use cloud platforms.

define(
    [   // dependencies....
        './intern'  // base configuration
    ],
    function (test) {

        'use strict';

        // Setting properties on the test object here overrides the base configuration.
        // Best practice is to set only what needs to be different.

        // test.proxyPort = 9000;
        // test.proxyUrl = 'http://localhost:9000/';

        // test.capabilities = {
        //     // See examples: https://code.google.com/p/selenium/wiki/DesiredCapabilities
        //     'name': 'Automated Test - sitecues-js',  // name of the test run, for logging purposes
        //     'selenium-version': '2.45.0',            // request a version, which may not always be respected
        //     'build': build                           // useful to log success history tied to code changes
        // };
        // BrowserStack accepts this as a category for the build.
        test.capabilities.project = 'sitecues-js';

        // Places where unit and/or functional tests will be run...
        test.environments = [
            // local-style...
            // {
            //     browserName: 'phantomjs',  // command line browser, very fast for tests
            //     // pretend to be Chrome, to avoid fallbacks...
            //     'phantomjs.page.settings.userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
            // }
            // { browserName: 'safari' },
            // { browserName: 'firefox' },
            // { browserName: 'chrome' }
            // BrowserStack-style...
            // { os: "Windows", os_version: '7',        browser: 'ie',      browser_version: '9.0' },
            // { os: "Windows", os_version: '7',        browser: 'ie',      browser_version: '10.0' },
            // { os: "Windows", os_version: '8.1',      browser: 'ie',      browser_version: '11.0' },
            // { os: 'Windows', os_version: '8.1',      browser: 'firefox', browser_version: '41.0' },
            // { os: 'Windows', os_version: '8.1',      browser: 'chrome',  browser_version: '46.0' },
            // { os: "Windows", os_version: '10',       browser: 'ie',      browser_version: '11.0' },
            // { os: 'Windows', os_version: '10',       browser: 'edge',    browser_version: '12.0' },
            //{ os: 'Windows', os_version: '10',       browser: 'firefox', browser_version: '41.0' },
            { os: 'Windows', os_version: '10',       browser: 'chrome',  browser_version: '46.0' },
            // { os: 'OS X',    os_version: 'Yosemite', browser: 'safari',  browser_version: '8.0' },
            //{ os: 'OS X',    os_version: 'Yosemite', browser: 'firefox', browser_version: '41.0' },
            //{ os: 'OS X',    os_version: 'Yosemite', browser: 'chrome',  browser_version: '46.0' }
            // SauceLabs-style...
            // { platform: 'Windows 10', browserName: 'internet explorer', version: '11' },
            // { platform: 'Windows 10', browserName: 'firefox',           version: '41' },
            // { platform: 'Windows 10', browserName: 'chrome',            version: '46' },
            // { platform: 'OS X 10.10', browserName: 'safari',            version: '8' },
            // { platform: 'OS X 10.10', browserName: 'firefox',           version: '41' },
            // { platform: 'OS X 10.10', browserName: 'chrome',            version: '46' }
        ];

        test.maxConcurrency = 10;  // how many browsers may be open at once

        // Specify which AMD module loader to use...
        // test.loaders = {

        // };
        // Options to pass to the AMD module loader...
        // test.loaderOptions = {
        //     packages: [
        //         { name: 'unit', location: testDir + 'unit' },
        //         { name: 'functional', location: testDir + 'functional' }
        //     ]
        // };

        // Each cloud testing service has their own weird quirks and different APIs,
        // so load up the necessary configuration to talk to them...
        // test.tunnel = 'NullTunnel';         // no tunnel (default, if none provided)
        test.tunnel = 'BrowserStackTunnel';
        // test.tunnel = 'SauceLabsTunnel';
        // test.tunnel = 'TestingBotTunnel';
        test.tunnelOptions = {
            // host: 'localhost:4447',  // custom location to find the selenium server
            // verbose: true            // more logging, only supported by BrowserStack
        };

        // These are unit tests, which check the APIs of our application...
        // test.suites = [
        //     'test/unit/common'
        // ];
        // These are functional tests, which check the user-facing behavior of our application...
        // test.functionalSuites = [

        // ];

        // Any test IDs ("suite name - test name") which do NOT match this regex will be skipped...
        // test.grep = /.*/;

        // The paths that match this regex will NOT be included in code coverage reports...
        // test.excludeInstrumentation = /^(?:config|test|node_modules)\//;

        // Returns the modified settings...
        return test;
    }
);
