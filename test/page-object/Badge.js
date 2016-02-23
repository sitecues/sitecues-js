define(
    [
      './Base',
      'core/bp/constants'
    ],
    function (Base, constant) {

        'use strict';

        class Badge extends Base {
            constructor(remote, input, wait) {
                super(remote);
                this.input = input;
                this.wait = wait;
            }

            openPanel() {
                const wait = this.wait;
                return this.input
                    .mouseOverElement(Badge.BADGE_SELECTOR, Badge.MOUSEOVER_SELECTOR)
                    .then(function () {
                        return wait.forElementToStopMoving(Badge.OUTLINE_SELECTOR)
                    });
            }
        }

        Badge.BADGE_SELECTOR     = '#' + constant.BADGE_ID;
        Badge.OUTLINE_SELECTOR   = '#' + constant.MAIN_OUTLINE_ID;
        Badge.MOUSEOVER_SELECTOR = '#' + constant.MOUSEOVER_TARGET;

        return Badge;
    }
);
