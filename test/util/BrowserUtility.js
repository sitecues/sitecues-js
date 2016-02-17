define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        const keyCodeMap = {
            '=': {
                'firefox': 61,
                // NOTE: Can't set keyCode value of KeyboardEvent in chrome
                'chrome': 187,
                'ie':187
            },
            '-': {
                'firefox': 173,
                // NOTE: Can't set keyCode value of KeyboardEvent in chrome
                'chrome': 189,
                'ie': 189
            }
        };

        class BrowserUtility extends Base {
            constructor(remote) {
                super(remote);
                this.browserName = remote.environmentType.browserName;
            }

            getKeyCodeAndBrowserName(key) {
                const data = [keyCodeMap[key][this.browserName], this.browserName];
                return this.remote
                    .then(function () {
                        return data;
                    });
            }

            setSitecuesUserPreference(key, value) {
                return this.remote
                    .execute(function (key, value) {
                        var sitecues = JSON.parse(localStorage.getItem('sitecues')),
                            userId;

                        if (sitecues && sitecues.userId) {
                            userId = sitecues.userId;
                        }
                        else {
                            throw new Error('Local storage is used by the tests, it needs to be present');
                        }

                        if (key) {
                            sitecues[userId][key] = value;
                        }
                        else {
                            sitecues[userId] = {};
                        }
                        //TODO: make sure this is necessary
                        sitecues = JSON.stringify(sitecues).split('"').join('\"');

                        try {
                            localStorage.setItem('sitecues', sitecues)
                        }
                        catch (err) {
                            throw new Error('Local storage is full');
                        }

                    }, [key, value]);
            }

            clearSitecuesUserPreferences() {
                return this.setSitecuesUserPreference(null);
            }

            clearSitecuesTestingNamespace() {
                return this.remote
                    .execute(function () {
                        window.sitecuesTestingNamespace = undefined;
                    });
            }

            resetEnvironment() {
                const remote = this;
                return remote
                    .clearSitecuesUserPreferences()
                    .then(function () {
                        return remote.clearSitecuesTestingNamespace();
                    });
            }
        }

        return BrowserUtility;
    }
);
