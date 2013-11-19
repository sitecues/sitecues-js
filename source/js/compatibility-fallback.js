sitecues.def('compatibility/fallback', function (fallback, callback, log) {
	
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
	var _compiledMessage;
	var	_warning = [
		/*[0]*/	"<h3>Our apologies!</h3>",
		/*[1]*/	"<strong>sitecues</strong> zoom &amp; speech tools",
		/*[2]*/	"require a more recent version of your web browser.",
		/*[3]*/	"are coming to your browser soon!",
		/*[4]*/	"require a different web browser in order to work.",
		/*[5]*/	"touch support is coming to your device soon!"
			];	

	var _compiledMessage;		
	//ie6-8
	_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[2];
	//coming soon
	if( MOZ || IE9 || IE10 || IE11 ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[3];
	}
	//requires a different browser		
	if( OPERA ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];
	}
	//safari
	if( SAF ){	
	/* SAFARI FOR WINDOWS */
			if(isWindows){
					_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];
				}	
			}

	if(hasTouch){
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[5];
	}


	fallback.create = function(success) {

			load.style('../css/compatibility-fallback.css');

			fallback.modal = $('<div/>')
							.attr({ 'id': 'sitecues-fallback-unsupported-browser'})
							.addClass('sitecues-unsupported-browser')
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
		      		})
		      	.appendTo( $('td#sitecues-unsupported-browser') )

	      	  fallback.message = $('<td/>')
		      	.attr({ id: 'warning-message', colspan: 2, rowspan: 1 })
		      	.appendTo( $('tr#content-holder') )
		      	.html(_compiledMessage);

  fallback.btnGroup = $('tr.btn-group').attr({  colspan: 2, 
							      	  			rowspan: 1 
							      	  			})
			      	.append( $('<td/>').attr({ 	id:'dismiss-btn',
			      								rowspan:1, 
			      								colspan:1
			      							}) 
			      						)
			      	.append( $("<td/>").attr({ 	id:'explore-btn', 
			      								rowspan:1, 
			      								colspan:1
			      							})
			      						);

		      fallback.btn1 = $('<a/>')	
		      	.attr('type','button')
		      	.addClass('btn btn-default')
		      	.text('Dismiss')
		      	.appendTo( $('#dismiss-btn').on("click", function(evt){ 
		      									evt.preventDefault(); 
		      									fallback.fadeOut(); 
		      									return false;
		      								}) 
		      							);

		      fallback.btn2 = $('<a/>')	
		      	.attr({ 'type':'button',
		      			'href':'http://www.sitecues.com/compatibility.php',
		      			'target':'_self'
		      			})
		      	.addClass('btn btn-primary')
		      	.text('Learn More')
		      	.appendTo( $('#explore-btn') );

		      	fallback.fadeIn = function (success,evt) {
					$(fallback.modal).center()
		      		$(fallback.modal).stop(true,true).promise().done(


		      			$(fallback.modal).fadeIn('slow', function() {
						      	if (success) {
						      		success();
						      	}
						      })
		      			)
		      	}

				fallback.fadeOut = function (success,evt) {

					$(fallback.modal).stop(true,true).promise().done(

		      			$(fallback.modal).fadeOut('slow', function() {
						      	if (success) {
						      		success();
						      	}
						      })
		      			)
				
	      if (success) {
	        success();
	      }
      }			


		          $.fn.center = function() {
					    var container = $(window);
					    var top = -($(this).height()*.5);
					    var left = -($(this).width()*.5);
					    return this.css('position', 'absolute').css({ 	
			    												'margin-left': -($(this).width()*.5) + 'px', 
			    												'margin-top': -($(this).height()*.5) + 'px', 
			    												'left': (50+'%'), 
			    												'top': ($(window).scrollTop() + ($(this).height()) )+'px'});
									}

					if( $("#sitecues-fallback-unsupported-browser") ){
						$("#sitecues-fallback-unsupported-browser").center();
					}
			

					$(window).on('resize', function(evt){
						evt.stopImmediatePropagation();
						$("#sitecues-fallback-unsupported-browser").center();
						});
					$(window).on('scroll', function(evt){
						evt.stopImmediatePropagation();
						$("#sitecues-fallback-unsupported-browser").center();
						});
				}
	})

	callback();
});	
