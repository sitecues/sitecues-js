eqnx.def('panel', function (panel, callback) {
    eqnx.use('jquery', function (_jQuery) {
        panel.kClosePanelTimeout = 500;
        panel.kOffsetFromBadge   = 5;

        panel.closePanel             = function () {
            panel.panel.css('visibility', 'hidden');
        };
        panel.closePanelTimeoutFired = function () {
            panel.timeoutId = 0;
            panel.closePanel();
        };
        panel.findAndInitBadge       = function () {
            if (!! panel.badge.length) {
                return true;
            }

            panel.badge = _jQuery('#eq360-badge');

            if (!! panel.badge.length) {
                panel.panel     = _jQuery('#eq360-panel');
                panel.ttsButton = _jQuery('#eq360-tts-button');

                panel.setPositionAndSize(true);

                panel.badge.css('visibility', 'visible');

                _jQuery(window).on('resize', function () {
                    panel.setPositionAndSize(true);
                });

                var mouseOverHandler      = function () {
                    panel.onMouseOver();
                };
                var mouseOutHandler       = function () {
                    panel.onMouseOut();
                };
                var clickTtsButtonHandler = function () {
                    panel.onClickTtsButton();
                };

                panel.badge.on('mouseover', mouseOverHandler);
                panel.panel.on('mouseover', mouseOverHandler);
                panel.badge.on('mouseout', mouseOutHandler);
                panel.panel.on('mouseout', mouseOutHandler);
                panel.ttsButton.on('click', clickTtsButtonHandler);

                panel.updateTtsButtonState();

                return true;
            }

            return false;
        };
        panel.isExpanded             = function () {
            return (panel.panel.css('visibility') === 'visible');
        };
        panel.setPositionAndSize     = function (reposition) {
            if (typeof reposition === 'undefined') {
                reposition = false;
            }

            var referenceWidth = window.innerWidth;

            panel.badge.css('top', '15px');
            panel.panel.css('top', ((15 + 35 + panel.kOffsetFromBadge).toString() + 'px'));
            panel.badge.css('left', ((referenceWidth - (25 + 100)).toString() + 'px'));
            panel.panel.css('left', ((referenceWidth - (25 + 205)).toString() + 'px'));
        };
        panel.showPanel              = function () {
            panel.panel.css('visibility', 'visible');
        };

        panel.init                   = function () {
            panel.isFloating = false;

            if (! panel.findAndInitBadge()) {
                _jQuery(document).ready(function () {
                    _jQuery('html').append(
                        '<div id="eq360-badge" class="eq360-ui" style="z-index: 2147483645; margin: 0; visibility: hidden; position: fixed; width: 100px; height: 30px;">' +
                            '<img src="//ai2.s3.amazonaws.com/assets/newlogo.png" style="position: relative; width: 100px; height: 30px;"/>' +
                        '</div>'
                    );
                });
            }
        };

        callback();
    });
});