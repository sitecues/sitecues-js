/**
 * If speech is on, automatically speak newly selected regions in document.
 * Created by akhabibullina on 8/3/2015.
 */
define(['$'], function ($) {

  var wasOn = false;

  // Speaking on a delay after mouseup avoids speaking the same thing twice
  function speakSelectedTextOnDelay(event) {
    if (!isInPanel(event.target)) {
      setTimeout(speakSelectedText, 0);
    }
  }

  function isInPanel(element) {
    return $(element).closest('#sitecues-badge').length > 0;
  }

  function speakSelectedText() {
    var selectedText = getSelectedText();
    // Listeners: speech.js
    require(['audio/audio'], function(audio) {
      audio.init();
      // Anything currently being spoken will be interrupted and the new text will be spoken instead.
      // This means that if an empty string is sent, speech will simply shut up.
      // As a result, clicking somewhere new in the page will quiet the current speech.
      audio.speakText(selectedText || '', null, 'selection');
    });
  }

  // Get selected text, if any...
  // TODO would be better to get the selected nodes if we want to speak alternative text, switch languages, etc.
  // TODO this would also allow us to speak whole words (SC-3192)
  function getSelectedText() {

    var result = '';

    // WebKit and Gecko...
    if (typeof window.getSelection !== 'undefined') {
      result = window.getSelection().toString();
    }
    else if (document.selection) { // IEEEEE!
      result = document.selection.createRange().text;
    }
    return result;
  }

  function refresh(isOn) {
    if (wasOn === isOn) {
      return;  // Has not changed
    }

    wasOn = isOn;

    if (isOn) {
      document.addEventListener('mouseup', speakSelectedTextOnDelay);
    }
    else {
      document.removeEventListener('mouseup', speakSelectedTextOnDelay);
    }
  }

  function init() {
    refresh(true);  // We only get init'd if TTS is turned on, so assume it's on
    sitecues.on('speech/did-change', refresh);
  }

  return {
    init: init
  };
});
