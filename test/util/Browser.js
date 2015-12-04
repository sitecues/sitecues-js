/**
 * Created by bhallion on 12/4/15.
 */
define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class Browser extends Base {
            constructor(remote) {
                super(remote);
                this.browser = remote.session._capabilities.browserName;
            }

            isFirefox() {
                return (this.browser === 'firefox');
            }

            getBrowser() {
                return this.browser;
            }

            getTransformAttributeString() {
                //TODO: Check the actual strings passed to capabilities object for IE, chrome, safari
                switch (this.browser) {
                    case 'firefox':
                    case 'internet explorer':
                    case 'edge':
                        return 'transform';
                    case 'chrome':
                    case 'safari':
                        return 'webkitTransform';
                    default:
                        return 'UNRECOGNIZED BROWSER';
                }
            }

        }

        return Browser;
    }
);