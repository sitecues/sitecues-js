// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14
define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'intern/dojo/node!leadfoot/keys',
        'intern/dojo/node!fs',
        'page-object/Highlight',
        'page-object/Lens',
        'utility/Wait',
        'utility/BrowserUtility',
        'utility/url'
    ],
    function (tdd, assert, keys, fs, Highlight, Lens, Wait, BrowserUtil, url) {

        'use strict';

            const
                testUrl    = url('simple.html'),
                suite      = tdd.suite,
                test       = tdd.test,
                before     = tdd.before,
                afterEach  = tdd.afterEach,
                beforeEach = tdd.beforeEach;

        suite('Lens', function () {

            const
                picked = {
                    selector: 'p'
                };

            let highlight,
                lens,
                browserUtil,
                wait;

            // Code to run when the suite starts, before any test.
            before(function () {
                // Browser interface.
                const remote = this.remote;
                // Local storage, transform property strings, namespace management.
                browserUtil = new BrowserUtil(remote);
                // Utils for promising sitecues events and element transformations.
                wait        = new Wait(remote);
                // Feature abstractions.
                highlight = new Highlight(remote, wait);
                lens      = new Lens(remote, wait);
                return remote
                    .setWindowPosition(0, 0)
                    // Best effort to normalize window sizes (not every browser opens the same)
                    // TODO: Set size by getting dimensions from client-side screen.availHeight, etc.
                    // .setWindowSize(1440, 873)
                    .maximizeWindow()
                    // Navigate to the desired page.
                    .get(testUrl)
                    .then(function () {
                        return wait.forSitecuesToInitialize();
                    })
                    .then(function () {
                        return browserUtil.clearSitecuesUserPreferences();
                    })
                    // Turn ttsOn, so that sitecues is on, so that we can use mouse highlight
                    .then(function () {
                        return browserUtil.setSitecuesUserPreference('ttsOn', true);
                    });
            });

            // Code to run prior to each individual test in this suite.
            beforeEach(function () {
                return this.remote
                    // NOTE: Page load timeouts are not yet supported in SafariDriver.
                    //       However, we are not testing Safari at the moment.
                    .setPageLoadTimeout(2000)
                    .setFindTimeout(2000)
                    .setExecuteAsyncTimeout(5000)  // max ms for executeAsync calls to complete
                    .get(testUrl)   // navigate to the desired page
                    .then(function () {
                        return wait.forSitecuesToInitialize();
                    });
            });

            // Code to run after to each individual test in this suite.
            afterEach(function () {
                return browserUtil
                    .resetEnvironment()
                    .then(function () {
                        return browserUtil.setSitecuesUserPreference('ttsOn', true);
                    });
            });

            // -------- test boundary --------

            test('Spacebar Toggles the Lens', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)
                        .then(function (element) {
                            assert.isObject(element, 'Lens exists');
                        })
                        .end()
                    .then(function () {
                        return lens.close();
                    })
                    .execute(
                        function (id) {
                            return document.getElementById(id);
                        },
                        [Lens.ID]
                    )
                    .then(function (data) {
                        assert.isNull(data, 'Lens no longer exists');
                    });
            });

            // -------- test boundary --------

            test('Lens is Displayed', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)
                        .isDisplayed()
                        .then(function (isDisplayed) {
                            assert.isTrue(
                                isDisplayed,
                                'Lens must be displayed to be useful'
                            );
                        })
                        .end();
            });

            // -------- test boundary --------

            test('Lens is Inside Viewport', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .execute(
                        function (id) {
                            return {
                                lens : document.getElementById(id).getBoundingClientRect(),
                                viewport : {
                                    'left'  : 0,
                                    'top'   : 0,
                                    'right' : innerWidth,
                                    'bottom': innerHeight
                                }
                            };
                        },
                        [Lens.ID]
                    )
                    .then(function (data) {
                        assert.isAbove(
                            data.lens.left,
                            data.viewport.left,
                            'Lens must be inside the viewport to be seen'
                        );
                        assert.isAbove(
                            data.lens.top,
                            data.viewport.top,
                            'Lens must be inside the viewport to be seen'
                        );
                        assert.isBelow(
                            data.lens.right,
                            data.viewport.right,
                            'Lens must be inside the viewport to be seen'
                        );
                        assert.isBelow(
                            data.lens.bottom,
                            data.viewport.bottom,
                            'Lens must be inside the viewport to be seen'
                        );
                    });
            });

            // -------- test boundary --------

            test('Lens Respects Text', function () {

                let pageText;

                return this.remote
                    .findByCssSelector(picked.selector)
                        .getVisibleText()
                        .then(function (text) {
                            pageText = text;
                        })
                        .end()
                    .then(function () {
                        return highlight.bySelector(picked.selector);
                    })
                    .then(function () {
                        return lens.open();       // get the Lens!
                    })
                    .findById(Lens.ID)
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(
                                text,
                                pageText,
                                'The Lens must contain the same text as the picked element'
                            );
                        })
                        .end();
            });

            // -------- test boundary --------

            test('Lens Has Good Computed Styles', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)       // get the Lens!
                        .getComputedStyle('position')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                'absolute',
                                'Lens must be positioned absolutely, so it does not affect the page'
                            );
                        })
                        .getComputedStyle('borderWidth')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                '3px',
                                'Lens must have a specific border width, so it looks nice'
                            );
                        })
                        .getComputedStyle('zIndex')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                '2147483644',
                                'Lens must have a high zIndex, so it\'s visible'
                            );
                        })
                        .getComputedStyle('boxSizing')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                'content-box',
                                'Lens must consistently calculate its width and height'
                            );
                        })
                        .end();
            });

            // -------- test boundary --------

            test('Lens Has No Class', function () {
                let originalClass;

                return this.remote
                    .findByCssSelector(picked.selector)
                        .getAttribute('class')
                        .then(function (className) {
                            // We store the original classes so that we can restore
                            // them later after messing with them.
                            originalClass = className;
                        })
                        .end()
                    .execute(function (selector) {
                        document.querySelector(selector).className = 'testClass';
                    },[picked.selector])
                    .then(function () {
                        return highlight.bySelector(picked.selector);
                    })
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)    // get the Lens!
                        .getAttribute('class')
                        .then(function (data) {
                            assert.isNull(data, 'Lens element does not have a class');
                        })
                        .end()
                    .execute(
                        function (selector, className) { // run the given code in the remote browser
                            document.querySelector(selector).className = className;
                        },
                        [picked.selector, originalClass]
                    );
            });

            // -------- test boundary --------

            test('Lens is a <ul> if picked element is a <li>', function () {

                return highlight
                    .bySelector('li', true)
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)          // get the Lens!
                        .getProperty('tagName')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                'UL',
                                'Lens must be a valid standalone DOM element, to make browsers happy'
                            );
                        })
                        .end();
            });

            // -------- test boundary --------

            test('Escape Closes the Lens', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .pressKeys(keys.ESCAPE)
                    .waitForDeletedById(Lens.ID)
                    .execute(
                        function (id) {
                            return document.querySelector('#' + id);
                        },
                        [Lens.ID]
                    )
                    .then(function (data) {
                        assert.isNull(data, 'Lens no longer exists.');
                    });
            });

            // -------- test boundary --------

            test('Lens Copies <textarea> Value', function () {

                const
                    selector = 'textarea',
                    expected = 'Yipee!';

                return this.remote               // represents the browser being tested
                    .findByCssSelector(selector)
                        .type(expected)
                        .end()
                    .execute(
                        function (selector) {
                            // Jump out of editing mode, so spacebar can open the Lens.
                            document.querySelector(selector).blur();
                        },
                        // list of arguments to pass to the remote code.
                        [selector]
                    )
                    .then(function () {
                        return highlight.bySelector(selector);
                    })
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)    // get the Lens!
                        .getProperty('value')
                        .then(function (data) {
                            assert.strictEqual(
                                data,
                                expected,
                                'Lens copies <textarea> value'
                            );
                        })
                        .end();
            });

            // -------- test boundary --------

            test('Lens Copies <input type="checkbox"> Value.', function () {

                const
                    selector = 'input[type="checkbox"]';

                return this.remote               // represents the browser being tested
                    .findByCssSelector(selector)
                        .click()
                        .end()
                    .execute(
                        function (selector) {
                            // Jump out of editing mode, so spacebar can open the Lens.
                            document.querySelector(selector).blur();
                        },
                        // list of arguments to pass to the remote code.
                        [selector]
                    )
                    .then(function () {
                        return highlight.bySelector(selector);
                    })
                    .then(function () {
                        return lens.open();
                    })
                    .findById(Lens.ID)      // get the Lens!
                        .findByCssSelector(selector)
                            .getProperty('checked')
                            .then(function (data) {
                                assert.isTrue(
                                    data,
                                    'Lens copies <input type="checkbox"> value'
                                );
                            })
                            .end()
                        .end();
            });

            // -------- test boundary --------

            test('Outside Mouse Click Closes Lens.', function () {

                return highlight
                    .bySelector(picked.selector)
                    .then(function () {
                        return lens.open();
                    })
                    .findByCssSelector('body')
                        .moveMouseTo(2, 3)
                        .click()
                        .waitForDeletedById(Lens.ID)
                        .execute(function (id) {
                            return document.querySelector('#' + id);
                        }, [Lens.ID])
                        .then(function (data) {
                            assert.isNull(data, 'Lens no longer exists.');
                        })
                        .end();
            });

            // -------- test boundary --------

            // test('Screenshot experiment', function () {
            //
            //     const
            //         canDoScreenshot = this.remote.environmentType.takesScreenshot;
            //
            //     return this.remote               // represents the browser being tested
            //         .then(function () {
            //             if (canDoScreenshot) {
            //                 this.takeScreenshot()
            //                 .then(function (image) {
            //                     fs.writeFileSync(
            //                         '/Users/sholladay/Desktop/myfile' + Date.now() + '.png',
            //                         image
            //                     );
            //                 })
            //             }
            //         })
            //         .findById(Lens.ID)
            //             .pressKeys(keys.SPACE)     // hit the spacebar, to close the Lens
            //             .end()                   // get out of the current element context
            //         .waitForDeletedById(Lens.ID)
            // });
    });
});
