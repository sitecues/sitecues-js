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

                var
                    OUR_NAMESPACE = 'sitecues',
                    dataString = JSON.stringify({
                        anything : 'goas',
                        way      : [
                            { deep : 2 }
                        ]
                    });

                localStorage.setItem(OUR_NAMESPACE, dataString);

                storage.clear();

                assert.isNull(
                    localStorage.getItem(OUR_NAMESPACE),
                    'The retrieved data must be null because we cleared it'
                );
            });

            test('.clear() does not affect 3rd party data', function () {

                var
                    SOME_NAMESPACE = 'sitebutnocues',
                    thirdPartyData = JSON.stringify({
                        wee : 'boom',
                        ooh : 'nooo'
                    });

                localStorage.setItem(SOME_NAMESPACE, thirdPartyData);

                storage.clear();

                assert.strictEqual(
                    localStorage.getItem(SOME_NAMESPACE),
                    thirdPartyData,
                    'Clearing sitecues data must not affect other apps'
                );
            });

            test('.getRawAppData() returns what was stored', function () {

                var
                    expectedString = JSON.stringify({
                        userId : 'test-id',
                        'test-id' : {
                            zoom : 1,
                            firstHighZoom : 2,
                            ttsOn : true,
                            firstSpeechOn : 3
                        }
                    });

                localStorage.setItem('sitecues', expectedString);

                assert.deepEqual(
                    storage.getRawAppData(),
                    expectedString,
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

            test('.setUserId() stores an ID for later retrieval', function () {

                var
                    OUR_NAMESPACE = 'sitecues',
                    fakeUserId = 'test-id',
                    expectedString = JSON.stringify({
                        userId : fakeUserId
                    });

                assert.isNull(
                    localStorage.getItem(OUR_NAMESPACE),
                    'There must be nothing stored in order to test that .setUserId() has an effect'
                );

                storage.setUserId(fakeUserId);

                assert.deepEqual(
                    localStorage.getItem(OUR_NAMESPACE),
                    expectedString,
                    'The user ID must be stored in a specific format'
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
        })
    }
);
