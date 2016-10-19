/**
 * clone
 *
 * Can clone a generation, a subtree or an element
 * Does not need to copy element-map data because you will never have any for uncloned elements.
 *
 * TODO add ascii art comment
 */

define(
  [
    '$',
    'page/positioner/util/element-map',
    'page/positioner/util/element-info',
    'page/positioner/style-lock/style-lock',
    'page/positioner/constants',
    'page/viewport/viewport',
    'core/inline-style/inline-style'
  ],
  function (
    $,
    elementMap,
    elementInfo,
    styleLock,
    constants,
    viewport,
    inlineStyle
  ) {

  'use strict';

  var
    docElem,
    originalBody,
    auxiliaryBody;

  function clone(target, opts) {
    opts = opts || {};
    var
      resultWrapper = {},
      // Aliases for the shorter options names at the call site
      wordyOpts     = {};
      // Is @target a transplant root
      // We cache this information in the element map for each element in its subtree
      wordyOpts.isRoot                      = opts.isRoot;
      // Defined if @target is nested in the subtree of an ancestor transplant root
      wordyOpts.superRoot                   = opts.superRoot;
      // Do not clone @target
      wordyOpts.doExcludeTargetElement      = opts.excludeTarget;
      // An element's heredity structure is:
      // 1. The sibling elements of @target
      // 2. Each of @target's ancestor elements until the body, and all of their siblings
      wordyOpts.doCloneHeredityStructure    = opts.heredityStructure;
      // Insert @target into its clone's position in the heredity structure
      wordyOpts.doInsertTargetIntoCloneTree = opts.insertTargetIntoCloneTree;
      // Return a reference to the nearest ancestor clone of the target
      // That's probably where we want to insert the heredity tree
      // We save a little work with this option, because we already need to find it when cloning heredityStructure from the body
      wordyOpts.doGetNearestAncestorClone   = opts.getNearestAncestorClone;

    if (!wordyOpts.doExcludeTargetElement) {
      resultWrapper.clone = cloneElement(target, wordyOpts);
    }
    
    if (wordyOpts.doCloneHeredityStructure) {
      var results = cloneHeredityStructure(target, wordyOpts);
      resultWrapper.heredityStructure    = results.heredityStructure;
      // This could conceivably be undefined, but there aren't any code paths currently where that is true
      resultWrapper.nearestAncestorClone = results.nearestAncestorClone;
      return resultWrapper;
    }

    return resultWrapper.clone;
  }

  // Clone all the children of each of the element's ancestors until the body, or until a generation that has already been cloned
  function cloneHeredityStructure(target, opts) {

    // Returns an array of all the clean ancestors until and including the first cloned ancestor or the original body
    function getAncestorsToWalk(element) {
      var isCloned,
        ancestor  = element,
        ancestors = [];

      do {
        ancestor = ancestor.parentElement;
        isCloned = Boolean(getComplement(ancestor));
        ancestors.push(ancestor);
      } while (!isCloned && ancestor !== originalBody);

      return ancestors;
    }

    var container, nearestAncestorClone,
      ancestorsToWalk       = getAncestorsToWalk(target),
      nearestClonedAncestor = ancestorsToWalk[ancestorsToWalk.length - 1],
      ancestorCount         = ancestorsToWalk.length,
      originalInChain       = target,
      // As an optimization we can insert the target into the clone heredityStructure, typically because we are trying to insert a fixed element
      // into the auxiliary body with the clone heredityStructure in place to catch inherited styles
      cloneInChain          = opts.doInsertTargetIntoCloneTree ? target : cloneElement(target);

    for (var i = 0; i < ancestorCount; i++) {
      var ancestorClone,
        ancestor           = ancestorsToWalk[i],
        children           = Array.prototype.slice.call(ancestor.children, 0),
        generationFragment = document.createDocumentFragment(),
        isAncestorCloned   = ancestor === nearestClonedAncestor,
        childrenCount      = children.length;

      if (isAncestorCloned) {
        ancestorClone = ancestor === originalBody ? getAuxiliaryBody() : getComplement(ancestor);
        nearestAncestorClone = ancestorClone;
      }
      else {
        ancestorClone = cloneElement(ancestor);
      }

      for (var j = 0; j < childrenCount; j++) {
        var originalChild = children[j];
        // We've already cloned this child, because in the previous iteration we cloned
        // and appended its children to it, so now we just need to append the existing clone
        if (originalChild === originalInChain) {
          generationFragment.appendChild(cloneInChain);
        }
        else {
          generationFragment.appendChild(cloneElement(originalChild));
        }
      }

      if (isAncestorCloned) {
        container = generationFragment;
      }
      else {
        // If the ancestor is newly cloned, we know that the clone isn't inserted into the document
        ancestorClone.appendChild(generationFragment);
      }

      originalInChain = ancestor;
      cloneInChain    = ancestorClone;
    }

    var results = {
      heredityStructure: container
    };

    if (opts.doGetNearestAncestorClone) {
      results.nearestAncestorClone = nearestAncestorClone;
    }
    return results;
  }

  function cloneElement(element, opts) {
    opts = opts || {};

    var len, i,
      // If @element should be considered the root element for its subtree
      isRoot      = opts.isRoot,
      // The closest ancestor root of @element
      superRoot   = opts.superRoot,
      clone       = element.cloneNode(),
      $element    = $(element),
      $clone      = $(clone),
      traitFields = ['complement', 'isRoot'],
      traitValues = [clone, isRoot],
      tagName     = element.localName;

    switch (tagName) {
      case 'script':
        // This prevents clone script tags from running when we insert them into the DOM
        clone.type = 'application/json';
        break;

      case 'video':
        // This prevents clone video elements from playing
        clone.pause();
        clone.src = '';
        clone.load();
        break;

      case 'link':
        // Don't reload link tags
        clone.href = '';
        break;
    }

    if (superRoot) {
      elementInfo.isTransplantRoot(superRoot, true);
      if (isRoot) {
        elementInfo.addToSubroots(superRoot, element);
      }
    }

    //Currently this doesn't allow for the sitecues badge to be cloned, that creates some bad behavior
    //This maintains the structure / order of the cloned subtree, but it won't interfere with selectors
    //TODO: Figure out how to remove these elements completely from the clone set, and still retain 1 to 1 mapping to the original set
    var $badgeClone = $clone.find('#sitecues-badge');
    if ($badgeClone.get().length) {
      var
        $sitecuesCloneSet = $badgeClone.find('*').addBack(),
        sitecuesSet       = $sitecuesCloneSet.add($element.find('#sitecues-badge').find('*').addBack()).get();
      len = sitecuesSet.length;
      for (i = 0; i < len; i++) {
        elementMap.setField(sitecuesSet[i],
          ['complement', 'isClone'],
          [null, null]
        );
      }
      $sitecuesCloneSet.attr('id', '').attr('class', '');
    }

    // Remove attributes tied to styles we're applying to anchor elements
    clone.removeAttribute(constants.ROOT_ATTR);
    clone.removeAttribute(constants.ANCHOR_ATTR);
    // Remove all the style-locks from the clone element
    styleLock.unlockStyle(clone);

    elementMap.setField(element, traitFields, traitValues);
    elementMap.setField(clone, ['isClone', 'complement'], [true, element]);
    return clone;
  }

  // Returns the clone of an original element, or the original element of a clone
  function getComplement(element) {
    return elementMap.getField(element, 'complement');
  }

  function getAuxiliaryBody() {
    if (!auxiliaryBody) {
      auxiliaryBody = cloneElement(originalBody);
      // Removes position lock from clone
      styleLock.unlockStyle(auxiliaryBody);

      var bodyStyle = inlineStyle(auxiliaryBody);
      // Strange bug, don't really understand it, but visible elements nested in hidden elements don't show up as
      // expected when the original body has overflowY set to scroll (reproduces on Desire To Learn)
      bodyStyle.visibility               = getComputedStyle(originalBody).overflowY === 'scroll' ? '' : 'hidden';
      bodyStyle.transform                = 'none';
      bodyStyle.pointerEvents            = '';
      bodyStyle.position                 = 'absolute';
      bodyStyle.top                      = 0;
      bodyStyle.height                   = viewport.getInnerHeight();
      bodyStyle.width                    = viewport.getInnerWidth();
      docElem.appendChild(auxiliaryBody);
    }
    return auxiliaryBody;
  }

  function init() {
    docElem      = document.documentElement;
    originalBody = document.body;
  }

  clone.init             = init;
  clone.get              = getComplement;
  clone.getAuxiliaryBody = getAuxiliaryBody;

  return clone;
});