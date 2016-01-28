define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/conf/user/storage'
    ],
    function (tdd, assert, storage) {

        'use strict';

        var suite  = tdd.suite
        ,   test   = tdd.test
        ,   beforeEach = tdd.beforeEach;

        suite('Storage module', function () {

            var testLs = {
                    userId: 'test-userid',
                    'test-userid': {
                        zoom: 1,
                        firstHighZoom: 2,
                        ttsOn: true,
                        firstSpeechOn: 3
                    }
                };
            
            beforeEach(function () {
                localStorage.clear();
            });

            test('Verify that we can clear local storage successfully', function () {
                var sitecuesLs;

                storage.init(function () {});
                sitecuesLs = storage.getSitecuesLs();
                assert.isString(sitecuesLs, 'SitecuesLS should be a stringified version of the LS object');
                storage.clear();
                sitecuesLs = storage.getSitecuesLs()
                assert.isUndefined(sitecuesLs, 'Clearing should make getSitecuesLs return undefined');
            });

            test('Save a sitecuesLS object, and receive back an identical object', function () {
                var testPrefs
                ,   parsedPrefs
                ,   testPrefsKeys
                ,   parsedPrefsKeys
                ,   parsedLs;

                storage.setSitecuesLs(testLs);
                parsedLs        = JSON.parse(storage.getSitecuesLs());
                testPrefs       = testLs[testLs.userId];
                parsedPrefs     = parsedLs[parsedLs.userId];
                testPrefsKeys   = Object.keys(testPrefs);
                parsedPrefsKeys = Object.keys(parsedPrefs);

                assert.strictEqual(testLs.userId, parsedLs.userId,
                    'The parsed local storage has a different user id than provided');
                assert.strictEqual(testPrefsKeys.length, parsedPrefsKeys.length,
                    'The parsed local storage preference object has a different number of keys');

                testPrefsKeys.forEach(function (key, index) {
                    assert.strictEqual(key, parsedPrefsKeys[index], 
                        'Parsed local storage preference object has a different key: ' + parsedPrefsKeys[index]);
                    assert.strictEqual(testPrefs[key], parsedPrefs[parsedPrefsKeys[index]],
                        'Parsed local storage preference object has a different value: ' + parsedPrefs[parsedPrefsKeys[index]]);
                })             
            });

            test('Save a preference to local storage, and retrieve it successfully', function () {
                var preferences, keys
                ,   zoom = 1
                ,   ttsOn = true;

                storage.init(function () {});
                storage.setPref('zoom', zoom);
                storage.setPref('ttsOn', ttsOn);

                preferences = storage.getPrefs();
                keys        = Object.keys(preferences);
                
                assert.strictEqual(keys.length, 2, 'There should only be two preferences set');
                assert.strictEqual(preferences['zoom'], zoom, 'Zoom should be set to ' + zoom);
                assert.strictEqual(preferences['ttsOn'], ttsOn, 'ttsOn should be set to ' + ttsOn);
            });

            test('Assign a userId to local storage, and retrieve it successfully', function () {
                var userId = 'test-id';

                storage.init(function () {});
                storage.setUserId(userId);
                assert.strictEqual(storage.getUserId(), userId, 
                    'Retrived local storage has a different userId than the one assigned');
            });

        })
    }
);