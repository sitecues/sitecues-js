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
    };

>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055

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
}); 
>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055
