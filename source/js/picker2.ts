///<reference path="lib/jQuery.d.ts" />

interface iScoreData {
    distanceFromOriginal : number;
    score : number;
    doSectionStartCheck : bool;
    doBorderCheck : bool;
    doContinue : bool;
    prevDisplay? : string;
    prevTag? : string;
    baseRect? : iRect;
    debugInfo : string[];
}

/**
 * Given the start element, return a chunk of content that makes sense as a readable piece.
 * This is used by the mouse highlighting system.
 */
class ReadableChunkFinder {
    static kIsDebugOn = true;
    static kGoodTags = ["a", "button", "h1", "h2", "h3", "h4", "h5", "h6", "img", "p", "fieldset", "form", "td", "tr", "li" ];
    static kBadTags = [ "body", "html", "legend", "ol", "ul" ];
    static kSectionStartTags = ["h1", "h2", "h3", "h4", "h5", "h6", "hr", "dt" ];
    static kGoodCssDisplay = ["block", "inline-block", "table-cell", "list-item"];
    static kBadCssDisplay = ["inline"];
    static kBlackListQuery = '.eq360-ui'; // Elements to never highlight
    static kDistancePenalty = 0; // How much to penalize for being far away from original node
    static kPerChildPenalty = -1;
    static kMinChildrenBeforePenalty = 4;
    static kMaxDistanceFromOriginal = 6; // Maximum ancestors to climb looking for start
    static kMinHeightBeforePenalty = 250;
    static kHeightPenaltyDivisor = 100;
    static kMinWidthBeforePenalty = 300;
    static kWidthPenaltyDivisor = 25;
    /**
     * Return JQuery object representing adjacent elements to highlight
     * Can return empty object if there are no appropriate elements
     */
    static find(start:HTMLElement):JQuery {
        // TODO don't return items with CSS transitions specified -- just to be defensive. We are mucking with that stuff.
        // TODO we may not want to return any floating/out-of-flow items for now. At least, we will need to look at this.
        if (start === document.body) {
            return $(); // Shortcut -- no highlight for body itself
        }

        if (start.localName === "img" && start.getAttribute('role') != 'presentation') {
            return $(start); // Just return images in that case -- keep it simple
        }

        if (!isDirectParentOfVisibleTextContent(start)) {
            // Don't return items that don't have visible content as direct children.
            // By having this rule we eliminate the jumpiness that occurs when
            // moving from block element to block element.
            return $();
        }

        if ($(ReadableChunkFinder.kBlackListQuery).is(start) || $(ReadableChunkFinder.kBlackListQuery).has(start).length) {
            return $(); // In Equinox widget ... do not highlight ourselves
        }

        var best = getMostRelevantInAncestorChainOld(start);

//        if (best.parentNode.firstChild == best &&
//            $.inArray(best.localName, ReadableChunkFinder.kSectionStartTags) >= 0) {
//            // TODO try to return just until next equivalent heading
//            // This means that an array of jQuery highlight objects needs to actually work
//            best = <HTMLElement>best.parentNode; // Start of section, read whole section
//        }

        if ($.inArray(best.localName, ReadableChunkFinder.kSectionStartTags) < 0) {
            return $(best);  // Not a section start
        }

        while (!best.nextSibling && best.parentNode && best.parentNode.nextSibling) {
            best = <HTMLElement>(best.parentNode); // Escape out of heading containers
        }

        var section = getEntireSection(best);
        console.log("Got section " + section.length);
        return section;
    }

    static getEntireSection(current:HTMLElement):JQuery {
        // Return entire section -- everything up until next section start
        console.log("Getting section");
        var section:JQuery = $();
        if (current.localName === "hr") {
            // Don't add <hr> if at start or end of section ... it's just a border
            current = <HTMLElement>(current.nextSibling);
        }
        do {
            if (current.nodeType === 1 /* Element node */) {
                section = section.add(current);
            }
            else if (isNonEmptyTextNode(current)) {
                console.log("Incorrect non-empty text node (" + current.nodeType + ") cannot be added to section");
                return section;
            }
            current = <HTMLElement>(current.nextSibling);
        } while (current && $.inArray(current.localName, ReadableChunkFinder.kSectionStartTags) < 0);

        return section;
    }

