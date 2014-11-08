// Herein lies the base configuration for the testing framework.
// Other files can use this as an AMD module.

define(
    [], // dependencies
    function () {

        var proxyPort = 9000;

        return {
            proxyPort: proxyPort,
            proxyUrl: 'http://localhost:' + proxyPort + '/',

            capabilities: {
                // See examples: https://code.google.com/p/selenium/wiki/DesiredCapabilities
                'name': 'Automated tests - sitecues.js',  // name of the test run, for logging purposes
                'selenium-version': '2.43.1'           // request a version, which may not always be respected
            },
            // Places where unit and/or functional tests will be run...
            environments: [
                // local-style...
                // {
                //     browserName: 'phantomjs',  // command line browser, very fast for tests
                //     // pretend to be Chrome, to avoid fallbacks...
                //     'phantomjs.page.settings.userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
                // },
                { browserName: 'chrome' }
                // { browserName: 'firefox' }
                // { browserName: 'safari' }
                // BrowserStack-style...
                // { os: 'Windows', os_version: '8.1',       browser: 'chrome',  browser_version: '36.0' },
                // { os: 'Windows', os_version: '8.1',       browser: 'firefox', browser_version: '31.0' },
                // { os: "Windows", os_version: '8.1',       browser: 'ie',      browser_version: '11.0' },
                // { os: 'OS X',    os_version: 'Mavericks', browser: 'safari',  browser_version: '7.0' }
                // SuaceLabs-style...
                // { platform: 'Windows 8.1', browserName: 'chrome',            version: '36' },
                // { platform: 'Windows 8.1', browserName: 'firefox',           version: '31' },
                // { platform: 'Windows 8.1', browserName: 'internet explorer', version: '11' },
                // { platform: 'OS X 10.9',   browserName: 'safari',            version: '7' }
            ],

            maxConcurrency: 1,  // how many browsers may be open at once

            // Options to pass to the AMD module loader...
            loader: {

            },

            // Each cloud testing service has their own weird quirks and different APIs,
            // so load up the necessary configuration to talk to them...
            tunnel: 'NullTunnel',         // no tunnel (default, if none provided)
            // tunnel: 'TestingBotTunnel';   // TestingBot
            // tunnel: 'SauceLabsTunnel';    // SauceLabs
            // tunnel: 'BrowserStackTunnel'; // BrowserStack
            tunnelOptions: {
                host: '127.0.0.1:4447'  // custom location to find the selenium server
                // verbose: true           // more logging, only supported by BrowserStack
            },

            // These are unit tests, which check the APIs of our application...
            suites: [
                // 'test/unit/foobar'
            ],
            // These are functional tests, which check the user-facing behavior of our application...
            functionalSuites: [
                'test/functional/simple'
            ],

            // The paths that match this regex will NOT be included in code coverage reports...
            excludeInstrumentation: /^(?:config|test|node_modules)\//
        }
    }
);
