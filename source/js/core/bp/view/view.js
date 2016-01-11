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
  'core/bp/view/panel/panel',
  'core/bp/view/badge/badge'
], function(BP_CONST,
            helper,
            bpSVG,
            placement,
            state,
            conf,
            sizeAnimation,
            platform,
            panel,
            baseBadge) {

  var byId = helper.byId,
    bpContainer,
    badgeElement;

  /*
   *** Private ***
   */

  function getBpContainerElement() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  // Allow animations just before panel expands
  function enableAnimations() {
    // todo: take out the class to const
    getSVGElement().setAttribute('class', 'scp-animate');
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
    bpContainer = document.createElement('sc');

    // Set attributes
    helper.setAttributes(bpContainer, BP_CONST.PANEL_CONTAINER_ATTRS);

    bpContainer.innerHTML = bpSVG();
  }

  // Can get SVG element whether currently attached to document or not
  function getSVGElement(bpContainer) {
    // Don't use helper.byId() because the element isn't inserted in DOM yet.
    return bpContainer.querySelector('#' + BP_CONST.SVG_ID);
  }

  /**
   *** Public ***
   */

  function update(isOpeningNewPanel) {

    var isOrWillBePanel = state.isPanelRequested(),
      classes = isOrWillBePanel ? panel.getViewClasses() : baseBadge.getViewClasses();
    classes += ' scp-ie9-' + platform.browser.isIE9;

    // If we are expanding or contracting, aria-expanded is true (enables CSS)
    updateAria(isOrWillBePanel);

    bpContainer.setAttribute('class', classes);

    sizeAnimation.animate(); // Will animate to new size, bt only if new state requires a different size

    if (isOpeningNewPanel) {
      sitecues.emit('bp/did-open-view');
    }
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

    badgeElement = badgePlacementElem;

    // Create the container and insert the SVG
    bpContainer = createBpContainer();
    var svgElement = getSVGElement(bpContainer);

    // Append the container to the badgeElement and fit to the space available
    placement.init(badgeElement, bpContainer, svgElement);

    // Get size animations ready
    sizeAnimation.init();

    // Set badge classes. Render the badge. Render slider.
    update();
    // Enable animations for next updates
    enableAnimations();

    // Turn on TTS button if the setting is on
    if (conf.get('ttsOn')) {
      require(['bp-expanded/view/tts-button'], function (ttsButton) {
        ttsButton.init();
      });
    }

    // Signal completion
    onComplete();
  }

  return {
    init: init,
    update: update
  };
});
