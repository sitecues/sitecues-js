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
                // Code to run when the suite starts, before tests...
                before(
                    function () {
                        return this.remote
                            .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
                            .get(url)                     // navigate to the desired page
                            .setFindTimeout(3000)         // fail test if any find method can't succeed this quickly
                            .setExecuteAsyncTimeout(500)  // max ms for things like animations
                            .pressKeys(keys.EQUALS)  // zoom in to enable sitecues features
                            .executeAsync(           // run an async callback in the remote browser
                                function (done) {
                                    sitecues.on('zoom', done);  // use our event system to know when zoom is done
                                }
                            )
                    }
                )
                // Code to run before each test, including the first one...
                beforeEach(
                    function () {
                    }
                )
                // Code to run after each test, including the last one...
                afterEach(
                    function () {
                    }
                );
                // Code to run after all tests, before the suite exits...
                after(
                    function () {
                    }
                );

                // test('HLB has 3px border width', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return parseInt(getComputedStyle(document.getElementById('sitecues-hlb')).borderWidth);
                //             })
                //             .then(function (data) {
                //                 assert.strictEqual(data, 3);
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB is positioned absolutely.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return getComputedStyle(document.getElementById('sitecues-hlb')).position;
                //             })
                //             .then(function (data) {
                //                 assert.strictEqual(data, 'absolute');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB is inside viewport.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return {
                //                     'hlb': document.getElementById('sitecues-hlb').getBoundingClientRect(),
                //                     'viewport': {
                //                         'left'  : 0,
                //                         'top'   : 0,
                //                         'right' : window.innerWidth,
                //                         'bottom': window.innerHeight
                //                     }
                //                 };
                //             })
                //             .then(function (data) {
                //                 assert(
                //                     data.hlb.left   > data.viewport.left  &&
                //                     data.hlb.top    > data.viewport.top   &&
                //                     data.hlb.right  < data.viewport.right &&
                //                     data.hlb.bottom < data.viewport.bottom,
                //                     'HLB is not inside viewport.'
                //                 );
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB is a <ul> if picked element is a <li>.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#spectrum');
                //             }
                //         )
                //         .findById('spectrum')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return document.getElementById('sitecues-hlb').tagName;
                //             })
                //             .then(function (data) {
                //                 assert(data === 'UL', 'HLB must be <ul> if picked element is <li>');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB copies <textarea> value.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 document.getElementsByTagName('textarea')[0].id = 'textarea';
                //                 document.getElementById('textarea').value = 'Yipee!';
                //                 sitecues.highlight(document.getElementById('textarea'));
                //             }
                //         )
                //         .findById('textarea')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return document.getElementById('textarea').value;
                //             })
                //             .then(function (data) {
                //                 assert(data === 'Yipee!', 'HLB copies <textarea> value');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB copies <input type="checkbox"> value.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on( 'zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 document.getElementsByTagName('input')[0].id = 'checkbox';
                //                 document.getElementById('checkbox').checked = true;
                //                 sitecues.highlight(document.getElementById('checkbox'));
                //             }
                //         )
                //         .findById('checkbox')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return document.getElementById('checkbox').checked;
                //             })
                //             .then(function (data) {
                //                 assert.isTrue(data, 'HLBed checked checkbox is checked');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB has no class.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //                 document.getElementById('p1').className = 'testClass';
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return !!document.getElementById('sitecues-hlb').className;
                //             })
                //             .then(function (data) {
                //                 assert.isFalse(data, 'HLB element does not have a class');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB has zindex of 2147483644.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return document.getElementById('sitecues-hlb').style.zIndex;
                //             })
                //             .then(function (data) {
                //                 assert(data === '2147483644', 'HLB element has zIndex of 2147483644');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB has content-box style for box-sizing CSS property.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')    // get the HLB!
                //             .execute(function () {
                //                 return document.getElementById('sitecues-hlb').style.boxSizing;
                //             })
                //             .then(function (data) {
                //                 assert(data === 'content-box', 'HLB element has content-box style');
                //             });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB closes when mouse moves out of HLB.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .sleep(1000)
                //         .findById('title')
                //         .click()
                //         .execute(function () {
                //             return document.getElementById('sitecues-hlb');
                //         })
                //         .then(function (data) {
                //             assert.isNull(data, 'HLB no longer exists.');
                //         });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB closes when escape key is pressed.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')
                //         .pressKeys(keys.ESCAPE)
                //         .sleep(1000)
                //         .execute(function () {
                //             return document.getElementById('sitecues-hlb');
                //         })
                //         .then(function (data) {
                //             assert.isNull(data, 'HLB no longer exists.');
                //         });
                // });

                /////////////////////////////// ------- test boundary -------

                // test('HLB closes when space key is pressed.', function () {

                //     return this.remote               // represents the browser being tested
                //         .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                //         .get(url)                    // navigate to the desired page
                //         .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                //         .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                //             .execute(                // run the given code in the remote browser
                //                 function () {
                //                     function onZoom() {
                //                         sitecues.zoomIsDone = true; // set a state we can look for
                //                     }
                //                     sitecues.on('zoom', onZoom);  // listener for when the zoom animation is done
                //                 }
                //             )
                //             .pressKeys(keys.ADD)     // unicode for: hit the + key!
                //             .end()                   // get out of the current element context
                //         .then(
                //             pollUntil(
                //                 function () {        // keeps running until it returns a value other than null or undefined
                //                     return sitecues.zoomIsDone === true || undefined;
                //                 },
                //                 undefined,           // arguments to pass to the poller
                //                 3000,                // timeout - max duration, if unsuccessful
                //                 30                   // interval - how often to run
                //             )
                //         )
                //         .execute(                    // run the given code in the remote browser
                //             function () {
                //                 delete sitecues.zoomIsDone;
                //                 sitecues.highlight('#p1');
                //             }
                //         )
                //         .findById('p1')
                //             .pressKeys('\uE00D')   // hit the spacebar, to open the HLB
                //             .end()
                //         .setFindTimeout(2000)        // set the find timeout to be more strict
                //         .findById('sitecues-hlb')
                //         .pressKeys(keys.SPACE)
                //         .sleep(1000)
                //         .execute(function () {
                //             return document.getElementById('sitecues-hlb');
                //         })
                //         .then(function (data) {
                //             assert.isNull(data, 'HLB no longer exists.');
                //         });
                // });

                /////////////////////////////// ------- test boundary -------

                test('HLB Respects Text', function () {

                    var selector = 'p',
                        originalText;

                    return this.remote               // represents the browser being tested
                        .execute(                    // run a callback in the remote browser
                            function (selector) {
                                sitecues.highlight(selector);
                            },
                            [selector]               // list of arguments to pass to the remote code
                        )
                        .findByCssSelector(selector)
                            .getVisibleText()
                            .then(function (text) {
                                originalText = text;
                            })
                            .pressKeys(keys.SPACE)   // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                            .getVisibleText()
                            .then(function (text) {
                                assert.strictEqual(
                                    text,
                                    originalText,
                                    'The HLB must contain the same text as the picked element'
                                );
                            });
                });

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
