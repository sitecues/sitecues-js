define(
    [
        './intern'
    ],
    function (test) {
        test.environments = [
            // BrowserStack-style...
            // { os: "Windows", os_version: "8.1", browser: "chrome", browser_version: "34.0" }
            // SauceLabs-style...
            // { platform: 'Windows 8.1', browserName: 'internet explorer', version: '11' }
            // { platform: 'Windows 8', browserName: 'internet explorer', version: '10' },
            // { platform: 'Windows 7', browserName: 'internet explorer', version: '9' },
            // { platform: [ 'OS X 10.6', 'Windows 7', 'Linux' ], browserName: 'firefox', version: '25' },
            { platform: 'Windows 7', browserName: 'chrome', version: '31' }
            // { platform: 'Linux', browserName: 'chrome', version: '30' },
            // { platform: 'OS X 10.8', browserName: 'chrome', version: '27' },
            // { platform: 'OS X 10.8', browserName: 'safari', version: '6' }
        ];

        // Each cloud testing service has their own weird quirks
        // and different APIs, so load up the necessary config...
        // test.tunnel = 'NullTunnel';         // same as no tunnel at all
        // test.tunnel = 'TestingBotTunnel';   // TestingBot
        // test.tunnel = 'SauceLabsTunnel';    // SauceLabs
        test.tunnel = 'SauceLabsTunnel'; // BrowserStack
        // More logging, only supported by BrowserStack...
        // test.tunnelOptions - {
        //     verbose: true
        // };

        // Returns the modified settings...
        return test;
    }
);
