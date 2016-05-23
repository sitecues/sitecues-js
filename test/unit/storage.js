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
                //localStorage.clear();
                storage.clear();
            });

            test('.getAppData() returns what was stored', function () {

                var
                    expected = {
                        userId : 'test-id',
                        'test-id' : {
                            zoom : 1,
                            firstHighZoom : 2,
                            ttsOn : true,
                            firstSpeechOn : 3
                        }
                    };

                localStorage.setItem('sitecues', JSON.stringify(expected));

                assert.deepEqual(
                    storage.getAppData(),
                    expected,
                    'The retrieved data must be identical to when it was stored'
                );
            });

            test('.setAppData() stores data for later retrieval', function () {

                var
                    OUR_NAMESPACE = 'sitecues',
                    expectedAppData = {
                        whatever : 'floats',
                        your     : ['boat', 2, 'day']
                    },
                    expectedString = JSON.stringify(expectedAppData);

                assert.isNull(
                    localStorage.getItem(OUR_NAMESPACE),
                    'There must be nothing stored in order to test that .setAppData() has an effect'
                );

                storage.setAppData(expectedAppData);

                assert.deepEqual(
                    localStorage.getItem('sitecues'),
                    expectedString,
                    'The app data must be stored without modification'
                );
            });

            test('.createUser() creates a user ID in the correct format', function () {

                var
                    OUR_NAMESPACE = 'sitecues',
                    UUID_REGEX = /(?:[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}?)/,
                    newUserId;

                assert.isNull(
                    localStorage.getItem(OUR_NAMESPACE),
                    'There must be nothing stored in order to test that .createUser() has an effect'
                );

                storage.createUser();

                newUserId = JSON.parse(localStorage.getItem(OUR_NAMESPACE)).userId;

                assert.match(
                    newUserId,
                    UUID_REGEX,
                    'The user ID must be stored as a valid UUID.'
                );
            });

            test('.getUserId() retrieves the same User ID that was saved', function () {

                var
                    fakeUserId = 'test-id',
                    dataString = JSON.stringify({
                        userId : fakeUserId
                    });

                localStorage.setItem('sitecues', dataString);

                assert.strictEqual(
                    storage.getUserId(),
                    fakeUserId,
                    'The retrieved User ID must be identical to when it was stored.'
                );
            });

            test('.setPref() stores a user preference for later retrieval', function () {

                var
                    OUR_NAMESPACE = 'sitecues',
                    SAVED_PREF_KEY = 'pref2',
                    SAVED_PREF_VALUE = 'hello',
                    fakeUserId = 'test-id',
                    fakeAppData = {
                        userId : fakeUserId,
                        'test-id' : {
                            pref1 : true
                        }
                    },
                    expectedAppData,
                    expectedString;

                localStorage.setItem(
                    OUR_NAMESPACE,
                    JSON.stringify(fakeAppData)
                );

                expectedAppData = fakeAppData;
                expectedAppData[fakeUserId][SAVED_PREF_KEY] = SAVED_PREF_VALUE;

                expectedString = JSON.stringify(expectedAppData);

                storage.setPref(SAVED_PREF_KEY, SAVED_PREF_VALUE);

                assert.deepEqual(
                    localStorage.getItem(OUR_NAMESPACE),
                    expectedString,
                    'The preference must be stored in a specific format'
                );
            });

            test('.getPrefs() retrieves the same user preferences that were saved', function () {

                var
                    fakeUserId = 'test-id',
                    fakeAppData = {
                        userId : fakeUserId
                    },
                    expectedPreference = {
                        zoom  : 1,
                        ttsOn : true
                    };

                fakeAppData[fakeUserId] = expectedPreference;

                localStorage.setItem(
                    'sitecues',
                    JSON.stringify(fakeAppData)
                );

                assert.deepEqual(
                    storage.getPrefs(),
                    expectedPreference,
                    'The retrieved preferences must be identical to when they were stored'
                );
            });
        });
    }
);
