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
    var INTERACTIVE =  ' class="scp-hand-cursor scp-tabbable" ';
    return html.replace(/(<sc-button(?:-big)?)/g, '$1 role="button" data-hover="scale(1.2)"' + INTERACTIVE)
      .replace(/<sc-menuitem /g, '<sc-menuitem role="button"' + INTERACTIVE)
      .replace(/<sc-link /g, '<sc-link role="link"' + INTERACTIVE)
      .replace(/<input type="range"/g, '<input type="range"' + INTERACTIVE);
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
      if (platform.isIE9) {
        removeAllElements(panelElement.getElementsByClassName('scp-no-ie9'));
      }
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
    }

    // Active state
    if (willBeActive) {
      activePanelName = panelName;
      activePanel = getPanelElement(panelName);
      moveIndicator();
      newCardNotification();
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
        selectNewCard(byId(linkTarget));
        sitecues.emit('bp/did-activate-link');
      }
    }
  }

  function newCardNotification() {
    sitecues.emit('bp/did-show-card', getActiveCard().id);
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

  function moveIndicator() {
    if (!activePanel) {
      return;
    }
    var chooser = activePanel.querySelector('.scp-card-chooser'),
      chosenItem = chooser.querySelector('[data-target="' + getActiveCard().id + '"]'),
      indicator = activePanel.querySelector('.scp-card-indicator'),
      indicatorRect = indicator.getBoundingClientRect(),
      chosenItemRect = chosenItem.getBoundingClientRect(),
      left = chosenItemRect.left - indicatorRect.left,
      previouslyChosen = chooser.querySelector('[aria-selected="true"]');

    // Reset old selection
    if (previouslyChosen) {
      previouslyChosen.removeAttribute('aria-selected');
    }

    // Set indicator
    indicator.style.backgroundPosition = (-442 + left + chosenItemRect.width / 2) + 'px 0';
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
  function selectNewCard(cardToSelect) {
    if (cardToSelect) {
      // Always skip advanced cards for now
      if (cardToSelect.localName === 'sc-card' && !cardToSelect.hasAttribute('data-advanced')) {
        toggleCardActive(getActiveCard(), false);
        toggleCardActive(cardToSelect, true);
        moveIndicator();
        newCardNotification();
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
    sitecues.on('bp/do-target-card', selectNewCard);
  }

  return {
    init: init
  };
});
