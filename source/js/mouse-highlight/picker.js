/*
 * This module determines if an element should generate a mouse highlight, and
 * be zoomable when the user hits the spacebar.  It starts off with a set of
 * easy/fast rules and moves towards more a more complex scoring approach.  
 * It is still very simple in it's approach but hopefully has been structured
 * to allow for intelligent behaviors without major performance penalties.
 */
eqnx.def('mouse-highlight/picker', function(picker, callback){

	// Whitelist of css display properties we'll allow
	picker.validDisplays = [
		'block', 
		'inline-block', 
		'list-item',
		'table-cell'
	];

	// Element IDs to never highlight
	picker.blacklistIds = [
		'#eqnx-panel',
		'#eqnx-badge',
		'#eqnx-eq360-bg'
	];

	// We completely ignore these elements
	picker.blacklist = [
		'!--...--',
		'!doctype',
		'area',
		'base',
		'basefont',
		'bdo',
		'br',
		'head',
		'body',
		'center',
		'col',
		'colgroup',
		'font',
		'hr',
		'html',
		'frame',
		'frameset',
		'iframe',
		'link',
		'map',
		'meta',
		'noframes',
		'noscript',
		'optgroup',
		'option',
		'param',
		'script',
		'style',
		'tbody',
		'tfoot',
		'thead',
		'title'
	];

	// We just zoom these elements automatically
	picker.graphicsTags = [
		'applet',
		'img',
		'object'
	];

	// We treat these elements as inline text fragments
	picker.fragmentTags = [
		'a',
		'abbr',
		'acronym',
		'b',
		'big',
		'cite',
		'del',
		'dfn',
		'kbd',
		'em',
		'i',
		'ins',
		'q',
		'small',
		'span',
		'strike',
		'strong',
		's',
		'samp',
		'var',
		'sub',
		'sup',
		'u'
	];

	// We treat these elements as headers.  This means they should probably include some of the following content to be useful.
	picker.headingTags = [
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'caption',
		'legend'
	];

	// We treat these elements as large or typically independent text blocks
	picker.bigTextTags = [
		'address',
		'blockquote',
		'code',
		'p',
		'pre',
		'tt'
	];

	// We treat these elements as small text blocks that we may want to join together.  Note that these are conventionally used in lists.
	picker.smallTextTags = [
		'dt',
		'th',
		'td',
		'dd',
		'li'
	];

	// We treat these elements as arbitrary containers
	// Note that all unknown elements are effectively part of this list too.
	picker.containerTags = [
		'div',
		'fieldset',
		'tr'
	];

	// We treat these elements as arbitrary containers
	// Note that all unknown elements are effectively part of this list too.
	picker.listTags = [
		'table',
		'dir',
		'dl',
		'form',
		'ol',
		'ul',
		'menu'
	];

	// These are inputs.  They are pretty similar to small text blocks but less flexible.
	picker.inputTags = [
		'button',
		'input',
		'isindex',
		'select',
		'textarea',
		'label'
	];


	eqnx.use('jquery', 'style', 'util/common', function($, styles, common){

		/*
		 * Find the best highlightable element, if any, given a target element.
		 *
		 * @param hover The element the mouse is hovering over
		 */
		picker.find = function find(hover) {
			var e = hover instanceof $ ? hover : $(hover);
			if(e.is('body')) {
				// We're at the body, we're done.
				return null;
			}
			var eScore, eTarget = e.data('eqnx-mouse-hl');
			if(!eTarget) {
				// Let's determine, and remember, what this element is.
				eTarget = picker.isTarget(e);
				if(eTarget == null) {
					eTarget = 's';
				} else if (eTarget) {
					eTarget = 't'
				} else {
					eTarget = 'f';
				}
				e.data('eqnx-mouse-hl', eTarget);
			}
			if(eTarget === 't') {
				// It's definitely a target as determined previously
				return e;
			} else if (eTarget === 'f') {
				// It's definitely not a target as determined previously
			} else if (eTarget === 's') {
				eScore = e.data('eqnx-mouse-hl-score');
				if(eScore == null) {
					eScore = picker.getScore(e);
					e.data('eqnx-mouse-hl-score', eScore);
				}
				// The target may or may not be a target, depending on how it scores.
			}
			if(eScore && eScore > 0) {
				// The hovered element is a viable choice and no better one has been identified.
				return e;
			}
			// No candidates
			return picker.find(e.parent());
		};

		/*
		 * Heuristics
		 *
		 * These are the 'hard and fast' rules we can use to make quick 
		 * calls about an element.  If heuristics fails to make a
		 * determination, we'll proceed to the scoring section.
		 */
		picker.isTarget = function(e) { 
			var node = e.get(0);
			var nodeName = node.nodeName.toLowerCase();
			if($.inArray(nodeName, picker.blacklist) >= 0) {
				// Element we ignore
				return false;
			}
			if($.inArray(nodeName, picker.graphicsTags) >= 0) {
				if(e.parent().is('a')) {
					// We'll skip linked images
					// TODO Don't zoom embedded thumbnails directly

					// TODO Testing simply on a parent of 'a' will catch most 
					// instances but ignores intermediary elements and link-
					// like onclick evenets.  We should eventually try to 
					// improve identifying if we're in a "link".
					return false;
				}
				return true;
			}
			if($.inArray(nodeName, picker.headingTags) >= 0) {
				if(e.parent().is('a')) {
					// We'll skip linked headers
					// TODO Allow for highlighting groups of elements such as a header and the following paragraphs
					return false;
				}
				return true;
			}
			if(node.id && $.inArray(node.id, picker.blacklistIds) >= 0) {
				// IDs we ignore
				return false;
			}

			var width = e.width();
			if(width == 0) {
				// Don't highlight things that have no width
				return false;
			}

			var height = e.height();
			if(height == 0) {
				// Don't highlight things that have no height
				return false;
			}

			var style = styles.getComputed(e);
			if($.inArray(style['display'], picker.validDisplays) < 0) {
				// Don't highlight things that aren't block elements
				return false;
			}
			return null;
		}

			/*
			 * Scoring
			 *
			 * We've failed to make a decisions based on simple rules, so we
			 * will analyze features of the element and it's environment and 
			 * assign an additive score.  If this score reaches a certain 
			 * threshold, the element will be highlightable.
			 *
			 */
		picker.getScore = function(e) { 
			var node = e.get(0);
			var nodeName = node.nodeName.toLowerCase();
			var score = 0, txtLen = 0;
			var shouldContainText = true;
			var shouldBeChild = false;
			if($.inArray(nodeName, picker.smallTextTags) >= 0) {
				shouldBeChild = true;
				score += 1;
			} else if($.inArray(nodeName, picker.bigTextTags) >= 0) {
				score += 10;
			} else if($.inArray(nodeName, picker.fragmentTags) >= 0) {
				shouldBeChild = true;
				score -= 5;
			} else if($.inArray(nodeName, picker.containerTags) >= 0) {
				score -= 10;
			} else if($.inArray(nodeName, picker.listTags) >= 0) {
				score -= 1;
			} else if($.inArray(nodeName, picker.graphicsTags) >= 0) {
				// We're only here if we determined that a parent was a better choice
				score -= 10;
				shouldContainText = false;
			} else if($.inArray(nodeName, picker.inputTags) >= 0) {
				score -= 1;
			}
			if(shouldContainText) {
				txtLen = e.text().length;
				if(txtLen < 1) {
					score -= 10;
				} else {
					score += 10;
				}
			}
			return score;
		}

		/*
		 * A semi-functional debug method.
		 */
		picker.debugShowAll = function(e) {
			if(!e) {
				e = $("body");
			}
			e.children().each(function() {
				if(picker.isTarget($(this) || picker.find($(this)) == $(this))) {
					// Tell all children that they have a highlightable parent
					$(this).find('*').data('eqnx-parent-hl','1');
					$(this).css("border","1px solid red");
				}
				picker.showAll($(this));			
			});
		}

		// eqnx.on('speech/enable', picker.debugShowAll);
		// eqnx.on('highlight/enable', picker.debugShowAll);
		
		callback();

	});

});