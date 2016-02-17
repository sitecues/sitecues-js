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

            test('Plus key held to zoom in', function () {
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
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.strictEqual(
                                xTrans,
                                3,
                                'Body should be have an x transformation of 3'
                            );
                            assert.strictEqual(
                                yTrans,
                                3,
                                'Body should have a y transformation of 3'
                            );
                        })
                        .end();
            });


            test('Plus key held to zoom in, minus key held to zoom out', function () {
                return input
                    .holdKey('=')
                    .then(function () {
                        return wait
                            .forTransformToComplete('body', 8000, 25);
                    })
                    .then(function () {
                        return input
                            // TODO: Can we get this value from Leadfoot/keys
                            .holdKey('-');
                    })
                    .then(function () {
                        return wait
                            .forTransformToComplete('body', 8000, 25);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.strictEqual(
                                xTrans,
                                1,
                                'Body should be have an x transformation of 1'
                            );
                            assert.strictEqual(
                                yTrans,
                                1,
                                'Body should have a y transformation of 1'
                            );
                        })
                        .end();
            });


            test('Click on big A to zoom in', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel
                            .pressLargeA();
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.strictEqual(
                                xTrans,
                                3,
                                'Body should be have an x transformation of 3'
                            );
                            assert.strictEqual(
                                yTrans,
                                3,
                                'Body should have a y transformation of 3'
                            );
                        })
                        .end();
            });

            test('Click on big A to zoom in, click on small A to zoom out', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel
                            .pressLargeA();
                    })
                    .then(function () {
                        return panel
                            .pressSmallA();
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.strictEqual(
                                xTrans,
                                1,
                                'Body must have an x transformation of 1'
                            );
                            assert.strictEqual(
                                yTrans,
                                1,
                                'Body must have a y transformation of 1'
                            );
                        })
                        .end();
            });

            test('Drag slider to fully zoomed position', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel
                            .dragSliderThumb(3);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.closeTo(
                                xTrans,
                                3,
                                .2,
                                'Body should be have an x transformation of 3'
                            );
                            assert.closeTo(
                                yTrans,
                                3,
                                .2,
                                'Body should have a y transformation of 3'
                            );
                            assert.isAtMost(
                                xTrans,
                                3,
                                'Body should be have an x transformation less than or equal to 3'
                            );
                            assert.isAtMost(
                                yTrans,
                                3,
                                'Body should have a y transformation less than or equal to 3'
                            );
                        })
                        .end();
            });

            test('Drag slider to fully zoomed position, drag slider back to zoom 1', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel
                            .dragSliderThumb(3);
                    })
                    .then(function () {
                        return panel
                            .dragSliderThumb(1);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.closeTo(
                                xTrans,
                                1,
                                .2,
                                'Body should be have an x transformation close to 1'
                            );
                            assert.closeTo(
                                yTrans,
                                1,
                                .2,
                                'Body should have a y transformation close to 1'
                            );
                            assert.isAtLeast(
                                xTrans,
                                1,
                                'Body should be have an x transformation greater than or equal to 1'
                            );
                            assert.isAtLeast(
                                yTrans,
                                1,
                                'Body should have a y transformation greater than or equal to 1'
                            );
                        })
                        .end();
            });

            test('Click in the middle of slider to zoom', function () {
                return badge
                    .openPanel()
                    .then(function () {
                        return panel
                            .clickSliderBar(2);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.isAbove(
                                xTrans,
                                1,
                                'Body should be have an x transformation greater than 1'
                            );
                            assert.isAbove(
                                yTrans,
                                1,
                                'Body should have a y transformation greater than 1'
                            );
                        })
                        .end();
            });

            test('Ctrl + wheel up to zoom in', function () {
                return input
                    .ctrlWheel('up', 10)
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.closeTo(
                                xTrans,
                                3,
                                .2,
                                'Body should be have an x transformation close to 3'
                            );
                            assert.closeTo(
                                yTrans,
                                3,
                                .2,
                                'Body should have a y transformation close to 3'
                            );
                            assert.isAtMost(
                                yTrans,
                                3,
                                'Body can\'t have a y transformation greater than 3'
                            );
                            assert.isAtMost(
                                xTrans,
                                3,
                                'Body can\'t have a x transformation greater than 3'
                            );
                        })
                        .end();
            });

            test('Ctrl + wheel up to zoom in, Ctrl + wheel down to zoom out', function () {
                return input
                    .ctrlWheel('up', 10)
                    .then(function () {
                        return input
                            .ctrlWheel('down', 10);
                    })
                    .findByCssSelector('body')
                        .getComputedStyle('transform')
                        .then(function (transform) {
                            let matrix = transform.substring(7).split(','),
                                xTrans = Number(matrix[0]),
                                yTrans = Number(matrix[3]);
                            assert.closeTo(
                                xTrans,
                                1,
                                .2,
                                'Body should be have an x transformation close to 1'
                            );
                            assert.closeTo(
                                yTrans,
                                1,
                                .2,
                                'Body should have a y transformation close to 1'
                            );
                            assert.isAtLeast(
                                yTrans,
                                1,
                                'Body can\'t have a y transformation less than 1'
                            );
                            assert.isAtLeast(
                                xTrans,
                                1,
                                'Body can\'t have a x transformation less than 1'
                            );
                        })
                        .end();
            })
        });
    }
);
