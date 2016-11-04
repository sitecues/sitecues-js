define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'mini-core/native-global'
    ],
    function (
        tdd,
        assert,
        nativeGlobal
    ) {
        'use strict';

        var suite      = tdd.suite;
        var test       = tdd.test;
        var before     = tdd.before;
        var beforeEach = tdd.beforeEach;
        var after      = tdd.after;

        suite('Storage', function () {

            before(function () {
              window.SC_EXTENSION = false;
                this.skip('Suite disabled due to a dependency exception.');
                //nativeGlobal.init();
            });

            beforeEach(function () {
                localStorage.clear();
                storage.clearCache();
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

            test('.getAppData() uses cached data from what was set', function () {

                var
                    fakeUserId = 'test-id',
                    expected = {
                        userId : fakeUserId
                    },
                    fakePreference = {
                        zoom  : 2,
                        ttsOn : false
                    };

                expected[fakeUserId] = fakePreference;

                storage.setAppData(expected);

                localStorage.clear();

                assert.deepEqual(
                    storage.getAppData(),
                    expected,
                    'The retrieved preferences must be cached'
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

            test('.setAppData() assumes an empty object for convenience', function () {

                storage.setAppData();

                assert.deepEqual(
                    localStorage.getItem('sitecues'),
                    '{}',
                    'A default must be assumed for convenience'
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

            test('.setPref() demands an existing User ID for safety', function () {
                assert.throws(
                    storage.setPref,
                    Error,
                    'No user ID'
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

            test('.getPrefs() assumes an empty object for convenience', function () {
                assert.deepEqual(
                    storage.getPrefs(),
                    {},
                    'A default must be assumed for convenience'
                );
            });

            after(function () {
                delete window.SC_EXTENSION;
            });
        });
    }
);
