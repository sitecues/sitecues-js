/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
define(['$'], function ($) {

  // Return true if the element is part of the sitecues user interface
  // Everything inside the <body> other than the page-inserted badge
  function isInSitecuesUI(node) {
    // Check for nodeType of 1, which is an element
    // If not, use the parent of the node
    var element = node.nodeType === 1 ? node : node.parentNode;
    return ! $.contains(document.body, element) || // Is not in the <body>
      $(element).closest('#sitecues-badge,#scp-bp-container').length;
  }

  var publics = {
    isInSitecuesUI: isInSitecuesUI
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
