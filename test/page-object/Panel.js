define(
  [
    './Base',
    'core/bp/constants'
  ],
  function (Base, constants) {
    'use strict';

    class Panel extends Base {
      constructor(hello) {
        super(hello);
      }

      clickBigARepeatedly() {
        console.log('start click big a', constants.SMALL_A_ID);
        const remote = this.remote;

        return remote
          .findById(constants.LARGE_A_ID)
          .then(function (elem) {
            console.log(elem);
          })
          .moveMouseTo()
          .click()
          .click()
          .end();
      }
    }

    return Panel;
  }
);
