sitecues.def('toolbar', function (toolbar, callback, log) {

  log.trace('toolbar.def()');
  
  var kToolbarShim = 'sitecues-toolbar-shim';
  var kToolbar = 'sitecues-toolbar';
  var kTts = 'tts';
  var kTtsDisabled = 'tts-disabled';
  var kTtsButtonRel= 'sitecues-event';
  
  sitecues.use(
    'jquery',
    'conf',
    'load',
    'util/template',
    'toolbar/dropdown',
    'slider',
    'toolbar/resizer',
    'toolbar/messenger',
    'util/common',
    'jquery/resize',
    function ($, conf, load, template, dropdown, SliderClass, resizer, messenger, common, jqresize) {
    log.trace('toolbar.use()');



    // FIXME: Remove me! For testing purposes only. - Eric
    // NOTE: sitecues.status() uses this windows.sitecues.configs object now. Be graceful. - Al
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
      log.trace('toolbar.render()');

      //console.log('rendering toolbar');

      var $html = $('html');
      if (! toolbar.instance) {
        toolbar.shim = $('<div class="' + kToolbarShim + '" />').prependTo($html);

        toolbar.shim.css({
          height: ((conf.get('toolbarHeight') || 40) + 'px')
        });

        toolbar.instance = $('<div class="' + kToolbar + ' hori" />').prependTo($html);

        var toolbarHeight = conf.get('toolbarHeight');
        toolbar.instance.css({
          height: ((toolbarHeight || 40) + 'px'),
          top: ("-" + ((toolbarHeight || 40) + 'px'))
        });
        dropdown.build(toolbar.instance);
        messenger.build(toolbar.instance);

        // console.log('_____________________________________');
        // console.log('building right pane');

        // // Set up the right-align container that will not be affected by the (dis)appearance
        // // of the vertical scrollbar
        // toolbar.rightPane = $('<div>')
        //   .addClass('sitecues-toolbar-right-pane')
        //   .css({height: toolbar.instance.css('height')})
        //   .appendTo(toolbar.instance);

        // var rightPaneVisibleWidth = toolbar.rightPane.get(0).getBoundingClientRect().width;
        
        // console.log(rightPaneVisibleWidth);

        // common.addRightAlignIgnoreScrollbar({
        //   obj             : toolbar.rightPane,
        //   getWidth        : function() { return rightPaneVisibleWidth; },
        //   getRightOffset  : function() { return 5; },
        //   setCss          : function(jCssObj) { toolbar.rightPane.css(jCssObj); }
        // });
        // var rightAlignPane = toolbar.rightPane;

        // Create a Slider Instance for the Toolbar
        this.slider = {};
        this.slider.wrap = $('<div>').addClass('slider-wrap').appendTo(toolbar.instance);
        //this.slider.wrap = $('<div>').addClass('slider-wrap').appendTo(rightAlignPane);
        this.slider.widget = SliderClass.build({
          container: this.slider.wrap
        });

        // create TTS button and set it up
        toolbar.ttsButton = $('<div rel="' + kTtsButtonRel + '" data-sitecues-event="speech/toggle">')
        .addClass(kTts)
        // .appendTo(rightAlignPane)
        .appendTo(toolbar.instance)
        .data('tts-enable', 'enabled')
        ;

        // Toolbar instance is created, let's define if it is enabled or disabled? Okey-dokey!
        var speechEnabled = conf.get('siteTTSEnable')
          , ttsServiceAvailable = conf.get('tts-service-available')
          ;

        if (speechEnabled && ttsServiceAvailable) {
          toolbar.enableSpeech();
        } else {
          toolbar.disableSpeech();
        }

        toolbar.wireEvents();

        // Ignore all elements in the toolbar when highlighting, etc...
        toolbar.instance.find('*').add(toolbar.instance).data('sitecues-role', 'ignore');
      }

      if (callback) {
        callback();
      }
    };

    toolbar.show = function () {
      log.trace('toolbar.show()');

      // console.log('toolbar show');

      if (conf.get('toolbarEnabled')) {
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
        log.warn("toolbar.show() was called but toolbar is disabled");
      }
    };

    /** Shows the toolbar by sliding it out */
    toolbar.slideOut = function () {
      log.trace('toolbar.slideOut()');
      log.info('Toolbar sliding out (showing)');

      if (conf.get('toolbarEnabled')) {
        toolbar.currentState = toolbar.STATES.ON;

        toolbar.render();

        var height = toolbar.instance.height();

        toolbar.instance.show(function(){
          
          // Set slider dimensions now that the Toolbar element is display:block
          toolbar.slider.widget.setdimensions(toolbar.slider.widget);
        });
        
        // Set slider dimensions now that the Toolbar element is display:block
        toolbar.slider.widget.setdimensions(toolbar.slider.widget);

        sitecues.emit('toolbar/state/' + toolbar.currentState.name);
        toolbar.shim.css('height', 0);
        toolbar.shim.show();
        toolbar.instance.animate({top: 0 },
          { 
            step: function (now) {
              toolbar.shim.css('height', ((height + now) + 'px'))
            },
            complete: function(){
            // Set slider dimensions now that the Toolbar element is display:block
              toolbar.slider.widget.setdimensions(toolbar.slider.widget);
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
      log.trace('toolbar.slideIn()');

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
      log.trace('toolbar.toggle()');

      log.info('Toggling toolbar from state ' + toolbar.currentState.name);
      if (toolbar.currentState === toolbar.STATES.ON && conf.get('tts-service-available') === true) {
        toolbar.disable();
        toolbar.slideIn();
      } else {
        toolbar.enable();
        toolbar.slideOut();
      }
    };

    toolbar.enableSpeech = function () {
      if (conf.get('tts-service-available') === true) {
      log.trace('toolbar.enableSpeech()');
      toolbar.ttsButton.removeClass(kTtsDisabled);
      toolbar.ttsButton.data('tts-enable', 'enabled');
      }
    };

    toolbar.disableSpeech = function () {
      log.trace('toolbar.disableSpeech()');

      toolbar.ttsButton.addClass(kTtsDisabled);
      toolbar.ttsButton.data('tts-enable', 'disabled');
    };

    /**
    * Looks for toolbar elements with a "rel" attribute of value
    * "sitecues-event". It then looks for a "data-sitecues-event" attribute
    * that will say which event(s) to fire.
    *
    * Note: We could possibly skip the "rel" step.
    *
    * @return void
    */
    toolbar.wireEvents = function () {
      log.trace('toolbar.wireEvents()');

      toolbar.instance.find('[rel="' + kTtsButtonRel + '"]').each(function() {
        $(this).on('click', function() {
          var event = $(this).data(kTtsButtonRel);

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
      log.trace('toolbar.disable()');

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
      log.trace('toolbar.enable()');

      log.info('Enabling toolbar');
      conf.set('toolbarEnabled', true);

      if (show) {
        toolbar.slideOut();
      }
    };

    sitecues.on('toolbar/disable', function() {
      // Turn off TTS if it is on.
      var speechEnabled = conf.get('siteTTSEnable')
        , ttsServiceAvailable = conf.get('tts-service-available')
        ;
      if (speechEnabled && ttsServiceAvailable) {
         sitecues.emit('speech/disable');
      }
      // Make sure reverse contrast is OFF.
      sitecues.emit('inverse/disable');
      // Reset zoom level.
      conf.set('zoom', 0);
      toolbar.disable(function() {
        // The floating-badge reappears.
        sitecues.emit('badge/enable');
      });
    });

    // Override the existing badge events
    sitecues.on('speech/disabled', toolbar.disableSpeech);
    sitecues.on('speech/enabled',  toolbar.enableSpeech);

    // load special toolbar css
    load.style('../css/toolbar.css');
    load.style('../css/bootstrap.css');

    callback();
    });
});
