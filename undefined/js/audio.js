"use strict";

sitecues.define("audio/constant", [], function() {
  // TODO add more trigger types, e.g. shift+arrow, shift+space
  var TRIGGER_TYPES = {
    LENS: "space",
    HIGHLIGHT: "shift",
    SELECTION: "selection"
  }, speechStrategy = {
    AUTO: "auto",
    // Currently same as PREFER_NETWORK
    LOCAL: "local",
    NETWORK: "network",
    PREFER_LOCAL: "preferLocal",
    PREFER_NETWORK: "preferNetwork"
  };
  return {
    TRIGGER_TYPES: TRIGGER_TYPES,
    REROUTE_NETWORK_SPEECH_KEY: "-sc-reroute-network-tts-",
    AVAILABLE_CUES: {
      ar: 1,
      de: 1,
      en: 1,
      es: 1,
      fr: 1,
      pl: 1,
      sv: 1
    },
    speechStrategy: speechStrategy,
    // jshint -W117
    autoStrategy: "preferNetwork"
  };
});

/**
 * Given a DOM node to speak, this builds a string for speech output.
 * It handles accessibility concerns such as alternative text.
 * Currently the speech dictionary resides here until we can move it to the server.
 */
sitecues.define("audio/speech-builder", [ "$", "run/conf/urls" ], function($, urls) {
  var textBuffer = "", TEXT_NODE = 3, ELEMENT_NODE = 1;
  /**
   * Get all the text to be spoken for a given selector, taking into account line breaks, form values and alternative text
   * @access public
   * @param selector Element or jQuery object with nodes to get speakable text for
   * @returns {*}
   */
  function getText(selector) {
    textBuffer = "";
    $(selector).each(function() {
      if (textBuffer) {
        appendBlockSeparator();
      }
      appendAccessibleTextFromSubtree(this);
    });
    // Replace multiple whitespace chars with a single space so that GET request is not too large
    textBuffer = textBuffer.replace(/\s\s+/g, " ");
    // Remove any space at beginning or end of string
    return textBuffer.trim();
  }
  function appendText(text) {
    textBuffer += text;
  }
  function findElement(id, isMap) {
    return document.querySelector(isMap ? 'map[name="' + id.replace("#", "") + '"]' : "#" + id);
  }
  function appendFromIdListAttribute($node, attrName) {
    var ids, id, idCount, target, idList = $node.attr(attrName), isMap = "usemap" === attrName;
    if (idList) {
      ids = idList.split(" ");
      for (idCount = 0; idCount < ids.length; idCount++) {
        id = ids[idCount];
        target = findElement(id, isMap);
        if (target) {
          appendText(" ");
          appendAccessibleTextFromSubtree(target, true);
          appendText(" ");
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
    if (!textBuffer) {
      return;
    }
    var lastChar = textBuffer.slice(-1), IS_LETTER_REGEX = /[\w\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]/;
    // Shortest way to test if char is a letter
    if (lastChar.match(IS_LETTER_REGEX)) {
      appendText(" . ");
    } else {
      appendText(" ");
    }
  }
  /**
   * Append text and additional spaces, if necessary, to separate it from other text
   * @param text  The new text that will be appended
   */
  function appendWithWordSeparation(text) {
    var lastChar = textBuffer.slice(-1), IS_WHITESPACE_REGEX = /[ \r\n\t]/;
    if (lastChar && text && !lastChar.match(IS_WHITESPACE_REGEX)) {
      appendText(" ");
    }
    appendText(text.trim() + " ");
  }
  function isSelectedOption(index, option) {
    return option.selected;
  }
  function hasMatchingTag(tags, element) {
    return tags.hasOwnProperty(element.localName);
  }
  /**
   * Checks if the element has media contents which can be rendered.
   * TODO Use element-classifier.isVisualMedia()
   */
  var VISUAL_MEDIA_ELEMENTS = {
    img: 1,
    picture: 1,
    canvas: 1,
    video: 1,
    embed: 1,
    object: 1,
    iframe: 1,
    frame: 1,
    audio: 1
  };
  function isVisualMedia(element) {
    return hasMatchingTag(VISUAL_MEDIA_ELEMENTS, element);
  }
  function getImageText(node) {
    return node.getAttribute("alt") || node.getAttribute("title") || "";
  }
  function isImage($node) {
    return isVisualMedia($node[0]) || $node.is('input[type="image"]');
  }
  function appendNonLabelText($node, styles) {
    // CSS display: none -- hides entire subtree
    if ("none" === styles.display) {
      return;
    }
    // CSS visibility -- child elements might still be visible, need to check each one
    var doWalkChildren, isHidden = "visible" !== styles.visibility;
    if (isHidden) {
      $node.children().each(function() {
        appendAccessibleTextFromSubtree(this);
      });
      return;
    }
    doWalkChildren = true;
    if ($node.attr("aria-labelledby")) {
      // Check for label pointed to but only if not already in the middle of doing that
      appendFromIdListAttribute($node, "aria-labelledby");
      doWalkChildren = false;
    } else {
      if ($node.is("img")) {
        // If it has @usemap, add any alternative text from within the map
        appendFromIdListAttribute($node, "usemap");
      }
    }
    // Append description
    appendFromIdListAttribute($node, "aria-describedby");
    return doWalkChildren;
  }
  function getInputLabelAttributeText(node) {
    return node.getAttribute("placeholder") || node.getAttribute("title") || "";
  }
  function appendTextEquivAndValue(node, $node, doWalkChildren) {
    // Process 'text equivalents' which are attributes that contain additional descriptive text
    // Note: unlike most text equivalent attributes, aria-label is supported on any element. It is different from
    // aria-labelledby in that it directly contains the necessary text rather than point to an element by id.
    var value, ariaLabel = node.getAttribute("aria-label"), textEquiv = ariaLabel;
    // alt or title on any image or visual media
    if (isImage($node)) {
      textEquiv = textEquiv || getImageText(node);
    } else {
      if ($node.is("select")) {
        textEquiv = node.getAttribute("title") || "";
        value = $node.children().filter(isSelectedOption).text();
        doWalkChildren = false;
      } else {
        if ($node.is("input[type=radio],input[type=checkbox],button")) {
          // value, and title on these form controls
          textEquiv = textEquiv || node.getAttribute("title") || "";
        } else {
          if ($node.is('input:not([type="password"]),textarea')) {
            // value, placeholder and title on these form controls
            textEquiv = textEquiv || getInputLabelAttributeText(node);
            value = node.value;
          }
        }
      }
    }
    if (ariaLabel) {
      // ARIA markup defined an accessible name, which overrides other labels.
      // No need to keep adding to the accessible name via descendants or other attributes
      textEquiv = ariaLabel;
      doWalkChildren = false;
    }
    if (null !== textEquiv) {
      appendWithWordSeparation(textEquiv);
    }
    if (value) {
      appendWithWordSeparation(value);
    }
    return doWalkChildren;
  }
  // Add all the accessible text from the pointed-to subtree of elements
  // isLabel prevents infinite recursion when getting label from elsewhere in document, potentially overlapping
  function appendAccessibleTextFromSubtree(node, isLabel) {
    var styles, hasNewline, hasExtraSpace, $node = $(node), doWalkChildren = true;
    node = $node[0];
    if (node.nodeType === TEXT_NODE) {
      // Text node: we append the text contents
      appendText(node.nodeValue);
      return;
    }
    if (node.nodeType !== ELEMENT_NODE) {
      return;
    }
    // Element -- check for special requirements based on element markup
    styles = window.getComputedStyle(node);
    // Non-label processing:
    // 1) Visibility checks -- we don't do this for labels because even invisible labels should be spoken, it's a
    //    common technique to hide labels but have useful text for screen readers
    // 2) ARIA labels and descriptions: don't use if already inside a label, in order to avoid infinite recursion
    //    since labels could ultimately point in a circle.
    if (!isLabel && !appendNonLabelText($node, styles)) {
      return;
    }
    // Add characters to break up paragraphs (before block)
    hasNewline = "inline" !== styles.display;
    if (hasNewline) {
      textBuffer = textBuffer.trim();
      appendBlockSeparator();
    } else {
      hasExtraSpace = parseFloat(styles.paddingRight) || parseFloat(styles.marginRight);
    }
    doWalkChildren = appendTextEquivAndValue(node, $node, doWalkChildren);
    if ("iframe" === node.localName && node.src && urls.isCrossOrigin(node.src)) {
      // Don't try to access the nested document of cross origin iframes
      return;
    }
    if (doWalkChildren) {
      // Recursively add text from children (both elements and text nodes)
      $node.contents().each(function() {
        appendAccessibleTextFromSubtree(this, isLabel);
      });
    }
    if (hasNewline) {
      textBuffer = textBuffer.trim();
      appendBlockSeparator();
    } else {
      if (hasExtraSpace) {
        appendText(" ");
      }
    }
  }
  return {
    getText: getText
  };
});

/**
 * If speech is on, automatically speak newly selected regions in document.
 * Created by akhabibullina on 8/3/2015.
 */
sitecues.define("audio/text-select", [ "$", "run/events", "audio/constant", "mini-core/native-global" ], function($, events, constant, nativeGlobal) {
  var wasOn = false;
  // Speaking on a delay after mouseup avoids speaking the same thing twice
  function speakSelectedTextOnDelay(event) {
    if (!isInPanel(event.target)) {
      nativeGlobal.setTimeout(speakSelectedText, 0);
    }
  }
  function isInPanel(element) {
    return $(element).closest("#sitecues-badge,#scp-bp-container").length > 0;
  }
  function speakSelectedText() {
    // TODO get the selected nodes and concat all the text ourselves, so that we speak markup correctly, switch locales, etc.
    // TODO this would also allow us to speak whole words (SC-3192)
    var selection = window.getSelection(), selectedText = selection.toString(), focusNode = selection.focusNode;
    // Listeners: speech.js
    sitecues.require([ "audio/audio" ], function(audio) {
      // No need to init audio, because we're a dependency of it -- it inits us
      // Anything currently being spoken will be interrupted and the new text will be spoken instead.
      // This means that if an empty string is sent, speech will simply shut up.
      // As a result, clicking somewhere new in the page will quiet the current speech.
      audio.speakText(selectedText || "", focusNode, constant.TRIGGER_TYPES.SELECTION);
    });
  }
  function refresh(isOn) {
    if (wasOn === isOn) {
      return;
    }
    wasOn = isOn;
    if (isOn) {
      document.addEventListener("mouseup", speakSelectedTextOnDelay);
    } else {
      document.removeEventListener("mouseup", speakSelectedTextOnDelay);
    }
  }
  function init() {
    refresh(true);
    // We only get init'd if TTS is turned on, so assume it's on
    events.on("speech/did-change", refresh);
  }
  return {
    init: init
  };
});

// This module is responsible for creating audio snippets of synthetic speech,
// natively in the browser, completely offline.
sitecues.define("audio/local-player", [ "Promise", "mini-core/native-global" ], function(Promise, nativeGlobal) {
  var speechSynthesis = window.speechSynthesis, SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
  function getVoices() {
    var errMessage = {
      NO_VOICES: "Sitecues cannot find voices to speak with.",
      TIMEOUT: "Timed out getting voices. The system may not have any."
    };
    // Promise handler for when loading voices is asynchronous.
    function waitForVoices(resolve, reject) {
      // Handle timeouts so we don't wait forever in any case where
      // the voiceschanged event never fires.
      function onTimeout() {
        reject(new Error(errMessage.TIMEOUT));
      }
      // Don't wait forever for a voice.
      var voicesTimeout = nativeGlobal.setTimeout(onTimeout, 3e3);
      // At least one voice has loaded asynchronously. We don't know if/when
      // any more will come in, so it is best to consider the job done here.
      function onVoicesChanged(event) {
        clearTimeout(voicesTimeout);
        // Give the available voices as the result.
        resolve(speechSynthesis.getVoices());
        // Remove thyself.
        event.currentTarget.removeEventListener(event.type, onVoicesChanged, true);
      }
      speechSynthesis.addEventListener("voiceschanged", onVoicesChanged, true);
    }
    // Tickle the browser with a feather to get it to actually load voices.
    // In some environments this happens synchronously and we can use the
    // result right away. In others, it returns an empty array and we will
    // take care of that during the voiceschanged event.
    var voices = speechSynthesis.getVoices();
    // If the browser has voices available right now, return those.
    // Safari gets voices synchronously, so will be true there.
    if (voices.length > 0) {
      return Promise.resolve(voices);
    } else {
      if ("function" === typeof speechSynthesis.addEventListener) {
        return new Promise(waitForVoices);
      }
    }
    // In theory, a platform could support the synthesis API but not have any
    // voices available. Or all the voices could suddenly be uninstalled.
    // We have not encountered that, but we try to take care of it here.
    return Promise.reject(new Error(errMessage.NO_VOICES));
  }
  // Based on a given set of voices and locale restrictions, get sitecues'
  // favorite voice. We want to sound the best.
  function getBestVoice(option) {
    var voices = option.voices, locale = option.locale, lang = locale.split("-")[0];
    var acceptableVoices = voices.filter(function(voice) {
      var voiceLocale = voice.lang;
      // Allow universal speech engines, which exist on Windows. These can
      // speak just about any language.
      if (!voiceLocale) {
        return true;
      }
      return voiceLocale === lang || voiceLocale.startsWith(lang + "-");
    }).filter(function(voice) {
      return false || voice.localService;
    });
    if (acceptableVoices.length > 0) {
      return acceptableVoices.sort(compareVoices)[0];
    }
    throw new Error("No local voice available for " + locale);
    function compareVoices(a, b) {
      var aLocale = a.lang, bLocale = b.lang;
      // Prefer voices with the perfect accent (or lack thereof).
      if (aLocale === locale && bLocale !== locale) {
        return -1;
      }
      if (bLocale === locale && aLocale !== locale) {
        return 1;
      }
      // Prefer to respect the user's default voices.
      if (a.default && !b.default) {
        return -1;
      }
      if (b.default && !a.default) {
        return 1;
      }
      // Prefer voices without an accent, to avoid mapping one accent to
      // another if at all possible.
      if (aLocale === lang && bLocale !== lang) {
        return -1;
      }
      if (bLocale === lang && aLocale !== lang) {
        return 1;
      }
    }
  }
  // Stop speech. This method is idempotent. It does not matter if we are
  // currently playing or not.
  function stop() {
    speechSynthesis.cancel();
  }
  // Turn text into speech.
  function speak(option) {
    var // TODO: Replace this poor excuse for a speech dictionary.
    text = option.text.replace(/sitecues/gi, "sightcues").trim(), locale = option.locale;
    var voice = option.voice, prom = Promise.resolve();
    if (!text) {
      return prom;
    }
    if (!voice) {
      prom = getVoices().then(function(voices) {
        return getBestVoice({
          voices: voices,
          locale: locale
        });
      }).then(function(bestVoice) {
        voice = bestVoice;
      });
    }
    // By default, the Web Speech API queues up synthesis requests.
    // But this is typically not what is desired by sitecues.
    if (!option.polite) {
      // Immediately discontinue any currently playing speech.
      stop();
    }
    // When and if we have a voice to use, finish setting up
    // and then play speech.
    prom = prom.then(function() {
      return new Promise(function(resolve, reject) {
        var speech = new SpeechSynthesisUtterance(text);
        speech.voice = voice;
        // Note: Some voices do not support altering these settings and will break silently!
        speech.lang = locale;
        // speech.voiceURI = 'native';
        // speech.volume = 1;  // float from 0 to 1, default is 1
        // speech.rate   = 1;  // float from 0 to 10, default is 1
        // speech.pitch  = 1;  // float from 0 to 2, default is 1
        // Event listeners...
        var onStart = option.onStart;
        if (onStart) {
          speech.addEventListener("start", onStart);
        }
        function removeListeners() {
          if (onStart) {
            speech.removeEventListener("start", onStart);
          }
          speech.removeEventListener("end", onSpeechEnd);
          speech.removeEventListener("error", onSpeechError);
        }
        function onSpeechEnd() {
          if (true) {
            console.log("Finished in " + event.elapsedTime + " seconds.");
          }
          removeListeners();
          resolve();
        }
        function onSpeechError(event) {
          removeListeners();
          reject(event.error);
        }
        speech.addEventListener("end", onSpeechEnd);
        speech.addEventListener("error", onSpeechError);
        // Examples of other things we could do:
        // speech.addEventListener('resume', function onSpeechResume(event) {
        //     console.log('Speech has resumed from a paused state.');
        // });
        // speech.addEventListener('boundary', function onSpeechBoundary(event) {
        //     console.log('Encountered a word or sentence boundary.');
        // });
        // speech.addEventListener('mark', function onSpeechMark(event) {
        //     console.log('Encountered an SSML mark tag.');
        // });
        speechSynthesis.speak(speech);
      });
    });
    return prom;
  }
  // "Polite" mode means wait your turn and let others finish speaking.
  // It adds speech to the queue and does not play it immediately.
  function speakPolitely(option) {
    option = Object.create(option);
    option.polite = true;
    speak(option);
  }
  // NOTE: This method will be fooled by another app besides sitecues speaking.
  //       Prefer to keep track of state based on the promise from speak().
  function isBusy() {
    return speechSynthesis.pending || speechSynthesis.speaking;
  }
  return {
    stop: stop,
    speak: speak,
    speakPolitely: speakPolitely,
    isBusy: isBusy
  };
});

/**
 * This is the audio player we use for remote speech and anything
 * that is not speech.
 */
sitecues.define("audio/network-player", [ "$", "run/conf/urls", "run/conf/site", "Promise" ], function($, urls, site, Promise) {
  var audioElementsToPlay = [], ERR_NO_NETWORK_TTS = "Sitecues network speech is not available on this website.";
  /**
   * Retrieve and play audio from a URL.
   * @param option, settings such as source of audio to play
   */
  function play(option) {
    var url = option.url, onStart = option.onStart, audioElement = new Audio(), isSpeech = option.isSpeech;
    audioElementsToPlay.push(audioElement);
    if (!isSpeech) {
      // No need to check network speech config for playing earcons
      return new Promise(beginRequest);
    }
    return new Promise(function(resolve, reject) {
      getNetworkSpeechConfig(function(speechConfig, error) {
        if (speechConfig.ttsAvailable) {
          beginRequest(resolve, reject);
        } else {
          // Fetched site config disallowed network speech
          // This is a network setting as opposed to a client strategy
          releaseAudioElement(audioElement);
          reject(new Error(error || ERR_NO_NETWORK_TTS));
        }
      });
    });
    function beginRequest(resolve, reject) {
      if (onStart) {
        $(audioElement).one("playing", onStart);
      }
      // TODO: Can we remove this? Test across browsers.
      audioElement.src = "";
      // Clean up
      $(audioElement).one("canplay", onCanPlay);
      $(audioElement).one("error", function(event) {
        onEnded(event);
        reject(event);
      });
      $(audioElement).one("ended", function(event) {
        onEnded(event);
        resolve();
      });
      $(audioElement).one("pause", function(event) {
        onEnded(event);
        resolve();
      });
      audioElement.src = url;
    }
    function onCanPlay(event) {
      var audioElement = event.target;
      if (audioElementsToPlay.indexOf(audioElement) >= 0) {
        // Still in list of <audio> elements to play -- has not been stopped
        audioElement.play();
      }
    }
    function releaseAudioElement() {
      var index = audioElementsToPlay.indexOf(audioElement);
      if (index >= 0) {
        audioElementsToPlay.splice(index, 1);
      }
    }
    function onEnded(event) {
      var audioElement = event.target;
      removeListeners(audioElement);
      releaseAudioElement(audioElement);
    }
  }
  // Busy when 1) pending network request, or 2) currently playing audio
  function isBusy() {
    return audioElementsToPlay.length > 0;
  }
  function removeListeners(audioElement) {
    var $audioElement = $(audioElement);
    $audioElement.off("canplay");
    // Don't fire notification to play if we haven't played yet
    $audioElement.off("error");
    $audioElement.off("ended");
    $audioElement.off("pause");
  }
  /**
   * Stop any currently playing audio and abort the request
   */
  function stop() {
    audioElementsToPlay.forEach(function(audioElement) {
      audioElement.pause();
    });
    audioElementsToPlay.length = 0;
  }
  function getNetworkSpeechConfig(callbackFn) {
    if (getNetworkSpeechConfig.cached) {
      // Already retrieved
      callbackFn(getNetworkSpeechConfig.cached);
      return;
    }
    if (getNetworkSpeechConfig.isRetrieving) {
      // Currently retrieving -- this is a weird case -- as if network speech was requested again before the config was fetched
      callbackFn({});
      return;
    }
    getNetworkSpeechConfig.isRetrieving = true;
    fetchNetworkSpeechConfig(function(speechConfig, error) {
      getNetworkSpeechConfig.isRetrieving = false;
      getNetworkSpeechConfig.cached = speechConfig;
      callbackFn(speechConfig, error);
    });
  }
  function fetchNetworkSpeechConfig(callbackFn) {
    sitecues.require([ "run/util/xhr" ], function(xhr) {
      xhr.getJSON({
        // The 'provided.siteId' parameter must exist, or else core would have aborted the loading of modules.
        url: urls.getApiUrl("2/site/" + site.getSiteId() + "/config"),
        success: function(data) {
          var currentSetting, origSettings = data.settings, i = 0;
          // Map the incoming format
          // From:
          //   [ { key: foo, value: bar}, { key: foo2, value: bar2} ... ] to
          // To:
          //   { key: bar, key2: bar2 }
          // Copy the fetched key/value pairs into the speechConfig
          var speechConfig = {};
          for (;i < origSettings.length; i++) {
            currentSetting = origSettings[i];
            speechConfig[currentSetting.key] = currentSetting.value;
          }
          callbackFn(speechConfig);
        },
        error: function(error) {
          callbackFn({}, error);
        }
      });
    });
  }
  return {
    play: play,
    stop: stop,
    isBusy: isBusy
  };
});

/**
 * This is the main audio library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 *
 * Specifically, it is responsible for:
 * - Playing speech when HLB opens, if speech is on. In this case it must request
 *   a media type supported both by the server (provided via site preferences)
 * - Stopping speech when a key is pressed or the Lens closes
 * - Playing audio by key when requested by another module
 */
sitecues.define("audio/audio", [ "audio/constant", "run/conf/preferences", "run/conf/site", "$", "audio/speech-builder", "run/locale", "run/metric/metric", "run/conf/urls", "audio/text-select", "run/data-map", "run/events", "audio/local-player", "audio/network-player" ], function(constant, pref, site, $, builder, locale, metric, urls, textSelect, dataMap, events, localPlayer, networkPlayer) {
  var lastPlayer, isInitialized, ttsOn = false, AUDIO_BUSY_EVENT = "audio/did-toggle", speechStrategy = constant.speechStrategy;
  function onLensOpened(lensContent, fromHighlight) {
    if (ttsOn) {
      speakContentImpl(fromHighlight.picked, constant.TRIGGER_TYPES.LENS);
    }
  }
  function isBusy() {
    return lastPlayer && lastPlayer.isBusy();
  }
  function speakContent(content, doAvoidInterruptions) {
    if (doAvoidInterruptions && isBusy()) {
      return;
    }
    if (!content) {
      return;
    }
    speakContentImpl(content, constant.TRIGGER_TYPES.HIGHLIGHT);
  }
  function speakContentImpl($content, triggerType) {
    stopAudio();
    var text = builder.getText($content);
    if (text) {
      speakText(text, $content[0], triggerType);
    }
  }
  // text and triggerType are optional
  // @rootNode is root node of the text to be spoken, if available -- it will be used to get the locale
  function speakText(text, rootNode, triggerType) {
    stopAudio();
    // Stop any currently playing audio and halt keydown listener until we're playing again
    if (!text.trim()) {
      return;
    }
    var startRequestTime = Date.now(), textLocale = getAudioLocale(rootNode);
    addStopAudioHandlers();
    function onSpeechPlaying(isLocal) {
      var timeElapsed = Date.now() - startRequestTime;
      new metric.TtsRequest({
        requestTime: timeElapsed,
        audioFormat: isLocal ? null : getMediaTypeForNetworkAudio(),
        charCount: text.length,
        trigger: triggerType,
        isLocalTTS: isLocal
      }).send();
    }
    function speakLocally(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isLocalSpeechAllowed()) {
        lastPlayer = localPlayer;
        fireBusyEvent();
        return localPlayer.speak({
          text: text,
          locale: textLocale,
          onStart: function() {
            onSpeechPlaying(true);
          }
        }).then(fireNotBusyEvent).catch(function() {
          onUnavailableFn();
        });
      } else {
        onUnavailableFn();
      }
    }
    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isNetworkSpeechAllowed(textLocale)) {
        lastPlayer = networkPlayer;
        fireBusyEvent();
        var ttsUrl = getTTSUrl(text, textLocale);
        networkPlayer.play({
          url: ttsUrl,
          onStart: function() {
            onSpeechPlaying(false);
          }
        }).then(fireNotBusyEvent).catch(function() {
          rerouteNetworkSpeechLang(textLocale);
          onUnavailableFn();
        });
      } else {
        onUnavailableFn();
      }
    }
    var speakViaNetworkFn = false ? fireNotBusyEvent : speakViaNetwork;
    // Helps the minifier
    if (isLocalSpeechPreferred()) {
      speakLocally(speakViaNetworkFn);
    } else {
      speakViaNetworkFn(speakLocally);
    }
  }
  function addStopAudioHandlers() {
    // Stop speech on any key down.
    // Wait a moment, in case it was a keystroke that just got us here,
    // for example down arrow to read next Lens or a hotkey to toggle speech
    removeBlurHandler();
    $(window).one("blur", stopAudio);
  }
  // Remove handler that stops speech on any key down.
  function removeBlurHandler() {
    $(window).off("blur", stopAudio);
  }
  /*
   * Stops the player that is attached to a highlight box.
   * This is safe to call if the player has not been initialized
   * or is not playing.
   */
  function stopAudio() {
    if (isBusy()) {
      lastPlayer.stop();
      removeBlurHandler();
    }
  }
  function fireBusyEvent() {
    if (isBusy()) {
      // Already fired
      return;
    }
    events.emit(AUDIO_BUSY_EVENT, true);
  }
  function fireNotBusyEvent() {
    if (isBusy()) {
      // Still has other audio to play -- one of the players is still busy
      return;
    }
    events.emit(AUDIO_BUSY_EVENT, false);
  }
  // Get language that applies to node (optional param), otherwise the document body
  // If no locale found, falls back on document and then browser default language
  // Returns a full country-affected language, like en-CA when the browser's language matches the site's language prefix.
  // For example, if an fr-CA browser visits an fr-FR website, then fr-CA is returned instead of the page code,
  // because that is the preferred accent for French.
  // However, if the fr-CA browser visits an en-US or en-UK page, the page's code is returned because the
  // user's preferred English accent in unknown
  function getAudioLocale(optionalStartNode) {
    function toPreferredRegion(contentLocale) {
      return locale.swapToPreferredRegion(contentLocale);
    }
    // Get this first, because Google translate overwrites all text in the document, but not lang attributes
    var translationLocale = locale.getTranslationLocale();
    if (translationLocale) {
      return toPreferredRegion(translationLocale);
    }
    var node = optionalStartNode || document.body;
    if (node.nodeType !== node.ELEMENT_NODE) {
      // May have started on text node
      node = node.parentElement;
    }
    while (node) {
      var nodeLocale = node.getAttribute("lang") || node.getAttribute("xml:lang");
      if (nodeLocale && locale.isValidLocale(nodeLocale)) {
        return toPreferredRegion(nodeLocale);
      }
      node = node.parentElement;
    }
    return toPreferredRegion(locale.getPageLocale());
  }
  function getAudioCueTextAsync(cueName, cueTextLocale, callback) {
    var AUDIO_CUE_DATA_PREFIX = "locale-data/cue/", cueModuleName = AUDIO_CUE_DATA_PREFIX + cueTextLocale;
    dataMap.get(cueModuleName, function(data) {
      callback(data[cueName] || "");
    });
  }
  function toCueTextLocale(cueAudioLocale) {
    var locale = cueAudioLocale.toLowerCase(), lang = locale.split("-")[0];
    function useIfAvailable(tryLocale) {
      return constant.AVAILABLE_CUES[tryLocale] && tryLocale;
    }
    return useIfAvailable(locale) || useIfAvailable(lang);
  }
  // Puts in delimiters on both sides of the parameter -- ? before and & after
  // locale is a required parameter
  function getLocaleParameter(locale) {
    return "?l=" + locale + "&";
  }
  function getCueUrl(name, locale) {
    // TODO why does an audio cue need the site id?
    var restOfUrl = "cue/site/" + site.getSiteId() + "/" + name + "." + getMediaTypeForNetworkAudio() + getLocaleParameter(locale);
    return urls.getApiUrl(restOfUrl);
  }
  /**
   * Get URL for speaking text
   * @param text  Text to be spoken
   * @param locale  required locale parameter
   * @returns {string} url
   */
  function getTTSUrl(text, locale) {
    var restOfUrl = "tts/site/" + site.getSiteId() + "/tts." + getMediaTypeForNetworkAudio() + getLocaleParameter(locale) + "t=" + encodeURIComponent(text);
    return urls.getApiUrl(restOfUrl);
  }
  /**
   * Turn speech on or off
   * @param isOn Whether to turn speech on or off
   */
  function setSpeechState(isOn, doSuppressAudioCue) {
    if (ttsOn !== isOn) {
      ttsOn = isOn;
      pref.set("ttsOn", ttsOn);
      events.emit("speech/did-change", ttsOn);
      if (!doSuppressAudioCue) {
        sitecues.require([ "audio-cues/audio-cues" ], function(audioCues) {
          audioCues.playSpeechCue(ttsOn);
        });
      }
    }
  }
  function toggleSpeech() {
    setSpeechState(!ttsOn);
  }
  /*
   * Uses a provisional player to play back audio by cue name, used for audio cues.
   */
  function speakCueByName(name) {
    stopAudio();
    // Stop any currently playing audio
    var cueAudioLocale = getAudioLocale();
    // Use document language for cue voice, e.g. en-US or en
    addStopAudioHandlers();
    function speakLocally(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent, cueTextLocale = toCueTextLocale(cueAudioLocale);
      // Locale for text (likely just the 2-letter lang prefix)
      if (cueTextLocale && isLocalSpeechAllowed()) {
        lastPlayer = localPlayer;
        fireBusyEvent();
        getAudioCueTextAsync(name, cueTextLocale, function(cueText) {
          if (cueText) {
            localPlayer.speak({
              text: cueText,
              locale: cueAudioLocale
            }).then(fireNotBusyEvent).catch(function() {
              onUnavailableFn();
            });
          }
        });
      } else {
        onUnavailableFn();
      }
    }
    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isNetworkSpeechAllowed(cueAudioLocale)) {
        lastPlayer = networkPlayer;
        fireBusyEvent();
        var url = getCueUrl(name, cueAudioLocale);
        networkPlayer.play({
          isSpeech: true,
          url: url
        }).then(fireNotBusyEvent).catch(function() {
          onUnavailableFn();
        });
      } else {
        onUnavailableFn();
      }
    }
    var speakViaNetworkFn = false ? fireNotBusyEvent : speakViaNetwork;
    if (isLocalSpeechPreferred()) {
      speakLocally(speakViaNetworkFn);
    } else {
      speakViaNetworkFn(speakLocally);
    }
  }
  function playEarcon(earconName) {
    if (true) {
      // TODO can we play earcons in the extension without the heavyweight network player?
      stopAudio();
      var url = urls.resolveResourceUrl("earcons/" + earconName + "." + getMediaTypeForNetworkAudio());
      networkPlayer.play({
        url: url
      });
    }
  }
  function getBrowserSupportedTypeFromList(listOfAvailableExtensions) {
    var audioApi, index = 0, MEDIA_TYPES = {
      ogg: "audio/ogg",
      mp3: "audio/mpeg"
    };
    try {
      audioApi = new Audio();
    } catch (e) {}
    if (audioApi) {
      for (;index < listOfAvailableExtensions.length; index++) {
        var extension = listOfAvailableExtensions[index];
        if (audioApi.canPlayType(MEDIA_TYPES[extension])) {
          return extension;
        }
      }
    }
    // Must be Safari version <= 6, because we don't support other browsers without Audio() support
    return listOfAvailableExtensions.indexOf("aac") >= 0 ? "aac" : "mp3";
  }
  // What audio format will we use for prerecorded audio?
  function getMediaTypeForNetworkAudio() {
    if (!getMediaTypeForNetworkAudio.cached) {
      getMediaTypeForNetworkAudio.cached = getBrowserSupportedTypeFromList([ "mp3", "ogg" ]);
    }
    return getMediaTypeForNetworkAudio.cached;
  }
  /**
   * Returns if TTS is enabled or not.  Always returns true or false.
   */
  function isSpeechEnabled() {
    // Flag indicating that this site is enabled for TTS.
    return ttsOn;
  }
  // Get the client's preferred speech strategy.
  // This may not be the ultimate speech strategy used, because
  // 1) network speech will not play if ttsAvailable = false in served site preferences
  function getClientSpeechStrategy() {
    if (false) {
      return speechStrategy.LOCAL;
    }
    if (!getClientSpeechStrategy.cached) {
      getClientSpeechStrategy.cached = (site.get("speech") || {}).strategy || speechStrategy.AUTO;
      if (getClientSpeechStrategy.cached === speechStrategy.AUTO) {
        getClientSpeechStrategy.cached = constant.autoStrategy;
      }
    }
    return getClientSpeechStrategy.cached;
  }
  function isLocalSpeechAllowed() {
    return getClientSpeechStrategy() !== speechStrategy.NETWORK && window.speechSynthesis;
  }
  function isLocalSpeechPreferred() {
    var clientSpeechStrategy = getClientSpeechStrategy();
    return clientSpeechStrategy === speechStrategy.LOCAL || clientSpeechStrategy === speechStrategy.PREFER_LOCAL;
  }
  function getRerouteNetworkSpeechLangKey(lang) {
    return constant.REROUTE_NETWORK_SPEECH_KEY + lang;
  }
  function isNetworkSpeechAllowed(lang) {
    return getClientSpeechStrategy() !== speechStrategy.LOCAL && !window.sessionStorage.getItem(getRerouteNetworkSpeechLangKey(lang));
  }
  // This language failed on the network -- disallow it for this tab (uses sessionStorage)
  function rerouteNetworkSpeechLang(lang) {
    // Set to any value to reroute this language to local speech
    try {
      window.sessionStorage.setItem(getRerouteNetworkSpeechLangKey(lang), true);
    } catch (ex) {}
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // Speak on text selection
    textSelect.init();
    /*
     * Speak whenever the lens is opened, if speech is on, etc.
     * Use a later speech fetch if local speech is preferred, because it makes the lens expansion animation janky.
     * TODO: It would be better to always listen for 'hlb/did-create' here so that
     *      speech synthesis happens during the opening animation.
     *      Unfortunately, this currently causes browsers to choke
     *      on the animation when using local speech. But that
     *      may improve in time.
     */
    var SPEECH_BEGIN_EVENT = isLocalSpeechPreferred() ? "hlb/ready" : "hlb/did-create";
    events.on(SPEECH_BEGIN_EVENT, onLensOpened);
    /*
     * A highlight box was closed.  Stop/abort/dispose of the player
     * attached to it.
     */
    events.on("hlb/closed", stopAudio);
    if (true) {
      // For debugging purposes
      // Takes one of the strategies from audio/constant.js
      sitecues.setSpeechStrategy = function(newStrategy) {
        getClientSpeechStrategy.cached = newStrategy;
      };
    }
    ttsOn = pref.get("ttsOn");
  }
  return {
    stopAudio: stopAudio,
    setSpeechState: setSpeechState,
    toggleSpeech: toggleSpeech,
    isSpeechEnabled: isSpeechEnabled,
    speakCueByName: speakCueByName,
    speakContent: speakContent,
    speakText: speakText,
    playEarcon: playEarcon,
    getTTSUrl: getTTSUrl,
    init: init
  };
});

sitecues.define("audio", function() {});
//# sourceMappingURL=audio.js.map