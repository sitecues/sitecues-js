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

        suite('Storage', function () {

            beforeEach(function () {
                localStorage.clear();
            });

            test('.clear() wipes app data', function () {

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

            test('.clear() does not affect 3rd party data', function () {

                var
                    STORAGE_NAMESPACE = 'sitebutnocues',
                    thirdPartyData = JSON.stringify({
                        wee : 'boom',
                        ooh : 'nooo'
                    }),
                    laterState,

                localStorage.setItem(STORAGE_NAMESPACE, thirdPartyData);

                storage.clear();

                laterState = localStorage.getItem('something');

                assert.strictEqual(
                    laterState,
                    thirdPartyData,
                    'Clearing sitecues data must not affect other apps.'
                );
            });

            test('.getSitecuesLs() returns what was stored.', function () {

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
                    parsedInfo;

                storage.setSitecuesLs(savedInfo);

                parsedInfo = JSON.parse(storage.getSitecuesLs());

                assert.deepEqual(
                    parsedInfo,
                    savedInfo,
                    'The retrieved data must be identical to when it was stored.'
                );
            });

            test('.getPrefs() retrieves the same user preferences that were saved.', function () {

                var
                    expectedPreference = {
                        zoom  : 1,
                        ttsOn : true
                    },
                    actualPreference;

                storage.init(function () {});

                Object.keys(expectedPreference).forEach(function (key) {
                    storage.setPref(key, expectedPreference[key]);
                });

                actualPreference = storage.getPrefs();

                assert.deepEqual(
                    actualPreference,
                    expectedPreference,
                    'The retrieved preferences must be identical to when they were stored.'
                );
            });

            test('.getUserId() retrieves the same User ID that was saved.', function () {

                var userId = 'test-id';

                storage.init(function () {});
                storage.setUserId(userId);
                assert.strictEqual(
                    storage.getUserId(),
                    userId,
                    'The retrieved User ID must be identical to when it was stored.'
                );
            });
        })
    }
);
