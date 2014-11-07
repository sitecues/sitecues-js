define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'require'
    ],
    function (tdd, assert, require) {

        var url = 'http://tools.qa.sitecues.com:9000/' +
                  'site/simple.html' +
                  '?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/v/dev/latest/js/sitecues.js' +
                  '&scwsid=s-00000005' +
                  '&scuimode=badge' +
                  '&scisv=2';

        with (tdd) {
            suite('HLB Simple', function () {

                test('HLB Respects Text', function () {
                    return this.remote               // represents the browser being tested
                        .maximizeWindow()            // best effort to normalize window sizes (not every browser opens the same)
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(6000)        // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // finding this is our sign that sitecues is loaded and ready
                            .pressKeys('\uE025')     // unicode for: hit the + key!
                            .pressKeys('\uE025')
                            .end()                   // get out of the current element context
                        .sleep(1200)                 // TODO: change to a pollUntil helper, using sitecue.on('zoom', fn) to return true when zoom is done
                        .findByCssSelector('#p1')    // find the first paragraph
                            .execute(                // run the given code in the remote browser
                                function () {
                                    sitecues.highlight('p');
                                }
                            )
                            .pressKeys('\uE00D')     // hit the spacebar, to open the HLB
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
            });
        }
    }
);
