/**
 * Given a DOM node to speak, this builds a string for speech output.
 * It handles accessibility concerns such as alternative text.
 * Currently the speech dictionary resides here until we can move it to the server.
 */

sitecues.def('speech-builder', function (builder, callback, log) {
  
  'use strict';

  // Putting - after "A" at end prevents it from being read as "uh"
  var CASE_SENSITIVE_REPLACEMENTS= [
    { word: "ADA", to: "A D A -" },
    { word: "ADAAA", to: "A D A A A" },
    { word: "ADEA", to: "A D E A -" },
    { word: "ADR", to: "A D R" },
    { word: "AJ", to: "A J" },
    { word: "CFO", to: "C F O" },
    { word: "CHCO", to: "C H C O" },
    { word: "DMS", to: "D M S" },
    { word: "EEOC", to: "E E O C" },
    { word: "EEO", to: "E E O" },
    { word: "EPA", to: "E P A -" },
    { word: "FLSA", to: "F L S A -" },
    { word: "FTE", to: "F T E" },
    { word: "GSA", to: "G S A" },
    { word: "IIG", to: "I I G" },
    { word: "IFMS", to: "I F M S" },
    { word: "IMS", to: "I M S" },
    { word: "OFO", to: "O F O" },
    { word: "OFP", to: "O F P" },
    { word: "OGC", to: "O G C" },
    { word: "OIG", to: "O I G" },
    { word: "OMB", to: "O M B" },
    { word: "OPM", to: "O P M" },
    { word: "PMA", to: "P M A -" },
    { word: "PCHP", to: "P C H P" },
    { word: "SFFAS", to: "S F F A S"},
    { word: "UAM", to: "U A M" },
    { word: "EXCEL", to: "Excel" },
    { word: "FEPA", to: "Fepa" },
    { word: "FMFIA", to: "Fimfiyah" },  // Should rhyme with Cynthia, emphasis not quite right yet
    { word: "FOIA", to: "Foya" },
    { word: "GINA", to: "Gina" },
    { word: "TAPS", to: "Taps" },
    { word: "TERO", to: "Tero" }
  ];

  var CASE_INSENSITIVE_REPLACEMENTS= [
    { word: "scotiabank", to: "skoashabank" },
    { word: "scotia", to: "skoasha" },
    { word: "tdbank", to: "T D Bank" }
  ];

  sitecues.use('util/common', 'jquery', function(common, $) {

    builder.getText = function(subtreeRootNode) {
      var origText = appendAccessibleTextFromSubtree(subtreeRootNode);
      var middle = replaceAll(origText, CASE_SENSITIVE_REPLACEMENTS, "");
      var final = replaceAll(middle, CASE_INSENSITIVE_REPLACEMENTS, "i");
      return $.trim(final);
    }

    function replaceAll(text, replacements, options) {
      for (var index = 0; index < replacements.length; index++) {
        var replacement = replacements[index];
        var regex = new RegExp('\\b' + replacement.word + '\\b', 'g' + options);
        text= text.replace(regex, replacement.to);
      }
      return text;
    }

    function textEquivalentIfPresent(node, attrName) {
      var value = $(node).attr(attrName);
      return (!value || value === '') ? '' : ' ' + value + ' ';
    }

    function appendFromIdListAttribute($node, attrName) {
      var text="", idList = $node.attr(attrName), ids, id, idCount, target, isMap = attrName === 'usemap';
      if (idList) {
        ids = idList.split(' ');
        for (idCount = 0; idCount < ids.length; idCount ++) {
          id = ids[idCount]
          target = isMap? $('map[name="' + id.replace('#','') + '"]') : $('#' + ids[idCount]);
          if (target.length) {
            text += ' ' + appendAccessibleTextFromSubtree(target.get(0), true) + ' ';
          }
        }
      }
      return text;
    }

    function appendAccessibleTextFromSubtree(node, isLabel) {
      var text = '', styles, isHidden, $node = $(node);

      if (node.nodeType === 3) {
        // Text node
        return text + node.nodeValue;
      }

      if (node.nodeType !== 1) {
        return text; // Not an element
      }

      // Element
      styles = common.getElementComputedStyles(node);

      if (!isLabel) {   // Hidden node checks, label id checks
        // CSS display: none -- hides entire subtree
        if (styles['display'] === 'none') {
          return text; // Don't walk subtree, the entire thing is hidden
        }

        // CSS visibility -- child elements might still be visible, need to check each one
        isHidden = styles['visibility'] !== 'visible';
        if (isHidden) {
          $node.children().each(function() {
            text += appendAccessibleTextFromSubtree(this, isLabel);
          });
          return text;
        }

        // Check for label/description pointed to but only if not already in the middle of doing that
        // isLabel prevents infinite recursion when getting label from elsewhere in document, potentially overlapping
        text += appendFromIdListAttribute($node, "aria-labelledby") +
          appendFromIdListAttribute($node, "aria-describedby");
        if ($node.is('img')) {
          text += appendFromIdListAttribute($node, "usemap");
        }
      }

      if (styles['display'] !== 'inline') {
        text += ' '; // Add space to break up paragraphs
      }

      // aria-label on any element
      text += textEquivalentIfPresent(node, 'aria-label');

      // alt or title on any image or visual media
      if (common.isVisualMedia(node) || $node.is('input[type="image"]') || styles['background-image'] !== 'none') {
        text += textEquivalentIfPresent(node, 'alt') +
          textEquivalentIfPresent(node, 'title');
      }
      // value, placeholder and title on these form controls
      else if ($node.is('input,select,textarea,button')) {
        text += ' ' + textEquivalentIfPresent(node, 'placeholder') + ' ' +
          textEquivalentIfPresent(node, 'title') + ' ' +
          node.value;
      }

      // Recursively add text from children (both elements and text nodes)
      $node.contents().each(function(index) {
        text += appendAccessibleTextFromSubtree(this, isLabel);
      });

      if (styles['display'] !== 'inline') {
        text += ' '; // Add space to break up paragraphs
      }

      return text;
    }

    // end
    callback();

  });

});
