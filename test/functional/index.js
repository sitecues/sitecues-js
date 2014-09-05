define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'require'
    ],
    function (tdd, assert, require) {
        with (tdd) {
            suite('index', function () {

                test('#greeting', function () {
                    return this.remote
                        .get(require.toUrl('test/pages/index.html'))
                        .setFindTimeout(5000)
                        .findByCssSelector('body.loaded')
                        .findById('nameField')
                            .click()
                            .type('Seth Holladay')
                            .end()
                        .findByCssSelector('#loginForm input[type=submit]')
                            .click()
                            .end()
                        .findById('greeting')
                        .getVisibleText()
                        .then(function (text) {
                            assert.strictEqual(text, 'Hello, Seth Holladay!', 'Greeting should be displayed when the form is submitted');
                        });
                });
            });
        }
    }
);
