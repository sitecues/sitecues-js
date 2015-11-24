// todo: add getBadge() and other methods for public API.

/**
 * Plan:
 * 1. On document ready
 * 2. Create and insert badge:
 *    - If page has an existing badge, use it as an pivot point to insert badge b/c
 *      we need badge to stay within body to scale properly while zoom
 *    - Also, create a new badge and insert it as sibling to body(direct child to html) to use it later(see item 5 below)
 * 3. Initialize and show badge internals(SVG) based on...
 *    - User preferences for zoom level
 *    - TTS state
 *    - Color schema
 *    - etc.
 * 4. Build panel(later: "More" button) and attach listeners
 * 5. On badge hover trigger panel to reparent b/c we don't want it to scale and to show(animate expansion)
 *    because we don't want it to scale while page zooms (e.g. while slider is manipulated)
 * 6. On panel leave shrink bp from panel to badge state
 * 7. On zoom make sure badge is inside the body to scale it
 * 8. On panel open make sure panel container and internals are outside the body to avoid scaling.
 *
 * Not for now:
 * 0. Loader
 * 1. PNG
 * 2. MORE
 *
 * Todo:
 * scp-close-button: shouldn't be in refreshPanelView()
 */

// TODO
// * Visuals:
//     * Better close panel animation from secondary panel (try Seth's ideas)
//     * JavaScript panel height increase for feature panels is slow.
//       Use browser-based animation rather than JS value increments. Easing, smoothness would be nice.
//     * Can we make animations even faster by rotating 1 degree
//     * Intelligent positioning of textarea and close button
// * Hook up
//     * Actually zoom (via event queue so it's not filled up with command?)
//     * Make sure it collapses back to appropriate place after zoom. Needs to zip to new badge location.
//     * Does page initially load with a png or with svg image?
//     * If we use png, how do we perfectly position new panel object over old svg
//     * If we use png, should we use this file to produce the png? For example, using canvg library.
// * Code cleanup / naming:
//     * Possibly, cleaner palette implementation, easy to understand for site owner, add all colors to it including bg colors
// * Feature panels
//     * Fill out features a bit more
//     * Add keyboard accessibility and ARIA
// * Add to docs: accessibility explanation, palettes, etc.

