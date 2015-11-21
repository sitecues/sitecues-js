define(
  [
    './Base',
    'core/bp/constants'
  ],
  function (Base, constants) {

    'use strict';

    class Badge extends Base {

      constructor(remote) {
        this.remote = remote;
      }

      expand() {
        return this.remote
          .execute(
            function (id) {
              return document.getElementById(id);
            },
            [constants.BADGE_ID]
          )
          .then(
            function (bdg) {
              return remote.moveMouseTo(bdg);
            }
          )
      }

    }
    console.log('return badge: '+JSON.stringify(Badge));

    return Badge;
  }
);
