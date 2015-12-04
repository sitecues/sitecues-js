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
            constructor(remote, browser) {
                super(remote);
                this.browser = browser;
            }

            holdKey(keyCode, key) {
                const browser = this.browser,
                      remote  = this.remote;
                return this.remote
                    .then(function () {
                        return browser.getBrowser();
                    })
                    .then(function (browser) {
                        return remote
                            .execute(function (browser, keyCode, key) {
                                //keyCode property can not be set in chrome
                                //So in that case we use a generic Event object to trigger keydown
                                //TODO: Refactor code to avoid relying on deprecated keyCode property

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
                    })
            }

            wheelUp() {

            }

        }

        return UserInput;
    }
);