    static getMostRelevantInAncestorChain(original:HTMLElement):HTMLElement {
        // Tried using explicit rules and breaking early
        var bestAncestor = original;
        var current = original;
        var baseRect = null;
        var prevRect = null;
        var distanceFromOriginal = -1;
        var isPreviousInline = true;
        var isTopGrowthAllowed = true;
        var isBottomGrowthAllowed = true;
        var isLeftGrowthAllowed = true;
        var isRightGrowthAllowed = true;
        var wasTypicalContainer = false;

        // Allow one or the other
        var debugStrings:string[] = ["", "", "", "", "", "", "", "", "", ""];
        console.log("-------------------------------------------------------------------------------------------------------------------------------------------");

        while (current != document.documentElement && distanceFromOriginal < kMaxDistanceFromOriginal) {
            var tag = current.localName;
            if ($.inArray(tag, ReadableChunkFinder.kBadTags) >= 0) {
                break;
            }

            var className = current.getAttribute('class'); // Currently for debugging only
            className = className ? "." + className.replace(" ", ".") : "";
            var style = ComputedStyle.getStyleObject(current);
            var rect = current.getBoundingClientRect();
            var width = rect.width || 0;
            var height = rect.height || 0;
            var debugIndex = distanceFromOriginal + 1;
            var isTyp = isTypicalFormattingContainer(current);
            debugStrings[debugIndex] = tag + className + " {"+ debugIndex + "} " + " display:" + style['display'] + " " + Math.round(width) + "x" + Math.round(height);

            if (!baseRect || isPreviousInline) {
                prevRect = baseRect = jQuery.extend({}, rect);
                debugStrings[debugIndex] += " ** New base size ";
//                if (style['display'] === 'inline' && current.parentNode.childNodes.length === 1) {
//                    debugStrings[debugIndex] += " ** Free pass for single inline child ";
//                    ++ distanceFromOriginal;
//                    current = <HTMLElement>(current.parentNode);
//                    isPreviousInline = true;
//                    continue;
//                }
                // Get base rectangle for growth comparisons
                // If we previously used a single-child inline, do it again, because inlines don't grow to full width
                // and our comparisons would be off
            }
            if (!isPreviousInline) {
                if (baseRect && height / baseRect.height >= 5 && width / baseRect.width > 2) {
                    debugStrings[debugIndex] += " ** 2d-growth/use-prev/stop";
                    break; // Don't grow in two dimensions
                }
            }

            var isDivided = isAnythingRenderedBeforeThisInContainer(current, "h1,h2,h3,h4,h5,h6,hr");
            if (isDivided) {
                debugStrings[debugIndex] += " ** is-divided/use-prev/stop";
                break;
            }

            if ($(current).find("> ul,> ol,> table").length >= 2 ||
                $(current).find("> p").length >= 3) {
                debugStrings[debugIndex] += " ** atypical-repeated-tags/use-prev/stop";
                break;
            }

            if (isTyp) {
                debugStrings[debugIndex] += " ** typical-container";
            }
            if (!isTyp && !isPreviousInline) {
                var maxWidthGrowth = 8;
                var maxHeightGrowth = 3;
                if (wasTypicalContainer) {
                    maxWidthGrowth = 1.5;
                    maxHeightGrowth = 1.5;
                }
                if (height > 800 || height / Math.max(100, baseRect.width) > maxWidthGrowth || width / Math.max(100, baseRect.width) > maxHeightGrowth) {
                    debugStrings[debugIndex] += " ** too-big/use-prev/stop";
                    break;
                }
                if (current.children.length > 10) {
                    debugStrings[debugIndex] += " ** too-many-children/use-prev/stop";
                    break;
                }
            }

            var extraGrowthAllowed = isTyp ? 50 : 20;
            if (!isTopGrowthAllowed && rect.top < prevRect.top - extraGrowthAllowed) {
                debugStrings[debugIndex] += " ** top-growth/use-prev/stop (" + (rect.top  - prevRect.top) + ")";
                break;
            }

            if (!isBottomGrowthAllowed && rect.bottom > prevRect.bottom + extraGrowthAllowed) {
                debugStrings[debugIndex] += " ** bottom-growth/use-prev/stop";
                break;
            }

            if (!isLeftGrowthAllowed && rect.left < prevRect.left - extraGrowthAllowed) {
                debugStrings[debugIndex] += " ** left-growth/use-prev/stop";
                break;
            }

            if (!isRightGrowthAllowed && rect.right > prevRect.right + extraGrowthAllowed) {
                debugStrings[debugIndex] += " ** right-growth/use-prev/stop";
                break;
            }

            ++ distanceFromOriginal;
            bestAncestor = current;

            var isInline = style['display'] === 'inline';
            if (isInline && $(current).filter('a,button,input[type="button"],[tabindex]').length === 1) {
                var inline = current;
                var firstInterestingAncestor = current.parentNode;
                while ($(firstInterestingAncestor).css('display') === 'inline' && isAlone(<HTMLElement>firstInterestingAncestor)) {
                    // Sometimes we are an <a> wrapped by another inline element. We want to look at the ancestor of that wrapper
                    firstInterestingAncestor = firstInterestingAncestor.parentNode;
                    inline = <HTMLElement>inline.parentNode;
                }
                console.log("Dudex? " + firstInterestingAncestor + " " + isTypicalFormattingContainer(<HTMLElement>firstInterestingAncestor) + " " + isInlineOnOwnLine(inline));
                if (!isTypicalFormattingContainer(<HTMLElement>firstInterestingAncestor) && // Should keep going up for something better
                    !isInlineOnOwnLine(inline)) {   // Could be just a caption or something
                    debugStrings[debugIndex] += " ** good-inline-tag/stop";
                    break;
                }
            }

            // If significant visual separation, break and use this one
            var parentBackground = $(current.parentNode).css('backgroundColor');
            if ($.inArray(style['backgroundColor'], [parentBackground, "rgba(0, 0, 0, 0)", "transparent"]) < 0 ||
                style['backgroundImage'] !== 'none') {
                debugStrings[debugIndex] += " ** Background " + style['backgroundColor'] + " " + style['backgroundImage'] + "/stop";
                break;
            }

            // Visually separated from other elements
            var topSeparation = getSideSeparationScore(style, 'Top');
            var bottomSeparation = getSideSeparationScore(style, 'Bottom');
            var leftSeparation = getSideSeparationScore(style, 'Left');
            var rightSeparation = getSideSeparationScore(style, 'Right');

            if (topSeparation >= 10) {
                isTopGrowthAllowed = false;
            }
            if (bottomSeparation >= 10) {
                isBottomGrowthAllowed = false;
            }
            if (leftSeparation >= 10) {
                isLeftGrowthAllowed = false;
            }
            if (rightSeparation >= 10) {
                isRightGrowthAllowed = false;
            }

            if (isInline && !isLeftGrowthAllowed && !isRightGrowthAllowed) {
                debugStrings[debugIndex] += " ** inline-h-padded/stop";
                break;
            }

            current = <HTMLElement>(current.parentNode);
            prevRect = jQuery.extend({}, rect);
            isPreviousInline = isInline;
            wasTypicalContainer = isTyp;
        }

        if (kIsDebugOn) {
            showDebugResults(debugStrings, debugIndex, distanceFromOriginal);
        }

        return bestAncestor;
    }

