/**
 * If speech is on, automatically speak newly selected regions in document.
 * Created by akhabibullina on 8/3/2015.
 */
define([], function () {

  var wasOn = false;

  function speakSelectedTextOnDelay() {
    setTimeout(speakSelectedText, 0);
  }

  function speakSelectedText() {
    var selectedText = getSelectedText();
    if (selectedText) {
      // Listeners: metrics/hlb-opened.js, speech.js
      sitecues.emit('speech/do-play-text', selectedText);
    }
  }

  // Get selected text, if any...
  // TODO would be better to get the selected nodes if we want to speak alternative text, switch languages, etc.
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

  sitecues.on('speech/did-change', refresh);

  // No publics
});