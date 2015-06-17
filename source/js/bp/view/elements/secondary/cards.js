/**
 * Generic module for handling the cards used by tips and settings
 */
sitecues.def('bp/view/elements/cards', function (cards, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'locale', function (BP_CONST, helper, locale) {

    var byId = helper.byId,
      isInitialized,
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

      xhr.onload = function(evt) {
        var request = evt.target || this,
          panelElement = getPanelElement(panelName),
          html = addSemanticSugar(request.responseText);
        panelElement.innerHTML = html;
        toggleCardActive(panelElement.firstElementChild, true);
      };

      xhr.open('GET', panelUrl, true);
      xhr.url = panelUrl;
      xhr.send();
    }

    function getPanelElement(panelName) {
      return document.getElementById('scp-' + panelName);
    }

    // Add useful attributes to various elements, based on elemTypes
    function addSemanticSugar(html) {
      return html.replace(/\<sc-button /g, '<sc-button role="button" class="scp-hand-cursor" ');
    }

    cards.toggleActive = function(isActive, panelName) {
      if (isActive) {
        byId(BP_CONST.PREV_ID).addEventListener('click', prevCard);
        byId(BP_CONST.NEXT_ID).addEventListener('click', nextCard);
        activePanelName = panelName;
        activePanel = getPanelElement(panelName);
      }
      else {
        byId(BP_CONST.PREV_ID).removeEventListener('click', prevCard);
        byId(BP_CONST.NEXT_ID).removeEventListener('click', nextCard);
        activePanelName = null;
        activePanel = null;
      }
    };

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

    sitecues.on('bp/do-toggle-secondary-panel', init);

    callback();

  });
});
