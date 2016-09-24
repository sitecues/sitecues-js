// Has not been converted to the new module system yet

/*global console: true */

// This helps debug the picker. Use sitecues.togglePickerDebugging() to turn
// on useful console log messages related to picker heuristics.
define([], function () {
  'use strict';

  var DEBUG_LABEL_STYLE = 'font-weight: normal; color: purple';

  // -------- Logging section ---------

  function scoreFactorCompare(sf1, sf2) {
    return Math.abs(sf2.impact) - Math.abs(sf1.impact);
  }

  function isFactor(item) {
    return item.impact !== 0;
  }

  function isNonFactor(item) {
    return item.impact === 0;
  }

  function getScoreFactorString(sf) {
    var value = (sf.value * 1) || 0;
    return String('                                       ' + sf.about).slice(-45) + ': ' +
           String('                        ' + value.toFixed(1)).slice(-21) + '   x ' +
           String('                        ' + sf.weight.toFixed(1)).slice(-21) + '   = ' +
           String('                        ' + (sf.weight * value).toFixed(0)).slice(-21);
  }

  function logHeuristicResult(scoreObjs, bestScoreIndex, nodes) {
    var index, scoreObj;
    var numUnusableAtTop = 0;
    var startItem = scoreObjs.length - 1;

    scoreObjs.some(function (scoreObj) {
      if (!scoreObj.judgements) {
        ++numUnusableAtTop;
        return false;
      }
      return true;
    });

    if (numUnusableAtTop) {
      //startItem -= numUnusableAtTop - 1;  // Only show last unusable item
    }

    for (index = startItem; index >= 0; index--) {
      scoreObj = scoreObjs[index];
      var headingStyle = 'font-weight: bold; font-size: 10pt; ' +
        (index === bestScoreIndex && 'background-color: green; color: white;');
      console.group('%c%s    Score = %d', headingStyle, scoreObj.about, scoreObj.score);

      console.log(nodes[index]);
      logObject('Traits', scoreObj.traits);
      logObject('Judgements', scoreObj.judgements);
      if (scoreObj.factors) {
        scoreObj.factors.sort(scoreFactorCompare);  // Display highest impact score factors first
        logArray('Factors', scoreObj.factors.filter(isFactor).map(getScoreFactorString), true);
        logArray('Non-factors', scoreObj.factors.filter(isNonFactor).map(getScoreFactorString));
      }
    }

    scoreObjs.forEach(function () {
      console.groupEnd();
    });
  }

  function logItem(item) {
    if (console.log.toString().indexOf('[native code]') > 0) {
      console.log(item);
      return;
    }
    // Fallback when they tried to kill off logging
    console.group(item);
    console.groupEnd();
  }

  function logTitle(title, doStartExpanded) {
    if (doStartExpanded) {
      console.group('%c%s', DEBUG_LABEL_STYLE, title);
    }
    else {
      console.groupCollapsed('%c%s', DEBUG_LABEL_STYLE, title);
    }
  }

  function logArray(title, array, doStartExpanded) {
    if (array) {
      logTitle(title, doStartExpanded);
      array.forEach(logItem);
      console.groupEnd();
    }
  }

  function logStyleObject(sty) {
    var index;

    logTitle('style');

    for (index = 0; index < sty.length; index++) {
      console.log('%c%s: %c%s', DEBUG_LABEL_STYLE, sty[index], 'color: #222222', sty[sty[index]]);
    }

    console.groupEnd();
  }

  function logObject(title, obj, doStartExpanded) {
    var index, key, sortedKeys;
    if (obj) {
      sortedKeys = Object.keys(obj).sort();
      logTitle(title, doStartExpanded);
      for (index = 0; index < sortedKeys.length; index++) {
        key = sortedKeys[index];
        if (obj[key] instanceof CSSStyleDeclaration) {
          logStyleObject(obj[key]);
        }
        else if (obj[key] instanceof Object) {
          logObject(key, obj[key]);
        }
        else {
          console.log('%c%s: %c%s', DEBUG_LABEL_STYLE, key, 'color: #222222', obj[key]);
        }
      }
      console.groupEnd();
    }
  }

  return {
    logHeuristicResult: logHeuristicResult
  };
});
