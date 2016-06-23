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
    'page/positioner/util/element-info'
  ],
  function (
    $,
    elementMap,
    elementInfo
  ) {

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
      wordyOpts.doCloneTargetSubtree        = opts.subtree;
      // Do not clone @target
      wordyOpts.doExcludeTargetElement      = opts.excludeTarget;
      // An element's heredity structure is:
      // 1. The sibling elements of @target
      // 2. Each of @target's ancestor elements until the body, and all of their siblings
      wordyOpts.doCloneHeredityStructure    = opts.heredityStructure;
      // Insert @target into its clone's position in the heredity structure
      wordyOpts.doInsertTargetIntoCloneTree = opts.insertTargetIntoCloneTree;
      // Return a reference to the nearest ancestor clone of the target
      // That's probably where we want to insert our clone tree
      // We save a little work with this option, because we already need to find it when cloning heredityStructure from the body
      wordyOpts.doGetNearestAncestorClone   = opts.getNearestAncestorClone;

    if (wordyOpts.doCloneTargetSubtree) {
      resultWrapper.clone = cloneSubtree(target, wordyOpts);
    }
    else if (!wordyOpts.doExcludeTargetElement) {
      resultWrapper.clone = cloneElement(target, wordyOpts);
    }
    
    if (wordyOpts.doCloneHeredityStructure) {
      var results = cloneHeredityStructure(target, wordyOpts);
      resultWrapper.heredityStructure      = results.heredityStructure;
      // This could conceivably be undefined, but there aren't any code paths currently where that is true
      resultWrapper.nearestAncestorClone = results.nearestAncestorClone;
      return resultWrapper;
    }

    return resultWrapper.clone;
  }
    
  function cloneSubtree(element, opts) {
    var subtreeOpts = {
      deepClone: true,
      isRoot: opts.isRoot
    };

    // Clone @element's subtree inclusively
    if (!opts.doExcludeTargetElement) {
      return cloneElement(element, subtreeOpts);
    }

    //Clone just the element's children's subtrees, and return a document fragment containing them in order
    var
      fragment = document.createDocumentFragment(),
      children = Array.prototype.slice.call(element.children, 0),
      length   = children.length;

    subtreeOpts.isRoot    = false;
    subtreeOpts.superRoot = opts.superRoot || element;

    for (var i = 0; i < length; i++) {
      var child = children[i];
      fragment.appendChild(cloneElement(child, subtreeOpts));
    }

    return fragment;
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
      // Should we also clone the subtree of @element
      deepClone   = opts.deepClone,
      // If @element should be considered the root element for its subtree
      isRoot      = opts.isRoot,
      // The closest ancestor root of @element
      superRoot   = opts.superRoot,
      clone       = element.cloneNode(deepClone),
      $element    = $(element),
      $clone      = $(clone),
      traitFields = ['complement', 'isRoot'],
      traitValues = [clone, isRoot],
      tagName     = element.tagName.toLowerCase();

    switch (tagName) {
      // TODO: nested script elements are currently not being disabled. Not very common, and a little expensive to check for
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
    }

    if (superRoot) {
      elementInfo.isTransplantRoot(superRoot, true);
      if (isRoot) {
        elementInfo.addToSubroots(superRoot, element);
      }
    }

    if (deepClone) {
      var
        cloneSet    = $clone.find('*').get(),
        originalSet = $element.find('*').get();

      len = cloneSet.length;
      for (i = 0; i < len; i++) {
        var
          nestedClone    = cloneSet[i],
          nestedOriginal = originalSet[i];
        elementMap.setField(nestedOriginal, ['complement'], [nestedClone]);
        elementMap.setField(nestedClone, ['isClone', 'complement'], [true, nestedOriginal]);
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
      auxiliaryBody.style.visibility    = 'hidden';
      auxiliaryBody.style.transform     = 'none';
      auxiliaryBody.style.pointerEvents = '';
      auxiliaryBody.style.zIndex        = '99999999';
      docElem.appendChild(auxiliaryBody);
    }
    return auxiliaryBody;
  }

  function init() {
    docElem      = document.documentElement;
    originalBody = document.body;
    elementInfo.setAuxiliaryBody(getAuxiliaryBody());
  }

  clone.init             = init;
  clone.get              = getComplement;
  clone.getAuxiliaryBody = getAuxiliaryBody;

  return clone;
});