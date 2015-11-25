// This file is designed to return a list of functional test suite module names
// (files without extensions, relative to the functional directory) that the
// automation framework will load.

define(
    [   // dependencies...
        // 'foo/bar'
    ],
    function () {
        return [
            'simple', 'zoom'
        ];
    }
);
