/**
 * Created by bhallion on 11/30/15.
 */
define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class UserInput extends Base {
            constructor(remote) {
                super(remote);
            }

            holdKey(keyCode, key) {
                let browser = this.remote.session._capabilities.browserName;

                return this.remote
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

        }

        return UserInput;
    }
);