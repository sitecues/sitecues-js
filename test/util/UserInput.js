define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class UserInput extends Base {

            constructor(remote, browser, wait) {
                super(remote);
                this.browser = browser;
                this.wait    = wait;
            }

            mouseOverElement(dispatchSelector, coorSelector) {
                return this.remote
                    .findByCssSelector(coorSelector)
                    .moveMouseTo()
                    .execute(
                        function (dispatchSelector, coorSelector) {
                            var xPos, yPos, evt, rect,
                                target = document.querySelector(dispatchSelector);
                            coorSelector = coorSelector || dispatchSelector;
                            rect = document.querySelector(coorSelector).getBoundingClientRect();
                            xPos = rect.left + rect.width / 2;
                            yPos = rect.top + rect.height / 2;
                            evt  = new MouseEvent('mousemove', { clientX : xPos, clientY : yPos });
                            target.dispatchEvent(evt);
                        },
                        [dispatchSelector, coorSelector]
                    )
                    .end()
            }

            clickElement(selector) {
                return this.remote
                    .findByCssSelector(selector)
                    .moveMouseTo()
                    .execute(
                        function (selector) {
                            var evt, rect, xPos, yPos,
                                target = document.querySelector(selector);
                            rect = target.getBoundingClientRect();
                            xPos = rect.left + rect.width / 2;
                            yPos = rect.top + rect.height / 2;
                            evt  = new MouseEvent('mousedown', { bubbles : true, clientX : xPos, clientY : yPos });
                            target.dispatchEvent(evt);
                        },
                        [selector]
                    )
                    .end()
            }

            releaseElement(selector) {
                return this.remote
                    .findByCssSelector(selector)
                    .moveMouseTo()
                    .execute(
                        function (selector) {
                            var evt, rect, xPos, yPos,
                                target = document.querySelector(selector);
                            rect = target.getBoundingClientRect();
                            xPos = rect.left + rect.width / 2;
                            yPos = rect.top + rect.height / 2;
                            evt  = new MouseEvent('mouseup', { bubbles : true, clientX : xPos, clientY : yPos });
                            target.dispatchEvent(evt);
                        },
                        [selector]
                    )
                    .end()
            }

            holdKey(key) {
                const browser = this.browser,
                      wait    = this.wait,
                      remote  = this.remote;

                return browser
                    .getKeyCodeAndBrowserName(key)
                    .then(function (data) {
                        return remote
                            .execute(
                                function (key, keyCode, browser) {
                                    // keyCode property can not be set in chrome
                                    // So in that case we use a generic Event object to trigger keydown
                                    // TODO: Refactor code to avoid relying on deprecated keyCode property
                                    var evt;
                                    if (browser !== 'chrome') {
                                        evt = new KeyboardEvent('keydown', {
                                            key     : key,
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
                                },
                                [key, data[0], data[1]]
                            )
                            .then(function () {
                                return wait.
                                    forTransformToComplete('body', 8000, 25);
                            });
                    })
            }

            ctrlWheel(direction, scrolls) {

                const
                    remote  = this.remote,
                    wait    = this.wait;

                return remote
                    .then(function () {

                        let chain = remote;

                        for (let i = 0; i < scrolls; i++) {
                            chain = chain
                                .execute(
                                    function (direction) {
                                        var evt = new MouseEvent('wheel', {
                                            ctrlKey : true,
                                            bubbles : true
                                        });
                                        evt.deltaY = (direction === 'up') ? -16 : 16;
                                        document.body.dispatchEvent(evt);
                                    },
                                    [direction]
                                )
                                .then(function () {
                                    return wait
                                        .forTransformToComplete('body', 4000, 25);
                                });
                        }

                        return chain;
                    });
            }
        }

        return UserInput;
    }
);
