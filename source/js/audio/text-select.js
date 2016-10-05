/**
 * If speech is on, automatically speak newly selected regions in document.
 * Created by akhabibullina on 8/3/2015.
 */
define(['$', 'core/events'], function () {

  // Get selected text, if any...
  // TODO would be better to get the selected nodes if we want to speak alternative text, switch languages, etc.
  // TODO this would also allow us to speak whole words (SC-3192)
  function getSelectedText() {

    var result;

    // WebKit and Gecko...
    if (typeof window.getSelection !== 'undefined') {
      result = window.getSelection().toString();
    }
    else if (document.selection) { // IEEEEE!
      result = document.selection.createRange().text;
    }
    return result || '';
    }

  function init() {
  }

  return {
    init: init,
    getSelectedText: getSelectedText
  };
});
