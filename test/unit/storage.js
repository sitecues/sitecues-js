define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/conf/user/storage'
    ],
    function (tdd, assert, storage) {

        'use strict';

        var suite  = tdd.suite,
            test   = tdd.test,
            beforeEach = tdd.beforeEach;

        suite('Storage module', function () {

            beforeEach(function () {
                localStorage.clear();
            });

            test('Stored data can be cleared.', function () {

                var sitecuesLs;

                storage.init(function () {});
                sitecuesLs = storage.getSitecuesLs();
                assert.isString(
                    sitecuesLs,
                    'There must be something stored in order to test that we can clear it.'
                );
                storage.clear();
                sitecuesLs = storage.getSitecuesLs();
                assert.isUndefined(
                    sitecuesLs,
                    'The retrieved data is undefined because we cleared it.'
                );
            });

            test('Stored data is the same when retrieved.', function () {

                var
                    savedInfo = {
                        userId : 'test-userid',
                        'test-userid' : {
                            zoom : 1,
                            firstHighZoom : 2,
                            ttsOn : true,
                            firstSpeechOn : 3
                        }
                    },
                    testPrefs,
                    parsedPrefs,
                    testPrefsKeys,
                    parsedPrefsKeys,
                    parsedLs;

                storage.setSitecuesLs(savedInfo);
                parsedLs        = JSON.parse(storage.getSitecuesLs());
                testPrefs       = savedInfo[savedInfo.userId];
                parsedPrefs     = parsedLs[parsedLs.userId];
                testPrefsKeys   = Object.keys(testPrefs);
                parsedPrefsKeys = Object.keys(parsedPrefs);

                assert.strictEqual(
                    savedInfo.userId,
                    parsedLs.userId,
                    'The retrieved data has the same User ID as when it was stored.'
                );
                assert.strictEqual(
                    testPrefsKeys.length,
                    parsedPrefsKeys.length,
                    'The retrieved data has the same number of properties as when it was stored.'
                );

                testPrefsKeys.forEach(function (key, index) {
                    assert.strictEqual(
                        key,
                        parsedPrefsKeys[index],
                        'The retrieved data has identical property names as when it was stored.' +
                        parsedPrefsKeys[index]
                    );
                    assert.strictEqual(
                        testPrefs[key],
                        parsedPrefs[parsedPrefsKeys[index]],
                        'Parsed local storage preference object has a different value: ' +
                        parsedPrefs[parsedPrefsKeys[index]]
                    );
                })
            });

            test('Save a preference to local storage, and retrieve it successfully', function () {

                var preferences,
                    keys,
                    zoom = 1,
                    ttsOn = true;

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
                assert.strictEqual(
                    storage.getUserId(),
                    userId,
                    'Retrived local storage has a different userId than the one assigned'
                );
            });

        })
    }
);