    static isAnythingRenderedBeforeThisInContainer(container : HTMLElement, selector : string) {
        var items = $(container).find(selector); // Descendant which matches
        var item = items.get(items.length - 1);
        while (item && item != container) {
            var sibling = item.parentNode.firstChild;
            while (sibling && sibling !== item) {
                if (!$(sibling).filter(selector)) {
                    return true;  // Some other type of item than the selector comes before
                }
                sibling = sibling.nextSibling;
            }
            item = item.parentNode;
        }
        return false;
    }

    static isTypicalFormattingContainer(current : HTMLElement) : bool {
        if (current.localName === "li") {
            return true;
        }

        var numChildren = current.children.length;
        if (numChildren === 1 && isAlone(<HTMLElement>current.firstChild)) {
            return true;
        }
        if (numChildren > 3) {
            return false;
        }
        // Three or fewer children -- typical container if:
        // Only one child or other child is an image or wrapped image -- very common to pair text objects with images
        return 1 === $(current).find("> img, > a > img, > div:only-child > img, > div:only-child > a > img").length;
    }

    static getSideSeparationScore(style : {}, type : string) : number {
        return Math.max(parseInt(style['margin' + type]), 0) +
            Math.max(parseInt(style['padding' + type]), 0) +
            parseFloat(style['border' + type + 'Width']) * 1000;
    }

