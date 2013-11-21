sitecues.def('fallback', function (fallback, callback, log) {
  
  'use strict';

  sitecues.use('jquery', 'conf', 'jquery/style', 'platform', 'load',  function ($, conf, style, platform, load) {

    var IE = platform.browser.isIE,
      MOZ = platform.browser.isFirefox,
      OPERA = platform.browser.isOpera,
      SAF         = platform.browser.isSafari,
      CHROME      = platform.browser.isChrome, // Chris: Variable ever used?
      isWindows   = platform.os.isWin,
      hasTouch    = platform.isTouchDevice,
      IE6         = (IE) ? platform.ieVersion.isIE6 : platform.ieVersion.vNA,
      IE7         = (IE) ? platform.ieVersion.isIE7 : platform.ieVersion.vNA, 
      IE8         = (IE) ? platform.ieVersion.isIE8 : platform.ieVersion.vNA, 
      IE9         = (IE) ? platform.ieVersion.isIE9 : platform.ieVersion.vNA, 
      IE10        = (IE) ? platform.ieVersion.isIE10 : platform.ieVersion.vNA, 
      IE11        = (IE) ? platform.ieVersion.isIE11 : platform.ieVersion.vNA;

    /* We are generating a message based different criteria - coming soon, not supported (older browsers) and touch coming soon.
    Any suggestions to change whether an array is the best choice? */
    var compiledMessage,
      warning = [
        '<h3>Our apologies!</h3>',                              /*[0]*/
        '<strong>sitecues</strong> zoom &amp; speech tools',    /*[1]*/
        'require a more current version of your web browser.',  /*[2]*/
        'are coming to your browser soon!',                     /*[3]*/
        'require a different web browser in order to work.',    /*[4]*/
        'touch support is coming to your device soon!'          /*[5]*/
      ];  

    //ie6-8
    if( IE6 || IE7 || IE8 ) {
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[2];
    }

    //coming soon
    if( MOZ || IE9 || IE10 || IE11 ) {
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[3];
    }

    //requires a different browser    
    if( OPERA ) {
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[4];
    }

    //safari for OS X is good to go
    if( SAF && isWindows ){/* SAFARI FOR WINDOWS */ 
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[4];
    }

    
    if(hasTouch){
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[5];
    }

    var dataProvider = sitecues.getLibraryUrl(); 

    fallback.dataProvider = dataProvider.host;
    fallback.fallbackId = conf.get('fallbackId');

    if (!fallback.fallbackId) {
      fallback.fallbackId = 'sitecues-fallback-unsupported-browser';
    }

    
    fallback.create = function(success) {
      load.style('../css/fallback.css');

      fallback.modal = $('<div/>')
        .attr({ 'id': fallback.fallbackId })
        .addClass('sitecues-unsupported-browser')
        .hide()
        .appendTo('html');

      fallback.table = $('<table/>')
        .attr({ 'id': 'unsupported-browser-warning', height: 215})
        .addClass('sitecues-badge-image')
        .appendTo(fallback.modal)
        .append( $('<tr/>').attr('id', 'content-holder'), $('<tr/>').addClass('btn-group') );

      fallback.sitecuesLogoContainer = $('<td/>')
       .attr({ 'id': 'sitecues-unsupported-browser', colspan: 1, rowspan: 2 })
       .appendTo( $('tr#content-holder') );

      fallback.sitecuesLogo = $('<img/>')
        .attr({ 'id': 'sitecues-unsupported-browser-img',
            'src': sitecues.resolveSitecuesUrl('../images/no-sitecues-support-warning.png'),
            'href':'http://www.sitecues.com/',
            'title':'sitecues - unsupported browser image.',
            'alt': 'Visit sitecues.com for more information.'
          }).appendTo( $('td#sitecues-unsupported-browser') );

      fallback.message = $('<td/>')
        .attr({ id: 'warning-message', colspan: 2, rowspan: 1 })
        .appendTo( $('tr#content-holder') )
        .html(compiledMessage);  

      fallback.btnGroup = $('tr.btn-group').attr({  colspan: 2, rowspan: 1 })
        .append( $('<td/>').attr({  id:'dismiss-btn', rowspan:1, colspan:1 }) ) 
        .append( $('<td/>').attr({  id:'explore-btn', rowspan:1, colspan:1 }) );

      fallback.btn1 = $('<a/>').attr('type','button').addClass('btn btn-default').text('Dismiss').on('click',
        function(evt){ 
          evt.preventDefault(); 
          fallback.hide(); 
        }).appendTo( $('tr.btn-group').find('#dismiss-btn'));
          
      fallback.btn2 = $('<a/>').attr({ 'type':'button', 'href':'http://www.sitecues.com/compatibility.php', 'target':'_blank'})
        .addClass('btn btn-primary')
        .text('Learn More')
        .appendTo( $('tr.btn-group').find('#explore-btn') );

      if (success) {
        success();
      }
    };
  

    fallback.center = function() {
      return fallback.modal.css('position', 'absolute').css({   
        'margin-left': -($(fallback.modal).width()*0.5) + 'px', 
        'margin-top': -($(fallback.modal).height()*0.5) + 'px', 
        'left': (50+'%'), 
        'top': ($(window).scrollTop() + ($(fallback.modal).height()) )+'px'
      });
    };

    fallback.refresh = function() { 
      if (conf.get('fallbackEnabled')) {    
        
        $(window).on('resize', function(evt){
          evt.stopImmediatePropagation();
          fallback.center();
        });
        
        $(window).on('scroll', function(evt){
          evt.stopImmediatePropagation();
          fallback.center();
        });
      
      }
    };

    fallback.show = function (success) {

      if (conf.get('fallbackEnabled')) {
        log.info('Showing fallback');

        fallback.center();

        $(fallback.modal).fadeIn('slow', function() {
          //console.log()
          if (success) {
            success();
          }
        });
      } else {
        log.warn('fallback.fadeIn() was called but fallback is disabled. Use sitecues.toggleFallback() in console.');
      }
    };

    fallback.hide = function (success) {
      $(fallback.modal).fadeOut('slow', function() {
        if (success) {
          success();
        }
      });
    };

    fallback.destroy = function(){
      fallback.remove();
    };

  

  /**
     * Closes the fallback and sets the preference so it stays closed.
     *
     * @param success Function executed if successful.
     * @return void
     */
    fallback.disable = function (success) {
      log.info('Disabling fallback');
      conf.set('fallbackEnabled', false);
      //document.write("Disabling fallback");
      fallback.fadeOut(success);
    };

    /**
     * Opens the fallback and sets the preference so it stays opened.
     *
     * @param success Function executed if successful.
     * @return void
     */
    fallback.enable = function () {
      log.info('Enabling fallback');
      conf.set('fallbackEnabled', true);
    };


    var $fallback = $('#' + fallback.fallbackId);

    if ($fallback.length > 0) {
      fallback = $fallback;
    } else {
      // We have no alternate or pre-existing fallback modal defined, so create a new one.
      fallback.create();
      fallback.center();
    }


    sitecues.toggleFallback = function () {
      fallback.isEnabled = !fallback.isEnabled;
      conf.set('fallbackEnabled',fallback.isEnabled);
      return fallback.isEnabled;
    };
      
  });

  callback();
}); 
