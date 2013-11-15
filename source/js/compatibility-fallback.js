sitecues.def('compatibility/fallback', function (fallback, callback, log) {
	
	'use strict';

	var _reqFallback;

sitecues.use('jquery', 'conf', 'jquery/style', 'html-build', 'platform', 'load',  function ($, conf, style, htmlBuild, platform, load) {


	var IE 	 		= platform.browser.isIE,
		MOZ 		= platform.browser.isFirefox,
		OPERA 		= platform.browser.isOpera,
		SAF 	  	= platform.browser.isSafari,
		CHROME 	  	= platform.browser.isChrome,
	 	isWindows 	= platform.os.isWin;


	 	if(IE){
 			var IE6 		= platform.ieVersion.isIE6,
				IE7 		= platform.ieVersion.isIE7,
				IE8 		= platform.ieVersion.isIE8,
				IE9 		= platform.ieVersion.isIE9,
				IE10 		= platform.ieVersion.isIE10,
				IE11  		= platform.ieVersion.isIE11;
			}

	var _windows = platform.os.isWin;

	/* We are generating a message based different criteris - coming soon, not supported (older browsers) and coming soon.
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
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[3];}
	//requires a different browser		
	if( OPERA ) {
		_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];}
	//safari
	if( SAF ){	
	/* SAFARI FOR WINDOWS OR OS X */
	switch(_windows){
		case true:
			_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[4];
		break;
		case false:
			_compiledMessage =  _warning[0] + _warning[1] + " " + _warning[3];
		break;
		}	
	}


	fallback.create = function(success) {
     		 fallback.modal =  htmlBuild.$div().attr({ 'id': 'sitecues-fallback-unsupported-browser'})
     		 .addClass('sitecues-unsupported-browser').appendTo('html');

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
		      			'title':'Visit sitecues.com for more information.',
		      			'alt': 'Visit sitecues.com for more information.'
		      		})
		      	.appendTo( $('td#sitecues-unsupported-browser') )

	      	  fallback.message = $('<td/>')
		      		.attr({ id: 'warning-message', 
				      		colspan: 2, 
				      		rowspan: 1
					      	})
		      	.appendTo( $('tr#content-holder') )
		      	.html(_compiledMessage);

	      	  fallback.btnGroup = $('tr.btn-group')	
	      	  	.attr({ colspan: 2, 
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
		      									fallback.slideUp(); 
		      									return false}) 
		      									);

		      fallback.btn2 = $('<a/>')	
		      	.attr({'type':'button',
		      			'href':'http://www.sitecues.com/compatibility.php',
		      			'target':'_self'})
		      	.addClass('btn btn-primary')
		      	.text('Learn More')
		      	.appendTo( $('#explore-btn') );

					fallback.slideDown = function (success,evt) {
				   		  $(fallback.modal).stop(true,true).animate({"top":"50px"}, 750, function() {
						      	if (success) {
						      		success();
						      	}
						      });
				   		}
				   	fallback.slideUp = function (success,evt) {
				   		  $(fallback.modal).stop(true,true).animate({"top":"-250px"}, 500, function() {
						      	if (success) {
						      		success();
						      	}
						      });
							};
				      if (success) {
				        success();
				      }
		          }

			if(CHROME){
				_reqFallback = false;
				
			}else if( IE6 || IE7 || IE8 || IE9 || IE10 || IE11 || MOZ || OPERA || SAF ){
				load.style('../css/compatibility-fallback.css');
				_reqFallback = true;
			}

		fallback._reqFallback = _reqFallback;
	});
	callback();
});	
