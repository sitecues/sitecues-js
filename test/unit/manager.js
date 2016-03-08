define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/conf/user/manager',
        'core/conf/user/storage-backup',
        'core/conf/urls',
        'core/conf/site'
    ],
    function (tdd, assert, manager, storageBackup, urls, site) {

        'use strict';

        var suite  = tdd.suite,
            test   = tdd.test,
            beforeEach = tdd.beforeEach;

        suite('Manager', function () {

            beforeEach(function () {

                // Mock global data that the library cannot function without.
                window.SC_DEV = false;
                window.SC_EXTENSION = true;  // For getBaseResourceUrl() to function properly (TODO kinda hacky)
                window.sitecues = {
                    config : {
                       scriptUrl : 'http://localhost/js/sitecues.js'
                    }
                };

                site.init();
                urls.init();

                // Wipe out all data that sitecues knows about the user, session, etc.
                return new Promise(function (resolve) {
                    storageBackup.init(function() {
                        storageBackup.save({});
                        resolve();
                    });
                })
                .then(function () {
                    localStorage.clear();
                })
                .then(function () {
                    return new Promise(function (resolve) {
                        manager.init(resolve);
                    });
                });
            });

            test('.init() creates userId', function () {
                assert.isDefined(
                    manager.getUserId(),
                    'A User ID must be available for metrics to be tied to, etc'
                );
            });

            test('.set() sets a setting', function () {

                var VALUE = 2;

                manager.set('shoes', VALUE);

                assert.strictEqual(
                    manager.get('shoes'),
                    VALUE,
                    'The retrieved value must be identical to when it was stored'
                );
            });

            test('.reset() clears all settings', function () {

                var VALUE = 2;

                manager.set('shoes', VALUE);
                manager.set('socks', VALUE);
                manager.set('earrings', VALUE);
                manager.reset();

                assert.isUndefined(
                    (
                        manager.get('shoes') ||
                        manager.get('socks') ||
                        manager.get('earrings')
                    ),
                    'Settings reset must prevent retrieval of old values'
                );
            });

            test('.reset() maintains the userId', function () {

                var existingUserId = manager.getUserId();

                manager.reset();

                assert.strictEqual(
                    manager.getUserId(),
                    existingUserId,
                    'Settings reset must keep the User ID for metrics, etc'
                );
            });

            test('.def() callback return value is respected', function () {

                var ATTEMPT_VALUE = 4,
                    OVERRIDE_VALUE = 2;

                manager.def('shoes', function (shoes) {
                  return OVERRIDE_VALUE;
                });

                manager.set('shoes', ATTEMPT_VALUE);

                assert.strictEqual(
                    manager.get('shoes'),
                    OVERRIDE_VALUE,
                    'The def callback must be able to override the value to set'
                );
            });

            test('.get() callback is called the first time value is set', function () {

                var VALUE = 2,
                    numCalls = 0;

                manager.get('shoes', function shoesCallback() {
                    ++numCalls;
                });
                manager.set('shoes', VALUE);

                assert.strictEqual(
                    numCalls,
                    1,
                    'The callback() must be called when a value is set'
                );
            });

            test('.get() callback runs immediately if value was already set', function () {

                var numCalls = 0;

                manager.set('shoes', 2);
                manager.get('shoes', function shoesCallback() {
                    ++numCalls;
                });

                // Ensure that latecomers can easily apply any value that was set
                // in the past.
                assert.strictEqual(
                    numCalls,
                    1,
                    'The callback() must be run immediately for an existing value'
                );
            });

            test('.get() callback only runs for changed values', function () {

                var VALUE = 2,
                    numCalls = 0;

                manager.set('shoes', VALUE);
                manager.get('shoes', function shoesCallback() {
                    ++numCalls;
                });
                manager.set('shoes', VALUE);

                // Allow callbacks to assume they are only called for updates,
                // to eliminate unecessary work and thus improve performance.
                assert.strictEqual(
                    numCalls,
                    1,
                    'The callback() must not be called when a value is set() but not changed'
                );
            });
        });
    }
);
