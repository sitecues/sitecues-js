/**
 * Badge and toolbar support
 */
define(['core/bp/constants', 'core/locale', 'core/bp/helper', 'core/conf/site', 'core/bp/view/svg', 'core/bp/view/placement', 'core/bp/model/state'], function(BP_CONST, locale, helper, site, bpSVG, placement, state) {

  var isInitialized;

  /*
   *** Private ***
   */

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

  function labelBadgeOrToolbar(badgeOrToolbarElement) {
    // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
    // The badge label will be absolutely positioned offscreen in order to not affect layout
    var badgeLabelElement = document.createElement('sc');
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);
    badgeLabelElement.style.position = 'absolute';
    badgeLabelElement.style.left = '-9999px';

    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }

  /**
   *** Publics ***
   */

  function getViewClasses() {

    var classBuilder = BP_CONST.WANT_BADGE;

    if (state.isBadge()) {
      classBuilder += ' ' + BP_CONST.IS_BADGE;
    }

    if (state.get('isRealSettings')) {
      // *** scp-realsettings ***
      // Show the real settings for the badge (not the fake ones)
      // Why it's used:
      // The initial badge is easier-to-see, more attractive and more inviting when speech is on and zoom is
      // somewhere in the middle. Therefore the initial badge uses fake settings.
      // However, once the user has ever expanded the badge or used sitecues we show the real settings.
      classBuilder += ' scp-realsettings';
    }

    return classBuilder;
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
  function init(baseBadgeElem, onComplete) {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Set attributes
    helper.setAttributes(baseBadgeElem, BP_CONST.BADGE_ATTRS);

    // Label it
    labelBadgeOrToolbar(baseBadgeElem);

    // Create the container and insert the SVG
    var bpContainer = createBpContainer(),
      svgElement = getSVGElement(bpContainer);

    // Append the container to the badgeElement and fit to the space available
    placement.init(baseBadgeElem, bpContainer, svgElement);

    // Signal completion
    onComplete();
  }

  return {
    init: init,
    getViewClasses: getViewClasses
  };

});
