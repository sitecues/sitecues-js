(function () {

    // This file contains unit tests for core.js:sitecues.status().

    require('./../test/libs');
    navigator = {
        userAgent : true
    };
    location = {};
    screen = {};
    pageXOffset =
        pageYOffset =
        innerWidth =
        innerHeight =
        outerWidth =
        outerHeight =
        screenX =
        screenY =
        true;

    // Get a reference to the module file we want to test.
    var module = require('../../../source/js/util/status');
    describe('sitecues', function () {
        describe('#status()', function () {
            it(
                'should call the function and return the string (for readability in console)',
                function (done) {

                    var expected  = 'Fetching sitecues status...',
                        actual = module.status();
                    expect(actual).to.equal(expected);
                    done();
                }
            );
            it(
                'should fire callback with status object',
                function (done) {
                    function callback(data) {
                        expect(data).to.be.an('object');
                        done();
                    }
                    module.status(callback);
                }
            );
        });
    });
}());
