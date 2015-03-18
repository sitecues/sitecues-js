sitecues.def('info', function(info, callback) {

  'use strict';

  sitecues.use('jquery', 'conf/site', 'hlb/dimmer', 'platform', 'util/localization',
    function($, site, dimmer, platform, locale) {

    var $iframe = $(),
      $closeButton = $(),
      INITIAL_CSS = {
        position: 'fixed',
        left: '15%',
        top: '10%',
        width: '70%',
        height: '80%',
        transform: 'scale3d(.7,.7,1)',
        willChange: 'transform',
        backgroundColor: 'white',
        border: '20px solid #000',
        borderRadius: '8px',
        transition: 'opacity .9s, transform 1s',
        opacity: 0,
        zIndex: 2147483645
      },
      ENLARGED_CSS = {
        opacity: 1,
        transform: 'scale(1)'
      },
      BUTTON_SIZE = 60,
      CLOSE_BUTTON_CSS = {
        cursor: 'pointer',
        color: '#ccc',
        border: '3px solid #ccc',
        borderRadius: '48px',
        background: '#222',
        fontSize: '54px',
        fontFamily: 'Verdana',
        display: 'block',
        lineHeight: '0px',
        position: 'fixed',
        zIndex: 2147483646,
        margin: '8px',
        width: BUTTON_SIZE + 'px',
        height: BUTTON_SIZE + 'px',
        opacity: 0,
        transition: 'opacity 200ms'
      },
      INITIAL_DELAY = 100,
      INFLATION_SPEED = 1000,
      DIMMER_SPEED = 500,
      addCloseButtonTimer,
      isModalOpen = false;

    function showModal(pageName, anchor) {

      if (isModalOpen) {
        return;
      }

      function addParam(name, value) {
        return name + '=' + encodeURIComponent(value) + '&'
      }

      var
        localizedPageName = pageName + '-' + locale.getShortWebsiteLang(),
        sitecuesJsUrl = window.sitecues.config.script_url,
        hostUrl = window.location,
        pageUrl = sitecues.resolveSitecuesUrl('../html/' + localizedPageName + '.html?') +
          addParam('sc_url', sitecuesJsUrl) +
          addParam('site_id', site.get('site_id')) +
          addParam('site_url', hostUrl.protocol + '//' + hostUrl.hostname + ':' + hostUrl.port) +
          addParam('prefs', window.localStorage.sitecues) +
          anchor;

      sitecues.emit('bp/do-shrink');

      $iframe = $('<iframe>')
        .attr('src', pageUrl)
        .css(INITIAL_CSS)
        .appendTo('html');

      $(window)
        .one('focus', close)
        .one('message', checkCloseMessage)
        .on('DOMMouseScroll mousewheel', preventScroll);

      // Prevent panning in background content
      $('body,#sc-bp-container')
        .css('pointerEvents', 'none');

      dimmer.dimBackgroundContent(DIMMER_SPEED);

      setTimeout(function() {
        $iframe.css(ENLARGED_CSS);
        var iframeEl = $iframe[0];
        if (iframeEl.contentWindow) {
          iframeEl.contentWindow.focus();
        }
        else {
          iframeEl.focus();
        }
      }, INITIAL_DELAY); // Waiting helps animation performance

      addCloseButtonTimer = setTimeout(addCloseButton, INITIAL_DELAY + INFLATION_SPEED + 50);

      isModalOpen = true;
    }

    function preventScroll(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.returnValue = false;
      return false;
    }

    function checkCloseMessage(evt) {
      if (evt.originalEvent.data === 'sc-close-iframe') {
        close();
      }
    }

    function addCloseButton() {
      var closeButtonUrl = sitecues.resolveSitecuesUrl('../images/close.png'),
        helpRect = $iframe[0].getBoundingClientRect(),
        offsetLeft = platform.browser.isIE ? -30 : -17, // Deal with big scrollbars on Windows
        offsetTop = platform.browser.isIE ? -6 : -1;

      $closeButton =
          $('<div><span style="position:relative;left:14px;top:23px">x</span></div>')
        .css(CLOSE_BUTTON_CSS)
        .css({
          left: (helpRect.right - BUTTON_SIZE / 2 + offsetLeft) + 'px',  // Subtracts border width as well
          top: (helpRect.top - BUTTON_SIZE / 2 + offsetTop) + 'px'
        })
        .appendTo('body')
        .one('click', close);

      addCloseButtonTimer = setTimeout(function() {
        $closeButton.css('opacity', 1);
      }, 50);
    }

    function removeCloseButton() {
      $closeButton.remove();
      if (addCloseButtonTimer) {
        clearTimeout(addCloseButtonTimer);
      }
      addCloseButtonTimer = 0;
    }

    function close() {
      $iframe.css(INITIAL_CSS);
      setTimeout(function() {
        $iframe.remove();
        $iframe = $();
        isModalOpen = false;
      }, INFLATION_SPEED);

      $(window)
        .off('focus', close)
        .off('message', checkCloseMessage)
        .off('DOMMouseScroll mousewheel', preventScroll);
      $('body,#sc-bp-container')
        .css('pointerEvents', '');
      $('#sitecues-badge').focus();

      dimmer.undimBackgroundContent(DIMMER_SPEED);

      removeCloseButton();

    }


    // jumpTo can be to a named anchor or id in the document, e.g. #keyboard
    function showHelp(jumpToAnchor) {
      showModal('help', jumpToAnchor || '');
    }

    sitecues.on('info/help', showHelp);

    sitecues.showHelp = showHelp;

    callback();
  });

});
