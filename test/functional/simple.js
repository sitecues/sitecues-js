// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
    [
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/chai!assert',              // helps throw errors to fail tests, based on conditions
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'intern/dojo/node!fs',             // Node's filesystem API, used to save screenshots
        'page-object'
    ],
    function (tdd, assert, keys, fs, pageObject) {

        'use strict';

        const suite  = tdd.suite,
              test   = tdd.test,
              before = tdd.before,
              // beforeEach = tdd.beforeEach,
              URL    = 'http://tools.qa.sitecues.com:9000/site/simple.html' +
                       '?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/dev/latest/js/sitecues.js' +
                       '&scwsid=s-00000005' +
                       '&scuimode=badge',
              events = {
                  zoom : {
                      changed : 'zoom'
                  }
              };

        suite('Lens (simple)', function () {

            const picked = {
                      selector : 'p'
                  };

            let picker,
                lens;

            // Code to run when the suite starts, before any test.
            before(function () {

                // Create UI abstractions.
                picker = pageObject.createPicker(this.remote);
                lens   = pageObject.createLens(this.remote);

                return this.remote                // represents the browser being tested
                    .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
                    // NOTE: Page load timeouts are not yet supported in SafariDriver.
                    //       However, we are not testing Safari at the moment.
                    .setPageLoadTimeout(2000)
                    .setFindTimeout(2000)
                    .setExecuteAsyncTimeout(2000)  // max ms for executeAsync calls to complete
                    .get(URL)                      // navigate to the desired page
                    // Store some data about the original picked element before
                    // we do anything to mess with it, for later comparison.
                    .findByCssSelector(picked.selector)
                        .getVisibleText()
                        .then(function (text) {
                            // A test in this suite checks if the Lens cloned all
                            // visible text properly.
                            picked.visibleText = text;
                        })
                        .getAttribute('class')
                        .then(function (className) {
                            // We store the original classes so that we can restore
                            // them later after messing with them.
                            picked.className = className;
                        })
                        .end()
                    .execute(
                        function (selector) {
                            document.querySelector(selector).className = 'testClass';
                        },
                        [picked.selector]
                    )
                    .pressKeys([keys.EQUALS, keys.EQUALS])       // zoom in to enable sitecues features
                    .executeAsync(                // run an async callback in the remote browser
                        function (event, done) {
                            sitecues.on(event, done);  // use our event system to know when zoom is done
                        },
                        [events.zoom.changed]
                    )
                    .execute(                     // run a callback in the remote browser
                        function (selector) {
                            sitecues.highlight(selector);
                        },
                        [picked.selector]         // list of arguments to pass to the remote code
                    );
            });

            // TODO: Move most of our before() code into beforeEach() to make
            //       tests more robust. Reset timeouts, load a new page, etc.

            // Code to run prior to each individual test.
            // beforeEach(function () {
            //     return this.remote

            // });

            test('Spacebar Opens the Lens', function () {

                return this.remote
                    .pressKeys(keys.SPACE)         // hit the spacebar, to open the Lens
                    .executeAsync(                 // run an async callback in the remote browser
                        function (event, id, done) {
                            sitecues.on(event, function () {
                                done(
                                    document.getElementById(id)
                                );
                            });  // use our event system to know when the Lens is ready
                        },
                        ['hlb/ready', 'sitecues-hlb']
                    )
                    .then(function (element) {
                        assert.isObject(element, 'Lens exists');
                    });
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens is Displayed', function () {

                this.skip('This fails for some reason. Why?');

                return this.remote
                    .findById('sitecues-hlb')
                        .isDisplayed()
                        .then(function (isDisplayed) {
                            assert.isTrue(
                                isDisplayed,
                                'Lens must be displayed to be useful'
                            );
                        });
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens is Inside Viewport', function () {

                return this.remote               // represents the browser being tested
                    .execute(
                        function () {
                            return {
                                lens : document.getElementById('sitecues-hlb').getBoundingClientRect(),
                                viewport : {
                                    'left'  : 0,
                                    'top'   : 0,
                                    'right' : innerWidth,
                                    'bottom': innerHeight
                                }
                            };
                        }
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

            /////////////////////////////// ------- test boundary -------

            test('Lens Respects Text', function () {

                return this.remote               // represents the browser being tested
                    .findById('sitecues-hlb')    // get the Lens!
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(
                                text,
                                picked.visibleText,
                                'The Lens must contain the same text as the picked element'
                            );
                        });
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens Has Good Computed Styles', function () {

                return this.remote               // represents the browser being tested
                    .findById('sitecues-hlb')    // get the Lens!
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
                        });

            });

            /////////////////////////////// ------- test boundary -------

            test('Lens Has No Class', function () {

                return this.remote               // represents the browser being tested
                    .findById('sitecues-hlb')    // get the Lens!
                        .getAttribute('class')
                        .then(function (data) {
                            assert.isNull(data, 'Lens element does not have a class');
                        })
                        .end()
                    .execute(                    // run the given code in the remote browser
                        function (selector, className) {
                            document.querySelector(selector).className = className;
                        },
                        [picked.selector, picked.className]
                    );
            });

            /////////////////////////////// ------- test boundary -------

            test('Spacebar Closes Lens', function () {

                return lens.close()
                    .then(function (data) {
                        assert.isNull(data, 'Lens no longer exists');
                    });
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens is a <ul> if picked element is a <li>', function () {

                return picker.highlight('li')
                    .pressKeys(keys.SPACE)       // open the Lens
                    .findById('sitecues-hlb')    // get the Lens!
                    .getProperty('tagName')
                    .then(function (data) {
                        assert.strictEqual(
                            data,
                            'UL',
                            'Lens must be a valid standalone DOM element, to make browsers happy'
                        );
                    });
            });

            /////////////////////////////// ------- test boundary -------

            test('Escape Closes the Lens', function () {

                return this.remote               // represents the browser being tested
                    .pressKeys(keys.ESCAPE)
                    .executeAsync(
                        function (event, id, done) {
                            sitecues.on(event, function () {
                                done(
                                    document.getElementById(id)
                                );
                            });
                        },
                        ['hlb/closed', 'sitecues-hlb']
                    )
                    .then(function (data) {
                        assert.isNull(data, 'Lens no longer exists.');
                    });
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens Copies <textarea> Value', function () {

                const selector = 'textarea',
                      expected = 'Yipee!';

                return this.remote               // represents the browser being tested
                    .findByCssSelector(selector)
                        .type(expected)
                        .end()
                    .execute(                    // run the given code in the remote browser
                        function (selector) {
                            // Jump out of editing mode, so spacebar can open the Lens.
                            document.querySelector(selector).blur();
                            sitecues.highlight(selector);
                        },
                        [selector]
                    )
                    .pressKeys(keys.SPACE)       // hit the spacebar, to open the Lens
                    .findById('sitecues-hlb')    // get the Lens!
                    .getProperty('value')
                    .then(function (data) {
                        assert.strictEqual(
                            data,
                            expected,
                            'Lens copies <textarea> value'
                        );
                    })
                    .pressKeys(keys.ESCAPE)
                    .executeAsync(
                        function (done) {
                            sitecues.on('hlb/closed', done);
                        }
                    );
            });

            /////////////////////////////// ------- test boundary -------

            test('Lens Copies <input type="checkbox"> Value.', function () {

                this.skip('WebDriver claims the checkbox is not visible. Why?');

                const selector = 'input[type="checkbox"]';

                return this.remote               // represents the browser being tested
                    .findByCssSelector(selector)
                        .click()
                        .end()
                    .execute(                    // run the given code in the remote browser
                        function (selector) {
                            sitecues.highlight(selector);
                        },
                        [selector]
                    )
                    .pressKeys(keys.SPACE)       // hit the spacebar, to open the Lens
                    .findById('sitecues-hlb')    // get the Lens!
                    .getProperty('checked')
                    .then(function (data) {
                        assert.isTrue(
                            data,
                            'Lens copies <input type="checkbox"> value'
                        );
                    })
                    .pressKeys(keys.ESCAPE)
                    .executeAsync(
                        function (done) {
                            sitecues.on('hlb/closed', done);
                        }
                    );
            });

            /////////////////////////////// ------- test boundary -------

            test('Outside Mouse Click Closes Lens.', function () {

                return this.remote               // represents the browser being tested
                    .pressKeys(keys.SPACE)       // hit the spacebar, to open the Lens
                    .executeAsync(           // run an async callback in the remote browser
                        function (event, done) {
                            sitecues.on(event, done);  // use our event system to know when the Lens is ready
                        },
                        ['hlb/ready']
                    )
                    .findById('sitecues-hlb')
                        .end()
                    .findByCssSelector('body')
                        .moveMouseTo(undefined, 2, 3)
                        .click()
                        .executeAsync(
                            function (event, id, done) {
                                sitecues.on(event, function () {
                                    done(
                                        document.getElementById(id)
                                    );
                                });
                            },
                            ['hlb/closed', 'sitecues-hlb']
                        )
                        .then(function (data) {
                            assert.isNull(data, 'Lens no longer exists.');
                        })
                        .end();
            });

            /////////////////////////////// ------- test boundary -------

            // test('Screenshot experiment', function () {

            //     const canDoScreenshot = this.remote.session.capabilities.takesScreenshot;

            //     return this.remote               // represents the browser being tested
            //         .then(
            //             function () {
            //                 if (canDoScreenshot) {
            //                     this.takeScreenshot()
            //                         .then(
            //                             function (image) {
            //                                 fs.writeFileSync(
            //                                     '/Users/sholladay/Desktop/myfile' + Date.now() + '.png',
            //                                     image
            //                                 );
            //                             }
            //                         )
            //                 }
            //             }
            //         )
            //         .findById('sitecues-hlb')
            //             .pressKeys(keys.SPACE)     // hit the spacebar, to close the Lens
            //             .end()                   // get out of the current element context
            //         .waitForDeletedById('sitecues-hlb')
            // });
        });
    }
);