    static getMostRelevantInAncestorChainOld(original:HTMLElement):HTMLElement {
        var bestScore = -1000;
        var bestAncestor = original;
        var bestDistance = 0;
        var scoreData: iScoreData = {
            distanceFromOriginal : 0,
            score : 0,
            doSectionStartCheck : true,
            doBorderCheck : true,
            doContinue : true,
            debugInfo: []
        };
        var current = original;

        while (current != document.documentElement &&
            scoreData.distanceFromOriginal < kMaxDistanceFromOriginal &&
            scoreData.doContinue) {
            scoreData = getScore(current, scoreData);

            if (scoreData.score >= bestScore) {
                bestScore = scoreData.score;
                bestAncestor = current;
                bestDistance = scoreData.distanceFromOriginal;
            }

            current = <HTMLElement>(current.parentNode);
            ++scoreData.distanceFromOriginal;
        }

        if (kIsDebugOn) {
            showDebugResults(scoreData.debugInfo, scoreData.debugInfo.length, bestDistance);
        }
        return bestAncestor;
    }

    static showDebugResults(debugStrings: string[], numDebugStrings, bestDistance) {
        for (var distance = numDebugStrings; distance >= 0; distance --) {
            var indent = (distance === bestDistance) ? "* " : "  ";;
            for (var spaces = 1; spaces < debugStrings.length - distance; spaces ++) {
                indent += "  ";
            }
            console.log(indent + debugStrings[distance]);
        }
    }
    static getScore(current:HTMLElement, scoreData : iScoreData) : iScoreData {
        scoreData.score = 0;

        var tag = current.localName;
        var role = current.getAttribute('role');
        var numChildren = current.childNodes.length;

        if ($.inArray(tag, ReadableChunkFinder.kBadTags) >= 0 ||
            role === 'presentation') {
            scoreData.debugInfo.push("0: Bad tag or role");
            return scoreData; // Skip this item
        }

        var style = ComputedStyle.getStyleObject(current);
        var displayStyle = style['display'];

        var debugString = "";

        var distancePenalty = scoreData.distanceFromOriginal * ReadableChunkFinder.kDistancePenalty;
        scoreData.score += distancePenalty;
        if (distancePenalty) {
            debugString += " ** Distance (" + distancePenalty + ") ";
        }

        if ($.inArray(current.localName, ReadableChunkFinder.kGoodTags) >= 0) {
            // These tags are good to stop on
            debugString += " ** Good tag (+15) ";
            scoreData.score += 15;
        }
        else if (current.hasAttribute('role')) {
            debugString += " ** Has role [not presentation] (+15) ";
            scoreData.score += 15;
        }
        else {
            if ($.inArray(displayStyle, ReadableChunkFinder.kBadCssDisplay) >= 0) {
                debugString += " ** Bad CSS display (-20) " + displayStyle;
                scoreData.score -= 20;
            }
            else if ($.inArray(displayStyle, ReadableChunkFinder.kGoodCssDisplay) >= 0) {
                debugString += " ** Good CSS display (+5) " + displayStyle;
                scoreData.score += 5;  // Good indicator
            }
        }

        if (numChildren >= kMinChildrenBeforePenalty) {
            if (scoreData.prevDisplay && scoreData.prevDisplay !== 'inline') {
                // Penalty for block children -- many block children is not a good sign
                var childPenalty = (current.children.length) * kPerChildPenalty;
                debugString += " ** Child penalty (" + childPenalty + ") ";
                scoreData.score += childPenalty;
            }
        }
        else if (numChildren === 1 && current.firstChild.nodeType === 1 /* Element */) {
            debugString += " ** Single child (+15) ";
            scoreData.score += 15;
        }
        else if ($(current).find("> img, > a > img, > div:only-child > img, > div:only-child > a > img").length === 1) {
            // Only one child or other child is an image or wrapped image -- very common to pair text objects with images
            debugString += " ** Good children (+10) ";
            scoreData.score += 10;
        }

        // First element looks like a start of a section
        if (scoreData.doSectionStartCheck && isSectionStartContainer(current)) {
            debugString += " ** Section start (+15) ";
            scoreData.doSectionStartCheck = false; // Don't do again
            scoreData.score += 15;
        }

        // Visually separated from other elements
        var top = Math.max(parseInt(style['marginTop']), 0) + Math.max(0, parseInt(style['paddingTop'])) - 3;
        var bottom = Math.max(0, parseInt(style['marginBottom'])) + Math.max(0, parseInt(style['paddingBottom'])) - 3;
        var left = Math.max(0, parseInt(style['marginLeft'])) + Math.max(0, parseInt(style['paddingLeft'])) - 3;
        var right = Math.max(0, parseInt(style['marginRight'])) + Math.max(0, parseInt(style['paddingRight'])) - 3;
        // Significant empty space around it -- very strong indicator
        var topBottom = Math.max(top, bottom);
        var topBottomBonus = Math.max(0, Math.min(topBottom, 6));
        if (topBottomBonus) {
            debugString += " ** Top/bottom space " + topBottom + " (+" + topBottomBonus + ") ";
        }
        var leftRight = Math.max(left, right);
        var leftRightBonus = Math.max(0, Math.min(leftRight, 6));
        if (leftRightBonus) {
            debugString += " ** Left/right space " + leftRight + " (+" + leftRightBonus + ") ";
        }
        scoreData.score += topBottomBonus + leftRightBonus;

        var parentBackground = $(current.parentNode).css('backgroundColor');
        if ($.inArray(style['backgroundColor'], [parentBackground, "rgba(0, 0, 0, 0)", "transparent"]) < 0 ||
            style['backgroundImage'] !== 'none') {
            debugString += " ** Background " + style['backgroundColor'] + " " + style['backgroundImage'] + " (+15) ";
            scoreData.score += 15; // Very strong indicator
        }

        if (scoreData.doBorderCheck &&
            parseFloat(style['outlineTopWidth']) || parseFloat(style['outlineLeftWidth']) ||
            parseFloat(style['outlineBottomWidth']) || parseFloat(style['outlineRightWidth']) ||
            parseFloat(style['borderTopWidth']) || parseFloat(style['borderLeftWidth']) ||
            parseFloat(style['borderBottomWidth']) || parseFloat(style['borderRightWidth'])) {
            debugString += " ** First border (+20)";
            scoreData.doBorderCheck = false; // Don't do again
            scoreData.score += 20; // Very strong indicator
        }

        if (parseInt(style['left']) && parseInt(style['top'])) {
            debugString += " ** Positioned element (+15) ";
            scoreData.doContinue = false;
            scoreData.score += 15;  // Very strong indicator
        }

        var rect = current.getBoundingClientRect();
        var widthForPenalty = Math.max(rect.width - kMinWidthBeforePenalty, 0);
        var widthPenalty = Math.round(widthForPenalty / kWidthPenaltyDivisor);
        debugString += " ** Width (-" + widthPenalty + ") ";
        scoreData.score -= widthPenalty;  // Penalty for extremely wide elements

        var heightForPenalty = Math.max(rect.height - kMinHeightBeforePenalty, 0);
        var heightPenalty = Math.round(heightForPenalty * heightForPenalty / kHeightPenaltyDivisor);
        debugString += " ** Height (-" + heightPenalty + ") ";
        scoreData.score -= heightPenalty;  // Penalty for extremely tall elements

        if (typeof scoreData.baseRect !== "undefined") {
            if (rect.height / scoreData.baseRect.height > 2 &&
                rect.width / scoreData.baseRect.width > 2) {
                // Growth in two dimensions -- very bad sign
                scoreData.score -= 20;  // Very strong indicator
                debugString += " ** 2d growth (-20) ";
                debugString += "{ width = " + rect.width + "/" + scoreData.baseRect.width + "} ";
            }
            else if (rect.height / scoreData.baseRect.height < 1.5 ||
                rect.width  / scoreData.baseRect.width  < 1.5) {
                // var smallHeightGrowthBonus = Math.max(0, 130 - 100 * rect.height / scoreData.prevRect.height);
                // var smallWidthGrowthBonus = Math.max(0, 130 - 100 * rect.width / scoreData.prevRect.width);
                // Still expanding mostly in just one dimension, just a bit larger
                var smallGrowthBonus = 10 + 5 * scoreData.distanceFromOriginal; //Math.round (Math.min(smallHeightGrowthBonus, smallWidthGrowthBonus));
                scoreData.score += smallGrowthBonus;
                debugString += " ** Small 1d growth (+" + smallGrowthBonus + ") ";
            }
        }

        if (!scoreData.baseRect) {
            scoreData.baseRect = rect;
        }
        else if (scoreData.prevDisplay === "inline" && numChildren === 1) {
            // We don't want to use inline for width comparisons, because it stops when text stops
            // Use wrapper for inline's width as soon as we have that
            scoreData.baseRect = {
                height : scoreData.baseRect.height,
                width  : rect.width,
                top    : scoreData.baseRect.top,
                left   : scoreData.baseRect.left
            };
            debugString += "!! " + rect.width + " " + numChildren;
        }
        scoreData.prevDisplay = displayStyle;
        scoreData.prevTag = tag;
        scoreData.debugInfo.push("<" + current.localName + "> " + displayStyle + " (total " + scoreData.score + "): " + debugString);
        return scoreData;
    }

