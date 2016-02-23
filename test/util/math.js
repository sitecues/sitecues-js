define(
    [],
    function () {

        'use strict';

    function isPositiveFiniteNumber(number) {
        return typeof number === 'number'
          && !Number.isNaN(number)
          && Number.isFinite(number)
          && number >= 0;
    }

    return {
        isPositiveFiniteNumber
    };
});
