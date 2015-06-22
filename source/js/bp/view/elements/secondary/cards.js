/**
 * Generic module for handling the cards used by tips and settings
 */
sitecues.def('bp/view/elements/cards', function (cards, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'locale', 'bp/model/state', function (BP_CONST, helper, locale, state) {

    var
      PANELS_WITH_CARDS = { tips: 1, settings: 1},
      byId = helper.byId,
      isInitialized,
      isActive = false,
      activePanelName,
      activePanel;

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
          panelElement = getPanelElement(panelName),
          html = addSemanticSugar(request.responseText);
        panelElement.innerHTML = html;
        toggleCardActive(panelElement.firstElementChild, true);
      };

      xhr.url = panelUrl;
      xhr.send();
    }

    function getPanelElement(panelName) {
      return document.getElementById('scp-' + panelName);
    }

    // Add useful attributes to various elements, based on elemTypes
    function addSemanticSugar(html) {
      return html.replace(/<sc-button /g, '<sc-button role="button" class="scp-hand-cursor scp-tabbable" ');
    }

    function onPanelUpdate() {
      var panelName = state.getSecondaryPanelName(),
        willBeActive = panelName && PANELS_WITH_CARDS.hasOwnProperty(panelName);

      // Active state
      if (willBeActive) {
        activePanelName = panelName;
        activePanel = getPanelElement(panelName);
      }
      else {
        activePanelName = null;
        activePanel = null;
      }

      // Event listeners
      if (isActive !== willBeActive) {
        if (willBeActive) {
          byId(BP_CONST.PREV_ID).addEventListener('click', prevCard);
          byId(BP_CONST.NEXT_ID).addEventListener('click', nextCard);
        }
        else {
          byId(BP_CONST.PREV_ID).removeEventListener('click', prevCard);
          byId(BP_CONST.NEXT_ID).removeEventListener('click', nextCard);
        }
      }

      isActive = willBeActive;
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

    sitecues.on('bp/do-update', onPanelUpdate);

    sitecues.on('bp/do-toggle-secondary-panel', init);

    callback();

  });
});
