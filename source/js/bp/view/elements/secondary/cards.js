/**
 * Generic module for handling the cards used by tips and settings
 */
sitecues.def('bp/view/elements/cards', function (cards, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'locale', 'bp/model/state', 'platform', 'animate',
    function (BP_CONST, helper, locale, state, platform, animate) {

    var
      PANELS_WITH_CARDS = { tips: 1, settings: 1},
      PULSE_NEXT_BUTTON_ANIMATION_MS = 300,
      NUM_PULSE_STEPS = 12,
      INITIAL_PULSE_WAIT_MS = 3000,
      PULSE_SCALE = 1.2,
      pulseAnimationTimeout,
      pulseAnimation,
      byId = helper.byId,
      isInitialized,
      isActive = false,
      activePanelName,
      activePanel,
      NUM_PANELS_WITH_CARDS = 2, // can also be computed via PANELS_WITH_CARDS.keys().length;
      panelsToLoad = NUM_PANELS_WITH_CARDS;

    function init() {
      if (isInitialized) {
        return;
      }

      isInitialized = true;

      loadPanelContents('settings');
      loadPanelContents('tips');
    }

    function loadPanelContents(panelName) {
      var localizedPanelName = panelName + '-' + locale.getShortWebsiteLang(),
        panelUrl = sitecues.resolveSitecuesUrl('../html/' + panelName + '/' + localizedPanelName + '.html');

      var xhr = new XMLHttpRequest();

      if ('withCredentials' in xhr) {
        xhr.open('GET', panelUrl, true);
      } else {
        xhr = new XDomainRequest();
        xhr.open('GET', panelUrl);
      }

      xhr.onload = function(evt) {
        var request = evt.target || this,
          html = addSemanticSugar(request.responseText),
          panelElement = document.createElement('sc-cards');

        panelElement.id = 'scp-' + panelName;
        panelElement.className = 'scp-if-' + panelName + ' scp-transition-opacity scp-secondary-feature';
        panelElement.innerHTML = html;

        getContainer().appendChild(panelElement);

        removeUnsupportedContent(panelElement);

        toggleCardActive(panelElement.firstElementChild, true);

        if (-- panelsToLoad === 0) {
          sitecues.emit('bp/content-loaded');
        }
      };

      xhr.url = panelUrl;
      xhr.send();
    }

    function getContainer() {
      return byId(BP_CONST.BP_CONTAINER_ID);
    }

    function getPanelElement(panelName) {
      return document.getElementById('scp-' + panelName);
    }

    // Add useful attributes to various elements, based on elemTypes
    function addSemanticSugar(html) {
      return html.replace(/(<sc-button(?:-big)?)/g, '$1 role="button" data-hover="scale(1.2)" class="scp-hand-cursor scp-tabbable" ')
        .replace(/<input /g, '<input class="scp-hand-cursor scp-tabbable" ');
    }

    function removeAllElements(elements) {
      var index = elements.length;
      while (index --) {
        elements[index].parentNode.removeChild(elements[index]);
      }
    }

    function removeUnsupportedContent(panelElement) {
      if (platform.browser.isIE) {
        removeAllElements(panelElement.getElementsByClassName('scp-no-ie'));
        if (platform.isIE9()) {
          removeAllElements(panelElement.getElementsByClassName('scp-no-ie9'));
        }
      }
    }

    function onPanelUpdate() {
      var panelName = state.getSecondaryPanelName(),
        willBeActive = panelName && PANELS_WITH_CARDS.hasOwnProperty(panelName);

      // Event listeners
      if (isActive !== willBeActive) {
        if (willBeActive) {
          byId(BP_CONST.PREV_ID).addEventListener('click', prevCard);
          byId(BP_CONST.NEXT_ID).addEventListener('click', nextCard);
          byId(BP_CONST.BP_CONTAINER_ID).addEventListener('keydown', onKeyDown);
          enablePulseOnMousePause(panelName);
        }
        else {
          byId(BP_CONST.PREV_ID).removeEventListener('click', prevCard);
          byId(BP_CONST.NEXT_ID).removeEventListener('click', nextCard);
          byId(BP_CONST.BP_CONTAINER_ID).removeEventListener('keydown', onKeyDown);
          disablePulseOnMousePause();
        }
      }

      // Active state
      if (willBeActive) {
        activePanelName = panelName;
        activePanel = getPanelElement(panelName);
        sitecues.emit('bp/did-show-card', getActiveCard().id);
      }
      else {
        activePanelName = null;
        activePanel = null;
      }

      isActive = willBeActive;
    }

    // Pulse the next button if the user doesn't do anything
    function enablePulseOnMousePause(panelName) {
      if (isFirstTimeOnWelcomeCard()) {
        pulseAfterMousePause();
        getPanelElement(panelName).addEventListener('mousemove', pulseAfterMousePause);
      }
    }

    function disablePulseOnMousePause() {
      clearPulseAnimation();
      activePanel && activePanel.removeEventListener('mousemove', pulseAfterMousePause);
    }

    function isFirstTimeOnWelcomeCard() {
      return isDisabled(BP_CONST.PREV_ID);
    }

    function getPulseAnimationTarget() {
      return byId(BP_CONST.NEXT_ID).firstElementChild;
    }

    function pulseAfterMousePause() {
      clearPulseAnimation();
      pulseAnimationTimeout = setTimeout(pulseNextButton, INITIAL_PULSE_WAIT_MS);
    }

    function pulseNextButton() {
      var
        nextButton = getPulseAnimationTarget(),
        options = {
          duration    : PULSE_NEXT_BUTTON_ANIMATION_MS,
          useAttribute: true,
          animationFn: 'sinusoidal'
        };

      pulseAnimation = animate.animateCssProperties(nextButton, { transform: 'scale(' + PULSE_SCALE+ ')' }, options);

      pulseAnimationTimeout = setTimeout(clearPulseAnimation, PULSE_NEXT_BUTTON_ANIMATION_MS * NUM_PULSE_STEPS);
    }

    function clearPulseAnimation() {
      clearTimeout(pulseAnimationTimeout);
      if (pulseAnimation) {
        pulseAnimation && pulseAnimation.cancel();
        var
          nextButton = getPulseAnimationTarget(),
          options = {
            duration: PULSE_NEXT_BUTTON_ANIMATION_MS,
            useAttribute: true
          };
        animate.animateCssProperties(nextButton, { transform: 'scale(1)' }, options);
        pulseAnimation = null;
      }
    }


    function onKeyDown(evt) {
      var LEFT     = 37,
        RIGHT    = 39;

      if (evt.keyCode === LEFT) {
        prevCard();
      }
      else if (evt.keyCode === RIGHT) {
        nextCard();
      }
    }

    function toggleCardActive(cardElement, isActive) {
      if (isActive) {
        cardElement.className = cardElement.className + ' scp-active';
      }
      else {
        cardElement.className = cardElement.className.replace('scp-active', '');
      }

    }

    function isDisabled(id) {
      return byId(id).hasAttribute('aria-disabled');
    }

    function getActiveCard() {
      return activePanel && activePanel.getElementsByClassName('scp-active')[0];
    }

    function switchCard(direction) {
      disablePulseOnMousePause();
      var activeCard = getActiveCard(),
        cardToSelect;

      if (activeCard) {
        cardToSelect = direction === 1 ? activeCard.nextElementSibling : activeCard.previousElementSibling;
        if (!cardToSelect) {
          cardToSelect = direction === 1 ? activePanel.firstElementChild : activePanel.lastElementChild;
        }

        if (cardToSelect) {
          toggleCardActive(activeCard, false);
          toggleCardActive(cardToSelect, true);
          if (cardToSelect.localName !== 'sc-card') {
            // THis element was not a card -- keep going in same direction
            switchCard(direction);
          }
          else {
            sitecues.emit('bp/did-show-card', cardToSelect.id);
          }
        }
      }
    }

    function nextCard() {
      switchCard(1);
      // At first, back button is disabled when on first card
      // However, once we've gone forward we allow backwards cycling
      byId(BP_CONST.PREV_ID).removeAttribute('aria-disabled');
    }

    function prevCard() {
      if (!isDisabled(BP_CONST.PREV_ID)) {
        switchCard(-1);
      }
    }

    sitecues.on('bp/do-next-card', nextCard);

    sitecues.on('bp/do-prev-card', prevCard);

    sitecues.on('bp/do-update', onPanelUpdate);

    sitecues.on('bp/did-expand', init);

    callback();

  });
});
