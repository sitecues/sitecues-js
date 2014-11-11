sitecues.def('info', function(info, callback) {

  'use strict';

  sitecues.use('jquery', 'conf/site', 'hlb/dimmer', function($, site, dimmer) {

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
      INITIAL_DELAY = 100,
      INFLATION_SPEED = 1000,
      DIMMER_SPEED = 500,
      addCloseButtonTimer;

    function showModal(pageName) {

      function addParam(name, value) {
        return name + '=' + encodeURIComponent(value) + '&'
      }

      var
        sitecuesJsUrl = window.sitecues.config.script_url,
        hostUrl = window.location,
        pageUrl = sitecues.resolveSitecuesUrl('../html/' + pageName + '.html?') +
          addParam('sc_url', sitecuesJsUrl) +
          addParam('site_id', site.get('site_id')) +
          addParam('site_url', hostUrl.protocol + '//' + hostUrl.hostname + ':' + hostUrl.port) +
          addParam('prefs', window.localStorage.sitecues);

      $iframe = $('<iframe>')
        .attr('src', pageUrl)
        .css(INITIAL_CSS)
        .appendTo('html');

      $(window)
        .one('focus', close)
        .one('message', checkCloseMessage)
        .on('DOMMouseScroll mousewheel', preventScroll);

      // Prevent panning in background content
      $('body')
        .css('pointerEvents', 'none');

      dimmer.dimBackgroundContent(DIMMER_SPEED);

      setTimeout(function() {
        $iframe.focus();
        $iframe.css(ENLARGED_CSS);
      }, INITIAL_DELAY); // Waiting helps animation performance

      addCloseButtonTimer = setTimeout(addCloseButton, INITIAL_DELAY + INFLATION_SPEED + 50);
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
        BUTTON_SIZE = 64;

      $closeButton = $('<img>')
        .attr({
          src: closeButtonUrl,
          alt: 'close sitecues help'
        })
        .css({
          position: 'fixed',
          left: (helpRect.right - BUTTON_SIZE / 2 - 8) + 'px',  // Subtracts border width as well
          top: (helpRect.top - BUTTON_SIZE / 2 - 4) + 'px',
          zIndex: 2147483646,
          width: BUTTON_SIZE + 'px',
          opacity: 0,
          transition: 'opacity 200ms'
        })
        .appendTo('html')
        .one('click', close);

      addCloseButtonTimer = setTimeout(function() {
        $closeButton.css('opacity', 1);
      }, 50);
    }

    function removeCloseButton() {
      $closeButton.remove();
      clearTimeout(addCloseButtonTimer);
    }

    function close() {
      $iframe.css(INITIAL_CSS);
      setTimeout(function() {
        $iframe.remove();
        $iframe = $();
      }, INFLATION_SPEED);

      $(window)
        .off('focus', close)
        .off('message', checkCloseMessage)
        .off('DOMMouseScroll mousewheel', preventScroll);
      $('body')
        .css('pointerEvents', '');
      $('#sitecues-badge').focus();

      dimmer.undimBackgroundContent(DIMMER_SPEED);

      removeCloseButton();
    }


    function showHelp() {
      showModal('help')
    }

    sitecues.on('info/help', showHelp);

    callback();
  });

});
