/**
 * Generic module for handling the cards used by tips and settings
 */
define(['bp/constants', 'bp/helper', 'core/locale', 'bp/model/state', 'core/platform', 'bp-expanded/view/svg-animate', 'core/util/xhr', 'core/conf/urls'],
  function (BP_CONST, helper, locale, state, platform, animate, xhr, urls) {

  var
    PANELS_WITH_CARDS = { tips: 1, settings: 1},
    byId = helper.byId,
    isInitialized,
    isActive = false,
    activePanelName,
    activePanel,
    NUM_PANELS_WITH_CARDS = 2, // can also be computed via PANELS_WITH_CARDS.keys().length;
    panelsToLoad = NUM_PANELS_WITH_CARDS;

  function loadPanelContents(panelName) {
    var localizedPanelName = panelName + '-' + locale.getShortWebsiteLang(),
      panelUrl = urls.resolveResourceUrl('html/' + panelName + '/' + localizedPanelName + '.html');

    xhr.get({
      url: panelUrl,
      success: function(html) {
        var panelElement = document.createElement('sc-cards');
        panelElement.id = 'scp-' + panelName;
        panelElement.className = 'scp-if-' + panelName + ' scp-transition-opacity scp-secondary-feature';
        panelElement.innerHTML = addSemanticSugar(html);

        getContainer().appendChild(panelElement);
        removeUnsupportedContent(panelElement);

        toggleCardActive(panelElement.firstElementChild, true);

        if (-- panelsToLoad === 0) {
          sitecues.emit('bp/content-loaded');
        }
      }
    });
  }

  function getContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  function getPanelElement(panelName) {
    return document.getElementById('scp-' + panelName);
  }

  // Add useful attributes to various elements, based on elemTypes
  function addSemanticSugar(html) {
    var INTERACTIVE =  ' class="scp-hand-cursor scp-tabbable';
    return html.replace(/(<sc-button )/g, '<sc-button role="button"' + INTERACTIVE + '" ')
      .replace(/<sc-menuitem /g, '<sc-menuitem role="button"' + INTERACTIVE+ '" ')
      .replace(/<sc-card /g, '<sc-card role="tabpanel"')
      .replace(/<sc-tab /g, '<sc-link role="tab" aria-selected="false"' + INTERACTIVE+ '" ')
      .replace(/<\/sc-tab/g, '</sc-link')
      .replace(/<sc-normal-range /g, '<input type="range"' + INTERACTIVE + ' scp-normal-range" ')
      .replace(/<\/sc-normal-range>/g, '</input>')
      .replace(/<sc-hue-range /g, '<input type="range"' + INTERACTIVE + ' scp-hue-range" ')
      .replace(/<\/sc-hue-range>/g, '</input>');
  }

  function removeAllElements(elements) {
    var index = elements.length;
    while (index --) {
      elements[index].parentNode.removeChild(elements[index]);
    }
  }

  function removeUnsupportedContent(panelElement) {
    if (platform.browser.isIE && platform.browser.version <= 10) {
      removeAllElements(panelElement.querySelectorAll('[data-no-ie10]'));
    }
  }

  function onPanelUpdate() {
    var panelName = state.getSecondaryPanelName(),
      willBeActive = panelName && PANELS_WITH_CARDS.hasOwnProperty(panelName),
      addOrRemoveFn = willBeActive ? 'addEventListener' : 'removeEventListener',
      bpContainer = byId(BP_CONST.BP_CONTAINER_ID);

    // Event listeners
    if (isActive !== willBeActive) {
      byId(BP_CONST.PREV_ID)[addOrRemoveFn]('click', prevCard);
      byId(BP_CONST.NEXT_ID)[addOrRemoveFn]('click', nextCard);

      // TODO: This should be moved into the controller, somehow.
      // bpContainer[addOrRemoveFn]('keydown', onKeyDown);

      bpContainer[addOrRemoveFn]('click', onClick);
      bpContainer[addOrRemoveFn]('keydown', onKeyDown);
    }

    // Active state
    if (willBeActive) {
      if (activePanelName !== panelName) {
        activePanelName = panelName;
        activePanel = getPanelElement(panelName);
        moveIndicator();
        newCardNotification();
      }
    }
    else {
      activePanelName = null;
      activePanel = null;
    }

    isActive = willBeActive;
  }

  function onClick(evt) {
    var clickedElem = helper.getEventTarget(evt),
      linkTarget = clickedElem.getAttribute('data-target');

    if (linkTarget) {
      if (linkTarget.charAt(0) === '#') {
        // Help target
        require(['info/info'], function(info) {
          info.showHelp(linkTarget.substring(1));
        });
      }
      else {
        // Card link
        selectNewCard(byId(linkTarget), true);
      }
    }
  }

  function onKeyDown(event) {
    var LEFT  = 37,
      RIGHT = 39;
    if (event.target.localName !== 'input') {
      if (event.keyCode === LEFT) {
        switchCard(-1);
      }
      else if (event.keyCode === RIGHT) {
        switchCard(1);
      }
    }
  }

  function newCardNotification(isFromLink) {
    sitecues.emit('bp/did-show-card', getActiveTab(), isFromLink);
  }


// This interferes with slider usage which also needs left/right arrow keys
//    function onKeyDown(evt) {
//      var LEFT     = 37,
//        RIGHT    = 39;
//
//      if (evt.keyCode === LEFT) {
//        prevCard();
//      }
//      else if (evt.keyCode === RIGHT) {
//        nextCard();
//      }
//    }


  function toggleCardActive(cardElement, isActive) {
    if (isActive) {
      cardElement.className = cardElement.className + ' scp-active';
    }
    else {
      cardElement.className = cardElement.className.replace('scp-active', '');
    }
  }

  function getActiveTab() {
    var activeCard = getActiveCard(),
      tabId = activeCard.getAttribute('aria-labelledby');
    return document.getElementById(tabId);
  }

  function moveIndicator() {
    if (!activePanel) {
      return;
    }
    var chosenItem = getActiveTab(),
      bpScale = helper.getBpContainerScale(),
      indicator = activePanel.querySelector('.scp-card-indicator'),
      indicatorRect = indicator.getBoundingClientRect(),
      chosenItemRect = chosenItem.getBoundingClientRect(),
      choseItemLeft = chosenItemRect.left - indicatorRect.left,
      indicatorLeft = -442 + (choseItemLeft + chosenItemRect.width / 2) / bpScale,
      previouslyChosen = chosenItem.parentNode.querySelector('[aria-selected="true"]');

    // Reset old selection
    if (previouslyChosen) {
      previouslyChosen.setAttribute('aria-selected', 'false');
    }

    // Set indicator
    indicator.style.backgroundPosition = indicatorLeft + 'px 0';
    chosenItem.setAttribute('aria-selected', 'true');
  }

  function isDisabled(id) {
    return byId(id).hasAttribute('aria-disabled');
  }

  function getActiveCard() {
    return activePanel && activePanel.getElementsByClassName('scp-active')[0];
  }

    /**
     * Switch to a new card
     * @param direction 1 for next card, -1 for previous
     * @param fromCard (optional) Card to navigate to next/prev from. If not specified will use current active card
     */
  function switchCard(direction, fromCard) {
    var activeCard = fromCard || getActiveCard(),
      cardToSelect;

    if (activeCard) {
      cardToSelect = direction === 1 ? activeCard.nextElementSibling : activeCard.previousElementSibling;
      if (!cardToSelect) {
        cardToSelect = direction === 1 ? activePanel.firstElementChild : activePanel.lastElementChild;
      }

      if (!selectNewCard(cardToSelect)) {
        switchCard(direction, cardToSelect);
      }
    }
  }

  // Returns true on success
  function selectNewCard(cardToSelect, isFromLink) {
    if (cardToSelect) {
      // Always skip advanced cards for now
      if (cardToSelect.localName === 'sc-card' && !cardToSelect.hasAttribute('data-advanced')) {
        toggleCardActive(getActiveCard(), false);
        toggleCardActive(cardToSelect, true);
        moveIndicator();
        newCardNotification(isFromLink);
        // At first, back button is disabled when on first card
        // However, once we've gone forward we allow backwards cycling
        byId(BP_CONST.PREV_ID).removeAttribute('aria-disabled');
        return true;
      }
    }

  }

  function nextCard() {
    switchCard(1);
  }

  function prevCard() {
    if (!isDisabled(BP_CONST.PREV_ID)) {
      switchCard(-1);
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    loadPanelContents('settings');
    loadPanelContents('tips');

    sitecues.on('bp/did-change', onPanelUpdate);
  }

  return {
    init: init
  };
});
