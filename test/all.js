// This is a utility that constructs and returns lists of module IDs
// for test suite modules, to be used by the automation framework.

define(
    [   // dependencies...
        './unit',
        './functional'
    ],
    function (unitSuites, functionalSuites) {

        'use strict';

        // Prepend test modules with a directory path, to make them proper
        // module IDs as the testing system expects. Note that, due to
        // how module IDs work, the forward slashes are in fact
        // cross-platform compatible.
        function prependDir(list, dir) {

            var len = list.length,
                i;

            for (i = 0; i < len; i += 1) {
                list[i] = dir + list[i];
            }

            return list;
        }

        return {
            unit       : prependDir(unitSuites, 'unit/'),
            functional : prependDir(functionalSuites, 'functional/')
        };
    }
);
