eqnx.def('panel', function (panel, callback) {
    panel.init = function () {
        this.isFloating = false;
    };
});

var PanelView = (function () {
    function PanelView() {
        this.isFloating = false;
        var panelView = this;
        if(!this.findAndInitBadge()) {
            Util.Ready.contentLoaded(function () {
                var defaultBadgeLoader = new Util.Loader(panelView);
                defaultBadgeLoader.appendHtml(DefaultBadgeTemplate.data, document.getElementsByTagName("html")[0]);
            });
        }
    }
    PanelView.kOffsetFromBadge = 5;
    PanelView.kClosePanelTimeout = 500;
    PanelView.prototype.observe = function (key) {
        if(key === Util.ObserverKey.LoadComplete) {
            this.findAndInitBadge();
        } else if(key === Util.ObserverKey.TTSEnabled) {
            this.updateTTSButtonState();
        } else if(key === Util.ObserverKey.TTSEnabled) {
            this.updateTTSButtonState();
        }
    };
    PanelView.prototype.findAndInitBadge = function () {
        var _this = this;
        if(this.badge) {
            return true;
        }
        this.badge = document.getElementById('eq360-badge');
        if(this.badge) {
            this.panel = document.getElementById('eq360-panel');
            this.slider = new ZoomSlider();
            this.ttsButton = document.getElementById('eq360-tts-button');
            this.setPositionAndSize(true);
            this.badge.style.visibility = 'visible';
            var panelView = this;
            window.addEventListener("resize", function () {
                panelView.setPositionAndSize(true);
            }, false);
            var mouseOver = function () {
                _this.onMouseOver();
            };
            this.badge.onmouseover = mouseOver;
            this.panel.onmouseover = mouseOver;
            var mouseOut = function () {
                _this.onMouseOut();
            };
            this.badge.onmouseout = mouseOut;
            this.panel.onmouseout = mouseOut;
            var ttsButtonClick = function () {
                _this.onTTSButtonClick();
            };
            this.ttsButton.onclick = ttsButtonClick;
            eq360.addObserver(this);
            eq360.isSpeechOn.addObserver(this);
            this.updateTTSButtonState();
            return true;
        }
        return false;
    };
    PanelView.prototype.setPositionAndSize = function (reposition) {
        if (typeof reposition === "undefined") { reposition = false; }
        var referenceWidth = window.innerWidth;
        this.badge.style.top = "15px";
        this.panel.style.top = (15 + 35 + PanelView.kOffsetFromBadge).toString() + "px";
        this.badge.style.left = (referenceWidth - (25 + 100)).toString() + "px";
        this.panel.style.left = (referenceWidth - (25 + 205)).toString() + "px";
    };
    PanelView.prototype.onMouseOver = function () {
        eq360.initViews();
        this.showPanel();
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    };
    PanelView.prototype.onMouseOut = function () {
        var _this = this;
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(function () {
            _this.closePanelTimeoutFired();
        }, PanelView.kClosePanelTimeout);
    };
    PanelView.prototype.onTTSButtonClick = function () {
        eq360.isSpeechOn.save(!eq360.isSpeechOn.val());
        this.updateTTSButtonState();
    };
    PanelView.prototype.updateTTSButtonState = function () {
        var on = eq360.isSpeechOn.val();
        this.ttsButton.setAttribute('aria-pressed', on ? 'true' : 'false');
        this.ttsButton.style.backgroundPosition = (on ? "0% 0%" : "100% 0%");
    };
    PanelView.prototype.closePanelTimeoutFired = function () {
        this.timeoutId = 0;
        this.closePanel();
    };
    PanelView.prototype.closePanel = function () {
        this.panel.style.visibility = 'hidden';
    };
    PanelView.prototype.showPanel = function () {
        this.panel.style.visibility = 'visible';
    };
    PanelView.prototype.isExpanded = function () {
        return this.panel.style.visibility === 'visible';
    };
    return PanelView;
})();

var PanelController = (function () {
    function PanelController() {
        this.loader = new Util.Loader(this);
        this.loader.appendHtml(PanelTemplate.data, document.getElementsByTagName("html")[0]);
    }
    PanelController.prototype.observe = function (key) {
        this.view = new PanelView();
    };
    PanelController.prototype.isExpanded = function () {
        return this.view && this.view.isExpanded();
    };
    return PanelController;
})();