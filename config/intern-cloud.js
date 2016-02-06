// This module modifies the configuration for the testing framework to use cloud platforms.

define(
    [   // dependencies....
        './intern'  // base configuration
    ],
    function (test) {

        'use strict';

        // Setting properties on the test object here overrides the base configuration.
        // Best practice is to set only what needs to be different.

        // BrowserStack accepts this as a category for the build.
        test.capabilities.project = 'sitecues-js';

        // Places where unit and/or functional tests will be run...
        test.environments = [
            // BrowserStack-style...
            // Get latest: https://www.browserstack.com/automate/browsers.json
            // { os: "Windows", os_version: '7',          browser: 'ie',      browser_version: '10.0' },
            // { os: "Windows", os_version: '7',          browser: 'ie',      browser_version: '11.0' },
            { os: 'Windows', os_version: '7',          browser: 'firefox', browser_version: '44.0' },
            { os: 'Windows', os_version: '7',          browser: 'chrome',  browser_version: '48.0' },
            // { os: "Windows", os_version: '10',         browser: 'ie',      browser_version: '11.0' },
            // { os: 'Windows', os_version: '10',         browser: 'edge',    browser_version: '12.0' },
            { os: 'Windows', os_version: '10',         browser: 'firefox', browser_version: '44.0' },
            { os: 'Windows', os_version: '10',         browser: 'chrome',  browser_version: '48.0' },
            // { os: 'OS X',    os_version: 'El Capitan', browser: 'safari',  browser_version: '9.0' },
            { os: 'OS X',    os_version: 'El Capitan', browser: 'firefox', browser_version: '44.0' },
            { os: 'OS X',    os_version: 'El Capitan', browser: 'chrome',  browser_version: '48.0' }
            // SauceLabs-style...
            // { platform: 'Windows 10', browserName: 'internet explorer', version: '11' },
            // { platform: 'Windows 10', browserName: 'firefox',           version: '44' },
            // { platform: 'Windows 10', browserName: 'chrome',            version: '48' },
            // { platform: 'OS X 10.11', browserName: 'safari',            version: '9' },
            // { platform: 'OS X 10.11', browserName: 'firefox',           version: '44' },
            // { platform: 'OS X 10.11', browserName: 'chrome',            version: '48' }
        ];

        // How many browsers may be open at once.
        test.maxConcurrency = 10;

        // Each cloud testing service has their own weird quirks and different APIs,
        // so load up the necessary configuration to talk to them.
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
