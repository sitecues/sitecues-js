/*
 * This module determines if an element should generate a mouse highlight, and
 * be zoomable when the user hits the spacebar.  It starts off with a set of
 * easy/fast rules and moves towards more a more complex scoring approach.  
 * It is still very simple in it's approach but hopefully has been structured
 * to allow for intelligent behaviors without major performance penalties.

 data-sitecues-highlight
 data-sitecues-highlight-role

 */
sitecues.def('mouse-highlight/picker', function(picker, callback) {

  picker.debug = false;

  // Whitelist of css display properties we'll allow
  picker.validDisplays = [
    'block',
    'inline-block',
    'list-item',
    'table-cell'
  ];

  var PICK_ME_FIRST = [
    { "url": "eeoc.gov", selector: '#CS_Element_bigbox', enabled: window.sitecues.getLibraryConfig().sitepickermods.eeoc_gov },
    { "url": "scotiabank.", selector: ".frutiger",       enabled: window.sitecues.getLibraryConfig().sitepickermods.scotiabank_com },
    { "url": "cnib.ca", selector: ".slides",             enabled: window.sitecues.getLibraryConfig().sitepickermods.cnib_ca },
    { "url": "texasat.net", selector: "#slideshow",      enabled: window.sitecues.getLibraryConfig().sitepickermods.texasat_net }
  ];

  
  for( var i = 0; i <  PICK_ME_FIRST.length; i++){

      if( (PICK_ME_FIRST[i].enabled) === false ){

        PICK_ME_FIRST.splice( i, 1);
      }
    }



// AK >> this is not used b/c we already exluded these elements from highlight valid targets (see isInBody variable below)
//  // Element IDs to never highlight
//  picker.blacklistIds = [
//    '#sitecues-panel',
//    '#sitecues-badge',
//    '#sitecues-eq360-bg'
//  ];
//    
  picker.kTargetStates = {
      'sometimes': 's',
      'true'     : 't',
      'false'    : 'f'
  }

  sitecues.use('jquery', 'style', 'mouse-highlight/roles', function($, styles, roles) {

    /*
     * Find the best highlightable element, if any, given a target element.
     * Returns JQuery object if anything picked, otherwise null (never returns JQuery object of length 0)
     *
     * @param hover The element the mouse is hovering over
     */
    picker.find = function find(hover) {

      // console.log(hover.tagName);

      switch (hover.tagName) {
      case "SPAN":
      case "P":
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
      case "B":
      case "I":
      case "A":
      case "IMG":
      case "STRONG":
      case "ADDRESS":
      case "LI":
      case "DD":
      case "DT":
            var $el = $(hover);
            // hide previous mh target if now mouseover sitecues toolbar
            var isInBody = false, isInBadge = false;
            var badge = $('#sitecues-badge');
            var parents = $el.parents().andSelf();
            $.each(parents, function(i, parent) {
              var $parent = $(parent);
              if ($parent.is(document.body)) {
                isInBody = true;
                return null;
              }
              if ($parent.is(badge)) {
                isInBadge = true;
                return null;
              }
            });

            // Ignore elements not in the body: BGD, panel, toolbar
            if (!isInBody || isInBadge) {
              return null;
            }

            var picked = pickMeFirst(parents);
            if (picked && picked.length) {
              return picked;
            }

            picked = picker.findImpl(hover);
            if (!picked || !picked.length) {
              return null; // Normalize
            }
            return picked;
        break;
      default:
        break;
      }
    };

    function pickMeFirst(parents) {
      var currLoc = window.location;

      for (var count = 0; count < PICK_ME_FIRST.length; count ++) {
        if (currLoc.toString().indexOf(PICK_ME_FIRST[count].url) >= 0) {

          var selector = PICK_ME_FIRST[count].selector;
          return parents.filter(selector).first();
        }
      }
      return null;
    }

    picker.findImpl = function(hover) {

      var el = hover instanceof $ ? hover : $(hover);
      var eScore, eTarget = el.data('sitecues-mouse-hl');
      if (!eTarget) {
        // Let's determine, and remember, what this element is.
        eTarget = picker.isTarget(el.get(0));
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
        eScore = picker.getScore(el);
        // The target may or may not be a target, depending on how it scores.
      }
      if (eScore && eScore > 0) {
        // The hovered element is a viable choice and no better one has been identified.
        return el;
      }
      // No candidates
      if (el.parent().length) {
          return picker.findImpl(el.parent());
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
    picker.isTarget = function(el, debug) {
      var $el = $(el);
      var highlight = $el.data('sitecues-highlight');
      if (typeof sitecues != 'undefined' && highlight != '' && highlight != null) {
        // We have some kind of value for this attribute

        if (highlight) {
          return true;
        }
        return false;
      }
      var role = roles.find($el);
      if (!role || !role.canHighlight) {
        // Element we ignore
        return false;
      }

// AK >> this is not used b/c we already exluded these elements from highlight valid targets (see isInBody variable above)
//                      var node = eltry.get(0);
//      if (node.id && $.inArray(node.id, picker.blacklistIds) >= 0) {
//        // IDs we ignore
//        return false;
//      }

      var width = $el.width();
      if (width < 5) {
        // Don't highlight things that have no width
        return false;
      }

      var height = $el.height();
      if (height < 5) {
        // Don't highlight things that have no height
        return false;
      }

      if (role.alwaysHighlight) {
        return true;
      }

      var style = styles.getComputed(el);
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
      var savedScore = e.data('sitecues-mouse-hl-score');
      if (savedScore != null) {
        return savedScore;
      }

      var score = picker.getScoreImpl(e);
      e.data('sitecues-mouse-hl-score', score);
      return score;
    }
    picker.getScoreImpl = function(e) {
      var role = roles.find(e);
      var score = 0, txtLen = -1, textNodes = false;
      var highlightableChild = false, unhighlightableChild = false;

      var contents = e.contents();
      if (contents) {
        contents.each(function() {
          if (this.nodeType === 3) {
            if (this.nodeValue.trim().length > 0) {
              textNodes = true;
              unhighlightableChild = true;
            }
          }
          else if (this.nodeType === 1) {
            var display = $(this).css('display');
            if (display === 'inline' || display === 'inline-block')
              unhighlightableChild = true;
            else if (picker.isTarget(this) != false) {
              highlightableChild = true;
            }
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
          if (highlightableChild) {
            score -= 10;
          } else {
            score += 1;
          }
        }
      } else if (role.name === 'list' && (e.prop('tagName').toLowerCase() === 'ol' || e.prop('tagName').toLowerCase() === 'ul')) {
      score += 1;
      } else {
        if (unhighlightableChild) {
          score += 1;
        }
        else if (highlightableChild) {
          score -= 1;
        }
        else {
          score += 1;
        }
      }
      //If we are thinking about picking an <li>
      if (role.name === 'shortText' && e.prop('tagName').toLowerCase() === 'li') {
        //Give it a positive score if it float or is inline (navigational elements)
        if ($(e).css('float') !== 'none' || $(e).css('display') === 'inline') {
          score += 1;
        } else {
        //Give it a non-positive score if its just an ordinary list item
          score = 0;
        }
      }
      //If we are thinking about picking an <a> that has an <li> as its immediate parent
      if (e.prop('tagName').toLowerCase() === 'a' && $(e).parent('li').length) {
        //Give it a positive score if the <li> is floating or has display:inline
        if ($(e).parent('li').css('float') !== 'none' || $(e).parent('li').css('display') === 'inline') {
          score += 1;
        } else {
        //Give it a non-positive score if its an ordinary <li><a></a></li> (We want to select the <li> or its parent <ul>)
          score = 0;
        }
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