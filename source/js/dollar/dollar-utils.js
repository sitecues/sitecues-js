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

  // Zepto doesn't have makeArray
  function $makeArray($jquery) {
    return [].slice.call($jquery);
  }

  // Zepto doesn't have is(element)
  function $is($jquery, element) {
    return $makeArray($jquery).indexOf(element) >= 0;
  }

  // Convert the node list into a $ object (annoyingly Zepto doesn't just do this)
  function $fromNodeList(nodeList) {
    return $.zepto ? $.zepto.Z(nodeList) : $(nodeList);
  }

  var publics = {
    isInSitecuesUI: isInSitecuesUI,
    $makeArray: $makeArray,
    $is: $is,
    $fromNodeList: $fromNodeList
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
