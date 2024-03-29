// This is the base configuration for the testing framework.
// You can import and extend it for special use cases.

define(
    [],
    function () {
        'use strict';

        var proxyPort = 9000;
        // This path is relative to baseUrl.
        var testDir = '../../test/';
        // Name of the alias to the unit suite directory.
        var UNIT_PKG = 'unit';
        // Name of the alias to the functional suite directory.
        var FUNC_PKG = 'functional';

        return {
            proxyPort : proxyPort,
            proxyUrl  : 'http://localhost:' + proxyPort + '/',

            // Places where unit and/or functional tests will be run.
            environments : [
                // { browserName : 'firefox' },
                // { browserName : 'safari' },
                { browserName : 'chrome' }
            ],

            // How many browsers may be open at once.
            maxConcurrency : 1,

            // Use a custom AMD module loader.
            // loaders : {
            //
            // },
            // Configure the AMD module loader.
            loaderOptions : {
                baseUrl : 'source/js',
                packages : [
                    { name : 'core',        location: testDir + 'core'},
                    { name : 'test',        location: testDir },
                    { name : UNIT_PKG,      location: testDir + 'unit' },
                    { name : FUNC_PKG,      location: testDir + 'functional' },
                    { name : 'page-object', location: testDir + 'page-object', main : 'index' },
                    { name : 'utility',     location: testDir + 'util',        main : 'index' }
                ]
            },

            // The provider for a WebDriver server.
            tunnel : 'SeleniumTunnel',
            // tunnelOptions : {
            //     host : 'localhost:4447'  // custom location to find the selenium server
            // },

            // Which unit test suite files to load. These check our APIs.
            suites : [
                UNIT_PKG + '/**/*.js'
            ],
            // Which functional test suite files to load. These check our
            // user-facing behavior.
            // TODO: Fix and re-enable functional tests.
            // functionalSuites : [
            //     FUNC_PKG + '/**/*.js'
            // ],

            // Test whitelist regex. Only test IDs ('suite name - test name')
            // that match this pattern will run, all others will be skipped.
            // grep : /.*/,

            // Ignore some code from test coverage reports, even if it loads
            // during testing. The paths that match this pattern will NOT
            // count against coverage.
            excludeInstrumentation : /^(?:config|test|node_modules)\//

            // How to display or save test run info.
            // reporters : [
            //     // Test result reporters.
            //     { id : 'Runner' }
            //     // { id : 'JUnit',    filename : 'report/test/junit.xml' },
            //     // // Code coverage reporters.
            //     // { id : 'Cobertura', filename  : 'report/coverage/info/cobertura.info' },
            //     // { id : 'Lcov',      filename  : 'report/coverage/info/lcov.info' },
            //     // { id : 'LcovHtml',  directory : 'report/coverage/html' }
            // ]
        };
    }
);
