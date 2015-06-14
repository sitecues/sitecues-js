sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    tips.extendAnimationParams = function(cssValues) {
      return cssValues;
    };

    function onToggle(isActive) {

      if (isActive) {
        // TODO why both?
//        nextBtn.addEventListener('click', nextCard);
//        prevBtn.addEventListener('click', prevCard);
//        sitecues.on('bp/next-card', nextCard);
//        sitecues.on('bp/prev-card', prevCard);
//        settingsCards.addEventListener('click', onSettingsClick);
      }
      else {
//        nextBtn.removeEventListener('click', nextCard);
//        prevBtn.removeEventListener('click', prevCard);
//        sitecues.off('bp/next-card', nextCard);
//        sitecues.off('bp/prev-card', prevCard);
//        settingsCards.removeEventListener('click', onSettingsClick);
      }
    }

//    function nextCard () {
//
//      if (isEnabled()) {
//
//        var activeCard = tipsCards.getElementsByClassName('scp-active')[0],
//            nextSibling = activeCard.nextElementSibling;
//
//        if (nextSibling) {
//          activeCard.setAttribute('class', activeCard.getAttribute('class').replace('scp-active', ''));
//          nextSibling.setAttribute('class', nextSibling.getAttribute('class') + ' scp-active');
//        }
//
//      }
//    }
//
//    function prevCard () {
//      if (isEnabled()) {
//        var activeCard = tipsCards.getElementsByClassName('scp-active')[0],
//            prevSibling = activeCard.previousElementSibling;
//
//        if (prevSibling) {
//          activeCard.setAttribute('class', activeCard.getAttribute('class').replace('scp-active', ''));
//          prevSibling.setAttribute('class', prevSibling.getAttribute('class') + ' scp-active');
//        }
//      }
//    }

    sitecues.on('bp/did-toggle-tips', onToggle);

    callback();

  });
});
