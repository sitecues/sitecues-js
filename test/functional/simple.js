    define(
    [
        'intern!tdd',                      // the testing interface - defines how we register suites and tests
        'intern/chai!assert',              // helps throw errors to fail tests, based on conditions
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'intern/dojo/node!fs',             // Node's filesystem API, used to save screenshots
        'intern/dojo/node!leadfoot/helpers/pollUntil'  // utility to pause until an expression is truthy
    ],
    function (tdd, assert, keys, fs, pollUntil) {

        var url = 'http://tools.qa.sitecues.com:9000/' +
                  'site/simple.html' +
                  '?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/v/dev/latest/js/sitecues.js' +
                  '&scwsid=s-00000005' +
                  '&scuimode=badge' +
                  '&scisv=2';

        with (tdd) {
            suite('HLB Simple', function () {

                before(  // code to run when the suite starts, before tests
                    function () {
                    }
                )
                beforeEach( // code to run before each test, including the first one
                    function () {
                    }
                )
                afterEach( // code to run after each test, including the last one
                    function () {
                    }
                );
                after(  // code to run after all tests, before the suite exits
                    function () {
                    }
                );

                test('HLB has 3px border width', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#p1');
                            }
                        )
                        .findById('p1')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return parseInt(getComputedStyle(document.getElementById('sitecues-hlb')).borderWidth);
                            })
                            .then(function (data) {
                                assert.strictEqual(data, 3);
                            });
                });
                test('HLB is positioned absolutely.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#p1');
                            }
                        )
                        .findById('p1')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return getComputedStyle(document.getElementById('sitecues-hlb')).position;
                            })
                            .then(function (data) {
                                assert.strictEqual(data, 'absolute');
                            });
                });
                test('HLB is inside viewport.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#p1');
                            }
                        )
                        .findById('p1')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return {
                                    'hlb': document.getElementById('sitecues-hlb').getBoundingClientRect(),
                                    'viewport': {
                                        'left'  : 0,
                                        'top'   : 0,
                                        'right' : window.innerWidth,
                                        'bottom': window.innerHeight
                                    }
                                };
                            })
                            .then(function (data) {
                                assert(
                                    data.hlb.left   > data.viewport.left  &&
                                    data.hlb.top    > data.viewport.top   &&
                                    data.hlb.right  < data.viewport.right &&
                                    data.hlb.bottom < data.viewport.bottom,
                                    'HLB is not inside viewport.'
                                );
                            });
                });
                test('HLB is a <ul> if picked element is a <li>.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#spectrum');
                            }
                        )
                        .findById('spectrum')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return document.getElementById('sitecues-hlb').tagName;
                            })
                            .then(function (data) {
                                assert(data === 'UL', 'HLB must be <ul> if picked element is <li>');
                            });
                });
                test('HLB copies <textarea> value.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                document.getElementsByTagName('textarea')[0].id = 'textarea';
                                document.getElementById('textarea').value = 'Yipee!';
                                sitecues.highlight(document.getElementById('textarea'));
                            }
                        )
                        .findById('textarea')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return document.getElementById('textarea').value;
                            })
                            .then(function (data) {
                                assert(data === 'Yipee!', 'HLB copies <textarea> value');
                            });
                });
                test('HLB copies <input type="checkbox"> value.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on( 'zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                document.getElementsByTagName('input')[0].id = 'checkbox';
                                document.getElementById('checkbox').checked = true;
                                sitecues.highlight(document.getElementById('checkbox'));
                            }
                        )
                        .findById('checkbox')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return document.getElementById('checkbox').checked;
                            })
                            .then(function (data) {
                                assert.isTrue(data, 'HLBed checked checkbox is checked');
                            });
                });
                test('HLB has no class.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#p1');
                                document.getElementById('p1').className = 'testClass';
                            }
                        )
                        .findById('p1')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return !!document.getElementById('sitecues-hlb').className;
                            })
                            .then(function (data) {
                                assert.isFalse(data, 'HLB element does not have a class');
                            });
                });
                test('HLB has zindex of 2147483644.', function () {

                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .execute(                // run the given code in the remote browser
                                function () {
                                    function onZoom() {
                                        sitecues.zoomIsDone = true; // set a state we can look for
                                    }
                                    sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                                }
                            )
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .end()                   // get out of the current element context
                        .then(
                            pollUntil(
                                function () {        // keeps running until it returns a value other than null or undefined
                                    return sitecues.zoomIsDone === true || undefined;
                                },
                                undefined,           // arguments to pass to the poller
                                3000,                // timeout - max duration, if unsuccessful
                                30                   // interval - how often to run
                            )
                        )
                        .execute(                    // run the given code in the remote browser
                            function () {
                                delete sitecues.zoomIsDone;
                                sitecues.highlight('#p1');
                            }
                        )
                        .findById('p1')
                            .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .execute(function () {
                                return document.getElementById('sitecues-hlb').style.zIndex;
                            })
                            .then(function (data) {
                                assert(data = 2147483644, 'HLB element has zIndex of 2147483644');
                            });
                });
                // test('HLB Respects Text', function () {
                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .pressKeys(keys.ADD)
                //             .end()                   // get out of the current element context
                //         .sleep(2200)                 // TODO: change to a pollUntil helper, using sitecue.on('zoom', fn) to return true when zoom is done
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys(keys.SPACE)     // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //         .getVisibleText()
                //         .then(function (text) {
                //             assert.strictEqual(
                //                 text,
                //                 '(p1) Dr. Frankenstein\'s grandson, after years of living down the family ' +
                //                 'reputation, inherits granddad\'s castle and repeats the experiments.',
                //                 'The HLB should contain the same text as the picked element.'
                //             );
                //         });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB Closes Properly', function () {

                //     var canDoScreenshot = this.remote.session.capabilities.takesScreenshot;

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
                //             .pressKeys(keys.SPACE)     // hit the spacebar, to close the HLB
                //             .end()                   // get out of the current element context
                //         .waitForDeletedById('sitecues-hlb')
                // });
            });
        }
    }
);
