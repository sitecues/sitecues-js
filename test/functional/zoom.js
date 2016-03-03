// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
    [
        'intern',
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/dojo/node!chai',              // helps throw errors to fail tests, based on conditions
        'page-object/Panel',
        'page-object/Badge',
        'utility/BrowserUtility',
        'utility/Wait',
        'utility/UserInput',
        'utility/url'
    ],
    function (intern, tdd, chai, Panel, Badge, BrowserUtility, Wait, UserInput, url) {

        'use strict';

        const
            assert = chai.assert,
            suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before,
            afterEach  = tdd.afterEach,
            beforeEach = tdd.beforeEach;

        suite('Zoom controls', function () {

            const testUrl = url('simple.html');

            let remote,
                browserUtil,
                badge,
                panel,
                input,
                wait;

            // Code to run when the suite starts, before any test.
            before(function () {
                // Browser interface
                remote  = this.remote;
                // Test utilities
                browserUtil = new BrowserUtility(remote);  //Browser utilities
                wait    = new Wait(remote, browserUtil);  //Waits for page transformations & events
                input   = new UserInput(remote, browserUtil, wait);
                // UI abstractions
                badge   = new Badge(remote, input, wait);
                panel   = new Panel(remote, browserUtil, input, wait);

                return remote
                    .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
                    .get(testUrl)
                    .then(function () {
                        return wait.forSitecuesToInitialize();
                    })
                    .then(function () {
                        return browserUtil.resetEnvironment();
                    });
            });

            beforeEach(function () {
                return remote
                    // NOTE: Page load timeouts are not yet supported in SafariDriver.
                    //       However, we are not testing Safari at the moment.
                    .setPageLoadTimeout(9000)
                    .setFindTimeout(2000)
                    .setExecuteAsyncTimeout(7000) // max ms for executeAsync calls to complete
                    .get(testUrl)
                    .then(function () {
                        return wait.forSitecuesToInitialize();
                    });
            });

            afterEach(function () {
                return browserUtil.resetEnvironment();
            });

            test('Click in the middle of slider to zoom', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel.clickSliderBar(2);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.closeTo(
                                xScale,
                                2,
                                0.2,
                                'Horizontal zoom must be near slider position'
                            );
                            assert.closeTo(
                                yScale,
                                2,
                                0.2,
                                'Verical zoom must be near slider position'
                            );
                        })
                        .end();
            });

            test('Zoom all the way in and out via holding plus/minus keys', function () {
                return input
                    .holdKey('=')
                    .then(function () {
                        return wait
                            .forTransformToComplete('body', 8000, 25);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);
                            assert.strictEqual(
                                xScale,
                                3,
                                'Horizontal zoom must be identical to slider position'
                            );
                            assert.strictEqual(
                                yScale,
                                3,
                                'Verical zoom must be identical to slider position'
                            );
                        })
                        .end()
                    .then(function () {
                        // TODO: Can we get this value from Leadfoot/keys
                        return input.holdKey('-');
                    })
                    .then(function () {
                        return wait.forTransformToComplete('body', 8000, 25);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.strictEqual(
                                xScale,
                                1,
                                'Horizontal zoom must be identical to slider position'
                            );
                            assert.strictEqual(
                                yScale,
                                1,
                                'Vertical zoom must be identical to slider position'
                            );
                        })
                        .end();
            });

            test('Zoom all the way in and out via holding \"A\"s', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel.pressLargeA();
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.strictEqual(
                                xScale,
                                3,
                                'Horizontal zoom must be identical to slider position'
                            );
                            assert.strictEqual(
                                yScale,
                                3,
                                'Vertical zoom must be identical to slider position'
                            );
                        })
                        .end()
                    .then(function () {
                        return panel
                            .pressSmallA();
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);
                            assert.strictEqual(
                                xScale,
                                1,
                                'Horizontal zoom must be identical to slider position'
                            );
                            assert.strictEqual(
                                yScale,
                                1,
                                'Vertical zoom must be identical to slider position'
                            );
                        })
                        .end();
            });

            test('Zoom all the way in and out via slider drag', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel.dragSliderThumb(3);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.isAtMost(
                                xScale,
                                3,
                                'Horizontal zoom must be within slider range'
                            );
                            assert.isAtMost(
                                yScale,
                                3,
                                'Vertical zoom must be within slider range'
                            );
                            assert.closeTo(
                                xScale,
                                3,
                                0.2,
                                'Horizontal zoom must be near slider position'
                            );
                            assert.closeTo(
                                yScale,
                                3,
                                0.2,
                                'Vertical zoom must be near slider position'
                            );
                        })
                        .end()
                    .then(function () {
                        return panel.dragSliderThumb(1);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.isAtLeast(
                                xScale,
                                1,
                                'Horizontal zoom must be within slider range'
                            );
                            assert.isAtLeast(
                                yScale,
                                1,
                                'Vertical zoom must be within slider range'
                            );
                            assert.closeTo(
                                xScale,
                                1,
                                0.2,
                                'Horizontal zoom must be near slider position'
                            );
                            assert.closeTo(
                                yScale,
                                1,
                                0.2,
                                'Vertical zoom must be near slider position'
                            );
                        })
                        .end();
            });

            test('Zoom all the way in and out via Cntrl + wheel', function () {
                return input
                    .ctrlWheel('up', 10)
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.isAtMost(
                                xScale,
                                3,
                                'Horizontal zoom must be within slider range'
                            );
                            assert.isAtMost(
                                yScale,
                                3,
                                'Vertical zoom must be within slider range'
                            );
                            assert.closeTo(
                                xScale,
                                3,
                                0.2,
                                'Horizontal zoom must be near slider position'
                            );
                            assert.closeTo(
                                yScale,
                                3,
                                0.2,
                                'Vertical zoom must be near slider position'
                            );
                        })
                        .end()
                    .then(function () {
                        return input.ctrlWheel('down', 10);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {

                            let matrix = transform.substring(7).split(','),
                                xScale = Number(matrix[0]),
                                yScale = Number(matrix[3]);

                            assert.isAtLeast(
                                xScale,
                                1,
                                'Horizontal zoom must be within slider range'
                            );
                            assert.isAtLeast(
                                yScale,
                                1,
                                'Veetical zoom must be within slider range'
                            );
                            assert.closeTo(
                                xScale,
                                1,
                                0.2,
                                'Horizontal zoom must be near slider position'
                            );
                            assert.closeTo(
                                yScale,
                                1,
                                0.2,
                                'Verical zoom must be near slider position'
                            );
                        })
                        .end();
            })
        });
    }
);