define(['core/bp/constants', 'core/bp/model/state', 'core/locale', 'core/bp/helper', 'core/conf/user/manager', 'core/conf/site'],
  function(BP_CONST, state, locale, helper, conf, site) {

  /*
   Default bounding box object.
   */
  var
    badgeOrToolbarElement,
    getNumberFromString = helper.getNumberFromString,
    lastBgColor,
    isInitialized;

  /*
   *** Privates ***
   */

  /**
   * Basic structure of badge:
   * TODO: Need to update this
   * Create a new badge element outside of the body to use it for panel state.
     This occurs when the page did not supply a #sitecues-badge page
     Create and insert a new one as a sibling to body for later usage.
   * <span #sitecues-badge>
   *    <svg>
   * </span>
   * @returns {Object}
   */
  function createToolbar() {

    var toolbarElement = document.createElement('sc'),
      docElem = document.documentElement;

    docElem.setAttribute('data-sitecues-toolbar', ''); // Enable default.css rules
    docElem.insertBefore(toolbarElement, docElem.childNodes[0]);

    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);
    ensureBodyBelowToolbar();

    state.set('isPageBadge', false);
    state.set('isToolbarBadge', true);

    if (!isToolbarUIRequested()) {
      console.log('No element with #sitecues-badge provided by page. Backup badge inserted. Contact support@sitecues.com for support.');
    }

    adjustFixedElementsBelowToolbar(toolbarElement);

    return toolbarElement;
  }

  // TODO Aaron hates this:
  // - it doesn't work that well across sites
  // - it's heavy in the page
  // - it causes us to load the page-features module just because we have a toolbar
  function adjustFixedElementsBelowToolbar(toolbarElement) {
    require(['page/zoom/fixed-position-fixer'], function(fixer) {
      // However, in the case of the toolbar, we must always move fixed position elements
      // down. As this process requires the style-service, when the toolbar is inserted,
      // we will initialize the style service immediately.
      document.body.style.position = 'relative';
      fixer.init(toolbarElement.offsetHeight);
    });
  }

  // In some cases body may be positioned absolutely above the toolbar
  function ensureBodyBelowToolbar() {
    var body = document.body;
    if (body) {
      if (getComputedStyle(body).position !== 'static' &&
        body.getBoundingClientRect().top < 41) {
          body.setAttribute('data-sc-extra-toolbar-bump', '');
      }
    }
    else {
      // Wait for body. There will always be one after DOMContentLoaded,
      // because the browser inserts one if the markup didn't provide it.
      document.addEventListener('DOMContentLoaded', ensureBodyBelowToolbar);
    }
  }

  function isToolbarUIRequested() {
    return site.get('uiMode') === 'toolbar';
  }

  // Create <div> and put the existing badge inside it.
  // Transfer necessary styles from the <img> to the <div>
  function convertExistingBadge() {

    // Transfer styles from placeholder <img> to <div>
    // Remove those styles from placeholder <img>
    function transferStylesFromExistingBadge (styles) {
      var len = styles.length,
          i   = 0;
      for (; i < len; i++) {
        div.style[styles[i]] = getNumberFromString(badgeComputedStyles[styles[i]]) + 'px';
        badgeOrToolbarElement.style[styles[i]] = 0;
      }
    }

    var div                 = document.createElement('sc'),
        badgeImgBoundingBox = helper.getRect(badgeOrToolbarElement),
        badgeComputedStyles = window.getComputedStyle(badgeOrToolbarElement),
        stylesToTransfer    = [
          'marginTop',
          'marginBottom',
          'marginLeft',
          'marginRight',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight'
        ];

    // Added to fix issue on ruhglobal.com
    if (badgeOrToolbarElement.style.position === 'relative') {
      stylesToTransfer.push('top');
      stylesToTransfer.push('left');
    }

    transferStylesFromExistingBadge(stylesToTransfer);

    // Set other styles that cannot be abstracted into a helper function.
    div.style.display = 'inline-block';
    div.style.height  = badgeImgBoundingBox.height - (badgeComputedStyles.paddingTop  + badgeComputedStyles.paddingBottom) + 'px';
    div.style.width   = badgeImgBoundingBox.width  - (badgeComputedStyles.paddingLeft + badgeComputedStyles.paddingRight)  + 'px';
    div.style.float   = badgeComputedStyles.float;

    badgeOrToolbarElement.setAttribute('aria-hidden', true); // Existing badge is hidden from screen readers, because the new <div> parent will be the real badge
    badgeOrToolbarElement.parentElement.insertBefore(div, badgeOrToolbarElement);

    div.appendChild(badgeOrToolbarElement);

  }

  function removeExistingBadgeId() {
    badgeOrToolbarElement.removeAttribute('id');
  }

  function setBadgeParentId() {
    badgeOrToolbarElement.parentElement.id = BP_CONST.BADGE_ID;
  }

  function checkBackgroundColorChange(doForceBadgeUpdate) {
    var newBgColor = getBackgroundColor(),
      doBadgeUpdate = doForceBadgeUpdate;

    if (newBgColor !== lastBgColor) {
      lastBgColor = newBgColor;
      doBadgeUpdate = true;
    }

    if (doBadgeUpdate) {
      sitecues.emit('bp/did-change');
      if (SC_DEV) { console.log('Updating badge palette'); }
    }
  }

  function getBackgroundColor() {
    return getComputedStyle(document.body).backgroundColor;
  }

  // Input event has occurred that may trigger a theme change produced from the website code
  // (as opposed to sitecues-based themes). For example, harpo.com, cnib.ca, lloydsbank have their own themes.
  function onPossibleWebpageThemeChange() {
    setTimeout(checkBackgroundColorChange, 0);
  }

  // Listen for change in the web page's custom theme (as opposed to the sitecues-based themes).
  // We don't know when they occur so we check shortly after a click or keypress.
  function addWebPageThemeListener() {
    document.body.addEventListener('click', onPossibleWebpageThemeChange);
    document.body.addEventListener('keyup', onPossibleWebpageThemeChange);
    lastBgColor = getBackgroundColor();
  }

  // Listen for changes in the sitecues theme
  function addSitecuesThemeListener() {
    sitecues.on('theme/did-apply', onSitecuesThemeChange);
  }

  function onSitecuesThemeChange(newTheme) {
    // If sitecues theme changes to dark, force adaptive palette. Otherwise use default palette.
    state.set('isAdaptivePalette', newTheme === 'dark');
    checkBackgroundColorChange(true);
  }

  function setCustomPalette (badgeElement) {

    var paletteName = getBadgePalette(badgeElement);
    if (paletteName === BP_CONST.PALETTE_NAME_MAP.adaptive) {
      state.set('isAdaptivePalette', true);
      addWebPageThemeListener();
    }

    addSitecuesThemeListener();

    state.set('paletteName', paletteName);

  }

  function getBadgePalette(badgeElem) {
    var paletteName = badgeElem.localName === 'img' ? badgeElem.src : site.get('palette') || '',
      fullNames = Object.keys(BP_CONST.PALETTE_NAME_MAP),
      index = 0;

    // Check for a string because site.get('palette')
    // returns an Object if a custom palette is used.
    if (typeof paletteName === 'string') {

      for (; index < fullNames.length; index ++) {
        var fullName = fullNames[index];
        if (paletteName.indexOf(fullName) >= 0) {
          return BP_CONST.PALETTE_NAME_MAP[fullName];
        }
      }

    }

    return '';
  }

  /**
   *** Publics ***
   */

  /*
   Augments the customers placeholder if found, otherwise creates the floating badge.

   If the customer uses an <img> as a placeholder:
     We determine the color palette to be used based on the .src attribute.
     We create a <div> and insert it into the DOM as the previous sibling of the <img>
     We insert the <img> into the newly created <div>
     We remove the id from the <img>
     We set the id of the newly created <div> to BP_CONST.BADGE_ID

   Badge will never be statically positioned.  It must be relative or absolute
   so its contents can be absolutely positioned.

   Sets attributes on badge elements (ARIA).

   * @returns {Object|Element}
   */
  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    var badge = !isToolbarUIRequested() && helper.byId(BP_CONST.BADGE_ID);

    // Get site's in-page placeholder badge or create our own
    badgeOrToolbarElement = badge || createToolbar();

    setCustomPalette(badgeOrToolbarElement);

    // If a customer uses the <img> placeholder...
    if (badgeOrToolbarElement.localName === 'img') {

      badgeOrToolbarElement.setAttribute('data-sc-reversible', false); // Will use a different palette dark theme is used

      convertExistingBadge();
      removeExistingBadgeId();
      setBadgeParentId();

      // Invalidate the cache because we just removed the BADGE_ID
      // from the <img> and set it on the <div>
      helper.invalidateId(BP_CONST.BADGE_ID);

      badgeOrToolbarElement = badgeOrToolbarElement.parentElement;

    }

    if (badge) {
      setCSSPositioningForBadge();
    }

    helper.setAttributes(badgeOrToolbarElement, BP_CONST.BADGE_ATTRS);

    labelBadge(badgeOrToolbarElement);

    return badgeOrToolbarElement;
  }

  function labelBadge() {
    // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
    // The badge label will be absolutely positioned offscreen in order to not affect layout
    var badgeLabelElement = document.createElement('sc');
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);
    badgeLabelElement.style.position = 'absolute';
    badgeLabelElement.style.left = '-9999px';

    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }

  // Make sure the badge has non-static positioning to make it easy to place
  // the position: absolute sc-bp-container inside of it
  function setCSSPositioningForBadge() {

    var existingPositionCss = getComputedStyle(badgeOrToolbarElement).position;

    if (existingPositionCss === 'static') {
      badgeOrToolbarElement.style.position = 'relative';
    }
  }

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

  return {
    init: init,
    getViewClasses: getViewClasses
  };

});
