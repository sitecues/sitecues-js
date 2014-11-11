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

                test('HLB Respects Text', function () {
                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .pressKeys(keys.ADD)     // unicode for: hit the + key!
                            .pressKeys(keys.ADD)
                            .end()                   // get out of the current element context
                        .sleep(2200)                 // TODO: change to a pollUntil helper, using sitecue.on('zoom', fn) to return true when zoom is done
                        .execute(                    // run the given code in the remote browser
                            function () {
                                sitecues.highlight('#p1');
                            }
                        )
                        .findById('p1')
                            .pressKeys(keys.SPACE)     // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(2000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(
                                text,
                                '(p1) Dr. Frankenstein\'s grandson, after years of living down the family ' +
                                'reputation, inherits granddad\'s castle and repeats the experiments.',
                                'The HLB should contain the same text as the picked element.'
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
