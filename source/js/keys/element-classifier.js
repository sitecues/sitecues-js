/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
define([], function () {

  function hasMatchingTag(tags, element) {
    return tags.hasOwnProperty(element.localName);
  }

  /**
   * Checks if the element has media contents which can be rendered.
   */
  var VISUAL_MEDIA_ELEMENTS = { img:1, picture:1, canvas:1, video:1, embed:1, object:1, iframe:1, frame:1, audio:1 };
  function isVisualMedia(element) {
    return hasMatchingTag(VISUAL_MEDIA_ELEMENTS, element);
  }

  /**
   * Checks if the element is a form control
   */
  var FORM_ELEMENTS = { input:1, textarea:1, select:1, button: 1 };
  function isFormControl(element) {
    return hasMatchingTag(FORM_ELEMENTS, element);
  }

  /**
   * Returns true if the element may use spacebar presses for its own purposes when focused.
   * For example, a video is likely to use spacebar to pause/play the video, and an input
   * uses the spacebar to insert spaces into the text.
   * @param selector
   * @returns {*|boolean}
   */
  // Define set of elements that need the spacebar but are not editable
  var NON_EDITABLE_SPACEBAR_ELEMENTS = { video:1, embed:1, object:1, iframe:1, frame:1, audio:1, button:1, input:1, select: 1};
  function isSpacebarConsumer(element) {
    return hasMatchingTag(NON_EDITABLE_SPACEBAR_ELEMENTS, element) ||
      element.hasAttribute('tabindex') || element.hasAttribute('onkeypress') || element.hasAttribute('onkeydown') ||
      isEditable(element);
  }

  function isContentEditable(element) {
    var contentEditable = element.getAttribute('contenteditable');
    return typeof contentEditable === 'string' && contentEditable !== 'false';
  }

  /**
   * Is the current element editable for any reason???
   * @param element
   * @returns {boolean} True if editable
   */
  var EDITABLE_INPUT_TYPES = [ 'text', 'email', 'password', 'search', 'tel', 'url', 'color', 'date', 'datetime', 'datetime-local',
    'month','number','time','week' ];
  function isEditable(element) {
    if (element.localName === 'input') {
      var type = element.getAttribute('type');
      return !type || EDITABLE_INPUT_TYPES.indexOf(type) >= 0;
    }
    return document.designMode === 'on' ||
      element.localName === 'textarea' ||
      isContentEditable(element);
  }

  var publics = {
    isVisualMedia: isVisualMedia,
    isFormControl: isFormControl,
    isSpacebarConsumer: isSpacebarConsumer,
    isEditable: isEditable
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
