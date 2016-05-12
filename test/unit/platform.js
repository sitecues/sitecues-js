define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/platform'
    ],
    function (tdd, assert, platform) {

        'use strict';

        var suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before;

        suite('Platform module', function () {

            before(function () {
              platform.init();
            });

            test('.os.fullVersion provides a number', function () {
                assert.isNumber(
                    platform.os.fullVersion,
                    '.os.fullVersion must be a number'
                );
            });

        });
    }
);
