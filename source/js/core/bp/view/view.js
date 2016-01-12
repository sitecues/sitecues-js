/**
 * Badge, toolbar and panel base view
 */
define([
  'core/bp/constants',
  'core/bp/helper',
  'core/bp/view/svg',
  'core/bp/view/badge/placement',
  'core/bp/model/state',
  'core/conf/user/manager',
  'core/bp/view/size-animation',
  'core/platform',
  'core/locale',
  'core/conf/site',
  'core/bp/view/panel/panel-classes',
  'core/bp/view/badge/badge-classes'
], function(BP_CONST,
            helper,
            bpSVG,
            placement,
            state,
            conf,
            sizeAnimation,
            platform,
            locale,
            site,
            panelClasses,
            badgeClasses) {

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

  // Update accessibility attributes
  function updateAria(isPanel) {
    // Let the user know that the button is expandable
    badgeElement.setAttribute('aria-expanded',isPanel);

    // Hide the inner contents of the button when it's just a button
    getBpContainerElement().setAttribute('aria-hidden', !isPanel);
  }

  function createBpContainer() {
    // Create the svg container
    var bpContainer = document.createElement('sc');

    // Set attributes
    helper.setAttributes(bpContainer, BP_CONST.PANEL_CONTAINER_ATTRS);

    bpContainer.innerHTML = bpSVG();

    return bpContainer;
  }

  // Can get SVG element whether currently attached to document or not
  function getSVGElement(bpContainer) {
    // Don't use helper.byId() because the element isn't inserted in DOM yet.
    return bpContainer.querySelector('#' + BP_CONST.SVG_ID);
  }

  /**
   *** Public ***
   */

  function update(isNewSubpanel) {

    var isOrWillBePanel = state.isPanelRequested(),
      classes = isOrWillBePanel ? panelClasses.getViewClasses() : badgeClasses.getViewClasses();
    classes += ' scp-ie9-' + platform.browser.isIE9;

    // If we are expanding or contracting, aria-expanded is true (enables CSS)
    updateAria(isOrWillBePanel);

    bpContainer.setAttribute('class', classes);

    sizeAnimation.animate(); // Will animate to new size, bt only if new state requires a different size

    if (isNewSubpanel) {
      sitecues.emit('bp/did-open-subpanel');
    }
  }

  function hasSitecuesEverBeenOn() {
    return typeof conf.get('zoom') !== 'undefined' ||
      typeof conf.get('ttsOn') !== 'undefined';
  }

  function addLabel(badgeOrToolbarElement) {
    // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
    // The badge label will be absolutely positioned offscreen in order to not affect layout
    var badgeLabelElement = document.createElement('sc');
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);
    badgeLabelElement.style.position = 'absolute';
    badgeLabelElement.style.left = '-9999px';

    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }

  // This function augments the customers placeholder if found, otherwise creates the floating badge.
  // The "augmented placeholder", known as the badgeElement, contains the <div> container that contains
  // the <svg> markup. It inserts the <svg> into the <div> and puts that <div> inside the badge element
  // (determined by badge.init()).
  //
  // It binds the permanent event handlers. It positions the elements so they appear directly over
  // the websites placeholder.  It sets the SVG height and width so that it visually covers the
  // placeholder/badgeElement.  It binds event handlers to append the BPContainer to <html> or
  // the badgeElement (switching parent).
  function init(badgePlacementElem, onComplete) {

    // Create the container and insert the SVG
    badgeElement = badgePlacementElem;
    bpContainer = createBpContainer();
    svgElement = getSVGElement(bpContainer);

    // Append the container to the badgeElement and fit to the space available
    placement.init(badgeElement, bpContainer, svgElement);

    // Real settings or fake initial settings?
    if (!SC_EXTENSION) {
      // Use fake settings if undefined -- user never used sitecues before.
      // This will be turned off once user interacts with sitecues.
      state.set('isRealSettings', site.get('alwaysRealSettings') || hasSitecuesEverBeenOn());
    }

    // Get size animations ready
    sizeAnimation.init();

    // Set attributes
    helper.setAttributes(badgeElement, BP_CONST.BADGE_ATTRS);

    // Label it
    addLabel(badgeElement);

    // Set badge classes. Render the badge. Render slider.
    update();

    // Completion
    onComplete();
  }

  return {
    init: init,
    update: update
  };
});
