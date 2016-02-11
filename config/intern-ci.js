// This module defines the configuration for the testing framework, as used in CI.

define(
    [
        // Base configuration.
        './intern-cloud'
    ],
    function (test) {

        // Setting properties on the test object here overrides the base configuration.
        // Best practice is to set only what needs to be different.

        'use strict';

        test.reporters = [
            { id : 'JUnit', filename : 'report/test/junit.xml' }
        ];

        return test;
    }
);
