/*
 * This module determines if an element should generate a mouse highlight, and
 * be zoomable when the user hits the spacebar.  It starts off with a set of
 * easy/fast rules and moves towards more a more complex scoring approach.  
 * It is still very simple in it's approach but hopefully has been structured
 * to allow for intelligent behaviors without major performance penalties.

 data-sitecues-highlight
 data-sitecues-highlight-role

 */
sitecues.def('mouse-highlight/picker', function(picker, callback, console) {

	picker.debug = false;

	// Whitelist of css display properties we'll allow
	picker.validDisplays = [
		'block',
		'inline',
		'inline-block', 
		'list-item',
		'table-cell'
	];

// AK >> this is not used b/c we already exluded these elements from highlight valid targets (see isInBody varibale below)
//	// Element IDs to never highlight
//	picker.blacklistIds = [
//		'#sitecues-panel',
//		'#sitecues-badge',
//		'#sitecues-eq360-bg'
//	];
//    
    picker.kTargetStates = {
        'sometimes': 's',
        'true'     : 't',
        'false'    : 'f'
    }

	sitecues.use('jquery', 'style', 'mouse-highlight/roles', function($, styles, roles) {

		/*
		 * Find the best highlightable element, if any, given a target element.
		 *
		 * @param hover The element the mouse is hovering over
		 */
		picker.find = function find(hover) {
			var el = hover instanceof $ ? hover : $(hover);
			var eScore, eTarget = el.data('sitecues-mouse-hl');
			if (!eTarget) {
				// Let's determine, and remember, what this element is.
				eTarget = picker.isTarget(el);
				if (eTarget == null) {
					eTarget = this.kTargetStates['sometimes'];
				} else if (eTarget) {
					eTarget = this.kTargetStates['true'];
				} else { 
					eTarget = this.kTargetStates['false'];
				}
				el.data('sitecues-mouse-hl', eTarget);
			}
			if (eTarget === this.kTargetStates['true']) {
				// It's definitely a target as determined previously
				return el;
			} else if (eTarget === this.kTargetStates['false']) {
				// It's definitely not a target as determined previously
			} else if (eTarget === this.kTargetStates['sometimes']) {
				eScore = el.data('sitecues-mouse-hl-score');
				if (eScore == null) {
					eScore = picker.getScore(el);
					el.data('sitecues-mouse-hl-score', eScore);
				}
				// The target may or may not be a target, depending on how it scores.
			}
			if (eScore && eScore > 0) {
				// The hovered element is a viable choice and no better one has been identified.
				return el;
			}
			// No candidates
            if (el.parent().length) {
                return picker.find(el.parent());
            }
            return false;
		};

		/*
		 * Heuristics
		 *
		 * These are the 'hard and fast' rules we can use to make quick 
		 * calls about an element.  If heuristics fails to make a
		 * determination, we'll proceed to the scoring section.
		 * 
		 */
		picker.isTarget = function(e) {

                        // hide previous mh target if now mouseiver sitecues toolbar
                        var isInBody = false, isInBadge = false;
                        var $bagde = $('#sitecues-badge');
                        $.each($(e).parents().andSelf(), function(i, parent) {
                            var $parent = $(parent);
                            if ($parent.is(document.body)) {
                                isInBody = true;
                                return;
                            }
                            if ($parent.is($bagde)) {
                                isInBadge = true;
                                return;
                            }
                        })

                        // Ignore elements not in the body: BGD, panel, toolbar
                        if (!isInBody || isInBadge) {
                          return false;
                        }

			var highlight = $(e).data('sitecues-highlight');
			if (typeof sitecues != 'undefined' && highlight != '' && highlight != null) {
				// We have some kind of value for this attribute
				if (highlight) {
					return true;
				}
				return false;
			}
			var role = roles.find(e);
			if (!role || !role.canHighlight) {
				// Element we ignore
				return false;
			}

// AK >> this is not used b/c we already exluded these elements from highlight valid targets (see isInBody varibale above)
//                      var node = e.get(0);
//			if (node.id && $.inArray(node.id, picker.blacklistIds) >= 0) {
//				// IDs we ignore
//				return false;
//			}

			var width = e.width();
			if (width < 5) {
				// Don't highlight things that have no width
				return false;
			}

			var height = e.height();
			if (height < 5) {
				// Don't highlight things that have no height
				return false;
			}

			var style = styles.getComputed(e);
			if ($.inArray(style['display'], picker.validDisplays) < 0) {
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
			var role = roles.find(e);
			var score = 0, txtLen = -1, textNodes = false, highlightableChild = null;

			if (e.contents()) {
				e.contents().each(function() {
					if (this.nodeType == 3 && this.nodeValue.trim().length > 0) {
						textNodes = true;
						//console.info(this); // Removed this to make logs easier to read. - Al
					}
				});
			}

			// Let's see if we should re-assign this to a text node.
			if (!role.shouldContainText && textNodes) {
				if (txtLen == -1) {
					txtLen = e.text().trim().length;
				}
				role = roles.roles.longText;
			}

			if (role.shouldContainText) {
				if (txtLen == -1) {
					txtLen = e.text().trim().length;
				}
				if (txtLen < 1) {
					// No text
					score -= 10;
				} else if (textNodes) {
					// Direct text children
					score += 10;
				} else {
					// Has text, but no direct children, this could be something
					// like a <p><b>text</b></p> or <td><p>foo</p></td>. What
					// we'll do here is that if we have at least one
					// highlightable child, we'll skip this element.  There is
					// definitely room for improvement in this logic.
					if (highlightableChild == null) {
						e.children().each(function() {
							if (picker.isTarget($(this)) != false && picker.getScore($(this)) > 0) {
								highlightableChild = true;
							}
						});
					}
					if (highlightableChild) {
						score -= 10;
					} else {
						score += 1;
					}
				}
			} else if (role.name === 'graphic') {
				score += 1;
			} else {
				score -= 1;
			}

			if (picker.debug) {
				// These are for seeing the results in-context in a web
				// inspector.
				e
                .attr('sitecues-highlight-score',score)
                .attr('sitecues-highlight-role',role.name)
                .attr('sitecues-highlight-text-nodes',textNodes)
                .attr('sitecues-highlight-text-length',txtLen)
                .attr('sitecues-highlight-child',highlightableChild);
			}

			return score;
		}

		/*
		 * A semi-functional debug method.
		 */
		picker.debugShowAll = function(e) {
			if (!e) {
				e = $("body");
			}
			e.children().each(function() {
				if (picker.isTarget($(this) || picker.find($(this)) == $(this))) {
					// Tell all children that they have a highlightable parent
					$(this).find('*').data('sitecues-parent-hl','1');
					$(this).style("border", "1px solid red", 'important');
				}
				picker.showAll($(this));
			});
		}
		
		callback();

	});

});