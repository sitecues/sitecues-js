/**
 * Badge, toolbar and panel base view
 */
define(
  [
    'core/bp/constants',
    'core/bp/helper',
    'core/bp/view/svg',
    'core/bp/view/badge/placement',
    'core/bp/model/state',
    'core/conf/preferences',
    'core/bp/view/size-animation',
    'core/locale',
    'core/conf/site',
    'core/bp/view/panel/panel-classes',
    'core/bp/view/badge/badge-classes',
    'core/events',
    'core/history-change-events',
    'core/inline-style/inline-style'
  ],
  /*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
  function (
    BP_CONST,
    helper,
    bpSVG,
    placement,
    state,
    pref,
    sizeAnimation,
    locale,
    site,
    panelClasses,
    badgeClasses,
    events,
    historyChange,
    inlineStyle
  ) {
  /*jshint +W072 */
  'use strict';

  var byId = helper.byId,
    bpContainer,
    badgeElement,
    svgElement;

  /*
   *** Private ***
   */

  function getBpContainerElement() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  // The bpContainer lives just inside the badge placeholder, contains all the visible BP content, and can change size
  function createBpContainer() {
    // Create the svg container
    var bpContainerElem = document.createElement('sc');

    // Set attributes
    helper.setAttributes(bpContainerElem, BP_CONST.PANEL_CONTAINER_ATTRS);

    bpContainerElem.innerHTML = bpSVG();

    return bpContainerElem;
  }

  // Can get SVG element whether currently attached to document or not
  function getSVGElement(bpContainer) {
    // Don't use helper.byId() because the element isn't inserted in DOM yet.
    return bpContainer.querySelector('#' + BP_CONST.SVG_ID);
  }

  // Update accessibility attributes
  function updateAria(isPanel) {
    // Let the user know that the button is expandable
    badgeElement.setAttribute('aria-expanded',isPanel);

    // Hide the inner contents of the button when it's just a button
    getBpContainerElement().setAttribute('aria-hidden', !isPanel);
  }

  // If the settings are not undefined it means sitecues has been turned on before
  function hasSitecuesEverBeenOn() {
    return pref.has('zoom') || pref.has('ttsOn');
  }

  // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
  // The badge label will be absolutely positioned offscreen in order to not affect layout
  function addLabel(badgeOrToolbarElement) {
    var badgeLabelElement = document.createElement('sc');
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);

    inlineStyle.set(badgeLabelElement, {
      position : 'absolute',
      left     : '-9999px'
    });

    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }

  /**
   *** Public ***
   */

  // Rerender the panel with the current model (state).
  // isNewPanel is true when a new view is shown within the panel (different widgets are present)
  function update(isNewSubpanel) {

    // Get the view classes that will create the desired appearance
    var isOrWillBePanel = state.isPanelRequested(),
      classes = isOrWillBePanel ? panelClasses.getViewClasses() : badgeClasses.getViewClasses();

    // This will cause the CSS to update
    bpContainer.setAttribute('class', classes);

    if (!isOrWillBePanel) {
      updateBadgePalette();
    }

    // If we are expanding or contracting, aria-expanded is true (enables CSS and communicates with screen readers)
    updateAria(isOrWillBePanel);

    // Animate to new size (only if new state requires a different size)
    sizeAnimation.animate();

    // Fire new panel event if appropriate
    if (isNewSubpanel) {
      events.emit('bp/did-open-subpanel');
    }
  }

  function updateBadgePalette() {
    var currentBadgeClassAttr = badgeElement.getAttribute('class') || '',
      newBadgeClassAttr = currentBadgeClassAttr.replace(/scp-palette-[a-z]+/, '') + ' ' + badgeClasses.getPaletteClass();
    badgeElement.setAttribute('class', newBadgeClassAttr);
  }

  // Location of page has changed via history API.
  // We must update our hashes so that they are not pointing to the wrong place,
  // otherwise the badge/panel will show up empty (SC-3797)
  function updateSvgHashes(oldPath, newPath) {
    function updateAttribute(element, attribute) {
      var oldValue = element.getAttribute(attribute),
        newValue = oldValue.replace(oldPath + '#', newPath + '#');

      element.setAttribute(attribute, newValue);
    }

    function updateElements(selector, attribute) {
      var elements = svgElement.querySelectorAll(selector),
        index = elements.length;

      while (index --) {
        updateAttribute(elements[index], attribute);
      }

    }
    updateElements('use', 'xlink:href');
    updateElements('a', 'href');
    updateElements('[filter]', 'filter');
  }

  // This function augments the badge placement element, which is passed in.
  // This is an element that will have <svg> and other markup inserted inside of it.
  //
  // It binds the permanent event handlers. It positions the elements so they appear directly over
  // the websites placeholder.  It sets the SVG height and width so that it visually covers the
  // placeholder/badgeElement.  It binds event handlers to append the BPContainer to <html> or
  // the badgeElement (switching parent).
  function init(badgePlacementElem) {

    // Create the container and insert the SVG
    badgeElement = badgePlacementElem;
    bpContainer = createBpContainer();
    svgElement = getSVGElement(bpContainer);

    historyChange.on(updateSvgHashes);

    // Real settings or fake initial settings?
    if (!SC_EXTENSION) {
      // Use fake settings if undefined -- user never used sitecues before.
      // This will be turned off once user interacts with sitecues.
      state.set('isRealSettings', site.get('alwaysRealSettings') || hasSitecuesEverBeenOn());
    }

    // Set attributes
    helper.setAttributes(badgeElement, BP_CONST.BADGE_ATTRS);

    // Label it
    addLabel(badgeElement);

    // Append the container to the badgeElement and fit to the space available
    placement.init(badgeElement, bpContainer, svgElement);

    // Get size animations ready so that the badge can gracefully grow into a panel
    sizeAnimation.init();

    // Set badge classes. Render the badge. Render slider.
    update();
  }

  return {
    init: init,
    update: update
  };
});
