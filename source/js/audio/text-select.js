/**
 * If speech is on, automatically speak newly selected regions in document.
 * Created by akhabibullina on 8/3/2015.
 */
define(['$', 'core/events', 'audio/constant' ], function ($, events, constant) {

  var wasOn = false;

  // Speaking on a delay after mouseup avoids speaking the same thing twice
  function speakSelectedTextOnDelay(event) {
    if (!isInPanel(event.target)) {
      setTimeout(speakSelectedText, 0);
    }
  }

  function isInPanel(element) {
    return $(element).closest('#sitecues-badge,#scp-bp-container').length > 0;
  }

  function speakSelectedText() {
    // TODO get the selected nodes and concat all the text ourselves, so that we speak markup correctly, switch locales, etc.
    // TODO this would also allow us to speak whole words (SC-3192)
    var selection = window.getSelection(),
      selectedText = selection.toString(),
      focusNode = selection.focusNode;
    // Listeners: speech.js
    require(['audio/audio'], function(audio) {
      // No need to init audio, because we're a dependency of it -- it inits us
      // Anything currently being spoken will be interrupted and the new text will be spoken instead.
      // This means that if an empty string is sent, speech will simply shut up.
      // As a result, clicking somewhere new in the page will quiet the current speech.
      audio.speakText(selectedText || '', focusNode, constant.TRIGGER_TYPES.SELECTION);
    });
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
    events.on('speech/did-change', refresh);
  }

  return {
    init: init
  };
});
