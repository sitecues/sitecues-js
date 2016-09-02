define(
  [
    '$',
    'core/conf/site',
    'core/conf/urls',
    'hlb/dimmer',
    'core/platform',
    'core/locale',
    'page/util/color',
    'core/events',
    'core/util/session',
    'core/native-functions',
    'core/inline-style/inline-style'
  ],
  function (
    $,
    site,
    urls,
    dimmer,
    platform,
    locale,
    colorUtil,
    events,
    session,
    nativeFn,
    inlineStyle
  ) {
  'use strict';

  var $iframe = $(),
    $closeButton = $(),
    MAX_ZINDEX = 2147483647,
    INITIAL_CSS = {
      position: 'fixed',
      left: '15%',
      top: '10%',
      width: '70%',
      height: '80%',
      transform: 'scale3d(.7,.7,1)',
      willChange: platform.transformPropertyCss,
      backgroundColor: '#fff',
      borderRadius: '8px',
      transition: 'opacity .9s, transform 1s',
      opacity: 0,
      zIndex: MAX_ZINDEX
    },
    ENLARGED_CSS = {
      opacity: 1,
      transform: 'scale(1)'
    },
    BUTTON_SIZE = 60,
    CLOSE_BUTTON_CSS = {
      cursor: 'pointer',
      border: '3px solid #ccc',
      borderRadius: '48px',
      background: '#222',
      fontSize: '54px',
      fontFamily: 'Verdana',
      display: 'block',
      lineHeight: '0px',
      position: 'fixed',
      zIndex: MAX_ZINDEX,
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

  function getBorderCss() {
    // Use adaptive border that is visible on any background
    return colorUtil.isOnDarkBackground(document.body) ? '7px solid #fff' : '20px solid #000';
  }

  function close() {
    inlineStyle.set($iframe[0], INITIAL_CSS);
    nativeFn.setTimeout(function() {
      $iframe.remove();
      $iframe = $();
      isModalOpen = false;
    }, INFLATION_SPEED);

    $(window)
      .off('focus', close);

    window.removeEventListener('message', checkCloseMessage);

    enableScrolling(true);

    enableWebPagePointerEvents(true);

    dimmer.undimBackgroundContent(DIMMER_SPEED);

    removeCloseButton();
  }

  function onload() {
    // Try to focus iframe
    nativeFn.setTimeout(function () {
      var iframe = $iframe[0];
      try {
        iframe.contentWindow.focus();
      }
      catch (ex) {}

      $(window).one('focus', close);

      window.addEventListener('message', checkCloseMessage);
    }, 0);

  }

  function showModal(pageName, anchor) {

    if (isModalOpen) {
      return;
    }

    var
      localizedPageName = pageName + '-' + locale.getUiLocale(),
      sitecuesJsUrl = urls.getRawScriptUrl(),
      hostUrl = window.location,
      pageUrl = urls.resolveResourceUrl('html/help/' + localizedPageName + '.html',
        {
          scUrl: sitecuesJsUrl,
          siteId: site.getSiteId(),
          siteUrl: hostUrl.protocol + '//' + hostUrl.hostname + ':' + hostUrl.port,
          sessionId: session.sessionId,
          pageViewId: session.pageViewId,
          prefs: window.localStorage.sitecues
        });

    events.emit('info/did-show');

    $iframe = $('<iframe>')
      .attr('src', pageUrl + anchor);

    inlineStyle.set($iframe[0], INITIAL_CSS);
    inlineStyle($iframe[0]).border = getBorderCss();

    $iframe
      .one('load', onload)
      .appendTo('html');

    // Prevent panning in background content

    enableWebPagePointerEvents(false);

    enableScrolling(false);

    dimmer.dimBackgroundContent(DIMMER_SPEED, $iframe);

    nativeFn.setTimeout(function () {
      inlineStyle.set($iframe[0], ENLARGED_CSS);
      var iframeEl = $iframe[0];
      if (iframeEl.contentWindow) {
        iframeEl.contentWindow.focus();
      }
      else {
        iframeEl.focus();
      }
    }, INITIAL_DELAY); // Waiting helps animation performance

    addCloseButtonTimer = nativeFn.setTimeout(addCloseButton, INITIAL_DELAY + INFLATION_SPEED + 100);

    isModalOpen = true;
  }

  function checkCloseMessage(evt) {
    if (evt.data === 'sc-close-iframe') {
      close();
    }
  }

  function addCloseButton() {
    var
      helpRect = $iframe[0].getBoundingClientRect(),
      offsetLeft = platform.browser.isMS ? -30 : -17, // Deal with big scrollbars on Windows
      offsetTop = platform.browser.isMS ? -6 : -1;

    $closeButton =
      $('<scx style="display:block" class="scp-hand-cursor"><scx style="position:relative;left:14px;top:23px;color:#ccc">x</scx></scx>');
    inlineStyle.set($closeButton[0], CLOSE_BUTTON_CSS);
    inlineStyle.set($closeButton[0], {
        left: (helpRect.right - BUTTON_SIZE / 2 + offsetLeft) + 'px',  // Subtracts border width as well
        top: (helpRect.top - BUTTON_SIZE / 2 + offsetTop) + 'px'
    });
    $closeButton
        .appendTo('html')
        .one('click', close);

    addCloseButtonTimer = nativeFn.setTimeout(function () {
      inlineStyle($closeButton[0]).opacity = '1';
    }, 100);
  }

  function removeCloseButton() {
    $closeButton.remove();
    if (addCloseButtonTimer) {
      clearTimeout(addCloseButtonTimer);
    }
    addCloseButtonTimer = 0;
  }

  function enableWebPagePointerEvents(doEnable) {
    var collection = $('body,#scp-bp-container');
    inlineStyle.override(collection.get(), {
      pointerEvents : doEnable ? '' : 'none'
    });
  }

  function enableScrolling(doEnable) {
    var docElem = document.documentElement;
    if (doEnable) {
      inlineStyle.restoreLast(docElem, ['overflow-x', 'overflow-y']);
    }
    else {
      inlineStyle.override(docElem, {
        overflowX : 'hidden',
        overflowY : 'hidden'
      });
    }
  }

  // jumpTo can be to a named anchor or id in the document, e.g. #keyboard
  function showHelp(jumpToAnchor) {
    showModal('help', jumpToAnchor || '');
  }

  return {
    showHelp: showHelp
  };
});