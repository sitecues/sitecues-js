/**
 * Given a DOM node to speak, this builds a string for speech output.
 * It handles accessibility concerns such as alternative text.
 * Currently the speech dictionary resides here until we can move it to the server.
 */

define(['util/common', 'jquery'], function(common, $) {
  'use strict';

  var textBuffer = '',
    TEXT_NODE = 3,
    ELEMENT_NODE = 1;

  /**
   * Get all the text to be spoken for a given selector, taking into account line breaks, form values and alternative text
   * @access public
   * @param selector Element or jQuery object with nodes to get speakable text for
   * @returns {*}
   */
  function getText(selector) {
    textBuffer = '';
    $(selector).each(function() {
      if (textBuffer) {
        appendBlockSeparator();
      }
      appendAccessibleTextFromSubtree(this);
    });

    // Replace multiple whitespace chars with a single space so that GET request is not too large
    textBuffer = textBuffer.replace( /\s\s+/g, ' ');
    // Remove any space at beginning or end of string
    return $.trim(textBuffer);
  }

  function appendText(text) {
    textBuffer = textBuffer + text;
  }

  function findElement(id, isMap) {
    var found = isMap? $('map[name="' + id.replace('#','') + '"]') : $('#' + id);
    return found.length ? found[0] : null;
  }

  function appendFromIdListAttribute($node, attrName) {
    var idList = $node.attr(attrName), ids, id, idCount, target, isMap = attrName === 'usemap';
    if (idList) {
      ids = idList.split(' ');
      for (idCount = 0; idCount < ids.length; idCount ++) {
        id = ids[idCount];
        target = findElement(id, isMap);
        if (target) {
          appendText(' ');
          appendAccessibleTextFromSubtree(target, true);
          appendText(' ');
        }
      }
    }
  }

  /**
   * Add " . " between blocks if the previous block did not end the sentence, to avoid combining 2 sentences into 1.
   * Or, if the sentence already ended, add " " between blocks to ensure words are not jammed together into one word.
   * This string is magical, at least in Ivona.
   * We tried '. ' but it caused abbreviations to be expanded (e.g. "No." is spoken as "Number").
   * Also tried "; " and "! " but these caused the block of text to be read with a slightly rising pitch at the end.
   * The ' . ' seems to do a good job of ending the sentence without causing abbreviation expansion or pitch changes.
   * (If this ends up causing 'dot' to be spoken we can try ';. ' which also seemed to work but was weirder).
   * @param {string} original text
   */
  function appendBlockSeparator() {
    textBuffer = textBuffer.trim();
    if (textBuffer.length === 0) {
      return;
    }
    var lastChar = textBuffer.slice(-1),
      IS_LETTER_REGEX = /[\w\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]/; // Shortest way to test if char is a letter
    if (lastChar.match(IS_LETTER_REGEX)) {
      appendText(' . ');  // Ended in a letter, so add sentence marker so that TTS engine can treat it as a sentence
    }
    else {
      appendText(' ');  // Did not end in a letter, but add space so that text from the two blocks not jammed together
    }
  }

  /**
   * Append text and additional spaces, if necessary, to separate it from other text
   * @param text  The new text that will be appended
   */
  function appendWithWordSeparation(text) {
    var lastChar = textBuffer.slice(-1),
      IS_WHITESPACE_REGEX = /[ \r\n\t]/;
    if (lastChar && text && !lastChar.match(IS_WHITESPACE_REGEX)) {
      appendText(' ');
    }
    appendText(text.trim() + ' ');
  }

  function appendAccessibleTextFromSubtree(node, isLabel) {
    var text = '',
      styles,
      isHidden,
      $node = $(node),
      doWalkChildren = true;

    node = $node[0];

    if (node.nodeType === TEXT_NODE) {
      // Text node: we append the text contents
      appendText(node.nodeValue);
      return;
    }

    if (node.nodeType !== ELEMENT_NODE) {
      return; // Not text or an element, we don't care about it
    }

    // Element -- check for special requirements based on element markup
    styles = window.getComputedStyle(node);

    // Non-label processing:
    // 1) Visibility checks -- we don't do this for labels because even invisible labels should be spoken, it's a
    //    common technique to hide labels but have useful text for screen readers
    // 2) ARIA labels and descriptions: don't use if already inside a label, in order to avoid infinite recursion
    //    since labels could ultimately point in a circle.
    if (!isLabel) {   // Hidden node checks, label id checks
      // CSS display: none -- hides entire subtree
      if (styles.display === 'none') {
        return; // Don't walk subtree, the entire thing is hidden
      }

      // CSS visibility -- child elements might still be visible, need to check each one
      isHidden = styles.visibility !== 'visible';
      if (isHidden) {
        $node.children().each(function() {
          appendAccessibleTextFromSubtree(this, isLabel);
        });
        return;
      }

      // Check for label/description pointed to but only if not already in the middle of doing that
      // isLabel prevents infinite recursion when getting label from elsewhere in document, potentially overlapping
      text += appendFromIdListAttribute($node, 'aria-labelledby') +
        appendFromIdListAttribute($node, 'aria-describedby');

      // If it has @usemap, add any alternative text from within the map
      if ($node.is('img')) {
        appendFromIdListAttribute($node, 'usemap');
      }
    }

    // Add characters to break up paragraphs (before block)
    if (styles.display !== 'inline') {
      appendBlockSeparator(text);
    }

    // Process 'text equivalents' which are attributes that contain additional descriptive text
    // Note: unlike most text equivalent attributes, aria-label is supported on any element. It is different from
    // aria-labelledby in that it directly contains the necessary text rather than point to an element by id.
    var textEquiv = node.getAttribute('aria-label'),
      value;
    // alt or title on any image or visual media
    if (common.isVisualMedia(node) || $node.is('input[type="image"]')) {
      textEquiv = textEquiv || node.getAttribute('alt') || node.getAttribute('title') || '';
    }
    else if ($node.is('select')) {
      textEquiv = node.getAttribute('title') || '';
      value = $node.children(':selected').text();
      doWalkChildren = false; // Otherwise will read all the <option> elements
    }

    else if ($node.is('input[type=radio],input[type=checkbox]')) {
      // value, and title on these form controls
      textEquiv = textEquiv || node.getAttribute('title') || '';
    }

    else if ($node.is('input,textarea,button')) {
      // value, placeholder and title on these form controls
      textEquiv = textEquiv || node.getAttribute('placeholder') || node.getAttribute('title') || '';
      value = node.value;
    }

    if (textEquiv !== null) {
      appendWithWordSeparation(textEquiv, text);
    }
    if (value) {
      appendWithWordSeparation(value, text);
    }

    if (doWalkChildren) {
      // Recursively add text from children (both elements and text nodes)
      $node.contents().each(function () {
        appendAccessibleTextFromSubtree(this, isLabel);
      });
    }

    if (styles.display !== 'inline') {
      appendBlockSeparator(text); // Add characters to break up paragraphs (after block)
    }
  }

  var publics = {
    getText : getText
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;

});
