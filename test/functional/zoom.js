// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
    [
        'intern',
        'test/util/page-viewer',
        'test/util/keyboard',
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/dojo/node!chai',              // helps throw errors to fail tests, based on conditions
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'page-object',
        'test/util/url'
    ],
    function (intern, pageViewer, keyboard, tdd, chai, keys, pageObject, testUrl) {

        'use strict';

        const
            assert = chai.assert,
            suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before,
            beforeEach = tdd.beforeEach;

        suite('Zoom controls', function () {
            let remote, capabilities, badge, panel;

            // Code to run when the suite starts, before any test.
            before(function () {
                remote       = this.remote;
                capabilities = remote.session._capabilities;
                badge = pageObject.createBadge(remote);
                panel = pageObject.createPanel(remote);

                return remote               // represents the browser being tested
                    .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
                    // NOTE: Page load timeouts are not yet supported in SafariDriver.
                    //       However, we are not testing Safari at the moment.
                    .setPageLoadTimeout(2000)
                    .setFindTimeout(2000)
                    .setExecuteAsyncTimeout(7000);  // max ms for executeAsync calls to complete
            });

            beforeEach(function () {
                return remote
                    .get(testUrl('simple.html'))
                    .clearCookies()
                    .execute(function () {
                        localStorage.clear();
                    })
            });

            test('Plus key held to zoom up', function () {
                var oldRect, selector;

                return pageViewer
                    .getRectAndSelectorOfVisibleElementInBody(remote)
                    .then(function (data) {
                        assert.strictEqual(
                            data.length,
                            2,
                            data[0]
                        );
                        console.log('selector and rect', data);
                        oldRect  = data[0];
                        selector = data[1];
                    })
                    .then(function () {
                        const EQUALS_CODE = 187,
                              EQUALS_CHAR = '=';
                        return keyboard.holdKey(remote, EQUALS_CODE, EQUALS_CHAR);
                    })
                    .then(function () {
                        return pageViewer.waitForElementToFinishAnimating(remote, selector, 8000, 200);
                    })
                    .then(function () {
                        return remote
                            .execute(function (selector) {
                                return document.querySelector(selector).getBoundingClientRect();
                            }, [selector]);
                    })
                    .then(function (zoomRect) {
                        const ARBITRARILY_LARGE_SCALE = 20;
                        assert.isAtMost(
                            zoomRect.height,
                            oldRect.height * ARBITRARILY_LARGE_SCALE,
                            'Zoomed element\'s bounding rect\'s height should be reasonably small'
                        );
                        assert.isAtMost(
                            zoomRect.width,
                            oldRect.width * ARBITRARILY_LARGE_SCALE,
                            'Zoomed element\'s bounding rect\'s width should be reasonably small'
                        );
                        assert.isAbove(
                            zoomRect.width,
                            oldRect.width,
                            'Zoomed element\'s bounding width must be greater than original bounding width'
                        );
                        assert.isAbove(
                            zoomRect.height,
                            oldRect.height,
                            'Zoomed element\'s bounding height must be greater than original bounding height'
                        );
                    });
            });

            test('Click on big A to zoom in', function () {
                return panel.clickLargeA(100);
            });
        });
    }
);
