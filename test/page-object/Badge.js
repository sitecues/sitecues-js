define(
    [
      './Base',
      'core/bp/constants'
    ],
    function (Base, constants) {
        'use strict';

        class Badge extends Base {
            constructor(remote, input, wait) {
                super(remote);
                this.input = input;
                this.wait = wait;
            }

            expandPanel() {
                const wait = this.wait;
                return this.input
                    .mouseOverElement(Badge.BADGE_SELECTOR, Badge.MOUSEOVER_SELECTOR)
                    .then(function () {
                        return wait.forElementToStopMoving(Badge.OUTLINE_SELECTOR)
                    })
            }
        }

        Badge.BADGE_SELECTOR     = '#' + constants.BADGE_ID;
        Badge.OUTLINE_SELECTOR   = '#' + constants.MAIN_OUTLINE_ID;
        Badge.MOUSEOVER_SELECTOR = '#' + constants.MOUSEOVER_TARGET;

        return Badge;
    }
);
