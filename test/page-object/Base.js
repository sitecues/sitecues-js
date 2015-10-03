// Defines the behavior shared by all page objects.

define(
    [],
    function () {

        'use strict';

        class Base {
            constructor(remote) {
                this.remote = remote;
            }
        }

        return Base;
    }
);
