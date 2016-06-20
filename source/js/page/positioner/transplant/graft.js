/*
* Graft
*
* The purpose of the graft module is to prevent 'transplant rejection', i.e. when a transplant root is replanted into the original body by an outside
* script. Graft attaches an observer to each transplant root's parent element, and listens for node removals. The handler then correctly
* returns the transplant root to its position in the auxiliary body.
*
* This is only an issue on inhomecare currently
* */
define(
  [
    'page/positioner/util/element-map',
    'page/positioner/util/element-info',
    'page/positioner/transplant/clone'
  ],
  function (
    elementMap,
    elementInfo,
    clone
  ) {

    'use strict';

    var originalBody, 
      rejectionListenerMap;

    //TODO: this should take domPosition
    function implantNodeStructure(element, parent, sibling) {
      if (sibling) {
        parent.insertBefore(element, sibling);
      }
      else {
        parent.appendChild(element);
      }
    }

    // This function listens for removed roots, if we haven't set a flag indicating we're replanting the root somewhere else in the DOM
    // it will return the root to the auxiliary body. If the root has been replanted to a new location in the original body
    // from where it was transplanted from, transplant it into the auxiliary body at the complementary position
    function onTransplantRejection(mutations) {

      function replantNode(node) {
        /* jshint validthis: true */
        var
          isRoot       = elementInfo.isTransplantRoot(node),
          wasReplanted = elementMap.flushField(node, 'wasReplanted');
        // If we didn't remove this root intentionally, it's been removed by another script and we need to re-implant it
        if (!wasReplanted && isRoot) {
          var
            newParent    = node.parentElement,
            inAuxBody    = newParent && !elementInfo.isInOriginalBody(newParent),
            cloneParent  = newParent && clone.get(newParent),
            newSibling   = node.nextSibling,
            cloneSibling = newSibling && clone.get(newSibling);
          
          if (!inAuxBody && newParent && !cloneParent) {
            var insertionGroup = clone(node, {
              heredityStructure: true,
              excludeTarget: true,
              getNearestAncestorClone: true,
              insertTargetIntoCloneTree: true
            });

            graftToAuxiliaryBody({
              root: node,
              insertionTarget: insertionGroup.heredityStructure,
              parent: insertionGroup.getNearestAncestorClone,
              handleTransplantRejection: true
            });
          }
          else if (!inAuxBody && cloneParent) {
            graftToAuxiliaryBody({
              root: node,
              parent: cloneParent,
              sibling: cloneSibling,
              handleTransplantRejection: true
            });
          }
          else if (inAuxBody) {
            graftToAuxiliaryBody({
              root: node,
              parent: newParent,
              sibling: newSibling,
              handleTransplantRejection: true
            });
          }
        }
        /* jshint validthis: false */
      }

      for (var i = 0, mutationCount = mutations.length; i < mutationCount; i++) {
        var
          mutation     = mutations[i],
          removedNodes = Array.prototype.slice.call(mutation.removedNodes, 0);
        removedNodes.forEach(replantNode, mutation);
      }
    }
    
    function disconnectRejectionListener(target) {
      rejectionListenerMap.get(target).disconnect();
    }
    
    function listenForTransplantRejection(target) {
      var observer = rejectionListenerMap.get(target);

      if (!observer) {
        observer = new MutationObserver(onTransplantRejection);
        rejectionListenerMap.set(target, observer);
      }
      else {
        observer.disconnect();
      }

      observer.observe(target.parentElement, {
        childList: true
      });
    }
    
    function graftToBody(opts) {
      var
        // The insertion target is either the root itself, or the top of its node structure
        insertionTarget = opts.insertionTarget || opts.root,
        root           = opts.root,
        sibling        = opts.sibling,
        parent         = opts.parent,
        hostBody       = opts.hostBody;
      elementInfo.setHostBody(root, hostBody);
      elementMap.setField(root, 'transplantParent', parent);
      elementMap.setField(root, 'transplantSibling', sibling);
      implantNodeStructure(insertionTarget, parent, sibling);
    }

    function graftToOriginalBody(opts) {
      opts.hostBody = originalBody;
      graftToBody(opts);
      disconnectRejectionListener(opts.root);
    }

    function graftToAuxiliaryBody(opts) {
      opts.hostBody = clone.getAuxiliaryBody();
      graftToBody(opts);
      if (opts.handleTransplantRejection) {
        listenForTransplantRejection(opts.root);
      }
    }

    function init() {
      originalBody = document.body;
      rejectionListenerMap = new WeakMap();
    }

    return {
      listenForTransplantRejection: listenForTransplantRejection,
      disconnectRejectionListener: disconnectRejectionListener,
      implantNodeStructure: implantNodeStructure,
      toAuxiliaryBody: graftToAuxiliaryBody,
      toOriginalBody: graftToOriginalBody,
      init: init
    };
});