/**
 * Created by bhallion on 11/30/15.
 */
define(
    [

    ],
    function () {
        'use strict';
        function holdKey(remote, keyCode, key) {
            let browser = remote.session._capabilities.browserName;
            return remote
                .execute(function (browser, keyCode, key) {
                    //keyCode property can not be set in chrome
                    //So in that case we use a generic Event object to trigger keydown
                    //TODO: Refactor code to avoid using deprecated keyCode property

                    var evt;

                    if (browser === 'firefox') {
                        evt = new KeyboardEvent('keydown',
                            {
                                key : key,
                                keyCode : keyCode,
                                bubbles : true
                            });
                    }
                    else {
                        evt = document.createEvent('Events');
                        evt.initEvent('keydown', true, true);
                        evt.keyCode = keyCode;
                    }
                    document.body.dispatchEvent(evt);
                }, [browser, keyCode, key]);
        }

        return {
            holdKey: holdKey
        };
    }
);