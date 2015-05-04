// focus enhancement (make focus easier to see)
sitecues.def('focus', function(focus, callback) {

	// minimum zoom at which focus
	// enhancement appears
	focus.minzoom = 1.4;

	// color of focus enhancement
	focus.color = 'rgba(82,168,236,.8)';

	// selector for elements focus
	// enhancement should be applied
	//focus.selector = 'input';
	focus.selector = 'input,a,textarea,[tabindex],button,select';

	// depends on jquery and conf modules
	sitecues.use('jquery', 'conf', function($, conf){

		// show focus enhancement
		focus.show = function(){
			// private variables
			var thickness;

			// hide fous first to allow
			// recalculate outline thickness
			focus.hide();

			// calculate thickness for current zoom level
			thickness = 2 + (conf.get('zoom') / 1.7);

			// create style element
			focus.element = $('<style>');

			// append focus css rule to it
			focus.element.html(
        '*:focus { ' +
        // Rounded, soft outline outside of element
        'box-shadow: 0px 0px 3pt 2pt ' + focus.color + ' !important; ' +
        // TODO -- change z-index and use position: relative if statically positioned so outline on top
        // 'z-index: 999999; position: relative;' +
        '}'
			);

			// appent style element to head
			focus.element.appendTo('head');
		}

		// hide focus enhancement
		focus.hide = function(){
			// if there is something to remove
			if (focus.element){
				// remove element from DOM
				focus.element.remove();

				// set focus element to undefined
				focus.element = undefined;
			}
		}

		// handle element blur
		focus.blur = function(){
			// double-check if focus enhancement
			// is enabled and show focus element
			if (focus.enabled) focus.hide();
		}

		// handle
		focus.focus = function(){
			// double-check if focus enhancement
			// is enabled and hide focus element
			if (focus.enabled) focus.show();
		}

		// refresh focus enhancement bindings on the page
		focus.refresh = function(){
            var $body = $('body');
			if (focus.enabled){
				// if focus enhancement is enabled,
				// bind `blur` and `focus` events to
				// proper handlers. use selector for
				// filtering of matched elements
				$body.
					on('blur', focus.selector, focus.blur).
					on('focus', focus.selector, focus.focus);

			} else {
				// unbind event handlers if focus
				// enhancement is disabled
				$body.
					off('blur', focus.selector, focus.blur).
					off('focus', focus.selector, focus.focus);

				// hide focus element
				focus.hide();
			}
		}

		// subscribe to zoom changes and update
		// enhancement state with each change
		conf.get('zoom', function(zoom){
			// remember previous state of focus
			var was = focus.enabled;

			// determinate should focus enhancement
			// be enabled or not
			focus.enabled = zoom >= focus.minzoom;

			// if state of enhancement was changed
			// refresh module bindings on the page
			if (was !== focus.enabled) focus.refresh();
		});

		// done
		callback();

	});

});