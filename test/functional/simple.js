define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'require'
    ],
    function (tdd, assert, require) {

        var url = 'http://www.sitecues.com'

        with (tdd) {
            suite('HLB Simple', function () {

                test('HLB Respects Text', function () {
                    return this.remote // represents the browser being tested
                        .get(url) // navigate to the desired page
                        .setFindTimeout(12000) // fail test if any find method can't succeed within this quickly
                        .findById('sitecues-panel')
                            .pressKeys('\uE025') // unicode for: hit the + key!
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .pressKeys('\uE025')
                            .end() // get out of the current element context
                        .findByCssSelector('span.desc-text-large')
                            .moveMouseTo() //
                            .click() // give it focus so the picker can detect the mouse
                            .pressKeys('\uE00D') // hit the spacebar, to open the HLB
                            .end()
                        .setFindTimeout(9000) // set the find timeout to be more strict
                        .findById('sitecues-hlb') // get the HLB!
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(text, 'Reach and delight more people with zoom & speech built right into your site.', 'HLB should not alter page text.');
                        });
                });
            });
        }
    }
);
