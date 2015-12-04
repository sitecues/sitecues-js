define(
    [
      './Base',
      'core/bp/constants'
    ],
    function (Base, constants) {
        'use strict';

        class Badge extends Base {
            constructor(remote) {
                super(remote);
            }

            expand() {
                return this.remote
                    .findById(constants.BADGE_ID)
                    .moveMouseTo()
                    .end();
            }
        }

        return Badge;
    }
);
