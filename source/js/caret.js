// caret enhancement. makes the insertion caret
// (blinking vertical line inside of a text input)
// easier to see
eqnx.def('caret', function(caret, callback){

	// minimum zoom at which caret
	// enhancement appears
	caret.minzoom = 1.8;

	// selector for elements caret
	// enhancement should be applied
	caret.selector = 'input';

	// depends on jquery, conf and classifier modules
	eqnx.use('jquery', 'conf', 'caret/classifier', 'caret/view', function($, conf, classifier, view){

		// update caret position
		caret.update = function(event){
			// only if caret enhancement is enabled
			if (caret.enabled){
				// check type of target element in event
				var target = (event.target instanceof HTMLElement)
					? event.target
					: document.body;

				// check if target element is editable
				if (classifier.isEditableWithNativeCaret(target)){
					// hide caret view
					view.hide();

					// wait until text and caret position updated
					setTimeout(function(){
						// show caret for target
						view.show(target);
					}, 0);

					return;
				}
			}

			// hide caret view if target
			// element isn't editable
			view.hide();
		}

		// refresh caret enhancement bindings on the page
		caret.refresh = function(){
			if (caret.enabled){
				// if caret enhancement is enabled,
				// bind `blur`, `focus`, `click` and
				// `keydown` events to proper handlers.
				// use selector for filtering of matched
				// elements
				$('body').
					on('blur', caret.selector, view.hide).
					on('focus', caret.selector, caret.update).
					on('click', caret.selector, caret.update).
					on('keydown', caret.selector, caret.update);

			} else {
				// unbind event handlers if caret
				// enhancement is disabled
				$('body').
					off('blur', caret.selector, view.hide).
					off('focus', caret.selector, caret.update).
					off('click', caret.selector, caret.update).
					off('keydown', caret.selector, caret.update);

				// hide caret view
				view.hide();
			}
		}

		// subscribe to zoom changes and update
		// enhancement state with each change
		conf.get('zoom', function(zoom){
			// remember previous state of focus
			var was = caret.enabled;

			// determinate should focus enhancement
			// be enabled or not
			caret.enabled = zoom >= caret.minzoom;

			// if state of enhancement was changed
			// refresh module bindings on the page
			if (was !== caret.enabled) caret.refresh();
		});

		// done
		callback();

	});

});