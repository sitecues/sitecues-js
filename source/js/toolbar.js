sitecues.def( 'toolbar', function (toolbar, callback, log) {
  sitecues.use(
    'jquery',
    'conf',
    'load',
    'util/template',
    'toolbar/dropdown',
    'toolbar/slider',
    'toolbar/resizer',
    'toolbar/messenger',
    function (
      $,
      conf,
      load,
      template,
      dropdown,
      slider,
      resizer,
      messenger
    ) {

    // FIXME: Remove me! For testing purposes only.
    window.sitecues.configs = conf;

    toolbar.STATES = {
      OFF: {
        id:   0,
        name: 'off'
      },
      ON:  {
        id:   1,
        name: 'on'
      }
    };

    toolbar.currentState = toolbar.STATES.OFF;

    toolbar.render = function (callback) {
      if (! toolbar.instance) {
        toolbar.shim = $('<div class="sitecues-toolbar-shim" />').prependTo($('html'));

        toolbar.shim.css({
          height: ((conf.get('toolbarHeight') || 40) + 'px')
        });

        toolbar.instance = $('<div class="sitecues-toolbar hori" />').prependTo($('html'));

        toolbar.instance.css({
          height: ((conf.get('toolbarHeight') || 40) + 'px'),
          top: ("-" + ((conf.get('toolbarHeight') || 40) + 'px'))
        });
        dropdown.build(toolbar.instance);
        messenger.build(toolbar.instance);
        slider.build(toolbar.instance);
        resizer.build(toolbar.instance, toolbar.shim);

        // create TTS button and set it up
        toolbar.ttsButton = $('<div rel="sitecues-event" data-sitecues-event="speech/toggle">').addClass('tts').appendTo( toolbar.instance );

        toolbar.ttsButton.data('tts-enable', 'enabled');
        toolbar.wireEvents();

      }

      if (callback) {
        callback();
      }
    }

    toolbar.show = function () {
      if(conf.get('toolbarEnabled')) {
        toolbar.render();

        // FIXME: Required for `toolbar.show()` to work properly.
        if(toolbar.instance) {
          toolbar.instance.hide(0);
          toolbar.instance.show(0);
        }
        if(toolbar.shim) {
          toolbar.shim.hide(0);
          toolbar.shim.show(0);
        }

        toolbar.currentState = toolbar.STATES.ON;

        sitecues.emit('toolbar/state/' + toolbar.currentState.name);
      } else {
        log.warn("toolbar.show() was called but toolbar is disabled")
      }
    };

    /** Shows the toolbar by sliding it out */
    toolbar.slideOut = function () {
      log.info('Toolbar sliding out (showing)');

      if (conf.get('toolbarEnabled')) {
        toolbar.currentState = toolbar.STATES.ON;

        toolbar.render();

        var height = toolbar.instance.height();

        toolbar.instance.show();
        sitecues.emit('toolbar/state/' + toolbar.currentState.name);
        toolbar.shim.css('height', 0);
        toolbar.shim.show();
        toolbar.instance.animate({
          top: 0
        }, {
          step: function (now) {
            toolbar.shim.css('height', ((height + now) + 'px'))
          }
        }, 'slow');
      } else {
        log.warn("toolbar.slideOut() was called but toolbar is disabled")
      }
    };

    /**
     * Hides the toolbar by sliding it in.
     *
     * @param success Function executed if successful.
     */
    toolbar.slideIn = function (success) {
      log.info('Toolbar sliding in (hiding)');
      toolbar.currentState = toolbar.STATES.OFF;

      if (toolbar.instance) {
        var height = toolbar.instance.height();

        toolbar.instance.animate({
          top: -height
        }, 'slow');
        toolbar.shim.slideUp('slow', function () {
          sitecues.emit('toolbar/state/' + toolbar.currentState.name);
          log.info('Toolbar is hidden and in state ' + toolbar.currentState.name);
          success();
        });
      } else {
        success();
      }
    };

    toolbar.toggle = function () {
      log.info('Toggling toolbar from state ' + toolbar.currentState.name);
      if (toolbar.currentState === toolbar.STATES.ON) {
        toolbar.disable();
        toolbar.slideIn();
      } else {
        toolbar.enable();
        toolbar.slideOut();
      }
    };

    toolbar.enableSpeech = function () {
      toolbar.ttsButton.removeClass('tts-disabled');
      toolbar.ttsButton.data('tts-enable', 'enabled');
    };

    toolbar.disableSpeech = function () {
      toolbar.ttsButton.addClass('tts-disabled');
      toolbar.ttsButton.data('tts-enable', 'disabled');
    };

    /**
     * Looks for toolbar elements with a 'rel" attribute of value
     * "sitecues-event". It then looks for a "data-sitecues-event" attribute
     * that will say which event(s) to fire.
     *
     * Note: We could possibly skip the "rel" step.
     *
     * @return void
     */
    toolbar.wireEvents = function () {
      toolbar.instance.find('[rel="sitecues-event"]').each(function() {
        $(this).on('click', function() {
          var event = $(this).data('sitecues-event');

          if (event) {
            sitecues.emit(event);
          } else {
            log.warn('No event configured');
          }
        });
      });
    };

    /**
     * Closes the toolbar and sets the preference so it stays closed.
     *
     * @param success Function executed if successful.
     * @return void
     */
    toolbar.disable = function (success) {
      log.info('Disabling toolbar');
      conf.set('toolbarEnabled', false);
      toolbar.slideIn(success);
    };

    /**
     * Enable the toolbar. Call show() or toggle() to
     * show it.
     *
     * @param show Show the toolbar after it's enabled?  defaults to false
     * @return void
     */
    toolbar.enable = function (show) {
      log.info('Enabling toolbar');
      conf.set('toolbarEnabled', true);
      if(show) {
        toolbar.slideOut();
      }
    };

    // load special toolbar css
    load.style('../css/toolbar.css');
    load.style('../css/bootstrap.css');

    sitecues.on('speech/disable', toolbar.disableSpeech);
    sitecues.on('speech/enable', toolbar.enableSpeech);

    callback();
  });
});
