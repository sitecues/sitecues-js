// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
    [
        'intern',
        'intern/dojo/node!leadfoot/helpers/pollUntil',
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/dojo/node!chai',              // helps throw errors to fail tests, based on conditions
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'page-object'
    ],
    function (intern, pollUntil, tdd, chai, keys, pageObject) {

        'use strict';

        const
            assert = chai.assert,
            suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before,
            beforeEach = tdd.beforeEach,
            URL    = 'http://tools.qa.sitecues.com:9000/site/simple.html' +
                '?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/dev/latest/js/sitecues.js' +
                '&scwsid=s-00000005' +
                '&scuimode=badge';

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
                    .get(URL)
                    .clearCookies()
                    .execute(function () {
                        localStorage.clear();
                    })
            });

            test('Plus key held to zoom up', function () {
                var oldRect, idx;

                return remote
                    .execute(function () {
                        var rect,
                            children = document.body.children;
                        for (var i = 0; i < children.length; i++) {
                            rect = children[i].getBoundingClientRect();
                            if (rect.height > 0 && rect.width > 0) {
                                return [rect, i];
                            }
                        }
                        throw new Error();
                    })
                    .then(function (data) {
                        console.log('data', data);
                        oldRect = data[0];
                        idx     = data[1];
                    })
                    .execute(function (browser) {
                        //keyCode property can not be set in chrome
                        //So in that case we use a generic Event object to trigger keydown
                        //TODO: Refactor code to avoid using deprecated keyCode property

                        var evt,
                            EQUALS = 187;

                        if (browser === 'firefox') {
                            evt = new KeyboardEvent('keydown',
                                {
                                    key : '=',
                                    keyCode : EQUALS,
                                    bubbles : true
                                });
                        }
                        else {
                            evt = document.createEvent('Events');
                            evt.initEvent('keydown', true, true);
                            evt.keyCode = EQUALS;
                        }
                        document.body.dispatchEvent(evt);
                    }, [capabilities.browserName])
                    .then(function () {
                        return remote
                            .then(pollUntil(function (idx) {
                                var transitionRect,
                                    element = document.body.children[idx],
                                    currentRect = element.getBoundingClientRect();
                                if (window.sitecuesTestingNamespace) {
                                    transitionRect = window.sitecuesTestingNamespace.transRect;
                                    window.sitecuesTestingNamespace.transRect = currentRect;
                                    return (transitionRect.width === currentRect.width &&
                                    transitionRect.height === currentRect.height) ? true : null;
                                }
                                else {
                                    window.sitecuesTestingNamespace = { transRect : currentRect };
                                    return null;
                                }
                            }, [idx], 8000, 200))
                    })
                    .then(function () {
                        return remote
                            .execute(function (idx) {
                                window.sitecuesTestingNamespace = undefined;
                                return document.body.children[idx].getBoundingClientRect();
                            }, [idx]);
                    })
                    .then(function (newRect) {
                        assert.isAtMost(
                            newRect.width,
                            oldRect.width * 3.1,
                            'Zoomed element width should not be more than 3.1 times the original width'
                        );
                        assert.isAtMost(
                            newRect.height,
                            oldRect.height * 3.1,
                            'Zoomed element height should not be more than 3.1 times the original height'
                        );
                        assert.isAtLeast(
                            newRect.height,
                            oldRect.height * 2,
                            'Zoomed element height should be at least 2 times the original height'
                        );
                        assert.isAtLeast(
                            newRect.width,
                            oldRect.width * 2,
                            'Zoomed element width should be at least 2 times the original height'
                        );
                    });
            });

            test('Click on big A to zoom up', function () {
                return panel.clickLargeA(10);
            });
        });
    }
);
