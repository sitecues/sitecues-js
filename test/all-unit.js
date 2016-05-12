// This file is designed to return a list of unit test suite module names
// (files without extensions, relative to the unit directory) that the
// test framework will load.
define(
    [],
    function () {

        'use strict';

        return [
            'common',
            'events',
            'platform',
            //'manager',
            'storage'
        ];
    }
);
