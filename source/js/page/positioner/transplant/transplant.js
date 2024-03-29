// The transplanter is responsible for moving original elements between the original and auxiliary bodies. Transplant operations only
// run once we've scaled the page for the first time.
define(
  [
    'page/positioner/util/element-map',
    'page/positioner/transplant/clone',
    'page/positioner/constants',
    'run/util/array-utility',
    'page/positioner/util/element-info',
    'page/positioner/transplant/graft',
    'page/positioner/transplant/anchors',
    'page/positioner/transplant/mutation-relay',
    'page/positioner/style-lock/style-listener/style-listener'
  ],
  function (
    elementMap,
    clone,
    constants,
    arrayUtil,
    elementInfo,
    graft,
    anchors,
    mutationRelay,
    styleListener
  ) {
  'use strict';

  var originalBody, elementQuerySelectorAll, documentQuerySelectorAll, getElementsByClassName,
    areQueriesFiltered = false,
    TRANSPLANT_STATE = constants.TRANSPLANT_STATE,
    ROOT_ATTR        = constants.ROOT_ATTR,
    ROOT_SELECTOR    = constants.ROOT_SELECTOR;

  // When we transplant elements into the auxiliary body, we need to re-direct queries in the original body to include
  // the original element's new position in the DOM tree, and to exclude clone elements in the heredity tree
  // TODO: If we ever drop IE11, use a Proxy intercept to accomplish this
  function filterDOMQueries() {
    areQueriesFiltered = true;

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
      var elements = Array.prototype.slice.call(getElementsByClassName.call(document, selector), 0);
      return elements.filter(elementInfo.isOriginal);
    }

    Document.prototype.querySelectorAll       = scDocumentQuerySelectorAll;
    Element.prototype.querySelectorAll        = scElementQuerySelectorAll;
    Document.prototype.getElementsByClassName = scGetElementsByClassName;
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
      hasDescendantPlaceholders = elementQuerySelectorAll.call(element, '.placeholder').length > 0,
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

    // Transplant iframes causes the content to reload, which is problematic for nested scripts
    if (element.localName === 'iframe') {
      return false;
    }

    var
      isFixed           = flags.isFixed,
      isInOriginalBody  = flags.isInOriginalBody,
      isInAuxBody       = !isInOriginalBody,
      isTransplantRoot  = flags.isTransplantRoot,
      isNestedElement   = !isTransplantRoot && isInAuxBody;

    // Basic transplant case, if an element is fixed then transplant the element
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
    // cached transplant information updated
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

  // If an element hasn't been cloned, we need to clone the rest of its heredity structure (which at a minimum is its own generation), insert the
  // root element into the node structure, and graft the structure to the element's closest clone ancestor
  function transplantUnclonedRoot(element) {
    var
      parent  = element.parentElement,
      sibling = element.nextSibling,
      insertionGroup  = clone.create(element, {
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
      rootClone       = clone.get(root) || clone.create(root);

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
        var insertionGroup = clone.create(subroot, {
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
      anchors.add(subroot);
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

  // Identifying a nested element as a transplant root doesn't require us to move the element's position in the DOM, we just need to update the
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
    var nestedPlaceholders = elementQuerySelectorAll.call(element, '.placeholder');
    for (var i = 0, placeholderCount = nestedPlaceholders.length; i < placeholderCount; i++) {
      var
        placeholder      = nestedPlaceholders[i],
        transplantedRoot = elementInfo.getPlaceholderOwner(placeholder),
        cloneParent      = transplantedRoot.parentElement,
        cloneSibling     = transplantedRoot.nextSibling,
        originalParent   = placeholder.parentElement,
        originalSibling  = placeholder.nextSibling,
        cloneRoot        = clone.get(transplantedRoot) || clone.create(transplantedRoot);

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

      anchors.remove(element);
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
      if (!areQueriesFiltered) {
        filterDOMQueries();
      }
      anchors.add(element);
    }
    else if (flags.wasTransplantAnchor) {
      anchors.remove(element);
    }

    if (flags.isTransplantRoot) {
      element.setAttribute(ROOT_ATTR, true);
      elementInfo.isTransplantRoot(element, true);
    }
    else if (flags.wasTransplantRoot) {
      element.removeAttribute(ROOT_ATTR);
      elementInfo.isTransplantRoot(element, false);
    }
  }

  function init() {
    getElementsByClassName   = Document.prototype.getElementsByClassName;
    elementQuerySelectorAll  = Element.prototype.querySelectorAll;
    documentQuerySelectorAll = Document.prototype.querySelectorAll;
    originalBody = document.body;
    anchors.init();
    clone.init();
    mutationRelay.init();
    graft.init();
    // We need to propagate visibility mutations to transplanted anchors
    // The reason we need to override the visibility of transplant anchors is that the clone body
    // has a `visibility: hidden` style applied to it, so that we don't see the rest of the heredity structure.
    // If the anchor is intended to be hidden we don't have to override the style, but if it or an ancestor's
    // visibility value mutates after the transplant has taken place we need to update its visibility accordingly
    styleListener.init(function () {
      var declaration = { property : 'visibility', value : 'hidden' };

      function onMutatedVisibility(opts) {
        var target             = opts.element,
            nestedPlaceholders = arrayUtil.from(elementQuerySelectorAll.call(target, '.placeholder'));
        anchors.propagateVisibilityMutation(nestedPlaceholders);
      }

      styleListener.registerToResolvedValueHandler(declaration, onMutatedVisibility);
      styleListener.registerFromResolvedValueHandler(declaration, onMutatedVisibility);
    });
  }

  return {
    evaluateCandidate: evaluateCandidate,
    performOperation: performOperation,
    postOperation: postOperation,
    init: init
  };
});
