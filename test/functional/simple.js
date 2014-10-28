define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'require'
    ],
    function (tdd, assert, require) {

        var url = 'http://tools.qa.sitecues.com:9000/site/wrapping.html?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/v/dev/latest/js/sitecues.js&scwsid=s-00000005&scuimode=badge&scisv=2';

        with (tdd) {
            suite('HLB Simple', function () {

                test('HLB Respects Text', function () {
                    return this.remote               // represents the browser being tested
                        .get(url)                    // navigate to the desired page
                        .setFindTimeout(12000)       // fail test if any find method can't succeed this quickly
                        .findById('sitecues-panel')  // signal that sitecues is loaded and ready
                            .pressKeys('\uE025')     // unicode for: hit the + key!
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .end()                   // get out of the current element context
                        .findByCssSelector('p')      // find the first paragraph
                            .moveMouseTo()
                            .click()                 // give it focus so the picker can detect the mouse
                            .pressKeys('\uE00D')     // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(9000)        // set the find timeout to be more strict
                        .findById('sitecues-hlb')    // get the HLB!
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(
                                text,
                                'This is a normal, but long paragraph. I contain multiple sentences and should be as wide as my container. I should wrap as appropriate for my width, no more and no less.',
                                'The HLB should contain the same text as the picked element.'
                            );
                        });
                });
            });
        }
    }
);
