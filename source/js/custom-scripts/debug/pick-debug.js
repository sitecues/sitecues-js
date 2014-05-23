/*global console: true */
/*
 * Customer-Customization File
 * CustomId    : --- not relevant ---
 * IssueLink   :
 * Description : This helps debug the picker
 *
 */
sitecues.def(function (module, callback) {
  'use strict';
  sitecues.use('custom', function (custom) {
    var DEBUG_LABEL_STYLE = 'font-weight: normal; color: purple';

    // -------- Logging section ---------

    function scoreFactorCompare(sf1, sf2) { return Math.abs(sf1.value * sf1.weight) - Math.abs(sf2.value * sf2.weight); }
    function isFactor(item) { return item.impact > 0; }
    function isNonFactor(item) { return item.impact <= 0; }
    function getScoreFactorString(sf) {
      return String('                        ' + sf.about).slice(-30) + ': ' +
        String('         ' + Math.round(sf.value)).slice(-6) + '   x ' +
        String('         ' + sf.weight).slice(-6) + '   = ' +
        String('         ' + Math.round(sf.weight * sf.value)).slice(-6);
    }

    function logHeuristicResult(scoreObjs, bestScoreIndex, traitStack, judgementStack, nodes) {
      var index, scoreObj;
      var numUnusableAtTop = 0;
      var startItem = scoreObjs.length - 1;
      judgementStack.some(function(judgements) {
        if (!judgements) {
          ++ numUnusableAtTop;
          return false;
        }
        return true;
      });
      if (numUnusableAtTop) {
        startItem -= numUnusableAtTop - 1;  // Only show last unusable item
      }

      for (index = startItem; index >= 0; index --) {
        scoreObj = scoreObjs[index];
        var headingStyle = 'font-weight: bold; font-size: 10pt; ' +
          (index === bestScoreIndex && 'background-color: green; color: white;');
        console.group('%c%s    Score = %d', headingStyle, scoreObj.about, scoreObj.score);

        console.log(nodes[index]);
        logObject('Traits', traitStack[index]);
        logObject('Judgements', judgementStack[index]);
        if (scoreObj.factors) {
          scoreObj.factors.sort(scoreFactorCompare);  // Display highest impact score factors first
          logArray('Factors', scoreObj.factors.filter(isFactor).map(getScoreFactorString), true);
          logArray('Non-factors', scoreObj.factors.filter(isNonFactor).map(getScoreFactorString));
        }
        if (scoreObj.siblings && scoreObj.siblings.length) {
          logArray('Siblings ->   for parent: ' + scoreObj.votesForParent +
              '      vs for individual siblings: ' + scoreObj.votesAgainstParent,
            scoreObj.siblings);
        }
      }
      scoreObjs.forEach(function() { console.groupEnd(); });
    }

    function logItem(item) {
      console.log(item);
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

      for (index = 0; index < sty.length; index ++ ) {
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


    custom.register('mouse-highlight/picker', function () {
      this.logResults = logHeuristicResult;
    });

    callback();
  });
});