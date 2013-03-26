eqnx.def('mouse-highlight/picker', function(picker, callback){

	picker.kGoodTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'fieldset', 'form', 'td'];
	picker.kOkTags = ['li'];
	picker.kGoodCssDisplay = ['block', 'inline-block', 'table-cell'];
	picker.kOkCssDisplay = ['list-item'];

	// How much empty space around an object is visually significant, separating it from others
	picker.kSignificantMargin = 3;

	// Elements to never highlight
	picker.kBlackListQuery = '#eqnx-panel, #eqnx-badge, #eq360-bg';

	eqnx.use('jquery', 'style', function($, styles){

		picker.find = function find(start) {
			// TODO don't return items with CSS transitions specified -- just to be defensive. We are mucking with that stuff.
			// TODO we may not want to return any floating/out-of-flow items for now. At least, we will need to look at this.
			var bestResult = $();
			var bestScore = 0;
			var current = start;
			if(start === document.body) {
				// Shortcut -- no highlight for body itself
				return bestResult;
			}
			if($(picker.kBlackListQuery).is(start) || $(picker.kBlackListQuery).has(start).length){
				// In Equinox widget ... do not highlight ourselves
				return bestResult;
			}

			while(current != document.documentElement){
				var tag = current.localName;
				var score = 0;
				if($.inArray(tag, picker.kGoodTags)){
					bestResult = $(current);
					break;
				}

				if($.inArray(tag, picker.kOkTags)){
					score += 10;
				}

				var style = styles.getComputed(current);
				var displayStyle = style['display'];
				if($.inArray(displayStyle, picker.kGoodCssDisplay)){
					bestResult = $(current);
					break;
				}

				if($.inArray(displayStyle, picker.kOkCssDisplay)) {
					score += 10;
				}

				// Visually separated from other elements
				if(style['backgroundColor'] || style['backgroundImage']) {
					bestResult = $(current);
					break;
				}

				if((parseInt(style['outline-top-width']) && parseInt(style['outline-left-width'])) || (parseInt(style['border-top-width']) && parseInt(style['border-left-width']))) {
					bestResult = $(current); // has a border around it
					break;
				}

				if(parseInt(style['margin-top']) + parseInt(style['padding-top']) >= picker.kSignificantMargin && parseInt(style['margin-left']) + parseInt(style['padding-left']) >= picker.kSignificantMargin) {
					bestResult = $(current); // has a significant empty space around it
					break;
				}

				if(style['left'] || style['top']) {
					bestResult = $(current); // Positioned element
					break;
				}

				if(score > bestScore) {
					bestScore = score;
					bestResult = $(current);
				}

				current = current.parentElement;
			}

			return bestResult;
		};

		callback();

	});

});