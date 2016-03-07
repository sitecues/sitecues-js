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

                //Set global flags
                window.SC_DEV = false;
                window.SC_EXTENSION = true;  // For getBaseResourceUrl() to function properly (TODO kinda hacky)
                window.sitecues = {
                    config: {
                       scriptUrl: 'http://localhost/js/sitecues.js'
                    }
                };

                site.init();
                urls.init();

                function initBackupCallback(resolve) {
                    storageBackup.init(function() {
                        storageBackup.save({});
                        resolve();
                    });
                }

                function clearLocalStorage(resolve) {
                    localStorage.clear();
                    resolve();
                }
                function initManagerCallback(resolve) {
                    manager.init(resolve);
                }

                return new Promise(initBackupCallback)
                    .then(function() {
                        return new Promise(clearLocalStorage);
                    })
                    .then(function() {
                        return new Promise(initManagerCallback);
                    });
            });

            test('.init() creates userId', function () {

              var isUserIdAvailable;

              isUserIdAvailable = typeof manager.getUserId() !== 'undefined';

              assert.equal(
                  isUserIdAvailable,
                  true,
                  'A userId was not generated'
              );
            });

            test('.set() sets a setting', function () {

                var VALUE = 2;

                manager.set('shoes', VALUE);

                assert.equal(
                    manager.get('shoes'),
                    VALUE,
                    'The retrieved value must be identical to when it was stored'
                );
            });

            test('.reset() clears all settings', function () {

               var VALUE = 2,
                   isAnySettingAvailable;

               manager.set('shoes', VALUE);
               manager.set('socks', VALUE);
               manager.set('earrings', VALUE);
               manager.reset();

               isAnySettingAvailable =
                   typeof manager.get('shoes') !== 'undefined' ||
                   typeof manager.get('socks') !== 'undefined' ||
                   typeof manager.get('earrings') !== 'undefined';

               assert.equal(
                   isAnySettingAvailable,
                   false,
                   'The settings were still available after reset()'
               );
            });

            test('.reset() leaves userId', function () {

              var isUserIdAvailable;

              manager.reset();

              isUserIdAvailable = typeof manager.getUserId() !== 'undefined';

              assert.equal(
                  isUserIdAvailable ,
                  true,
                  'The userId was cleared by reset()'
              );
            });


            test('.def() callback is called and constrains a setting', function () {

                var BAD_VALUE = 4,
                    GOOD_VALUE = 2;

                manager.def('shoes', function(shoes) {
                  return shoes - BAD_VALUE + GOOD_VALUE;
                });

                manager.set('shoes', BAD_VALUE);

                assert.equal(
                    manager.get('shoes'),
                    GOOD_VALUE,
                    'The userId was cleared by reset()'
                );
            });

            test('.get() callback is called the first time value is set', function () {

                var VALUE = 2,
                    numCalls = 0,
                    EXPECTED_NUM_CALLS = 1;

                function shoesCallback() {
                    ++ numCalls;
                }
                manager.get('shoes', shoesCallback);
                manager.set('shoes', VALUE);

                assert.equal(
                    numCalls,
                    EXPECTED_NUM_CALLS,
                    'The callback() was not called the appropriate number of times'
                );
            });


            test('.get() callback is called if value was already set', function () {

                var VALUE = 2,
                    numCalls = 0,
                    EXPECTED_NUM_CALLS = 2;

                function shoesCallback() {
                    ++ numCalls;
                }
                manager.set('shoes', VALUE);
                manager.get('shoes', shoesCallback);
                manager.set('shoes', VALUE + 1);

                assert.equal(
                    numCalls,
                    EXPECTED_NUM_CALLS,
                    'The callback() was not called the appropriate number of times'
                );
            });

            test('.get() callback is not called if value is set to the old value', function () {

                var VALUE = 2,
                    numCalls = 0,
                    EXPECTED_NUM_CALLS = 1;

                function shoesCallback() {
                    ++ numCalls;
                }
                manager.set('shoes', VALUE);
                manager.get('shoes', shoesCallback);
                manager.set('shoes', VALUE );

                assert.equal(
                    numCalls,
                    EXPECTED_NUM_CALLS,
                    'The callback() was not called the appropriate number of times'
                );
            });
        });
    }
);