    /**
     * Check first rendered descendant element to see if it's a heading, etc.
     */
    static isSectionStartContainer(container:HTMLElement) {
        var child = container.firstChild;
        if (!child) {
            return false;
        }
        if (child.nodeType === 3 /* Text node */) {
            // Allow empty text node first
            var isEmpty = !(<any>child).data.match(/\S/);
            if (!isEmpty) {
                return false;
            }
            child = child.nextSibling;
            if (!child) {
                return false;
            }
        }

        if (child.nodeType !== 1 /* If not element node */) {
            return false;
        }
        if ($.inArray(child.localName, ReadableChunkFinder.kSectionStartTags) >= 0) {
            return true; // It's the start of a section (heading, etc.)
        }
        return isSectionStartContainer(<HTMLElement>child); // Recurse ... check next level of descendants
    }

    static isDirectParentOfVisibleTextContent(elt:HTMLElement):bool {
        var child = elt.firstChild;
        while (child) {
            if (isNonEmptyTextNode(child)) {
                return true;
            }
            child = child.nextSibling;
        }
        return false;
    }

    static isEmptyTextNode(node) : bool {
        return node && node.nodeType === 3 /* Text node */ && isEmptyString(node.data);
    }

    static isNonEmptyTextNode(node) : bool {
        return node && node.nodeType === 3 /* Text node */ && !isEmptyString(node.data);
    }

    static isEmptyString(str) : bool {
        return $.trim(str) === "";
    }

    static isAlone(current : HTMLElement) {
        var before = current.previousSibling;
        if (isEmptyTextNode(before)) {
            before = before.previousSibling;
        }
        if (before) {
            return false;
        }

        var after= current.nextSibling;
        if (isEmptyTextNode(after)) {
            after = after.nextSibling;
        }
        return after === null;
    }

    static isInlineOnOwnLine(inline : HTMLElement) {
        var before = inline.previousSibling;
        if (isEmptyTextNode(before)) {
            before = before.previousSibling;
        }
        if (before) {
            if (before.nodeType === 3 /* Text node */) {
                return false;
            }
            if (before.localName !== "br" && $.inArray($(before).css('display'), ["inline", "inline-block"]) >= 0) {
                return false;
            }
        }

        var after= inline.nextSibling;
        if (isEmptyTextNode(after)) {
            after = after.nextSibling;
        }
        if (after) {
            if (after.nodeType === 3 /* Text node */) {
                return false;
            }
            if (after.localName !== "br" && $.inArray($(after).css('display'), ["inline", "inline-block"]) >= 0) {
                return false;
            }
        }

        return true;
    }
}