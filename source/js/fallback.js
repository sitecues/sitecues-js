sitecues.def('fallback', function (fallback, callback, log) {
<<<<<<< HEAD
	
	'use strict';

sitecues.use('jquery', 'conf', 'jquery/style', 'platform', 'load',  function ($, conf, style, platform, load) {


	var IE 	 		= platform.browser.isIE,
		MOZ 		= platform.browser.isFirefox,
		OPERA 		= platform.browser.isOpera,
		SAF 	  	= platform.browser.isSafari,
		CHROME 	  	= platform.browser.isChrome,
	 	isWindows 	= platform.os.isWin,
	 	hasTouch    = platform.isTouchDevice,
	 	IE6 		= (IE) ? platform.ieVersion.isIE6 : platform.ieVersion.vNA,
	    IE7 		= (IE) ? platform.ieVersion.isIE7 : platform.ieVersion.vNA, 
	    IE8 		= (IE) ? platform.ieVersion.isIE8 : platform.ieVersion.vNA, 
	    IE9 		= (IE) ? platform.ieVersion.isIE9 : platform.ieVersion.vNA, 
	    IE10 		= (IE) ? platform.ieVersion.isIE10 : platform.ieVersion.vNA, 
	    IE11 		= (IE) ? platform.ieVersion.isIE11 : platform.ieVersion.vNA;

	/* We are generating a message based different criteria - coming soon, not supported (older browsers) and touch coming soon.
	Any suggestions to change whether an array is the best choice? */
	var _compiledMessage,
		_warning = [
		/*[0]*/	"<h3>Our apologies!</h3>",
		/*[1]*/	"<strong>sitecues</strong> zoom &amp; speech tools",
		/*[2]*/	"require a more recent version of your web browser.",
		/*[3]*/	"are coming to your browser soon!",
		/*[4]*/	"require a different web browser in order to work.",
		/*[5]*/	"touch support is coming to your device soon!"
			];	

	//ie6-8
	if( IE6 || IE7 || IE8 ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[2];
	}
	//coming soon
	if( MOZ || IE9 || IE10 || IE11 ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[3];
	}
	//requires a different browser		
	if( OPERA ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];
	}
	//safari for OS X is good to go
	if( SAF && isWindows ){/* SAFARI FOR WINDOWS */	
			_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];
			}

	if(hasTouch){
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[5];
	}



	var _dataProvider = sitecues.getLibraryUrl();	

	fallback._dataProvider = _dataProvider['host'];



	//console.log(_dataProvider)
	// fallback.fallbackId = conf.get('fallbackId');

	//     if (!fallback.fallbackId) {
	//       fallback.fallbackId = 'sitecues-fallback-unsupported-browser';
	//     }



	fallback.create = function(success) {

		load.style('../css/fallback.css')

			fallback.modal = $('<div/>')
							.attr({ 'id': 'sitecues-fallback-unsupported-browser' })
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
			     .appendTo( $("tr#content-holder") )

		      fallback.sitecuesLogo = $('<img/>')
		      	.attr({	'id': 'sitecues-unsupported-browser-img',
		      			'src': sitecues.resolveSitecuesUrl('../images/no-sitecues-support-warning.png'),
		      			'href':'http://www.sitecues.com/',
		      			'title':'sitecues - unsupported browser image.',
		      			'alt': 'Visit sitecues.com for more information.'
		      		}).appendTo( $('td#sitecues-unsupported-browser') )

	      	  fallback.message = $('<td/>')
		      	.attr({ id: 'warning-message', colspan: 2, rowspan: 1 })
		      	.appendTo( $('tr#content-holder') )
		      	.html(_compiledMessage);  

		      	fallback.btnGroup = $('tr.btn-group').attr({  colspan: 2, rowspan: 1 })
			      	.append( $('<td/>').attr({ 	id:'dismiss-btn', rowspan:1, colspan:1 }) ) 
			      	.append( $('<td/>').attr({ 	id:'explore-btn', rowspan:1, colspan:1 }) )

		      	fallback.btn1 = $('<a/>').attr('type','button').addClass('btn btn-default').text('Dismiss').on("click", function(evt){ 
						      									evt.preventDefault(); 
						      									fallback.hide(); 
						      								})
		      	.appendTo( $('tr.btn-group').find('#dismiss-btn'))
		      	fallback.btn2 = $('<a/>').attr({ 'type':'button', 'href':'http://www.sitecues.com/compatibility.php', 'target':'_blank'})
				      	.addClass('btn btn-primary')
				      	.text('Learn More')
				      	.appendTo( $('tr.btn-group').find('#explore-btn') )

		   if (success) {
	        success();
	      }
	  }

	


		          fallback.center = function() {
					    var container = $(window);
					    var top = -($(fallback.modal).height()*.5);
					    var left = -($(fallback.modal).width()*.5);
					    return fallback.modal.css('position', 'absolute').css({ 	
			    												'margin-left': -($(fallback.modal).width()*.5) + 'px', 
			    												'margin-top': -($(fallback.modal).height()*.5) + 'px', 
			    												'left': (50+'%'), 
			    												'top': ($(window).scrollTop() + ($(fallback.modal).height()) )+'px'});
									}

					// $.fn.center = function() {
					//     var container = $(window);
					//     var top = -($(this).height()*.5);
					//     var left = -($(this).width()*.5);
					//     return this.css('position', 'absolute').css({ 	
			  //   												'margin-left': -($(this).width()*.5) + 'px', 
			  //   												'margin-top': -($(this).height()*.5) + 'px', 
			  //   												'left': (50+'%'), 
			  //   												'top': ($(window).scrollTop() + ($(this).height()) )+'px'});
					// 				}				



			fallback.refresh = function() {	
			  if (window.sitecues.getLibraryConfig().fallback.enabled) {		
					$(window).on('resize', function(evt){
						evt.stopImmediatePropagation();
						fallback.center();
						});
					$(window).on('scroll', function(evt){
						evt.stopImmediatePropagation();
						fallback.center();
						});
					}
				}

				fallback.show = function (success) {

					if (window.sitecues.getLibraryConfig().fallback.enabled) {
	        				log.info('Showing fallback');

	        				fallback.center();
					        $(fallback.modal).fadeIn('slow', function() {
					          if (success) {
					            success();
					          }
					        });

				      } else {
				      	console.log("fallback.fadeIn() was called but fallback is disabled. Use sitecues.toggleFallback() in console.")
					        log.warn("fallback.fadeIn() was called but fallback is disabled. Use sitecues.toggleFallback() in console.");
					        //throw e;
					      }
					}

				fallback.hide = function (success) {

		      			$(fallback.modal).fadeOut('slow', function() {
						      	if (success) {
						      		success();
						      	}
						      });
					}

				// fallback.destroy = function(success){
				//   		fallback.remove();
				//   } 


	

	/**
=======
  
  'use strict';

  sitecues.use('jquery', 'conf', 'platform',   function ($, conf, platform) {
// EQ-881 - As a customer, I want sitecues to degrade gracefully or provide a useful
// fallback when it can't work, so that my users aren't confused by the icon.
// Set globally accessible operating fallback constants
    var IE              = platform.browser.isIE,
        MOZ             = platform.browser.isFirefox,
        OPERA           = platform.browser.isOpera,
        SAF             = platform.browser.isSafari,
        //CHROME          = platform.browser.isChrome,
        isWindows       = platform.os.isWin,
        //isMac           = platform.os.isMac,
        hasTouch        = sitecues.supportsTouch,
        IE6             = (IE) ? platform.ieVersion.isIE6 : platform.ieVersion.vNA,
        IE7             = (IE) ? platform.ieVersion.isIE7 : platform.ieVersion.vNA, 
        IE8             = (IE) ? platform.ieVersion.isIE8 : platform.ieVersion.vNA, 
        IE9             = (IE) ? platform.ieVersion.isIE9 : platform.ieVersion.vNA, 
        IE10            = (IE) ? platform.ieVersion.isIE10 : platform.ieVersion.vNA, 
        IE11            = (IE) ? platform.ieVersion.isIE11 : platform.ieVersion.vNA,
        compiledMessage,
        warning = [
        '<h3>Our apologies!</h3>',                        
        '<strong>sitecues</strong> zoom &amp; speech tools',
        'require a more current version of your web browser.',
        'are coming to your browser soon!',
        'require a different web browser in order to work.',
        'touch support is coming to your device soon!'      
      ];  
    /**
     * The code below sorts default messages from the warning array depending on
     * the current status of sitecues browser support
     **/
    if( IE6 || IE7 || IE8 ){           
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[2];
    }
    if( MOZ || IE9 || IE10 || IE11 ){
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[3];
    }
    if( SAF && isWindows ){
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[4];
    }
    if( OPERA ){                     
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[4];
    } 
    if( hasTouch ){                    
      compiledMessage =  warning[0] + warning[1] + ' ' + warning[5];
    }

    function importCSS(src) {
      var cssLink = $('<link rel="stylesheet" type="text/css" href="' + src + '"/>');
      $('head').append(cssLink); 
    }

    fallback.create = function(success) {
/**
* load fallback styles
*/
          importCSS( sitecues.resolveSitecuesUrl('../css/fallback.css') );
/**
* Modal div for fallback message
*/
          fallback.modal = $('<div/>')
            .attr({ 'id': 'sitecues-fallback-unsupported-browser' })
            .addClass('sitecues-unsupported-browser')
            .hide()
            .appendTo('html');
/**
* Used a table in hope IE would be somewhat forgiving...
*/
          fallback.table = $('<table/>')
            .attr({ 'id': 'unsupported-browser-warning', height: 215})
            .addClass('sitecues-badge-image')
            .appendTo(fallback.modal)
            .append( $('<tr/>').attr('id', 'content-holder'), $('<tr/>').addClass('btn-group') );
/** 
* left table column - sitecues logo area
*/
          fallback.sitecuesLogoContainer = $('<td/>')
           .attr({ 'id': 'sitecues-unsupported-browser', colspan: 1, rowspan: 2 })
           .appendTo( $('tr#content-holder') );
/** 
* sitecues logo image
*/
          fallback.sitecuesLogo = $('<img/>')
            .attr({ 'id': 'sitecues-unsupported-browser-img',
                'src': sitecues.resolveSitecuesUrl('../images/no-sitecues-support-warning.png'),
                'href':'http://www.sitecues.com/',
                'title':'sitecues - unsupported browser image.',
                'alt': 'Visit sitecues.com for more information.'
              }).appendTo( $('td#sitecues-unsupported-browser') );
/** 
* Right column - message area
*/
          fallback.message = $('<td/>')
            .attr({ id: 'warning-message', colspan: 2, rowspan: 1 })
            .appendTo( $('tr#content-holder') )
            .html(compiledMessage);  
/** 
* Set up button-group row. Borrowed styles from Bootstrap
*/
          fallback.btnGroup = $('tr.btn-group').attr({  colspan: 2, rowspan: 1 })
            .append( $('<td/>').attr({  id:'dismiss-btn', rowspan:1, colspan:1 }) ) 
            .append( $('<td/>').attr({  id:'explore-btn', rowspan:1, colspan:1 }) );
/** 
* Dismiss button
*/
          fallback.btn1 = $('<a/>').attr('type','button').addClass('btn btn-default').text('Dismiss').on('click',
            function(evt){ 
              evt.preventDefault(); 
              fallback.hide(); 
            }).appendTo( $('tr.btn-group').find('#dismiss-btn'));
/** 
* Compatibility button
*/
          fallback.btn2 = $('<a/>').attr({ 'type':'button', 'href':'http://www.sitecues.com/compatibility.php', 'target':'_blank'})
            .addClass('btn btn-primary')
            .text('Learn More')
            .appendTo( $('tr.btn-group').find('#explore-btn') );

          if (success) {
            success();
          }
        };
/** 
* Centers fallback modal
*/
    fallback.center = function() {
          return fallback.modal.css('position', 'absolute').css({   
            'margin-left': -($(fallback.modal).width()*0.5) + 'px', 
            'margin-top': -($(fallback.modal).height()*0.5) + 'px', 
            'left': (50+'%'), 
            'top': ($(window).scrollTop() + ($(fallback.modal).height()) )+'px'
          });
        };
/** 
* Centers fallback modal on window resize and scroll
*/
    fallback.refresh = function() { 
          log.info('Refresh fallback position');
          if ( fallback.isEnabled ) {    
            
            $(window).on('resize', function(evt){
              evt.stopImmediatePropagation();
              return fallback.center();
            });
            
            $(window).on('scroll', function(evt){
              evt.stopImmediatePropagation();
              return fallback.center();
            });
          }
        };
/** 
* Fades in fallback modal
*/
    fallback.show = function (success) {

          if (fallback.isEnabled) {
            log.info('Showing fallback modal');
            fallback.center();
            $(fallback.modal).fadeIn('slow', function() {
              if (success) {
                success();
              }
            });
          } else {
            log.warn('fallback.show was called but fallback is disabled. Use sitecues.toggleFallback() in console to enable.');
          }
        };
/**
* Fades out fallback modal
*/
    fallback.hide = function (success) {

          if (fallback.isEnabled) {
            log.info('Hiding fallback modal');

<<<<<<< HEAD
  /**
>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055
     * Closes the fallback and sets the preference so it stays closed.
     *
     * @param success Function executed if successful.
     * @return void
     */
    fallback.disable = function (success) {
      log.info('Disabling fallback');
      window.sitecues.getLibraryConfig().fallback.enabled = false;
      //conf.set('fallbackEnabled', false);
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
<<<<<<< HEAD
      //conf.set('fallbackEnabled', true);
      window.sitecues.getLibraryConfig().fallback.enabled = true;
      //if( conf.get('fallbackEnabled') ) {

      // if( $fallback.length == 0){
      // 		fallback.create(success);
      
      // } else 

      if (success) {
      	success();
      }
    };

    //fallback.isEnabled = window.sitecues.getLibraryConfig().fallback.enabled;
=======
      conf.set('fallbackEnabled', true);
=======
            $(fallback.modal).fadeOut('slow', function() {
              if (success) {
                success();
              }    
            });
          } else {
            log.warn('fallback.hide was called but fallback is disabled. Use sitecues.toggleFallback() in console to enable.');
          }
        };
/**
* Removes the fallback modal - unsure if this function will be necessary.
* I will remove it if I don't end up using it anywhere.
*/
    fallback.destroy = function(){
          if (fallback) {
            log.info('Destroy Fallback.'); 
            fallback.remove();
          }          
        };
/**
* Disables the fallback and sets the preference so it stays disabled.
*/
    fallback.disable = function (success) {
          log.info('Disabling fallback.');      
          fallback.fadeOut(success);
          return conf.set('fallbackEnabled', false);
        };
/**
* Enables the fallback and sets the preference so it stays enabled.
*/
    fallback.enable = function () {
          log.info('Enabling fallback.');
          return conf.set('fallbackEnabled', true);
        };
/**
* EQ-1335 - Ability to enable/disable compatibility checks, and have sensible default setting
**********************************************************************************************
* Enable fallback per platform by default for first time use
* use [ sitecues.toggleFallback() ] in order to diswable 
* This assumes a default behavior similar to that of the production release where the 
* fallback will be enabled for its intended use case.
*/
    if( conf.get('fallbackEnabled') === undefined ) { 
      conf.set( 'fallbackEnabled', true );
    }
/** 
* Checks if fallback is enabled...
*/
    fallback.isEnabled = ( conf.get('fallbackEnabled') === ( undefined || true ) ) ? true : conf.get('fallbackEnabled'); 

    sitecues.toggleFallback = function () {
      fallback.isEnabled = !fallback.isEnabled;
      conf.set('fallbackEnabled', fallback.isEnabled);
      return fallback.isEnabled;
>>>>>>> 181cd6407fb84277c56117689531554db420d31f
    };

>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055

    var $fallback = $('#sitecues-fallback-unsupported-browser');

    if ($fallback.length > 0) {
      fallback = $fallback;
      fallback.refresh();
    } else {
      // We have no alternate or pre-existing fallback modal defined, so create a new one.
      fallback.create();
      fallback.center();
    };

  });

<<<<<<< HEAD


	sitecues.toggleFallback = function () {

		fallback.isEnabled = !fallback.isEnabled;
		window.sitecues.getLibraryConfig().fallback.enabled = fallback.isEnabled;
		//conf.set('fallbackEnabled',fallback.isEnabled)
		return fallback.isEnabled;
    	}	

			
	})


	callback();
});	
=======
  callback();
<<<<<<< HEAD
}); 
>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055
=======

}); 
>>>>>>> 181cd6407fb84277c56117689531554db420d31f
