/**
 * Given a DOM node to speak, this builds a string for speech output.
 * It handles accessibility concerns such as alternative text.
 * Currently the speech dictionary resides here until we can move it to the server.
 */

sitecues.def('audio/speech-builder', function (builder, callback) {
  
  'use strict';

  sitecues.use('util/common', 'jquery', function(common, $) {

    var textBuffer = '';

    builder.getText = function(selector) {
      textBuffer = '';
      $(selector).each(function() {
        if (textBuffer !== '') {
          appendBlockSeparator();
        }
        appendAccessibleTextFromSubtree(this);
      });

      // Replace multiple whitespace chars with a single space so that GET request is not too large
      textBuffer = textBuffer.replace( /\s\s+/g, ' ');
      // Remove any space at beginning or end of string
      return $.trim(textBuffer);
    };

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
     * Add ". " between blocks if the previous block did not end the sentence, to avoid combining 2 sentences into 1.
     * Or, if the sentence already ended, add " " between blocks to ensure words are not jammed together into one word.
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
        appendText('. ');  // Ended in a letter, so add sentence marker so that TTS engine can treat it as a sentence
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
      var text = '', styles, isHidden, $node = $(node);

      node = $node[0];

      if (node.nodeType === 3) {
        // Text node
        appendText(node.nodeValue);
        return;
      }

      if (node.nodeType !== 1) {
        return; // Not an element
      }

      // Element
      styles = window.getComputedStyle(node);

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
        if ($node.is('img')) {
          appendFromIdListAttribute($node, 'usemap');
        }
      }

      if (styles.display !== 'inline') {
        appendBlockSeparator(text);  // Add characters to break up paragraphs (before block)
      }

      // aria-label on any element
      var textEquiv = node.getAttribute('aria-label'),
        value;
      // alt or title on any image or visual media
      if (common.isVisualMedia(node) || $node.is('input[type="image"]')) {
        textEquiv = textEquiv || node.getAttribute('alt') || node.getAttribute('title') || '';
      }
      else if ($node.is('input,select,textarea,button')) {
        // value, placeholder and title on these form controls
        textEquiv = textEquiv || node.getAttribute("placeholder") || node.getAttribute("title") || '';
        value = node.value;
      }

      if (textEquiv !== null) {
        appendWithWordSeparation(textEquiv, text);
      }
      if (value) {
        appendWithWordSeparation(value, text);
      }

      // Recursively add text from children (both elements and text nodes)
      $node.contents().each(function() {
        appendAccessibleTextFromSubtree(this, isLabel);
      });

      if (styles.display !== 'inline') {
        appendBlockSeparator(text); // Add characters to break up paragraphs (after block)
      }
    }

    if (SC_UNIT) {
      exports.getText = builder.getText;
    }

    callback();

  });

});
