// The transplanter is responsible for moving original elements between the original and auxiliary bodies. Transplant operations only
// run once we've scaled the page for the first time.
define(
  [
    '$',
    'core/platform',
    'page/positioner/util/element-map',
    'page/positioner/transplant/clone',
    'page/positioner/constants',
    'core/bp/helper',
    'page/positioner/util/array-utility',
    'page/positioner/util/element-info',
    'page/positioner/transplant/graft'
  ],
  function (
    $,
    platform,
    elementMap,
    clone,
    constants,
    helper,
    arrayUtil,
    elementInfo,
    graft
  ) {

  'use strict';

  var originalBody, elementQuerySelectorAll, documentQuerySelectorAll, getElementsByClassName,
    transplantAnchors      = [],
    addAnchorHandlers      = [],
    removeAnchorHandlers   = [],
    TRANSPLANT_STATE       = constants.TRANSPLANT_STATE,
    ORIGINAL_STYLESHEET_ID = 'sitecues-js-originals',
    ROOT_ATTR              = constants.ROOT_ATTR,
    ROOT_SELECTOR          = constants.ROOT_SELECTOR;

  // When we transplant elements into the auxiliary body, we need to re-direct queries in the original body to include
  // the original element's new position in the DOM tree
  function rerouteDOMQueries() {
    getElementsByClassName   = Document.prototype.getElementsByClassName;
    elementQuerySelectorAll  = Element.prototype.querySelectorAll;
    documentQuerySelectorAll = Document.prototype.querySelectorAll;

    function scElementQuerySelectorAll(selector) {
      /*jshint validthis: true */
      var complement = clone.get(this);
      if (complement) {
        var
          auxResults      = elementQuerySelectorAll.call(complement, selector),
          originalResults = elementQuerySelectorAll.call(this, selector),
          results         = arrayUtil.union(auxResults, originalResults);
        return results.filter(elementInfo.isOriginal);
      }
      return elementQuerySelectorAll.call(this, selector);
      /*jshint validthis: false */
    }

    function scDocumentQuerySelectorAll(selector) {
      var elements = Array.prototype.slice.call(documentQuerySelectorAll.call(document, selector), 0);
      return elements.filter(elementInfo.isOriginal);
    }

    // NOTE: this will break scripts that rely on getElementsByClassName to be a live list!
    function scGetElementsByClassName(selector) {
      var elements  = Array.prototype.slice.call(getElementsByClassName.call(document, selector), 0);
      return elements.filter(elementInfo.isOriginal);
    }

    Document.prototype.querySelectorAll       = scDocumentQuerySelectorAll;
    Element.prototype.querySelectorAll        = scElementQuerySelectorAll;
    Document.prototype.getElementsByClassName = scGetElementsByClassName;
  }
  
  // Uncommonly, a fixed element will not have a top/bottom vertical position style applied. In this case
  // the element is rendered in the normal flow of the document. When we transplant the element
  // into the auxiliary body, we need to recreate the normal flow by explicitly specifying its intended vertical
  // position
  function fixVerticalPosition(element) {
    var inlinePosition,
      rect = helper.getRect(element),
      // In firefox the computed style of an element returns the used position values rather than 'auto'
      // if the style is unspecified on a fixed element. Applying a 'static' position allows us to
      // distinguish specified values from used values.
      doUnpositionElement = platform.browser.isFirefox;

    if (doUnpositionElement) {
      inlinePosition = element.style.position;
      element.style.position = 'static';
    }

    var
      style  = getComputedStyle(element),
      top    = parseFloat(style.top),
      bottom = parseFloat(style.bottom);

    // If there isn't a vertical position specified, we need to explicitly specify the used top value so that the
    // intended position is maintained when we transplant the fixed element
    if (Number.isNaN(top) && Number.isNaN(bottom)) {
      var topOffset,
        usedTop           = rect.top,
        marginTop         = parseFloat(style.marginTop),
        bodyStyle         = getComputedStyle(originalBody),
        bodyHeight        = parseFloat(bodyStyle.height),
        isBodyTransformed = bodyStyle.transform !== 'none';

      if (!Number.isNaN(marginTop)) {
        var isPercent = style.marginTop.indexOf('%') >= 0;
        // If the original body has been transformed, the fixed element's containing block is the body
        // rather than the initial container (the viewport). In the case where the specified margin top
        // is a percentage value, we need to consider the element's current containing block
        if (isPercent && isBodyTransformed) {
          marginTop = (marginTop / 100) * bodyHeight;
        }
        else if (isPercent) {
          marginTop = (marginTop / 100) * window.innerHeight;
        }
        usedTop -= marginTop;
      }
      // we need to account for the distance we've scrolled when the fixed element
      // is positioned relative to the body instead of the viewport
      topOffset = isBodyTransformed ? usedTop + window.pageYOffset : usedTop;

      element.style.top = topOffset;
    }

    if (doUnpositionElement) {
      element.style.position = inlinePosition;
    }
  }

  // Returns falsey if there isn't a root in the element's ancestor chain
  function getClosestRoot(element) {
    var
      ancestor           = element.parentElement,
      cloneBody          = clone.get(originalBody),
      doesCloneBodyExist = Boolean(cloneBody);

    function elementIsBody(element) {
      var isOriginalBody = element === originalBody;
      if (doesCloneBodyExist) {
        return isOriginalBody || element === cloneBody;
      }
      return isOriginalBody;
    }

    while (ancestor && !elementIsBody(ancestor)) {
      if (elementInfo.isTransplantRoot(ancestor)) {
        return ancestor;
      }
      ancestor = ancestor.parentElement;
    }
  }
  
  function insertPlaceholder(element, parent, sibling) {
  
    function createPlaceholder(element) {
      var placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      elementMap.setField(element, 'placeholder', placeholder);
      elementMap.setField(placeholder, 'placeholderFor', element);
      return placeholder;
    }
  
    var placeholder = elementInfo.getPlaceholder(element) || createPlaceholder(element);
    graft.implantNodeStructure(placeholder, parent, sibling);
  }

  function evaluateTransplantState(element) {
    var
      hasDescendantPlaceholders = element.querySelectorAll('.placeholder').length > 0,
      isCloned                  = Boolean(clone.get(element)),
      isTransplantRoot          = elementInfo.isTransplantRoot(element),
      isNested                  = Boolean(getClosestRoot(element));

    if (isNested) {
      return isTransplantRoot ? TRANSPLANT_STATE.NESTED_ROOT : TRANSPLANT_STATE.NESTED;
    }

    if (hasDescendantPlaceholders) {
      return TRANSPLANT_STATE.MIXED;
    }
    
    if (isTransplantRoot) {
      return TRANSPLANT_STATE.ROOT;
    }

    return isCloned ? TRANSPLANT_STATE.CLONED : TRANSPLANT_STATE.UNCLONED;
  }
    
  function doRunTransplantOperation(element, flags) {
    // We never want Sitecues elements to be transplant roots
    if (elementInfo.isSitecuesElement(element)) {
      return false;
    }

    var
      isFixed           = flags.isFixed,
      isInOriginalBody  = flags.isInOriginalBody,
      isInAuxBody       = !isInOriginalBody,
      isTransplantRoot  = flags.isTransplantRoot,
      isNestedElement   = !isTransplantRoot && isInAuxBody;

    // Basic transplant case, if an element is fixed or absolute with elevated z-index, transplant the element
    if (isInOriginalBody && isFixed) {
      return true;
    }

    // Anchor roots need to be positioned, otherwise they should be replanted into the original body
    // Nested roots that no longer need to be transplanted if their anchor root is re-planted should have their
    // cached transplant information (subroots, etc.) updated
    if (isTransplantRoot && !isFixed) {
      return true;
    }

    // Nested elements that need to be transplanted if their anchor root is re-planted should have their
    // cached transplant information updated and be protected from transplant rejection (see graft module)
    if (isNestedElement && isFixed) {
      return true;
    }
  }

  function evaluateCandidate(element, flags) {
    var results = { flags: flags };
    if (doRunTransplantOperation(element, flags)) {
      results.transplantState = evaluateTransplantState(element);
      return results;
    }
  }
  
  function prepareCandidate(element, opts) {
    // If the element has been previously transplanted, we've already checked its vertical positioning
    // and applied a top value if necessary
    if (!elementInfo.hasBeenTransplanted()) {
      fixVerticalPosition(element);
    }

    opts.didPrepareTransplant = true;
  }

  // If an element hasn't been cloned, we need to clone the rest of its heredity structure (which at a minimum is its own generation), insert the
  // root element into the node structure, and graft the structure to the element's closest clone ancestor
  function transplantUnclonedRoot(element) {
    var
      parent  = element.parentElement,
      sibling = element.nextSibling,
      insertionGroup  = clone(element, {
        // The inheritance tree for an element is all of the children of each of its ancestors up to and including the body's children.
        // Each child's subtree is not cloned. Its likely that part of this element's inheritance tree has already been cloned and
        // inserted into the auxiliary body, in which case we clone the remainder of the tree and insert it in the appropriate place
        heredityStructure: true,
        excludeTarget: true,
        getNearestAncestorClone: true,
        insertTargetIntoCloneTree: true
      });

    graft.toAuxiliaryBody({
      root: element,
      // Accepts either an element or a document fragment
      insertionTarget: insertionGroup.heredityStructure,
      parent: insertionGroup.nearestAncestorClone,
      handleTransplantRejection: true
    });

    insertPlaceholder(element, parent, sibling);
  }

  function transplantClonedRoot(element) {
    var
      parent       = element.parentElement,
      sibling      = element.nextSibling,
      cloneEl      = clone.get(element),
      cloneParent  = cloneEl.parentElement,
      cloneSibling = cloneEl.nextSibling;

    cloneEl.remove();

    graft.toAuxiliaryBody({
      root: element,
      parent: cloneParent,
      sibling: cloneSibling,
      handleTransplantRejection: true
    });

    insertPlaceholder(element, parent, sibling);
  }

  // A transplant root is 'anchoring' if it is not nested in the subtree of an ancestor transplant root. It 'anchors' all of the elements
  // in its subtree to remain implanted in the auxiliary body. If, for example, a nested transplant root became unpositioned, it would not
  // be replanted into the original body because of the anchoring root above it. 
  // When we replant an anchoring transplant root, we have to implant each of its subroots into the auxiliary body as new anchor roots.
  function replantAnchorRoot(root, opts) {
    var cloneParent, cloneSibling,
      placeholder     = opts.placeholder || elementInfo.getPlaceholder(root),
      originalParent  = placeholder.parentElement,
      originalSibling = placeholder.nextSibling,
      subroots        = elementInfo.getSubroots(),
      // It's important that we clone the root if it hasn't already been cloned, otherwise nested roots might not find a cloned original ancestor
      // in the auxiliary body. We can then insert the heredity trees of each of the nested roots into this clone, and then finally insert this clone
      // into its complement's position in the auxiliary body.
      rootClone       = clone.get(root) || clone(root);

    for (var i = 0, subrootCount = subroots.length; i < subrootCount; i++) {
      var
        subroot        = subroots[i],
        subrootParent  = subroot.parentElement,
        subrootSibling = subroot.nextSibling,
        subrootClone   = clone.get(subroot);

      // If the subroot is already cloned, we know that its complete heredity tree is already built
      if (subrootClone) {
        cloneParent  = subrootClone.parentElement;
        cloneSibling = subrootClone.nextSibling;

        graft.toAuxiliaryBody({
          root: subroot,
          parent: cloneParent,
          sibling: cloneSibling
        });
      }
      else {
        var insertionGroup = clone(subroot, {
          heredityStructure: true,
          excludeTarget: true,
          getNearestAncestorClone: true,
          insertTargetIntoCloneTree: true
        });

        graft.toAuxiliaryBody({
          root: subroot,
          // Accepts either an element or a document fragment
          insertionTarget: insertionGroup.heredityStructure,
          parent: insertionGroup.nearestAncestorClone
        });
      }
      addTransplantAnchor(subroot);
      elementMap.setField(subroot, 'wasReplanted', true);
      elementInfo.setRoot(subroot, null);
      insertPlaceholder(subroot, subrootParent, subrootSibling);
    }

    elementInfo.clearSubroots(root);
    graft.implantNodeStructure(rootClone, root.parentElement, root.nextSibling);
    placeholder.remove();
    graft.toOriginalBody({
      root: root,
      parent: originalParent,
      sibling: originalSibling
    });
  }

  // Transplant roots that are nested in the subtree of an anchor root do not need to be replanted when they no longer qualify as roots.
  // We just need to re-direct its subroot's root reference to its super root, and add its subroot references to the super root's subroots
  function removeNestedRoot(root) {
    var
      subroots  = elementInfo.getSubroots(root),
      superRoot = elementInfo.getRoot(root);

    subroots.forEach(function (subroot) {
      elementInfo.setRoot(subroot, superRoot);
    });

    graft.disconnectRejectionListener(root);
    elementInfo.removeSubroots(superRoot, root);
    elementInfo.clearSubroots(root);
    elementInfo.addSubroots(superRoot, subroots);
  }

  // Identifying a nested element as a transplant root doesn't require us to move the element's position in the DOM, we just need to set the
  // cached transplant information
  function addNestedRoot(element) {
    var
      superRoot       = getClosestRoot(element),
      siblingSubroots = elementInfo.getSubroots(superRoot),
      deepSubroots    = Array.prototype.slice.call(element.querySelectorAll(ROOT_SELECTOR), 0),
      directSubroots  = arrayUtil.intersection(deepSubroots, siblingSubroots);

    directSubroots.forEach(function (subroot) {
      elementInfo.setRoot(subroot, element);
    });

    graft.listenForTransplantRejection(element);
    elementInfo.setRoot(element, superRoot);
    elementInfo.setSubroots(element, directSubroots);
    elementInfo.removeSubroots(superRoot, directSubroots);
    elementInfo.addSubroots(superRoot, element);
  }

  // Elements in the original body may have placeholder elements in their subtree
  // Before we transplant @element, we need to return the transplanted subroots to @element's subtree
  function unifyMixedSubtree(element) {
    var nestedPlaceholders = element.querySelectorAll('.placeholder');
    for (var i = 0, placeholderCount = nestedPlaceholders.length; i < placeholderCount; i++) {
      var
        placeholder      = nestedPlaceholders[i],
        transplantedRoot = elementInfo.getPlaceholderOwner(placeholder),
        cloneParent      = transplantedRoot.parentElement,
        cloneSibling     = transplantedRoot.nextSibling,
        originalParent   = placeholder.parentElement,
        originalSibling  = placeholder.nextSibling,
        cloneRoot        = clone.get(transplantedRoot) || clone(transplantedRoot);

      transplantedRoot.remove();
      placeholder.remove();

      // Technically we're replanting this into the original body right now, but its anchoring root will be transplanted
      // to the auxiliary body after this operation so the cached information should describe this element has being implanted in
      // the auxiliary body
      graft.toAuxiliaryBody({
        root: transplantedRoot,
        parent: originalParent,
        sibling: originalSibling
      });

      // This portion of the heredity tree will be removed from the DOM when we transplant the anchor root, but it's important that we keep the
      // heredity body intact so that we can rely on its structure if we have to replant the anchor root
      graft.implantNodeStructure(cloneRoot, cloneParent, cloneSibling);

      removeTransplantAnchor(element);
      elementInfo.addSubroots(element, transplantedRoot);
      elementInfo.setRoot(transplantedRoot, element);
      elementMap.setField(transplantedRoot, 'wasReplanted', true);
    }
  }
    
  function performOperation(element, opts) {
    var
      status          = TRANSPLANT_STATE,
      flags           = opts.flags,
      transplantState = opts.transplantState;

    flags.wasTransplantRoot   = flags.isTransplantRoot;
    flags.wasTransplantAnchor = flags.isTransplantAnchor;

    switch (transplantState) {
      case status.UNCLONED:
        transplantUnclonedRoot(element, opts);
        flags.isTransplantAnchor = true;
        flags.isTransplantRoot   = true;
        flags.isInOriginalBody   = false;
        break;

      case status.MIXED:
        unifyMixedSubtree(element);
        transplantClonedRoot(element, opts);
        flags.isTransplantAnchor = true;
        flags.isTransplantRoot   = true;
        flags.isInOriginalBody   = false;
        break;

      case status.CLONED:
        transplantClonedRoot(element, opts);
        flags.isTransplantAnchor = true;
        flags.isTransplantRoot   = true;
        flags.isInOriginalBody   = false;
        break;

      case status.ROOT:
        replantAnchorRoot(element, opts);
        flags.isTransplantRoot   = false;
        flags.isTransplantAnchor = false;
        flags.isInOriginalBody   = true;
        break;

      case status.NESTED_ROOT:
        removeNestedRoot(element);
        flags.isTransplantRoot = false;
        break;

      case status.NESTED:
        addNestedRoot(element);
        flags.isTransplantRoot = true;
        break;
    }
  }
    
  function postOperation(element, args) {
    var flags = args.flags;

    if (flags.isTransplantAnchor) {
      if (!elementQuerySelectorAll) {
        rerouteDOMQueries();
      }
      addTransplantAnchor(element);
    }
    else if (flags.wasTransplantAnchor) {
      removeTransplantAnchor(element);
    }

    if (flags.isTransplantRoot) {
      element.setAttribute(ROOT_ATTR, 'root');
      elementInfo.isTransplantRoot(element, true);
    }
    else if (flags.wasTransplantRoot) {
      element.setAttribute(ROOT_ATTR, '');
      elementInfo.isTransplantRoot(element, false);
    }
  }

  function insertStylesheet() {
    var $style,
      rootDeclarationBlock = ' { visibility: visible; }\n';

    $style = $('<style>');
    $style
      .attr('id', ORIGINAL_STYLESHEET_ID)
      .text( ROOT_SELECTOR + rootDeclarationBlock )
      .insertBefore(document.head.firstChild);
  }

  function registerAddAnchorHandler(fn) {
    addAnchorHandlers.push(fn);
  }

  function registerRemoveAnchorHandler(fn) {
    removeAnchorHandlers.push(fn);
  }

  function addTransplantAnchor(element) {
    transplantAnchors.push(element);
    addAnchorHandlers.forEach(function (fn) {
      fn.call(element);
    });
  }

  function removeTransplantAnchor(element) {
    var index = transplantAnchors.indexOf(element);
    if (index >= 0) {
      transplantAnchors.splice(index, 1);
      removeAnchorHandlers.forEach(function (fn) {
        fn.call(element);
      });
    }
  }
  
  function getTransplantAnchors() {
    return transplantAnchors;
  }

  function init() {
    originalBody = document.body;
    insertStylesheet();
    clone.init();
    graft.init();
  }

  return {
    evaluateCandidate: evaluateCandidate,
    prepareCandidate: prepareCandidate,
    performOperation: performOperation,
    postOperation: postOperation,
    getAnchors: getTransplantAnchors,
    registerAddAnchorHandler: registerAddAnchorHandler,
    registerRemoveAnchorHandler: registerRemoveAnchorHandler,
    init: init
  };
});