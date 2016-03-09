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

        if (typeof process === 'object' && process.env) {

            config.tunnelOptions = config.tunnelOptions || {};

            config.tunnelOptions.username = process.env.bamboo_BROWSERSTACK_USERNAME;
            // Note that currently the only way to obfuscate an environment variable
            // within Bamboo's logs is to add 'PASSWORD' as a suffix.
            config.tunnelOptions.accessKey = process.env.bamboo_BROWSERSTACK_PASSWORD;
        }

        config.reporters = [
            // Log to the console for debugging.
            { id : 'Runner' },
            // Inform Bamboo of the results.
            { id : 'JUnit', filename : 'report/test/junit.xml' }
        ];

        return config;
    }
);
