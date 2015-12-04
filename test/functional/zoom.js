// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
    [
        'intern',
        'utility',
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/dojo/node!chai',              // helps throw errors to fail tests, based on conditions
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'page-object'
    ],
    function (intern, utility, tdd, chai, keys, pageObject) {

        'use strict';

        const
            assert = chai.assert,
            suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before,
            afterEach = tdd.afterEach,
            beforeEach = tdd.beforeEach;

        suite('Zoom controls', function () {
            let remote, browser, badge, panel, input, viewer;

            // Code to run when the suite starts, before any test.
            before(function () {
                remote  = this.remote;
                browser = utility.createBrowser(remote);
                input   = utility.createUserInput(remote, browser);
                viewer  = utility.createPageViewer(remote, browser);
                badge   = pageObject.createBadge(remote);
                panel   = pageObject.createPanel(remote, viewer, input, browser);
                return remote               // represents the browser being tested
                    .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
                    // NOTE: Page load timeouts are not yet supported in SafariDriver.
                    //       However, we are not testing Safari at the moment.
                    .setPageLoadTimeout(6000)
                    .setFindTimeout(2000)
                    .setExecuteAsyncTimeout(7000);  // max ms for executeAsync calls to complete
            });

            beforeEach(function () {
                return remote
                    .get('http://ws.sitecues.com')
                    .clearCookies()
                    .get('http://js.sitecues.com')
                    .clearCookies()
                    .get('http://up.sitecues.com')
                    .clearCookies()
                    .get('http://www.ticc.com/')
            });

            afterEach(function () {
                return remote
                    .execute(function () {
                        localStorage.clear();
                    })
            });

            test('Plus key held to zoom in', function () {
                const EQUALS_CODE = 187,
                      EQUALS_CHAR = '=';

                return input
                    .holdKey(EQUALS_CODE, EQUALS_CHAR)
                    .then(function () {
                        return viewer
                            .waitForTransformToStabilize('body', 8000, 200)
                            .then(function () {
                                return browser.getTransformAttributeString();
                            })
                            .then(function (tform) {
                                return remote
                                    .execute(function (transform) {
                                        return getComputedStyle(document.body)[transform];
                                    }, [tform])
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
                            })
                    });
            });


            test('Plus key held to zoom in, minus key held to zoom out', function () {
                return remote
                    .then(function () {
                        const EQUALS_CODE = 187,
                            EQUALS_CHAR = '=';
                        return input.holdKey(EQUALS_CODE, EQUALS_CHAR);
                    })
                    .then(function () {
                        return viewer
                            .waitForTransformToStabilize('body', 8000, 200)
                    })
                    .then(function () {
                        const MINUS_CODE = 189,
                            MINUS_CHAR = '-';
                        return input
                            .holdKey(MINUS_CODE, MINUS_CHAR)
                            .then(function () {
                                return browser.getTransformAttributeString();
                            });
                    })
                    .then(function (tform) {
                        return viewer
                            .waitForTransformToStabilize('body', 8000, 200)
                            .execute(function (transform) {
                                return getComputedStyle(document.body)[transform];
                            }, [tform])
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
                    });
            });


            test('Press big A to zoom in', function () {
                return panel
                    .pressLargeA()
                    .then(function () {
                        return browser.getTransformAttributeString();
                    })
                    .then(function (tform) {
                        return remote
                            .execute(function (transform) {
                                return getComputedStyle(document.body)[transform];
                            }, [tform])
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
                    })
            });

            test('Click on big A to zoom in, click on small A to zoom out', function () {
                return panel
                    .pressLargeA()
                    .then(function () {
                        return browser.getTransformAttributeString();
                    })
                    .then(function (tform) {
                        return panel
                            .pressSmallA()
                            .execute(function (transform) {
                                return getComputedStyle(document.body)[transform];
                            }, [tform])
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
                    });
            });

            test('Drag slider to fully zoomed position', function () {

                return panel
                    .dragSlider(3)
                    .then(function () {
                        return browser.getTransformAttributeString();
                    })
                    .then(function (tform) {
                        return remote
                            .execute(function (transform) {
                                return getComputedStyle(document.body)[transform];
                            }, [tform])
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
                    })
            });

            test('Drag slider to fully zoomed position, drag slider back to zoom 1', function () {
                return panel
                    .dragSlider(3)
                    .then(function () {
                        return panel
                            .dragSlider(1);
                    })
                    .then(function () {
                        return browser.getTransformAttributeString();
                    })
                    .then(function (tform) {
                        return remote
                            .execute(function (transform) {
                                return getComputedStyle(document.body)[transform];
                            }, [tform])
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
                    })
            })




        });
    }
);
