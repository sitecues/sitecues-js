// This module defines the configuration for the testing framework, as used in CI.

define(
    [
        // Base configuration.
        './intern-cloud'
    ],
    function (config) {

        'use strict';

        // Setting properties on the config object here overrides the base configuration.
        // Best practice is to set only what needs to be different.

        // Replace the first word of the test run name with "CI",
        // to indicate that the test was triggered by CI and not
        // a developer.
        config.capabilities.name = config.capabilities.name.replace(
            /^.+?(?=\s)/, 'CI'
        );

        // TODO: Re-enable functional tests in CI once they are more reliable.
        config.functionalSuites = false;

        if (typeof process === 'object' &&
            process.env) {

            config.tunnelOptions = config.tunnelOptions || {};

            // Work around the fact that the only way to obfuscate an environment
            // variable within Bamboo's logs is to add 'PASSWORD' as a suffix.
            // Thus, we have to inform the test framework of the unconventional
            // variable name. Otherwise, this would not be necessary.
            config.tunnelOptions.accessKey = process.env.bamboo_BROWSERSTACK_PASSWORD;

            console.log('bs user is present:', typeof process.env.bamboo_BROWSERSTACK_USERNAME === 'string' && Boolean(process.env.bamboo_BROWSERSTACK_USERNAME));
            console.log('bs user[0-2]:', process.env.bamboo_BROWSERSTACK_USERNAME.slice(0, 3));

            console.log('bs pwd is present:', typeof process.env.bamboo_BROWSERSTACK_PASSWORD === 'string' && Boolean(process.env.bamboo_BROWSERSTACK_PASSWORD));
            console.log('bs key[0-2]:', config.tunnelOptions.accessKey && config.tunnelOptions.accessKey.slice(0, 3));
        }

        config.reporters = [
            { id : 'Runner' },
            { id : 'JUnit', filename : 'report/test/junit.xml' }
        ];

        return config;
    }
);
