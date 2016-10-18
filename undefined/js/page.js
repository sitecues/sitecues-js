"use strict";

// Custom build of jQuery
// How we do it:
// 1. Visit http://projects.jga.me/jquery-builder/
// 2. Remove everything except CSS
// - or -
// Follow jquery custom build instructions and do:
// grunt custom:-ajax,-core/ready,-css/showHide,-deferred,-deprecated,-dimensions,-effects,-event/alias,-event/focusin,-event/trigger,-offset,-sizzle,-wrap,-exports
// Replace the final block of code with the custom code at the bottom marked as SITECUES CUSTOM CODE
/*!
 * jQuery JavaScript Library v3.0.0 -ajax,-ajax/jsonp,-ajax/load,-ajax/parseXML,-ajax/script,-ajax/var/location,-ajax/var/nonce,-ajax/var/rquery,-ajax/xhr,-manipulation/_evalUrl,-event/ajax,-core/ready,-css/showHide,-effects,-effects/Tween,-effects/animatedSelector,-deferred,-deferred/exceptionHook,-queue,-queue/delay,-deprecated,-dimensions,-event/alias,-event/focusin,-event/trigger,-offset,-css/hiddenVisibleSelectors,-wrap,-exports,-exports/amd
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2016-06-10T12:56Z
 */
/*
* !!! NOTE: !!!
*
* When updating jQuery, we need to ensure that our custom code blocks overwriting global references (setTimeout/JSON)
* are copied to the new version
*
* */
!function(global, factory) {
  if ("object" === typeof module && "object" === typeof module.exports) {
    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get jQuery.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    // This accentuates the need for the creation of a real `window`.
    // e.g. var jQuery = require("jquery")(window);
    // See ticket #14549 for more info.
    module.exports = global.document ? factory(global, true) : function(w) {
      if (!w.document) {
        throw new Error("jQuery requires a window with a document");
      }
      return factory(w);
    };
  } else {
    factory(global);
  }
}("undefined" !== typeof window ? window : this, function(window, noGlobal) {
  function cacheSetTimeoutReference() {
    return sitecues._shared.nativeGlobal.setTimeout;
  }
  function cacheJSONReference() {
    return sitecues._shared.nativeGlobal.JSON;
  }
  var arr = [];
  var document = window.document;
  var setTimeout = cacheSetTimeoutReference();
  var JSON = cacheJSONReference();
  var getProto = Object.getPrototypeOf;
  var slice = arr.slice;
  var concat = arr.concat;
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};
  function DOMEval(code, doc) {
    doc = doc || document;
    var script = doc.createElement("script");
    script.text = code;
    doc.head.appendChild(script).parentNode.removeChild(script);
  }
  var version = "3.0.0", // Define a local copy of jQuery
  jQuery = function(selector, context) {
    // The jQuery object is actually just the init constructor 'enhanced'
    // Need init if jQuery is called (just allow error to be thrown if not included)
    return new jQuery.fn.init(selector, context);
  }, // Support: Android <=4.0 only
  // Make sure we trim BOM and NBSP
  rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, // Matches dashed string for camelizing
  rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g, // Used by jQuery.camelCase as callback to replace()
  fcamelCase = function(all, letter) {
    return letter.toUpperCase();
  };
  jQuery.fn = jQuery.prototype = {
    // The current version of jQuery being used
    jquery: version,
    constructor: jQuery,
    // The default length of a jQuery object is 0
    length: 0,
    toArray: function() {
      return slice.call(this);
    },
    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function(num) {
      // Return just the one element from the set
      // Return all the elements in a clean array
      return null != num ? num < 0 ? this[num + this.length] : this[num] : slice.call(this);
    },
    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function(elems) {
      // Build a new jQuery matched element set
      var ret = jQuery.merge(this.constructor(), elems);
      // Add the old object onto the stack (as a reference)
      ret.prevObject = this;
      // Return the newly-formed element set
      return ret;
    },
    // Execute a callback for every element in the matched set.
    each: function(callback) {
      return jQuery.each(this, callback);
    },
    map: function(callback) {
      return this.pushStack(jQuery.map(this, function(elem, i) {
        return callback.call(elem, i, elem);
      }));
    },
    slice: function() {
      return this.pushStack(slice.apply(this, arguments));
    },
    first: function() {
      return this.eq(0);
    },
    last: function() {
      return this.eq(-1);
    },
    eq: function(i) {
      var len = this.length, j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [ this[j] ] : []);
    },
    end: function() {
      return this.prevObject || this.constructor();
    },
    // For internal use only.
    // Behaves like an Array's method, not like a jQuery method.
    push: push,
    sort: arr.sort,
    splice: arr.splice
  };
  jQuery.extend = jQuery.fn.extend = function() {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
    // Handle a deep copy situation
    if ("boolean" === typeof target) {
      deep = target;
      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }
    // Handle case when target is a string or something (possible in deep copy)
    if ("object" !== typeof target && !jQuery.isFunction(target)) {
      target = {};
    }
    // Extend jQuery itself if only one argument is passed
    if (i === length) {
      target = this;
      i--;
    }
    for (;i < length; i++) {
      // Only deal with non-null/undefined values
      if (null != (options = arguments[i])) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];
          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }
          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && jQuery.isArray(src) ? src : [];
            } else {
              clone = src && jQuery.isPlainObject(src) ? src : {};
            }
            // Never move original objects, clone them
            target[name] = jQuery.extend(deep, clone, copy);
          } else {
            if (void 0 !== copy) {
              target[name] = copy;
            }
          }
        }
      }
    }
    // Return the modified object
    return target;
  };
  jQuery.extend({
    // Unique for each copy of jQuery on the page
    expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
    // Assume jQuery is ready without the ready module
    isReady: true,
    error: function(msg) {
      throw new Error(msg);
    },
    noop: function() {},
    isFunction: function(obj) {
      return "function" === jQuery.type(obj);
    },
    isArray: Array.isArray,
    isWindow: function(obj) {
      return null != obj && obj === obj.window;
    },
    isNumeric: function(obj) {
      // As of jQuery 3.0, isNumeric is limited to
      // strings and numbers (primitives or objects)
      // that can be coerced to finite numbers (gh-2662)
      var type = jQuery.type(obj);
      // parseFloat NaNs numeric-cast false positives ("")
      // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
      // subtraction forces infinities to NaN
      return ("number" === type || "string" === type) && !isNaN(obj - parseFloat(obj));
    },
    isPlainObject: function(obj) {
      var proto, Ctor;
      // Detect obvious negatives
      // Use toString instead of jQuery.type to catch host objects
      if (!obj || "[object Object]" !== toString.call(obj)) {
        return false;
      }
      proto = getProto(obj);
      // Objects with no prototype (e.g., `Object.create( null )`) are plain
      if (!proto) {
        return true;
      }
      // Objects with prototype are plain iff they were constructed by a global Object function
      Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
      return "function" === typeof Ctor && fnToString.call(Ctor) === ObjectFunctionString;
    },
    isEmptyObject: function(obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },
    type: function(obj) {
      if (null == obj) {
        return obj + "";
      }
      // Support: Android <=2.3 only (functionish RegExp)
      return "object" === typeof obj || "function" === typeof obj ? class2type[toString.call(obj)] || "object" : typeof obj;
    },
    // Evaluates a script in a global context
    globalEval: function(code) {
      DOMEval(code);
    },
    // Convert dashed to camelCase; used by the css and data modules
    // Support: IE <=9 - 11, Edge 12 - 13
    // Microsoft forgot to hump their vendor prefix (#9572)
    camelCase: function(string) {
      return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
    },
    nodeName: function(elem, name) {
      return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    },
    each: function(obj, callback) {
      var length, i = 0;
      if (isArrayLike(obj)) {
        length = obj.length;
        for (;i < length; i++) {
          if (false === callback.call(obj[i], i, obj[i])) {
            break;
          }
        }
      } else {
        for (i in obj) {
          if (false === callback.call(obj[i], i, obj[i])) {
            break;
          }
        }
      }
      return obj;
    },
    // Support: Android <=4.0 only
    trim: function(text) {
      return null == text ? "" : (text + "").replace(rtrim, "");
    },
    // results is for internal usage only
    makeArray: function(arr, results) {
      var ret = results || [];
      if (null != arr) {
        if (isArrayLike(Object(arr))) {
          jQuery.merge(ret, "string" === typeof arr ? [ arr ] : arr);
        } else {
          push.call(ret, arr);
        }
      }
      return ret;
    },
    inArray: function(elem, arr, i) {
      return null == arr ? -1 : indexOf.call(arr, elem, i);
    },
    // Support: Android <=4.0 only, PhantomJS 1 only
    // push.apply(_, arraylike) throws on ancient WebKit
    merge: function(first, second) {
      var len = +second.length, j = 0, i = first.length;
      for (;j < len; j++) {
        first[i++] = second[j];
      }
      first.length = i;
      return first;
    },
    grep: function(elems, callback, invert) {
      var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
      // Go through the array, only saving the items
      // that pass the validator function
      for (;i < length; i++) {
        callbackInverse = !callback(elems[i], i);
        if (callbackInverse !== callbackExpect) {
          matches.push(elems[i]);
        }
      }
      return matches;
    },
    // arg is for internal usage only
    map: function(elems, callback, arg) {
      var length, value, i = 0, ret = [];
      // Go through the array, translating each of the items to their new values
      if (isArrayLike(elems)) {
        length = elems.length;
        for (;i < length; i++) {
          value = callback(elems[i], i, arg);
          if (null != value) {
            ret.push(value);
          }
        }
      } else {
        for (i in elems) {
          value = callback(elems[i], i, arg);
          if (null != value) {
            ret.push(value);
          }
        }
      }
      // Flatten any nested arrays
      return concat.apply([], ret);
    },
    // A global GUID counter for objects
    guid: 1,
    // Bind a function to a context, optionally partially applying any
    // arguments.
    proxy: function(fn, context) {
      var tmp, args, proxy;
      if ("string" === typeof context) {
        tmp = fn[context];
        context = fn;
        fn = tmp;
      }
      // Quick check to determine if target is callable, in the spec
      // this throws a TypeError, but we will just return undefined.
      if (!jQuery.isFunction(fn)) {
        return;
      }
      // Simulated bind
      args = slice.call(arguments, 2);
      proxy = function() {
        return fn.apply(context || this, args.concat(slice.call(arguments)));
      };
      // Set the guid of unique handler to the same of original handler, so it can be removed
      proxy.guid = fn.guid = fn.guid || jQuery.guid++;
      return proxy;
    },
    now: Date.now,
    // jQuery.support is not used in Core but other projects attach their
    // properties to it so it needs to exist.
    support: support
  });
  // JSHint would error on this code due to the Symbol not being defined in ES5.
  // Defining this global in .jshintrc would create a danger of using the global
  // unguarded in another place, it seems safer to just disable JSHint for these
  // three lines.
  /* jshint ignore: start */
  if ("function" === typeof Symbol) {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
  }
  /* jshint ignore: end */
  // Populate the class2type map
  jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
  });
  function isArrayLike(obj) {
    // Support: real iOS 8.2 only (not reproducible in simulator)
    // `in` check used to prevent JIT error (gh-2145)
    // hasOwn isn't used here due to false negatives
    // regarding Nodelist length in IE
    var length = !!obj && "length" in obj && obj.length, type = jQuery.type(obj);
    if ("function" === type || jQuery.isWindow(obj)) {
      return false;
    }
    return "array" === type || 0 === length || "number" === typeof length && length > 0 && length - 1 in obj;
  }
  var documentElement = document.documentElement;
  /*
   * Optional (non-Sizzle) selector module for custom builds.
   *
   * Note that this DOES NOT SUPPORT many documented jQuery
   * features in exchange for its smaller size:
   *
   * Attribute not equal selector
   * Positional selectors (:first; :eq(n); :odd; etc.)
   * Type selectors (:input; :checkbox; :button; etc.)
   * State-based selectors (:animated; :visible; :hidden; etc.)
   * :has(selector)
   * :not(complex selector)
   * custom selectors via Sizzle extensions
   * Leading combinators (e.g., $collection.find("> *"))
   * Reliable functionality on XML fragments
   * Requiring all parts of a selector to match elements under context
   *   (e.g., $div.find("div > *") now matches children of $div)
   * Matching against non-elements
   * Reliable sorting of disconnected nodes
   * querySelectorAll bug fixes (e.g., unreliable :focus on WebKit)
   *
   * If any of these are unacceptable tradeoffs, either use Sizzle or
   * customize this stub for the project's specific needs.
   */
  var hasDuplicate, sortInput, sortStable = jQuery.expando.split("").sort(sortOrder).join("") === jQuery.expando, matches = documentElement.matches || documentElement.webkitMatchesSelector || documentElement.mozMatchesSelector || documentElement.oMatchesSelector || documentElement.msMatchesSelector, // CSS string/identifier serialization
  // https://drafts.csswg.org/cssom/#common-serializing-idioms
  rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g, fcssescape = function(ch, asCodePoint) {
    if (asCodePoint) {
      // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
      if ("\0" === ch) {
        return "�";
      }
      // Control characters and (dependent upon position) numbers get escaped as code points
      return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
    }
    // Other potentially-special ASCII characters get backslash-escaped
    return "\\" + ch;
  };
  function sortOrder(a, b) {
    // Flag for duplicate removal
    if (a === b) {
      hasDuplicate = true;
      return 0;
    }
    // Sort on method existence if only one input has compareDocumentPosition
    var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
    if (compare) {
      return compare;
    }
    // Calculate position if both inputs belong to the same document
    compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : // Otherwise we know they are disconnected
    1;
    // Disconnected nodes
    if (1 & compare) {
      // Choose the first element that is related to our preferred document
      if (a === document || a.ownerDocument === document && jQuery.contains(document, a)) {
        return -1;
      }
      if (b === document || b.ownerDocument === document && jQuery.contains(document, b)) {
        return 1;
      }
      // Maintain original order
      return sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
    }
    return 4 & compare ? -1 : 1;
  }
  function uniqueSort(results) {
    var elem, duplicates = [], j = 0, i = 0;
    hasDuplicate = false;
    sortInput = !sortStable && results.slice(0);
    results.sort(sortOrder);
    if (hasDuplicate) {
      while (elem = results[i++]) {
        if (elem === results[i]) {
          j = duplicates.push(i);
        }
      }
      while (j--) {
        results.splice(duplicates[j], 1);
      }
    }
    // Clear input after sorting to release objects
    // See https://github.com/jquery/sizzle/pull/225
    sortInput = null;
    return results;
  }
  function escape(sel) {
    return (sel + "").replace(rcssescape, fcssescape);
  }
  jQuery.extend({
    uniqueSort: uniqueSort,
    unique: uniqueSort,
    escapeSelector: escape,
    find: function(selector, context, results, seed) {
      var elem, nodeType, i = 0;
      results = results || [];
      context = context || document;
      // Same basic safeguard as Sizzle
      if (!selector || "string" !== typeof selector) {
        return results;
      }
      // Early return if context is not an element or document
      if (1 !== (nodeType = context.nodeType) && 9 !== nodeType) {
        return [];
      }
      if (seed) {
        while (elem = seed[i++]) {
          if (jQuery.find.matchesSelector(elem, selector)) {
            results.push(elem);
          }
        }
      } else {
        jQuery.merge(results, context.querySelectorAll(selector));
      }
      return results;
    },
    text: function(elem) {
      var node, ret = "", i = 0, nodeType = elem.nodeType;
      if (!nodeType) {
        // If no nodeType, this is expected to be an array
        while (node = elem[i++]) {
          // Do not traverse comment nodes
          ret += jQuery.text(node);
        }
      } else {
        if (1 === nodeType || 9 === nodeType || 11 === nodeType) {
          // Use textContent for elements
          return elem.textContent;
        } else {
          if (3 === nodeType || 4 === nodeType) {
            return elem.nodeValue;
          }
        }
      }
      // Do not include comment or processing instruction nodes
      return ret;
    },
    contains: function(a, b) {
      var adown = 9 === a.nodeType ? a.documentElement : a, bup = b && b.parentNode;
      return a === bup || !!(bup && 1 === bup.nodeType && adown.contains(bup));
    },
    isXMLDoc: function(elem) {
      // documentElement is verified for cases where it doesn't yet exist
      // (such as loading iframes in IE - #4833)
      var documentElement = elem && (elem.ownerDocument || elem).documentElement;
      return documentElement ? "HTML" !== documentElement.nodeName : false;
    },
    expr: {
      attrHandle: {},
      match: {
        bool: new RegExp("^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$", "i"),
        needsContext: /^[\x20\t\r\n\f]*[>+~]/
      }
    }
  });
  jQuery.extend(jQuery.find, {
    matches: function(expr, elements) {
      return jQuery.find(expr, null, null, elements);
    },
    matchesSelector: function(elem, expr) {
      return matches.call(elem, expr);
    },
    attr: function(elem, name) {
      var fn = jQuery.expr.attrHandle[name.toLowerCase()], // Don't get fooled by Object.prototype properties (jQuery #13807)
      value = fn && hasOwn.call(jQuery.expr.attrHandle, name.toLowerCase()) ? fn(elem, name, jQuery.isXMLDoc(elem)) : void 0;
      return void 0 !== value ? value : elem.getAttribute(name);
    }
  });
  var dir = function(elem, dir, until) {
    var matched = [], truncate = void 0 !== until;
    while ((elem = elem[dir]) && 9 !== elem.nodeType) {
      if (1 === elem.nodeType) {
        if (truncate && jQuery(elem).is(until)) {
          break;
        }
        matched.push(elem);
      }
    }
    return matched;
  };
  var siblings = function(n, elem) {
    var matched = [];
    for (;n; n = n.nextSibling) {
      if (1 === n.nodeType && n !== elem) {
        matched.push(n);
      }
    }
    return matched;
  };
  var rneedsContext = jQuery.expr.match.needsContext;
  var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
  var risSimple = /^.[^:#\[\.,]*$/;
  // Implement the identical functionality for filter and not
  function winnow(elements, qualifier, not) {
    if (jQuery.isFunction(qualifier)) {
      return jQuery.grep(elements, function(elem, i) {
        /* jshint -W018 */
        return !!qualifier.call(elem, i, elem) !== not;
      });
    }
    if (qualifier.nodeType) {
      return jQuery.grep(elements, function(elem) {
        return elem === qualifier !== not;
      });
    }
    if ("string" === typeof qualifier) {
      if (risSimple.test(qualifier)) {
        return jQuery.filter(qualifier, elements, not);
      }
      qualifier = jQuery.filter(qualifier, elements);
    }
    return jQuery.grep(elements, function(elem) {
      return indexOf.call(qualifier, elem) > -1 !== not && 1 === elem.nodeType;
    });
  }
  jQuery.filter = function(expr, elems, not) {
    var elem = elems[0];
    if (not) {
      expr = ":not(" + expr + ")";
    }
    return 1 === elems.length && 1 === elem.nodeType ? jQuery.find.matchesSelector(elem, expr) ? [ elem ] : [] : jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
      return 1 === elem.nodeType;
    }));
  };
  jQuery.fn.extend({
    find: function(selector) {
      var i, ret, len = this.length, self = this;
      if ("string" !== typeof selector) {
        return this.pushStack(jQuery(selector).filter(function() {
          for (i = 0; i < len; i++) {
            if (jQuery.contains(self[i], this)) {
              return true;
            }
          }
        }));
      }
      ret = this.pushStack([]);
      for (i = 0; i < len; i++) {
        jQuery.find(selector, self[i], ret);
      }
      return len > 1 ? jQuery.uniqueSort(ret) : ret;
    },
    filter: function(selector) {
      return this.pushStack(winnow(this, selector || [], false));
    },
    not: function(selector) {
      return this.pushStack(winnow(this, selector || [], true));
    },
    is: function(selector) {
      // If this is a positional/relative selector, check membership in the returned set
      // so $("p:first").is("p:last") won't return true for a doc with two "p".
      return !!winnow(this, "string" === typeof selector && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
    }
  });
  // Initialize a jQuery object
  // A central reference to the root jQuery(document)
  var rootjQuery, // A simple way to check for HTML strings
  // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
  // Strict HTML recognition (#11290: must start with <)
  // Shortcut simple #id case for speed
  rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery.fn.init = function(selector, context, root) {
    var match, elem;
    // HANDLE: $(""), $(null), $(undefined), $(false)
    if (!selector) {
      return this;
    }
    // Method init() accepts an alternate rootjQuery
    // so migrate can support jQuery.sub (gh-2101)
    root = root || rootjQuery;
    // Handle HTML strings
    if ("string" === typeof selector) {
      if ("<" === selector[0] && ">" === selector[selector.length - 1] && selector.length >= 3) {
        // Assume that strings that start and end with <> are HTML and skip the regex check
        match = [ null, selector, null ];
      } else {
        match = rquickExpr.exec(selector);
      }
      // Match html or make sure no context is specified for #id
      if (match && (match[1] || !context)) {
        // HANDLE: $(html) -> $(array)
        if (match[1]) {
          context = context instanceof jQuery ? context[0] : context;
          // Option to run scripts is true for back-compat
          // Intentionally let the error be thrown if parseHTML is not present
          jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
          // HANDLE: $(html, props)
          if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
            for (match in context) {
              // Properties of context are called as methods if possible
              if (jQuery.isFunction(this[match])) {
                this[match](context[match]);
              } else {
                this.attr(match, context[match]);
              }
            }
          }
          return this;
        } else {
          elem = document.getElementById(match[2]);
          if (elem) {
            // Inject the element directly into the jQuery object
            this[0] = elem;
            this.length = 1;
          }
          return this;
        }
      } else {
        if (!context || context.jquery) {
          return (context || root).find(selector);
        } else {
          return this.constructor(context).find(selector);
        }
      }
    } else {
      if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this;
      } else {
        if (jQuery.isFunction(selector)) {
          // Execute immediately if ready is not present
          return void 0 !== root.ready ? root.ready(selector) : selector(jQuery);
        }
      }
    }
    return jQuery.makeArray(selector, this);
  };
  // Give the init function the jQuery prototype for later instantiation
  init.prototype = jQuery.fn;
  // Initialize central reference
  rootjQuery = jQuery(document);
  var rparentsprev = /^(?:parents|prev(?:Until|All))/, // Methods guaranteed to produce a unique set when starting from a unique set
  guaranteedUnique = {
    children: true,
    contents: true,
    next: true,
    prev: true
  };
  jQuery.fn.extend({
    has: function(target) {
      var targets = jQuery(target, this), l = targets.length;
      return this.filter(function() {
        var i = 0;
        for (;i < l; i++) {
          if (jQuery.contains(this, targets[i])) {
            return true;
          }
        }
      });
    },
    closest: function(selectors, context) {
      var cur, i = 0, l = this.length, matched = [], targets = "string" !== typeof selectors && jQuery(selectors);
      // Positional selectors never match, since there's no _selection_ context
      if (!rneedsContext.test(selectors)) {
        for (;i < l; i++) {
          for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
            // Always skip document fragments
            if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : // Don't pass non-elements to Sizzle
            1 === cur.nodeType && jQuery.find.matchesSelector(cur, selectors))) {
              matched.push(cur);
              break;
            }
          }
        }
      }
      return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
    },
    // Determine the position of an element within the set
    index: function(elem) {
      // No argument, return index in parent
      if (!elem) {
        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      }
      // Index in selector
      if ("string" === typeof elem) {
        return indexOf.call(jQuery(elem), this[0]);
      }
      // Locate the position of the desired element
      // If it receives a jQuery object, the first element is used
      return indexOf.call(this, elem.jquery ? elem[0] : elem);
    },
    add: function(selector, context) {
      return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
    },
    addBack: function(selector) {
      return this.add(null == selector ? this.prevObject : this.prevObject.filter(selector));
    }
  });
  function sibling(cur, dir) {
    while ((cur = cur[dir]) && 1 !== cur.nodeType) {}
    return cur;
  }
  jQuery.each({
    parent: function(elem) {
      var parent = elem.parentNode;
      return parent && 11 !== parent.nodeType ? parent : null;
    },
    parents: function(elem) {
      return dir(elem, "parentNode");
    },
    parentsUntil: function(elem, i, until) {
      return dir(elem, "parentNode", until);
    },
    next: function(elem) {
      return sibling(elem, "nextSibling");
    },
    prev: function(elem) {
      return sibling(elem, "previousSibling");
    },
    nextAll: function(elem) {
      return dir(elem, "nextSibling");
    },
    prevAll: function(elem) {
      return dir(elem, "previousSibling");
    },
    nextUntil: function(elem, i, until) {
      return dir(elem, "nextSibling", until);
    },
    prevUntil: function(elem, i, until) {
      return dir(elem, "previousSibling", until);
    },
    siblings: function(elem) {
      return siblings((elem.parentNode || {}).firstChild, elem);
    },
    children: function(elem) {
      return siblings(elem.firstChild);
    },
    contents: function(elem) {
      return elem.contentDocument || jQuery.merge([], elem.childNodes);
    }
  }, function(name, fn) {
    jQuery.fn[name] = function(until, selector) {
      var matched = jQuery.map(this, fn, until);
      if ("Until" !== name.slice(-5)) {
        selector = until;
      }
      if (selector && "string" === typeof selector) {
        matched = jQuery.filter(selector, matched);
      }
      if (this.length > 1) {
        // Remove duplicates
        if (!guaranteedUnique[name]) {
          jQuery.uniqueSort(matched);
        }
        // Reverse order for parents* and prev-derivatives
        if (rparentsprev.test(name)) {
          matched.reverse();
        }
      }
      return this.pushStack(matched);
    };
  });
  var rnotwhite = /\S+/g;
  // Convert String-formatted options into Object-formatted ones
  function createOptions(options) {
    var object = {};
    jQuery.each(options.match(rnotwhite) || [], function(_, flag) {
      object[flag] = true;
    });
    return object;
  }
  /*
   * Create a callback list using the following parameters:
   *
   *	options: an optional list of space-separated options that will change how
   *			the callback list behaves or a more traditional option object
   *
   * By default a callback list will act like an event callback list and can be
   * "fired" multiple times.
   *
   * Possible options:
   *
   *	once:			will ensure the callback list can only be fired once (like a Deferred)
   *
   *	memory:			will keep track of previous values and will call any callback added
   *					after the list has been fired right away with the latest "memorized"
   *					values (like a Deferred)
   *
   *	unique:			will ensure a callback can only be added once (no duplicate in the list)
   *
   *	stopOnFalse:	interrupt callings when a callback returns false
   *
   */
  jQuery.Callbacks = function(options) {
    // Convert options from String-formatted to Object-formatted if needed
    // (we check in cache first)
    options = "string" === typeof options ? createOptions(options) : jQuery.extend({}, options);
    var // Flag to know if list is currently firing
    firing, // Last fire value for non-forgettable lists
    memory, // Flag to know if list was already fired
    fired, // Flag to prevent firing
    locked, // Actual callback list
    list = [], // Queue of execution data for repeatable lists
    queue = [], // Index of currently firing callback (modified by add/remove as needed)
    firingIndex = -1, // Fire callbacks
    fire = function() {
      // Enforce single-firing
      locked = options.once;
      // Execute callbacks for all pending executions,
      // respecting firingIndex overrides and runtime changes
      fired = firing = true;
      for (;queue.length; firingIndex = -1) {
        memory = queue.shift();
        while (++firingIndex < list.length) {
          // Run callback and check for early termination
          if (false === list[firingIndex].apply(memory[0], memory[1]) && options.stopOnFalse) {
            // Jump to end and forget the data so .add doesn't re-fire
            firingIndex = list.length;
            memory = false;
          }
        }
      }
      // Forget the data if we're done with it
      if (!options.memory) {
        memory = false;
      }
      firing = false;
      // Clean up if we're done firing for good
      if (locked) {
        // Keep an empty list if we have data for future add calls
        if (memory) {
          list = [];
        } else {
          list = "";
        }
      }
    }, // Actual Callbacks object
    self = {
      // Add a callback or a collection of callbacks to the list
      add: function() {
        if (list) {
          // If we have memory from a past run, we should fire after adding
          if (memory && !firing) {
            firingIndex = list.length - 1;
            queue.push(memory);
          }
          !function add(args) {
            jQuery.each(args, function(_, arg) {
              if (jQuery.isFunction(arg)) {
                if (!options.unique || !self.has(arg)) {
                  list.push(arg);
                }
              } else {
                if (arg && arg.length && "string" !== jQuery.type(arg)) {
                  // Inspect recursively
                  add(arg);
                }
              }
            });
          }(arguments);
          if (memory && !firing) {
            fire();
          }
        }
        return this;
      },
      // Remove a callback from the list
      remove: function() {
        jQuery.each(arguments, function(_, arg) {
          var index;
          while ((index = jQuery.inArray(arg, list, index)) > -1) {
            list.splice(index, 1);
            // Handle firing indexes
            if (index <= firingIndex) {
              firingIndex--;
            }
          }
        });
        return this;
      },
      // Check if a given callback is in the list.
      // If no argument is given, return whether or not list has callbacks attached.
      has: function(fn) {
        return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
      },
      // Remove all callbacks from the list
      empty: function() {
        if (list) {
          list = [];
        }
        return this;
      },
      // Disable .fire and .add
      // Abort any current/pending executions
      // Clear all callbacks and values
      disable: function() {
        locked = queue = [];
        list = memory = "";
        return this;
      },
      disabled: function() {
        return !list;
      },
      // Disable .fire
      // Also disable .add unless we have memory (since it would have no effect)
      // Abort any pending executions
      lock: function() {
        locked = queue = [];
        if (!memory && !firing) {
          list = memory = "";
        }
        return this;
      },
      locked: function() {
        return !!locked;
      },
      // Call all callbacks with the given context and arguments
      fireWith: function(context, args) {
        if (!locked) {
          args = args || [];
          args = [ context, args.slice ? args.slice() : args ];
          queue.push(args);
          if (!firing) {
            fire();
          }
        }
        return this;
      },
      // Call all the callbacks with the given arguments
      fire: function() {
        self.fireWith(this, arguments);
        return this;
      },
      // To know if the callbacks have already been called at least once
      fired: function() {
        return !!fired;
      }
    };
    return self;
  };
  // Multifunctional method to get and set values of a collection
  // The value/s can optionally be executed if it's a function
  var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
    var i = 0, len = elems.length, bulk = null == key;
    // Sets many values
    if ("object" === jQuery.type(key)) {
      chainable = true;
      for (i in key) {
        access(elems, fn, i, key[i], true, emptyGet, raw);
      }
    } else {
      if (void 0 !== value) {
        chainable = true;
        if (!jQuery.isFunction(value)) {
          raw = true;
        }
        if (bulk) {
          // Bulk operations run against the entire set
          if (raw) {
            fn.call(elems, value);
            fn = null;
          } else {
            bulk = fn;
            fn = function(elem, key, value) {
              return bulk.call(jQuery(elem), value);
            };
          }
        }
        if (fn) {
          for (;i < len; i++) {
            fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
          }
        }
      }
    }
    // Gets
    return chainable ? elems : bulk ? fn.call(elems) : len ? fn(elems[0], key) : emptyGet;
  };
  var acceptData = function(owner) {
    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    /* jshint -W018 */
    return 1 === owner.nodeType || 9 === owner.nodeType || !+owner.nodeType;
  };
  function Data() {
    this.expando = jQuery.expando + Data.uid++;
  }
  Data.uid = 1;
  Data.prototype = {
    cache: function(owner) {
      // Check if the owner object already has a cache
      var value = owner[this.expando];
      // If not, create one
      if (!value) {
        value = {};
        // We can accept data for non-element nodes in modern browsers,
        // but we should not, see #8335.
        // Always return an empty object.
        if (acceptData(owner)) {
          // If it is a node unlikely to be stringify-ed or looped over
          // use plain assignment
          if (owner.nodeType) {
            owner[this.expando] = value;
          } else {
            Object.defineProperty(owner, this.expando, {
              value: value,
              configurable: true
            });
          }
        }
      }
      return value;
    },
    set: function(owner, data, value) {
      var prop, cache = this.cache(owner);
      // Handle: [ owner, key, value ] args
      // Always use camelCase key (gh-2257)
      if ("string" === typeof data) {
        cache[jQuery.camelCase(data)] = value;
      } else {
        // Copy the properties one-by-one to the cache object
        for (prop in data) {
          cache[jQuery.camelCase(prop)] = data[prop];
        }
      }
      return cache;
    },
    get: function(owner, key) {
      // Always use camelCase key (gh-2257)
      return void 0 === key ? this.cache(owner) : owner[this.expando] && owner[this.expando][jQuery.camelCase(key)];
    },
    access: function(owner, key, value) {
      // In cases where either:
      //
      //   1. No key was specified
      //   2. A string key was specified, but no value provided
      //
      // Take the "read" path and allow the get method to determine
      // which value to return, respectively either:
      //
      //   1. The entire cache object
      //   2. The data stored at the key
      //
      if (void 0 === key || key && "string" === typeof key && void 0 === value) {
        return this.get(owner, key);
      }
      // When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //
      this.set(owner, key, value);
      // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]
      return void 0 !== value ? value : key;
    },
    remove: function(owner, key) {
      var i, cache = owner[this.expando];
      if (void 0 === cache) {
        return;
      }
      if (void 0 !== key) {
        // Support array or space separated string of keys
        if (jQuery.isArray(key)) {
          // If key is an array of keys...
          // We always set camelCase keys, so remove that.
          key = key.map(jQuery.camelCase);
        } else {
          key = jQuery.camelCase(key);
          // If a key with the spaces exists, use it.
          // Otherwise, create an array by matching non-whitespace
          key = key in cache ? [ key ] : key.match(rnotwhite) || [];
        }
        i = key.length;
        while (i--) {
          delete cache[key[i]];
        }
      }
      // Remove the expando if there's no more data
      if (void 0 === key || jQuery.isEmptyObject(cache)) {
        // Support: Chrome <=35 - 45
        // Webkit & Blink performance suffers when deleting properties
        // from DOM nodes, so set to undefined instead
        // https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
        if (owner.nodeType) {
          owner[this.expando] = void 0;
        } else {
          delete owner[this.expando];
        }
      }
    },
    hasData: function(owner) {
      var cache = owner[this.expando];
      return void 0 !== cache && !jQuery.isEmptyObject(cache);
    }
  };
  var dataPriv = new Data();
  var dataUser = new Data();
  //	Implementation Summary
  //
  //	1. Enforce API surface and semantic compatibility with 1.9.x branch
  //	2. Improve the module's maintainability by reducing the storage
  //		paths to a single mechanism.
  //	3. Use the same single mechanism to support "private" and "user" data.
  //	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
  //	5. Avoid exposing implementation details on user objects (eg. expando properties)
  //	6. Provide a clear path for implementation upgrade to WeakMap in 2014
  var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
  function dataAttr(elem, key, data) {
    var name;
    // If nothing was found internally, try to fetch any
    // data from the HTML5 data-* attribute
    if (void 0 === data && 1 === elem.nodeType) {
      name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
      data = elem.getAttribute(name);
      if ("string" === typeof data) {
        try {
          data = "true" === data ? true : "false" === data ? false : "null" === data ? null : // Only convert to a number if it doesn't change the string
          +data + "" === data ? +data : rbrace.test(data) ? JSON.parse(data) : data;
        } catch (e) {}
        // Make sure we set the data so it isn't changed later
        dataUser.set(elem, key, data);
      } else {
        data = void 0;
      }
    }
    return data;
  }
  jQuery.extend({
    hasData: function(elem) {
      return dataUser.hasData(elem) || dataPriv.hasData(elem);
    },
    data: function(elem, name, data) {
      return dataUser.access(elem, name, data);
    },
    removeData: function(elem, name) {
      dataUser.remove(elem, name);
    },
    // TODO: Now that all calls to _data and _removeData have been replaced
    // with direct calls to dataPriv methods, these can be deprecated.
    _data: function(elem, name, data) {
      return dataPriv.access(elem, name, data);
    },
    _removeData: function(elem, name) {
      dataPriv.remove(elem, name);
    }
  });
  jQuery.fn.extend({
    data: function(key, value) {
      var i, name, data, elem = this[0], attrs = elem && elem.attributes;
      // Gets all values
      if (void 0 === key) {
        if (this.length) {
          data = dataUser.get(elem);
          if (1 === elem.nodeType && !dataPriv.get(elem, "hasDataAttrs")) {
            i = attrs.length;
            while (i--) {
              // Support: IE 11 only
              // The attrs elements can be null (#14894)
              if (attrs[i]) {
                name = attrs[i].name;
                if (0 === name.indexOf("data-")) {
                  name = jQuery.camelCase(name.slice(5));
                  dataAttr(elem, name, data[name]);
                }
              }
            }
            dataPriv.set(elem, "hasDataAttrs", true);
          }
        }
        return data;
      }
      // Sets multiple values
      if ("object" === typeof key) {
        return this.each(function() {
          dataUser.set(this, key);
        });
      }
      return access(this, function(value) {
        var data;
        // The calling jQuery object (element matches) is not empty
        // (and therefore has an element appears at this[ 0 ]) and the
        // `value` parameter was not undefined. An empty jQuery object
        // will result in `undefined` for elem = this[ 0 ] which will
        // throw an exception if an attempt to read a data cache is made.
        if (elem && void 0 === value) {
          // Attempt to get data from the cache
          // The key will always be camelCased in Data
          data = dataUser.get(elem, key);
          if (void 0 !== data) {
            return data;
          }
          // Attempt to "discover" the data in
          // HTML5 custom data-* attrs
          data = dataAttr(elem, key);
          if (void 0 !== data) {
            return data;
          }
          // We tried really hard, but the data doesn't exist.
          return;
        }
        // Set the data...
        this.each(function() {
          // We always store the camelCased key
          dataUser.set(this, key, value);
        });
      }, null, value, arguments.length > 1, null, true);
    },
    removeData: function(key) {
      return this.each(function() {
        dataUser.remove(this, key);
      });
    }
  });
  var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
  var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
  var cssExpand = [ "Top", "Right", "Bottom", "Left" ];
  var swap = function(elem, options, callback, args) {
    var ret, name, old = {};
    // Remember the old values, and insert the new ones
    for (name in options) {
      old[name] = elem.style[name];
      elem.style[name] = options[name];
    }
    ret = callback.apply(elem, args || []);
    // Revert the old values
    for (name in options) {
      elem.style[name] = old[name];
    }
    return ret;
  };
  function adjustCSS(elem, prop, valueParts, tween) {
    var adjusted, scale = 1, maxIterations = 20, currentValue = tween ? function() {
      return tween.cur();
    } : function() {
      return jQuery.css(elem, prop, "");
    }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"), // Starting value computation is required for potential unit mismatches
    initialInUnit = (jQuery.cssNumber[prop] || "px" !== unit && +initial) && rcssNum.exec(jQuery.css(elem, prop));
    if (initialInUnit && initialInUnit[3] !== unit) {
      // Trust units reported by jQuery.css
      unit = unit || initialInUnit[3];
      // Make sure we update the tween properties later on
      valueParts = valueParts || [];
      // Iteratively approximate from a nonzero starting point
      initialInUnit = +initial || 1;
      do {
        // If previous iteration zeroed out, double until we get *something*.
        // Use string for doubling so we don't accidentally see scale as unchanged below
        scale = scale || ".5";
        // Adjust and apply
        initialInUnit /= scale;
        jQuery.style(elem, prop, initialInUnit + unit);
      } while (scale !== (scale = currentValue() / initial) && 1 !== scale && --maxIterations);
    }
    if (valueParts) {
      initialInUnit = +initialInUnit || +initial || 0;
      // Apply relative offset (+=/-=) if specified
      adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
      if (tween) {
        tween.unit = unit;
        tween.start = initialInUnit;
        tween.end = adjusted;
      }
    }
    return adjusted;
  }
  var rcheckableType = /^(?:checkbox|radio)$/i;
  var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i;
  var rscriptType = /^$|\/(?:java|ecma)script/i;
  // We have to close these tags to support XHTML (#13200)
  var wrapMap = {
    // Support: IE <=9 only
    option: [ 1, "<select multiple='multiple'>", "</select>" ],
    // XHTML parsers do not magically insert elements in the
    // same way that tag soup parsers do. So we cannot shorten
    // this by omitting <tbody> or other required elements.
    thead: [ 1, "<table>", "</table>" ],
    col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
    tr: [ 2, "<table><tbody>", "</tbody></table>" ],
    td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
    _default: [ 0, "", "" ]
  };
  // Support: IE <=9 only
  wrapMap.optgroup = wrapMap.option;
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;
  function getAll(context, tag) {
    // Support: IE <=9 - 11 only
    // Use typeof to avoid zero-argument method invocation on host objects (#15151)
    var ret = "undefined" !== typeof context.getElementsByTagName ? context.getElementsByTagName(tag || "*") : "undefined" !== typeof context.querySelectorAll ? context.querySelectorAll(tag || "*") : [];
    return void 0 === tag || tag && jQuery.nodeName(context, tag) ? jQuery.merge([ context ], ret) : ret;
  }
  // Mark scripts as having already been evaluated
  function setGlobalEval(elems, refElements) {
    var i = 0, l = elems.length;
    for (;i < l; i++) {
      dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"));
    }
  }
  var rhtml = /<|&#?\w+;/;
  function buildFragment(elems, context, scripts, selection, ignored) {
    var elem, tmp, tag, wrap, contains, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
    for (;i < l; i++) {
      elem = elems[i];
      if (elem || 0 === elem) {
        // Add nodes directly
        if ("object" === jQuery.type(elem)) {
          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          jQuery.merge(nodes, elem.nodeType ? [ elem ] : elem);
        } else {
          if (!rhtml.test(elem)) {
            nodes.push(context.createTextNode(elem));
          } else {
            tmp = tmp || fragment.appendChild(context.createElement("div"));
            // Deserialize a standard representation
            tag = (rtagName.exec(elem) || [ "", "" ])[1].toLowerCase();
            wrap = wrapMap[tag] || wrapMap._default;
            tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
            // Descend through wrappers to the right content
            j = wrap[0];
            while (j--) {
              tmp = tmp.lastChild;
            }
            // Support: Android <=4.0 only, PhantomJS 1 only
            // push.apply(_, arraylike) throws on ancient WebKit
            jQuery.merge(nodes, tmp.childNodes);
            // Remember the top-level container
            tmp = fragment.firstChild;
            // Ensure the created nodes are orphaned (#12392)
            tmp.textContent = "";
          }
        }
      }
    }
    // Remove wrapper from fragment
    fragment.textContent = "";
    i = 0;
    while (elem = nodes[i++]) {
      // Skip elements already in the context collection (trac-4087)
      if (selection && jQuery.inArray(elem, selection) > -1) {
        if (ignored) {
          ignored.push(elem);
        }
        continue;
      }
      contains = jQuery.contains(elem.ownerDocument, elem);
      // Append to fragment
      tmp = getAll(fragment.appendChild(elem), "script");
      // Preserve script evaluation history
      if (contains) {
        setGlobalEval(tmp);
      }
      // Capture executables
      if (scripts) {
        j = 0;
        while (elem = tmp[j++]) {
          if (rscriptType.test(elem.type || "")) {
            scripts.push(elem);
          }
        }
      }
    }
    return fragment;
  }
  !function() {
    var fragment = document.createDocumentFragment(), div = fragment.appendChild(document.createElement("div")), input = document.createElement("input");
    // Support: Android 4.0 - 4.3 only
    // Check state lost if the name is set (#11217)
    // Support: Windows Web Apps (WWA)
    // `name` and `type` must use .setAttribute for WWA (#14901)
    input.setAttribute("type", "radio");
    input.setAttribute("checked", "checked");
    input.setAttribute("name", "t");
    div.appendChild(input);
    // Support: Android <=4.1 only
    // Older WebKit doesn't clone checked state correctly in fragments
    support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
    // Support: IE <=11 only
    // Make sure textarea (and checkbox) defaultValue is properly cloned
    div.innerHTML = "<textarea>x</textarea>";
    support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
  }();
  var rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/, rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }
  // Support: IE <=9 only
  // See #13393 for more info
  function safeActiveElement() {
    try {
      return document.activeElement;
    } catch (err) {}
  }
  function on(elem, types, selector, data, fn, one) {
    var origFn, type;
    // Types can be a map of types/handlers
    if ("object" === typeof types) {
      // ( types-Object, selector, data )
      if ("string" !== typeof selector) {
        // ( types-Object, data )
        data = data || selector;
        selector = void 0;
      }
      for (type in types) {
        on(elem, type, selector, data, types[type], one);
      }
      return elem;
    }
    if (null == data && null == fn) {
      // ( types, fn )
      fn = selector;
      data = selector = void 0;
    } else {
      if (null == fn) {
        if ("string" === typeof selector) {
          // ( types, selector, fn )
          fn = data;
          data = void 0;
        } else {
          // ( types, data, fn )
          fn = data;
          data = selector;
          selector = void 0;
        }
      }
    }
    if (false === fn) {
      fn = returnFalse;
    } else {
      if (!fn) {
        return elem;
      }
    }
    if (1 === one) {
      origFn = fn;
      fn = function(event) {
        // Can use an empty set, since event contains the info
        jQuery().off(event);
        return origFn.apply(this, arguments);
      };
      // Use same guid so caller can remove using origFn
      fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }
    return elem.each(function() {
      jQuery.event.add(this, types, fn, data, selector);
    });
  }
  /*
   * Helper functions for managing events -- not part of the public interface.
   * Props to Dean Edwards' addEvent library for many of the ideas.
   */
  jQuery.event = {
    global: {},
    add: function(elem, types, handler, data, selector) {
      var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
      // Don't attach events to noData or text/comment nodes (but allow plain objects)
      if (!elemData) {
        return;
      }
      // Caller can pass in an object of custom data in lieu of the handler
      if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      }
      // Ensure that invalid selectors throw exceptions at attach time
      // Evaluate against documentElement in case elem is a non-element node (e.g., document)
      if (selector) {
        jQuery.find.matchesSelector(documentElement, selector);
      }
      // Make sure that the handler has a unique ID, used to find/remove it later
      if (!handler.guid) {
        handler.guid = jQuery.guid++;
      }
      // Init the element's event structure and main handler, if this is the first
      if (!(events = elemData.events)) {
        events = elemData.events = {};
      }
      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function(e) {
          // Discard the second event of a jQuery.event.trigger() and
          // when an event is called after a page has unloaded
          return "undefined" !== typeof jQuery && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : void 0;
        };
      }
      // Handle multiple events separated by a space
      types = (types || "").match(rnotwhite) || [ "" ];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        // There *must* be a type, no attaching namespace-only handlers
        if (!type) {
          continue;
        }
        // If event changes its type, use the special event handlers for the changed type
        special = jQuery.event.special[type] || {};
        // If selector defined, determine special event api type, otherwise given type
        type = (selector ? special.delegateType : special.bindType) || type;
        // Update special based on newly reset type
        special = jQuery.event.special[type] || {};
        // handleObj is passed to all event handlers
        handleObj = jQuery.extend({
          type: type,
          origType: origType,
          data: data,
          handler: handler,
          guid: handler.guid,
          selector: selector,
          needsContext: selector && jQuery.expr.match.needsContext.test(selector),
          namespace: namespaces.join(".")
        }, handleObjIn);
        // Init the event handler queue if we're the first
        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0;
          // Only use addEventListener if the special events handler returns false
          if (!special.setup || false === special.setup.call(elem, data, namespaces, eventHandle)) {
            if (elem.addEventListener) {
              elem.addEventListener(type, eventHandle);
            }
          }
        }
        if (special.add) {
          special.add.call(elem, handleObj);
          if (!handleObj.handler.guid) {
            handleObj.handler.guid = handler.guid;
          }
        }
        // Add to the element's handler list, delegates in front
        if (selector) {
          handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
          handlers.push(handleObj);
        }
        // Keep track of which events have ever been used, for event optimization
        jQuery.event.global[type] = true;
      }
    },
    // Detach an event or set of events from an element
    remove: function(elem, types, handler, selector, mappedTypes) {
      var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
      if (!elemData || !(events = elemData.events)) {
        return;
      }
      // Once for each type.namespace in types; type may be omitted
      types = (types || "").match(rnotwhite) || [ "" ];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        // Unbind all events (on this namespace, if provided) for the element
        if (!type) {
          for (type in events) {
            jQuery.event.remove(elem, type + types[t], handler, selector, true);
          }
          continue;
        }
        special = jQuery.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        handlers = events[type] || [];
        tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
        // Remove matching events
        origCount = j = handlers.length;
        while (j--) {
          handleObj = handlers[j];
          if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || "**" === selector && handleObj.selector)) {
            handlers.splice(j, 1);
            if (handleObj.selector) {
              handlers.delegateCount--;
            }
            if (special.remove) {
              special.remove.call(elem, handleObj);
            }
          }
        }
        // Remove generic event handler if we removed something and no more handlers exist
        // (avoids potential for endless recursion during removal of special event handlers)
        if (origCount && !handlers.length) {
          if (!special.teardown || false === special.teardown.call(elem, namespaces, elemData.handle)) {
            jQuery.removeEvent(elem, type, elemData.handle);
          }
          delete events[type];
        }
      }
      // Remove data and the expando if it's no longer used
      if (jQuery.isEmptyObject(events)) {
        dataPriv.remove(elem, "handle events");
      }
    },
    dispatch: function(nativeEvent) {
      // Make a writable jQuery.Event from the native event object
      var event = jQuery.event.fix(nativeEvent);
      var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), handlers = (dataPriv.get(this, "events") || {})[event.type] || [], special = jQuery.event.special[event.type] || {};
      // Use the fix-ed jQuery.Event rather than the (read-only) native event
      args[0] = event;
      for (i = 1; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      event.delegateTarget = this;
      // Call the preDispatch hook for the mapped type, and let it bail if desired
      if (special.preDispatch && false === special.preDispatch.call(this, event)) {
        return;
      }
      // Determine handlers
      handlerQueue = jQuery.event.handlers.call(this, event, handlers);
      // Run delegates first; they may want to stop propagation beneath us
      i = 0;
      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;
        j = 0;
        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
          // Triggered event must either 1) have no namespace, or 2) have namespace(s)
          // a subset or equal to those in the bound event (both can have no namespace).
          if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;
            ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
            if (void 0 !== ret) {
              if (false === (event.result = ret)) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      }
      // Call the postDispatch hook for the mapped type
      if (special.postDispatch) {
        special.postDispatch.call(this, event);
      }
      return event.result;
    },
    handlers: function(event, handlers) {
      var i, matches, sel, handleObj, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
      // Support: IE <=9
      // Find delegate handlers
      // Black-hole SVG <use> instance trees (#13180)
      //
      // Support: Firefox <=42
      // Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
      if (delegateCount && cur.nodeType && ("click" !== event.type || isNaN(event.button) || event.button < 1)) {
        for (;cur !== this; cur = cur.parentNode || this) {
          // Don't check non-elements (#13208)
          // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
          if (1 === cur.nodeType && (true !== cur.disabled || "click" !== event.type)) {
            matches = [];
            for (i = 0; i < delegateCount; i++) {
              handleObj = handlers[i];
              // Don't conflict with Object.prototype properties (#13203)
              sel = handleObj.selector + " ";
              if (void 0 === matches[sel]) {
                matches[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [ cur ]).length;
              }
              if (matches[sel]) {
                matches.push(handleObj);
              }
            }
            if (matches.length) {
              handlerQueue.push({
                elem: cur,
                handlers: matches
              });
            }
          }
        }
      }
      // Add the remaining (directly-bound) handlers
      if (delegateCount < handlers.length) {
        handlerQueue.push({
          elem: this,
          handlers: handlers.slice(delegateCount)
        });
      }
      return handlerQueue;
    },
    addProp: function(name, hook) {
      Object.defineProperty(jQuery.Event.prototype, name, {
        enumerable: true,
        configurable: true,
        get: jQuery.isFunction(hook) ? function() {
          if (this.originalEvent) {
            return hook(this.originalEvent);
          }
        } : function() {
          if (this.originalEvent) {
            return this.originalEvent[name];
          }
        },
        set: function(value) {
          Object.defineProperty(this, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          });
        }
      });
    },
    fix: function(originalEvent) {
      return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
    },
    special: {
      load: {
        // Prevent triggered image.load events from bubbling to window.load
        noBubble: true
      },
      focus: {
        // Fire native event if possible so blur/focus sequence is correct
        trigger: function() {
          if (this !== safeActiveElement() && this.focus) {
            this.focus();
            return false;
          }
        },
        delegateType: "focusin"
      },
      blur: {
        trigger: function() {
          if (this === safeActiveElement() && this.blur) {
            this.blur();
            return false;
          }
        },
        delegateType: "focusout"
      },
      click: {
        // For checkbox, fire native event so checked state will be right
        trigger: function() {
          if ("checkbox" === this.type && this.click && jQuery.nodeName(this, "input")) {
            this.click();
            return false;
          }
        },
        // For cross-browser consistency, don't fire native .click() on links
        _default: function(event) {
          return jQuery.nodeName(event.target, "a");
        }
      },
      beforeunload: {
        postDispatch: function(event) {
          // Support: Firefox 20+
          // Firefox doesn't alert if the returnValue field is not set.
          if (void 0 !== event.result && event.originalEvent) {
            event.originalEvent.returnValue = event.result;
          }
        }
      }
    }
  };
  jQuery.removeEvent = function(elem, type, handle) {
    // This "if" is needed for plain objects
    if (elem.removeEventListener) {
      elem.removeEventListener(type, handle);
    }
  };
  jQuery.Event = function(src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof jQuery.Event)) {
      return new jQuery.Event(src, props);
    }
    // Event object
    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;
      // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.
      this.isDefaultPrevented = src.defaultPrevented || void 0 === src.defaultPrevented && // Support: Android <=2.3 only
      false === src.returnValue ? returnTrue : returnFalse;
      // Create target properties
      // Support: Safari <=6 - 7 only
      // Target should not be a text node (#504, #13143)
      this.target = src.target && 3 === src.target.nodeType ? src.target.parentNode : src.target;
      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget;
    } else {
      this.type = src;
    }
    // Put explicitly provided properties onto the event object
    if (props) {
      jQuery.extend(this, props);
    }
    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || jQuery.now();
    // Mark it as fixed
    this[jQuery.expando] = true;
  };
  // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
  // https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
  jQuery.Event.prototype = {
    constructor: jQuery.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    isSimulated: false,
    preventDefault: function() {
      var e = this.originalEvent;
      this.isDefaultPrevented = returnTrue;
      if (e && !this.isSimulated) {
        e.preventDefault();
      }
    },
    stopPropagation: function() {
      var e = this.originalEvent;
      this.isPropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function() {
      var e = this.originalEvent;
      this.isImmediatePropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopImmediatePropagation();
      }
      this.stopPropagation();
    }
  };
  // Includes all common event props including KeyEvent and MouseEvent specific props
  jQuery.each({
    altKey: true,
    bubbles: true,
    cancelable: true,
    changedTouches: true,
    ctrlKey: true,
    detail: true,
    eventPhase: true,
    metaKey: true,
    pageX: true,
    pageY: true,
    shiftKey: true,
    view: true,
    char: true,
    charCode: true,
    key: true,
    keyCode: true,
    button: true,
    buttons: true,
    clientX: true,
    clientY: true,
    offsetX: true,
    offsetY: true,
    pointerId: true,
    pointerType: true,
    screenX: true,
    screenY: true,
    targetTouches: true,
    toElement: true,
    touches: true,
    which: function(event) {
      var button = event.button;
      // Add which for key events
      if (null == event.which && rkeyEvent.test(event.type)) {
        return null != event.charCode ? event.charCode : event.keyCode;
      }
      // Add which for click: 1 === left; 2 === middle; 3 === right
      if (!event.which && void 0 !== button && rmouseEvent.test(event.type)) {
        return 1 & button ? 1 : 2 & button ? 3 : 4 & button ? 2 : 0;
      }
      return event.which;
    }
  }, jQuery.event.addProp);
  // Create mouseenter/leave events using mouseover/out and event-time checks
  // so that event delegation works in jQuery.
  // Do the same for pointerenter/pointerleave and pointerover/pointerout
  //
  // Support: Safari 7 only
  // Safari sends mouseenter too often; see:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=470258
  // for the description of the bug (it existed in older Chrome versions as well).
  jQuery.each({
    mouseenter: "mouseover",
    mouseleave: "mouseout",
    pointerenter: "pointerover",
    pointerleave: "pointerout"
  }, function(orig, fix) {
    jQuery.event.special[orig] = {
      delegateType: fix,
      bindType: fix,
      handle: function(event) {
        var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
        // For mouseenter/leave call the handler if related is outside the target.
        // NB: No relatedTarget if the mouse left/entered the browser window
        if (!related || related !== target && !jQuery.contains(target, related)) {
          event.type = handleObj.origType;
          ret = handleObj.handler.apply(this, arguments);
          event.type = fix;
        }
        return ret;
      }
    };
  });
  jQuery.fn.extend({
    on: function(types, selector, data, fn) {
      return on(this, types, selector, data, fn);
    },
    one: function(types, selector, data, fn) {
      return on(this, types, selector, data, fn, 1);
    },
    off: function(types, selector, fn) {
      var handleObj, type;
      if (types && types.preventDefault && types.handleObj) {
        // ( event )  dispatched jQuery.Event
        handleObj = types.handleObj;
        jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
        return this;
      }
      if ("object" === typeof types) {
        // ( types-object [, selector] )
        for (type in types) {
          this.off(type, selector, types[type]);
        }
        return this;
      }
      if (false === selector || "function" === typeof selector) {
        // ( types [, fn] )
        fn = selector;
        selector = void 0;
      }
      if (false === fn) {
        fn = returnFalse;
      }
      return this.each(function() {
        jQuery.event.remove(this, types, fn, selector);
      });
    }
  });
  var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi, // Support: IE <=10 - 11, Edge 12 - 13
  // In IE/Edge using regex groups here causes severe slowdowns.
  // See https://connect.microsoft.com/IE/feedback/details/1736512/
  rnoInnerhtml = /<script|<style|<link/i, // checked="checked" or checked
  rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rscriptTypeMasked = /^true\/(.*)/, rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
  function manipulationTarget(elem, content) {
    if (jQuery.nodeName(elem, "table") && jQuery.nodeName(11 !== content.nodeType ? content : content.firstChild, "tr")) {
      return elem.getElementsByTagName("tbody")[0] || elem;
    }
    return elem;
  }
  // Replace/restore the type attribute of script elements for safe DOM manipulation
  function disableScript(elem) {
    elem.type = (null !== elem.getAttribute("type")) + "/" + elem.type;
    return elem;
  }
  function restoreScript(elem) {
    var match = rscriptTypeMasked.exec(elem.type);
    if (match) {
      elem.type = match[1];
    } else {
      elem.removeAttribute("type");
    }
    return elem;
  }
  function cloneCopyEvent(src, dest) {
    var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
    if (1 !== dest.nodeType) {
      return;
    }
    // 1. Copy private data: events, handlers, etc.
    if (dataPriv.hasData(src)) {
      pdataOld = dataPriv.access(src);
      pdataCur = dataPriv.set(dest, pdataOld);
      events = pdataOld.events;
      if (events) {
        delete pdataCur.handle;
        pdataCur.events = {};
        for (type in events) {
          for (i = 0, l = events[type].length; i < l; i++) {
            jQuery.event.add(dest, type, events[type][i]);
          }
        }
      }
    }
    // 2. Copy user data
    if (dataUser.hasData(src)) {
      udataOld = dataUser.access(src);
      udataCur = jQuery.extend({}, udataOld);
      dataUser.set(dest, udataCur);
    }
  }
  // Fix IE bugs, see support tests
  function fixInput(src, dest) {
    var nodeName = dest.nodeName.toLowerCase();
    // Fails to persist the checked state of a cloned checkbox or radio button.
    if ("input" === nodeName && rcheckableType.test(src.type)) {
      dest.checked = src.checked;
    } else {
      if ("input" === nodeName || "textarea" === nodeName) {
        dest.defaultValue = src.defaultValue;
      }
    }
  }
  function domManip(collection, args, callback, ignored) {
    // Flatten any nested arrays
    args = concat.apply([], args);
    var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], isFunction = jQuery.isFunction(value);
    // We can't cloneNode fragments that contain checked, in WebKit
    if (isFunction || l > 1 && "string" === typeof value && !support.checkClone && rchecked.test(value)) {
      return collection.each(function(index) {
        var self = collection.eq(index);
        if (isFunction) {
          args[0] = value.call(this, index, self.html());
        }
        domManip(self, args, callback, ignored);
      });
    }
    if (l) {
      fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
      first = fragment.firstChild;
      if (1 === fragment.childNodes.length) {
        fragment = first;
      }
      // Require either new content or an interest in ignored elements to invoke the callback
      if (first || ignored) {
        scripts = jQuery.map(getAll(fragment, "script"), disableScript);
        hasScripts = scripts.length;
        // Use the original fragment for the last item
        // instead of the first because it can end up
        // being emptied incorrectly in certain situations (#8070).
        for (;i < l; i++) {
          node = fragment;
          if (i !== iNoClone) {
            node = jQuery.clone(node, true, true);
            // Keep references to cloned scripts for later restoration
            if (hasScripts) {
              // Support: Android <=4.0 only, PhantomJS 1 only
              // push.apply(_, arraylike) throws on ancient WebKit
              jQuery.merge(scripts, getAll(node, "script"));
            }
          }
          callback.call(collection[i], node, i);
        }
        if (hasScripts) {
          doc = scripts[scripts.length - 1].ownerDocument;
          // Reenable scripts
          jQuery.map(scripts, restoreScript);
          // Evaluate executable scripts on first document insertion
          for (i = 0; i < hasScripts; i++) {
            node = scripts[i];
            if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
              if (node.src) {
                // Optional AJAX dependency, but won't run scripts if not present
                if (jQuery._evalUrl) {
                  jQuery._evalUrl(node.src);
                }
              } else {
                DOMEval(node.textContent.replace(rcleanScript, ""), doc);
              }
            }
          }
        }
      }
    }
    return collection;
  }
  function remove(elem, selector, keepData) {
    var node, nodes = selector ? jQuery.filter(selector, elem) : elem, i = 0;
    for (;null != (node = nodes[i]); i++) {
      if (!keepData && 1 === node.nodeType) {
        jQuery.cleanData(getAll(node));
      }
      if (node.parentNode) {
        if (keepData && jQuery.contains(node.ownerDocument, node)) {
          setGlobalEval(getAll(node, "script"));
        }
        node.parentNode.removeChild(node);
      }
    }
    return elem;
  }
  jQuery.extend({
    htmlPrefilter: function(html) {
      return html.replace(rxhtmlTag, "<$1></$2>");
    },
    clone: function(elem, dataAndEvents, deepDataAndEvents) {
      var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = jQuery.contains(elem.ownerDocument, elem);
      // Fix IE cloning issues
      if (!support.noCloneChecked && (1 === elem.nodeType || 11 === elem.nodeType) && !jQuery.isXMLDoc(elem)) {
        // We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
        destElements = getAll(clone);
        srcElements = getAll(elem);
        for (i = 0, l = srcElements.length; i < l; i++) {
          fixInput(srcElements[i], destElements[i]);
        }
      }
      // Copy the events from the original to the clone
      if (dataAndEvents) {
        if (deepDataAndEvents) {
          srcElements = srcElements || getAll(elem);
          destElements = destElements || getAll(clone);
          for (i = 0, l = srcElements.length; i < l; i++) {
            cloneCopyEvent(srcElements[i], destElements[i]);
          }
        } else {
          cloneCopyEvent(elem, clone);
        }
      }
      // Preserve script evaluation history
      destElements = getAll(clone, "script");
      if (destElements.length > 0) {
        setGlobalEval(destElements, !inPage && getAll(elem, "script"));
      }
      // Return the cloned set
      return clone;
    },
    cleanData: function(elems) {
      var data, elem, type, special = jQuery.event.special, i = 0;
      for (;void 0 !== (elem = elems[i]); i++) {
        if (acceptData(elem)) {
          if (data = elem[dataPriv.expando]) {
            if (data.events) {
              for (type in data.events) {
                if (special[type]) {
                  jQuery.event.remove(elem, type);
                } else {
                  jQuery.removeEvent(elem, type, data.handle);
                }
              }
            }
            // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove
            elem[dataPriv.expando] = void 0;
          }
          if (elem[dataUser.expando]) {
            // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove
            elem[dataUser.expando] = void 0;
          }
        }
      }
    }
  });
  jQuery.fn.extend({
    detach: function(selector) {
      return remove(this, selector, true);
    },
    remove: function(selector) {
      return remove(this, selector);
    },
    text: function(value) {
      return access(this, function(value) {
        return void 0 === value ? jQuery.text(this) : this.empty().each(function() {
          if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
            this.textContent = value;
          }
        });
      }, null, value, arguments.length);
    },
    append: function() {
      return domManip(this, arguments, function(elem) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var target = manipulationTarget(this, elem);
          target.appendChild(elem);
        }
      });
    },
    prepend: function() {
      return domManip(this, arguments, function(elem) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var target = manipulationTarget(this, elem);
          target.insertBefore(elem, target.firstChild);
        }
      });
    },
    before: function() {
      return domManip(this, arguments, function(elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this);
        }
      });
    },
    after: function() {
      return domManip(this, arguments, function(elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this.nextSibling);
        }
      });
    },
    empty: function() {
      var elem, i = 0;
      for (;null != (elem = this[i]); i++) {
        if (1 === elem.nodeType) {
          // Prevent memory leaks
          jQuery.cleanData(getAll(elem, false));
          // Remove any remaining nodes
          elem.textContent = "";
        }
      }
      return this;
    },
    clone: function(dataAndEvents, deepDataAndEvents) {
      dataAndEvents = null == dataAndEvents ? false : dataAndEvents;
      deepDataAndEvents = null == deepDataAndEvents ? dataAndEvents : deepDataAndEvents;
      return this.map(function() {
        return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
      });
    },
    html: function(value) {
      return access(this, function(value) {
        var elem = this[0] || {}, i = 0, l = this.length;
        if (void 0 === value && 1 === elem.nodeType) {
          return elem.innerHTML;
        }
        // See if we can take a shortcut and just use innerHTML
        if ("string" === typeof value && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || [ "", "" ])[1].toLowerCase()]) {
          value = jQuery.htmlPrefilter(value);
          try {
            for (;i < l; i++) {
              elem = this[i] || {};
              // Remove element nodes and prevent memory leaks
              if (1 === elem.nodeType) {
                jQuery.cleanData(getAll(elem, false));
                elem.innerHTML = value;
              }
            }
            elem = 0;
          } catch (e) {}
        }
        if (elem) {
          this.empty().append(value);
        }
      }, null, value, arguments.length);
    },
    replaceWith: function() {
      var ignored = [];
      // Make the changes, replacing each non-ignored context element with the new content
      return domManip(this, arguments, function(elem) {
        var parent = this.parentNode;
        if (jQuery.inArray(this, ignored) < 0) {
          jQuery.cleanData(getAll(this));
          if (parent) {
            parent.replaceChild(elem, this);
          }
        }
      }, ignored);
    }
  });
  jQuery.each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
  }, function(name, original) {
    jQuery.fn[name] = function(selector) {
      var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0;
      for (;i <= last; i++) {
        elems = i === last ? this : this.clone(true);
        jQuery(insert[i])[original](elems);
        // Support: Android <=4.0 only, PhantomJS 1 only
        // .get() because push.apply(_, arraylike) throws on ancient WebKit
        push.apply(ret, elems.get());
      }
      return this.pushStack(ret);
    };
  });
  var rmargin = /^margin/;
  var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
  var getStyles = function(elem) {
    // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
    // IE throws on elements created in popups
    // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    var view = elem.ownerDocument.defaultView;
    if (!view || !view.opener) {
      view = window;
    }
    return view.getComputedStyle(elem);
  };
  !function() {
    // Executing both pixelPosition & boxSizingReliable tests require only one layout
    // so they're executed at the same time to save the second computation.
    function computeStyleTests() {
      // This is a singleton, we need to execute it only once
      if (!div) {
        return;
      }
      div.style.cssText = "box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%";
      div.innerHTML = "";
      documentElement.appendChild(container);
      var divStyle = window.getComputedStyle(div);
      pixelPositionVal = "1%" !== divStyle.top;
      // Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
      reliableMarginLeftVal = "2px" === divStyle.marginLeft;
      boxSizingReliableVal = "4px" === divStyle.width;
      // Support: Android 4.0 - 4.3 only
      // Some styles come back with percentage values, even though they shouldn't
      div.style.marginRight = "50%";
      pixelMarginRightVal = "4px" === divStyle.marginRight;
      documentElement.removeChild(container);
      // Nullify the div so it wouldn't be stored in the memory and
      // it will also be a sign that checks already performed
      div = null;
    }
    var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal, container = document.createElement("div"), div = document.createElement("div");
    // Finish early in limited (non-browser) environments
    if (!div.style) {
      return;
    }
    // Support: IE <=9 - 11 only
    // Style of cloned element affects source element cloned (#8908)
    div.style.backgroundClip = "content-box";
    div.cloneNode(true).style.backgroundClip = "";
    support.clearCloneStyle = "content-box" === div.style.backgroundClip;
    container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute";
    container.appendChild(div);
    jQuery.extend(support, {
      pixelPosition: function() {
        computeStyleTests();
        return pixelPositionVal;
      },
      boxSizingReliable: function() {
        computeStyleTests();
        return boxSizingReliableVal;
      },
      pixelMarginRight: function() {
        computeStyleTests();
        return pixelMarginRightVal;
      },
      reliableMarginLeft: function() {
        computeStyleTests();
        return reliableMarginLeftVal;
      }
    });
  }();
  function curCSS(elem, name, computed) {
    var width, minWidth, maxWidth, ret, style = elem.style;
    computed = computed || getStyles(elem);
    // Support: IE <=9 only
    // getPropertyValue is only needed for .css('filter') (#12537)
    if (computed) {
      ret = computed.getPropertyValue(name) || computed[name];
      if ("" === ret && !jQuery.contains(elem.ownerDocument, elem)) {
        ret = jQuery.style(elem, name);
      }
      // A tribute to the "awesome hack by Dean Edwards"
      // Android Browser returns percentage for some values,
      // but width seems to be reliably pixels.
      // This is against the CSSOM draft spec:
      // https://drafts.csswg.org/cssom/#resolved-values
      if (!support.pixelMarginRight() && rnumnonpx.test(ret) && rmargin.test(name)) {
        // Remember the original values
        width = style.width;
        minWidth = style.minWidth;
        maxWidth = style.maxWidth;
        // Put in the new values to get a computed value out
        style.minWidth = style.maxWidth = style.width = ret;
        ret = computed.width;
        // Revert the changed values
        style.width = width;
        style.minWidth = minWidth;
        style.maxWidth = maxWidth;
      }
    }
    // Support: IE <=9 - 11 only
    // IE returns zIndex value as an integer.
    return void 0 !== ret ? ret + "" : ret;
  }
  function addGetHookIf(conditionFn, hookFn) {
    // Define the hook, we'll check on the first run if it's really needed.
    return {
      get: function() {
        if (conditionFn()) {
          // Hook not needed (or it's not possible to use it due
          // to missing dependency), remove it.
          delete this.get;
          return;
        }
        // Hook needed; redefine it so that the support test is not executed again.
        return (this.get = hookFn).apply(this, arguments);
      }
    };
  }
  var // Swappable if display is none or starts with table
  // except "table", "table-cell", or "table-caption"
  // See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
  rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = {
    position: "absolute",
    visibility: "hidden",
    display: "block"
  }, cssNormalTransform = {
    letterSpacing: "0",
    fontWeight: "400"
  }, cssPrefixes = [ "Webkit", "Moz", "ms" ], emptyStyle = document.createElement("div").style;
  // Return a css property mapped to a potentially vendor prefixed property
  function vendorPropName(name) {
    // Shortcut for names that are not vendor prefixed
    if (name in emptyStyle) {
      return name;
    }
    // Check for vendor prefixed names
    var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
    while (i--) {
      name = cssPrefixes[i] + capName;
      if (name in emptyStyle) {
        return name;
      }
    }
  }
  function setPositiveNumber(elem, value, subtract) {
    // Any relative (+/-) values have already been
    // normalized at this point
    var matches = rcssNum.exec(value);
    // Guard against undefined "subtract", e.g., when used as in cssHooks
    return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value;
  }
  function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
    var i = extra === (isBorderBox ? "border" : "content") ? // If we already have the right measurement, avoid augmentation
    4 : // Otherwise initialize for horizontal or vertical properties
    "width" === name ? 1 : 0, val = 0;
    for (;i < 4; i += 2) {
      // Both box models exclude margin, so add it if we want it
      if ("margin" === extra) {
        val += jQuery.css(elem, extra + cssExpand[i], true, styles);
      }
      if (isBorderBox) {
        // border-box includes padding, so remove it if we want content
        if ("content" === extra) {
          val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        }
        // At this point, extra isn't border nor margin, so remove border
        if ("margin" !== extra) {
          val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      } else {
        // At this point, extra isn't content, so add padding
        val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        // At this point, extra isn't content nor padding, so add border
        if ("padding" !== extra) {
          val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      }
    }
    return val;
  }
  function getWidthOrHeight(elem, name, extra) {
    // Start with offset property, which is equivalent to the border-box value
    var val, valueIsBorderBox = true, styles = getStyles(elem), isBorderBox = "border-box" === jQuery.css(elem, "boxSizing", false, styles);
    // Support: IE <=11 only
    // Running getBoundingClientRect on a disconnected node
    // in IE throws an error.
    if (elem.getClientRects().length) {
      val = elem.getBoundingClientRect()[name];
    }
    // Some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if (val <= 0 || null == val) {
      // Fall back to computed then uncomputed css if necessary
      val = curCSS(elem, name, styles);
      if (val < 0 || null == val) {
        val = elem.style[name];
      }
      // Computed unit is not pixels. Stop here and return.
      if (rnumnonpx.test(val)) {
        return val;
      }
      // Check for style in case a browser which returns unreliable values
      // for getComputedStyle silently falls back to the reliable elem.style
      valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);
      // Normalize "", auto, and prepare for extra
      val = parseFloat(val) || 0;
    }
    // Use the active box-sizing model to add/subtract irrelevant styles
    return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px";
  }
  jQuery.extend({
    // Add in style property hooks for overriding the default
    // behavior of getting and setting a style property
    cssHooks: {
      opacity: {
        get: function(elem, computed) {
          if (computed) {
            // We should always get a number back from opacity
            var ret = curCSS(elem, "opacity");
            return "" === ret ? "1" : ret;
          }
        }
      }
    },
    // Don't automatically add "px" to these possibly-unitless properties
    cssNumber: {
      animationIterationCount: true,
      columnCount: true,
      fillOpacity: true,
      flexGrow: true,
      flexShrink: true,
      fontWeight: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      widows: true,
      zIndex: true,
      zoom: true
    },
    // Add in properties whose names you wish to fix before
    // setting or getting the value
    cssProps: {
      float: "cssFloat"
    },
    // Get and set the style property on a DOM Node
    style: function(elem, name, value, extra) {
      // Don't set styles on text and comment nodes
      if (!elem || 3 === elem.nodeType || 8 === elem.nodeType || !elem.style) {
        return;
      }
      // Make sure that we're working with the right name
      var ret, type, hooks, origName = jQuery.camelCase(name), style = elem.style;
      name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(origName) || origName);
      // Gets hook for the prefixed version, then unprefixed version
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      // Check if we're setting a value
      if (void 0 !== value) {
        type = typeof value;
        // Convert "+=" or "-=" to relative numbers (#7345)
        if ("string" === type && (ret = rcssNum.exec(value)) && ret[1]) {
          value = adjustCSS(elem, name, ret);
          // Fixes bug #9237
          type = "number";
        }
        // Make sure that null and NaN values aren't set (#7116)
        if (null == value || value !== value) {
          return;
        }
        // If a number was passed in, add the unit (except for certain CSS properties)
        if ("number" === type) {
          value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
        }
        // background-* props affect original clone's values
        if (!support.clearCloneStyle && "" === value && 0 === name.indexOf("background")) {
          style[name] = "inherit";
        }
        // If a hook was provided, use that value, otherwise just set the specified value
        if (!hooks || !("set" in hooks) || void 0 !== (value = hooks.set(elem, value, extra))) {
          style[name] = value;
        }
      } else {
        // If a hook was provided get the non-computed value from there
        if (hooks && "get" in hooks && void 0 !== (ret = hooks.get(elem, false, extra))) {
          return ret;
        }
        // Otherwise just get the value from the style object
        return style[name];
      }
    },
    css: function(elem, name, extra, styles) {
      var val, num, hooks, origName = jQuery.camelCase(name);
      // Make sure that we're working with the right name
      name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(origName) || origName);
      // Try prefixed name followed by the unprefixed name
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      // If a hook was provided get the computed value from there
      if (hooks && "get" in hooks) {
        val = hooks.get(elem, true, extra);
      }
      // Otherwise, if a way to get the computed value exists, use that
      if (void 0 === val) {
        val = curCSS(elem, name, styles);
      }
      // Convert "normal" to computed value
      if ("normal" === val && name in cssNormalTransform) {
        val = cssNormalTransform[name];
      }
      // Make numeric if forced or a qualifier was provided and val looks numeric
      if ("" === extra || extra) {
        num = parseFloat(val);
        return true === extra || isFinite(num) ? num || 0 : val;
      }
      return val;
    }
  });
  jQuery.each([ "height", "width" ], function(i, name) {
    jQuery.cssHooks[name] = {
      get: function(elem, computed, extra) {
        if (computed) {
          // Certain elements can have dimension info if we invisibly show them
          // but it must have a current display style that would benefit
          // Support: Safari 8+
          // Table columns in Safari have non-zero offsetWidth & zero
          // getBoundingClientRect().width unless display is changed.
          // Support: IE <=11 only
          // Running getBoundingClientRect on a disconnected node
          // in IE throws an error.
          return rdisplayswap.test(jQuery.css(elem, "display")) && (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function() {
            return getWidthOrHeight(elem, name, extra);
          }) : getWidthOrHeight(elem, name, extra);
        }
      },
      set: function(elem, value, extra) {
        var matches, styles = extra && getStyles(elem), subtract = extra && augmentWidthOrHeight(elem, name, extra, "border-box" === jQuery.css(elem, "boxSizing", false, styles), styles);
        // Convert to pixels if value adjustment is needed
        if (subtract && (matches = rcssNum.exec(value)) && "px" !== (matches[3] || "px")) {
          elem.style[name] = value;
          value = jQuery.css(elem, name);
        }
        return setPositiveNumber(elem, value, subtract);
      }
    };
  });
  jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function(elem, computed) {
    if (computed) {
      return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, {
        marginLeft: 0
      }, function() {
        return elem.getBoundingClientRect().left;
      })) + "px";
    }
  });
  // These hooks are used by animate to expand properties
  jQuery.each({
    margin: "",
    padding: "",
    border: "Width"
  }, function(prefix, suffix) {
    jQuery.cssHooks[prefix + suffix] = {
      expand: function(value) {
        var i = 0, expanded = {}, // Assumes a single number if not a string
        parts = "string" === typeof value ? value.split(" ") : [ value ];
        for (;i < 4; i++) {
          expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
        }
        return expanded;
      }
    };
    if (!rmargin.test(prefix)) {
      jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
    }
  });
  jQuery.fn.extend({
    css: function(name, value) {
      return access(this, function(elem, name, value) {
        var styles, len, map = {}, i = 0;
        if (jQuery.isArray(name)) {
          styles = getStyles(elem);
          len = name.length;
          for (;i < len; i++) {
            map[name[i]] = jQuery.css(elem, name[i], false, styles);
          }
          return map;
        }
        return void 0 !== value ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
      }, name, value, arguments.length > 1);
    }
  });
  !function() {
    var input = document.createElement("input"), select = document.createElement("select"), opt = select.appendChild(document.createElement("option"));
    input.type = "checkbox";
    // Support: Android <=4.3 only
    // Default value for a checkbox should be "on"
    support.checkOn = "" !== input.value;
    // Support: IE <=11 only
    // Must access selectedIndex to make default options select
    support.optSelected = opt.selected;
    // Support: IE <=11 only
    // An input loses its value after becoming a radio
    input = document.createElement("input");
    input.value = "t";
    input.type = "radio";
    support.radioValue = "t" === input.value;
  }();
  var boolHook, attrHandle = jQuery.expr.attrHandle;
  jQuery.fn.extend({
    attr: function(name, value) {
      return access(this, jQuery.attr, name, value, arguments.length > 1);
    },
    removeAttr: function(name) {
      return this.each(function() {
        jQuery.removeAttr(this, name);
      });
    }
  });
  jQuery.extend({
    attr: function(elem, name, value) {
      var ret, hooks, nType = elem.nodeType;
      // Don't get/set attributes on text, comment and attribute nodes
      if (3 === nType || 8 === nType || 2 === nType) {
        return;
      }
      // Fallback to prop when attributes are not supported
      if ("undefined" === typeof elem.getAttribute) {
        return jQuery.prop(elem, name, value);
      }
      // Attribute hooks are determined by the lowercase version
      // Grab necessary hook if one is defined
      if (1 !== nType || !jQuery.isXMLDoc(elem)) {
        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : void 0);
      }
      if (void 0 !== value) {
        if (null === value) {
          jQuery.removeAttr(elem, name);
          return;
        }
        if (hooks && "set" in hooks && void 0 !== (ret = hooks.set(elem, value, name))) {
          return ret;
        }
        elem.setAttribute(name, value + "");
        return value;
      }
      if (hooks && "get" in hooks && null !== (ret = hooks.get(elem, name))) {
        return ret;
      }
      ret = jQuery.find.attr(elem, name);
      // Non-existent attributes return null, we normalize to undefined
      return null == ret ? void 0 : ret;
    },
    attrHooks: {
      type: {
        set: function(elem, value) {
          if (!support.radioValue && "radio" === value && jQuery.nodeName(elem, "input")) {
            var val = elem.value;
            elem.setAttribute("type", value);
            if (val) {
              elem.value = val;
            }
            return value;
          }
        }
      }
    },
    removeAttr: function(elem, value) {
      var name, i = 0, attrNames = value && value.match(rnotwhite);
      if (attrNames && 1 === elem.nodeType) {
        while (name = attrNames[i++]) {
          elem.removeAttribute(name);
        }
      }
    }
  });
  // Hooks for boolean attributes
  boolHook = {
    set: function(elem, value, name) {
      if (false === value) {
        // Remove boolean attributes when set to false
        jQuery.removeAttr(elem, name);
      } else {
        elem.setAttribute(name, name);
      }
      return name;
    }
  };
  jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
    var getter = attrHandle[name] || jQuery.find.attr;
    attrHandle[name] = function(elem, name, isXML) {
      var ret, handle, lowercaseName = name.toLowerCase();
      if (!isXML) {
        // Avoid an infinite loop by temporarily removing this function from the getter
        handle = attrHandle[lowercaseName];
        attrHandle[lowercaseName] = ret;
        ret = null != getter(elem, name, isXML) ? lowercaseName : null;
        attrHandle[lowercaseName] = handle;
      }
      return ret;
    };
  });
  var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
  jQuery.fn.extend({
    prop: function(name, value) {
      return access(this, jQuery.prop, name, value, arguments.length > 1);
    },
    removeProp: function(name) {
      return this.each(function() {
        delete this[jQuery.propFix[name] || name];
      });
    }
  });
  jQuery.extend({
    prop: function(elem, name, value) {
      var ret, hooks, nType = elem.nodeType;
      // Don't get/set properties on text, comment and attribute nodes
      if (3 === nType || 8 === nType || 2 === nType) {
        return;
      }
      if (1 !== nType || !jQuery.isXMLDoc(elem)) {
        // Fix name and attach hooks
        name = jQuery.propFix[name] || name;
        hooks = jQuery.propHooks[name];
      }
      if (void 0 !== value) {
        if (hooks && "set" in hooks && void 0 !== (ret = hooks.set(elem, value, name))) {
          return ret;
        }
        return elem[name] = value;
      }
      if (hooks && "get" in hooks && null !== (ret = hooks.get(elem, name))) {
        return ret;
      }
      return elem[name];
    },
    propHooks: {
      tabIndex: {
        get: function(elem) {
          // Support: IE <=9 - 11 only
          // elem.tabIndex doesn't always return the
          // correct value when it hasn't been explicitly set
          // https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
          // Use proper attribute retrieval(#12072)
          var tabindex = jQuery.find.attr(elem, "tabindex");
          return tabindex ? parseInt(tabindex, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : -1;
        }
      }
    },
    propFix: {
      for: "htmlFor",
      class: "className"
    }
  });
  // Support: IE <=11 only
  // Accessing the selectedIndex property
  // forces the browser to respect setting selected
  // on the option
  // The getter ensures a default option is selected
  // when in an optgroup
  if (!support.optSelected) {
    jQuery.propHooks.selected = {
      get: function(elem) {
        var parent = elem.parentNode;
        if (parent && parent.parentNode) {
          parent.parentNode.selectedIndex;
        }
        return null;
      },
      set: function(elem) {
        var parent = elem.parentNode;
        if (parent) {
          parent.selectedIndex;
          if (parent.parentNode) {
            parent.parentNode.selectedIndex;
          }
        }
      }
    };
  }
  jQuery.each([ "tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable" ], function() {
    jQuery.propFix[this.toLowerCase()] = this;
  });
  var rclass = /[\t\r\n\f]/g;
  function getClass(elem) {
    return elem.getAttribute && elem.getAttribute("class") || "";
  }
  jQuery.fn.extend({
    addClass: function(value) {
      var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
      if (jQuery.isFunction(value)) {
        return this.each(function(j) {
          jQuery(this).addClass(value.call(this, j, getClass(this)));
        });
      }
      if ("string" === typeof value && value) {
        classes = value.match(rnotwhite) || [];
        while (elem = this[i++]) {
          curValue = getClass(elem);
          cur = 1 === elem.nodeType && (" " + curValue + " ").replace(rclass, " ");
          if (cur) {
            j = 0;
            while (clazz = classes[j++]) {
              if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
              }
            }
            // Only assign if different to avoid unneeded rendering.
            finalValue = jQuery.trim(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    removeClass: function(value) {
      var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
      if (jQuery.isFunction(value)) {
        return this.each(function(j) {
          jQuery(this).removeClass(value.call(this, j, getClass(this)));
        });
      }
      if (!arguments.length) {
        return this.attr("class", "");
      }
      if ("string" === typeof value && value) {
        classes = value.match(rnotwhite) || [];
        while (elem = this[i++]) {
          curValue = getClass(elem);
          // This expression is here for better compressibility (see addClass)
          cur = 1 === elem.nodeType && (" " + curValue + " ").replace(rclass, " ");
          if (cur) {
            j = 0;
            while (clazz = classes[j++]) {
              // Remove *all* instances
              while (cur.indexOf(" " + clazz + " ") > -1) {
                cur = cur.replace(" " + clazz + " ", " ");
              }
            }
            // Only assign if different to avoid unneeded rendering.
            finalValue = jQuery.trim(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    toggleClass: function(value, stateVal) {
      var type = typeof value;
      if ("boolean" === typeof stateVal && "string" === type) {
        return stateVal ? this.addClass(value) : this.removeClass(value);
      }
      if (jQuery.isFunction(value)) {
        return this.each(function(i) {
          jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
        });
      }
      return this.each(function() {
        var className, i, self, classNames;
        if ("string" === type) {
          // Toggle individual class names
          i = 0;
          self = jQuery(this);
          classNames = value.match(rnotwhite) || [];
          while (className = classNames[i++]) {
            // Check each className given, space separated list
            if (self.hasClass(className)) {
              self.removeClass(className);
            } else {
              self.addClass(className);
            }
          }
        } else {
          if (void 0 === value || "boolean" === type) {
            className = getClass(this);
            if (className) {
              // Store className if set
              dataPriv.set(this, "__className__", className);
            }
            // If the element has a class name or if we're passed `false`,
            // then remove the whole classname (if there was one, the above saved it).
            // Otherwise bring back whatever was previously saved (if anything),
            // falling back to the empty string if nothing was stored.
            if (this.setAttribute) {
              this.setAttribute("class", className || false === value ? "" : dataPriv.get(this, "__className__") || "");
            }
          }
        }
      });
    },
    hasClass: function(selector) {
      var className, elem, i = 0;
      className = " " + selector + " ";
      while (elem = this[i++]) {
        if (1 === elem.nodeType && (" " + getClass(elem) + " ").replace(rclass, " ").indexOf(className) > -1) {
          return true;
        }
      }
      return false;
    }
  });
  var rreturn = /\r/g, rspaces = /[\x20\t\r\n\f]+/g;
  jQuery.fn.extend({
    val: function(value) {
      var hooks, ret, isFunction, elem = this[0];
      if (!arguments.length) {
        if (elem) {
          hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
          if (hooks && "get" in hooks && void 0 !== (ret = hooks.get(elem, "value"))) {
            return ret;
          }
          ret = elem.value;
          // Handle most common string cases
          // Handle cases where value is null/undef or number
          return "string" === typeof ret ? ret.replace(rreturn, "") : null == ret ? "" : ret;
        }
        return;
      }
      isFunction = jQuery.isFunction(value);
      return this.each(function(i) {
        var val;
        if (1 !== this.nodeType) {
          return;
        }
        if (isFunction) {
          val = value.call(this, i, jQuery(this).val());
        } else {
          val = value;
        }
        // Treat null/undefined as ""; convert numbers to string
        if (null == val) {
          val = "";
        } else {
          if ("number" === typeof val) {
            val += "";
          } else {
            if (jQuery.isArray(val)) {
              val = jQuery.map(val, function(value) {
                return null == value ? "" : value + "";
              });
            }
          }
        }
        hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
        // If set returns undefined, fall back to normal setting
        if (!hooks || !("set" in hooks) || void 0 === hooks.set(this, val, "value")) {
          this.value = val;
        }
      });
    }
  });
  jQuery.extend({
    valHooks: {
      option: {
        get: function(elem) {
          var val = jQuery.find.attr(elem, "value");
          // Support: IE <=10 - 11 only
          // option.text throws exceptions (#14686, #14858)
          // Strip and collapse whitespace
          // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
          return null != val ? val : jQuery.trim(jQuery.text(elem)).replace(rspaces, " ");
        }
      },
      select: {
        get: function(elem) {
          var value, option, options = elem.options, index = elem.selectedIndex, one = "select-one" === elem.type, values = one ? null : [], max = one ? index + 1 : options.length, i = index < 0 ? max : one ? index : 0;
          // Loop through all the selected options
          for (;i < max; i++) {
            option = options[i];
            // Support: IE <=9 only
            // IE8-9 doesn't update selected after form reset (#2551)
            if ((option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
            !option.disabled && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))) {
              // Get the specific value for the option
              value = jQuery(option).val();
              // We don't need an array for one selects
              if (one) {
                return value;
              }
              // Multi-Selects return an array
              values.push(value);
            }
          }
          return values;
        },
        set: function(elem, value) {
          var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length;
          while (i--) {
            option = options[i];
            if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
              optionSet = true;
            }
          }
          // Force browsers to behave consistently when non-matching value is set
          if (!optionSet) {
            elem.selectedIndex = -1;
          }
          return values;
        }
      }
    }
  });
  // Radios and checkboxes getter/setter
  jQuery.each([ "radio", "checkbox" ], function() {
    jQuery.valHooks[this] = {
      set: function(elem, value) {
        if (jQuery.isArray(value)) {
          return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
        }
      }
    };
    if (!support.checkOn) {
      jQuery.valHooks[this].get = function(elem) {
        return null === elem.getAttribute("value") ? "on" : elem.value;
      };
    }
  });
  // Return jQuery for attributes-only inclusion
  support.focusin = "onfocusin" in window;
  var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
  function buildParams(prefix, obj, traditional, add) {
    var name;
    if (jQuery.isArray(obj)) {
      // Serialize array item.
      jQuery.each(obj, function(i, v) {
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v);
        } else {
          // Item is non-scalar (array or object), encode its numeric index.
          buildParams(prefix + "[" + ("object" === typeof v && null != v ? i : "") + "]", v, traditional, add);
        }
      });
    } else {
      if (!traditional && "object" === jQuery.type(obj)) {
        // Serialize object item.
        for (name in obj) {
          buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
        }
      } else {
        // Serialize scalar item.
        add(prefix, obj);
      }
    }
  }
  // Serialize an array of form elements or a set of
  // key/values into a query string
  jQuery.param = function(a, traditional) {
    var prefix, s = [], add = function(key, valueOrFunction) {
      // If value is a function, invoke it and use its return value
      var value = jQuery.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
      s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(null == value ? "" : value);
    };
    // If an array was passed in, assume that it is an array of form elements.
    if (jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
      // Serialize the form elements
      jQuery.each(a, function() {
        add(this.name, this.value);
      });
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in a) {
        buildParams(prefix, a[prefix], traditional, add);
      }
    }
    // Return the resulting serialization
    return s.join("&");
  };
  jQuery.fn.extend({
    serialize: function() {
      return jQuery.param(this.serializeArray());
    },
    serializeArray: function() {
      return this.map(function() {
        // Can add propHook for "elements" to filter or add form elements
        var elements = jQuery.prop(this, "elements");
        return elements ? jQuery.makeArray(elements) : this;
      }).filter(function() {
        var type = this.type;
        // Use .is( ":disabled" ) so that fieldset[disabled] works
        return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
      }).map(function(i, elem) {
        var val = jQuery(this).val();
        return null == val ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
          return {
            name: elem.name,
            value: val.replace(rCRLF, "\r\n")
          };
        }) : {
          name: elem.name,
          value: val.replace(rCRLF, "\r\n")
        };
      }).get();
    }
  });
  // Support: Safari 8 only
  // In Safari 8 documents created via document.implementation.createHTMLDocument
  // collapse sibling forms: the second one becomes a child of the first one.
  // Because of that, this security measure has to be disabled in Safari 8.
  // https://bugs.webkit.org/show_bug.cgi?id=137337
  support.createHTMLDocument = function() {
    var body = document.implementation.createHTMLDocument("").body;
    body.innerHTML = "<form></form><form></form>";
    return 2 === body.childNodes.length;
  }();
  // Argument "data" should be string of html
  // context (optional): If specified, the fragment will be created in this context,
  // defaults to document
  // keepScripts (optional): If true, will include scripts passed in the html string
  jQuery.parseHTML = function(data, context, keepScripts) {
    if ("string" !== typeof data) {
      return [];
    }
    if ("boolean" === typeof context) {
      keepScripts = context;
      context = false;
    }
    var base, parsed, scripts;
    if (!context) {
      // Stop scripts or inline event handlers from being executed immediately
      // by using document.implementation
      if (support.createHTMLDocument) {
        context = document.implementation.createHTMLDocument("");
        // Set the base href for the created document
        // so any parsed elements with URLs
        // are based on the document's URL (gh-2965)
        base = context.createElement("base");
        base.href = document.location.href;
        context.head.appendChild(base);
      } else {
        context = document;
      }
    }
    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && [];
    // Single tag
    if (parsed) {
      return [ context.createElement(parsed[1]) ];
    }
    parsed = buildFragment([ data ], context, scripts);
    if (scripts && scripts.length) {
      jQuery(scripts).remove();
    }
    return jQuery.merge([], parsed.childNodes);
  };
  var readyCallbacks = [], readyFiring = false, whenReady = function(fn) {
    readyCallbacks.push(fn);
  }, executeReady = function(fn) {
    // Prevent errors from freezing future callback execution (gh-1823)
    // Not backwards-compatible as this does not execute sync
    setTimeout(function() {
      fn.call(document, jQuery);
    });
  };
  jQuery.fn.ready = function(fn) {
    whenReady(fn);
    return this;
  };
  jQuery.extend({
    // Is the DOM ready to be used? Set to true once it occurs.
    isReady: false,
    // A counter to track how many items to wait for before
    // the ready event fires. See #6781
    readyWait: 1,
    // Hold (or release) the ready event
    holdReady: function(hold) {
      if (hold) {
        jQuery.readyWait++;
      } else {
        jQuery.ready(true);
      }
    },
    ready: function(wait) {
      // Abort if there are pending holds or we're already ready
      if (true === wait ? --jQuery.readyWait : jQuery.isReady) {
        return;
      }
      // Remember that the DOM is ready
      jQuery.isReady = true;
      // If a normal DOM Ready event fired, decrement, and wait if need be
      if (true !== wait && --jQuery.readyWait > 0) {
        return;
      }
      whenReady = function(fn) {
        readyCallbacks.push(fn);
        if (!readyFiring) {
          readyFiring = true;
          while (readyCallbacks.length) {
            fn = readyCallbacks.shift();
            if (jQuery.isFunction(fn)) {
              executeReady(fn);
            }
          }
          readyFiring = false;
        }
      };
      whenReady();
    }
  });
  // Make jQuery.ready Promise consumable (gh-1778)
  jQuery.ready.then = jQuery.fn.ready;
  /**
   * The ready event handler and self cleanup method
   */
  function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
    window.removeEventListener("load", completed);
    jQuery.ready();
  }
  // Catch cases where $(document).ready() is called
  // after the browser event has already occurred.
  // Support: IE9-10 only
  // Older IE sometimes signals "interactive" too soon
  if ("complete" === document.readyState || "loading" !== document.readyState && !document.documentElement.doScroll) {
    // Handle it asynchronously to allow scripts the opportunity to delay ready
    setTimeout(jQuery.ready);
  } else {
    // Use the handy event callback
    document.addEventListener("DOMContentLoaded", completed);
    // A fallback to window.onload, that will always work
    window.addEventListener("load", completed);
  }
  // --- BEGIN SITECUES CUSTOM CODE ---
  // Register as a named AMD module, since jQuery can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase jquery is used because AMD module names are
  // derived from file names, and jQuery is normally delivered in a lowercase
  // file name. Do this after creating the global so that if an AMD module wants
  // to call noConflict to hide this version of jQuery, it will work.
  // Note that for maximum portability, libraries that are not jQuery should
  // declare themselves as anonymous modules, and avoid setting a global if an
  // AMD loader is present. jQuery is a special case. For more information, see
  // https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
  // TODO ideally this should not hardcode sitecues.define -- pass it through r.js. However, it works for now.
  if (true) {
    sitecues.define("page/jquery/jquery", [], function() {
      return jQuery;
    });
  }
  // Don't bother with this -- it just makes it difficult to have our own private sitecues jQuery
  // Expose jQuery and $ identifiers, even in
  // AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
  // and CommonJS for browser emulators (#13566)
  //  if ( typeof noGlobal === strundefined ) {
  //    window.jQuery = window.$ = jQuery;
  //  }
  sitecues.$ = jQuery;
  return jQuery;
});

sitecues.define("page/jquery/jquery", function() {});

/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.define("page/util/element-classifier", [], function() {
  function hasMatchingTag(tags, element) {
    return tags.hasOwnProperty(element.localName);
  }
  /**
   * Checks if the element has media contents which can be rendered.
   */
  var VISUAL_MEDIA_ELEMENTS = {
    img: 1,
    picture: 1,
    canvas: 1,
    video: 1,
    embed: 1,
    object: 1,
    iframe: 1,
    frame: 1,
    audio: 1
  };
  function isVisualMedia(element) {
    return hasMatchingTag(VISUAL_MEDIA_ELEMENTS, element);
  }
  /**
   * Checks if the element is a form control
   */
  var FORM_ELEMENTS = {
    input: 1,
    textarea: 1,
    select: 1,
    button: 1
  };
  function isFormControl(element) {
    return hasMatchingTag(FORM_ELEMENTS, element);
  }
  /**
   * Returns true if the element may use spacebar presses for its own purposes when focused.
   * For example, a video is likely to use spacebar to pause/play the video, and an input
   * uses the spacebar to insert spaces into the text.
   * @param selector
   * @returns {*|boolean}
   */
  // Define set of elements that need the spacebar but are not editable
  var NON_EDITABLE_SPACEBAR_ELEMENTS = {
    video: 1,
    embed: 1,
    object: 1,
    iframe: 1,
    frame: 1,
    audio: 1,
    button: 1,
    input: 1,
    select: 1
  };
  function isSpacebarConsumer(eventTarget) {
    // Added because window somehow came in here sometimes, causing exception
    return eventTarget.nodeType === Node.ELEMENT_NODE && hasMatchingTag(NON_EDITABLE_SPACEBAR_ELEMENTS, eventTarget) || eventTarget.hasAttribute("tabindex") || eventTarget.hasAttribute("onkeypress") || eventTarget.hasAttribute("onkeydown") || isEditable(eventTarget);
  }
  function isContentEditable(element) {
    var contentEditable = element.getAttribute("contenteditable");
    return "string" === typeof contentEditable && "false" !== contentEditable;
  }
  /**
   * Is the current element editable for any reason???
   * @param element
   * @returns {boolean} True if editable
   */
  var EDITABLE_INPUT_TYPES = [ "text", "email", "password", "search", "tel", "url", "color", "date", "datetime", "datetime-local", "month", "number", "time", "week" ];
  function isEditable(element) {
    if ("input" === element.localName) {
      var type = element.getAttribute("type");
      return !type || EDITABLE_INPUT_TYPES.indexOf(type) >= 0;
    }
    return "on" === document.designMode || "textarea" === element.localName || isContentEditable(element);
  }
  return {
    isVisualMedia: isVisualMedia,
    isFormControl: isFormControl,
    isSpacebarConsumer: isSpacebarConsumer,
    isEditable: isEditable
  };
});

/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.define("page/util/common", [ "page/util/element-classifier", "run/inline-style/inline-style" ], function(elemClassifier, inlineStyle) {
  function isTransparentColor(color) {
    // NOTE: Doesn't check HSLA colors for transparency
    return "transparent" === color || color.match(/^rgba.*0\)$/);
  }
  /**
   * @private
   */
  function isNonEmptyTextNode(node) {
    return node.nodeType === Node.TEXT_NODE && !isWhitespaceOrPunct(node);
  }
  function hasBorder(style) {
    return parseFloat(style.borderRightWidth) || parseFloat(style.borderBottomWidth);
  }
  /**
   * Checks if the text in a text node given has any characters that appear as text.
   * The picker uses this to determine if a text node has content worth highlighting --
   * we require at least one letter or number as punctuation marks are often used as decorative separators.
   * We use unicode ranges to ensure that characters from foreign alphabets are included,
   * otherwise the picker will not pick text from languages with non-roman alphabets.
   * This is a close approximation to that -- we kept the regex simple and the number of ranges smaller;
   * there may be some very rare characters where the regex is not perfect. That should generally be
   * ok, because it only needs one word character in a text node to make it pickable.
   */
  function isWhitespaceOrPunct(textNode) {
    var val = textNode.data, WORD_PATTERN = /[\w\u0100-\u024f\u0370-\u1fff\u2e80-\ufeff]/;
    return !val || !WORD_PATTERN.test(val);
  }
  // Return true if there is a visual sub-box of content
  function isVisualRegion(element, style, parentStyle) {
    if (element === document.documentElement || element === document.body) {
      return false;
    }
    var isVisRegion = hasBorder(style) || hasRaisedZIndex(style, parentStyle) || hasOwnBackground(element, style, parentStyle);
    return Boolean(isVisRegion);
  }
  function hasRaisedZIndex(style, parentStyle) {
    return parseFloat(style.zIndex) > parseFloat(parentStyle.zIndex);
  }
  function isSprite(style) {
    var coor = style.backgroundPosition.split(" ");
    return "none" !== style.backgroundImage && ("no-repeat" === style.backgroundRepeat || 0 === parseFloat(coor[0]) || 0 === parseFloat(coor[1]));
  }
  //TODO: Consider refactoring signature to take just the element as a parameter
  function hasOwnBackground(elem, style, parentStyle) {
    if (!style) {
      return false;
    }
    // 1. Background images (sprites don't count -- often used for things like bullets)
    if ("none" !== style.backgroundImage && !isSprite(style)) {
      return true;
    }
    // 2. Background colors
    return hasOwnBackgroundColor(elem, style, parentStyle);
  }
  function hasOwnBackgroundColor(elem, style, parentStyle) {
    var bgColor = style.backgroundColor;
    if (parentStyle && !isTransparentColor(bgColor)) {
      var parent = elem.parentNode;
      while (isTransparentColor(parentStyle.backgroundColor)) {
        if (parent === document.documentElement) {
          // Only transparent colors above = treated as white
          // Therefore current opaque bg is only treated as different if it's not white
          return "rgb(255, 255, 255)" !== bgColor;
        }
        parent = parent.parentNode;
        parentStyle = getComputedStyle(parent);
      }
      return parentStyle.backgroundColor !== bgColor;
    }
    return false;
  }
  function hasVisibleContent(current) {
    var children, index, numChildrenToCheck, MAX_CHILDREN_TO_CHECK = 10;
    if (elemClassifier.isVisualMedia(current) || elemClassifier.isFormControl(current)) {
      var mediaRect = current.getBoundingClientRect(), MIN_RECT_SIDE = 5;
      return mediaRect.width >= MIN_RECT_SIDE && mediaRect.height >= MIN_RECT_SIDE;
    }
    // Check to see if there are non-empty child text nodes.
    // If there are, we say we're not over whitespace.
    children = current.childNodes;
    // Shortcut: could not have text children because all children are elements
    if (current.childElementCount === children.length) {
      return false;
    }
    numChildrenToCheck = Math.min(children.length, MAX_CHILDREN_TO_CHECK);
    // Longer check: see if any children are non-empty text nodes, one by one
    for (index = 0; index < numChildrenToCheck; index++) {
      if (isNonEmptyTextNode(children[index])) {
        return true;
      }
    }
    return false;
  }
  /*
   * Check if current image value is not empty.
   * @imageValue A string that represents current image value.
   * @return true if image value contains some not-empty value.
   */
  function isEmptyBgImage(imageValue) {
    return !imageValue || "none" === imageValue;
  }
  /**
   * Create an SVG fragment for insertion into a web page -- ordinary methods don't work.
   * See http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
   */
  function createSVGFragment(svgMarkup, className) {
    var temp = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    temp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="' + className + '">' + svgMarkup + "</svg>";
    var frag = document.createDocumentFragment();
    var child = temp.firstChild;
    while (child) {
      frag.appendChild(child);
      child = child.nextSibling;
    }
    return frag;
  }
  /*
   * A version of elementFromPoint() that restricts the point to the viewport
   */
  function elementFromPoint(x, y) {
    var maxX = innerWidth - 1, maxY = innerHeight - 1;
    x = Math.min(maxX, Math.max(0, x));
    y = Math.min(maxY, Math.max(0, y));
    return document.elementFromPoint(x, y);
  }
  /**
   * Defines if the element given contains vertical scroll.
   * @param el HTMLObject
   */
  function hasVertScroll(el) {
    return el.clientHeight < el.scrollHeight;
  }
  function getBulletWidth(listElement, style) {
    var MONOSPACE_BULLET_TYPES = {
      circle: 1,
      square: 1,
      disc: 1,
      none: 1
    }, bulletType = style.listStyleType, ems = 2.5;
    // Browsers seem to use max of 2.5 em for bullet width -- use as a default
    if (MONOSPACE_BULLET_TYPES.hasOwnProperty(bulletType)) {
      ems = 1.6;
    } else {
      if ("decimal" === bulletType) {
        var start = parseInt(listElement.getAttribute("start"), 10), end = (start || 1) + listElement.childElementCount - 1;
        ems = .9 + .5 * end.toString().length;
      }
    }
    return getEmsToPx(style.fontSize, ems);
  }
  function getEmsToPx(fontSize, ems) {
    // Create a div to measure the number of px in an em with this font-size
    var px, measureDiv = document.createElement("div");
    document.body.appendChild(measureDiv);
    inlineStyle.set(measureDiv, {
      fontSize: fontSize,
      width: ems + "em",
      visibility: "hidden"
    });
    // Multiply by zoom because our <div> is not affected by the document's current zoom level
    px = measureDiv.clientWidth;
    document.body.removeChild(measureDiv);
    return px;
  }
  function getComputedScale(elem) {
    var style = getComputedStyle(elem), transform = style.transform;
    return parseFloat(transform.substring(7)) || 1;
  }
  return {
    isWhitespaceOrPunct: isWhitespaceOrPunct,
    isVisualRegion: isVisualRegion,
    hasRaisedZIndex: hasRaisedZIndex,
    isSprite: isSprite,
    hasOwnBackground: hasOwnBackground,
    hasOwnBackgroundColor: hasOwnBackgroundColor,
    hasVisibleContent: hasVisibleContent,
    isEmptyBgImage: isEmptyBgImage,
    createSVGFragment: createSVGFragment,
    elementFromPoint: elementFromPoint,
    hasVertScroll: hasVertScroll,
    getBulletWidth: getBulletWidth,
    getEmsToPx: getEmsToPx,
    getComputedScale: getComputedScale
  };
});

sitecues.define("page/zoom/state", [], function() {
  var state = {
    completedZoom: 1,
    // Current zoom as of the last finished operation
    fixedZoom: 1,
    // Restricted zoom for fixed elements
    currentTargetZoom: 1,
    // Zoom we are aiming for in the current operation
    startZoomTime: 0,
    // If no current zoom operation, this is cleared (0 or undefined)
    isInitialLoadZoom: false,
    // Is this the initial zoom for page load? (The one based on previous user settings)
    hasFormsToFix: null,
    zoomInput: {}
  };
  Object.defineProperties(state, {
    // How many milliseconds have elapsed since the start of the zoom operation?
    elapsedZoomTime: {
      enumerable: true,
      get: function() {
        if (state.startZoomTime) {
          return Date.now() - state.startZoomTime;
        }
        return 0;
      }
    }
  });
  return state;
});

sitecues.define("page/zoom/constants", [], function() {
  var constants = {};
  constants.MS_PER_X_ZOOM_GLIDE = 1400;
  // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
  constants.MS_PER_X_ZOOM_SLIDER = 500;
  // For click in slider
  constants.ZOOM_PRECISION = 3;
  // Decimal places allowed
  constants.KEYFRAMES_ID = "sc-keyframes-zoom";
  constants.ZOOM_TARGETS_ID = "sc-zoom-targets";
  constants.ANIMATION_END_EVENTS = "animationend webkitAnimationEnd MSAnimationEnd";
  constants.MIN_RECT_SIDE = 4;
  constants.ANIMATION_OPTIMIZATION_SETUP_DELAY = 20;
  // Provide extra time to set up compositor layer if a key is pressed
  constants.CLEAR_ANIMATION_OPTIMIZATION_DELAY = 7e3;
  // After zoom, clear the will-change property if no new zoom occurs within this amount of time
  constants.UNPINCH_END_DELAY = 150;
  constants.REPAINT_FOR_CRISP_TEXT_DELAY = 100;
  // This is conjured out of thin air. Just seems to work.
  constants.CRISPING_ATTRIBUTE = "data-sc-crisp";
  constants.ZOOM_TARGET_ATTR = "data-sc-zoom-target";
  constants.ZOOM_TARGET_SELECTOR = "[" + constants.ZOOM_TARGET_ATTR + "]";
  constants.ZOOM_TARGET_ID = "sitecues-zoom-targets";
  constants.SITECUES_ZOOM_ID = "sitecues-js-zoom";
  constants.SITECUES_ZOOM_FORMS_ID = "sitecues-js-zoom-form-fix";
  constants.UNPINCH_FACTOR = .015;
  // How much the unpinch delta affects zoom
  constants.MAX_ZOOM = 3;
  constants.MIN_ZOOM = 1;
  constants.ZOOM_STEP = .01;
  constants.MIN_ZOOM_PER_CLICK = .2;
  // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider
  constants.ZOOM_RANGE = constants.MAX_ZOOM - constants.MIN_ZOOM;
  constants.GLIDE_CHANGE_INTERVAL_MS = 30;
  // How often to call back with a new zoom value
  return constants;
});

sitecues.define("page/zoom/config/config", [ "$", "run/conf/site" ], function($, site) {
  var // Default zoom configuration
  config = {
    // Can be customized via provideCustomConfig()
    // Should smooth zoom animations be enabled?
    provideCustomZoomConfig: provideCustomZoomConfig,
    init: init
  };
  Object.defineProperties(config, {
    shouldRestrictWidth: {
      enumerable: true,
      get: function() {
        return config.isFluid;
      }
    }
  });
  // Allow customization of zoom configuration on a per-website basis
  function provideCustomZoomConfig(customZoomConfig) {
    $.extend(config, customZoomConfig);
  }
  function init() {
    $.extend(config, {
      // Does the web page use a fluid layout, where content wraps to the width?
      isFluid: site.get("isFluid"),
      // Can override in site preferences
      // Should the width of the page be restricted as zoom increases?
      // This is helpful for pages that try to word-wrap or use a fluid layout.
      // Eventually use fast page health calculation to automatically determine this
      // Assumes window width of 1440 (maximized screen on macbook)
      maxZoomToRestrictWidthIfFluid: site.get("maxRewrapZoom") || 1.5,
      // Set to 5 on sites where the words get too close to the left window's edge
      leftMarginOffset: site.get("leftMarginOffset") || 2,
      // Visible content containers for understanding left margin of page, or undefined to auto-detect,
      // The first one found will be used to determine the body's geometry.
      // e.g. '#pageWrapper, body>table'
      visibleRoots: site.get("visibleRoots")
    });
  }
  return config;
});

sitecues.define("page/viewport/viewport", [ "run/dom-events" ], function(domEvents) {
  var refreshFlags = {}, cachedWindowValues = {};
  function getWindowProperty(property) {
    if ("undefined" === typeof cachedWindowValues[property] || refreshFlags[property]) {
      cachedWindowValues[property] = window[property];
      refreshFlags[property] = false;
    }
    return cachedWindowValues[property];
  }
  function getPageXOffset() {
    return getWindowProperty("pageXOffset");
  }
  function getPageYOffset() {
    return getWindowProperty("pageYOffset");
  }
  function getInnerWidth() {
    return getWindowProperty("innerWidth");
  }
  function getInnerHeight() {
    return getWindowProperty("innerHeight");
  }
  function getOuterWidth() {
    return getWindowProperty("outerWidth");
  }
  function getOuterHeight() {
    return getWindowProperty("outerHeight");
  }
  function getPageOffsets() {
    return {
      x: getPageXOffset(),
      y: getPageYOffset()
    };
  }
  function getInnerDimensions() {
    return {
      width: getInnerWidth(),
      height: getInnerHeight()
    };
  }
  function getOuterDimensions() {
    return {
      width: getOuterWidth(),
      height: getOuterHeight()
    };
  }
  // After the user's initial zoom we need to realign any location hash target to the top of the screen
  function jumpToLocationHash() {
    var hash = location.hash, EXTRA_SPACE_SCROLL_TOP = 60;
    if (!hash) {
      return;
    }
    try {
      // Not all ids are necessarily valid -- protect against that
      var elem = document.querySelector(hash + ',[name="' + hash.substring(1) + '"]');
      if (elem) {
        elem.scrollIntoView(true);
        window.scrollBy(0, -EXTRA_SPACE_SCROLL_TOP);
      }
    } catch (ex) {}
  }
  function init() {
    domEvents.on(window, "scroll", function() {
      refreshFlags.pageXOffset = true;
      refreshFlags.pageYOffset = true;
    });
    domEvents.on(window, "resize", function() {
      cachedWindowValues = {};
    });
  }
  return {
    getPageOffsets: getPageOffsets,
    getPageXOffset: getPageXOffset,
    getPageYOffset: getPageYOffset,
    getInnerDimensions: getInnerDimensions,
    getInnerWidth: getInnerWidth,
    getInnerHeight: getInnerHeight,
    getOuterDimensions: getOuterDimensions,
    getOuterWidth: getOuterWidth,
    getOuterHeight: getOuterHeight,
    jumpToLocationHash: jumpToLocationHash,
    init: init
  };
});

sitecues.define("page/zoom/util/restrict-zoom", [ "page/zoom/constants", "page/zoom/config/config" ], function(constants, config) {
  var MAX_FIXED_ZOOM = 1.8, MAX = constants.MAX_ZOOM, MIN = constants.MIN_ZOOM, ZOOM_PRECISION = constants.ZOOM_PRECISION;
  // Make sure the zoom value is within the min and max, and does not use more decimal places than we allow
  function toValidRange(value) {
    value = parseFloat(value);
    // value is too small
    if (!value || value < MIN) {
      return MIN;
    }
    // value is too big
    if (value > MAX) {
      return MAX;
    }
    // value have float value
    return parseFloat(value.toFixed(ZOOM_PRECISION));
  }
  // This is the zoom that we will still restrict the width
  function forFluidWidth(currZoom) {
    // Adjust max zoom for width restrictions for current window width
    // The max zoom for width restriction is set for a specific size of window
    // We use a maximized window on a MacBook pro retina screen (1440px wide)
    // The default is to restrict width up to a max of 1.35x zoom
    // If the user's window is 75% of the 1440px, we multiply the max zoom by .75
    var maxZoomToRestrictWidth = Math.max(1, config.maxZoomToRestrictWidthIfFluid * (window.innerWidth / 1440));
    return Math.min(currZoom, maxZoomToRestrictWidth);
  }
  function forFixedZoomTarget(completedZoom) {
    return Math.min(MAX_FIXED_ZOOM, completedZoom);
  }
  return {
    toValidRange: toValidRange,
    forFluidWidth: forFluidWidth,
    forFixedZoomTarget: forFixedZoomTarget
  };
});

sitecues.define("page/zoom/util/body-geometry", [ "$", "page/util/common", "page/zoom/config/config", "page/zoom/constants", "page/zoom/state", "page/zoom/util/restrict-zoom", "page/viewport/viewport", "run/dom-events", "run/events", "run/inline-style/inline-style" ], function($, common, config, constants, state, restrictZoom, viewport, domEvents, events, inlineStyle) {
  var body, $origBody, docElem, doDebugVisibleRects, originalBodyInfo, // The info we have on the body, including the rect and mainNode
  currentBodyInfo, isInitialized = false, callbacks = [], cachedDocumentScrollWidth = null, cachedDocumentScrollHeight = null, MIN_RECT_SIDE = constants.MIN_RECT_SIDE, ZOOM_PRECISION = constants.ZOOM_PRECISION;
  // This is the body's currently visible width, with zoom factored in
  function getBodyWidth() {
    // Use the originally measured visible body width
    init();
    // If width was restricted
    var divisorUsedToRestrictWidth = config.shouldRestrictWidth ? restrictZoom.forFluidWidth(state.completedZoom) : 1;
    // Multiply be the amount of zoom currently used
    return state.completedZoom * originalBodyInfo.width / divisorUsedToRestrictWidth;
  }
  function getBodyRight() {
    init();
    return originalBodyInfo.right * state.completedZoom;
  }
  function getBodyLeft() {
    init();
    return originalBodyInfo.leftMostNode.getBoundingClientRect().left + viewport.getPageXOffset();
  }
  function getMainNode() {
    init();
    return originalBodyInfo.mainNode;
  }
  // Is it a fluid layout?
  function isFluidLayout() {
    if (originalBodyInfo.width === viewport.getOuterWidth()) {
      // Handle basic case -- this works for duxburysystems.com, where the visible body content
      // spans the entire width of the available space
      return true;
    }
    // We consider it fluid if the main node we discovered inside the body changes width
    // if we change the body's width.
    var newWidth, isFluid, origWidth = originalBodyInfo.mainNode.clientWidth;
    inlineStyle.override(body, {
      width: viewport.getInnerWidth() / 5 + "px"
    });
    newWidth = originalBodyInfo.mainNode.clientWidth;
    isFluid = origWidth !== newWidth;
    inlineStyle.restore(body, "width");
    return isFluid;
  }
  // Get the rect for visible contents in the body, and the main content node
  function computeBodyInfo() {
    var mainNode, leftMostNode, // Everything else will be smaller
    rightMostNode, bodyInfo = {}, visibleNodes = [], mainNodeRect = {
      width: 0,
      height: 0
    }, leftMostCoord = 9999, rightMostCoord = 0, startNode = $(config.visibleRoots)[0] || body, MIN_WIDTH_MAIN_NODE = 300, bodyStyle = getComputedStyle(body);
    getBodyRectImpl(startNode, bodyInfo, visibleNodes, bodyStyle, true);
    if (!visibleNodes.length) {
      getBodyRectImpl(startNode, bodyInfo, visibleNodes, bodyStyle);
    }
    bodyInfo.width = bodyInfo.right - bodyInfo.left;
    bodyInfo.height = bodyInfo.bottom - bodyInfo.top;
    // Find tallest node
    visibleNodes.forEach(function(node) {
      var rect = node.rect;
      if (rect.height >= mainNodeRect.height && rect.width > MIN_WIDTH_MAIN_NODE) {
        if (rect.height > mainNodeRect.height || rect.width > mainNodeRect.width) {
          mainNodeRect = rect;
          mainNode = node.domNode;
        }
      }
      if (rect.left < leftMostCoord) {
        leftMostNode = node.domNode;
        leftMostCoord = rect.left;
      }
      if (rect.right > rightMostCoord) {
        rightMostNode = node.domNode;
        rightMostCoord = rect.right;
      }
    });
    bodyInfo.mainNode = mainNode || document.body;
    bodyInfo.leftMostNode = leftMostNode;
    bodyInfo.rightMostNode = rightMostNode;
    bodyInfo.transformOriginX = body.getBoundingClientRect().width / 2;
    return bodyInfo;
  }
  function willAddRect(newRect, node, style, parentStyle, isStrict) {
    if (node === document.body) {
      return;
    }
    // Strict checks
    if (isStrict) {
      if (0 === node.childNodes.length || newRect.width < MIN_RECT_SIDE || newRect.height < MIN_RECT_SIDE || // Watch for text-align: center or -webkit-center -- these items mess us up
      style.textAlign.indexOf("center") >= 0) {
        return;
      }
    }
    // Must check
    if (newRect.left < 0 || newRect.top < 0 || "visible" !== style.visibility) {
      return;
    }
    // Good heuristic -- when x > 0 it tends to be a useful rect
    if (newRect.left > 0) {
      return true;
    }
    // newRect.left === 0
    // We usually won't these rectangles flush up against the left margin,
    // but will add them if there are visible children.
    // If we added them all the time we would often have very large left margins.
    // This rule helps get left margin right on duxburysystems.com.
    if ("visible" !== style.overflow || !common.hasVisibleContent(node, style, parentStyle)) {
      return;
    }
    return true;
  }
  // Recursively look at rectangles and add them if they are useful content rectangles
  function getBodyRectImpl(node, sumRect, visibleNodes, parentStyle, isStrict) {
    var newRect = getAbsoluteRect(node), style = getComputedStyle(node);
    if (willAddRect(newRect, node, style, parentStyle, isStrict)) {
      if (doDebugVisibleRects && node.nodeType === Node.ELEMENT_NODE) {
        inlineStyle.set(node, {
          outline: "9px solid rgba(0,255,0,.5)",
          outlineOffset: "-5px"
        });
      }
      addRect(sumRect, newRect);
      visibleNodes.push({
        domNode: node,
        rect: newRect
      });
      return;
    }
    $(node).children().each(function() {
      //For some reason, Edge will run this function despite there not being any element children belonging to the element. Edge...
      //TODO: Remove this conditional if Edge ever gets its act together. Reproducible here: www.njstatelib.org
      //NOTE: Does not reproduce when the console is open. Yeah that was a fun one to figure out
      if (this.nodeType === Node.ELEMENT_NODE) {
        getBodyRectImpl(this, sumRect, visibleNodes, style, isStrict);
      }
    });
  }
  // Add the rectangle to the sum rect if it is visible and has a left margin > 0
  function addRect(sumRect, newRect) {
    if (isNaN(sumRect.left) || newRect.left < sumRect.left) {
      sumRect.left = newRect.left;
    }
    if (isNaN(sumRect.right) || newRect.right > sumRect.right) {
      sumRect.right = newRect.right;
    }
    if (isNaN(sumRect.top) || newRect.top < sumRect.top) {
      sumRect.top = newRect.top;
    }
    if (isNaN(sumRect.bottom) || newRect.bottom > sumRect.bottom) {
      sumRect.bottom = newRect.bottom;
    }
  }
  // Gets the absolute rect of a node
  // Does not use getBoundingClientRect because we need size to include overflow
  function getAbsoluteRect(node) {
    var clientRect = node.getBoundingClientRect(), pageOffsets = viewport.getPageOffsets(), width = clientRect.width, //  Math.max(node.scrollWidth, clientRect.width),
    height = Math.max(node.scrollHeight, clientRect.height), left = clientRect.left + pageOffsets.x, top = clientRect.top + pageOffsets.y;
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height
    };
  }
  // Return a formatted string for translateX as required by CSS
  function getFormattedTranslateX(targetZoom) {
    if (config.shouldRestrictWidth) {
      return "";
    }
    var zoomOriginX = Math.max(viewport.getInnerWidth(), originalBodyInfo.transformOriginX) / 2, // X-coordinate origin of transform
    bodyLeft = originalBodyInfo.left, halfOfBody = (zoomOriginX - bodyLeft) * targetZoom, pixelsOffScreenLeft = halfOfBody - zoomOriginX + config.leftMarginOffset, pixelsToShiftRight = Math.max(0, pixelsOffScreenLeft), translateX = pixelsToShiftRight / targetZoom;
    // Need to shift entire zoom image to the right so that start of body fits on screen
    return "translateX(" + translateX.toFixed(ZOOM_PRECISION) + "px)";
  }
  // Get the desired width of the body for the current level of zoom
  function getRestrictedBodyWidth(currZoom) {
    // For a short period of time, we tried the following, in a commit that suggested it helped reduce horizontal panning.
    // However, that change led to SC-3191
    //var winWidth = originalBodyInfo.width;
    return viewport.getInnerWidth() / restrictZoom.forFluidWidth(currZoom) + "px";
  }
  // Return cached body info or undefined if unknown
  function getOriginalBodyInfo() {
    return originalBodyInfo;
  }
  function getCurrentBodyInfo() {
    if (!currentBodyInfo) {
      currentBodyInfo = computeBodyInfo();
    }
    return currentBodyInfo;
  }
  function invalidateBodyInfo() {
    currentBodyInfo = null;
  }
  function getScrollWidth(isOnResize) {
    if (null === cachedDocumentScrollWidth || isOnResize) {
      cachedDocumentScrollWidth = docElem.scrollWidth;
    }
    return cachedDocumentScrollWidth;
  }
  function getScrollHeight(isOnResize) {
    if (null === cachedDocumentScrollHeight || isOnResize) {
      cachedDocumentScrollHeight = docElem.scrollHeight;
    }
    return cachedDocumentScrollHeight;
  }
  function refreshOriginalBodyInfo() {
    originalBodyInfo = computeBodyInfo();
    currentBodyInfo = originalBodyInfo;
  }
  function executeCallbacks() {
    callbacks.forEach(function(callback) {
      callback();
    });
    callbacks = [];
  }
  // Scroll content to maximize the use of screen real estate, showing as much content as possible.
  // In effect, stretch the bottom-right corner of the visible content down and/or right
  // to meet the bottom-right corner of the window.
  function maximizeContentVisibility() {
    var bodyRight = getOriginalBodyInfo().rightMostNode.getBoundingClientRect().right, // Actual right coord of visible content
    bodyHeight = getScrollHeight(), winWidth = viewport.getInnerWidth(), winHeight = viewport.getInnerHeight(), hScrollNow = viewport.getPageXOffset(), vScrollNow = viewport.getPageYOffset(), // How much do we need to scroll by to pull content to the bottom-right corner
    hScrollDesired = Math.max(0, winWidth - bodyRight), // Amount to pull right as a positive number
    vScrollDesired = Math.max(0, winHeight - bodyHeight), // Amount to pull down as a positive number
    // Don't scroll more than we actually can
    hScroll = Math.min(hScrollNow, hScrollDesired), vScroll = Math.min(vScrollNow, vScrollDesired);
    window.scrollBy(-hScroll, -vScroll);
  }
  // Ensure that initial body info is ready
  function init(callback) {
    if (isInitialized) {
      if (callback) {
        callback();
      }
      return;
    } else {
      if (callback) {
        callbacks.push(callback);
      }
    }
    // We expect <body> to be defined now, but we're being defensive
    // (perhaps future extension will init and call us very early).
    if (document.body) {
      isInitialized = true;
      body = document.body;
      docElem = document.documentElement;
      $origBody = $(body);
      refreshOriginalBodyInfo();
      executeCallbacks();
      domEvents.on(window, "resize", function() {
        cachedDocumentScrollHeight = null;
        cachedDocumentScrollWidth = null;
      });
      events.on("zoom", function() {
        cachedDocumentScrollHeight = null;
        cachedDocumentScrollWidth = null;
      });
      return;
    }
    // No document.body yet
    if ("loading" !== document.readyState) {
      init(callback);
    } else {
      document.addEventListener("DOMContentLoaded", function() {
        init(callback);
      });
    }
  }
  sitecues.debugVisibleRects = function() {
    doDebugVisibleRects = true;
    computeBodyInfo();
  };
  return {
    isFluidLayout: isFluidLayout,
    getBodyWidth: getBodyWidth,
    getRestrictedBodyWidth: getRestrictedBodyWidth,
    getBodyRight: getBodyRight,
    getBodyLeft: getBodyLeft,
    getMainNode: getMainNode,
    getOriginalBodyInfo: getOriginalBodyInfo,
    getCurrentBodyInfo: getCurrentBodyInfo,
    invalidateBodyInfo: invalidateBodyInfo,
    getScrollWidth: getScrollWidth,
    getScrollHeight: getScrollHeight,
    refreshOriginalBodyInfo: refreshOriginalBodyInfo,
    getFormattedTranslateX: getFormattedTranslateX,
    maximizeContentVisibility: maximizeContentVisibility,
    init: init
  };
});

sitecues.define("page/zoom/combo-boxes", [ "run/events", "page/zoom/state", "run/inline-style/inline-style", "run/util/array-utility", "run/platform", "mini-core/native-global" ], function(events, state, inlineStyle, arrayUtil, platform, nativeGlobal) {
  var comboBoxListener, zoomStyleSheet, selector = 'select[size="1"],select:not([size])';
  function listenForNewComboBoxes(records) {
    records.some(function(record) {
      var addedNodes = arrayUtil.from(record.addedNodes);
      return addedNodes.some(function(node) {
        if ("select" === node.localName || "function" === typeof node.getElementsByTagName && node.getElementsByTagName("select")[0]) {
          fixAllSelectElements();
          return true;
        }
      });
    });
  }
  function fixSelectElement(element, zoom) {
    var appearance;
    if (platform.browser.isWebKit) {
      appearance = "-webkit-appearance";
    } else {
      appearance = "";
    }
    inlineStyle.override(element, [ "transition", "all 0s" ]);
    inlineStyle.restore(element, [ "font-size", "width", "height", "transform", "transform-origin", appearance ]);
    if (1 === zoom) {
      inlineStyle.restore(element, "transition");
      // We don't need to fix combo boxes if we aren't zooming
      return;
    }
    var fontSize, styles = {}, computedStyle = getComputedStyle(element);
    if (platform.browser.isFirefox) {
      // setting the em font size to the scale factor seems to work well
      fontSize = 1 + .8 * (zoom - 1);
      // Select elements in Firefox misposition their drop down menus if their ancestors are scaled, so we apply the inverse transform
      // and bump up the width as needed. The height of the element grows to contain the font size automatically
      styles.transform = "scale(" + 1 / zoom + ")";
      var parent = element.parentElement;
      if (parent && "inline" === getComputedStyle(parent).display) {
        // If the containing element is inline, we should try to keep it grouped with the rest of the line (important for Fairfield Bank)
        styles.transformOrigin = "100% 75%";
      } else {
        styles.transformOrigin = "0 75%";
      }
    } else {
      // Arbitrary scale so that font size of the drop down items grow with the zoom
      fontSize = 1 + .3 * (zoom - 1);
    }
    // Allow the element to auto-adjust to size of the font
    styles.height = "initial";
    styles.width = "initial";
    styles.fontSize = fontSize + "em";
    if ("menulist" === computedStyle[appearance]) {
      // Menulist styles prevent certain css styles from taking effect, in this case width and height
      styles[appearance] = "menulist-button";
    }
    inlineStyle.override(element, styles);
    nativeGlobal.setTimeout(function() {
      // If we reapply the transition style in the same synchronous block, it animates our changes
      inlineStyle.restore(element, "transition");
    }, 0);
  }
  function fixAllSelectElements() {
    var elements = arrayUtil.from(document.body.querySelectorAll(selector));
    elements.forEach(function(element) {
      fixSelectElement(element, state.completedZoom);
    });
  }
  function init() {
    if (platform.browser.isIE) {
      // We don't need to fix combo boxes in IE
      return;
    }
    comboBoxListener = new MutationObserver(listenForNewComboBoxes);
    comboBoxListener.observe(document.body, {
      childList: true,
      subtree: true
    });
    zoomStyleSheet = document.createElement("style");
    fixAllSelectElements();
    events.on("zoom", function() {
      nativeGlobal.setTimeout(function() {
        fixAllSelectElements();
      }, 0);
    });
  }
  return {
    init: init
  };
});

// This module assists with transforming elements with transition styles
sitecues.define("page/util/transition-util", [ "run/inline-style/inline-style", "run/util/array-utility", "mini-core/native-global" ], function(inlineStyle, arrayUtil, nativeGlobal) {
  function disableTransformTransition(element) {
    var duration, style = getComputedStyle(element), property = style.transitionProperty, delay = style.transitionDelay.split(",").some(function(dly) {
      return parseFloat(dly);
    });
    if (!delay) {
      duration = style.transitionDuration.split(",").some(function(drtn) {
        return parseFloat(drtn);
      });
    }
    if (!delay && !duration) {
      return;
    }
    if (property.indexOf("all") >= 0 || property.indexOf("transform") >= 0) {
      var transitionValue = inlineStyle(element).transition;
      if (transitionValue) {
        transitionValue += ", ";
      }
      transitionValue += "transform 0s";
      inlineStyle.override(element, {
        transition: transitionValue
      });
    }
  }
  function applyInstantTransform(elmnts, transform) {
    var elements = arrayUtil.wrap(elmnts);
    elements.forEach(disableTransformTransition);
    inlineStyle.override(elements, [ "transform", transform ]);
    nativeGlobal.setTimeout(function() {
      elements.forEach(restoreTransition);
    }, 0);
  }
  function restoreTransition(element) {
    inlineStyle.restore(element, "transition");
  }
  return {
    applyInstantTransform: applyInstantTransform,
    disableTransformTransition: disableTransformTransition,
    restoreTransition: restoreTransition
  };
});

//animation gets its own stylesheet for zoom targets
//be sure to create a new animation just for the primary body's width
//stylesheet for body fixes,
sitecues.define("page/zoom/style", [ "$", "run/platform", "page/zoom/state", "page/zoom/constants", "page/zoom/util/body-geometry", "page/zoom/config/config", "mini-core/native-global", "run/inline-style/inline-style", "page/zoom/combo-boxes", "page/util/transition-util" ], function($, platform, state, constants, bodyGeo, config, nativeGlobal, inlineStyle, comboBoxes, transitionUtil) {
  var body, $zoomStyleSheet, // <style> element we insert to correct form issues in WebKit
  // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
  shouldOptimizeLegibility, // Should we repaint when zoom is finished (after any animations)?
  // Should always be true in Chrome, because it makes text crisper
  // Don't use backface repainting method if there is a background-image on the <body>, because it will be erased.
  // (We still want to use the backface method when we can, because it often produces better results than our
  // other method, which is to overlay a transparent div and then remove it)
  shouldRepaintOnZoomChange, // Key frame animations
  SITECUES_ZOOM_ID = constants.SITECUES_ZOOM_ID, CRISPING_ATTRIBUTE = constants.CRISPING_ATTRIBUTE, MAX = constants.MAX_ZOOM, MIN = constants.MIN_ZOOM, // Decimal places allowed
  ZOOM_PRECISION = constants.ZOOM_PRECISION, KEYFRAMES_ID = constants.KEYFRAMES_ID, // This is conjured out of thin air. Just seems to work.
  REPAINT_FOR_CRISP_TEXT_DELAY = constants.REPAINT_FOR_CRISP_TEXT_DELAY;
  // Create <style> for keyframes animations
  // For initial zoom, call with the targetZoom
  // Otherwise, it will create a reverse (zoom-out) and forward (zoom-in) style sheet
  //This needs to set up a keyframe stylesheet for each zoom target
  /*
    * Each zoom target will need to calculate a desired zoom level:
    *   a. Primary body, 0th zoom target, will calculate full zoom range and translate x / width animations as necessary
    *   b. each succeeding zoom target will use its calculated zoom level (depending on ratio of dimensions to screen size)
    * */
  //instead of taking target zoom on the initial zoom stylesheet, just take a boolean clarifying if it is
  //the initial zoom or not
  function setupNextZoomStyleSheet(targetZoom, doUseKeyFrames) {
    var css = "";
    if (doUseKeyFrames) {
      if (targetZoom) {
        // Style sheet to zoom exactly to targetZoom
        css = getAnimationCSS(targetZoom);
      } else {
        if (state.completedZoom > MIN) {
          // Style sheet for reverse zoom (zoom-out to 1x)
          css += getAnimationCSS(MIN);
        }
        if (state.completedZoom < MAX) {
          // Style sheet for forward zoom (zoom-in to 3x)
          css += getAnimationCSS(MAX);
        }
      }
    }
    css += getCssCrispingFixes();
    applyZoomStyleSheet(css);
  }
  // Replace current zoom stylesheet or insert a new one with the
  // requested styles plus generic stylesheet fixes for the current configuration.
  function applyZoomStyleSheet(additionalCss) {
    var styleSheetText = additionalCss || "";
    if (styleSheetText) {
      if ($zoomStyleSheet) {
        $zoomStyleSheet.text(styleSheetText);
      } else {
        $zoomStyleSheet = $("<style>").text(styleSheetText).attr("id", SITECUES_ZOOM_ID).appendTo("head");
      }
    }
  }
  // This is used to repaint the DOM after a zoom in WebKit to ensure crisp text
  function getCssCrispingFixes() {
    if (shouldRepaintOnZoomChange) {
      return "\n[" + CRISPING_ATTRIBUTE + "] * { backface-visibility: hidden; }\n";
    }
    return "";
  }
  function getCssKeyFrames(targetZoom, doEase, doIncludeTimePercent) {
    var timePercent, animationPercent, step = 0, // For animation performance, use adaptive algorithm for number of keyframe steps:
    // Bigger zoom jump = more steps
    numSteps = Math.ceil(20 * Math.abs(targetZoom - state.completedZoom)), percentIncrement = 1 / numSteps, keyFrames = [];
    for (;step <= numSteps; ++step) {
      timePercent = step === numSteps ? 1 : step * percentIncrement;
      if (doEase) {
        // Provide simple sinusoidal easing in out effect for initial load zoom
        animationPercent = (Math.cos(Math.PI * timePercent) - 1) / -2;
      } else {
        animationPercent = timePercent;
      }
      var midAnimationZoom = state.completedZoom + (targetZoom - state.completedZoom) * animationPercent;
      keyFrames[step] = getZoomCss(midAnimationZoom);
      if (doIncludeTimePercent) {
        keyFrames[step].timePercent = timePercent;
      }
    }
    return keyFrames;
  }
  function getCssAnimationName(targetZoom) {
    return KEYFRAMES_ID + "-" + Math.round(1e3 * state.completedZoom) + "-" + Math.round(1e3 * targetZoom);
  }
  // Get keyframes css for animating from completed zoom to target zoom
  function getAnimationCSS(targetZoom) {
    var animationName = getCssAnimationName(targetZoom), keyFramesCssProperty = platform.browser.isWebKit ? "@-webkit-keyframes " : "@keyframes ", keyFramesCss = animationName + " {\n", keyFrames = getCssKeyFrames(targetZoom, state.isInitialLoadZoom, true), numSteps = keyFrames.length - 1, step = 0;
    for (;step <= numSteps; ++step) {
      var keyFrame = keyFrames[step], zoomCssString = "transform: " + keyFrame.transform + (keyFrame.width ? "; width: " + keyFrame.width : "");
      keyFramesCss += Math.round(1e4 * keyFrame.timePercent) / 100 + "% { " + zoomCssString + " }\n";
    }
    keyFramesCss += "}\n\n";
    return keyFramesCssProperty + keyFramesCss;
  }
  // Get a CSS object for the targetZoom level
  //This needs to return the formatted translate x / width only when we're zooming the primary body
  function getZoomCss(targetZoom) {
    var css = {
      transform: "scale(" + targetZoom.toFixed(ZOOM_PRECISION) + ") " + bodyGeo.getFormattedTranslateX(targetZoom)
    };
    if (config.shouldRestrictWidth) {
      css.width = bodyGeo.getRestrictedBodyWidth(targetZoom);
    }
    return css;
  }
  // Add useful zoom fixes to the body's @style
  function fixZoomBodyCss() {
    // Allow the content to be horizontally centered, unless it would go
    // offscreen to the left, in which case start zooming the content from the left-side of the window
    inlineStyle.override(body, [ "transformOrigin", config.shouldRestrictWidth ? "0 0" : "50% 0" ]);
    if (shouldOptimizeLegibility) {
      inlineStyle.override(body, {
        textRendering: "optimizeLegibility"
      });
    }
  }
  /**
   * repaintToEnsureCrispText's purpose is to render text clearly in browsers (chrome only)
   * that do not repaint the DOM when using CSS Transforms.  This function simply sets a
   * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
   * 15ms of time is required, because the browser may not be done transforming
   * by the time Javascript is executed without the setTimeout.
   *
   * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
   */
  function repaintToEnsureCrispText() {
    if (!shouldRepaintOnZoomChange) {
      return;
    }
    var $anyBody = $("body");
    // Make sure we get clone body as well, if present
    $anyBody.attr(CRISPING_ATTRIBUTE, "");
    nativeGlobal.setTimeout(function() {
      $anyBody.removeAttr(CRISPING_ATTRIBUTE);
    }, REPAINT_FOR_CRISP_TEXT_DELAY);
    var MAX_ZINDEX = 2147483647, $appendedDiv = $("<sc>");
    inlineStyle.set($appendedDiv[0], {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      opacity: 1,
      backgroundColor: "transparent",
      zIndex: MAX_ZINDEX,
      pointerEvents: "none"
    });
    $appendedDiv.appendTo("html");
    nativeGlobal.setTimeout(function() {
      $appendedDiv.remove();
    }, 0);
  }
  //Restore the intended inline style when we're done transforming the body
  function restoreBodyTransitions() {
    transitionUtil.restoreTransition(body);
  }
  //If there is a transition style applied to the body, we need to be sure that it doesn't apply to transformations
  //otherwise our zoom logic will break
  function fixBodyTransitions() {
    transitionUtil.disableTransformTransition(body);
  }
  function getZoomStyleSheet() {
    return $zoomStyleSheet;
  }
  function init() {
    body = document.body;
    shouldRepaintOnZoomChange = platform.browser.isChrome;
    shouldOptimizeLegibility = platform.browser.isChrome && platform.os.isWin;
    comboBoxes.init();
  }
  return {
    setupNextZoomStyleSheet: setupNextZoomStyleSheet,
    getZoomCss: getZoomCss,
    getZoomStyleSheet: getZoomStyleSheet,
    fixZoomBodyCss: fixZoomBodyCss,
    getCssAnimationName: getCssAnimationName,
    repaintToEnsureCrispText: repaintToEnsureCrispText,
    fixBodyTransitions: fixBodyTransitions,
    restoreBodyTransitions: restoreBodyTransitions,
    init: init
  };
});

/**
 * This module forces the showing or hiding of document scrollbars (CSS overflow for <html>) when:
 * - Zooming in IE
 * - Transforming elements in the positioner, and we're aware of the need add scrollbars
 *   (in some cases a fixed element will reach farther than the original body content, and the browser may incorrectly
 *   determine the scrollbars)
 */
sitecues.define("page/viewport/scrollbars", [ "run/platform", "page/viewport/viewport", "mini-core/native-global", "page/zoom/util/body-geometry", "run/inline-style/inline-style" ], function(platform, viewport, nativeGlobal, bodyGeo, inlineStyle) {
  var mainBodyRect, docElem, shouldComputeMainBodyScrollbars, doForceHorizScrollbar, doForceVertScrollbar, finalizeScrollbarsTimer, isInitialized, // CSS overflow to use when we aren't forcing a scrollbar
  defaultOverflowX, defaultOverflowY;
  function onBodyRectChange() {
    if (shouldComputeMainBodyScrollbars) {
      determineScrollbars();
    }
  }
  function forceScrollbars(doTransformOnHorizontalScroll, doTransformOnVerticalScroll) {
    doForceHorizScrollbar = doTransformOnHorizontalScroll;
    doForceVertScrollbar = doTransformOnVerticalScroll;
    determineScrollbars();
  }
  function isBodyTooWide() {
    if (mainBodyRect) {
      var right = Math.max(mainBodyRect.right, mainBodyRect.width);
      return right > viewport.getInnerWidth();
    }
  }
  function isBodyTooTall() {
    if (mainBodyRect) {
      var bottom = Math.max(mainBodyRect.bottom, mainBodyRect.height);
      return bottom > viewport.getInnerHeight();
    }
  }
  function setOverflow(overflowX, overflowY) {
    var docStyle = inlineStyle(docElem);
    if (docStyle.overflowX !== overflowX) {
      inlineStyle.override(docElem, {
        overflowX: overflowX
      });
    }
    if (docStyle.overflowY !== overflowY) {
      inlineStyle.override(docElem, {
        overflowY: overflowY
      });
    }
  }
  // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
  // of knowing when the visible content is large enough to need scrollbars.
  // This also corrects the dreaded IE scrollbar bug, where fixed position content
  // and any use of getBoundingClientRect() was off by the height of the horizontal scrollbar, or the
  // width of the vertical scroll bar, but only when the user scrolled down or to the right.
  // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
  // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
  function determineScrollbars() {
    var docStyle = inlineStyle(docElem);
    mainBodyRect = bodyGeo.getCurrentBodyInfo();
    // -- Clear the scrollbars --
    if (shouldComputeMainBodyScrollbars) {
      defaultOverflowX = defaultOverflowY = "hidden";
    } else {
      defaultOverflowX = docStyle.overflowX;
      defaultOverflowY = docStyle.overflowY;
    }
    // -- Set the scrollbars after a delay --
    // If the right side of the visible content is beyond the window width,
    // or the visible content is wider than the window width, show the scrollbars.
    // Doing this after a timeout fixes SC-3722 for some reason -- the toolbar was moving up and down by the height
    // of the horizontal scrollbar. It's as if doing it on a delay gives IE/Edge a chance to
    // deal with zoom first, and then scrollbars separately
    // The delay also allows us to collect several concurrent requests and handle them once.
    clearTimeout(finalizeScrollbarsTimer);
    var doUseHorizScrollbar = doForceHorizScrollbar || isBodyTooWide(), doUseVertScrollbar = doForceVertScrollbar || isBodyTooTall(), newOverflowX = doUseHorizScrollbar ? "scroll" : defaultOverflowX, newOverflowY = doUseVertScrollbar ? "scroll" : defaultOverflowY;
    if (newOverflowX !== docStyle.overflowX || newOverflowY !== docStyle.overflowY) {
      if (shouldComputeMainBodyScrollbars) {
        // MS browsers need to reset first, otherwise causes SC-3722
        setOverflow("hidden", "hidden");
      }
      finalizeScrollbarsTimer = nativeGlobal.setTimeout(function() {
        setOverflow(newOverflowX, newOverflowY);
      }, 0);
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // IE/Edge don't know when to put in scrollbars after CSS transform
    // Edge does, but we need to do this because of SC-3722 -- jiggling of Sitecues toolbar during vertical scrolls
    shouldComputeMainBodyScrollbars = platform.browser.isMS;
    docElem = document.documentElement;
  }
  return {
    onBodyRectChange: onBodyRectChange,
    forceScrollbars: forceScrollbars,
    init: init
  };
});

/*jshint -W072 */
//Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
sitecues.define("page/zoom/animation", [ "$", "run/conf/preferences", "run/platform", "run/events", "run/metric/metric", "run/errors", "page/util/common", "page/zoom/state", "page/zoom/constants", "page/zoom/config/config", "page/viewport/viewport", "page/zoom/util/body-geometry", "page/zoom/util/restrict-zoom", "page/zoom/style", "page/viewport/scrollbars", "mini-core/native-global", "run/inline-style/inline-style" ], function($, pref, platform, events, metric, errors, common, state, constants, config, viewport, bodyGeo, restrictZoom, style, scrollbars, nativeGlobal, inlineStyle) {
  var isInitialized, body, $origBody, // Zoom operation state
  minZoomChangeTimer, // Keep zooming at least for this long, so that a glide does a minimum step
  zoomAnimator, // Frame request ID that can be cancelled
  elementDotAnimatePlayer, // AnimationPlayer used in some browsers (element.animate)
  // Zoom slider change listener
  thumbChangeListener, // Supports a single listener that is called back as animation proceeds
  glideChangeTimer, // State to help with animation optimizations and will-change
  zoomBeginTimer, // Timer before zoom can actually begin (waiting for browser to create composite layer)
  // Finish the glide if no more key down events during this period
  edgeKeyGlideTimer, // Should we use the Web Animations API (element.animate) ?
  shouldUseElementDotAnimate, // Timer used for callbacks
  // Function to call for requesting an animation frame
  requestFrame = window.requestAnimationFrame, EDGE_CONTINUE_KEY_GLIDE_WAIT_MS = 500, // Constants
  // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider
  MIN_ZOOM_PER_CLICK = constants.MIN_ZOOM_PER_CLICK, // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
  MS_PER_X_ZOOM_GLIDE = constants.MS_PER_X_ZOOM_GLIDE, // For click in slider
  MS_PER_X_ZOOM_SLIDER = constants.MS_PER_X_ZOOM_SLIDER, // How often to call back with a new zoom value
  GLIDE_CHANGE_INTERVAL_MS = constants.GLIDE_CHANGE_INTERVAL_MS, ANIMATION_END_EVENTS = constants.ANIMATION_END_EVENTS;
  // Must be called to set up any type of zoom operation
  function beginZoomOperation(targetZoom, input, animationReadyCallback) {
    if (isZoomOperationRunning()) {
      errors.report(new Error("zoom begin repeated"));
    }
    // Initialize zoom input info
    state.zoomInput = $.extend({
      isSlider: false,
      // Slider in panel
      isSliderDrag: false,
      // True if the user drags the slider (as opposed to clicking in it)
      isSliderClick: false,
      // True if the user dragged the slider and now stopped
      isLongGlide: false,
      // Key or A button held down to glide extra
      isKey: false,
      isButtonPress: false,
      // Small or large A in panel
      isUnpinch: false,
      // Trackpad unpinch
      isCtrlWheel: false,
      // Ctrl+mousewheel
      // isFirstBadgeUse: undefined,     // If first badge use? Not defined if this is not originating from the badge
      fromZoom: state.completedZoom
    }, input);
    // Make sure we're ready
    bodyGeo.init();
    style.fixBodyTransitions();
    // Ensure no other operation is running
    clearZoomCallbacks();
    state.currentTargetZoom = restrictZoom.toValidRange(targetZoom);
    // Add what we need in <style> if we haven't already
    if (!style.getZoomStyleSheet()) {
      style.setupNextZoomStyleSheet(state.currentTargetZoom, shouldUseKeyFramesAnimation());
    }
    // Correct the start zoom time with the real starting time
    state.startZoomTime = Date.now();
    var $body = $("body");
    // Temporarily indicate that zooming is in progress -- this is used by the sitecues-zoom-form-fix stylesheet
    $body.attr("data-sc-zooming", "");
    inlineStyle.override($body.get(), {
      // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
      pointerEvents: "none"
    });
    events.emit("zoom/begin");
    if (animationReadyCallback) {
      animationReadyCallback();
    }
  }
  // Begin an operation to the glide toward the current zoom, if smooth zoom is currently supported.
  // If no smooth zoom, apply an instant zoom change to increase or decrease zoom by a constant amount.
  // If we are zooming with +/- or clicking A/a
  function beginGlide(targetZoom, event, inputInfo) {
    if (targetZoom === state.completedZoom) {
      return;
    }
    if (!isZoomOperationRunning()) {
      var input = inputInfo || {};
      if (event) {
        if (event.keyCode) {
          // TODO should we differentiate between Enter on A/a vs +/- ?
          input.isKey = true;
          input.isBrowserKeyOverride = event.ctrlKey || event.metaKey;
        } else {
          input.isButtonPress = true;
        }
      }
      input.isLongGlide = true;
      // Default, assume glide will not be cut off early
      beginZoomOperation(targetZoom, input, beginGlideAnimation);
      // Provide callback for when animation can actually start
      $(window).one("keyup", finishGlideIfEnough);
    }
    if (platform.browser.isEdge && event && event.keyCode) {
      // SC-3615: Microsoft Edge not always firing keyup! Still true as of Edge 14 beta.
      // We must simulate something close to a keyup with a timer.
      // The timer will keep resetting as long as key repeat is active. The zoom glide
      // will end shortly after the last keydown event.
      clearTimeout(edgeKeyGlideTimer);
      edgeKeyGlideTimer = nativeGlobal.setTimeout(finishGlideIfEnough, EDGE_CONTINUE_KEY_GLIDE_WAIT_MS);
    }
    function beginGlideAnimation() {
      glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
      if (!state.zoomInput.isLongGlide) {
        // Button/key was already released, zoom only for long enough to get minimum zoom
        var delta = MIN_ZOOM_PER_CLICK * (state.completedZoom < targetZoom ? 1 : -1);
        state.currentTargetZoom = restrictZoom.toValidRange(state.completedZoom + delta);
        minZoomChangeTimer = nativeGlobal.setTimeout(finishZoomOperation, MIN_ZOOM_PER_CLICK * getMsPerXZoom());
      }
      if (shouldUseElementDotAnimate) {
        performElementDotAnimateZoomOperation();
      } else {
        if (shouldUseKeyFramesAnimation()) {
          performKeyFramesZoomOperation();
        } else {
          performJsAnimateZoomOperation();
        }
      }
    }
  }
  // Cancel any currently requested animation frame
  function cancelFrame() {
    window.cancelAnimationFrame(zoomAnimator);
  }
  // Continual slider updates
  // This matches our updates with screen refreshes.
  // Unfortunately, it causes issues in some older versions of Firefox on Mac + Retina.
  function performContinualZoomUpdates() {
    zoomAnimator = requestFrame(performContinualZoomUpdates);
    performInstantZoomOperation();
    state.completedZoom = state.currentTargetZoom;
  }
  function finishZoomSliderOperation() {
    // ---- Slider drag ----
    if (state.zoomInput.isSliderDrag) {
      cancelFrame();
      finishZoomOperation();
      return;
    }
    // ---- Slider click ----
    // Is in the middle of gliding to a zoom click -- this always uses JS.
    // Let it finish -- the animation's end will cause finishZoomOperation() to be called
    state.zoomInput.isSliderClick = true;
  }
  // If smooth zoom is used, which kind -- JS or CSS keyframes?
  // In dev, we can override default behavior as follows:
  // Shift-key: Script-based
  // Ctrl-key: CSS-based
  function shouldUseKeyFramesAnimation() {
    var restrictingWidthInSafari = platform.browser.isSafari && config.shouldRestrictWidth;
    // IE/Edge are working better with JS animation (keyframes even taking too long to start/stop, not really smoother)
    // Safari is herky jerky if animating the width and using key frames
    return !platform.browser.isMS && !restrictingWidthInSafari && !shouldUseElementDotAnimate;
  }
  // Animate until the currentTargetZoom, used for gliding zoom changes
  // Use falsey value for isTargetZoomStable for slider zoom, where the
  // target keeps changing as the slider moves
  function performJsAnimateZoomOperation() {
    function jsZoomStep() {
      // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
      var midAnimationZoom = getMidAnimationZoom();
      inlineStyle.override($origBody[0], style.getZoomCss(midAnimationZoom));
      if (midAnimationZoom === state.currentTargetZoom && !isSliderActive()) {
        zoomAnimator = requestFrame(finishZoomOperation);
      } else {
        zoomAnimator = requestFrame(jsZoomStep);
      }
    }
    zoomAnimator = requestFrame(jsZoomStep);
  }
  // This is used for the following types of zoom:
  // * Initial load zoom
  // * Keypress (+/-) or A button press, which zoom until the button is let up
  function performKeyFramesZoomOperation() {
    //This needs to get the transform animation, and apply it to zoom targets
    //It also needs to get the width animation, and apply it to the primary body
    //body:first-child { width animation }
    var zoomSpeedMs = Math.abs(state.currentTargetZoom - state.completedZoom) * getMsPerXZoom(), //the animation names need to be tied to the specific keyframes (primary body vs. other zoom targets)
    //perhaps we should include zoom target index, with the 0th index always being the primary body
    animationCss = {
      animation: style.getCssAnimationName(state.currentTargetZoom) + " " + zoomSpeedMs + "ms linear",
      animationPlayState: "running",
      fillMode: "forwards"
    };
    // Apply the new CSS
    inlineStyle.override($origBody[0], animationCss);
    // No zoomStopRequested() received for initial zoom
    $origBody.one(ANIMATION_END_EVENTS, onGlideStopped);
  }
  function getAnimationKeyFrames(targetZoom, doEase, doIncludeTimePercent) {
    var timePercent, animationPercent, step = 0, // For animation performance, use adaptive algorithm for number of keyframe steps:
    // Bigger zoom jump = more steps
    numSteps = Math.ceil(20 * Math.abs(targetZoom - state.completedZoom)), percentIncrement = 1 / numSteps, keyFrames = [];
    for (;step <= numSteps; ++step) {
      timePercent = step === numSteps ? 1 : step * percentIncrement;
      if (doEase) {
        // Provide simple sinusoidal easing in out effect for initial load zoom
        animationPercent = (Math.cos(Math.PI * timePercent) - 1) / -2;
      } else {
        animationPercent = timePercent;
      }
      var midAnimationZoom = state.completedZoom + (targetZoom - state.completedZoom) * animationPercent;
      keyFrames[step] = style.getZoomCss(midAnimationZoom);
      if (doIncludeTimePercent) {
        keyFrames[step].timePercent = timePercent;
      }
    }
    return keyFrames;
  }
  // Go directly to zoom. Do not pass go. But do collect the $200 anyway.
  function performInstantZoomOperation() {
    var zoomCss = style.getZoomCss(state.currentTargetZoom);
    if (platform.browser.isChrome && body.animate) {
      // Magically, this works with the new crisper (and the new crisper doesn't kill mouse events on floats ...)
      if (elementDotAnimatePlayer) {
        elementDotAnimatePlayer.cancel();
      }
      elementDotAnimatePlayer = body.animate([ zoomCss, zoomCss ], {
        duration: 1,
        iterations: 1,
        fill: "forwards"
      });
    } else {
      inlineStyle.override($origBody[0], zoomCss);
    }
    if (thumbChangeListener) {
      thumbChangeListener(state.currentTargetZoom);
    }
  }
  function performElementDotAnimateZoomOperation() {
    var animationMs = Math.abs(state.currentTargetZoom - state.completedZoom) * MS_PER_X_ZOOM_GLIDE;
    elementDotAnimatePlayer = body.animate(getAnimationKeyFrames(state.currentTargetZoom), {
      duration: animationMs,
      iterations: 1,
      fill: "forwards",
      easing: state.isInitialLoadZoom ? "ease-out" : "linear"
    });
    elementDotAnimatePlayer.onfinish = onGlideStopped;
  }
  function isSliderActive() {
    return state.zoomInput.isSlider && !state.zoomInput.isSliderClick;
  }
  // Are we in the middle of a zoom operation?
  function isZoomOperationRunning() {
    return state.startZoomTime;
  }
  function isGlideCurrentlyRunning() {
    return glideChangeTimer;
  }
  function getMsPerXZoom() {
    return state.zoomInput.isSlider ? MS_PER_X_ZOOM_SLIDER : MS_PER_X_ZOOM_GLIDE;
  }
  // Get what the zoom value would be if we stopped the animation now
  function getMidAnimationZoom() {
    var totalZoomChangeRequested = Math.abs(state.currentTargetZoom - state.completedZoom), zoomDirection = state.currentTargetZoom > state.completedZoom ? 1 : -1, zoomChange = state.elapsedZoomTime / getMsPerXZoom();
    if (zoomChange > totalZoomChangeRequested) {
      zoomChange = totalZoomChangeRequested;
    }
    return restrictZoom.toValidRange(state.completedZoom + zoomDirection * zoomChange);
  }
  // Helper for calling back glide change listener
  function onGlideChange() {
    if (thumbChangeListener) {
      thumbChangeListener(getMidAnimationZoom());
    }
  }
  function onGlideStopped() {
    if (elementDotAnimatePlayer) {
      // If we don't do this, then setting CSS directly on body no longer works
      // (May not have been cancelled if user holds + and reaches 3 or holds - and reaches 1)
      elementDotAnimatePlayer.cancel();
      elementDotAnimatePlayer = null;
    }
    var styles = style.getZoomCss(state.currentTargetZoom);
    styles.animation = "";
    inlineStyle.override($origBody[0], styles);
    finishZoomOperation();
  }
  // Must be called at the end of a zoom operation.
  function finishZoomOperation() {
    var $body = $("body");
    if (!isZoomOperationRunning()) {
      errors.report(new Error("zoom finish before start"));
    }
    bodyGeo.invalidateBodyInfo();
    if (elementDotAnimatePlayer) {
      // Can't leave animation player around, as it will prevent future animations
      inlineStyle.override($origBody[0], style.getZoomCss(state.currentTargetZoom));
      elementDotAnimatePlayer.onfinish = null;
      elementDotAnimatePlayer.cancel();
    }
    var didUnzoom = state.completedZoom > state.currentTargetZoom;
    state.completedZoom = getActualZoom();
    state.fixedZoom = restrictZoom.forFixedZoomTarget(state.completedZoom);
    state.startZoomTime = 0;
    if (didUnzoom) {
      bodyGeo.maximizeContentVisibility();
    }
    // Remove and re-add scrollbars -- we will re-add them after zoom if content is large enough
    // Only determine scrollbars for IE
    scrollbars.onBodyRectChange();
    // Restore mouse cursor events and CSS behavior
    inlineStyle.override($body.get(), {
      pointerEvents: ""
    });
    // Indicate that zooming has finished -- this is used by the sitecues-zoom-form-fix stylesheet
    nativeGlobal.setTimeout(function() {
      $("body").removeAttr("data-sc-zooming");
    }, 0);
    // notify all about zoom change
    events.emit("zoom", state.completedZoom);
    if (!state.isInitialLoadZoom) {
      pref.set("zoom", state.completedZoom);
      if (!didUnzoom) {
        sitecues.require([ "audio-cues/audio-cues" ], function(audioCues) {
          audioCues.playZoomCue(state.completedZoom);
        });
      }
      if ("{}" === nativeGlobal.JSON.stringify(state.zoomInput)) {
        errors.report(new Error("zoom metric empty details"));
      }
      new metric.ZoomChange(state.zoomInput).send();
    }
    clearZoomCallbacks();
    if (state.isInitialLoadZoom) {
      viewport.jumpToLocationHash();
    }
    state.isInitialLoadZoom = false;
    state.zoomInput = {};
    // Get next forward/backward glide animations ready.
    // Doing it now helps with performance, because stylesheet will be parsed and ready for next zoom.
    nativeGlobal.setTimeout(style.setupNextZoomStyleSheet, 0, null, shouldUseKeyFramesAnimation());
    style.restoreBodyTransitions();
    if (1 === state.completedZoom) {
      // Fixed elements are broken when we apply a transformation, and it takes work for us to correct that, so we remove the transformation
      // from the body when possible
      inlineStyle.restore(body, "transform");
    }
    // Un-Blur text in Chrome
    if (platform.browser.isChrome) {
      style.repaintToEnsureCrispText();
    }
  }
  function cancelGlideChangeTimer() {
    if (glideChangeTimer) {
      clearInterval(glideChangeTimer);
      glideChangeTimer = 0;
    }
  }
  // Make sure the current zoom operation does not continue
  function clearZoomCallbacks() {
    // Ensure no further changes to zoom from this operation
    cancelFrame();
    clearTimeout(minZoomChangeTimer);
    clearTimeout(zoomBeginTimer);
    clearTimeout(edgeKeyGlideTimer);
    cancelGlideChangeTimer();
    $origBody.off(ANIMATION_END_EVENTS, onGlideStopped);
    $(window).off("keyup", finishGlideIfEnough);
  }
  // When an A button or +/- key is pressed, we always glide at least MIN_ZOOM_PER_CLICK.
  // This provides a consistent amount of zoom change for discrete presses.
  function finishGlideIfEnough() {
    if (!isGlideCurrentlyRunning()) {
      // Glide has started, but animation hasn't started yet -- we are waiting for
      // the ANIMATION_OPTIMIZATION_SETUP_DELAY period while the browser sets up for the animation.
      state.zoomInput.isLongGlide = false;
      // beginGlideAnimation() will see this and setup it's own timer
      return;
    }
    // If MIN_ZOOM_PER_CLICK has not been reached, we set a timer to finish the zoom
    // based on how much time would be needed to achieve MIN_ZOOM_PER_CLICK
    var timeRemaining = Math.max(0, MIN_ZOOM_PER_CLICK * getMsPerXZoom() - state.elapsedZoomTime);
    state.zoomInput.isLongGlide = 0 === timeRemaining;
    minZoomChangeTimer = nativeGlobal.setTimeout(finishGlideEarly, timeRemaining);
  }
  function freezeZoom() {
    state.currentTargetZoom = getActualZoom();
    inlineStyle.override($origBody[0], style.getZoomCss(state.currentTargetZoom));
    if (elementDotAnimatePlayer) {
      elementDotAnimatePlayer.onfinish = null;
      elementDotAnimatePlayer.cancel();
    }
    onGlideStopped();
  }
  function finishElementDotAnimate() {
    // We have to stop it like this so that we keep the current amount of zoom in the style attribute,
    // while the animation player is stopped so that it doesn't block future style attribute changes
    // from taking affect (e.g. via the slider)
    requestFrame(function() {
      if (elementDotAnimatePlayer) {
        elementDotAnimatePlayer.pause();
      }
      requestFrame(freezeZoom);
    });
  }
  // A glide operation is finishing. Use the current state of the zoom animation for the final zoom amount.
  function finishGlideEarly() {
    cancelGlideChangeTimer();
    // Stop element.animate player
    if (elementDotAnimatePlayer) {
      finishElementDotAnimate();
      return;
    }
    // JS zoom operation
    if (!shouldUseKeyFramesAnimation()) {
      state.currentTargetZoom = getMidAnimationZoom();
      finishZoomOperation();
      return;
    }
    // Stop key frames or element.animate
    zoomAnimator = requestFrame(function() {
      // Stop the key-frame animation at the current zoom level
      // Yes, it's crazy, but this sequence helps the zoom stop where it is supposed to, and not jump back a little
      inlineStyle.override($origBody[0], {
        animationPlayState: "paused"
      });
      zoomAnimator = requestFrame(function() {
        state.currentTargetZoom = getActualZoom();
        onGlideStopped();
      });
    });
  }
  // Get the current zoom value as reported by the layout engine
  function getActualZoom() {
    return restrictZoom.toValidRange(common.getComputedScale(body));
  }
  function updateSlider() {
    if (thumbChangeListener) {
      glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
    }
  }
  function chooseZoomStrategy() {
    zoomAnimator = requestFrame(performContinualZoomUpdates);
  }
  // Allow one listener for all zoom updates, even mid-animation.
  // These occur when the user holds down A, a, +, - (as opposed to conf.set and the 'zoom' event which occur at the end)
  // Currently only supports one listener.
  // It has to be fast, otherwise it will affect zoom performance.
  function setThumbChangeListener(listener) {
    thumbChangeListener = listener;
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    viewport.init();
    //This module is initialized after body has been parsed
    body = document.body;
    $origBody = $(body);
    shouldUseElementDotAnimate = platform.browser.isChrome && body.animate;
  }
  return {
    beginZoomOperation: beginZoomOperation,
    beginGlide: beginGlide,
    performInstantZoomOperation: performInstantZoomOperation,
    performJsAnimateZoomOperation: performJsAnimateZoomOperation,
    isZoomOperationRunning: isZoomOperationRunning,
    finishZoomOperation: finishZoomOperation,
    finishZoomSliderOperation: finishZoomSliderOperation,
    finishGlideIfEnough: finishGlideIfEnough,
    updateSlider: updateSlider,
    chooseZoomStrategy: chooseZoomStrategy,
    cancelFrame: cancelFrame,
    cancelGlideChangeTimer: cancelGlideChangeTimer,
    setThumbChangeListener: setThumbChangeListener,
    init: init
  };
});

sitecues.define("page/zoom/flash", [ "run/events", "page/zoom/state", "run/conf/urls", "run/util/array-utility", "run/inline-style/inline-style" ], function(events, state, urls, arrayUtil, inlineStyle) {
  var flashObserver, dimensionsMap = new WeakMap(), observedDocuments = new WeakMap();
  function isInteger(number) {
    return !isNaN(number) && Math.floor(number) === number;
  }
  function onDocumentMutation(mutations) {
    mutations.forEach(function(mutation) {
      arrayUtil.from(mutation.addedNodes).forEach(function(node) {
        if (isFlashElement(node)) {
          fixFlashElements(node);
        }
      });
    });
  }
  function observeDocument(document) {
    if (observedDocuments.get(document)) {
      return;
    }
    var opts = {
      subtree: true,
      childList: true
    };
    flashObserver.observe(document, opts);
  }
  function fixFlashElements(documentOrElement) {
    var elements;
    if (documentOrElement) {
      elements = documentOrElement.nodeType === Node.ELEMENT_NODE ? [ documentOrElement ] : findFlashElements(documentOrElement);
    } else {
      elements = findFlashElements();
    }
    function setDimension(element, dimension, value, unit) {
      if (isInteger(value)) {
        element.setAttribute(dimension, value + unit);
      }
    }
    elements.forEach(function(element) {
      var zoomReciprocal = 1 / state.completedZoom, ancestor = element.parentElement;
      while (!isTransformable(ancestor)) {
        ancestor = ancestor.parentElement;
      }
      var styles = {};
      styles.transform = "scale(" + zoomReciprocal + ")";
      styles.transformOrigin = "0 0";
      inlineStyle.override(ancestor, styles);
      var originalDimensions = dimensionsMap.get(element) || {}, originalWidth = originalDimensions.width, originalHeight = originalDimensions.height, width = element.getAttribute("width"), height = element.getAttribute("height"), widthMatch = width.match(/[^0-9\.]+/), heightMatch = height.match(/[^0-9\.]+/), widthUnit = widthMatch ? widthMatch[0] : "", heightUnit = heightMatch ? heightMatch[0] : "";
      if ("undefined" === typeof originalWidth) {
        width = parseInt(width);
        height = parseInt(height);
        // Rounding `null` coerces to zero, so we use a string here
        originalDimensions.width = isNaN(width) ? "null" : width;
        originalDimensions.height = isNaN(height) ? "null" : height;
        dimensionsMap.set(element, originalDimensions);
      } else {
        width = originalWidth;
        height = originalHeight;
      }
      width = Math.round(width * state.completedZoom);
      height = Math.round(height * state.completedZoom);
      setDimension(element, "width", width, widthUnit);
      setDimension(element, "height", height, heightUnit);
    });
  }
  function findFlashElements(document) {
    var embedSelector = "object, embed", frameSelector = "iframe, frame", embedElements = [], documentsToSearch = [ document || getHighestPermittedDocument() ];
    function getHighestPermittedDocument() {
      var docRef, refSucceeded = false, highestWindow = window, document = window.document;
      while (highestWindow !== highestWindow.parent) {
        try {
          // wrapped in a try block to avoid cross-origin Errors halting the script
          docRef = highestWindow.parent.document;
          refSucceeded = true;
        } catch (e) {}
        if (refSucceeded) {
          highestWindow = highestWindow.parent;
          document = docRef;
          refSucceeded = false;
        } else {
          break;
        }
      }
      return document;
    }
    function searchDocument(document) {
      var nestedFrames = Array.prototype.slice.call(document.querySelectorAll(frameSelector), 0);
      embedElements = embedElements.concat(Array.prototype.slice.call(document.querySelectorAll(embedSelector)));
      observeDocument(document);
      nestedFrames.forEach(function(frame) {
        if (!frame.src || urls.isSameOrigin(frame.src)) {
          documentsToSearch.push(frame.contentDocument);
        }
      });
    }
    while (documentsToSearch.length) {
      searchDocument(documentsToSearch.shift());
    }
    return embedElements.filter(isFlashElement);
  }
  function isFlashElement(element) {
    if ("application/x-shockwave-flash" === element.type) {
      return true;
    }
    var swfSrc = element.src && element.src.indexOf("swf") >= 0, swfData = element.data && element.data.indexOf("swf") >= 0;
    return swfSrc || swfData;
  }
  function isTransformable(element) {
    return [ "object", "embed", "param" ].indexOf(element.localName) === -1;
  }
  function init() {
    flashObserver = new MutationObserver(onDocumentMutation);
    events.on("zoom", function() {
      fixFlashElements();
    });
  }
  return {
    init: init
  };
});

/**
 * Smooth zoom
 * See docs at https://equinox.atlassian.net/wiki/display/EN/Smooth+Zoom
 */
sitecues.define("page/zoom/zoom", [ "$", "run/conf/preferences", "run/events", "run/modifier-key-state", "page/zoom/animation", "page/zoom/util/body-geometry", "page/zoom/state", "page/zoom/constants", "page/zoom/config/config", "page/zoom/util/restrict-zoom", "page/zoom/style", "page/viewport/scrollbars", "mini-core/native-global", "page/zoom/flash", "run/inline-style/inline-style" ], /*jshint -W072 */
//Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
function($, pref, events, modifierKeyState, animation, bodyGeo, state, constants, config, restrictZoom, style, scrollbars, nativeGlobal, flash, inlineStyle) {
  var isInitialized, // Is the zoom module already initialized?
  isReady, // Are the dependencies initialized
  $origBody, body, unpinchEndTimer, UNPINCH_FACTOR = constants.UNPINCH_FACTOR, UNPINCH_END_DELAY = constants.UNPINCH_END_DELAY, MAX = constants.MAX_ZOOM, MIN = constants.MIN_ZOOM;
  // ------------------------ PUBLIC -----------------------------
  // Is this the zoom that occurs on page load?
  function getIsInitialZoom() {
    return state.isInitialLoadZoom;
  }
  function beginZoomIncrease(event, inputInfo) {
    // Increase up to max or until zoomStopRequested()
    animation.beginGlide(MAX, event, inputInfo);
  }
  function beginZoomDecrease(event, inputInfo) {
    animation.beginGlide(MIN, event, inputInfo);
  }
  function getCompletedZoom() {
    return state.completedZoom;
  }
  // Use to jump the current zoom immediately to the targetZoom requested
  // The use case for this is currently the zoom slider
  function jumpTo(targetZoom, inputInfo) {
    if (!animation.isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      animation.beginZoomOperation(targetZoom, $.extend({}, inputInfo, {
        isSlider: true
      }));
      // Get ready for more slider updates
      if (targetZoom !== state.completedZoom) {
        animation.performJsAnimateZoomOperation();
        animation.updateSlider();
      }
    } else {
      if (!state.zoomInput.isSliderDrag) {
        // 2nd call -- cancel glide and begin continual updates
        animation.cancelFrame();
        animation.cancelGlideChangeTimer();
        state.zoomInput.isSliderDrag = true;
        animation.chooseZoomStrategy();
      }
      // 3rd and subsequent calls, just update the target zoom value
      // so that the continual update loop uses the new value
      state.currentTargetZoom = restrictZoom.toValidRange(targetZoom);
    }
  }
  function resetZoom() {
    if (state.completedZoom > 1) {
      animation.beginZoomOperation(1, {});
      animation.performInstantZoomOperation();
      animation.finishZoomOperation();
    }
  }
  // We capture ctrl+wheel events because those are actually pinch/unpinch events
  function onMouseWheel(event) {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    function getWheelEventInputInfo() {
      return modifierKeyState.isCtrlKeyDown() ? {
        isCtrlWheel: true
      } : {
        isUnpinch: true
      };
    }
    var delta = -event.deltaY * UNPINCH_FACTOR, targetZoom = animation.isZoomOperationRunning() ? state.currentTargetZoom + delta : state.completedZoom + delta;
    clearTimeout(unpinchEndTimer);
    unpinchEndTimer = nativeGlobal.setTimeout(animation.finishZoomOperation, UNPINCH_END_DELAY);
    if (!animation.isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      animation.beginZoomOperation(targetZoom, getWheelEventInputInfo());
    }
    state.currentTargetZoom = restrictZoom.toValidRange(targetZoom);
    // Change target
    animation.performInstantZoomOperation();
  }
  function zoomStopRequested() {
    if (animation.isZoomOperationRunning()) {
      if (state.zoomInput.isSlider) {
        animation.finishZoomSliderOperation();
      } else {
        // "A" button or +/- keypress
        animation.finishGlideIfEnough();
      }
    }
  }
  function performInitialLoadZoom(initialZoom) {
    var targetZoom = restrictZoom.toValidRange(initialZoom);
    if (1 === targetZoom) {
      return;
    }
    if (!isReady) {
      // Wait until <body> is ready
      // This can happen in the case of extension which loads very fast
      // In the future, extension may try to zoom sooner rather than waiting for entire document to load
      events.on("zoom/ready", function() {
        performInitialLoadZoom(targetZoom);
      });
      // Zoom once badge is ready
      return;
    }
    state.isInitialLoadZoom = true;
    animation.beginGlide(targetZoom);
  }
  /**
   * Recompute the visible body size, and re-zoom the page as that handles the logic
   * to properly scale, resize, and position the page and its elements with respect to the current
   * sizes of the body and window.
   */
  function onResize() {
    if (!$origBody) {
      return;
    }
    inlineStyle.restore(body, [ "width", "transform" ]);
    bodyGeo.refreshOriginalBodyInfo();
    inlineStyle.override(body, style.getZoomCss(state.completedZoom));
    if (config.shouldRestrictWidth) {
      // Restrict the width of the body so that it works similar to browser zoom
      // Documents designed to fit the width of the page still will
      inlineStyle.override(body, {
        width: bodyGeo.getRestrictedBodyWidth(state.completedZoom)
      });
    }
    bodyGeo.invalidateBodyInfo();
    // TODO computeBodyInfo() is doing a lot of work that refreshBodyInfo() did -- at least it should share which nodes to iterate over
    scrollbars.onBodyRectChange();
    events.emit("resize");
  }
  function bodyGeometryInitialized(wheelEvent) {
    scrollbars.init();
    style.init();
    animation.init();
    flash.init();
    //This callback will only be called when body is parsed
    body = document.body;
    $origBody = $(body);
    // Use pref module for sharing current zoom level value
    pref.defineHandler("zoom", restrictZoom.toValidRange);
    // ATKratter wouldn't scroll when we listened to this on the window
    document.addEventListener("wheel", onMouseWheel);
    // Ctrl+wheel = unpinch
    if ("undefined" === typeof config.isFluid) {
      config.isFluid = bodyGeo.isFluidLayout();
    }
    $(window).on("resize", onResize);
    style.fixZoomBodyCss();
    // Get it read as soon as zoom might be used
    if (wheelEvent) {
      onMouseWheel(wheelEvent);
    }
    isReady = true;
    events.emit("zoom/ready");
  }
  function init(wheelEvent) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    config.init();
    bodyGeo.init(function() {
      bodyGeometryInitialized(wheelEvent);
    });
  }
  return {
    getIsInitialZoom: getIsInitialZoom,
    jumpTo: jumpTo,
    beginZoomIncrease: beginZoomIncrease,
    beginZoomDecrease: beginZoomDecrease,
    getCompletedZoom: getCompletedZoom,
    resetZoom: resetZoom,
    zoomStopRequested: zoomStopRequested,
    performInitialLoadZoom: performInitialLoadZoom,
    init: init
  };
});

// Functionality for resetting Sitecues or turning it off
sitecues.define("page/reset/reset", [ "page/zoom/zoom", "run/conf/preferences" ], function(zoomMod, pref) {
  function resetZoom() {
    zoomMod.resetZoom();
  }
  function resetAudio(callback) {
    sitecues.require([ "audio/audio" ], function(audio) {
      audio.init();
      audio.setSpeechState(false, true);
      audio.stopAudio();
      if (callback) {
        callback();
      }
    });
  }
  function resetMinorSettings() {
    pref.reset();
  }
  function resetAll() {
    resetZoom();
    resetAudio(resetMinorSettings);
  }
  function init() {
    // Redefine (previously exported as noop function when Sitecues was off)
    sitecues.reset = resetAll;
  }
  return {
    resetZoom: resetZoom,
    resetAudio: resetAudio,
    resetMinorSettings: resetMinorSettings,
    resetAll: resetAll,
    init: init
  };
});

/**
 * The trait cache stores style and rect information for given nodes, relative to
 * a given zoom and window size. If these view metrics change, the cache must be invalidated.
 * Call checkViewHasChanged() before using the cache, if it is likely that the view has changed.
 * Note: the traitcache keeps a unique ID for each element, via $(data) with the key 'sc'
 * This unique ID can be used for other caches (for example the pickedItemsCache in pick.js uses it).
 */
sitecues.define("page/highlight/traitcache", [ "$", "page/zoom/zoom" ], function($, zoomMod) {
  var uniqueIdCounter = 0, styleCache = {}, rectCache = {}, cachedViewSize = {
    // If any of these view size metrics change, we must invalidate the cache
    height: null,
    width: null,
    zoom: null
  }, // Scrolling does not invalidate the cache
  cachedViewPosition = {
    x: 0,
    y: 0
  };
  // ------- PUBLIC ----------
  // Call this before using cache if view may have changed
  function resetCache() {
    updateCachedViewSize();
    updateCachedViewPosition();
    styleCache = {};
    rectCache = {};
  }
  function updateCachedViewPosition() {
    var pageXOffset = window.pageXOffset, pageYOffset = window.pageYOffset;
    if (cachedViewPosition.x !== pageXOffset || cachedViewPosition.y !== pageYOffset) {
      cachedViewPosition.x = pageXOffset;
      cachedViewPosition.y = pageYOffset;
      return true;
    }
  }
  function getCachedViewPosition() {
    return cachedViewPosition;
  }
  function getCachedViewSize() {
    return cachedViewSize;
  }
  // Can be used in the context of the highlighter, as the picker caches these values (expensive to get from browser)
  function getStyle(element) {
    var id = getUniqueId(element), style = styleCache[id];
    if (!style) {
      style = window.getComputedStyle(element);
      styleCache[id] = style;
    }
    return style;
  }
  // Convenience method to get one cached style trait
  function getStyleProp(element, propName) {
    var styleObj = getStyle(element);
    return styleObj[propName];
  }
  // Get rectangle in SCREEN coordinates
  function getScreenRect(element) {
    var rect = $.extend({}, getRect(element)), top = cachedViewPosition.y, left = cachedViewPosition.x;
    rect.top -= top;
    rect.bottom -= top;
    rect.left -= left;
    rect.right -= left;
    return rect;
  }
  // Get rectangle in DOCUMENT coordinates
  function getRect(element) {
    var id = getUniqueId(element), rect = rectCache[id];
    if (!rect) {
      // Copy rect object into our own object so we can modify values
      if (true && !element.getBoundingClientRect) {
        console.log("Error in traitcache#getRect");
        console.log(element);
        console.trace();
      }
      rect = $.extend({}, element.getBoundingClientRect());
      // Use the scroll height when the overflow is visible, as it shows the full height
      if ("visible" === getStyleProp(element, "overflowY") && !parseFloat(getStyleProp(element, "borderRightWidth"))) {
        var scrollHeight = element.scrollHeight;
        if (scrollHeight > 1 && scrollHeight > element.clientHeight) {
          rect.height = Math.max(rect.height, scrollHeight * cachedViewSize.zoom);
        }
      }
      // Use the scroll width when the overflow is visible, as it shows the full height
      if ("visible" === getStyleProp(element, "overflowX") && !parseFloat(getStyleProp(element, "borderBottomWidth"))) {
        rect.width = Math.max(rect.width, element.scrollWidth * cachedViewSize.zoom);
      }
      // Add scroll values so that rectangles are not invalid after user scrolls.
      // This effectively makes them absolutely positioned rects vs. fixed.
      // This means we're caching the rectangle relative to the top-left of the document.
      var scrollTop = cachedViewPosition.y, scrollLeft = cachedViewPosition.x;
      rect.top += scrollTop;
      rect.left += scrollLeft;
      rect.bottom = rect.top + rect.height;
      rect.right = rect.left + rect.width;
      // Store results in cache
      rectCache[id] = rect;
    }
    return rect;
  }
  // Hidden for any reason? Includes offscreen or dimensionless, or tiny (if doTreatTinyAsHidden == true)
  function isHidden(element, doTreatTinyAsHidden) {
    var rect = getRect(element), MIN_RECT_SIDE_TINY = 5, minRectSide = doTreatTinyAsHidden ? MIN_RECT_SIDE_TINY * getCachedViewSize().zoom : 1;
    return rect.right < 0 || rect.top < 0 || rect.width < minRectSide || rect.height < minRectSide;
  }
  function getUniqueId(element) {
    var currId = getStoredUniqueId(element);
    if (currId) {
      return currId;
    }
    $(element).data("sc", ++uniqueIdCounter);
    // Possibly a memory issue
    return uniqueIdCounter;
  }
  // ------- PRIVATE -----------
  function getStoredUniqueId(element) {
    return $(element).data("sc");
  }
  // Call before getting traits so that global/document values can be used
  function updateCachedViewSize() {
    cachedViewSize.height = window.innerHeight;
    cachedViewSize.width = window.innerWidth;
    cachedViewSize.zoom = zoomMod.getCompletedZoom();
  }
  return {
    resetCache: resetCache,
    updateCachedViewPosition: updateCachedViewPosition,
    getCachedViewPosition: getCachedViewPosition,
    getCachedViewSize: getCachedViewSize,
    getStyle: getStyle,
    getStyleProp: getStyleProp,
    getScreenRect: getScreenRect,
    getRect: getRect,
    isHidden: isHidden,
    getUniqueId: getUniqueId
  };
});

/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 * See more info on https://equinox.atlassian.net/wiki/display/EN/positioning+utility
 */
sitecues.define("page/highlight/highlight-position", [ "$", "page/util/common", "page/util/element-classifier", "page/zoom/zoom", "page/highlight/traitcache", "mini-core/native-global", "run/inline-style/inline-style" ], function($, common, elemClassifier, zoomMod, traitcache, nativeGlobal, inlineStyle) {
  var MIN_RECT_SIDE = 4, MAX_TEXT_INDENT_USED_TO_HIDE = -499;
  // text-indent less than this we consider as something used to hide alternative text for bg image sprites
  /**
   * Get the fixed position rectangles for the target's actual rendered content.
   * This is necessary when an inline element such as a link wraps at the end of a line -- there are multiple rects
   * DOM function object.getClientRects() returns rectangle objects for each rectangle associated with an object.
   * It also helps get just what's visible, as opposed to a parent element's rectangle which could bleed
   * over neighboring floats.
   * Recursive so that we don't miss any bounds (sometimes children escape the bounds of their parents).
   * For example, child images escape the bounds of inline parents and
   * relatively positioned children can be outside of the parent that way.
   * When adjacent rectangles are within |proximityBeforeRectsMerged| pixels,
   * they will be combined into a single rectangle.
   * @param selector -- what to get bounding boxes
   * @param proximityBeforeBoxesMerged -- if two boxes are less than this number of pixels apart, they will be merged into one
   * @param doStretchForSprites -- true if it's important to add rects for background sprites
   * @return {
   *   allRects: [],  // Array of rectangles
   *   hiddenElements: []   // Elements whose contents are not included in the highlight, e.g. have absolutely positioned or hidden subtrees
   * }
   */
  function getHighlightPositionInfo(selector, proximityBeforeBoxesMerged, doStretchForSprites, doIgnoreFloats) {
    var accumulatedPositionInfo = {
      allRects: [],
      hiddenElements: new WeakMap()
    }, $selector = $(selector);
    getHighlightInfoRecursive($selector, accumulatedPositionInfo, doStretchForSprites, doIgnoreFloats, true);
    combineIntersectingRects(accumulatedPositionInfo.allRects, proximityBeforeBoxesMerged);
    // Merge overlapping boxes
    return accumulatedPositionInfo;
  }
  // Get a single rectangle that covers the entire area defined by the selector
  // doIgnoreFloats is optional
  function getRect(selector, doIgnoreFloats) {
    var COMBINE_ALL_RECTS = 99999;
    return getHighlightPositionInfo(selector, COMBINE_ALL_RECTS, true, doIgnoreFloats).allRects[0];
  }
  function getZoom() {
    return zoomMod.getCompletedZoom();
  }
  function hasUnrenderedDescendants(node) {
    // Select elements have `option` descendants that don't have rendered dimensions until the dropdown menu is opened
    var tagNames = [ "select" ];
    return tagNames.indexOf(node.localName) !== -1;
  }
  // Get the rect for the contents of a node (text node or contents inside element node)
  // @param node -- an element that contains visible content, or a text node
  function getContentsRangeRect(node) {
    var parent, range = document.createRange(), // ********** Some browsers are fine **********
    isElement = node.nodeType === Node.ELEMENT_NODE;
    if (isElement && !hasUnrenderedDescendants(node)) {
      // Case 1: element -- get the rect for the element's descendant contents
      parent = node;
      range.selectNodeContents(node);
    } else {
      // Case 2: text node -- get the rect for the text
      parent = node.parentNode;
      range.selectNode(node);
    }
    var contentsRangeRect = $.extend({}, range.getBoundingClientRect());
    if (!contentsRangeRect.width || !contentsRangeRect.height) {
      return;
    }
    if (!isElement) {
      var textVerticalClipRect = getTextVerticalClipping(node, contentsRangeRect, range);
      if (textVerticalClipRect) {
        // Clip text to the bounding element, otherwise the top and bottom will
        // encompass the entire line-height, which can contain a lot of whitespace/
        // We only use this technique to clip the top and bottom -- left and right do not need this treatment.
        contentsRangeRect.top = Math.max(contentsRangeRect.top, textVerticalClipRect.top);
        contentsRangeRect.bottom = Math.min(contentsRangeRect.bottom, textVerticalClipRect.bottom);
        contentsRangeRect.height = contentsRangeRect.bottom - contentsRangeRect.top;
      }
    }
    return contentsRangeRect;
  }
  function getRectMinusPadding(rect, style) {
    // Reduce by padding amount -- useful for images such as Google Logo
    // which have a ginormous amount of padding on one side
    var paddingTop = parseFloat(style.paddingTop), paddingLeft = parseFloat(style.paddingLeft), paddingBottom = parseFloat(style.paddingBottom), paddingRight = parseFloat(style.paddingRight);
    return {
      top: rect.top + paddingTop,
      left: rect.left + paddingLeft,
      width: rect.width - paddingLeft - paddingRight,
      height: rect.height - paddingTop - paddingBottom,
      bottom: rect.top + rect.height - paddingBottom,
      // In case rect.right not set
      right: rect.left + rect.width - paddingRight
    };
  }
  function hasHiddenBullets(style) {
    return "none" === style.listStyleType && "none" === style.listStyleImage;
  }
  function getBulletRect(element, style) {
    if ("list-item" !== style.display || hasHiddenBullets(style)) {
      // Do not perform the measurement on anything but a list item with visible bullets
      return;
    }
    var INSIDE_BULLET_PADDING = 5, // Add this extra space to the left of bullets if list-style-position: inside, otherwise looks crammed
    bulletWidth = "inside" === style.listStylePosition ? INSIDE_BULLET_PADDING : common.getBulletWidth(element.parentNode, style), boundingRect = traitcache.getScreenRect(element), paddingLeft = parseFloat(traitcache.getStyleProp(element, "paddingLeft"));
    return {
      top: boundingRect.top,
      height: boundingRect.height,
      left: boundingRect.left + paddingLeft - bulletWidth,
      width: bulletWidth
    };
  }
  function isTextIndentUsedToHide(style) {
    return parseInt(style.textIndent) < MAX_TEXT_INDENT_USED_TO_HIDE;
  }
  function getSpriteRect(element, style) {
    // Check special case for sprites, often used for fake bullets
    // The following cases are unlikely to be sprites:
    // - Repeating backgrounds
    // - Percentage-positioned or centered (computed background-position-x is 50%)
    // Check for elements with only a background-image
    var rect = $.extend({}, traitcache.getScreenRect(element, true));
    if ($(element).is(":empty") || isTextIndentUsedToHide(style)) {
      // Empty elements have no other purpose than to show background sprites
      // Also, background image elements with text-indent are used to make accessible images
      // (the text is offscreen -- screen readers see it but the eye doesn't)
      return rect;
    }
    var backgroundPos = style.backgroundPosition;
    if ("none" === style.backgroundImage || "no-repeat" !== style.backgroundRepeat || parseFloat(backgroundPos) > 0 && backgroundPos.indexOf("%") > 0) {
      return;
    }
    // Background sprites tend to be to the left side of the element
    var backgroundLeftPos = backgroundPos ? parseFloat(backgroundPos) : 0, // Use positive background positions (used for moving the sprite to the right within the element)
    // Ignore negative background positions (used for changing which sprite is used within a larger image)
    actualLeft = isNaN(backgroundLeftPos) || backgroundLeftPos < 0 ? 0 : backgroundLeftPos, currZoom = getZoom();
    rect.left += actualLeft;
    rect.width = parseFloat(style.paddingLeft) * currZoom;
    return rect.width > MIN_RECT_SIDE * currZoom ? rect : null;
  }
  function getLineHeight(style) {
    // Values possible from computed style: normal | <number>px
    return parseFloat(style.lineHeight) || 1.5 * parseFloat(style.fontSize);
  }
  function getOverflowRect(element, style) {
    if ("body" === element.localName) {
      return;
    }
    var clientHeight = element.clientHeight;
    if (!clientHeight) {
      return;
    }
    var hasOverflowX = "visible" === style.overflowX && element.scrollWidth - element.clientWidth > 1, hasOverflowY = "visible" === style.overflowY && element.scrollHeight - clientHeight >= getLineHeight(style);
    if (!hasOverflowX && !hasOverflowY) {
      return;
    }
    // Check hidden or out-of-flow descendants -- those break our overflow check.
    // Example: google search results with hidden drop down menu
    // For now, we will not support overflow in this case.
    var hasHiddenDescendant = false, MAX_ELEMENTS_TO_CHECK = 40;
    $(element).find("*").each(function(index) {
      if (index > MAX_ELEMENTS_TO_CHECK) {
        return false;
      }
      var rect = traitcache.getRect(this), style = traitcache.getStyle(this);
      if (rect.right < 0 || rect.bottom < 0 || "hidden" === style.visibility || "absolute" === style.position || "fixed" === style.position) {
        hasHiddenDescendant = true;
        return false;
      }
    });
    if (hasHiddenDescendant) {
      return;
    }
    // Overflow is visible: add right and bottom sides of overflowing content
    var rect = traitcache.getScreenRect(element), zoom = getZoom(), newRect = {
      left: rect.left,
      top: rect.top,
      width: hasOverflowX ? element.scrollWidth * zoom : Math.min(rect.width, MIN_RECT_SIDE),
      height: hasOverflowY ? element.scrollHeight * zoom : Math.min(rect.height, MIN_RECT_SIDE)
    };
    return getRectMinusPadding(newRect, style);
  }
  function normalizeRect(rect) {
    var newRect = $.extend({}, rect);
    newRect.right = rect.left + rect.width;
    newRect.bottom = rect.top + rect.height;
    return newRect;
  }
  // Add rectangle to collected list of all rectangles
  function addRect(allRects, rect, doLoosenMinSizeRule) {
    if (!rect) {
      return;
    }
    var zoom = getZoom(), minRectSide = MIN_RECT_SIDE * zoom;
    if (!doLoosenMinSizeRule && (rect.width < minRectSide || rect.height < minRectSide)) {
      return;
    }
    rect = normalizeRect(rect);
    allRects.push(rect);
  }
  function isInvisible(style) {
    return "hidden" === style.visibility || "collapse" === style.visibility || "none" === style.display;
  }
  function isOutOfFlow(elem, style, rect) {
    if ("absolute" === style.position || "fixed" === style.position) {
      var parentRect = traitcache.getScreenRect(elem.parentNode), FUZZ_FACTOR = 4;
      // If the child bounds pop out of the parent bounds by more
      // than FUZZ_FACTOR, it will need to be kept separate and
      // not included in the current bounds calculation for this subtree
      if (Math.abs(rect.left - parentRect.left) > FUZZ_FACTOR || Math.abs(rect.top - parentRect.top) > FUZZ_FACTOR || Math.abs(rect.right - parentRect.right) > FUZZ_FACTOR || Math.abs(rect.bottom - parentRect.bottom) > FUZZ_FACTOR) {
        return true;
      }
    }
  }
  function getHighlightInfoRecursive($selector, accumulatedResults, doStretchForSprites, doIgnoreFloats, isTop) {
    var allRects = accumulatedResults.allRects, hiddenElements = accumulatedResults.hiddenElements, viewPos = traitcache.getCachedViewPosition();
    $selector.each(function() {
      var isElement = this.nodeType === Node.ELEMENT_NODE;
      // --- Leaf nodes ---
      if (!isElement) {
        if (this.nodeType === Node.TEXT_NODE && "" !== this.data.trim()) {
          /* Non-empty text node */
          // ----------------------------------------------------------------------------------------------------
          // --- FAST PATH -- REMOVED BECAUSE SOME CHILD ELEMENTS MAY USING CLIPPING! SC-2047 --
          // Fast path for text containers:
          // We found a child text node, so get the bounds of all children at once via a DOM range.
          // This is much faster than iterating through all of the sibling text/inline nodes, by
          // reducing the number of nodes we touch.
          // Note: this would not work if any of the children were display: block, because
          // the returned rectangle would be the larger element rect, rather for just the visible content.
          //
          // var parentContentsRect = getContentsRangeRect(this.parentNode);
          // addRect(allRects, parentContentsRect);
          // return false;  // Don't keep iterating over text/inlines in this container
          // ----------------------------------------------------------------------------------------------------
          // ----------------------------------------------------------------------------------------------------
          // -- NORMAL -- NO LONGER NEED TO USE ABOVE 'FAST PATH' METHOD --
          // Our other performance fixes (such as traitcache, and better picking) have removed the need
          // for the above old 'fast path' method which fixed slow sites like http://en.wikipedia.org/wiki/Cat
          // This 'normal' method goes through the nodes one at a time, so that we can be sure to deal with
          // hidden and clipped elements.
          // ----------------------------------------------------------------------------------------------------
          var rect = getContentsRangeRect(this);
          addRect(allRects, rect);
          // --- Overflowing content ---
          addRect(allRects, getOverflowRect(this.parentNode, traitcache.getStyle(this.parentNode)));
        }
        return;
      }
      var style = traitcache.getStyle(this);
      // --- Invisible elements ---
      if (isInvisible(style)) {
        hiddenElements.set(this, true);
        return;
      }
      if (doIgnoreFloats && "none" !== style.float) {
        return;
      }
      var thisRect = traitcache.getScreenRect(this);
      if (thisRect.right < -viewPos.x || thisRect.bottom < -viewPos.y) {
        // Hidden off the page
        // This is a technique used to hide contents offscreen without hiding it from screen readers
        hiddenElements.set(this, true);
        return;
      }
      // -- Out of flow and is not the top element --
      if (!isTop && isOutOfFlow(this, style, thisRect)) {
        hiddenElements.set(this, true);
        return;
      }
      // --- Media elements ---
      if (elemClassifier.isVisualMedia(this)) {
        // Elements with rendered content such as images and videos
        addRect(allRects, getRectMinusPadding(thisRect, style));
        return;
      }
      // --- Form controls ---
      if (elemClassifier.isFormControl(this)) {
        if ($(this).is('select[size="1"],select:not([size])')) {
          addRect(allRects, getComboboxRect(this, thisRect));
          return;
        }
        addRect(allRects, thisRect);
      } else {
        if (common.isVisualRegion(this, style, traitcache.getStyle(this.parentNode))) {
          addRect(allRects, thisRect);
        }
      }
      // --- List bullets ---
      addRect(allRects, getBulletRect(this, style), true);
      // --- Background sprites ---
      if (doStretchForSprites) {
        addRect(allRects, getSpriteRect(this, style));
      }
      // --- Elements with children ---
      // Ignore children when text-indent is negative, as this indicates hidden offscreen content,
      // most commonly a background image sprite with a text child being used as alternative text.
      if (this.hasChildNodes() && !isTextIndentUsedToHide(style)) {
        // Use bounds of visible descendants
        getHighlightInfoRecursive($(this.childNodes), accumulatedResults, doStretchForSprites, doIgnoreFloats);
        // Recursion
        return;
      }
    });
  }
  // A text range is clipped by the vertical bounds of it's parent element
  // when the line height of the text is larger than the text rect's height --
  // this avoids extra spacing above and below, especially around headings.
  // Return either nothing for no clip, or an object with a top: and bottom: to clip to
  function getTextVerticalClipping(textNode, textRect, range) {
    var clipInfo, parent = textNode.parentNode, zoom = getZoom(), lineHeight = parseFloat(traitcache.getStyleProp(parent, "lineHeight")) * zoom, numLines = range.getClientRects().length, // TODO Can we clip always? Unfortunately we did not document the counter-case. Maybe we can always do it.
    shouldClip = lineHeight * (numLines + .7) > textRect.height;
    if (shouldClip) {
      // Clip the text vertically to the parent element, because the large
      // line-height causes the element bounds to be larger than the text
      clipInfo = traitcache.getScreenRect(parent);
      while ("inline" === traitcache.getStyleProp(parent, "display")) {
        parent = parent.parentNode;
        if (parent) {
          var parentRect = parent.getBoundingClientRect();
          if (parentRect.top > clipInfo.top) {
            clipInfo.top = parentRect.top;
          }
          if (parentRect.bottom < clipInfo.bottom) {
            clipInfo.bottom = parentRect.bottom;
          }
        }
      }
      return clipInfo;
    }
  }
  // Our hacky zoom combobox fixes can mess up highlight rects -- this corrects for that case
  function getComboboxRect(comboElem, comboRect) {
    var isHackedCombobox = traitcache.getStyleProp(comboElem, "zoom") > 1;
    if (isHackedCombobox) {
      // Turn off zoom CSS hacks for comboboxes
      comboElem.setAttribute("data-sc-dropdown-fix-off", "");
      // Turn off transition temporarily if it's there, otherwise it prevents us from getting the correct rect
      inlineStyle.override(comboElem, {
        transitionProperty: "none"
      });
      // Get what the rect would have been
      comboRect = comboElem.getBoundingClientRect();
      // Restore CSS
      nativeGlobal.setTimeout(function() {
        // Do this on a timeout otherwise it may animate our return changes
        inlineStyle.restore(comboElem, "transition-property");
      }, 0);
      comboElem.removeAttribute("data-sc-dropdown-fix");
    }
    return comboRect;
  }
  /**
   * Combine intersecting rects. If they are within |extraSpace| pixels of each other, merge them.
   */
  function combineIntersectingRects(rects, extraSpace) {
    function intersects(r1, r2) {
      return !(r2.left - extraSpace > r1.left + r1.width + extraSpace || r2.left + r2.width + extraSpace < r1.left - extraSpace || r2.top - extraSpace > r1.top + r1.height + extraSpace || r2.top + r2.height + extraSpace < r1.top - extraSpace);
    }
    function merge(r1, r2) {
      var left = Math.min(r1.left, r2.left);
      var top = Math.min(r1.top, r2.top);
      var right = Math.max(r1.left + r1.width, r2.left + r2.width);
      var bottom = Math.max(r1.top + r1.height, r2.top + r2.height);
      return {
        left: left,
        top: top,
        width: right - left,
        height: bottom - top,
        right: right,
        bottom: bottom
      };
    }
    // TODO O(n^2), not ideal.
    // Probably want to use well-known algorithm for merging adjacent rects
    // into a polygon, such as:
    // http://stackoverflow.com/questions/643995/algorithm-to-merge-adjacent-rectangles-into-polygon
    // http://www.raymondhill.net/puzzle-rhill/jigsawpuzzle-rhill-3.js
    // http://stackoverflow.com/questions/13746284/merging-multiple-adjacent-rectangles-into-one-polygon
    for (var index1 = 0; index1 < rects.length - 1; index1++) {
      var index2 = index1 + 1;
      while (index2 < rects.length) {
        if (intersects(rects[index1], rects[index2])) {
          rects[index1] = merge(rects[index1], rects[index2]);
          rects.splice(index2, 1);
        } else {
          index2++;
        }
      }
    }
  }
  return {
    getHighlightPositionInfo: getHighlightPositionInfo,
    getRect: getRect,
    getContentsRangeRect: getContentsRangeRect,
    combineIntersectingRects: combineIntersectingRects
  };
});

/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
sitecues.define("page/highlight/traits", [ "$", "page/highlight/traitcache", "page/highlight/highlight-position", "page/zoom/util/body-geometry", "page/util/element-classifier" ], function($, traitcache, mhpos, bodyGeo, elemClassifier) {
  var bodyWidth, viewSize;
  // ---- PUBLIC ----
  function getTraitStack(nodes) {
    var traitStack;
    viewSize = traitcache.getCachedViewSize();
    bodyWidth = bodyGeo.getBodyWidth();
    traitStack = nodes.map(getTraits);
    return traitStack;
  }
  // ---- PRIVATE ----
  // Properties that depend only on the node itself, and not other traits in the stack
  function getTraits(node) {
    // Basic properties
    var zoom = viewSize.zoom, traits = {
      computedStyle: traitcache.getStyle(node),
      tag: node.localName,
      role: node.getAttribute("role"),
      childCount: node.childElementCount
    };
    traits.isVisualMedia = isVisualMedia(traits, node);
    var fastRect = traitcache.getRect(node);
    traits.normDisplay = getNormalizedDisplay(traits.computedStyle, node, fastRect.height, zoom, traits);
    traits.rect = getRect(node, traits, fastRect);
    traits.fullWidth = fastRect.width;
    // Full element width, even if visible text content is much less
    traits.unzoomedRect = {
      width: traits.rect.width / zoom,
      height: traits.rect.height / zoom,
      top: traits.rect.top / zoom,
      bottom: traits.rect.bottom / zoom,
      left: traits.rect.left / zoom,
      right: traits.rect.right / zoom
    };
    // Style-based
    $.extend(traits, {
      topPadding: parseFloat(traits.computedStyle.paddingTop),
      bottomPadding: parseFloat(traits.computedStyle.paddingBottom),
      leftPadding: parseFloat(traits.computedStyle.paddingLeft),
      rightPadding: parseFloat(traits.computedStyle.paddingRight),
      topBorder: parseFloat(traits.computedStyle.borderTopWidth),
      bottomBorder: parseFloat(traits.computedStyle.borderBottomWidth),
      leftBorder: parseFloat(traits.computedStyle.borderLeftWidth),
      rightBorder: parseFloat(traits.computedStyle.borderRightWidth),
      topMargin: Math.max(0, parseFloat(traits.computedStyle.marginTop)),
      bottomMargin: Math.max(0, parseFloat(traits.computedStyle.marginBottom)),
      leftMargin: Math.max(0, parseFloat(traits.computedStyle.marginLeft)),
      rightMargin: Math.max(0, parseFloat(traits.computedStyle.marginRight))
    });
    // Visible size at 1x (what it would be if not zoomed)
    $.extend(traits, {
      visualWidthAt1x: traits.unzoomedRect.width - traits.leftPadding - traits.rightPadding,
      visualHeightAt1x: traits.unzoomedRect.height - traits.topPadding - traits.bottomPadding
    });
    // Percentage of viewport
    $.extend(traits, {
      percentOfViewportHeight: 100 * traits.rect.height / viewSize.height,
      percentOfViewportWidth: 100 * traits.rect.width / viewSize.width
    });
    traits.percentOfBodyWidth = 100 * traits.rect.width / bodyWidth;
    return traits;
  }
  // Normalize treatment of CSS display for form controls across browsers.
  // Firefox says that form controls have an inline style, but really treats them as inline-block.
  // For example the label of an <input type="button"> will not wrap to the next line like a normal inline does.
  // Since they act like inline-block let's treat it as one while normalize the display trait across browsers --
  // this allows the form controls to be picked.
  function getNormalizedDisplay(style, node, height, zoom, traits) {
    function getApproximateLineHeight() {
      // See http://meyerweb.com/eric/thoughts/2008/05/06/line-height-abnormal/
      return 1.5 * (parseFloat(style.lineHeight) || parseFloat(style.fontSize));
    }
    var doTreatAsInlineBlock = false;
    if ("inline" === style.display) {
      // Treat forms as inline-block across browsers (and thus are pickable).
      // If we don't do this, some browsers call them "inline" and they would not get picked
      if (elemClassifier.isFormControl(node)) {
        doTreatAsInlineBlock = true;
      } else {
        if (1 === traits.childCount && elemClassifier.isVisualMedia(node.firstElementChild)) {
          doTreatAsInlineBlock = true;
        } else {
          var lineHeight = getApproximateLineHeight() * zoom;
          if (height < lineHeight) {
            var parentRect = mhpos.getContentsRangeRect(node.parentNode);
            if (parentRect && parentRect.height < lineHeight) {
              // Treat single line inlines that are part of another single-line element as inline-block.
              // This allows them to be picked -- they may be a row of buttons or part of a menubar.
              doTreatAsInlineBlock = true;
            }
          }
        }
      }
    }
    return doTreatAsInlineBlock ? "inline-block" : style.display;
  }
  // Get an element's rectangle
  // In most cases, we use the fastest approach (cached getBoundingClientRect results)
  // However, a block parent of an inline or visible text needs the more exact approach, so that the element
  // does not appear to be much wider than it really is
  function getRect(element, traits, fastRect) {
    var exactRect, display = traits.normDisplay, WIDE_ELEMENT_TO_BODY_RATIO = .7;
    // Use exact approach for:
    // * inline-block, because it lies about height when media is inside
    // * wide blocks, because they lie about width when there is a float
    if ("inline-block" === display || "block" === display && fastRect.width > bodyWidth * WIDE_ELEMENT_TO_BODY_RATIO) {
      exactRect = mhpos.getContentsRangeRect(element);
      return $.extend({}, exactRect);
    }
    return fastRect;
  }
  function isVisualMedia(traits, node) {
    var style = traits.computedStyle;
    // Or if one of those <div></div> empty elements just there to show a background image
    return elemClassifier.isVisualMedia(node) || 0 === traits.childCount && "none" !== style.backgroundImage && ("no-repeat" === style.backgroundRepeat || "cover" === style.backgroundSize || "contain" === style.backgroundSize) && $(node).is(":empty");
  }
  return {
    getTraitStack: getTraitStack
  };
});

/**
 * Retrieve judgements about the node. These are hand-crafted rules tweaked over time.
 * Inputs: 1) candidate nodes and 2) their traits
 *
 * Example of judgements for a node:
 * - Does it use a good tag or role?
 * - Does it define its own interesting background?
 * - What is the visual impact of the spacing/border around its edges?
 * - Does it look like a cell in a row or column?
 * - Did it grow a lot larger compared with the child candidate?
 *
 * Note: "Growth" is a synonym for "Expansion" -- very intuitive for Aaron but no one else!
 */
sitecues.define("page/highlight/judge", [ "$", "page/util/common", "page/util/element-classifier", "page/highlight/traitcache" ], function($, common, elemClassifier, traitcache) {
  // ** Semantic constants ***
  // For ARIA roles other tags could be used, but this is most likely and more performant than checking all possibilities
  var DIVIDER_SELECTOR = 'hr,div[role="separator"],img', SECTION_START_SELECTOR = 'h1,h2,h3,h4,h5,h6,hgroup,header,dt,div[role="heading"],hr,div[role="separator"]', GREAT_TAGS = {
    blockquote: 1,
    td: 1,
    ol: 1,
    menu: 1
  }, GOOD_TAGS = {
    a: 1,
    address: 1,
    button: 1,
    code: 1,
    dl: 1,
    fieldset: 1,
    form: 1,
    p: 1,
    pre: 1,
    li: 1,
    section: 1,
    tr: 1
  }, BAD_PARENTS_SELECTOR = "li,p,h1,h2,h3,h4,h5,h6,hgroup,button", HEADING_TAGS = {
    h1: 1,
    h2: 1,
    h3: 1,
    h4: 1,
    h5: 1,
    h6: 1,
    hgroup: 1
  }, // Because we prefer to select content with the heading
  // These are less likely to be used to layout a cell/box
  UNLIKELY_CELL_TAGS = {
    a: 1,
    ol: 1,
    ul: 1,
    p: 1,
    h1: 1,
    h2: 1,
    h3: 1,
    h4: 1,
    h5: 1,
    h6: 1,
    hgroup: 1,
    header: 1
  }, GOOD_ROLES = {
    list: 1,
    region: 1,
    complementary: 1,
    dialog: 1,
    alert: 1,
    alertdialog: 1,
    gridcell: 1,
    tabpanel: 1,
    tree: 1,
    treegrid: 1,
    listbox: 1,
    img: 1,
    heading: 1,
    rowgroup: 1,
    row: 1,
    toolbar: 1,
    menu: 1,
    menubar: 1,
    group: 1,
    form: 1,
    navigation: 1,
    main: 1
  }, MIN_BR_TAGS_IN_TALL_ARTICLE = 5, UNUSABLE_TAGS = {
    area: 1,
    base: 1,
    basefont: 1,
    bdo: 1,
    br: 1,
    col: 1,
    colgroup: 1,
    font: 1,
    legend: 1,
    link: 1,
    map: 1,
    optgroup: 1,
    option: 1,
    tbody: 1,
    tfoot: 1,
    thead: 1,
    hr: 1
  }, UNUSABLE_ROLES = {
    presentation: 1,
    separator: 1
  }, // ** Layout and geometrical constants ***
  MIN_COLUMN_CELL_HEIGHT = 25, // If fewer pixels than this, don't consider it to be a cell in a column
  MIN_AVERAGE_COLUMN_CELL_HEIGHT = 65, // If fewer pixels than this per item, don't consider it to be a cell in a column
  IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT = 20, // Smaller than this is bad
  IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT = 63, // Larger than this is bad
  IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH = 20, // Smaller than this is bad
  IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH = 63, // Larger than this is bad
  MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH = 60, // Media larger than this is bad
  IDEAL_MAX_PERCENT_OF_BODY_WIDTH = 85, // If this percent or more of body width, it's bad. We don't like picking items almost as wide as body.
  NEAR_BODY_WIDTH_IMPACT_POWER = 2, // Exponent for impact of being close to body's width
  TALL_ELEMENT_PIXEL_THRESHOLD = 999, // Anything taller than this is considered very tall
  TINY_HEIGHT_PIXEL_THRESHOLD = 14, // Anything shorter than this is considered a tiny element (or at least very thin)
  TINY_WIDTH_PIXEL_THRESHOLD = 33, // Anything narrower than this is considered a tiny element (or at least very thin)
  TINY_ELEMENT_IMPACT_POWER = 1.2, // Exponential for the affect of smallness
  SIGNIFICANT_IMAGE_PIXELS = 20, // Number of pixels on a side before an image is significant
  SEPARATOR_IMAGE_PIXEL_THRESHOLD = 6, // Maximum thickness for a separator line
  SEPARATION_DIVISOR = 1.6, // The number of spacing pixels will be divided by this in separation impact algorithm
  SEPARATION_IMPACT_POWER = 1.3, // Exponent for visual impact of whitespace
  MAX_SPACE_SEPARATION_IMPACT = 14, // The maximum impact of whitespace, for a given edge
  MAX_BORDER_SEPARATION_IMPACT = 22, // The maximum impact of a border, for a given edge
  TABLE_CELL_SPACING_BONUS = 7, // Treat table cells as having 5 extra spaces around them
  BORDER_WIDTH_BONUS = 15, // Bonus points for each pixel of border width
  SIGNIFICANT_EDGE_PIXEL_GROWTH = 50, // Number of pixels of growth on a side that likely means additional content is encompassed on that side
  SIGNIFICANT_SEPARATION_IMPACT = 14, // Amount of separation impact on a side that clearly shows a visual separation
  EXTREME_GROWTH_FACTOR = 2.5, // If parent's height ratio of child is larger than this, we consider it significantly larger than child
  MODERATE_GROWTH_FACTOR = 1.3, // An amount of growth that is significant but not huge
  COLUMN_VERT_GROWTH_THRESHOLD = 1.3, // Sometimes there is a very small cell in a column of only 2 cells. We only require that the column be 30% taller than the cell
  ROW_HORIZ_GROWTH_THRESHOLD = 1.8, // Because text is horizontal, it is unlikely to have a narrow cell in a row. Generally the row width will be nearly 2x the cell width.
  MAX_CELL_GROUP_GROWTH_PER_SIBLING = 2, // For each sibling, allow the cell group's area to be this much larger than the cell
  VERY_SMALL_GROWTH_FACTOR = 1.04, SMALL_GROWTH_FACTOR = 1.2, MIN_IMAGE_GROUP_HEIGHT = 50, // Image groups must be taller than this
  MAX_CHILDREN_IMAGE_GROUP = 4, // If more children than this, it does not typically fit the pattern of an image group, so don't do the expensive check
  MAX_ANCESTOR_INDEX_IMAGE_GROUP = 5, // If ancestor index is larger than this, it does not typically fit the pattern of an image group, so don't do the expensive check
  ROUGHLY_SAME_SIZE_THRESHOLD = 120, // If parent grows by fewer pixels than this, it is considered roughly the same size as the child
  LINK_LIST_FACTOR = 1.5, // How much to multiply list score by if it's a list of links
  OUT_OF_FLOW_LIST_FACTOR = 6, // How much to multiply list score by if it's a positioned list (a menu)
  customJudgements = {};
  // ----------- PUBLIC  ----------------
  // Get a judgement for each node
  // The judgements, traits and nodes all correlate, such that index 0 of each array
  // stores information for the first candidate node, index 1 is the parent, etc.
  // When the node is unusable, judgements is set to null, rather than wasting cycles calculating the judgements.
  function getJudgementStack(traitStack, nodeStack) {
    var firstNonInlineTraits = getTraitsOfFirstNonInlineCandidate(traitStack), childJudgements = null, childTraits = traitStack[0], // For simplicity of calculations, not allowed to be null
    // Get cascaded spacing traits and add them to traitStack
    spacingInfoStack = getCascadedSpacingInfo(traitStack, nodeStack);
    // topSpacing, leftSpacing, topDivider, etc.
    // Return the judgements for the candidate at the given index
    // Return null if the candidate is unusable
    function mapJudgements(traits, index) {
      var node = nodeStack[index], judgements = getJudgements(traitStack, childTraits, firstNonInlineTraits, node, spacingInfoStack, childJudgements, index);
      childJudgements = judgements;
      childTraits = traits;
      return judgements;
    }
    return traitStack.map(mapJudgements);
  }
  // This is a hook for customization scripts, which can add their own judgements by overriding this method.
  // Pass in as { judgementName: fn(), judgementName2: fn2(), etc. }
  // Parameters to judgement functions are:
  //   judgements, traits, belowTraits, belowJudgements, parentTraits, firstNonInlineTraits, node, index
  // For each judgement, a weight of the same name must exist.
  function provideCustomJudgements(judgements) {
    customJudgements = judgements;
  }
  // ------------ PRIVATE -------------
  function getJudgements(traitStack, childTraits, firstNonInlineTraits, node, spacingStack, childJudgements, index) {
    var judgementGetter, traits = traitStack[index], numCandidates = traitStack.length, parentTraits = index < numCandidates - 1 ? traitStack[index + 1] : traits, firstTraits = traitStack[0], judgements = spacingStack[index];
    // Begin with cascaded spacing info
    // Computed judgements
    $.extend(judgements, getVisualSeparationJudgements(node, traits, parentTraits, childTraits, judgements, childJudgements));
    $.extend(judgements, getSizeJudgements(node, judgements, traits, firstNonInlineTraits, childJudgements));
    $.extend(judgements, getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, firstTraits, childJudgements));
    $.extend(judgements, getCellLayoutJudgements(node, judgements, traits, parentTraits, childJudgements, firstNonInlineTraits));
    $.extend(judgements, getDOMStructureJudgements(judgements, traits, childJudgements, childTraits, node, index));
    for (judgementGetter in customJudgements) {
      if (customJudgements.hasOwnProperty(judgementGetter)) {
        $.extend(judgements, judgementGetter(judgements, traits, childTraits, childJudgements, parentTraits, firstNonInlineTraits, node, index));
      }
    }
    judgements.isUsable = isUsable(traits, judgements);
    return judgements;
  }
  // Which edges of node are adjacent to parent's edge? E.g. top, left, bottom, right
  // Returns an array of edges, e.g. ["top", "left"]
  function getAdjacentEdges(traitStack, index) {
    var traits = traitStack[index], parentTraits = traitStack[index + 1], rect = traits.unzoomedRect, parentRect = parentTraits.unzoomedRect, adjacentEdges = [], FUZZ_FACTOR = 1;
    // If we're close by this many pixels, consider them adjacent
    if (parentRect.top + parentTraits.topPadding + FUZZ_FACTOR >= rect.top - traits.topMargin) {
      adjacentEdges.push("top");
    }
    if (parentRect.left + parentTraits.leftPadding + FUZZ_FACTOR >= rect.left - traits.leftMargin) {
      adjacentEdges.push("left");
    }
    if (parentRect.bottom - parentTraits.bottomPadding - FUZZ_FACTOR <= rect.bottom + traits.bottomMargin) {
      adjacentEdges.push("bottom");
    }
    if (parentRect.right - parentTraits.rightPadding - FUZZ_FACTOR <= rect.right + traits.rightMargin) {
      adjacentEdges.push("right");
    }
    return adjacentEdges;
  }
  // Get the true amount of spacing around each object.
  // For the top, left, bottom and rightmost objects in each container,
  // the parent container's margin/padding for that edge should be added to it
  // because we want the complete amount of visual spacing on that edge.
  function getCascadedSpacingInfo(traitStack, nodeStack) {
    // Create the spacing properties
    function getSpacingTraits(item, index) {
      var node = nodeStack[index], parent = node.parentNode, itemRect = traitcache.getRect(node), cellBonus = ("td" === traitStack[index].tag) * TABLE_CELL_SPACING_BONUS;
      return {
        topSpacing: item.topMargin + item.topPadding + cellBonus,
        leftSpacing: item.leftMargin + item.leftPadding + cellBonus,
        bottomSpacing: item.bottomMargin + item.bottomPadding + cellBonus,
        rightSpacing: item.rightMargin + item.rightPadding + cellBonus,
        topDivider: getDividerThickness(parent.firstElementChild, "top", itemRect.top - SIGNIFICANT_EDGE_PIXEL_GROWTH, itemRect.top),
        leftDivider: getDividerThickness(parent.firstElementChild, "left", itemRect.left - SIGNIFICANT_EDGE_PIXEL_GROWTH, itemRect.left),
        bottomDivider: getDividerThickness(parent.lastElementChild, "bottom", itemRect.bottom, itemRect.bottom + SIGNIFICANT_EDGE_PIXEL_GROWTH),
        rightDivider: getDividerThickness(parent.lastElementChild, "right", itemRect.right, itemRect.right + SIGNIFICANT_EDGE_PIXEL_GROWTH)
      };
    }
    var index, spacingTraitStack = traitStack.map(getSpacingTraits);
    function combineProperty(index, edge, type) {
      // Edges are adjacent, so use combined separation value for both, on that edge
      var propName = edge + type, // E.g. topSpacing
      sum = spacingTraitStack[index][propName] + spacingTraitStack[index + 1][propName];
      spacingTraitStack[index][propName] = sum;
      spacingTraitStack[index + 1][propName] = sum;
    }
    function combineAdjacentEdges(edge) {
      // Edges are adjacent, so use combined separation value for both, on that edge
      combineProperty(index, edge, "Spacing");
      combineProperty(index, edge, "Divider");
    }
    // Cascade the spacing of each edge on the parent to its child, as appropriate.
    // For example, if the element is at the top of the parent, treat both object's top as
    // having the same aggregated values.
    // Because we compare each element to its parent, we start with child of the top ancestor.
    for (index = spacingTraitStack.length - 2; index >= 0; index--) {
      var adjacentEdges = getAdjacentEdges(traitStack, index);
      adjacentEdges.forEach(combineAdjacentEdges);
    }
    return spacingTraitStack;
  }
  function getVisualSeparationJudgements(node, traits, parentTraits, childTraits, judgements, childJudgements) {
    var visualSeparationJudgements = {
      // Get a number that represents the visual impact of margin, padding, border
      topSeparationImpact: getSeparationImpact(judgements.topSpacing, judgements.topDivider + traits.topBorder),
      bottomSeparationImpact: getSeparationImpact(judgements.bottomSpacing, judgements.bottomDivider + traits.bottomBorder),
      leftSeparationImpact: getSeparationImpact(judgements.leftSpacing, judgements.leftDivider + traits.leftBorder),
      rightSeparationImpact: getSeparationImpact(judgements.rightSpacing, judgements.rightDivider + traits.rightBorder),
      // Check whether a CSS background creates a visual separation from the parent,
      // (for example, it has a different background-color or uses a background-image).
      // Don't include non-repeating sprites (positioned background images) -- these are used for bullets, etc.
      hasOwnBackground: !!common.hasOwnBackground(node, traits.computedStyle, parentTraits.computedStyle),
      hasSiblingBackground: hasSiblingBackground(node, parentTraits.computedStyle, traits.tag),
      hasDescendantWithRaisedZIndex: childJudgements && (childJudgements.hasRaisedZIndex || childJudgements.hasDescendantWithRaisedZIndex),
      hasDescendantOutOfFlow: childJudgements && (childJudgements.isOutOfFlow || childJudgements.hasDescendantOutOfFlow)
    };
    visualSeparationJudgements.hasRaisedZIndex = !visualSeparationJudgements.hasDescendantWithRaisedZIndex && common.hasRaisedZIndex(childTraits.computedStyle, traits.computedStyle);
    visualSeparationJudgements.isOutOfFlow = !visualSeparationJudgements.hasDescendantOutOfFlow && isOutOfFlow(node, traits, parentTraits);
    // Get effective separation impact vertically and horizontally
    // This is helpful because often a group of items will define spacing on one side of each
    // item, rather than both. For example, if each item in a list has a bottom margin,
    // then effectively each item looks like it also has a top margin.
    // If it's almost as wide as the body, don't let horizontal separation be considered a good thing --
    // it's probably just abutting the edge of the document.
    var isAlmostAsWideAsBody = traits.percentOfBodyWidth > IDEAL_MAX_PERCENT_OF_BODY_WIDTH;
    $.extend(visualSeparationJudgements, {
      vertSeparationImpact: Math.max(visualSeparationJudgements.topSeparationImpact, visualSeparationJudgements.bottomSeparationImpact),
      horizSeparationImpact: isAlmostAsWideAsBody ? 0 : Math.max(visualSeparationJudgements.leftSeparationImpact, visualSeparationJudgements.rightSeparationImpact)
    });
    return visualSeparationJudgements;
  }
  function getSizeJudgements(node, judgements, traits, firstNonInlineTraits, childJudgements) {
    var isSignificantlyWiderThanFirstOption = traits.rect.width < firstNonInlineTraits.rect.width + SIGNIFICANT_EDGE_PIXEL_GROWTH;
    return {
      // Avoid picking tiny icons or images of vertical lines
      tinyHeightFactor: (traits.isVisualMedia || judgements.hasOwnBackground) && // Make sure it's an image or bg image, otherwise we punish lines of text too much
      Math.pow(Math.max(0, TINY_HEIGHT_PIXEL_THRESHOLD - traits.visualHeightAt1x), TINY_ELEMENT_IMPACT_POWER),
      // Avoid picking tiny icons or images of horizontal lines
      tinyWidthFactor: Math.pow(Math.max(0, TINY_WIDTH_PIXEL_THRESHOLD - traits.visualWidthAt1x), TINY_ELEMENT_IMPACT_POWER),
      // Avoid picking extremely tall items
      isExtremelyTall: childJudgements && childJudgements.isExtremelyTall || traits.visualHeightAt1x > TALL_ELEMENT_PIXEL_THRESHOLD && childJudgements && traits !== firstNonInlineTraits && // Give super tall paragraphs in an article a chance
      node.getElementsByTagName("br").length > MIN_BR_TAGS_IN_TALL_ARTICLE,
      // We have a concept of percentage of viewport width and height, where under or over the ideal is not good.
      // Avoid picking things that are very small or large, which are awkward in the HLB according to users.
      percentOfViewportHeightUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT - traits.percentOfViewportHeight),
      percentOfViewportHeightOverIdealMax: Math.min(60, Math.max(0, traits.percentOfViewportHeight - IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT)),
      percentOfViewportWidthUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH - traits.percentOfViewportWidth),
      // If no good child candidate, don't punish it for being almost as wide as the viewport
      percentOfViewportWidthOverIdealMax: isSignificantlyWiderThanFirstOption ? Math.max(0, traits.percentOfViewportWidth - IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH) : 0,
      nearBodyWidthFactor: isSignificantlyWiderThanFirstOption ? 0 : // If we're not significantly wider than the first non-inline candidate, don't punish for being wide
      Math.pow(Math.max(0, traits.percentOfBodyWidth - IDEAL_MAX_PERCENT_OF_BODY_WIDTH), NEAR_BODY_WIDTH_IMPACT_POWER)
    };
  }
  // Judge different types of growth:
  // "Growth" is size comparison between an element and a descendant.
  // It can be measured as:
  // - A difference in pixels, as a ratio or as a percentage.
  // The comparisons can be between:
  // - A parent candidate to the child candidate
  // - From the current candidate to its child candidate
  // - From the current candidate to first non-inline candidate
  function getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, firstTraits, childJudgements) {
    var growthJudgements = {
      // Ratio of sizes between objects
      // Comparison with first non-inline candidate.
      // This is the first element can provide useful size to compare with.
      totalHorizGrowthFactor: traits.fullWidth / firstNonInlineTraits.fullWidth,
      totalVertGrowthFactor: traits.rect.height / firstNonInlineTraits.rect.height,
      // Comparison with the parent
      parentHorizGrowthFactor: parentTraits.fullWidth / traits.fullWidth,
      parentVertGrowthFactor: parentTraits.rect.height / traits.rect.height,
      // Comparison with the child
      childHorizGrowthFactor: traits.fullWidth / childTraits.fullWidth,
      childVertGrowthFactor: traits.rect.height / childTraits.rect.height,
      // Amount of growth in particular direction, in pixels.
      // We use unzoomedRect so that the numbers are not impacted by the amount of zoom.
      topGrowth: childTraits.unzoomedRect.top - traits.unzoomedRect.top,
      bottomGrowth: traits.unzoomedRect.bottom - childTraits.unzoomedRect.bottom,
      leftGrowth: childTraits.unzoomedRect.left - traits.unzoomedRect.left,
      rightGrowth: traits.unzoomedRect.right - childTraits.unzoomedRect.right
    };
    function getBadGrowth(edge) {
      if (!childJudgements) {
        return 0;
      }
      var separationImpact = childJudgements[edge + "SeparationImpact"];
      if (growthJudgements[edge + "Growth"] < SIGNIFICANT_EDGE_PIXEL_GROWTH || separationImpact < SIGNIFICANT_SEPARATION_IMPACT) {
        return 0;
      }
      return separationImpact;
    }
    // "Bad growth" is growth in a direction after there was already visual separation in that direction.
    // For example, a child element has right padding, and the parent element grows to the right over that.
    // It is more likely that choosing the child element is correct, because it was already a distinct visual unit.
    $.extend(growthJudgements, {
      badGrowthTop: getBadGrowth("top"),
      badGrowthBottom: getBadGrowth("bottom")
    });
    // Judge categories of growth
    growthJudgements.large2dGrowth = // Significantly larger both horizontally and vertically when compared with the first non-inline candidate.
    // This is rarely good. It generally means we're in a group of visual groups.
    // If we don't have this rule, we tend to pick very large containers that are used for 2d layout.
    // Do not do this punishment if the child was very small for picking, because this rule
    // is all about preferring reasonable child containers over those that are too big.
    // Only need moderate horizontal growth -- things tend to be wider than they are tall.
    // Also, by requiring extreme vertical growth we don't fire as much when the first non-inline was a single line of text.
    childJudgements && !childJudgements.percentOfViewportHeightUnderIdealMin && !childJudgements.percentOfViewportWidthUnderIdealMin && growthJudgements.totalHorizGrowthFactor > MODERATE_GROWTH_FACTOR && growthJudgements.totalVertGrowthFactor > EXTREME_GROWTH_FACTOR && growthJudgements.totalHorizGrowthFactor * growthJudgements.totalVertGrowthFactor;
    $.extend(growthJudgements, {
      // Moderate one dimensional growth often means the parent is just stretching to cover a little more
      // information. For example, adding a thumbnail or a caption. This is good for the parent and bad for the child.
      // This rule is used to give the child a penalty.
      // If we don't have this rule we tend to miss attaching supplemental information such as captions.
      isModeratelySmallerThanParentInOneDimension: !growthJudgements.large2dGrowth && ((firstTraits.isVisualMedia || traits.normDisplay.indexOf("inline") < 0) && // A little horizontal growth but none vertically
      growthJudgements.parentHorizGrowthFactor < MODERATE_GROWTH_FACTOR && growthJudgements.parentHorizGrowthFactor > VERY_SMALL_GROWTH_FACTOR && growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR || // Or:
      // A little vertical growth but none horizontally
      //traits.normDisplay !== 'block' && // Why? Broke captions
      growthJudgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR && growthJudgements.parentVertGrowthFactor > VERY_SMALL_GROWTH_FACTOR && growthJudgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR),
      // Similar rule, used to give the parent a bonus:
      // This is a good thing, we are just encompassing a little more information such as an image or caption.
      // If we don't have this rule we tend to miss attaching supplemental information such as captions.
      isModeratelyLargerThanChildInOneDimension: childJudgements && childJudgements.isModeratelySmallerThanParentInOneDimension,
      // Growing much larger horizontally is generally a bad thing unless the original item was an image.
      // This is often a horizontal row of cells -- better to pick the smaller cells.
      isLargeWidthExpansion: growthJudgements.totalHorizGrowthFactor > EXTREME_GROWTH_FACTOR && !firstTraits.isVisualMedia
    });
    // Roughly the same size if the total growth is less than a threshold
    growthJudgements.isRoughlySameSizeAsChild = growthJudgements.topGrowth + growthJudgements.bottomGrowth + growthJudgements.leftGrowth + growthJudgements.rightGrowth < ROUGHLY_SAME_SIZE_THRESHOLD;
    return growthJudgements;
  }
  // Heuristics to see if something looks like a cell/box based on box coordinate information.
  // By cell, we mean a box-shaped container of related information.
  // We call it a cell because it's generally grouped in rows and/or columns.
  // It is not necessarily a table cell.
  function getCellLayoutJudgements(node, judgements, traits, parentTraits, childJudgements, firstNonInlineTraits) {
    var cellLayoutJudgements = {};
    // Is any descendant of the candidate already a cell?
    // If yes, avoid picking this candidate because it's likely a super container.
    cellLayoutJudgements.isAncestorOfCell = !!(childJudgements && (childJudgements.isAncestorOfCell || childJudgements.isCellInCol || childJudgements.isCellInRow));
    // Is any descendant of the candidate already a cell and the candidate is much wider than the cell?
    // If yes, avoid picking this candidate because it's probably a row of cells.
    cellLayoutJudgements.isWideAncestorOfCell = cellLayoutJudgements.isAncestorOfCell && traits.percentOfViewportWidth > IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH;
    cellLayoutJudgements.isCellInCol = false;
    cellLayoutJudgements.isCellInRow = false;
    cellLayoutJudgements.hasSimilarSiblingCells = false;
    cellLayoutJudgements.hasUniformlySizedSiblingCells = false;
    function getNumChildrenWithTag(parentElem, tag) {
      if (!parentElem) {
        return 0;
      }
      var children = parentElem.children, index = children.length, numWithTag = 0;
      while (index--) {
        if (children[index].localName === tag) {
          ++numWithTag;
        }
      }
      return numWithTag;
    }
    function isPossibleCell() {
      var numSiblings = parentTraits.childCount;
      // Need multiple children
      if (1 === numSiblings) {
        return false;
      }
      // Avoid parents of existing cells
      if (cellLayoutJudgements.isAncestorOfCell) {
        return false;
      }
      // Avoid certain tags
      if (UNLIKELY_CELL_TAGS.hasOwnProperty(traits.tag)) {
        return false;
      }
      // Avoid inline blocks
      // Are we sure about this rule?
      if ("inline-block" === traits.normDisplay) {
        return false;
      }
      // If area grows too much for the number of children
      if (2 === numSiblings) {
        var parentAreaGrowthSibling1 = traits.parentHorizGrowthFactor * traits.parentVertGrowthFactor, parentAreaGrowthSibling2 = 1 / (1 - 1 / parentAreaGrowthSibling1), maxParentAreaGrowth = 2 * MAX_CELL_GROUP_GROWTH_PER_SIBLING;
        if (parentAreaGrowthSibling1 > maxParentAreaGrowth || parentAreaGrowthSibling2 > maxParentAreaGrowth) {
          return false;
        }
        if (1 === node.parentNode.getElementsByTagName("img").length) {
          return false;
        }
      }
      // Do almost all of the siblings have the same tag name?
      var $parent = $(node).parent(), numSiblingsSameTag = getNumChildrenWithTag($parent[0], traits.tag), numSiblingsOtherTagAllowed = Math.min(2, Math.floor(.33 * numSiblingsSameTag));
      if (numSiblingsSameTag < numSiblings - numSiblingsOtherTagAllowed) {
        return false;
      }
      return true;
    }
    if (isPossibleCell()) {
      var isComplex = traits !== firstNonInlineTraits, hasExactWidthSiblingCells = true, hasExactHeightSiblingCells = true, siblingsToTry = $(node).children(), numSiblingsToTest = siblingsToTry.length;
      // Look for similar widths because heights can vary when the amount of text varies
      if (numSiblingsToTest < 2) {
        hasExactWidthSiblingCells = hasExactHeightSiblingCells = false;
      } else {
        var MAX_SIBLINGS_TO_TEST = 5;
        // At least two siblings to test
        $(siblingsToTry).each(function(index, sibling) {
          var rect = traitcache.getRect(sibling);
          if (rect.width !== traits.fullWidth) {
            hasExactWidthSiblingCells = false;
            return false;
          }
          if (rect.height !== traits.rect.height) {
            hasExactHeightSiblingCells = false;
            return false;
          }
          if (index > MAX_SIBLINGS_TO_TEST) {
            return false;
          }
        });
      }
      // If it is a float, is it a float to create an appearance of cells in a row?
      // We judge this as true if:
      // - The parent height growth is relatively small, and
      // - The parent width growth is large
      // Note: often the parent row is a lot taller than the current candidate,
      // so we have to be a little forgiving on parent height growth.
      // Do we look like a cell in a column of cells?
      cellLayoutJudgements.isCellInCol = judgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR && // Approx. same width
      judgements.parentVertGrowthFactor > COLUMN_VERT_GROWTH_THRESHOLD && // Large vertical growth
      traits.percentOfViewportHeight < IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT && // Either the parent has other large cells or this cell is large
      parentTraits.visualHeightAt1x > MIN_AVERAGE_COLUMN_CELL_HEIGHT * Math.min(12, parentTraits.childCount) && traits.visualHeightAt1x > MIN_COLUMN_CELL_HEIGHT && (hasExactHeightSiblingCells && hasExactWidthSiblingCells || isComplex || judgements.vertSeparationImpact > SIGNIFICANT_SEPARATION_IMPACT);
      // Do we look like a cell in a row of cells?
      cellLayoutJudgements.isCellInRow = // Standard cell rules
      judgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR && judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD && // Large horizontal growth
      traits.percentOfViewportWidth < IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH && judgements.horizSeparationImpact > SIGNIFICANT_SEPARATION_IMPACT || // Also try floating cell-in-row rule
      parentTraits && "none" !== traits.computedStyle.float && traits.computedStyle.float !== parentTraits.computedStyle.float && (// Narrow row -- make sure height of candidate cell is nearly the height of the row
      judgements.parentVertGrowthFactor < SMALL_GROWTH_FACTOR && judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD || // Wide row -- more forgiving about height of cell compared with row
      judgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR && judgements.parentHorizGrowthFactor > EXTREME_GROWTH_FACTOR);
      cellLayoutJudgements.hasUniformlySizedSiblingCells = cellLayoutJudgements.isCellInRow && hasExactHeightSiblingCells || cellLayoutJudgements.isCellInCol && hasExactHeightSiblingCells;
    }
    return cellLayoutJudgements;
  }
  // DOM judgements
  // Judgements based on the DOM, including tags, roles and hierarchical relationships.
  // Note: authors do not always use semantics in a reasonable way. Because of this, we do not
  // weigh the use of grouping tags and roles very highly.
  function getDOMStructureJudgements(judgements, traits, childJudgements, childTraits, node, index) {
    var domJudgements = {
      isGreatTag: GREAT_TAGS.hasOwnProperty(traits.tag),
      isGoodTag: GOOD_TAGS.hasOwnProperty(traits.tag),
      isGoodRole: GOOD_ROLES.hasOwnProperty(traits.role),
      isHeading: HEADING_TAGS.hasOwnProperty(traits.tag),
      badParents: $(node).parents(BAD_PARENTS_SELECTOR).length,
      horizontalListDescendantWidth: childJudgements ? childJudgements.listAndMenuFactor < 0 ? childTraits.percentOfBodyWidth : childJudgements.horizontalListDescendantWidth : 0,
      listAndMenuFactor: !judgements.isAncestorOfCell && getListAndMenuFactor(node, traits, judgements),
      isFormControl: elemClassifier.isFormControl(node),
      // Being grouped with a single image indicates something is likely good to pick
      isGroupedWithImage: traits.visualHeightAt1x > MIN_IMAGE_GROUP_HEIGHT && (index < MAX_ANCESTOR_INDEX_IMAGE_GROUP || childJudgements.isGroupedWithImage) && isGroupedWithImage(traits, node, index),
      // A child candidate was considered a section start container
      isAncestorOfSectionStartContainer: childJudgements && (childJudgements.isSectionStartContainer || childJudgements.isAncestorOfSectionStartContainer),
      // Avoid picking things like hero images or ancestors of them
      isWideMediaContainer: null !== childJudgements && childJudgements.isWideMediaContainer || traits.isVisualMedia && traits.percentOfViewportWidth > MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH,
      // A divided group should be avoided. Rather, the subgroups should be picked.
      // Avoid picking the current candidate if it is divided by a heading or separator in the middle, because
      // it is probably an ancestor of smaller useful groups.
      numElementsDividingContent: childJudgements && childJudgements.numElementsDividingContent || numElementsDividingContent(node)
    };
    // A container that begins with a heading or dividing element is likely a good item to pick
    // Don't check if it's a section-start-container when it's an ancestor of another section start container,
    // unless the parent is about the same size as the child
    domJudgements.isSectionStartContainer = (!domJudgements.isAncestorOfSectionStartContainer || judgements.isRoughlySameSizeAsChild) && isSectionStartContainer(node) && getLeafElements(node).length > 1;
    domJudgements.isHeadingContentPair = domJudgements.isSectionStartContainer && !domJudgements.isAncestorOfSectionStartContainer && 2 === traits.childCount;
    // A heading grouped with a single item
    domJudgements.isParentOfOnlyChild = 1 === traits.childCount;
    return domJudgements;
  }
  // Is the content divided into 2 or more sections?
  // IOW, is there a heading/hr in the middle of it rather than just at the start?
  // This will return true even if there is something before the heading that is not grouped with <header>.
  function numElementsDividingContent(container) {
    // Find descendants which start a section
    var $dividingElements = $(container).find(SECTION_START_SELECTOR), // Get the last dividing element
    $lastDividingElement = $dividingElements.last();
    if (!$lastDividingElement.length) {
      return 0;
    }
    var // Used in while loop
    sibling, $sibling, // Get the dividing element we want to test
    // We use the last one that's not at the very end
    testDividingElement = $lastDividingElement[0] === container || $.contains(container, $lastDividingElement[0]) ? $dividingElements.get($dividingElements.length - 1) : $lastDividingElement, // Go up from last dividing element, to find the topmost dividing element.
    // This protects against nested dividing elements confusing us.
    parentSectionStart = $(testDividingElement).parentsUntil(container, SECTION_START_SELECTOR), // Starting point
    currentAncestor = (parentSectionStart.length ? parentSectionStart : $lastDividingElement)[0];
    if ($(currentAncestor).parents(BAD_PARENTS_SELECTOR).length) {
      return 0;
    }
    // Go up from starting point to see if a non-section-start exists before it in the container.
    while (currentAncestor && currentAncestor !== container) {
      sibling = currentAncestor.parentNode.firstElementChild;
      // Look at all the siblings before the currentAncestor
      while (sibling && sibling !== currentAncestor) {
        $sibling = $(sibling);
        if (!$sibling.is(SECTION_START_SELECTOR) && !$sibling.is(":empty") && !traitcache.isHidden(sibling, true) && !isSectionStartContainer(sibling) && !isVisualMediaSubtree(sibling)) {
          // A visible non-section-start element exists before the section-start-element, which means we are divided!
          // Return the number of section start elements
          return $dividingElements.length;
        }
        sibling = sibling.nextElementSibling;
      }
      currentAncestor = currentAncestor.parentElement;
    }
    return 0;
  }
  // Return true if visual media or the only contents are visual media
  function isVisualMediaSubtree(container) {
    if (elemClassifier.isVisualMedia(container)) {
      return true;
    }
    var leaves = getLeafElements(container);
    return 1 === leaves.length && elemClassifier.isVisualMedia(leaves[0]);
  }
  function getLeafElements(node) {
    return $(node).find("*").filter(function() {
      return 0 === this.childElementCount;
    });
  }
  // Should we even consider this node or not?
  function isUsable(traits) {
    // Don't use inlines unless they are images or other visual media
    return ("inline" !== traits.normDisplay || traits.isVisualMedia) && !UNUSABLE_TAGS.hasOwnProperty(traits.tag) && !UNUSABLE_ROLES.hasOwnProperty(traits.role);
  }
  // Menubars are bad
  // Vertical lists and menus are good
  // This attempts to provide a scoring factor for all of these similar objects
  // 0 if not a list
  // -1 if a horizontal list
  // +1 if a vertical list
  // Score is multiplied by LINK_LIST_FACTOR if a list of 3 or more links
  // Score is multiplied by OUT_OF_FLOW_LIST_FACTOR if an absolutely positioned list
  function getListAndMenuFactor(node, traits, judgements) {
    var isListOfLinks, listItems = $(node).children('li,[role|="menuitem"]'), // Also matches menuitemradio, menuitemcheckbox
    links = getLinks(node), numListItems = listItems.length, numLinks = links.length;
    function getLinks(node) {
      // First check for simple <a> direct children
      var links = $(node).children("a");
      if (links.length) {
        return links;
      }
      // If none, return <li> with a single <a> element child
      return $(node).children("li").filter(function(index, elem) {
        return 1 === elem.childElementCount && "a" === elem.firstElementChild.localName;
      });
    }
    function isMultiLine() {
      return (parseFloat(1.5 * traits.computedStyle.lineHeight) || parseFloat(2 * traits.computedStyle.fontSize)) < traits.visualHeightAt1x;
    }
    if ("ul" !== traits.tag && "menu" !== traits.role) {
      // Still check for horizontal link arrangement
      if (numLinks < 3 || judgements.totalVertGrowthFactor > 1.5 || isMultiLine() || !isArrangedHorizontally(links)) {
        return 0;
      }
      // At least 3 horizontal links -- really bad
      return -numLinks;
    }
    if (numListItems < 2) {
      return 0;
    }
    isListOfLinks = numListItems > 2 && numLinks === numListItems;
    // Same number of links as <li>
    return (isListOfLinks ? LINK_LIST_FACTOR : 1) * (judgements.isOutOfFlow ? OUT_OF_FLOW_LIST_FACTOR : 1) * (isArrangedHorizontally(listItems) ? -numListItems : 1);
  }
  function isArrangedHorizontally(items) {
    var rect1 = traitcache.getRect(items[0]), rect2 = traitcache.getRect(items[items.length - 1]);
    // If left sides line up we are vertical
    return rect1.top === rect2.top && rect1.left < rect2.left;
  }
  // Groups of related content often pair an image with text -- this is a noticeable pattern, e.g. on news sites
  function isGroupedWithImage(traits, node) {
    if (0 === traits.childCount || traits.childCount > MAX_CHILDREN_IMAGE_GROUP) {
      return false;
    }
    var images = $(node).find("img"), numGoodImages = 0, minSide = SIGNIFICANT_IMAGE_PIXELS * traitcache.getCachedViewSize().zoom;
    $(images).each(function() {
      var imageRect = traitcache.getRect(this);
      // Hidden or separator images don't count
      if (imageRect.width > minSide && imageRect.height > minSide) {
        ++numGoodImages;
      }
    });
    return 1 === numGoodImages && getLeafElements(node).length > 1;
  }
  // If the element a divider (such as <hr>), return it's thickness, otherwise return 0
  function getDividerThickness(node, side, validSideMin, validSideMax) {
    if ($(node).is(DIVIDER_SELECTOR)) {
      // Some images can be dividers as well, we will check the height and width
      // Is divider element: return the height
      var rect = traitcache.getRect(node), zoom = traitcache.getCachedViewSize().zoom, height = rect.height / zoom, width = rect.width / zoom;
      if (rect[side] >= validSideMin && rect[side] <= validSideMax && // Must be within these ranges
      height < SEPARATOR_IMAGE_PIXEL_THRESHOLD !== width < SEPARATOR_IMAGE_PIXEL_THRESHOLD) {
        // Must be thin (vert or horiz)
        return Math.min(height, width);
      }
    }
    return 0;
  }
  // Check first rendered descendant element to see if it's a heading, or any element
  // typically used to start a new section
  function isSectionStartContainer(node) {
    var child = node.firstElementChild;
    if (child && elemClassifier.isVisualMedia(child)) {
      child = child.nextElementSibling;
    }
    if (!child) {
      return false;
    }
    if ($(child).is(SECTION_START_SELECTOR)) {
      return true;
    }
    return isSectionStartContainer(child);
  }
  // Magic formula that provides a number for how impactful the margin, padding and border are for a given edge
  function getSeparationImpact(separation, borderWidth) {
    var separationImpact = Math.min(Math.pow(separation / SEPARATION_DIVISOR, SEPARATION_IMPACT_POWER), MAX_SPACE_SEPARATION_IMPACT), borderImpact = Math.min(borderWidth * BORDER_WIDTH_BONUS, MAX_BORDER_SEPARATION_IMPACT);
    return separationImpact + borderImpact;
  }
  // Position: absolute/fixed and rect sticks out from parent (not wholly encompassed by it)
  function isOutOfFlow(node, traits, parentTraits) {
    if ("absolute" !== traits.computedStyle.position && "fixed" !== traits.computedStyle.position) {
      return false;
    }
    if (0 === traits.childCount && $(node).is(":empty")) {
      return false;
    }
    // Return true if we stick out from parent
    var parentRect = parentTraits.rect, thisRect = traits.rect;
    return thisRect.left < parentRect.left || thisRect.top < parentRect.top || thisRect.right > parentRect.right || thisRect.bottom > parentRect.bottom;
  }
  // Also considered to have it's own background if the item before or after does,
  // because many times colors are alternated by even/odd row
  function hasSiblingBackground(element, parentStyle, tag) {
    // Note: don't use $.is() which uses matches with tag, since tag can be something with a : in it, and will cause an error
    var sibling = element.previousElementSibling || element.nextElementSibling, hasSiblingBg = sibling && sibling.localName === tag && sibling.hasChildNodes() && common.hasOwnBackground(sibling, traitcache.getStyle(sibling), parentStyle);
    return !!hasSiblingBg;
  }
  // Get the traits of the first non-inline element as we go up ancestor chain, because
  // inlines don't provide valuable bounding boxes for the judgement calculations.
  // At index 0 = original event target, index 1 is the parent of that, 2 is the grandparent, etc.
  // Non-inline includes block, table-cell, etc.
  function getTraitsOfFirstNonInlineCandidate(traitStack) {
    var displayStyle, index = 0, length = traitStack.length;
    for (;index < length; index++) {
      displayStyle = traitStack[index].normDisplay;
      if ("inline" !== displayStyle && "inline-block" !== displayStyle) {
        return traitStack[index];
      }
    }
    return traitStack[0];
  }
  return {
    getJudgementStack: getJudgementStack,
    provideCustomJudgements: provideCustomJudgements
  };
});

/*
 * This module determines the set of elements to highlight, given a starting element.
 *
 * Rough stages:
 * 1. Check for cached results
 * 2. Check for custom rules
 * 3. Get candidate with best score, as follows:
 *    Start element ->
 *      Candidate ancestors ->
 *        Traits (basic info for each candidate, such as bounding boxes, margins, style)->
 *          Judgements (heuristics to judge characteristics) ->
 *            Basic scores (sum of judgements * weights) ->
 *              Score thievery -- parents and children can steal from each other
 *                Leaf voting -- if there are several good choices allow the content to vote and make one decision for all
 *                  Final result
 *`
 * In this process we compute store the following arrays:
 * candidates -- an array of candidate nodes
 *          The 0th item is always the original event target, #1 is the parent, #2, grandparent, etc.
 * traitStack
 *       -- an array of corresponding traits for each node
 * judgementStack
 *       -- an array of corresponding judgements for each node (depends on traits to be computed)
 *
 * For more details see https://equinox.atlassian.net/wiki/display/EN/Picker+v2+Architecture
 */
sitecues.define("page/highlight/pick", [ "$", "page/util/common", "run/conf/preferences", "run/conf/site", "page/highlight/traitcache", "page/highlight/traits", "page/highlight/judge", "mini-core/native-global", "run/inline-style/inline-style", "run/platform" ], function($, common, pref, site, traitcache, traits, judge, nativeGlobal, inlineStyle, platform) {
  var isDebuggingOn, isVoteDebuggingOn, isAutoPickDebuggingOn, lastPicked, UNUSABLE_SCORE = -99999, // A score so low there is no chance of picking the item
  MAX_ANCESTORS_TO_ANALYZE = 14, // Maximum ancestors to climb looking for start.
  MIN_ANCESTORS_TO_ANALYZE = 4, // Three is enough -- after that, we can stop analyzing if things start to look unusable
  MAX_LEAVES_TO_VOTE = 5, // Maximum number of leaves to vote
  SECOND_BEST_IS_VIABLE_THRESHOLD = 32, // 2nd best is viable if within this many points of best score
  MIN_SCORE_TO_PICK = -200, // If nothing above this, will pick nothing
  // In order of precedence:
  PICK_RULE_DISABLE = "disable", // don't pick this anything -- not this item, any ancestor, or any descendant
  PICK_RULE_PREFER = "prefer", // pick this item
  PICK_RULE_IGNORE = "ignore", // don't pick this item
  // Use hack to avoid IE bugs where HLB on inputs does not allow editing
  GLOBAL_DISABLE_PICKER_SELECTOR = '#sitecues-badge,iframe[name="google_conversion_frame"],[data-sc-pick="' + PICK_RULE_DISABLE + '"]', // Don't pick invisible Google Adwords iframe
  // The following weights are used to multiple each judgement of the same name, defined in judgements.js
  // The score is a sum of these weights * judgements
  // Public in order to allow customizations
  judgementWeights = {
    isGreatTag: 13,
    isGoodTag: 3,
    isGoodRole: 8,
    isHeading: -8,
    badParents: -10,
    listAndMenuFactor: 18,
    horizontalListDescendantWidth: -.6,
    isGroupedWithImage: 15,
    isFormControl: 20,
    hasOwnBackground: 20,
    hasSiblingBackground: 5,
    hasRaisedZIndex: 20,
    hasDescendantWithRaisedZIndex: -50,
    isOutOfFlow: 15,
    hasDescendantOutOfFlow: UNUSABLE_SCORE,
    vertSeparationImpact: .8,
    horizSeparationImpact: .8,
    percentOfViewportHeightUnderIdealMin: -.5,
    percentOfViewportHeightOverIdealMax: -2.5,
    percentOfViewportWidthUnderIdealMin: -.7,
    percentOfViewportWidthOverIdealMax: -.5,
    nearBodyWidthFactor: -1,
    tinyHeightFactor: -3,
    tinyWidthFactor: -5,
    isExtremelyTall: UNUSABLE_SCORE,
    badGrowthTop: -.5,
    badGrowthBottom: -.5,
    large2dGrowth: -1,
    isModeratelySmallerThanParentInOneDimension: -20,
    isModeratelyLargerThanChildInOneDimension: 20,
    isCellInRow: 15,
    isCellInCol: 15,
    hasUniformlySizedSiblingCells: 15,
    hasSimilarSiblingCells: 15,
    isSectionStartContainer: 20,
    isHeadingContentPair: 20,
    // Also steals from child
    isParentOfOnlyChild: 3,
    // Also steals from child
    numElementsDividingContent: -8,
    isAncestorOfCell: -10,
    isWideAncestorOfCell: -10,
    isLargeWidthExpansion: -10,
    isWideMediaContainer: UNUSABLE_SCORE
  }, // When these judgements are not zero, part of the score transfers from a child to parent or vice vers
  // - If > 0, the parent steals this portion of the child's score
  // - In theory, if < 0, the child steals this portion of the parent's score
  //   We don't use this yet and need to make sure that a parent's score doesn't go up from the thievery
  // This is performed in separate stage after WEIGHTS used, and before voting
  THIEF_WEIGHTS = {
    isParentOfOnlyChild: .75,
    isHeadingContentPair: .75,
    isModeratelyLargerThanChildInOneDimension: .3
  }, MAX_VISUAL_BOX_CHECK_SIZE = 400, // We try to highlight even over whitespace if cursor is within a box of this size or less
  // Inject selectors via sitecues.config.picker or customization module using provideCustomSelectors()
  // Object is as follows:
  //{
  //  prefer: "[selector]",
  //  ignore: "[selector]",
  //  disable: "[selector]"
  //},
  customSelectors = site.get("picker") || {}, isVotingOn = true;
  function isValidStart(node) {
    if (!node) {
      return false;
    }
    switch (node.localName) {
     case "html":
      return false;

     case "body":
      return false;

     case "select":
      // Firefox mispositions the dropdown menu of comboboxes with size 1 in the lens, so we don't allow them to be picked
      return node.size >= 2 || !platform.browser.isFirefox;
    }
    return !isInSitecuesUI(node);
  }
  /*
   * ----------------------- PUBLIC -----------------------
   *
   * MAIN FUNCTION AND ENTRY POINT
   * Find the best highlightable element, if any, given a target element.
   * Returns JQuery object if anything picked, otherwise null (never returns JQuery object of length 0)
   *
   * @param hover The element the mouse is hovering over
   */
  function find(startElement, doSuppressVoting) {
    var candidates, picked;
    function processResult(result) {
      lastPicked = result && result[0];
      return result;
    }
    // 1. Don't pick anything in the sitecues UI
    if (!isValidStart(startElement)) {
      return null;
    }
    // 1.5. If over a map, use associated image element for processing
    if ("area" === startElement.localName) {
      startElement = getImageForMapArea(startElement);
    }
    // 2. Reset trait cache
    traitcache.resetCache();
    // 3. Get candidate nodes that could be picked
    // Remove any ancestor that has the #sitecues-badge as a descendant
    candidates = getCandidates(startElement);
    // 4. Don't pick anything when over whitespace
    //    Avoids slow, jumpy highlight, and selecting ridiculously large containers
    if (!candidates || !hasVisibleContent(candidates)) {
      return null;
    }
    // 5. Get deterministic result
    //    a) from customizations or
    //    b) previously stored picker results
    picked = getDeterministicResult(candidates);
    if (null !== picked) {
      return processResult(picked[0] ? picked : null);
    }
    // 6. Get result from heuristics taking into account votes from leaves of content
    picked = getHeuristicResult(candidates, isVotingOn && !doSuppressVoting);
    // 7. Save results for next time
    lastPicked = picked;
    return processResult(picked ? $(picked) : null);
  }
  function reset() {
    lastPicked = null;
  }
  function getCandidates(startElement) {
    var allAncestors = $(startElement).parentsUntil("body"), validAncestors = getVisibleAncestors(allAncestors);
    if (0 === validAncestors.length) {
      return [ startElement ];
    }
    if (lastPicked) {
      var isAncestorOfLastPicked = false;
      // Remove ancestors of the last picked item from possible selection
      // This improves picker consistency and improves performance (fewer elements to check)
      validAncestors = $(validAncestors).filter(function() {
        if (isAncestorOfLastPicked || $.contains(this, lastPicked)) {
          isAncestorOfLastPicked = true;
          return false;
        } else {
          return true;
        }
      });
    }
    return [ startElement ].concat($.makeArray(validAncestors));
  }
  function getVisibleAncestors(ancestors) {
    var opacity = null, index = ancestors.length;
    while (index--) {
      opacity = traitcache.getStyleProp(ancestors[index], "opacity");
      if ("0" === opacity) {
        ancestors = ancestors.slice(index + 1, ancestors.length - 1);
        break;
      }
    }
    return ancestors;
  }
  function getImageForMapArea(element) {
    var mapName = $(element).closest("map").attr("name"), imageSelector = 'img[usemap="#' + mapName + '"]';
    return mapName ? $(imageSelector)[0] : null;
  }
  // --------- Deterministic results ---------
  // A deterministic result is a hard rule for picking a specific element,
  // or for picking nothing when the element is an ancestor.
  // Ways a deterministic result can occur:
  // 1) A customization via provideCustomSelectors() e.g. { disable:"[selector]", prefer: "[selector]" }
  // 2) HTML attribute @data-sc-pick on the element itself ('prefer' or 'disable') -- see PICK_RULE_FOO constants
  function getDeterministicResult(candidates) {
    // 1. Check customizations
    var picked = getCustomizationResult(candidates);
    if (picked) {
      return picked;
    }
    // 2. Check @data-sc-pick (markup-specified rule)
    return getPickRuleResult(candidates);
  }
  function getPickRuleResult(candidates) {
    var picked = null;
    function checkPickRuleForElement(item) {
      var pickRule = $(item).attr("data-sc-pick");
      if (pickRule === PICK_RULE_PREFER) {
        picked = $(item);
      }
    }
    // Check @data-sc-pick for values in PICK_RULE_DISABLE or PICK_RULE_PREFER
    candidates.some(checkPickRuleForElement);
    return picked;
  }
  // What elements should picking be disabled on?
  function getPickingDisabledSelector() {
    var selector = customSelectors.disable ? customSelectors.disable.slice() : "";
    // TODO: Once HLB'd form controls no longer crashes MS Edge we can remove it, at least for those versions
    // For now: make sure we don't pick those controls by adding them to the custom disabled selector
    selector = (selector ? selector + "," : "") + GLOBAL_DISABLE_PICKER_SELECTOR;
    if (platform.isFirefox) {
      selector += ',select[size="1"],select:not([size])';
    }
    return selector;
  }
  // Return a jQuery object with a result determined from customizations,
  // or null if no customization applies.
  function getCustomizationResult(candidates) {
    var picked, $candidates = $(candidates), pickingDisabledSelector = getPickingDisabledSelector();
    // 1. Customizations in picker.disable = "[selector]";
    if (pickingDisabledSelector && $candidates.is(pickingDisabledSelector)) {
      return $();
    }
    // 2. Customizations in picker.prefer = "[selector]";
    if (customSelectors.prefer) {
      picked = $candidates.filter(customSelectors.prefer).first();
      if (picked.length) {
        return picked;
      }
    }
    return null;
  }
  // --------- Heuristic results ---------
  function performVote(scoreObjs, origBestIndex, candidates) {
    var bestIndex = origBestIndex, extraWork = 0;
    function getNumericScore(scoreObj) {
      return scoreObj.score;
    }
    while (true) {
      var minSecondBestScore = scoreObjs[bestIndex].score - SECOND_BEST_IS_VIABLE_THRESHOLD;
      var secondBestIndex = getCandidateWithHighestScore(scoreObjs, minSecondBestScore, bestIndex);
      if (secondBestIndex < 0) {
        var scores = scoreObjs.map(getNumericScore);
        if (true && isVoteDebuggingOn) {
          console.log("--> break no other competitors: " + nativeGlobal.JSON.stringify(scores));
        }
        break;
      }
      if (true && isVoteDebuggingOn) {
        console.log("1st = %d (score=%d) %O", bestIndex, scoreObjs[bestIndex].score, candidates[bestIndex]);
        console.log("2nd = %d (score=%d) %O", secondBestIndex, scoreObjs[secondBestIndex].score, candidates[secondBestIndex]);
      }
      // 3. Choose between first and second best candidate
      ++extraWork;
      var topIndex = Math.max(bestIndex, secondBestIndex), // Top-most (container) choice
      topElement = candidates[topIndex], bottomIndex = Math.min(bestIndex, secondBestIndex), // Bottom-most (not container) choice
      leaves = getLeavesForVote(candidates[topIndex], candidates[bottomIndex]), leafIndex = 0, votesForTop = topIndex === bestIndex ? 1 : -1;
      if (true && isVoteDebuggingOn) {
        console.log("Starting vote: " + votesForTop);
      }
      for (;leafIndex < leaves.length; leafIndex++) {
        var candidatesForVote = getCandidates(leaves[leafIndex]), scoresForVote = getScores(candidatesForVote), leafVoteIndex = getCandidateWithHighestScore(scoresForVote), isVoteForTop = candidatesForVote[leafVoteIndex] === topElement;
        if (true && isVoteDebuggingOn) {
          console.log("Vote for top ? %s ---> %o voted for %O", isVoteForTop, leaves[leafIndex].firstChild || leaves[leafIndex], candidatesForVote[leafVoteIndex]);
        }
        votesForTop += isVoteForTop ? 1 : -1;
      }
      // The voters have chosen ...
      if (votesForTop < 0) {
        // The lower candidates to be highlighted as individuals
        bestIndex = bottomIndex;
        secondBestIndex = topIndex;
      } else {
        // The upper candidate as a single highlighted container
        bestIndex = topIndex;
        secondBestIndex = bottomIndex;
      }
      if (true) {
        modifyResultsFromVote(votesForTop, scoreObjs, bestIndex, secondBestIndex);
      }
      scoreObjs[bestIndex].score = Math.max(scoreObjs[topIndex].score, scoreObjs[bottomIndex].score);
      // The new champ
      scoreObjs[secondBestIndex].score = MIN_SCORE_TO_PICK;
    }
    if (true && isVoteDebuggingOn) {
      if (origBestIndex !== bestIndex) {
        inlineStyle.set(candidates[origBestIndex], {
          outline: "2px solid red"
        });
        inlineStyle.set(candidates[bestIndex], {
          outline: "2px solid green"
        });
      } else {
        console.log("Extra work " + extraWork);
        inlineStyle.set(candidates[bestIndex], {
          outline: 4 * extraWork + "px solid orange"
        });
      }
      nativeGlobal.setTimeout(function() {
        inlineStyle.set(candidates[origBestIndex], {
          outline: ""
        });
        inlineStyle.set(candidates[bestIndex], {
          outline: ""
        });
      }, 1e3);
    }
    return bestIndex;
  }
  function getHeuristicResult(candidates, doAllowVoting) {
    // 1. Get the best candidate (pre-voting)
    var bestIndex, votedBestIndex, scoreObjs = getScores(candidates), pickingDisabledSelector = getPickingDisabledSelector();
    function processResult(pickedIndex) {
      // Log the results if necessary for debugging
      if (true && isDebuggingOn) {
        sitecues.require([ "pick-debug" ], function(pickDebug) {
          // Use sitecues.togglePickerDebugging() to turn on the logging
          pickDebug.logHeuristicResult(scoreObjs, bestIndex, candidates);
        });
      }
      return pickedIndex < 0 ? null : candidates[pickedIndex];
    }
    function containsItemsDisabledForPicker(index) {
      return $(candidates[index]).has(pickingDisabledSelector).length > 0;
    }
    // 2. Get the best candidate that's not disabled in the picker
    while (true) {
      bestIndex = getCandidateWithHighestScore(scoreObjs);
      if (bestIndex < 0) {
        return processResult(-1);
      }
      if (!containsItemsDisabledForPicker(bestIndex)) {
        // Does not contain picker-disabled item -- therefore this result is legal
        // We know the candidate itself is not picker-disabled, because those are filtered out in an earlier stage,
        // but here we did the more expensive check of looking at all descendants
        break;
      }
      // Remove all of the candidates that include the disabled item, and then try again
      candidates = candidates.slice(bestIndex + 1);
      scoreObjs = scoreObjs.slice(bestIndex + 1);
    }
    // 3. Get the best candidate after voting by other nearby textnodes
    if (doAllowVoting) {
      votedBestIndex = performVote(scoreObjs, bestIndex, candidates);
      // If the voted best index is a container, we need to doublecheck that it's allowable (no picker-disabled items)
      if (votedBestIndex >= bestIndex || !containsItemsDisabledForPicker(votedBestIndex)) {
        bestIndex = votedBestIndex;
      }
    }
    return processResult(bestIndex);
  }
  // Allow leaf voting to modify results, thus improving overall consistency
  function modifyResultsFromVote(votesForTop, scoreObjs, bestIndex, secondBestIndex) {
    if (isVoteDebuggingOn) {
      console.log("votesForTop = " + votesForTop);
    }
    // Debug info
    var deltaBest = scoreObjs[bestIndex].score - scoreObjs[secondBestIndex].score, deltaSecondBest = MIN_SCORE_TO_PICK - scoreObjs[secondBestIndex].score;
    if (deltaBest) {
      scoreObjs[bestIndex].factors.push({
        about: "vote-winner",
        value: deltaBest,
        weight: 1
      });
    }
    if (deltaSecondBest) {
      scoreObjs[secondBestIndex].factors.push({
        about: "vote-loser",
        value: deltaSecondBest,
        weight: 1
      });
    }
  }
  function getLeavesForVote(startElement, avoidSubtree) {
    // Fastest way to get images and up to MAX_LEAVES_TO_VOTE
    var allLeaves = [], candidates = [], imageLeaves = startElement.getElementsByTagName("img");
    function isAcceptableTextLeaf(node) {
      // Logic to determine whether to accept, reject or skip node
      if (common.isWhitespaceOrPunct(node)) {
        return;
      }
      var element = node.parentNode;
      if (element === avoidSubtree || $.contains(avoidSubtree, element)) {
        return;
      }
      return true;
    }
    // Retrieve some leaf nodes
    var nodeIterator = document.createNodeIterator(startElement, NodeFilter.SHOW_TEXT, null, false);
    function nextNode() {
      var node;
      while (true) {
        node = nodeIterator.nextNode();
        if (!node) {
          return null;
        } else {
          if (isAcceptableTextLeaf(node)) {
            return node;
          }
        }
      }
    }
    nextNode();
    var numLeaves = 0;
    while (numLeaves < 3 * MAX_LEAVES_TO_VOTE) {
      var nextTextLeaf = nextNode();
      if (!nextTextLeaf) {
        break;
      }
      allLeaves[numLeaves++] = nextTextLeaf.parentNode;
    }
    // Get an even sampling of the leaf nodes
    var numberToSkipForEvenSampling = Math.max(1, Math.floor(numLeaves / MAX_LEAVES_TO_VOTE)), index = numberToSkipForEvenSampling;
    for (;index < numLeaves; index += numberToSkipForEvenSampling) {
      // Get an even sampling of the leaves, and don't prefer the ones at the top
      // as they are often not representative of the content
      var candidate = allLeaves[index], $candidate = $(candidate);
      // We don't use hidden candidates or those in headings
      // Headings are often anomalous
      if (0 === $candidate.closest("h1,h2,h3,h4,h5,h6").length && !traitcache.isHidden(candidate, true)) {
        candidates.push(candidate);
      }
    }
    // Add up to one image in as a tie-breaking vote
    if (imageLeaves.length) {
      candidates.push(imageLeaves[0]);
    }
    return candidates;
  }
  /**
   * Return JQuery collection representing element(s) to highlight
   * Can return empty collection if there are no appropriate elements.
   * Uses a scoring system for each candidate.
   */
  function getScores(candidates) {
    // 1. Limit the number of candidate nodes we analyze (for performance)
    var restrictedCandidates = candidates.slice(0, MAX_ANCESTORS_TO_ANALYZE);
    // 2. Get traits -- basic info such as tag, role, style, coordinates
    var traitStack = traits.getTraitStack(restrictedCandidates);
    // 3. Get judgements -- higher level concepts from hand-tweaked logic
    var judgementStack = judge.getJudgementStack(traitStack, restrictedCandidates);
    // 4. Get scores
    var scoreObjs = [], index = 0;
    for (;index < judgementStack.length; index++) {
      var judgements = judgementStack[index], scoreObj = computeScore(judgements, candidates[index], index);
      scoreObj.judgements = judgements;
      scoreObj.traits = traitStack[index];
      if (index > MIN_ANCESTORS_TO_ANALYZE && scoreObj.score < MIN_SCORE_TO_PICK && scoreObjs[index - 1].score < MIN_SCORE_TO_PICK) {
        break;
      }
      scoreObjs.push(scoreObj);
    }
    // 5. Parents of only children are strongly influenced by that child
    refineParentScores(scoreObjs);
    return scoreObjs;
  }
  function isUsable(element, judgements) {
    // If no judgements exist, the candidate was already marked as unusable by the judgements system
    if (!judgements.isUsable) {
      return false;
    }
    // Check custom selectors
    if (customSelectors.ignore && $(element).is(customSelectors.ignore)) {
      return false;
    }
    // Check data attribute
    if (element.getAttribute("data-sc-pick") === PICK_RULE_IGNORE) {
      return false;
    }
    return true;
  }
  if (true) {}
  // Get the score for the candidate node at the given index
  function computeScore(judgements, element, index) {
    // 1. Check if usable: if item is not usable mark it as such
    // TODO give each isUsable() a different name
    if (!isUsable(element, judgements)) {
      return {
        score: UNUSABLE_SCORE,
        factors: [],
        // Debug info
        about: "Ancestor #" + index + ". Unusable/ignored",
        // Debug info
        isUsable: false
      };
    }
    // 2. Compute score: add up judgements * weights
    var factorKey, value, scoreDelta, weight, scoreObj = {
      score: 0,
      factors: [],
      // Debug info
      about: "Ancestor #" + index,
      // Debug info
      isUsable: true
    };
    for (factorKey in judgementWeights) {
      if (judgementWeights.hasOwnProperty(factorKey)) {
        value = judgements[factorKey];
        weight = judgementWeights[factorKey] || 0;
        scoreDelta = value * weight;
        // value is a numeric or boolean value: for booleans, JS treats true=1, false=0
        scoreObj.score += scoreDelta;
        if (true) {
          scoreObj.factors.push({
            about: factorKey,
            value: value,
            weight: weight,
            impact: scoreDelta
          });
        }
      }
    }
    return scoreObj;
  }
  // Return index of item with best score or -1 if nothing is viable
  // excludeIndex is an index to ignore (so we can easily get second best)
  // minScore is the minimum score before considering
  function getCandidateWithHighestScore(scoreObjs, minScore, excludeIndex) {
    var index, bestScore = minScore || UNUSABLE_SCORE, bestScoreIndex = -1;
    for (index = 0; index < scoreObjs.length; index++) {
      if (index !== excludeIndex && scoreObjs[index].score > bestScore) {
        bestScore = scoreObjs[index].score;
        bestScoreIndex = index;
      }
    }
    return bestScore > MIN_SCORE_TO_PICK ? bestScoreIndex : -1;
  }
  //  ----------- Score refinement section -----------
  // For every parent, add child's score to the parent * (refinement weights)
  // A parent is likely to be even more right/wrong than its child
  // Therefore the child's goodness reflects on the parent. We add it's score to the parent score.
  // The benefits of doing this are that if there is a container of child node that has no siblings,
  // or just adds a heading, we tend to prefer the container over the child.
  // If the child is bad, we tend to pick neither.
  function refineParentScores(scoreObjs) {
    var index, reasonToSteal, delta, weight, childScore, parentJudgement, childIndex = -1;
    for (index = 0; index < scoreObjs.length; index++) {
      if (childIndex >= 0 && scoreObjs[index].isUsable && scoreObjs[index].score > MIN_SCORE_TO_PICK) {
        for (reasonToSteal in THIEF_WEIGHTS) {
          if (THIEF_WEIGHTS.hasOwnProperty(reasonToSteal)) {
            childScore = scoreObjs[childIndex].score;
            // Child's score
            weight = THIEF_WEIGHTS[reasonToSteal];
            parentJudgement = scoreObjs[index].judgements[reasonToSteal];
            delta = childScore * weight * parentJudgement;
            // How much to steal from child
            if (delta) {
              scoreObjs[index].score += delta;
              if (true) {
                scoreObjs[index].factors.push({
                  about: reasonToSteal + "-from-child",
                  // Debug info
                  value: childScore,
                  weight: weight
                });
              }
              if (delta > 0) {
                // Only take from child, don't give
                scoreObjs[childIndex].score -= delta;
                scoreObjs[childIndex].factors.push({
                  about: reasonToSteal + "-from-parent",
                  value: childScore,
                  weight: -weight
                });
              }
            }
          }
        }
      }
      if (scoreObjs[index].isUsable) {
        childIndex = index;
      }
    }
  }
  function hasVisibleContent(candidates) {
    // First check for direct visible text nodes
    if (common.hasVisibleContent(candidates[0])) {
      return true;
    }
    // Otherwise, see if we are inside of a box
    var candidate, rect, style, index = 0, zoom = pref.get("zoom") || 1;
    for (;index < candidates.length; index++) {
      candidate = candidates[index];
      if (lastPicked && $.contains(candidate, lastPicked)) {
        break;
      }
      rect = traitcache.getRect(candidate);
      style = traitcache.getStyle(candidate);
      if (rect.width / zoom > MAX_VISUAL_BOX_CHECK_SIZE || rect.height / zoom > MAX_VISUAL_BOX_CHECK_SIZE) {
        break;
      }
      if (common.isVisualRegion(candidate, style, traitcache.getStyle(candidate.parentNode))) {
        return true;
      }
    }
    return false;
  }
  // This gives us a score for how good what we want to auto pick is.
  // Auto picking is where we highlight something useful onscreen after the user presses space with no highlight.
  // The candidate passed in is guaranteed to be at least partly onscreen
  function getAutoPickScore(picked, fixedRect, absoluteRect, bodyWidth, bodyHeight) {
    var MIN_TOP_COORDINATE_PREFERRED = 100;
    var MIN_SIGNIFICANT_TEXT_LENGTH = 25;
    var topRole = picked.parents("[role]").last().attr("role");
    var winHeight = window.innerHeight;
    // 1. Get basic scoring info
    var scoreInfo = {
      isAtTopOfScreen: fixedRect.top < MIN_TOP_COORDINATE_PREFERRED,
      isAtTopOfDoc: absoluteRect.top < MIN_TOP_COORDINATE_PREFERRED,
      isOnTopHalfOfScreen: fixedRect >= MIN_TOP_COORDINATE_PREFERRED && fixedRect.top < .6 * winHeight,
      isPartlyBelowBottom: fixedRect.bottom > winHeight,
      isMostlyBelowBottom: fixedRect.top + fixedRect.height / 2 > winHeight,
      hasSignificantText: picked.text().length > MIN_SIGNIFICANT_TEXT_LENGTH,
      headingScore: function() {
        // Prefer something with a heading (h1 excellent, h2 very good, h3 okay)
        var headings = picked.find("h1,h2,h3,h4,h5,h6").addBack();
        return 3 * (headings.filter("h1").length > 0) || 2 * (headings.filter("h2").length > 0) || headings.length > 0;
      }(),
      isInMainContent: "main" === topRole,
      hasBadAriaRole: !!topRole && "main" !== topRole,
      isInTallAndNarrowContainer: 0,
      isInTallAndWideContainer: 0
    };
    var isWide, isTall;
    // 2. Use a size heuristic
    var portionOfBodyWidth, portionOfBodyHeight, ancestorRect, ancestor = picked[0], isInWideContainer = 0, isInTallContainer = 0;
    while ("body" !== ancestor.localName) {
      ancestorRect = traitcache.getScreenRect(ancestor);
      portionOfBodyWidth = ancestorRect.width / bodyWidth;
      portionOfBodyHeight = ancestorRect.height / bodyHeight;
      if (portionOfBodyWidth < .3 && ancestorRect.height > 2 * ancestorRect.width) {
        // We're in a tall container -- probably a sidebar
        isInWideContainer = 0;
        scoreInfo.isInTallAndNarrowContainer = 1;
        scoreInfo.skip = ancestor;
        // Skip past the rest of this
        break;
      }
      if (portionOfBodyWidth > .5 && portionOfBodyWidth < .95) {
        isWide = 1;
      }
      if (portionOfBodyHeight > .75 && portionOfBodyHeight < .95) {
        isTall = 1;
      }
      ancestor = ancestor.parentNode;
    }
    scoreInfo.isInTallAndWideContainer = isInWideContainer && isInTallContainer;
    scoreInfo.score = !scoreInfo.isAtTopOfScreen + !scoreInfo.isAtTopOfDoc + scoreInfo.isOnTopHalfOfScreen + scoreInfo.isPartlyBelowBottom * -2 + scoreInfo.isMostlyBelowBottom * -2 + scoreInfo.headingScore + 2 * scoreInfo.hasSignificantText + 2 * scoreInfo.isInMainContent + scoreInfo.hasBadAriaRole * -3 + scoreInfo.isInTallAndNarrowContainer * -4 + 2 * scoreInfo.isInTallAndWideContainer;
    if (true && isAutoPickDebuggingOn) {
      console.log("%d: %o", scoreInfo.score, picked[0]);
      console.log("   %O %s", scoreInfo, picked.text().substr(0, 30).trim());
    }
    return scoreInfo;
  }
  // -------------- Customizations ----------------------
  // See https://equinox.atlassian.net/wiki/display/EN/Picker+hints+and+customizations
  // This is a hook for customization scripts, which can add their own judgements by overriding this method.
  function provideCustomSelectors(selectors) {
    customSelectors = selectors;
  }
  // This is a hook for customization scripts, which can add their own judgements by overriding this method.
  // Weights can be changed for pre-existing or added for custom judgements
  // Pass in as { judgementName: weightValue, judgementName2: weightValue2, etc. }
  function provideCustomWeights(weights) {
    $.extend(judgementWeights, weights);
  }
  // Return true if the element is part of the sitecues user interface
  // Everything inside the <body> other than the page-inserted badge
  function isInSitecuesUI(node) {
    var element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    // Is not in the <body> (must also check clone body)
    return !$(element).closest("body").length || $(element).closest("#sitecues-badge,#scp-bp-container").length;
  }
  if (true) {
    // --- For debugging ----------------------
    sitecues.pickFrom = function(element) {
      return find(element);
    };
    sitecues.togglePickerDebugging = function() {
      console.log("Picker debugging: " + (isDebuggingOn = !isDebuggingOn));
    };
    sitecues.togglePickerVoteDebugging = function() {
      console.log("Picker vote debugging: " + (isVoteDebuggingOn = !isVoteDebuggingOn));
    };
    sitecues.togglePickerVoting = function() {
      console.log("Picker voting: " + (isVotingOn = !isVotingOn));
    };
    sitecues.toggleAutoPickDebugging = function() {
      console.log("Auto pick debugging: " + (isAutoPickDebuggingOn = !isAutoPickDebuggingOn));
    };
  }
  return {
    find: find,
    reset: reset,
    getAutoPickScore: getAutoPickScore,
    provideCustomSelectors: provideCustomSelectors,
    provideCustomWeights: provideCustomWeights
  };
});

/**
 * Service that converts color strings into an rgba object { r: number, g: number, b: number, a: number }
 */
sitecues.define("page/util/color", [ "run/inline-style/inline-style" ], function(inlineStyle) {
  var TRANSPARENT = "rgba(0, 0, 0, 0)", MIN_LUMINOSITY_LIGHT_TONE = .62;
  function isDarkColor(colorValue, optionalThreshold) {
    var rgba = getRgba(colorValue);
    return getPerceivedLuminance(rgba) < (optionalThreshold || MIN_LUMINOSITY_LIGHT_TONE);
  }
  function isOnDarkBackground(current, optionalThreshold) {
    var currentBackgroundColor, currentRect, origRect, origElement = current;
    while (current) {
      currentBackgroundColor = getRgba(window.getComputedStyle(current).backgroundColor);
      // Only care about non-transparent backgrounds
      if (currentBackgroundColor.a > .5) {
        origRect = origRect || origElement.getBoundingClientRect();
        currentRect = current.getBoundingClientRect();
        if (currentRect.right > origRect.left && currentRect.left < origRect.right && currentRect.bottom > origRect.top && currentRect.top < origRect.bottom) {
          return isDarkColor(currentBackgroundColor, optionalThreshold);
        }
      }
      current = current.parentElement;
    }
    return false;
  }
  // Convert color names such as 'white', 'black', 'transparent' to rgba object or TRANSPARENT
  function convertColorNameToRgbFormat(colorName) {
    // APPROACH #1 is fast but bloats library by 1.6k with COLOR_NAMES_MAP
    //    var hexVal = colorUtil.COLOR_NAMES_MAP[colorName];
    //    if (typeof hexVal === 'undefined') {
    //      return 'rgba(0, 0, 0, 0)';
    //    }
    //
    //    var red = Math.floor(hexVal / 0x10000) % 256,
    //      green = Math.floor(hexVal / 0x100) % 256,
    //      blue = hexVal % 256;
    //
    //    return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
    // APPROACH #2 is slower (~34ms on Chrome) but does not require COLOR_NAMES_MAP
    // Setting the border on the <body> and then immediately resetting will not cause a visible change
    var rgb, docElem = document.documentElement;
    if ("initial" === colorName || "inherit" === colorName || "transparent" === colorName) {
      return TRANSPARENT;
    }
    inlineStyle.override(docElem, {
      outlineColor: colorName
    });
    var isLegalColor = inlineStyle(docElem).outlineColor;
    // Browser didn't set the border color -> not a legal color
    rgb = isLegalColor && getComputedStyle(docElem).outlineColor;
    inlineStyle.restore(docElem, "outline-color");
    return rgb;
  }
  function getColorString(rgba) {
    function isAlphaRelevant(alpha) {
      return alpha >= 0 && alpha < 1;
    }
    var rgb = Math.round(rgba.r) + "," + Math.round(rgba.g) + "," + Math.round(rgba.b);
    return isAlphaRelevant(rgba.a) ? "rgba(" + rgb + "," + rgba.a + ")" : "rgb(" + rgb + ")";
  }
  function getRgbaIfLegalColor(color) {
    if (!color) {
      return;
    }
    if ("object" === typeof color) {
      return color;
    }
    // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
    var rgb;
    if ("rgb" !== color.substr(0, 3)) {
      rgb = convertColorNameToRgbFormat(color);
      if (!rgb) {
        return;
      }
    } else {
      rgb = color;
    }
    var MATCH_COLORS = /rgba?\((\d+), ?(\d+), ?(\d+),?( ?[\d?.]+)?\)/, match = MATCH_COLORS.exec(rgb) || {};
    return {
      r: parseInt(match[1] || 0),
      g: parseInt(match[2] || 0),
      b: parseInt(match[3] || 0),
      a: parseFloat(match[4] || 1)
    };
  }
  /**
   * Ensure that an rgba object is returned. Will use TRANSPARENT if necessary.
   * @param color
   */
  function getRgba(color) {
    return getRgbaIfLegalColor(color) || {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    };
  }
  //  colorUtil.COLOR_NAMES_MAP = {
  //    // System color names -- currently based on OS X colors
  //    // To get a color code for a certain system color, do the following:
  //    // function getHexCode(color) {
  //    //   document.body. style.color = color; var rgb = getRgba(getComputedStyle(document.body).color); var num = rgb.r * 256 * 256 + rgb.g * 256 + rgb.b; console.log('0x' + num.toString(16));
  //    // }
  //
  //    buttonface: 0xc0c0c0,
  //    buttonhighlight: 0xe9e9e9,
  //    buttonshadow: 0x9fa09f,
  //    buttontext: 0,
  //    captiontext: 0,
  //    graytext: 0x7f7f7f,
  //    highlighttext: 0,
  //    inactiveborder: 0xffffff,
  //    inactivecaption: 0xffffff,
  //    inactivecaptiontext: 0,
  //    infobackground: 0xfbfcc5,
  //    infotext: 0,
  //    menu: 0xf6f6f6,
  //    menutext: 0xffffff,
  //    scrollbar: 0xaaaaaa,
  //    threeddarkshadow: 0,
  //    threedface: 0xc0c0c0,
  //    threedhighlight: 0xffffff,
  //    threedlightshadow: 0xffffff,
  //    threedshadow: 0,
  //    window: 0xececec,
  //    windowtext: 0,
  //    windowframe: 0xaaaaaa,
  //
  //    // Traditional color names
  //    aliceblue: 0xf0f8ff,
  //    antiquewhite: 0xfaebd7,
  //    aqua: 0x00ffff,
  //    aquamarine: 0x7fffd4,
  //    azure: 0xf0ffff,
  //    beige: 0xf5f5dc,
  //    bisque: 0xffe4c4,
  //    black: 0x000000,
  //    blanchedalmond: 0xffebcd,
  //    blue: 0x0000ff,
  //    blueviolet: 0x8a2be2,
  //    brown: 0xa52a2a,
  //    burlywood: 0xdeb887,
  //    cadetblue: 0x5f9ea0,
  //    chartreuse: 0x7fff00,
  //    chocolate: 0xd2691e,
  //    coral: 0xff7f50,
  //    cornflowerblue: 0x6495ed,
  //    cornsilk: 0xfff8dc,
  //    crimson: 0xdc143c,
  //    cyan: 0x00ffff,
  //    darkblue: 0x00008b,
  //    darkcyan: 0x008b8b,
  //    darkgoldenrod: 0xb8860b,
  //    darkgray: 0xa9a9a9,
  //    darkgreen: 0x006400,
  //    darkkhaki: 0xbdb76b,
  //    darkmagenta: 0x8b008b,
  //    darkolivegreen: 0x556b2f,
  //    darkorange: 0xff8c00,
  //    darkorchid: 0x9932cc,
  //    darkred: 0x8b0000,
  //    darksalmon: 0xe9967a,
  //    darkseagreen: 0x8fbc8f,
  //    darkslateblue: 0x483d8b,
  //    darkslategray: 0x2f4f4f,
  //    darkturquoise: 0x00ced1,
  //    darkviolet: 0x9400d3,
  //    deeppink: 0xff1493,
  //    deepskyblue: 0x00bfff,
  //    dimgray: 0x696969,
  //    dodgerblue: 0x1e90ff,
  //    firebrick: 0xb22222,
  //    floralwhite: 0xfffaf0,
  //    forestgreen: 0x228b22,
  //    fuchsia: 0xff00ff,
  //    gainsboro: 0xdcdcdc,
  //    ghostwhite: 0xf8f8ff,
  //    gold: 0xffd700,
  //    goldenrod: 0xdaa520,
  //    gray: 0x808080,
  //    green: 0x008000,
  //    greenyellow: 0xadff2f,
  //    honeydew: 0xf0fff0,
  //    hotpink: 0xff69b4,
  //    indianred: 0xcd5c5c,
  //    indigo: 0x4b0082,
  //    ivory: 0xfffff0,
  //    khaki: 0xf0e68c,
  //    lavender: 0xe6e6fa,
  //    lavenderblush: 0xfff0f5,
  //    lawngreen: 0x7cfc00,
  //    lemonchiffon: 0xfffacd,
  //    lightblue: 0xadd8e6,
  //    lightcoral: 0xf08080,
  //    lightcyan: 0xe0ffff,
  //    lightgoldenrodyellow: 0xfafad2,
  //    lightgray: 0xd3d3d3,
  //    lightgreen: 0x90ee90,
  //    lightpink: 0xffb6c1,
  //    lightsalmon: 0xffa07a,
  //    lightseagreen: 0x20b2aa,
  //    lightskyblue: 0x87cefa,
  //    lightslategray: 0x778899,
  //    lightsteelblue: 0xb0c4de,
  //    lightyellow: 0xffffe0,
  //    lime: 0x00ff00,
  //    limegreen: 0x32cd32,
  //    linen: 0xfaf0e6,
  //    magenta: 0xff00ff,
  //    maroon: 0x800000,
  //    mediumaquamarine: 0x66cdaa,
  //    mediumblue: 0x0000cd,
  //    mediumorchid: 0xba55d3,
  //    mediumpurple: 0x9370db,
  //    mediumseagreen: 0x3cb371,
  //    mediumslateblue: 0x7b68ee,
  //    mediumspringgreen: 0x00fa9a,
  //    mediumturquoise: 0x48d1cc,
  //    mediumvioletred: 0xc71585,
  //    midnightblue: 0x191970,
  //    mintcream: 0xf5fffa,
  //    mistyrose: 0xffe4e1,
  //    moccasin: 0xffe4b5,
  //    navajowhite: 0xffdead,
  //    navy: 0x000080,
  //    oldlace: 0xfdf5e6,
  //    olive: 0x808000,
  //    olivedrab: 0x6b8e23,
  //    orange: 0xffa500,
  //    orangered: 0xff4500,
  //    orchid: 0xda70d6,
  //    palegoldenrod: 0xeee8aa,
  //    palegreen: 0x98fb98,
  //    paleturquoise: 0xafeeee,
  //    palevioletred: 0xdb7093,
  //    papayawhip: 0xffefd5,
  //    peachpuff: 0xffdab9,
  //    peru: 0xcd853f,
  //    pink: 0xffc0cb,
  //    plum: 0xdda0dd,
  //    powderblue: 0xb0e0e6,
  //    purple: 0x800080,
  //    rebeccapurple: 0x663399,
  //    red: 0xff0000,
  //    rosybrown: 0xbc8f8f,
  //    royalblue: 0x4169e1,
  //    saddlebrown: 0x8b4513,
  //    salmon: 0xfa8072,
  //    sandybrown: 0xf4a460,
  //    seagreen: 0x2e8b57,
  //    seashell: 0xfff5ee,
  //    sienna: 0xa0522d,
  //    silver: 0xc0c0c0,
  //    skyblue: 0x87ceeb,
  //    slateblue: 0x6a5acd,
  //    slategray: 0x708090,
  //    snow: 0xfffafa,
  //    springgreen: 0x00ff7f,
  //    steelblue: 0x4682b4,
  //    tan: 0xd2b48c,
  //    teal: 0x008080,
  //    thistle: 0xd8bfd8,
  //    tomato: 0xff6347,
  //    turquoise: 0x40e0d0,
  //    violet: 0xee82ee,
  //    wheat: 0xf5deb3,
  //    white: 0xffffff,
  //    whitesmoke: 0xf5f5f5,
  //    yellow: 0xffff00,
  //    yellowgreen: 0x9acd32
  //  };
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The monochromeHue
   * @param   Number  s       The saturation
   * @param   Number  l       The lightness
   * @return  Object          The RGB representation
   */
  function hslToRgb(h, s, l) {
    var r, g, b;
    if (!s) {
      r = g = b = l;
    } else {
      var hue2rgb = function(p, q, t) {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + 6 * (q - p) * t;
        }
        if (t < .5) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };
      var q = l < .5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(255 * r),
      g: Math.round(255 * g),
      b: Math.round(255 * b)
    };
  }
  // From http://www.w3.org/TR/2006/WD-WCAG20-20060427/complete.html#luminosity-contrastdef
  function getLuminanceFromColorName(colorName) {
    return getPerceivedLuminance(getRgba(colorName));
  }
  // Perceived luminance must apply inverse gamma correction (the ^2.2)
  // See https://en.wikipedia.org/wiki/Luma_(video)
  //     https://en.wikipedia.org/wiki/Luminous_intensity
  //     https://en.wikipedia.org/wiki/Gamma_correction
  //     http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
  function getPerceivedLuminance(rgb) {
    var gammaReversed = .299 * getValue("r") + .587 * getValue("g") + .114 * getValue("b");
    function getValue(channel) {
      var rawValue = rgb[channel] / 255;
      return rawValue * rawValue;
    }
    return Math.sqrt(gammaReversed);
  }
  // Trades accuracy for performance
  function getFastLuminance(rgb) {
    var DIVISOR = 2550;
    // 255 * (2 + 7 + 1)
    return (2 * rgb.r + 7 * rgb.g + rgb.b) / DIVISOR;
  }
  function getContrastRatio(color1, color2) {
    var L1 = getLuminanceFromColorName(color1), L2 = getLuminanceFromColorName(color2);
    var ratio = (L1 + .05) / (L2 + .05);
    if (ratio >= 1) {
      return ratio;
    }
    return (L2 + .05) / (L1 + .05);
  }
  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param   Number  r       The red color value
   * @param   Number  g       The green color value
   * @param   Number  b       The blue color value
   * @return  Object          The HSL representation
   */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
       case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;

       case g:
        h = (b - r) / d + 2;
        break;

       case b:
        h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return {
      h: h,
      s: s,
      l: l
    };
  }
  // Get the current background color
  function getDocumentBackgroundColor() {
    var color = getComputedStyle(document.documentElement).backgroundColor, rgba = getRgba(color), WHITE = {
      r: 255,
      g: 255,
      b: 255
    };
    return rgba.a > 0 ? rgba : WHITE;
  }
  if (true) {
    sitecues.getRgba = getRgba;
    sitecues.rgbToHsl = rgbToHsl;
    sitecues.hslToRgb = hslToRgb;
    sitecues.getLuminanceFromColorName = getLuminanceFromColorName;
    sitecues.getPerceivedLuminance = getPerceivedLuminance;
    sitecues.getContrastRatio = getContrastRatio;
    sitecues.getColorString = getColorString;
  }
  return {
    isDarkColor: isDarkColor,
    isOnDarkBackground: isOnDarkBackground,
    getColorString: getColorString,
    getRgbaIfLegalColor: getRgbaIfLegalColor,
    getRgba: getRgba,
    getLuminanceFromColorName: getLuminanceFromColorName,
    getFastLuminance: getFastLuminance,
    getPerceivedLuminance: getPerceivedLuminance,
    getContrastRatio: getContrastRatio,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    getDocumentBackgroundColor: getDocumentBackgroundColor
  };
});

/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.define("page/util/geo", [], function() {
  /**
   * Is the point inside the rectangle or within proximity pixels
   * @access public
   * @param x
   * @param y
   * @param rect
   * @param proximity (optional) Number of pixels of extra proximity allowed
   * @returns {boolean}
   */
  function isPointInRect(x, y, rect, proximity) {
    proximity = proximity || 0;
    var right = rect.left + rect.width, bottom = rect.top + rect.height;
    return x >= rect.left - proximity && x < right + proximity && y >= rect.top - proximity && y <= bottom + proximity;
  }
  /**
   * Is the point inside any of the supplied rectangles or within proximity pixels
   * @access public
   * @param x
   * @param y
   * @param rects
   * @param proximity (optional) Number of pixels of extra proximity allowed
   * @returns {boolean}
   */
  function isPointInAnyRect(x, y, rects, proximity) {
    for (var count = 0; count < rects.length; count++) {
      if (rects[count] && isPointInRect(x, y, rects[count], proximity)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Expand or contract rectangle
   * @access public
   * @param rect  Original rectangle
   * @param delta  Positive value to expand rectangle, or negative to contract
   * @returns Object new rectangle
   */
  function expandOrContractRect(rect, delta) {
    var newRect = {
      left: rect.left - delta,
      top: rect.top - delta,
      width: rect.width + 2 * delta,
      height: rect.height + 2 * delta
    };
    newRect.right = newRect.left + newRect.width;
    newRect.bottom = newRect.top + newRect.height;
    return newRect;
  }
  /**
   * Expand or contract an array of rects
   * @access public
   * @param [] rects
   * @param delta
   */
  function expandOrContractRects(rects, delta) {
    var numRects = rects.length, index = 0;
    for (;index < numRects; index++) {
      rects[index] = expandOrContractRect(rects[index], delta);
    }
  }
  return {
    isPointInRect: isPointInRect,
    isPointInAnyRect: isPointInAnyRect,
    expandOrContractRect: expandOrContractRect,
    expandOrContractRects: expandOrContractRects
  };
});

sitecues.define("page/highlight/constants", [], function() {
  var constants = {};
  constants.HIGHLIGHT_OUTLINE_CLASS = "sc-highlight";
  constants.HIGHLIGHT_OUTLINE_ATTR = "data-sc-overlay";
  constants.HIGHLIGHT_STYLESHEET_NAME = "sitecues-js-highlight";
  constants.HIGHLIGHT_TOGGLE_EVENT = "mh/did-toggle-visibility";
  constants.POINTER_ATTR = "data-sc-pointer-events";
  return constants;
});

// TODO Work in Firefox + EEOC menus
// TODO Test! Especially in IE
//TODO: Break this module down a bit, there are too many dependencies and it is huge
/*jshint -W072 */
//Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
sitecues.define("page/highlight/highlight", [ "$", "run/conf/preferences", "page/highlight/pick", "page/highlight/traitcache", "page/highlight/highlight-position", "page/util/common", "page/util/color", "page/util/geo", "page/util/element-classifier", "run/platform", "page/highlight/constants", "run/events", "run/dom-events", "page/zoom/zoom", "page/zoom/util/body-geometry", "mini-core/native-global", "run/inline-style/inline-style" ], function($, pref, picker, traitcache, mhpos, common, colorUtil, geo, elementClassifier, platform, constants, events, domEvents, zoomMod, bodyGeo, nativeGlobal, inlineStyle) {
  var isInitialized, state, // We don't initialize this module until sitecues is on
  isTrackingMouse, // After scroll tracking is turned on, we won't respond to it until at least one normal mousemove
  isTrackingWheelEvents, isOnlyShift, // Is shift down by itself?
  isAppropriateFocus, isSticky, isBPOpen, isLensEnabled, isColorDebuggingOn, isHighlightRectDebuggingOn, $highlightStyleSheet, // Style sheet for overlay via :after
  pickFromMouseTimer, INIT_STATE = {
    isCreated: false,
    // Has highlight been created
    isVisible: false,
    // Is highlight visible?
    picked: null,
    // JQuery for picked element(s)
    target: null,
    // Mouse was last over this element
    styles: [],
    savedCss: null,
    // map of saved CSS for highlighted element
    savedBgColors: null,
    // map of descendant elements to saved background colors
    elementRect: null,
    // Bounding client rect (fixed/screen rect) of picked element
    fixedContentRect: null,
    // Contains the smallest possible rectangle encompassing the content to be highlighted
    hiddenElements: [],
    // Elements whose subtrees are hidden or not part of highlight rectangle (e.g. display: none, hidden off-the-page, out-of-flow)
    overlayContainer: null,
    // The scrollable container that will contain the highlight overlay as a child
    // Note however, that the coordinates used are zoomed pixels (at 1.1x a zoomed pixel width is 1.1 real pixels)
    overlayRect: null,
    // Contains the total overlay rect, in absolute body coordinates,  zoomed pixels
    cutoutRects: {},
    // Object map for possible topLeft, topRight, botLeft, botRight of rectangles cut out of highlight to create L shape
    pathBorder: [],
    // In real pixels so that it can live outside of <body>
    pathFillPadding: [],
    // In real pixels outside <body>, extends CSS background beyond element
    pathFillBackground: [],
    // In element rect coordinates, used with CSS background
    highlightPaddingWidth: 0,
    highlightBorderWidth: 0,
    highlightBorderColor: "",
    bgColor: "",
    // highlight color or '' if only outline is being used (as when highlighting media element)
    doUseOverlayforBgColor: false,
    // was an overlay used to create the background color? If not, CSS background will be used.
    hasDarkBackgroundColor: false,
    hasLightText: false
  }, // class of highlight
  HIGHLIGHT_OUTLINE_CLASS = constants.HIGHLIGHT_OUTLINE_CLASS, HIGHLIGHT_OUTLINE_ATTR = constants.HIGHLIGHT_OUTLINE_ATTR, HIGHLIGHT_STYLESHEET_NAME = constants.HIGHLIGHT_STYLESHEET_NAME, //Highlight event
  HIGHLIGHT_TOGGLE_EVENT = constants.HIGHLIGHT_TOGGLE_EVENT, // How many ms does mouse need to stop for before we highlight?
  MOUSE_STOP_MS = 30, // How many ms does scrolling need to stop for before we highlight?
  SCROLL_STOP_MS = 140, // Color values for YIQ computations
  MID_COLOR_INTENSITY = .62, // Don't consider the text light unless the yiq is larger than this
  VERY_DARK_COLOR_INTENSITY = .06, VERY_LIGHT_COLOR_INTENSITY = .94, // Extra border width in pixels if background is dark and light bg color is being used
  EXTRA_DARK_BG_BORDER_WIDTH = 1, // Extra room around highlight
  EXTRA_PIXELS_TO_PRESERVE_LETTERS = 1, // Amount of extra space computed for fixed highlight rectangles
  EXTRA_PADDING_PIXELS = 4, // Amount of space around highlighted object before to separate border
  // Border color when on dark background
  DARK_BG_BORDER_COLOR = "#bec36e", // All CSS background properties except color
  // Image must be listed last for multiple backgrounds code to work
  BG_PROPS = [ "backgroundPosition", "backgroundOrigin", "backgroundRepeat", "backgroundClip", "backgroundAttachment", "backgroundSize", "backgroundImage" ], isSitecuesOn = true, // Are we currently tracking the mouse?
  canTrackScroll = true, // Is scroll tracking allowable? Turned off during panning from keyboard navigation
  willRespondToScroll = true, isWindowFocused = document.hasFocus(), isSpeechEnabled = false, cursorPos = {};
  function getMaxZIndex(styles) {
    var maxZIndex = 0;
    for (var count = 0; count < styles.length; count++) {
      var zIndexInt = parseInt(styles[count].zIndex);
      if (zIndexInt > maxZIndex) {
        maxZIndex = zIndexInt;
      }
    }
    return maxZIndex;
  }
  function isDifferentZIndex(item1, item2, commonAncestor) {
    function getZIndex(item) {
      var styles = getAncestorStyles(item, commonAncestor);
      return getMaxZIndex(styles);
    }
    return getZIndex(item1) !== getZIndex(item2);
  }
  /**
   * Checks if the color value given of a light tone or not.
   */
  function isLightIntensity(colorValue) {
    return colorUtil.getLuminanceFromColorName(colorValue) > MID_COLOR_INTENSITY;
  }
  function getElementsContainingOwnVisibleText($subtree) {
    var TEXT_NODE = 3;
    return $subtree.filter(function() {
      var index, testNode, css, childNodes = this.childNodes, numChildNodes = childNodes.length;
      if (this.childElementCount === numChildNodes) {
        return false;
      }
      css = traitcache.getStyle(this);
      if (parseInt(css.textIndent) < -99) {
        return false;
      }
      for (index = 0; index < numChildNodes; index++) {
        testNode = childNodes[index];
        if (testNode.nodeType === TEXT_NODE && "" !== testNode.textContent.trim()) {
          return true;
        }
      }
      return false;
    });
  }
  function getTextInfo(selector) {
    var $subtree = $(selector).find("*").addBack(), textContainers = getElementsContainingOwnVisibleText($subtree), elementsToCheck = textContainers.length ? textContainers : $subtree, MAX_ELEMENTS_TO_CHECK = 100, containsLightText = false, containsDarkText = false;
    elementsToCheck.each(function(index) {
      if (index >= MAX_ELEMENTS_TO_CHECK) {
        return false;
      }
      var textColor = traitcache.getStyleProp(this, "color");
      if (isLightIntensity(textColor)) {
        containsLightText = true;
      } else {
        containsDarkText = true;
      }
    });
    return {
      hasLightText: containsLightText,
      hasDarkText: containsDarkText,
      hasVisibleText: textContainers.length > 0
    };
  }
  function hasDarkBackgroundOnAnyOf(styles, textInfo) {
    var hasOnlyLightText = textInfo.hasLightText && !textInfo.hasDarkText, count = 0;
    for (;count < styles.length; count++) {
      var style = styles[count], bgRgba = colorUtil.getRgba(style.backgroundColor), isMostlyOpaque = bgRgba.a > .8;
      if (style.backgroundImage && "none" !== style.backgroundImage) {
        if (hasOnlyLightText) {
          return true;
        }
        if (!textInfo.hasVisibleText) {}
      }
      if (isMostlyOpaque) {
        return !isLightIntensity(bgRgba);
      }
    }
  }
  function updateColorApproach(picked, style) {
    // Get data on backgrounds and text colors used
    var textInfo = getTextInfo(picked);
    state.hasLightText = textInfo.hasLightText;
    state.hasDarkText = textInfo.hasDarkText;
    state.hasDarkBackgroundColor = hasDarkBackgroundOnAnyOf(style, textInfo);
    // Get the approach used for highlighting
    if (picked.length > 1 || shouldAvoidBackgroundImage(picked) || state.hasLightText || !textInfo.hasVisibleText) {
      //  approach #1 -- use overlay for background color
      //                 use overlay for rounded outline
      //  pros: one single rectangle instead of potentially many
      //        works with form controls
      //        visually seamless
      //  cons: washes dark text out (does not have this problem with light text)
      //  when-to-use: for article or cases where multiple items are selected
      //               when images or background sprites are used, which we don't want to overwrite with out background
      //               a lack of text indicates a good opportunity to use technique as it is an indicator of image content
      state.bgColor = getTransparentBackgroundColor();
      state.doUseOverlayForBgColor = true;
    } else {
      //  approach #2 -- use css background of highlighted element for background color
      //                use overlay for rounded outline
      //  pros: looks best on text, does not wash out colors
      //  cons: breaks the appearance of native form controls, such as <input type="button">
      //  when-to-use: on most elements
      state.bgColor = getAppropriateBackgroundColor();
      state.doUseOverlayForBgColor = false;
    }
  }
  // How visible is the highlight?
  // Currently goes from 1.44 (at 1x) to 3.24 (at 3x)
  // The smaller the number, the less visible the highlight is
  function getHighlightVisibilityFactor() {
    var MIN_VISIBILITY_FACTOR_WITH_TTS = 2.1, vizFactor = .9 * (zoomMod.getCompletedZoom() + .6);
    if (isSpeechEnabled && vizFactor < MIN_VISIBILITY_FACTOR_WITH_TTS) {
      vizFactor = MIN_VISIBILITY_FACTOR_WITH_TTS;
    }
    return vizFactor;
  }
  function getHighlightBorderColor() {
    if (state.hasDarkBackgroundColor) {
      return DARK_BG_BORDER_COLOR;
    }
    var viz = state.highlightIntensity, colorMultiplier = -80, color = Math.round(Math.max(0, 200 + viz * colorMultiplier));
    return "rgb(" + color + "," + color + "," + (color + 30) + ")";
  }
  function getHighlightBorderWidth() {
    var viz = state.highlightIntensity, borderWidth = viz + .33 + (state.hasDarkBackgroundColor ? EXTRA_DARK_BG_BORDER_WIDTH : 0);
    return Math.max(1, borderWidth) * state.zoom;
  }
  function getTransparentBackgroundColor() {
    // Best to use transparent color when the background is interesting or dark, and we don't want to
    // change it drastically
    // This lightens at higher levels of zoom
    var maxViz = state.hasDarkBackgroundColor || state.hasLightText ? 1 : 9, viz = Math.min(state.highlightIntensity, maxViz), alpha = .11 * viz;
    return "rgba(240, 240, 180, " + alpha + ")";
  }
  function getOpaqueBackgroundColor() {
    // Best to use opaque color, because inner overlay doesn't match up perfectly causing overlaps and gaps
    // It lightens at higher levels of zoom
    var viz = state.highlightIntensity, decrement = 1.4 * viz, red = Math.round(255 - decrement), green = red, blue = Math.round(254 - 5 * decrement), color = "rgb(" + red + "," + green + "," + blue + ")";
    return color;
  }
  // Return an array of styles in the ancestor chain, including fromElement, not including toElement
  function getAncestorStyles(fromElement, toElement) {
    var styles = [];
    while (fromElement) {
      styles.push(traitcache.getStyle(fromElement));
      if (fromElement === toElement) {
        break;
      }
      fromElement = fromElement.parentElement;
    }
    return styles;
  }
  function getCutoutRectsArray() {
    return [ state.cutoutRects.topLeft, state.cutoutRects.topRight, state.cutoutRects.botLeft, state.cutoutRects.botRight ];
  }
  function isCursorInHighlightShape(fixedRects, cutoutRects) {
    if (!cursorPos.doCheckCursorInHighlight) {
      return true;
    }
    var extraPixels = getExtraPixels() * state.zoom;
    if (!geo.isPointInAnyRect(cursorPos.x, cursorPos.y, fixedRects, extraPixels)) {
      return false;
    }
    // The cursor is in the fixed rectangle for the highlight.
    // Now, we will consider the cursor to be in the highlight as long as it's not in any
    // parts cut out from the highlight when it is drawn around floats.
    return !geo.isPointInAnyRect(cursorPos.x, cursorPos.y, cutoutRects);
  }
  // Update mouse highlight view and show unless doKeepHidden is truthy
  // return true if something is shown
  function updateView(doKeepHidden) {
    // can't find any element to work with
    if (!state.picked) {
      return;
    }
    // Update state to ensure it is current
    state.styles = getAncestorStyles(state.picked[0], document.documentElement);
    state.highlightIntensity = getHighlightVisibilityFactor();
    updateColorApproach(state.picked, state.styles);
    if (!computeOverlay(true)) {
      // Did not find visible rectangle to highlight
      return;
    }
    // Show the actual overlay
    if (!doKeepHidden) {
      show();
    }
    return true;
  }
  function didToggleVisibility(isVisible) {
    state.isVisible = isVisible;
    events.emit(HIGHLIGHT_TOGGLE_EVENT, isVisible);
  }
  function show() {
    // Create and position highlight overlay
    appendOverlayPathViaSVG();
    // Remove conflicting backgrounds on descendants
    removeConflictingDescendantBackgrounds();
    // Position overlay just on top of the highlighted element (and underneath fixed toolbars)
    // Change background image for highlighted elements if necessary
    updateElementBgImage();
    // Add event listeners to keep overlay view up-to-date
    addMouseWheelListener();
    addEventListener("mouseout", onLeaveWindow, {
      passive: true
    });
    // Update state
    didToggleVisibility(true);
    // Get Lens code loaded and ready so that it shows up quickly the first time
    if (!isLensEnabled) {
      isLensEnabled = true;
      sitecues.require([ "hlb/hlb" ], function() {});
    }
  }
  // Choose an appropriate background color for the highlight
  // In most cases we want the opaque background because the background color on the element
  // can overlap the padding over the outline which uses the same color, and not cause problems
  // We need them to overlap because we haven't found a way to 'sew' them together in with pixel-perfect coordinates
  function getAppropriateBackgroundColor() {
    if (state.hasDarkBackgroundColor || state.hasLightText) {
      // Use transparent background so that the interesting background or light foreground are still visible
      return getTransparentBackgroundColor();
    }
    return getOpaqueBackgroundColor();
  }
  // Helps with SC-1471, visually seamless highlight rectangle
  function roundCoordinate(n) {
    return Math.round(n);
  }
  function roundBorderWidth(n) {
    return roundCoordinate(n);
  }
  function roundRectCoordinates(rect) {
    var newRect = {
      top: roundCoordinate(rect.top),
      bottom: roundCoordinate(rect.bottom),
      left: roundCoordinate(rect.left),
      right: roundCoordinate(rect.right)
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;
    return newRect;
  }
  function roundPolygonCoordinates(points) {
    var point, index = 0, numPoints = points.length;
    for (;index < numPoints; index++) {
      point = points[index];
      point.x = roundCoordinate(point.x);
      point.y = roundCoordinate(point.y);
    }
  }
  function setMultipleBackgrounds(element, newBg, origBg, doPlaceOrigOnTop) {
    var value, hasOrigBgImage = "none" !== origBg.backgroundImage, styles = {};
    BG_PROPS.forEach(function(property) {
      if (!hasOrigBgImage) {
        value = newBg[property];
      } else {
        if (doPlaceOrigOnTop) {
          value = origBg[property] + "," + newBg[property];
        } else {
          value = newBg[property] + "," + newBg[property];
        }
      }
      styles[property] = value;
    });
    inlineStyle.override(element, styles);
  }
  function copyBackgroundCss(origElem) {
    var copy = {}, style = inlineStyle(origElem);
    BG_PROPS.forEach(function(property) {
      copy[property] = style[property].slice();
    });
    return copy;
  }
  // width and height are optional
  function getSVGDataURI(svgMarkup, width, height) {
    var attrs = width ? ' width="' + width + '" height="' + height + '" ' : "", wrappedSvg = '<svg xmlns="http://www.w3.org/2000/svg"' + attrs + ">" + svgMarkup + "</svg>";
    // Use encodeURIComponent instead of encodeURI because we also want # -> %23,
    // otherwise Firefox is unhappy when we set the fill color
    return 'url("data:image/svg+xml,' + encodeURIComponent(wrappedSvg) + '")';
  }
  function updateElementBgImage() {
    var offsetLeft, offsetTop, element = state.picked[0];
    // Approach #1 -- no change to background of element
    if (state.doUseOverlayForBgColor) {
      return false;
    }
    // Approach #2 --change CSS background of highlighted element
    var newBgSize, path = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left, state.fixedContentRect.top, 0, state.zoom), bgColor = true && isColorDebuggingOn ? "rgba(0,255,255,.4)" : state.bgColor, bgPaintableWidth = state.fixedContentRect.width, bgPaintableHeight = state.fixedContentRect.height, // Get the rectangle for the element itself
    svgMarkup = getSVGForPath(path, 0, 0, bgColor, 1);
    // Use element rectangle to find origin (left, top) of background
    // The background is getting clipped before being offset to the left
    offsetLeft = state.fixedContentRect.left - state.elementRect.left;
    if (offsetLeft < 0) {
      bgPaintableWidth += offsetLeft;
      offsetLeft = 0;
    }
    offsetTop = state.fixedContentRect.top - state.elementRect.top;
    if (offsetTop < 0) {
      bgPaintableHeight += offsetTop;
      offsetTop = 0;
    }
    bgPaintableWidth = Math.min(bgPaintableWidth + state.zoom, state.elementRect.width);
    bgPaintableHeight = Math.min(bgPaintableHeight + state.zoom, state.elementRect.height);
    newBgSize = roundCoordinate(bgPaintableWidth / state.zoom) + "px " + roundCoordinate(bgPaintableHeight / state.zoom) + "px";
    offsetLeft = roundCoordinate(offsetLeft);
    offsetTop = roundCoordinate(offsetTop);
    // This only returns a non-zero value when there is an offset to the current element, try highlighting "Welcome to Bank of North America" on the eBank test site.
    var origBgStyle = traitcache.getStyle(element), newBgStyle = {
      backgroundImage: getSVGDataURI(svgMarkup),
      backgroundPosition: offsetLeft / state.zoom + "px " + offsetTop / state.zoom + "px",
      backgroundOrigin: "border-box",
      backgroundRepeat: "no-repeat",
      backgroundClip: "border-box",
      backgroundAttachment: "scroll",
      backgroundSize: newBgSize
    }, doPlaceOrigOnTop = common.isSprite(origBgStyle);
    // Place sprites on top of our background, and textures underneath it
    // Save the current inline style for later restoration when the highlight is hidden
    state.savedCss = copyBackgroundCss(element);
    // Set the new background
    setMultipleBackgrounds(element, newBgStyle, origBgStyle, doPlaceOrigOnTop);
  }
  function isCloseToHighlightColor(colorIntensity) {
    if (state.hasDarkBackgroundColor) {
      // On dark background, using dark highlight
      return colorIntensity < VERY_DARK_COLOR_INTENSITY;
    } else {
      // On light background, using light highlight
      return colorIntensity > VERY_LIGHT_COLOR_INTENSITY;
    }
  }
  // Check all descendants for redundant background colors that will
  // carve chunks out of the highlight color.
  // For example, a theme on perkins.org that sets white backgrounds on many elements.
  // When we highlight an ancestor of one of those elements, we need to temporarily set
  // the background to transparent so that the highlight color can show through
  function removeConflictingDescendantBackgrounds() {
    if (state.doUseOverlayForBgColor) {
      return;
    }
    if (null !== state.savedBgColors) {
      return;
    }
    state.savedBgColors = [];
    state.picked.find("*").each(function() {
      var bgRgba, colorIntensity, style = traitcache.getStyle(this), bgColor = style.backgroundColor;
      if ("none" === style.backgroundImage) {
        bgRgba = colorUtil.getRgba(bgColor);
        colorIntensity = colorUtil.getPerceivedLuminance(bgColor);
        if (1 === bgRgba.a && isCloseToHighlightColor(colorIntensity) && !common.hasOwnBackgroundColor(this, style, state.styles[0])) {
          // If it's a unique color, we want to preserve it
          state.savedBgColors.push({
            elem: this,
            color: inlineStyle(this).backgroundColor
          });
          // Needed to do this as !important because of Perkins.org theme which also used !important
          inlineStyle.override(this, [ "background-color", "transparent", "important" ]);
        }
      }
    });
  }
  function getCutoutRectForPoint(x, y, expandFloatRectPixels, typeIfFloatRectShorter, typeIfFloatRectTaller) {
    var possibleFloat = common.elementFromPoint(x, y), // Get from top-left or top-right of highlight
    $picked = state.picked;
    if (possibleFloat && possibleFloat !== $picked[0]) {
      var $pickedAncestors = $picked.parents(), $possibleFloatAncestors = $(possibleFloat).parents();
      if ($pickedAncestors.is(possibleFloat)) {
        // TODO commenting out second part cells in boxes at
        // http://venturebeat.com/2014/10/01/after-raising-50m-reddit-forces-remote-workers-to-relocate-to-sf-or-get-fired/
        // If potential float is ancestor of picked don't use it.
        // However, the picked element could be an ancestor of the float, and we still need to use it.
        // Example: http://thebillfold.com/2014/09/need-an-action-figure-of-a-dead-loved-one-meet-jeff-staab/
        return;
      }
      var commonAncestor = $possibleFloatAncestors.is($picked) ? $picked : $(possibleFloat).closest($pickedAncestors);
      if (isDifferentZIndex(possibleFloat, $picked[0], commonAncestor)) {
        return;
      }
      while (commonAncestor[0] !== possibleFloat && !$(possibleFloat).is("body,html")) {
        if ("none" !== traitcache.getStyleProp(possibleFloat, "float")) {
          var floatRect = mhpos.getRect(possibleFloat), mhRect = state.fixedContentRect, extra = getExtraPixels();
          if (!floatRect) {
            return;
          }
          floatRect = roundRectCoordinates(floatRect);
          var results = {};
          if (floatRect.left > mhRect.left - extra && floatRect.right <= mhRect.right + extra && floatRect.top >= mhRect.top - extra && floatRect.bottom <= mhRect.bottom + extra) {
            // Completely inside highlight rect -- don't bother
            if (mhRect.bottom === floatRect.bottom) {
              // Float is taller than the rect
              // and we likely need to bottom-right or bottom-left cut out.
              // If the float is to the right, we will be cutting out the bottom-left, and
              // if the float is to the left, we will be cutting out the bottom-right!!!
              // We can compute this by comparing the bottom if the highlight rect
              // with and without floats included. If the highlight rect would be taller
              // when floats are included, then we will make a bottom cutout next to the bottom of the float,
              // on the other side of the highlight.
              var cutoutRect, mhRectWithoutFloats = mhpos.getRect($picked, true) || mhRect, top = mhRectWithoutFloats.bottom + expandFloatRectPixels;
              if (top > mhRect.bottom - extra) {
                return;
              }
              cutoutRect = {
                top: top,
                left: -9999,
                bottom: 9999,
                right: 9999
              };
              if ("botRight" === typeIfFloatRectTaller) {
                cutoutRect.left = floatRect.right + expandFloatRectPixels;
              } else {
                cutoutRect.right = floatRect.left - expandFloatRectPixels;
              }
              cutoutRect.height = cutoutRect.bottom - cutoutRect.top;
              cutoutRect.width = cutoutRect.right - cutoutRect.left;
              results[typeIfFloatRectTaller] = cutoutRect;
            }
          } else {
            // float is shorter than highlight rect
            results[typeIfFloatRectShorter] = geo.expandOrContractRect(floatRect, expandFloatRectPixels);
          }
          return results;
        }
        possibleFloat = possibleFloat.parentNode;
      }
    }
  }
  // Get rects of cutouts caused fy floats intersecting with the original highlight rect.
  function getCutoutRects() {
    var EXTRA = 7, // Make sure we test a point inside where the float would be, not on a margin
    EXPAND_FLOAT_RECT = 7, mhRect = state.fixedContentRect, left = mhRect.left, right = mhRect.left + mhRect.width, top = mhRect.top, // If there's a left float, rect1 will be top-left, unless the float is taller than
    // everything else in the highlight, and then it will be bot-right
    rect1 = getCutoutRectForPoint(left + EXTRA, top + EXTRA, EXPAND_FLOAT_RECT, "topLeft", "botRight"), // If there's a right float, rect2 will be top-right, unless the float is taller than
    // everything else in the highlight, and then it will be bot-left
    rect2 = getCutoutRectForPoint(right - EXTRA, top + EXTRA, EXPAND_FLOAT_RECT, "topRight", "botLeft");
    return $.extend({}, rect1, rect2);
  }
  function extendAll(array, newProps) {
    for (var index = 0; index < array.length; index++) {
      array[index] = $.extend(array[index], newProps);
    }
    return array;
  }
  function getPolygonPoints(orig) {
    // Build points for highlight polygon
    var // Shortcuts
    topLeftCutout = state.cutoutRects.topLeft, topRightCutout = state.cutoutRects.topRight, botLeftCutout = state.cutoutRects.botLeft, botRightCutout = state.cutoutRects.botRight, // List of points for each corner
    // We start out with one point, but if a cutout intersects, we will end up with 3 points for that corner
    topLeftPoints = [ {
      x: orig.left,
      y: orig.top
    } ], topRightPoints = [ {
      x: orig.right,
      y: orig.top
    } ], botRightPoints = [ {
      x: orig.right,
      y: orig.bottom
    } ], botLeftPoints = [ {
      x: orig.left,
      y: orig.bottom
    } ], mhRect = state.fixedContentRect;
    if (topLeftCutout) {
      if (!geo.isPointInRect(topLeftCutout.right, topLeftCutout.bottom, mhRect)) {
        if (topLeftCutout.right > orig.left && topLeftCutout.bottom > orig.bottom) {
          // Sanity check
          topLeftPoints[0].x = topLeftCutout.right;
          botLeftPoints[0].x = topLeftCutout.right;
        }
      } else {
        // Draw around top-left float
        topLeftPoints = [ {
          x: orig.left,
          y: topLeftCutout.bottom
        }, {
          x: topLeftCutout.right,
          y: topLeftCutout.bottom
        }, {
          x: topLeftCutout.right,
          y: orig.top
        } ];
      }
    }
    if (topRightCutout) {
      if (!geo.isPointInRect(topRightCutout.left, topRightCutout.bottom, mhRect)) {
        if (topRightCutout.left < orig.right && topRightCutout.bottom > orig.bottom) {
          // Sanity check
          topRightPoints[0].x = topRightCutout.left;
          botRightPoints[0].x = topRightCutout.left;
        }
      } else {
        // Draw around top-right float
        topRightPoints = [ {
          x: topRightCutout.left,
          y: orig.top
        }, {
          x: topRightCutout.left,
          y: topRightCutout.bottom
        }, {
          x: orig.right,
          y: topRightCutout.bottom
        } ];
      }
    }
    if (botRightCutout) {
      botRightPoints = [ {
        x: orig.right,
        y: botRightCutout.top
      }, {
        x: botRightCutout.left,
        y: botRightCutout.top
      }, {
        x: botRightCutout.left,
        y: orig.bottom
      } ];
    }
    if (botLeftCutout) {
      botLeftPoints = [ {
        x: botLeftCutout.right,
        y: orig.bottom
      }, {
        x: botLeftCutout.right,
        y: botLeftCutout.top
      }, {
        x: orig.left,
        y: botLeftCutout.top
      } ];
    }
    // growX and growY are set to 1 or -1, depending on which direction coordinates should move when polygon grows
    extendAll(topLeftPoints, {
      growX: -1,
      growY: -1
    });
    extendAll(topRightPoints, {
      growX: 1,
      growY: -1
    });
    extendAll(botRightPoints, {
      growX: 1,
      growY: 1
    });
    extendAll(botLeftPoints, {
      growX: -1,
      growY: 1
    });
    return topLeftPoints.concat(topRightPoints, botRightPoints, botLeftPoints);
  }
  function getExpandedPath(points, delta) {
    var newPath = [];
    for (var index = 0; index < points.length; index++) {
      newPath.push({
        x: roundCoordinate(points[index].x + points[index].growX * delta),
        y: roundCoordinate(points[index].y + points[index].growY * delta),
        growX: points[index].growX,
        growY: points[index].growY
      });
    }
    return newPath;
  }
  // Scale and move a path
  function getAdjustedPath(origPath, offsetX, offsetY, extra, divisor) {
    var newPath = [];
    $.each(origPath, function() {
      newPath.push($.extend({}, this, {
        x: (this.x - offsetX) / divisor + extra,
        y: (this.y - offsetY) / divisor + extra
      }));
    });
    return newPath;
  }
  function getSVGStyle(strokeWidth, strokeColor, fillColor) {
    return ' style="pointer-events:none;stroke-width: ' + strokeWidth + ";" + (strokeWidth ? "stroke: " + strokeColor + ";" : "") + "fill: " + (fillColor ? fillColor : "none") + '"';
  }
  function getSVGForPath(points, strokeWidth, strokeColor, fillColor, radius) {
    var svgBuilder = '<path d="';
    var count = 0;
    do {
      // Start of vertical line (except for first time)
      var vertCornerDir = 0 === count ? 1 : points[count].y > points[count - 1].y ? -1 : 1;
      var horzCornerDir = points[(count + 1) % points.length].x > points[count].x ? 1 : -1;
      svgBuilder += (count ? "L " : "M ") + // Horizontal line to start of next curve
      points[count].x + " " + (points[count].y + radius * vertCornerDir) + " ";
      svgBuilder += "Q " + // Curved corner
      points[count].x + " " + points[count].y + " " + (// Control point
      points[count].x + radius * horzCornerDir) + " " + points[count].y + " ";
      ++count;
      // Start of horizontal line
      vertCornerDir = points[(count + 1) % points.length].y > points[count].y ? 1 : -1;
      horzCornerDir = points[count].x > points[count - 1].x ? -1 : 1;
      svgBuilder += "L " + (// Vertical line to start of next curve
      points[count].x + radius * horzCornerDir) + " " + points[count].y + " ";
      svgBuilder += "Q " + // Curved corner
      points[count].x + " " + points[count].y + " " + // Control point
      points[count].x + " " + (points[count].y + radius * vertCornerDir) + " ";
      ++count;
    } while (count < points.length);
    svgBuilder += ' Z"' + getSVGStyle(strokeWidth, strokeColor, fillColor) + "/>";
    return svgBuilder;
  }
  function getSVGFillRectMarkup(left, top, width, height, fillColor) {
    var zoom = state.zoom;
    return '<rect x="' + left / zoom + '" y="' + top / zoom + '"  width="' + width / zoom + '" height="' + height / zoom + '"' + getSVGStyle(0, 0, fillColor) + "/>";
  }
  function isPossibleBullet() {
    var style = state.styles[0];
    return "none" !== style.listStyleType || "none" !== style.listStyleImage;
  }
  function getExtraPaddingColor() {
    if (true && isColorDebuggingOn) {
      return "rgba(255, 96, 0, .4)";
    }
    return getTransparentBackgroundColor();
  }
  // For areas such as list bullet area, when it is inside margin instead of element bounds, and thus couldn't be covered with bg image
  function getSVGForExtraPadding(extra) {
    var topOffset, useColor, highlightBgScreenRect = state.fixedContentRect, // Scaled by zoom
    svg = "", paddingColor = getExtraPaddingColor(), elementRect = roundRectCoordinates(state.picked[0].getBoundingClientRect()), REMOVE_GAPS_FUDGE_FACTOR = 0, extraLeft = elementRect.left - highlightBgScreenRect.left, extraRight = highlightBgScreenRect.right - elementRect.right, bgOffsetTop = Math.max(0, state.fixedContentRect.top - state.elementRect.top), // Don't be fooled by bottom-right cutouts
    extraTop = Math.max(0, elementRect.top - highlightBgScreenRect.top), extraBottom = Math.max(0, highlightBgScreenRect.bottom - elementRect.bottom), paddingWidth = highlightBgScreenRect.width, paddingHeight = highlightBgScreenRect.height - extraBottom;
    if (extraLeft > 0) {
      topOffset = state.cutoutRects.topLeft ? state.cutoutRects.topLeft.height : extraTop;
      // Top-left area where the highlight is not shown
      useColor = isPossibleBullet() ? getTransparentBackgroundColor() : paddingColor;
      // Don't hide bullets
      if (paddingHeight > topOffset) {
        svg += getSVGFillRectMarkup(extra, topOffset + extra, extraLeft + REMOVE_GAPS_FUDGE_FACTOR, paddingHeight - topOffset, useColor);
      }
    }
    if (extraRight > 0) {
      topOffset = state.cutoutRects.topRight ? state.cutoutRects.topRight.height : extraTop;
      // Top-right area where the highlight is not shown
      if (paddingHeight > topOffset) {
        svg += getSVGFillRectMarkup(elementRect.width + extra + extraLeft - REMOVE_GAPS_FUDGE_FACTOR, topOffset + extra, extraRight + REMOVE_GAPS_FUDGE_FACTOR, paddingHeight - topOffset, paddingColor);
      }
    }
    if (extraTop > 0) {
      var leftCutoutWidth = state.cutoutRects.topLeft ? state.cutoutRects.topLeft.width : 0;
      var widthForTop = paddingWidth;
      if (state.cutoutRects.topRight) {
        widthForTop = state.cutoutRects.topRight.left - elementRect.left;
      }
      widthForTop -= leftCutoutWidth;
      svg += getSVGFillRectMarkup(leftCutoutWidth + extra, extra, widthForTop, extraTop + REMOVE_GAPS_FUDGE_FACTOR, paddingColor);
    }
    if (extraBottom > 0 && !state.cutoutRects.botLeft && !state.cutoutRects.botRight) {
      svg += getSVGFillRectMarkup(extra, elementRect.height + extraTop + extra - bgOffsetTop - REMOVE_GAPS_FUDGE_FACTOR, paddingWidth, extraBottom + REMOVE_GAPS_FUDGE_FACTOR, paddingColor);
    }
    return svg;
  }
  // TODO Make this robust -- what if the page itself is putting in a transform?
  function getZoom(overlayContainerElem) {
    var isFixed = "fixed" === traitcache.getStyleProp(overlayContainerElem, "position");
    if (isFixed) {
      var elemTransform = inlineStyle(overlayContainerElem).transform, scaleSplit = elemTransform.split("scale(");
      return parseFloat(scaleSplit[1]) || 1;
    }
    // Not a fixed element, so use the current zoom level on the body
    return zoomMod.getCompletedZoom();
  }
  function getOverlayRect() {
    var offsetRect, mainFixedRect = state.fixedContentRect, overlayRect = {
      left: 0,
      top: 0,
      width: mainFixedRect.width / state.zoom,
      height: mainFixedRect.height / state.zoom
    };
    if (state.overlayContainer === document.body) {
      var $measureDiv = $("<sc>").appendTo(document.body).css({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        position: "absolute",
        display: "block"
      }), // For some reason using the <body> works better in FF version <= 32
      offsetElement = $measureDiv[0];
      offsetRect = offsetElement.getBoundingClientRect();
      $measureDiv.remove();
    } else {
      offsetRect = state.overlayContainer.getBoundingClientRect();
      var containerStyle = traitcache.getStyle(state.overlayContainer), borderTop = parseFloat(containerStyle.borderTopWidth || 0), borderLeft = parseFloat(containerStyle.borderLeftWidth || 0);
      overlayRect.left = state.overlayContainer.scrollLeft - borderLeft;
      overlayRect.top = state.overlayContainer.scrollTop - borderTop;
    }
    overlayRect.left += (mainFixedRect.left - offsetRect.left) / state.zoom;
    overlayRect.top += (mainFixedRect.top - offsetRect.top) / state.zoom;
    overlayRect.right = overlayRect.left + overlayRect.width;
    overlayRect.bottom = overlayRect.top + overlayRect.height;
    return roundRectCoordinates(overlayRect);
  }
  function getBestOverlayContainer() {
    var ancestorStyle, numAncestors = state.styles.length, ancestor = state.picked[0], index = 0;
    function hasVerticalOverflow() {
      var scrollHeight = ancestor.scrollHeight - EXTRA_PADDING_PIXELS;
      if (scrollHeight > ancestor.offsetHeight) {
        return true;
      }
      if (ancestor.parentElement !== document.body && "static" !== ancestorStyle.position && "visible" !== traitcache.getStyleProp(ancestor.parentElement, "overflowY") && scrollHeight > ancestor.parentElement.offsetHeight) {
        return true;
      }
    }
    while (++index < numAncestors - 1) {
      ancestor = ancestor.parentElement;
      ancestorStyle = state.styles[index];
      if ("fixed" === ancestorStyle.position) {
        return ancestor;
      }
      if ("absolute" === ancestorStyle.position && hasVerticalOverflow()) {
        return ancestor;
      }
      // Don't tie to horizontal scroll -- these tend to not scrolled via
      // scrollbars, etc. but rather by visible buttons in the interface, and they are often a red herring,
      // causing us to put the highlight in a container where the top or bottom will get clipped.
      // Therefore, we require containers to be vertically scrollable before we tie the highlight overlay to them,
      // after all users know how to vertically scroll with a scrollwheel etc. but they don't know how to horizontally scroll
      //        if (ancestorStyle.overflowX !== 'visible') {  // Use if horizontally scrollable
      //          var scrollWidth = ancestor.scrollWidth - EXTRA_PADDING_PIXELS;
      //          // Either this container scrolls directly or is positioned within a smaller parent
      //          if (scrollWidth > ancestor.offsetWidth || scrollWidth > ancestor.parentElement.offsetWidth) {
      //            if (SC_DEV) { console.log('Highlight overlay container - h-scroll: %o', ancestor); }
      //            return ancestor;
      //          }
      //        }
      if ("visible" !== ancestorStyle.overflowY) {
        // use if vertically scrollable
        // Either this container scrolls directly or is positioned within a smaller parent
        if (hasVerticalOverflow()) {
          if (true) {
            console.log("Highlight overlay container - v-scroll: %o", ancestor);
          }
          return ancestor;
        }
      }
    }
    return document.body;
  }
  function getAbsoluteRect() {
    var rect = $.extend({}, state.fixedContentRect), viewPos = traitcache.getCachedViewPosition();
    // Next subtract the current scroll position
    rect.left += viewPos.x;
    rect.right += viewPos.x;
    rect.top += viewPos.y;
    rect.bottom += viewPos.x;
    return rect;
  }
  // Update highlight overlay
  // @return falsey if no valid overlay can be created
  function computeOverlay() {
    var element, elementRect, stretchForSprites = true;
    if (!state.picked) {
      return;
    }
    element = state.picked[0];
    elementRect = element.getBoundingClientRect();
    // Rough bounds
    state.overlayContainer = getBestOverlayContainer();
    state.zoom = getZoom(state.overlayContainer);
    // Get exact bounds
    var mhPositionInfo = mhpos.getHighlightPositionInfo(element, 0, stretchForSprites), fixedRects = mhPositionInfo.allRects;
    state.hiddenElements = mhPositionInfo.hiddenElements;
    geo.expandOrContractRects(fixedRects, EXTRA_PIXELS_TO_PRESERVE_LETTERS);
    if (!fixedRects.length || !isCursorInHighlightShape(fixedRects, getCutoutRectsArray())) {
      // No valid highlighted content rectangles or cursor not inside of them
      return;
    }
    mhpos.combineIntersectingRects(fixedRects, 99999);
    // Merge all boxes
    var mainFixedRect = fixedRects[0];
    // For now just use 1
    state.fixedContentRect = roundRectCoordinates(mainFixedRect);
    state.elementRect = roundRectCoordinates(elementRect);
    state.highlightBorderWidth = roundBorderWidth(getHighlightBorderWidth() / state.zoom);
    state.highlightBorderColor = getHighlightBorderColor();
    state.highlightPaddingWidth = roundBorderWidth(EXTRA_PADDING_PIXELS);
    var extra = getExtraPixels();
    state.cutoutRects = getCutoutRects();
    var basePolygonPath = getPolygonPoints(state.fixedContentRect);
    // Get the path for the overlay so that the top-left corner is located at 0,0
    var adjustedPath = getAdjustedPath(basePolygonPath, state.fixedContentRect.left, state.fixedContentRect.top, extra, state.zoom);
    state.pathFillBackground = basePolygonPath;
    // Helps fill gaps
    state.pathFillPadding = getExpandedPath(adjustedPath, state.highlightPaddingWidth / 2);
    state.pathBorder = getExpandedPath(state.pathFillPadding, state.highlightPaddingWidth / 2 + state.highlightBorderWidth / 2);
    roundPolygonCoordinates(state.pathFillBackground);
    roundPolygonCoordinates(state.pathBorder);
    roundPolygonCoordinates(state.pathFillBackground);
    state.isCreated = true;
    state.overlayRect = getOverlayRect();
    state.absoluteRect = getAbsoluteRect();
    return true;
  }
  function insertOverlay(svg) {
    var extra = getExtraPixels(), width = roundCoordinate(state.fixedContentRect.width / state.zoom + 2 * extra + 1), // Extra pixel ensures right side not cut off
    height = roundCoordinate(state.fixedContentRect.height / state.zoom + 2 * extra + 1), // Extra pixel ensures bottom not cut off
    left = state.overlayRect.left - extra, top = state.overlayRect.top - extra, zIndex = getMaxZIndex(state.styles);
    if (state.overlayContainer === document.body) {
      // Body uses fast approach
      // A last child of the <body> is unlikely to mess with scripts
      appendOverlayElement(svg, left, top, width, height, zIndex);
    } else {
      // Updating the stylesheet is visibly slower on complex pages such as nytimes.com
      // So, while cleaner, it's only used if we're inserting in the middle of the document
      // where we're likely to mess something up
      updateStyleSheet(svg, left, top, width, height, zIndex);
      // Now we set the attribute (don't do it before updating the stylesheet,
      // otherwise we end up with 2 style reflows, one based on the old stylesheet contents
      // which is still around)
      state.overlayContainer.setAttribute(HIGHLIGHT_OUTLINE_ATTR, "");
    }
  }
  // Inserting actual <svg> element is faster but more obtrusive than updating
  // stylesheet to use :after. For now we only do this when the overlay parent will be <body>.
  function appendOverlayElement(svg, left, top, width, height, zIndex) {
    var svgFragment = common.createSVGFragment(svg, HIGHLIGHT_OUTLINE_CLASS);
    state.overlayContainer.appendChild(svgFragment);
    $("." + HIGHLIGHT_OUTLINE_CLASS).attr({
      width: width + "px",
      height: height + "px",
      "data-sc-reversible": false
    }).css({
      position: "absolute",
      left: left + "px",
      top: top + "px",
      zIndex: zIndex,
      pointerEvents: "none"
    });
  }
  function updateStyleSheet(svg, left, top, width, height, zIndex) {
    var svgUri = getSVGDataURI(svg, width, height), LINE_ENDING = " !important;\n", doSetPositionRelative = "static" === traitcache.getStyle(state.overlayContainer).position, styleSheetText = "[" + HIGHLIGHT_OUTLINE_ATTR + "]:after {\ncontent:" + svgUri + LINE_ENDING + "display:block" + LINE_ENDING + "visibility:visible" + LINE_ENDING + "position:absolute" + LINE_ENDING + "pointer-events:none" + LINE_ENDING + "left:" + left + "px" + LINE_ENDING + "top:" + top + "px" + LINE_ENDING + "width:" + width + "px" + LINE_ENDING + "height:" + height + "px" + LINE_ENDING + "overflow:hidden" + LINE_ENDING + "z-index:" + zIndex + LINE_ENDING + "}\n";
    if (doSetPositionRelative) {
      // Make sure child pseudo element is positioned relative to the parent
      // (We can't use position relative on the :after element because it will take up space in the layout)
      // We only need to do this when the parent doesn't already have a non-static position.
      styleSheetText += "[" + HIGHLIGHT_OUTLINE_ATTR + "] {\nposition:relative" + LINE_ENDING + "top:0" + LINE_ENDING + "left:0" + LINE_ENDING + "}";
    }
    if (!$highlightStyleSheet) {
      $highlightStyleSheet = $("<style>").appendTo("head").attr("id", HIGHLIGHT_STYLESHEET_NAME);
    }
    $highlightStyleSheet.text(styleSheetText);
  }
  function appendOverlayPathViaSVG() {
    // SVG overlays are supported
    // outlineFillColor:
    //   If the outline used used for the bg color and a bg color is being used at all
    var overlayBgColor = state.doUseOverlayForBgColor ? state.bgColor : null, // paddingColor:
    //   If overlay is used for fill color, we will put the fill in that, and don't need any padding color
    //   Otherwise, the we need the padding to bridge the gap between the background (clipped by the element) and the outline
    truePaddingColor = state.doUseOverlayForBgColor ? "" : isPossibleBullet() ? getTransparentBackgroundColor() : state.bgColor, paddingColor = true && isColorDebuggingOn ? "rgba(0, 255, 0, .4)" : truePaddingColor, paddingSVG = paddingColor ? getSVGForPath(state.pathFillPadding, state.highlightPaddingWidth, paddingColor, null, 1) : "", outlineSVG = getSVGForPath(state.pathBorder, state.highlightBorderWidth, state.highlightBorderColor, overlayBgColor, 3), // Extra padding: when there is a need for extra padding and the outline is farther away from the highlight
    // rectangle. For example, if there are list bullet items inside the padding area, this extra space needs to be filled
    extra = getExtraPixels(), extraPaddingSVG = paddingColor ? getSVGForExtraPadding(extra * state.zoom) : "", svg = outlineSVG + paddingSVG + extraPaddingSVG;
    insertOverlay(svg);
  }
  function shouldAvoidBackgroundImage(picked) {
    // Don't highlight buttons, etc. because it ruins their native appearance
    // Fix highlighting on <tr> in WebKit by using overlay for highlight color
    // See https://bugs.webkit.org/show_bug.cgi?id=9268
    function isNativeFormControl() {
      // Return true for form controls that use a native appearance
      return picked.is('input[type="button"],input[type="reset"],input[type="submit"],button,input[type="checkbox"],input[type="radio"],input[type="color"],select[size="1"],select:not([size])');
    }
    return isNativeFormControl() || picked.is("tr") && platform.browser.isWebKit;
  }
  // Number of pixels any edge will go beyond the fixedContentRect -- the highlight's border and padding
  function getExtraPixels() {
    return roundCoordinate(state.highlightPaddingWidth + state.highlightBorderWidth);
  }
  function correctHighlightScreenRects() {
    if (!state.isCreated) {
      return;
    }
    var newRect = roundRectCoordinates(state.picked[0].getBoundingClientRect()), oldRect = state.elementRect, xDiff = newRect.left - oldRect.left, yDiff = newRect.top - oldRect.top;
    if (!xDiff && !yDiff) {
      return;
    }
    function correctRect(rect) {
      if (!rect) {
        return;
      }
      rect.left += xDiff;
      rect.right += xDiff;
      rect.top += yDiff;
      rect.bottom += yDiff;
    }
    // -- Fixed rects --
    // These rects are in screen coordinates and must always be updated
    state.elementRect = newRect;
    correctRect(state.fixedContentRect);
    correctRect(state.cutoutRects.topLeft);
    correctRect(state.cutoutRects.topRight);
    correctRect(state.cutoutRects.botLeft);
    correctRect(state.cutoutRects.botRight);
    if (true && isHighlightRectDebuggingOn) {
      updateDebugRect();
    }
  }
  function addMouseWheelListener() {
    // If the highlight is visible and there is a scrollable container, add mousewheel listener for
    // smooth highlight position updates as scrolling occurs.
    // The mousewheel event is better than the scroll event because we can add it in one place (on document) and it bubbles.
    // It also updates for each scroll change, rather than waiting until the scrolling stops.
    // IMPORTANT: add this only in situations when there is an active highlight
    // because listening to mousewheel can cause bad performance.
    if (!isTrackingWheelEvents) {
      domEvents.on(document, "wheel", correctHighlightScreenRects);
      isTrackingWheelEvents = true;
    }
    traitcache.updateCachedViewPosition();
  }
  function removeMouseWheelListener() {
    if (isTrackingWheelEvents) {
      domEvents.off(document, "wheel", correctHighlightScreenRects);
      isTrackingWheelEvents = false;
    }
  }
  function isScrollEvent(event) {
    return cursorPos && event.screenX === cursorPos.screenX && event.screenY === cursorPos.screenY;
  }
  // Used for performance shortcut -- if still inside same highlight
  function isExistingHighlightRelevant() {
    if (!state.isCreated) {
      return false;
    }
    // Return true we're inside in the existing highlight
    return isCursorInHighlightShape([ state.fixedContentRect ], getCutoutRectsArray());
  }
  function onMouseMove(event) {
    if (true) {
      if (isSticky && !event.shiftKey) {
        return;
      }
    }
    pickFromMouseAfterDelay(event);
  }
  function updateDebugRect() {
    $("#sc-debug-mh-rect").remove();
    if (!state.isCreated) {
      return;
    }
    $('<sc id="sc-debug-mh-rect">').appendTo(document.documentElement).css({
      top: state.fixedContentRect.top + "px",
      left: state.fixedContentRect.left + "px",
      width: state.fixedContentRect.width + "px",
      height: state.fixedContentRect.height + "px",
      position: "fixed",
      pointerEvents: "none",
      outline: "2px solid rgba(150,0,0,.5)"
    });
  }
  // We run the picker if the mouse position hasn't changed for a while, meaning
  // that the mouse has paused over content
  function pickFromMouseAfterDelay(event) {
    clearTimeout(pickFromMouseTimer);
    var wasScrollEvent = isScrollEvent(event);
    // Are we responding to scroll events?
    if (!willRespondToScroll) {
      if (wasScrollEvent) {
        return;
      }
      willRespondToScroll = true;
    }
    if (!isAppropriateFocus) {
      return;
    }
    if (state.isCreated && cursorPos && cursorPos.doCheckCursorInHighlight) {
      // We have an old highlight and mouse moved.
      // What to do about the old highlight? Keep or hide? Depends on whether mouse is still in it
      if (!cursorPos || isScrollEvent(event)) {
        cursorPos = getCursorPos(event);
      } else {
        // No need to recalculate scroll position -- it stayed the same
        cursorPos = getCursorPos(event, cursorPos.pageXOffset, cursorPos.pageYOffset);
      }
      if (isExistingHighlightRelevant()) {
        if (true && isHighlightRectDebuggingOn) {
          updateDebugRect();
        }
        return;
      }
      // Highlight was inappropriate -- cursor wasn't in it
      hide();
    }
    pickFromMouseTimer = nativeGlobal.setTimeout(function() {
      // In case doesn't move after fast velocity, check in a moment and update highlight if no movement
      pickFromMouseTimer = 0;
      pickFromMouse(event);
      if (true && isHighlightRectDebuggingOn) {
        updateDebugRect();
      }
    }, wasScrollEvent ? SCROLL_STOP_MS : MOUSE_STOP_MS);
  }
  function pickFromMouse(event) {
    var picked, target = event.target;
    cursorPos = getCursorPos(event);
    // save picked element
    picked = picker.find(target);
    if (!picked) {
      if (state.picked) {
        hide();
      }
      state.target = target;
      return;
    }
    hide();
    state.picked = $(picked);
    state.target = target;
    if (event.shiftKey && isOnlyShift) {
      // When shift held down, emit command to speak the newly highlighted text
      sitecues.require([ "page/keys/commands" ], function(commands) {
        commands.speakHighlight();
      });
    }
    updateView();
  }
  // refreshEventListeners turns on or off event listeners that enable the highlighter
  // return true if highlight visibility should be restored
  function refreshEventListeners(doForceOff) {
    // The mouse highlight is always enabled when TTS is on or zoom > MIN_ZOOM
    var doTrackMouse = isSitecuesOn && !doForceOff;
    if (doTrackMouse === isTrackingMouse) {
      return isTrackingMouse;
    }
    isTrackingMouse = doTrackMouse;
    var addOrRemoveFn = isTrackingMouse ? domEvents.on : domEvents.off;
    addOrRemoveFn(document, "mousemove", onMouseMove);
    if (platform.browser.isFirefox) {
      // Mitigate lack of mousemove events when scroll finishes
      addOrRemoveFn(document, "mouseover", onMouseMove);
    }
    addOrRemoveFn(document, "focusin", testFocus);
    addOrRemoveFn(document, "focusout", testFocus);
    addOrRemoveFn(window, "focus", onFocusWindow);
    addOrRemoveFn(window, "blur", onBlur);
    addOrRemoveFn(window, "resize", hide);
    addOrRemoveFn(window, "mousedown", setFocus);
    if (!isTrackingMouse) {
      removeMouseWheelListener();
    }
    return isTrackingMouse;
  }
  // This addresses the stickiness of the focus on the dropdown select element on fairfieldcountybank.com
  function setFocus(evt) {
    if (evt.target !== document.activeElement && "function" === typeof evt.target.focus) {
      evt.target.focus();
    }
    testFocus();
  }
  function getCursorPos(event, scrollX, scrollY) {
    return {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      scrollX: "number" === typeof scrollX ? scrollX : window.pageXOffset,
      scrollY: "number" === typeof scrollY ? scrollY : window.pageYOffset,
      doCheckCursorInHighlight: true
    };
  }
  // Reenable highlight if appropriate
  // Clear the existing highlight if we don't reenable or if highlight can't be shown
  // (e.g. because focus is not in the right place, or the mouse cursor isn't inside the highlight)
  // Mouse event is passed if available.
  function resumeAppropriately(mouseEvent) {
    if (refreshEventListeners()) {
      // Don't do cursor-inside-picked-content check, because it may not be after zoom change
      if (mouseEvent) {
        cursorPos = getCursorPos(mouseEvent);
      }
      if (updateView()) {
        return;
      }
    }
    hide();
  }
  function onSpeechChanged() {
    if (!refreshEventListeners()) {
      hide(true);
    }
  }
  function isWindowActive() {
    return platform.browser.isSafari ? isWindowFocused : document.hasFocus();
  }
  function testFocus() {
    var wasAppropriateFocus = isAppropriateFocus;
    // don't show highlight if current active isn't body
    var target = document.activeElement;
    isAppropriateFocus = isBPOpen || (!target || !elementClassifier.isSpacebarConsumer(target)) && isWindowActive();
    if (!isSticky) {
      if (wasAppropriateFocus && !isAppropriateFocus) {
        hide();
      } else {
        if (!wasAppropriateFocus && isAppropriateFocus) {
          resumeAppropriately();
        }
      }
    }
  }
  function willExpand() {
    isBPOpen = true;
    testFocus();
  }
  function didShrink() {
    isBPOpen = false;
    testFocus();
  }
  function onFocusWindow() {
    isWindowFocused = true;
    testFocus();
  }
  function onBlur(event) {
    if (event.target !== window) {
      return;
    }
    isWindowFocused = false;
    isAppropriateFocus = false;
    // When the user blurs (unfocuses) the window, we should
    // hide and forget the highlight (unless sticky highlight is on)
    if (!isSticky) {
      hide();
    }
  }
  // When the user mouses out of the window, we should
  // hide and forget the highlight (unless sticky highlight is on)
  function onLeaveWindow(evt) {
    function isRealLeaveEvent(evt) {
      // Browsers firing spurious mouseout events when mouse moves over highlight edge
      // This check seems to work to see if the user really exited the window
      // Note, for mouseout events, relatedTarget is the event targt the pointing device exited to
      return !evt.relatedTarget || evt.relatedTarget === document.documentElement;
    }
    if (isRealLeaveEvent(evt) && !isSticky) {
      hide();
    }
  }
  // pause() -- temporarily hide mouse highlight
  // and remove event listeners so that we don't update the highlight on mouse move
  // (until they're enabled again, via resume())
  function pause() {
    hide(true);
    refreshEventListeners(true);
  }
  function tryExistingHighlight() {
    var REQUIRED_RATIO_HIGHLIGHT_ONSCREEN = .5, prevHighlightRect = state.absoluteRect;
    if (!prevHighlightRect) {
      return;
    }
    var scrollX = window.pageXOffset, scrollY = window.pageYOffset, screenWidth = window.innerWidth, screenHeight = window.innerHeight, left = Math.max(prevHighlightRect.left, scrollX), right = Math.min(prevHighlightRect.right, scrollX + screenWidth), top = Math.max(prevHighlightRect.top, scrollY), bottom = Math.min(prevHighlightRect.bottom, scrollY + screenHeight), onScreenWidth = right - left, onScreenHeight = bottom - top, onScreenHighlightArea = onScreenWidth * onScreenHeight, totalHighlightArea = prevHighlightRect.width * prevHighlightRect.height, visibleRatio = onScreenHighlightArea / totalHighlightArea;
    if (visibleRatio < REQUIRED_RATIO_HIGHLIGHT_ONSCREEN) {
      return;
    }
    return updateView();
  }
  function autoPick() {
    // First try for existing hidden highlight
    // If it would still be onscreen, use it
    if (tryExistingHighlight()) {
      return;
    }
    // Retrieve some leaf nodes
    var nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT, null, false);
    var knownGoodState = state;
    var knownGoodScore = -9;
    var skipElement;
    var bodyWidth = bodyGeo.getBodyWidth();
    var bodyHeight = document.body.scrollHeight;
    traitcache.resetCache();
    var viewSize = traitcache.getCachedViewSize();
    // Get first visible text and start from there
    function isAcceptableTextLeaf(node) {
      // Logic to determine whether to accept, reject or skip node
      if (common.isWhitespaceOrPunct(node)) {
        return;
      }
      var rect = traitcache.getScreenRect(node.parentNode);
      if (0 === rect.width || 0 === rect.height || rect.top > viewSize.height || rect.left > viewSize.width || rect.right < 0 || rect.bottom < 0) {
        return;
      }
      return true;
    }
    while (true) {
      var containingElement, nextLeaf = nodeIterator.nextNode();
      if (!nextLeaf) {
        break;
      }
      if (!isAcceptableTextLeaf(nextLeaf)) {
        continue;
      }
      if (skipElement && $.contains(skipElement, nextLeaf)) {
        continue;
      }
      containingElement = nextLeaf.parentNode;
      if (containingElement && highlight(containingElement, true, true, true)) {
        skipElement = state.picked[0];
        // Don't try anything else in this container
        var scoreInfo = picker.getAutoPickScore(state.picked, state.fixedContentRect, state.absoluteRect, bodyWidth, bodyHeight), score = scoreInfo.score;
        if (score > knownGoodScore) {
          knownGoodState = $.extend({}, state);
          knownGoodScore = score;
        }
        if (scoreInfo.skip) {
          skipElement = scoreInfo.skip;
        } else {
          if (state.fixedContentRect.bottom > window.innerHeight) {
            break;
          }
        }
      }
    }
    highlight(knownGoodState.target, true);
  }
  // Hide mouse highlight temporarily, keep picked data so we can reshow
  // the same highlight without another mouse move.
  // It's useful to call on it's own when the cursor goes outside of the highlight
  // but stays inside the same element.
  function hide(doRememberHighlight) {
    // Now that highlight is hidden, we no longer need these
    removeEventListener("mouseout", onLeaveWindow);
    if (state.picked && state.savedCss) {
      // Restore the previous CSS on the picked elements (remove highlight bg etc.)
      inlineStyle.restore(state.picked[0], BG_PROPS);
      state.savedCss = null;
      state.savedBgColors.forEach(function(savedBg) {
        inlineStyle.restore(savedBg.elem, "background-color");
      });
      state.savedBgColors = [];
      if ("" === state.picked.attr("style")) {
        inlineStyle.clear(state.picked[0]);
      }
      removeMouseWheelListener();
    }
    if (state.overlayContainer) {
      state.overlayContainer.removeAttribute(HIGHLIGHT_OUTLINE_ATTR);
    }
    $("." + HIGHLIGHT_OUTLINE_CLASS).remove();
    if (pickFromMouseTimer) {
      clearTimeout(pickFromMouseTimer);
      pickFromMouseTimer = 0;
    }
    didToggleVisibility(false);
    if (!doRememberHighlight) {
      // Forget highlight state, unless we need to keep it around temporarily
      forget();
    }
  }
  function forget() {
    state = $.extend({}, INIT_STATE);
  }
  function setScrollTracking(isOn) {
    canTrackScroll = isOn;
    willRespondToScroll = false;
  }
  function setOnlyShift(isShift) {
    isOnlyShift = isShift;
  }
  // Return all of the highlight information provided in the |state| variable
  function getHighlight() {
    return state;
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    forget();
    // Temporarily hide and disable mouse highlight once highlight box appears. SC-1786
    // Also to this until zooming finished so that outline doesn't get out of place during zoom
    events.on("zoom/begin mh/pause", pause);
    // enable mouse highlight back once highlight box deflates or zoom finishes
    events.on("hlb/closed zoom", resumeAppropriately);
    // Turn mouse-tracking on or off
    events.on("keys/sitecues-key-down", setScrollTracking);
    // Turn mouse-tracking on or off
    events.on("key/only-shift", setOnlyShift);
    // Mouse highlighting not available while BP is open
    events.on("bp/will-expand", willExpand);
    events.on("bp/did-shrink", didShrink);
    events.on("speech/did-change", function(isOn) {
      isSpeechEnabled = isOn;
    });
    events.on("sitecues/did-toggle", function(isOn) {
      isSitecuesOn = isOn;
      refreshEventListeners();
    });
    // Darken highlight appearance when speech is enabled
    pref.bindListener("ttsOn", onSpeechChanged);
    testFocus();
    // Set initial focus state
    if ("loading" !== document.readyState) {
      // Focus is set again when document finishes loading
      document.addEventListener("DOMContentLoaded", testFocus);
    }
    refreshEventListeners();
  }
  if (true) {
    /**
     * Toggle Sticky state of highlight
     * When stick mode is on, shift must be pressed to move highlight
     */
    sitecues.toggleStickyMH = function() {
      isSticky = !isSticky;
      return isSticky;
    };
    /**
     * Toggle color debugging which makes it easier to see where white gaps in highlight are coming from
     */
    sitecues.toggleMHColorDebugging = function() {
      isColorDebuggingOn = !isColorDebuggingOn;
      return isColorDebuggingOn;
    };
    /**
     * Toggle debugging of the current highlight rect, which needs to keep up-to-date with scrolling
     */
    sitecues.toggleMHRectDebugging = function() {
      isHighlightRectDebuggingOn = !isHighlightRectDebuggingOn;
      return isHighlightRectDebuggingOn;
    };
    sitecues.getHighlight = getHighlight;
  }
  /**
   * Show highlight on the specified seed element or hide if if nothing specified
   * @param seed        -- desired element to highlight, or a CSS selector for one
   * @param doUsePicker -- if truthy will find the best item to highlight ... seed or an ancestor of seed
   *                       if falsey will just highlight seed exactly
   * @param doKeepHidden -- if truthy will compute highlight but not display it
   */
  function highlight(seed, doUsePicker, doSuppressVoting, doKeepHidden) {
    hide();
    // calling with no arguments will remove the highlight
    if (seed) {
      var elem = $(seed)[0];
      if (elem) {
        traitcache.updateCachedViewPosition();
        // Reset cache view to ensure scrolling accounted for
        state.picked = doUsePicker ? picker.find(elem, doSuppressVoting) : $(elem);
        state.target = elem;
        if (state.picked) {
          cursorPos.doCheckCursorInHighlight = false;
          cursorPos.scrollX = window.pageXOffset;
          cursorPos.scrollY = window.pageYOffset;
          if (updateView(doKeepHidden)) {
            return state.picked;
          }
        }
      }
    }
  }
  return {
    getHighlight: getHighlight,
    highlight: highlight,
    autoPick: autoPick,
    setScrollTracking: setScrollTracking,
    hide: hide,
    init: init
  };
});

sitecues.define("page/positioner/constants", [], function() {
  var constants = {};
  constants.TRANSPLANT_STATE = {
    UNCLONED: 0,
    CLONED: 1,
    MIXED: 2,
    ROOT: 3,
    NESTED_ROOT: 4,
    NESTED: 5
  };
  constants.INLINE_STYLE_PATTERN = ":\\s?([^;]*);\\s?";
  constants.ATTRIBUTE_REGEX = /\[([^\=~\|\^\$\*\]]+)[^\]]*\]/;
  constants.ID_REGEX = /#([^\s\+>~\.\[:]+)/g;
  constants.CLASS_REGEX = /\.([^\s\+>~\.\[:]+)/g;
  constants.LOCK_ATTR = "data-sc-lock-";
  constants.ROOT_ATTR = "data-sc-root";
  constants.ROOT = "root";
  constants.FIXED_ROOT = constants.ROOT + "_fixed";
  constants.HIDDEN_ROOT = constants.ROOT + "_hidden";
  constants.ROOT_SELECTOR = "[" + constants.ROOT_ATTR + '^="' + constants.ROOT + '"]';
  constants.FIXED_ROOT_SELECTOR = "[" + constants.ROOT_ATTR + '="' + constants.FIXED_ROOT + '"]';
  constants.HIDDEN_ROOT_SELECTOR = "[" + constants.ROOT_ATTR + '="' + constants.HIDDEN_ROOT + '"]';
  return constants;
});

/**
 * element-map
 *
 * Stores any meta data you want with an element
 * TODO perhaps traitcache should use this -- in some ways they are very similar (note that traitcache uses $.data);
 * TODO can we just set properties directly in the same way $.data() does? E.g. element.scdata.computedStyle = {}
 */
sitecues.define("page/positioner/util/element-map", [], function() {
  var map = new WeakMap();
  function setField(element, fields, values) {
    var dataCache = getData(element);
    if (!Array.isArray(fields)) {
      fields = [ fields ];
      values = [ values ];
    }
    var len = fields.length;
    for (var i = 0; i < len; i++) {
      dataCache[fields[i]] = values[i];
    }
    map.set(element, dataCache);
  }
  function saveComputedStyle(element, style) {
    setField(element, [ "computedStyle" ], [ style ]);
  }
  function clearComputedStyle(elements) {
    if (Array.isArray(elements)) {
      var len = elements.length;
      for (var i = 0; i < len; i++) {
        var element = elements[i];
        if (element) {
          flushField(element, "computedStyle");
        }
      }
    } else {
      flushField(elements, "computedStyle");
    }
  }
  function getComputedStyle(element) {
    var style = getField(element, "computedStyle");
    if (style) {
      return style;
    }
    style = window.getComputedStyle(element);
    saveComputedStyle(element, style);
    return style;
  }
  function refreshComputedStyle(element) {
    clearComputedStyle(element);
    return getComputedStyle(element);
  }
  function flushField(element, fields) {
    var values = [], dataCache = getData(element);
    if (!Array.isArray(fields)) {
      fields = [ fields ];
    }
    var i = fields.length;
    while (i--) {
      var field = fields[i];
      values.push(dataCache[field]);
      delete dataCache[field];
    }
    map.set(element, dataCache);
    return 1 === values.length ? values[0] : values;
  }
  function getField(element, field) {
    return getData(element)[field];
  }
  function addToField(element, field, value) {
    var data = getField(element, field) || [];
    data.push(value);
    setField(element, [ field ], [ data ]);
  }
  function getData(element) {
    return map.get(element) || {};
  }
  return {
    setField: setField,
    addToField: addToField,
    flushField: flushField,
    getField: getField,
    clearComputedStyle: clearComputedStyle,
    refreshComputedStyle: refreshComputedStyle,
    getComputedStyle: getComputedStyle
  };
});

sitecues.define("page/positioner/util/element-info", [ "page/positioner/util/element-map", "page/zoom/state", "run/platform", "run/events", "run/util/array-utility", "hlb/hlb" ], function(elementMap, state, platform, events, arrayUtil, hlb) {
  var originalBody, docElem, didCacheBPElements, bpElementMap, isInitialized;
  function getScale(element, position) {
    // If we've never scaled this element before, it's possible that this element is inheriting a transformation from the original body
    // It's important that we know the resolved transformation so that we can calculate the element's untransformed dimensions.
    // This method is less expensive than computing the resolved transformation, and the math is simpler
    var fixed = "fixed" === position, // In IE, fixed elements do not inherit transformations
    inheritedScale = !(fixed && platform.browser.isIE) && isInOriginalBody(element);
    return elementMap.getField(element, "scale") || (inheritedScale ? state.completedZoom : 1);
  }
  function setScale(element, value) {
    elementMap.setField(element, "scale", value);
  }
  function getPosition(element) {
    return getCacheValue(element, "position");
  }
  function setPosition(element, value) {
    setCacheValue(element, "position", value);
  }
  function getCacheValue(element, property) {
    return elementMap.getField(element, "cache_" + property);
  }
  function setCacheValue(element, property, value) {
    elementMap.setField(element, "cache_" + property, value);
  }
  function addSubroots(element, newSubroots) {
    elementMap.setField(element, "subroots", getSubroots(element).concat(newSubroots));
  }
  function clearSubroots(element) {
    elementMap.setField(element, "subroots", []);
  }
  function removeSubroots(element, oldSubroots) {
    if (!Array.isArray(oldSubroots)) {
      oldSubroots = [ oldSubroots ];
    }
    var subroots = getSubroots(element);
    oldSubroots.forEach(function(subroot) {
      var index = subroots.indexOf(subroot);
      if (index !== -1) {
        subroots.splice(index, 1);
      }
    });
    elementMap.setField(element, "subroots", subroots);
  }
  function setSubroots(element, subroots) {
    elementMap.setField(element, "subroots", subroots);
  }
  function getSubroots(element) {
    return elementMap.getField(element, "subroots") || [];
  }
  function getRoot(element) {
    return elementMap.getField(element, "root");
  }
  function setRoot(element, root) {
    elementMap.setField(element, "root", root);
  }
  function getPlaceholderOwner(element) {
    return elementMap.getField(element, "placeholderFor");
  }
  function getPlaceholder(element) {
    return elementMap.getField(element, "placeholder");
  }
  function setPlaceholder(element, placeholder) {
    elementMap.setField(element, "placeholder", placeholder);
  }
  function setHostBody(element, body) {
    elementMap.setField(element, "body", body);
  }
  // This returns the body the element is current parented within, either the auxiliary or original body
  function getHostBody(element) {
    // Root elements have a cached reference to their host body in the element map
    var body = elementMap.getField(element, "body");
    if (!body) {
      var ancestor = element;
      if (!ancestor.parentElement) {
        return null;
      }
      do {
        ancestor = ancestor.parentElement;
      } while ("body" !== ancestor.localName.toLowerCase() && ancestor !== docElem);
      body = ancestor === docElem ? null : ancestor;
    }
    return body;
  }
  function isPlaceholder(element) {
    return "placeholder" === element.className;
  }
  function isClone(element, value) {
    return getOrSet(element, "isClone", value);
  }
  function isOriginal(element) {
    return !isClone(element) && !isPlaceholder(element);
  }
  function isBPElement(element) {
    if (!didCacheBPElements) {
      var badge = document.getElementById("sitecues-badge"), bp = document.getElementById("scp-bp-container"), badgeElems = badge ? arrayUtil.from(badge.querySelectorAll("*")).concat(badge) : [], bpElems = bp ? arrayUtil.from(bp.querySelectorAll("*")).concat(bp) : [];
      badgeElems.concat(bpElems).forEach(function(el) {
        bpElementMap.set(el, true);
      });
      // If the badge hasn't been inserted yet, don't bother saving the cached list (it's empty)
      didCacheBPElements = Boolean(badge);
    }
    return Boolean(bpElementMap.get(element));
  }
  function isHLBElement(element) {
    var hlbElement = hlb.getElement();
    if (hlbElement) {
      var ancestor = element.parentElement;
      while (ancestor) {
        if (ancestor === hlbElement) {
          return true;
        }
        ancestor = ancestor.parentElement;
      }
    }
    return false;
  }
  function isSitecuesElement(element) {
    return isBPElement(element) || isHLBElement(element);
  }
  function isTransplantRoot(element, value) {
    if (true === value) {
      hasBeenTransplanted(element, true);
    }
    return getOrSet(element, "isRoot", value);
  }
  function isTransplantAnchor(element) {
    return isTransplantRoot(element) && !getRoot(element);
  }
  function hasBeenTransplanted(element, value) {
    return getOrSet(element, "hasBeenTransplanted", value);
  }
  function isInOriginalBody(element) {
    return getHostBody(element) === originalBody;
  }
  function getOrSet(element, field, value) {
    if ("undefined" !== typeof value) {
      elementMap.setField(element, field, value);
      return;
    }
    return elementMap.getField(element, field);
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    originalBody = document.body;
    docElem = document.documentElement;
    bpElementMap = new WeakMap();
    events.on("bp/did-insert-secondary-markup bp/content-loaded bp/did-insert-bp-element", function() {
      didCacheBPElements = false;
    });
  }
  return {
    getScale: getScale,
    setScale: setScale,
    getCacheValue: getCacheValue,
    setCacheValue: setCacheValue,
    getPosition: getPosition,
    setPosition: setPosition,
    getHostBody: getHostBody,
    setHostBody: setHostBody,
    getPlaceholder: getPlaceholder,
    setPlaceholder: setPlaceholder,
    getPlaceholderOwner: getPlaceholderOwner,
    getRoot: getRoot,
    setRoot: setRoot,
    clearSubroots: clearSubroots,
    getSubroots: getSubroots,
    setSubroots: setSubroots,
    addSubroots: addSubroots,
    removeSubroots: removeSubroots,
    isClone: isClone,
    isOriginal: isOriginal,
    isSitecuesElement: isSitecuesElement,
    isPlaceholder: isPlaceholder,
    hasBeenTransplanted: hasBeenTransplanted,
    isTransplantRoot: isTransplantRoot,
    isTransplantAnchor: isTransplantAnchor,
    isInOriginalBody: isInOriginalBody,
    init: init
  };
});

/*
* Selector Map
*
*  This module is responsible for caching the last query of a selector.
*
*  We only cache references to original elements, not clone elements
* */
sitecues.define("page/positioner/style-lock/style-listener/selector-map", [ "page/positioner/util/element-info" ], function(elementInfo) {
  // Caches references to elements that were selected the last time we queried the selector
  // Note: elements selected by fixed selectors are probably fixed, but haven't had their styles computed
  var selectorToElementsMap = {};
  // Private utility method
  function querySelector(selector) {
    var results;
    // Safari is incapable of processing certain selectors
    // example from chicagolighthouse.org :
    // input[type=\"number\"]::-webkit-inner-spin-button, input[type=\"number\"]::-webkit-outer-spin-button"
    try {
      results = Array.prototype.slice.call(document.querySelectorAll(selector), 0).filter(elementInfo.isOriginal);
      // Only original elements are considered for processing
      return results;
    } catch (e) {
      return [];
    }
  }
  function getCachedQuery(selector) {
    return selectorToElementsMap[selector] || [];
  }
  // if @selector is undefined, query all fixed selectors
  function makeNewQuery(selector) {
    selectorToElementsMap[selector] = querySelector(selector);
    return selectorToElementsMap[selector];
  }
  function cacheInitialQueries(selectors) {
    selectors.forEach(function(selector) {
      makeNewQuery(selector);
    });
  }
  return {
    cacheInitialQueries: cacheInitialQueries,
    makeNewQuery: makeNewQuery,
    getCachedQuery: getCachedQuery
  };
});

/*
* Query Manager
*
* This module takes the selectors for rule sets containing declarations of styles we're listening for, queries the selectors, and caches
* the results in the selector map. The symmetric difference between the last (or initial) query and the current query of a selector, that is
* the elements newly selected and unselected, are passed to the registered results handler.
* */
sitecues.define("page/positioner/style-lock/style-listener/query-manager", [ "page/positioner/style-lock/style-listener/selector-map", "run/util/array-utility", "mini-core/native-global" ], function(selectorMap, arrayUtil, nativeGlobal) {
  var resultsHandler, refreshTimer, selectorsToRefresh, // This is an arbitrary timeout, it saves us from requerying the same selectors needlessly in a short interval
  TIMER_DELAY = 50;
  function queue(selectors) {
    if (!Array.isArray(selectors)) {
      selectors = [ selectors ];
    }
    selectors.forEach(function(selector) {
      selectorsToRefresh.add(selector);
    });
    triggerQuery();
  }
  function triggerQuery() {
    if (!refreshTimer) {
      refreshTimer = nativeGlobal.setTimeout(function() {
        selectorsToRefresh.forEach(function(selector) {
          if (selector) {
            processQuery(selector);
          }
        });
        selectorsToRefresh.clear();
        refreshTimer = null;
      }, TIMER_DELAY);
    }
  }
  // Compare elements from the new selector query and the cached selector query
  // We don't know how the resolved value of an element will be impacted by
  // being newly selected or unselected by the given selector, it's possible
  // that a removed rule set was masking or applying the resolved style value we're
  // interested in, so return the difference between the two queries
  function processQuery(selector) {
    var cachedElements = selectorMap.getCachedQuery(selector), currentElements = selectorMap.makeNewQuery(selector), elementsToEvaluate = arrayUtil.symmetricDifference(cachedElements, currentElements);
    function handleResults(element) {
      resultsHandler(element, {
        selector: selector
      });
    }
    for (var i = 0, elementCount = elementsToEvaluate.length; i < elementCount; i++) {
      nativeGlobal.setTimeout(handleResults, 0, elementsToEvaluate[i]);
    }
  }
  function init(handler) {
    selectorsToRefresh = new Set();
    resultsHandler = handler;
  }
  return {
    queue: queue,
    init: init
  };
});

/**
 * This provides the default user agent style rules we care about -- e.g. cursor and colors
 * They have been gleaned from some of the *.css files at:
 * http://mxr.mozilla.org/mozilla-central/source/layout/style
 */
sitecues.define("page/style-service/user-agent-css", [], function() {
  /*jshint multistr: true */
  // The following system colors are converted to hex colors here to improve performance:
  // button { color:ButtonText; border-color:ButtonFace; background-color:ButtonFace; }
  // input:disabled, select:disabled {color:GrayText; background-color:ThreeDFace; }
  var text = 'html{\n  cursor:default;\n}\na,input,textarea,select,button,label{\n  cursor:pointer;\n}\nbody{\n    background-color:#fff;\n    color:#000;\n}\nselect{\n  background-color:#fff;\n  color:#000;\n  border-color:#fff;\n}\ntextarea,input,button{\n  color:#000;\n  border-color:#c0c0c0;\n  background-color:#fff;\n}\ninput:disabled, select:disabled {\n  color:#7f7f7f !important;\n  background-color:#c0c0c0 !important;\n}\nblockquote[type="cite"] {\n  border-color:#00f;\n}\nmark {\n  background-color:#ffff00;\n  color:#000;\n}\nhr {\n  color:#808080;\n}\nimg[usemap], object[usemap] {\n  color:#00f;\n}\na{\n  color:#00f;\n}\na:visited {\n  color:#551a8b;\n}';
  return text;
});

/**
 * This is the module for handling helping sitecues handle media queries.
 */
sitecues.define("page/style-service/media-queries", [], function() {
  function isActiveMediaQuery(mediaQuery) {
    // No media query or a matching one
    var trimmedQuery = "string" === typeof mediaQuery ? mediaQuery.trim() : "";
    return !trimmedQuery || window.matchMedia(trimmedQuery).matches;
  }
  return {
    isActiveMediaQuery: isActiveMediaQuery
  };
});

/**
 * This module collects all the relevant CSS for the entire web page into one large string.
 */
sitecues.define("page/style-service/css-aggregator", [ "$", "page/style-service/user-agent-css", "run/conf/urls", "page/style-service/media-queries", "mini-core/native-global" ], function($, UA_CSS, urls, mediaQueries, nativeGlobal) {
  var onCssReadyFn, numPending = 0, sheets = [], INLINE_ID_ATTR = "data-sc-inline", // Allow each element with inline @style to have own ID for use with stylesheets
  //This kept timing out at 2 seconds
  TIMEOUT_MS = 6e3;
  /**
   * StyleSheet object constructor. This object represents one stylesheet on the page,
   * either from a <link rel="stylesheet">, a <style> or an @import.
   * Caller should provide a url or text, but not both.
   * @param url The url of the stylesheet to fetch
   * @param text The text of the stylesheet if already known (ignored if there is a url)
   * @param debugName [optional] -- a name for the stylesheet to help with debugging
   * @constructor
   */
  function StyleSheet(url, text, debugName) {
    this.url = url;
    if (true) {
      this.debugName = debugName;
    }
    ++numPending;
    var currentSheet = this;
    if (url) {
      // We will need to retrieve this stylesheet over the network
      var request = createGetRequest(url);
      request.url = url;
      // Only apply the request if the response status < 400 (>=400 means error but onerror not called!)
      request.onload = function(evt) {
        var request = evt.target || this;
        if (request.status < 400) {
          currentSheet.text = request.responseText;
        }
        markReady(currentSheet);
      };
      request.onerror = function() {
        // Still need to mark it ready even though we don't have any CSS text for it,
        // otherwise the numPending will not return to 0 and we will never finish aggregating the CSS
        markReady(currentSheet);
      };
      currentSheet.errorTimeout = nativeGlobal.setTimeout(function() {
        markReady(currentSheet);
      }, TIMEOUT_MS);
      request.send();
    } else {
      // A <style> already has it's text --
      // as opposed to a <link href> which will be marked ready after it's loaded
      currentSheet.text = text || "";
      nativeGlobal.setTimeout(function() {
        // Use the setTimeout as a fake fetch that will simply provide the text we already have.
        // (We don't want to mark ready until all the sheets are added to the queue, otherwise we could finish too early)
        markReady(currentSheet);
      }, 0);
    }
  }
  // CSS proxy passes us the CSS text whether or not cross-origin policy allows it
  // Example of page that needs this: http://www.dcmetrobln.org/about-us
  function getCssProxyUrl(url) {
    if (0 === url.indexOf("data:")) {
      return url;
    }
    return urls.getProxyApiUrl("css/passthrough", url);
  }
  /**
   * Cross browser solution to initiating an XMLHTTPRequest
   * that supports the Origin HTTP header
   * @param  {string} method
   * @param  {string} url
   * @return {Object}
   */
  function createGetRequest(url) {
    // Unsafe cross-origin request
    // - Will run into cross-origin restrictions because URL is from different origin
    // This is not an issue with the extension, because the content script doesn't have cross-origin restrictions
    var isUnsafeRequest = true && urls.isCrossOrigin(url);
    if (isUnsafeRequest) {
      if (true) {
        console.log("Cross-Origin: " + url);
      }
      // Use sitecues CSS proxy to bypass CORS restrictions on fetching CSS text for analysis
      url = getCssProxyUrl(url);
    }
    // Credit to Nicholas Zakas
    // http://www.nczonline.net/blog/2010/05/25/cross-domain-ajax-with-cross-origin-resource-sharing/
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "text/css,text/plain");
    return xhr;
  }
  // Once a sheet is ready, mark it as complete and finalize the process if there are no pending sheet requests
  function markReady(sheet) {
    if (sheet.isFinished) {
      return;
    }
    sheet.isFinished = true;
    --numPending;
    clearTimeout(sheet.errorTimeout);
    processSheetCss(sheet);
    finalizeCssIfComplete();
  }
  /**
   * Replace all relatively defined style resources with their absolute counterparts. See SC-1302.
   * @param  {StyleSheet} sheet    A stylesheet object with text
   */
  function convertRelativeUrlsToAbsolute(sheet) {
    /*
     One of our goals is to extract from a CSS file all relative URLs. This document outlines
     valid URLs for CSS: http://www.w3.org/TR/CSS21/syndata.html#uri

     The RegEx below will MATCH the following:

     background: url(instant/templates/_default_/images/nyromodal/close.gif);
     background: url('instant/templates/_default_/images/nyromodal/close.gif');
     background: url("instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  instant/templates/_default_/images/nyromodal/close.gif  );
     background: url(./instant/templates/_default_/images/nyromodal/close.gif);
     background: url('./instant/templates/_default_/images/nyromodal/close.gif');
     background: url("./instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  ./instant/templates/_default_/images/nyromodal/close.gif  );
     background: url(../instant/templates/_default_/images/nyromodal/close.gif);
     background: url('../instant/templates/_default_/images/nyromodal/close.gif');
     background: url("../instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  ../../instant/templates/_default_/images/nyromodal/close.gif  );

     The RegEx below will IGNORE the following:

     background: url(http://example.ru/templates/_default_/close.gif)
     background: url(https://instant/templates/_default_/images/nyromodal/close.gif);
     background: url('http://example.ru/templates/_default_/close.gif')
     background: url('https://instant/templates/_default_/images/nyromodal/close.gif');
     background: url("http://example.ru/templates/_default_/close.gif")
     background: url("https://instant/templates/_default_/images/nyromodal/close.gif");
     background: url(   http://example.ru/templates/_default_/close.gif   )
     background: url(   https://instant/templates/_default_/images/nyromodal/close.gif   );
     background:url(data:jpg;base64,/QL9Av0GaqAAA//2Q==)
     background: url(//int.nyt.com/applications/portals/assets/loader-t-logo-32x32-ecedeb-49955d7789658d80497f4f2b996577f6.gif)
     */
    var RELATIVE_URL_REGEXP = /url\((?:(?:[\'\" ])*(?!data:|https?:\/\/|\/\/)([^\"\'\)]+)[\'\" ]*)/gi;
    return sheet.text.replace(RELATIVE_URL_REGEXP, function(totalMatch, actualUrl) {
      // totalMatch includes the prefix string  url("      - whereas actualUrl is just the url
      return "url(" + urls.resolveUrl(actualUrl, sheet.url);
    });
  }
  // Clear CSS comments out of the current string
  function removeComments(sheet) {
    // From http://blog.ostermiller.org/find-comment
    var COMMENTS_REGEXP = /\/\*(?:[^*]|[\r\n]|(?:\*+(?:[^*\/]|[\r\n])))*\*+\//g;
    return sheet.text.replace(COMMENTS_REGEXP, "");
  }
  // Convert @import into new stylesheet requests
  function processAtImports(sheet) {
    var IMPORT_REGEXP = /\s*(?:@import\s+(?:url\()?(?:(?:['" ])*([^"'\)]+)['" ]*)(?:\))?\s*([^;$]*))/gi;
    return sheet.text.replace(IMPORT_REGEXP, function(totalMatch, actualUrl, mediaQuery) {
      // Insert sheet for retrieval before this sheet, so that the order of precedence is preserved
      mediaQuery = mediaQuery.split(";")[0];
      if (true && mediaQuery) {
        console.log("@import media query: " + mediaQuery);
      }
      if (mediaQueries.isActiveMediaQuery(mediaQuery) && isUsableCssUrl(actualUrl)) {
        insertNewSheetBefore(sheet, urls.resolveUrl(actualUrl, sheet.url));
      }
      // Now remove @import line from CSS so that it does not get reprocessed
      return "";
    });
  }
  // Perform post-processing on the CSS text in the style sheet
  function processSheetCss(sheet) {
    // Ensure some text even in the case of an error
    sheet.text = sheet.text || "";
    // Remove comments so that they do not interfere,
    // after all we don't want to process commented-out @imports!
    sheet.text = removeComments(sheet);
    // Convert relative URLS to absolute
    if (sheet.url) {
      sheet.text = convertRelativeUrlsToAbsolute(sheet);
    }
    // Convert imports into new pending sheets
    sheet.text = processAtImports(sheet);
  }
  function insertNewSheetBefore(insertBeforeSheet, urlForNewSheet) {
    var debugName = true && "@import " + urlForNewSheet, insertionIndex = sheets.indexOf(insertBeforeSheet), newSheet = new StyleSheet(urlForNewSheet, null, debugName);
    sheets.splice(insertionIndex, 0, newSheet);
  }
  function addSheet(url, text, debugName) {
    var newSheet = new StyleSheet(url, text, debugName);
    sheets.push(newSheet);
  }
  function hasPendingRequests() {
    return numPending > 0;
  }
  function finalizeCssIfComplete() {
    if (hasPendingRequests()) {
      return;
    }
    // Concatenate retrieved CSS text
    var allCss = "";
    sheets.forEach(function(sheet) {
      if (true) {
        allCss += "\n/***** " + sheet.debugName + " *****/\n\n";
      }
      allCss += (sheet.text || "") + "\n";
    });
    // Clear the sheets references and free the memory
    sheets.length = 0;
    // Use callback
    onCssReadyFn(allCss);
  }
  // Needed to support deprecated @bgcolor
  // for example on http://www.nhptv.org/natureworks/fisher.htm
  function addDeprecatedAttributeStyles() {
    var bgColors = {}, cssText = "";
    $("body[bgColor],table[bgcolor],td[bgcolor],th[bgcolor]").each(function() {
      bgColors[this.getAttribute("bgcolor")] = 1;
    });
    Object.keys(bgColors).forEach(function(bgColor) {
      cssText += '[bgColor="' + bgColor + '"] { background-color:' + bgColor + " }\n";
    });
    if (cssText) {
      addSheet(null, cssText, "bgcolor attrs");
    }
  }
  // Needed to support hacky inline style attributes
  // for example background-image on http://www.classifieds.faast.org/
  function addInlineStyles() {
    var cssText = "";
    $("body [style]").not("#sitecues-badge,#sitecues-badge *").each(function(index, element) {
      $(element).attr(INLINE_ID_ATTR, index);
      cssText += "[" + INLINE_ID_ATTR + '="' + index + '"] {' + element.getAttribute("style") + "}\n";
    });
    if (cssText) {
      addSheet(null, cssText, "inline style attrs");
    }
  }
  /**
   * Initiates the collection of all style sheet text
   */
  function collectAllCss(cssReadyCallbackFn) {
    onCssReadyFn = cssReadyCallbackFn;
    if ("loading" !== document.readyState) {
      collectAllCssImpl();
    } else {
      document.addEventListener("DOMContentLoaded", collectAllCssImpl);
    }
  }
  function isUsableCssUrl(url) {
    // Sitecues does not need to process CSS3 fonts, at least for now -- waste of processing
    // Fill in more common font pattern libraries here
    // The benefit is less work and speedier processing of site CSS
    var GOOGLE_FONT_PATTERN = "//fonts.google";
    return url.indexOf(GOOGLE_FONT_PATTERN) < 0;
  }
  function collectAllCssImpl() {
    function startsWith(s1, s2) {
      return s1.substr(0, s2.length) === s2;
    }
    function isUsableLinkedStyleSheet(linkElem) {
      // Ignore all CSS with the wrong media, e.g. print
      return mediaQueries.isActiveMediaQuery(linkElem.media) && isUsableCssUrl(linkElem.href);
    }
    function isUsableStyleElement(styleElem) {
      return !!styleElem.firstChild;
    }
    function isUsable(index, elem) {
      var SITECUES_STYLE_ID_PREFIX = "sitecues-js-", // <style id="sitecues-js-XXX"> are sitecues stylesheets
      id = elem.id;
      if (!id || !startsWith(id, SITECUES_STYLE_ID_PREFIX)) {
        return "link" === elem.localName ? isUsableLinkedStyleSheet(elem) : isUsableStyleElement(elem);
      }
    }
    function addSheetForElem(index, elem) {
      var isLink = "link" === elem.localName, href = isLink && elem.href, text = !isLink && elem.firstChild.data, debugName = true && elem.localName + " " + (href || "");
      return addSheet(href, text, debugName);
    }
    // First come the default user agent CSS rules
    addSheet(null, UA_CSS, "User agent styles");
    // Add styles to make up for deprecated bgcolor attribute
    addDeprecatedAttributeStyles();
    // Add styles to deal with inline style="foo" attributes?
    addInlineStyles();
    // Next add <link> and <style> sheets, in document order
    var $styleElems = $('link[rel="stylesheet"],style').filter(isUsable);
    $styleElems.each(addSheetForElem);
  }
  return {
    collectAllCss: collectAllCss
  };
});

/**
 * Service that lazily gets user agent and page stylesheets
 * and provides information about them.
 */
sitecues.define("page/style-service/style-service", [ "$", "page/style-service/css-aggregator", "page/style-service/media-queries", "run/platform", "mini-core/native-global" ], function($, cssAggregator, mediaQueries, platform, nativeGlobal) {
  var isInitialized, isCssRequested, // Have we even begun the init sequence?
  isCssComplete, domStylesheetObjects = [], SITECUES_COMBINED_CSS_ID = "sitecues-js-combined-css", WAIT_BEFORE_USING_STYLESHEET_DATA = 50, CSS_MAX_CHUNK_SIZE = 5e3, // Max number of CSS chars to process at once
  DOM_STYLESHEET_KEY = "DOMSS", // Init sequence is complete
  callbackFns = [], debugTime = {};
  function addChunk(css, chunks, start, end) {
    var newChunk = css.substring(start, end), numChunks = chunks.length;
    if (chunks[numChunks - 1].length + newChunk.length < CSS_MAX_CHUNK_SIZE) {
      // Still fits within size threshold, just add to last chunk
      chunks[numChunks - 1] += newChunk;
    } else {
      chunks[numChunks] = newChunk;
    }
  }
  // Each } that is not inside an outer {} ends a legal chunk of CSS
  // We've already removed comments, so no need to worry about those
  function chunkCssByClosingBrace(css) {
    var nextClosingBrace, nextOpeningBrace, chunks = [ "" ], lastChunkStart = 0, position = 0, braceDepth = 0;
    while (true) {
      nextClosingBrace = css.indexOf("}", position);
      nextOpeningBrace = css.indexOf("{", position);
      if (nextOpeningBrace >= 0 && nextOpeningBrace < nextClosingBrace) {
        braceDepth++;
        // Now 1 if not already inside other braces
        position = nextOpeningBrace + 1;
        continue;
      } else {
        if (nextClosingBrace >= 0) {
          braceDepth--;
          position = nextClosingBrace + 1;
          if (0 === braceDepth) {
            // The end of a CSS block
            addChunk(css, chunks, lastChunkStart, position);
            lastChunkStart = position;
          } else {
            if (braceDepth < 0) {
              if (true) {
                console.log("Error parsing CSS ... brace mismatch at %s", css.substring(0, nextClosingBrace + 1));
              }
              addChunk(css, chunks, lastChunkStart, css.length);
              break;
            } else {}
          }
        } else {
          // Last chunk
          addChunk(css, chunks, lastChunkStart, css.length);
          break;
        }
      }
    }
    return chunks;
  }
  // Sometimes CSS that's too large creates huge performance problems in IE, locking up the browser
  // There seems to be a size threshold where the problems don't occur if they are under that
  // Note: not necessary in Edge!
  function chunkCss(allCss) {
    if (!platform.browser.isIE || allCss.length < CSS_MAX_CHUNK_SIZE) {
      return [ allCss ];
    }
    return chunkCssByClosingBrace(allCss);
  }
  /**
   * Create an disabled style sheet to be filled in later with styles
   */
  function createCombinedStylesheets(allCss, callback) {
    var cssChunks = chunkCss(allCss), index = 0, numChunks = cssChunks.length, elems = [];
    function createNext() {
      var $newSheet = updateSheet(SITECUES_COMBINED_CSS_ID + "-" + index, {
        text: cssChunks[index],
        doDisable: true
      });
      elems[index] = $newSheet[0];
      if (++index < numChunks) {
        // We must wait before creating the next stylesheet otherwise we overload IE11 and cause it to lockup
        nativeGlobal.setTimeout(createNext, 0);
      } else {
        callback(elems);
      }
    }
    createNext();
  }
  function getDOMStyleSheetObjects(styleElems, callback) {
    var numRemaining = styleElems.length;
    styleElems.forEach(function(styleElem, index) {
      getDOMStylesheet($(styleElem), function(domStylesheetObject) {
        domStylesheetObjects[index] = domStylesheetObject;
        if (0 === --numRemaining) {
          callback();
        }
      });
    });
  }
  // This is called() when all the CSS text of the document is available for processing
  function retrievalComplete(allCss) {
    if (true) {
      debugTime.retrievalComplete = performance.now();
    }
    createCombinedStylesheets(allCss, function(styleElems) {
      nativeGlobal.setTimeout(function() {
        getDOMStyleSheetObjects(styleElems, function() {
          isCssComplete = true;
          clearCallbacks();
        });
      }, WAIT_BEFORE_USING_STYLESHEET_DATA);
    });
  }
  function isReady() {
    return isCssComplete;
  }
  function requestCss() {
    if (isCssRequested) {
      return;
    }
    if (true) {
      debugTime.begin = performance.now();
    }
    isCssRequested = true;
    // Create a <style id="sitecues-js-combined-css"> containing all relevant style rule in the right order.
    // It will start with default user agent style rules and add
    // any <style> or <link> that is not from sitecues, and create a combined stylesheet with those contents (in the right order).
    // This will initialize the composite stylesheet when finished and call style-service/ready
    cssAggregator.collectAllCss(retrievalComplete);
  }
  // -------------------------------------- PUBLIC -----------------------------------------------
  /**
   * [This function allows the targeting of styles, such as "cursor", and invokes a callback
   * that gets passed the style and the rule associated with it for any CSS selector]
   * @param  {string}   propertyName
   * @param  {string]   matchValue, optional value to match, null to match anything
   * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
   */
  function getAllMatchingStyles(propertyName, matchValue) {
    return getAllMatchingStylesCustom(function(cssStyleDeclaration) {
      var ruleValue = cssStyleDeclaration[propertyName];
      if (ruleValue && (!matchValue || matchValue === ruleValue)) {
        return ruleValue;
      }
    });
  }
  /**
   * [This function allows the targeting of styles, such as "cursor", and invokes a callback
   * that gets passed the style and the rule associated with it for any CSS selector]
   * @param  {fn} matchingFn takes a cssStyleDecl and returns a truthy/falsey value
   * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
   */
  function getAllMatchingStylesCustom(matchingRuleFn) {
    var rule, ruleValue, cssStyleDeclaration, styleResults = [], index = 0;
    function getMediaTypeFromCssText(rule) {
      // Change @media MEDIA_QUERY_RULES { to just MEDIA_QUERY_RULES
      return rule.cssText.split("{")[0].substr(7);
    }
    function addMatchingRules(rulesContainer) {
      var rules = rulesContainer.cssRules, ruleIndex = 0, numRules = rules ? rules.length : 0;
      for (;ruleIndex < numRules; ruleIndex++) {
        rule = rules[ruleIndex];
        cssStyleDeclaration = rule.style;
        if (cssStyleDeclaration && rule.selectorText) {
          // Could be null if rule is CSSMediaRule / @font-face
          ruleValue = matchingRuleFn(cssStyleDeclaration, rule.selectorText);
          if (ruleValue) {
            styleResults.push({
              rule: rule,
              value: ruleValue
            });
          }
        } else {
          if (rule.media) {
            // Only add CSS rules where the media query fits
            // TODO Unfortunately, this means that if the window size or zoom changes,
            //      we won't have those rules anymore. Do we reanalyze at that point?
            var media = getMediaTypeFromCssText(rule);
            if (mediaQueries.isActiveMediaQuery(media)) {
              // if (SC_DEV) { console.log('@media matched: ' + media); }
              addMatchingRules(rule);
            }
          }
        }
      }
    }
    if (!isCssComplete) {
      return [];
    }
    for (;index < domStylesheetObjects.length; index++) {
      addMatchingRules(domStylesheetObjects[index]);
    }
    return styleResults;
  }
  /**
   * Get the DOM object for the stylesheet that lets us traverse the style rules.
   * Annoying that we have to do this.
   * Uses callback instead of Promises because we want to be synchronous if possible.
   * This allows us to disable style sheets before they can cause a rerendering
   * @param $stylesheet
   * @returns {*}
   */
  function getDOMStylesheet($stylesheet, callback) {
    var cachedDOMStylesheet = $stylesheet.data(DOM_STYLESHEET_KEY);
    if (cachedDOMStylesheet) {
      callback(cachedDOMStylesheet);
      return;
    }
    var tries = 1, MAX_TRIES = 20, TRY_INTERVAL_MS = 10, id = $stylesheet[0].id;
    function getStyleSheet() {
      var domSheet, i = 0, numSheets = document.styleSheets.length;
      for (;i < numSheets; i++) {
        domSheet = document.styleSheets[i];
        if (domSheet.ownerNode.id === id) {
          $stylesheet.data(DOM_STYLESHEET_KEY, domSheet);
          callback(domSheet);
          return;
        }
      }
      if (++tries <= MAX_TRIES) {
        if (true) {
          console.log("Could not find stylesheet " + id);
        }
        nativeGlobal.setTimeout(getStyleSheet, TRY_INTERVAL_MS);
      }
    }
    getStyleSheet();
  }
  /**
   * Lazily get the style sheet to be used for applying the theme.
   * @returns {jQuery}
   */
  function updateSheet(id, options) {
    var $sheet = $("#" + id), text = options.text, doDisable = options.doDisable, doCreate = !$sheet.length;
    if (doCreate) {
      // Create the stylesheet
      // Note: be sure to insert text into stylesheet before inserting into DOM
      // measured in IE11 to be more performant
      $sheet = $("<style>").attr("id", id);
    }
    // Update text
    if ("string" === typeof text) {
      $sheet.text(text);
    }
    // Update disabled state
    if ("boolean" === typeof doDisable) {
      if (doDisable) {
        // Same as disabling but works without access to DOMStyleSheet object, which is hard to get to
        // This can always be done right away
        // We use the media attribute as an easier cross-browser way to disable sheets
        // Once IE11 goes away we may want to go back to using .disabled property access
        $sheet.attr("media", "(max-width:0px)");
      } else {
        $sheet.removeAttr("media");
      }
    }
    if (doCreate) {
      // Insert in DOM
      $sheet.appendTo("html");
    }
    return $sheet;
  }
  /**
   * Get the CSS text that would be needed to create a new stylesheet from these styles
   */
  function getStyleText(styles, propertyName) {
    // Get CSS text for styles
    var styleIndex = 0, css = "", numStyles = styles.length;
    for (;styleIndex < numStyles; styleIndex++) {
      var rule = styles[styleIndex].rule;
      css += rule.selectorText + " { " + propertyName + ": " + styles[styleIndex].value + "; }\n";
    }
    return css;
  }
  function clearCallbacks() {
    var index = callbackFns.length;
    while (index--) {
      callbackFns[index]();
    }
    callbackFns = [];
  }
  function init(callbackFn) {
    if (callbackFn) {
      callbackFns.push(callbackFn);
    }
    if (isInitialized) {
      if (isCssComplete) {
        clearCallbacks();
      }
      return;
    }
    isInitialized = true;
    requestCss();
  }
  return {
    isReady: isReady,
    requestCss: requestCss,
    init: init,
    getAllMatchingStyles: getAllMatchingStyles,
    getAllMatchingStylesCustom: getAllMatchingStylesCustom,
    getDOMStylesheet: getDOMStylesheet,
    updateSheet: updateSheet,
    getStyleText: getStyleText
  };
});

/*
 * Selectors
 *
 * Collects all rule sets applying specified declarations, and creates an array of the selectors for those rule sets.
 * The attributes and values composing each selector are parsed and mapped to the selector. This allows us to listen for mutations for
 * those specific attributes, and return selectors
 * */
sitecues.define("page/positioner/style-lock/style-listener/selectors", [ "page/style-service/style-service", "page/positioner/constants", "run/util/array-utility" ], function(styleService, constants, arrayUtil) {
  var // Maps attribute name/value keys to buckets of fixed selectors
  // e.g. { id_foo : [selectorA], class_foo : [selectorA, selectorB] }
  // selectors composed of attributes without specific values are mapped as: { attributeName : [selector] }
  attributeValueToSelectorsMap = {}, // maps CSS properties to the selectors for the rule sets they are contained in
  propertyToSelectorsMap = {}, // maps selector to the properties that the style-listener is observing
  selectorToPropertiesMap = {}, // Maps selector to its composite attributes
  selectorToCompositeAttributesMap = {}, parsedSelectors = [], ID_REGEX = constants.ID_REGEX, CLASS_REGEX = constants.CLASS_REGEX, ATTRIBUTE_REGEX = constants.ATTRIBUTE_REGEX;
  // Identifies classes, ids, etc. that compose selectors
  function parseCompositeAttributes(selectors) {
    selectors.forEach(function(selector) {
      var name, match, originalSelector = selector, specialAttributes = {
        id: ID_REGEX,
        class: CLASS_REGEX
      }, results = selector.match(ATTRIBUTE_REGEX);
      while (results) {
        match = results[0];
        name = results[1];
        if (name) {
          attributeValueToSelectorsMap[name] = attributeValueToSelectorsMap[name] || [];
          // It's impractical to re-implement the comparison operations available when selecting by attribute value, so instead we just always
          // re-query selectors composed of mutated attributes, regardless of the attribute's new value
          arrayUtil.addUnique(attributeValueToSelectorsMap[name], originalSelector);
          selectorToCompositeAttributesMap[originalSelector] = selectorToCompositeAttributesMap[originalSelector] || [];
          arrayUtil.addUnique(selectorToCompositeAttributesMap[originalSelector], name);
        }
        // we remove attribute value matches, the values could
        // match the regex patterns for selecting by class or id
        // e.g. [data-foo="#id"]]
        selector = selector.replace(match, "");
        results = selector.match(ATTRIBUTE_REGEX);
      }
      for (name in specialAttributes) {
        if (specialAttributes.hasOwnProperty(name)) {
          var regex = specialAttributes[name];
          results = regex.exec(selector);
          while (results) {
            var value = results[1], key = name + "_" + value;
            selectorToCompositeAttributesMap[originalSelector] = selectorToCompositeAttributesMap[originalSelector] || [];
            arrayUtil.addUnique(selectorToCompositeAttributesMap[originalSelector], name);
            attributeValueToSelectorsMap[key] = attributeValueToSelectorsMap[key] || [];
            arrayUtil.addUnique(attributeValueToSelectorsMap[key], originalSelector);
            results = regex.exec(selector);
          }
        }
      }
    });
  }
  function getPropertiesBySelector(selector) {
    return selectorToPropertiesMap[selector];
  }
  // Get selectors for rule sets that contain declaration
  function getSelectorsForProperty(property) {
    var selectors = propertyToSelectorsMap[property];
    if (!selectors) {
      selectors = propertyToSelectorsMap[property] = styleService.getAllMatchingStyles(property).map(function(styleObject) {
        var selector = styleObject.rule.selectorText;
        // Map selectors to declarations so that we can check the resolved value of styles tied to that selector
        selectorToPropertiesMap[selector] = selectorToPropertiesMap[selector] || [];
        selectorToPropertiesMap[selector].push(property);
        return selector;
      });
      parseCompositeAttributes(selectors);
      parsedSelectors = arrayUtil.union(parsedSelectors, selectors);
    }
    return selectors;
  }
  function getCompositeAttributes(selectors) {
    var allAttributes = [];
    selectors.forEach(function(selector) {
      allAttributes = allAttributes.concat(selectorToCompositeAttributesMap[selector]);
    });
    return arrayUtil.unique(allAttributes);
  }
  // e.g. { id_foo : ['#foo > element', '#foo'] }
  function filterByAttributeValues(attribute, values) {
    // If an attribute value isn't provided, we return selectors mapped to just the attribute name
    // e.g. { data-sc-foo :  [selectorA] }
    if ("undefined" === typeof values) {
      return attributeValueToSelectorsMap[attribute];
    } else {
      if (!Array.isArray(values)) {
        values = [ values ];
      }
    }
    var filteredSelectors = [], length = values.length;
    for (var i = 0; i < length; i++) {
      var value = values[i], key = attribute + "_" + value, selectors = attributeValueToSelectorsMap[key];
      if (selectors) {
        filteredSelectors = filteredSelectors.concat(selectors);
      }
    }
    return filteredSelectors;
  }
  function filterByAttribute(name) {
    return filterByAttributeValues(name);
  }
  function filterByIds(currentId, oldId) {
    var values = [];
    // If ID hasn't changed we don't need to reprocess selectors that depend on it
    if (currentId === oldId) {
      return [];
    }
    if (oldId) {
      values.push(oldId);
    }
    if (currentId) {
      values.push(currentId);
    }
    return filterByAttributeValues("id", values);
  }
  // Return selectors for newly added and removed classes
  function filterByClasses(classes) {
    return filterByAttributeValues("class", classes);
  }
  function init(callback) {
    styleService.init(callback);
  }
  return {
    getCompositeAttributes: getCompositeAttributes,
    getForProperty: getSelectorsForProperty,
    getPropertiesBySelector: getPropertiesBySelector,
    filterByClasses: filterByClasses,
    filterByIds: filterByIds,
    filterByAttribute: filterByAttribute,
    init: init
  };
});

sitecues.define("page/positioner/transplant/anchors", [], function() {
  var addHandlers = [], removeHandlers = [], anchorElements = [];
  function get() {
    return anchorElements;
  }
  function forEach(fn) {
    anchorElements.forEach(fn);
  }
  function add(element) {
    if (anchorElements.indexOf(element) === -1) {
      anchorElements.push(element);
      callHandlers(element, addHandlers);
    }
  }
  function remove(element) {
    var index = anchorElements.indexOf(element);
    if (index >= 0) {
      anchorElements.splice(index, 1);
      callHandlers(element, removeHandlers);
    }
  }
  function callHandlers(element, handlers) {
    handlers.forEach(function(handler) {
      handler.call(element);
    });
  }
  function registerNewAnchorHandler(fn) {
    addHandlers.push(fn);
  }
  function registerRemovedAnchorHandler(fn) {
    removeHandlers.push(fn);
  }
  return {
    forEach: forEach,
    get: get,
    add: add,
    remove: remove,
    registerNewAnchorHandler: registerNewAnchorHandler,
    registerRemovedAnchorHandler: registerRemovedAnchorHandler
  };
});

/*
* Style-Listener
*
* This module is passed css declarations and handlers to call when the document mutates such that an element resolves to or from
* that declaration.
* 
* The positioner uses this module to listen for elements resolving to and from position: fixed.
*
* */
sitecues.define("page/positioner/style-lock/style-listener/style-listener", [ "page/positioner/style-lock/style-listener/query-manager", "page/positioner/style-lock/style-listener/selector-map", "page/positioner/style-lock/style-listener/selectors", "page/positioner/transplant/anchors", "run/util/array-utility", "page/positioner/util/element-info", "page/positioner/util/element-map", "page/positioner/constants", "run/constants", "mini-core/native-global", "run/inline-style/inline-style" ], function(queryManager, selectorMap, selectors, anchors, arrayUtil, elementInfo, elementMap, constants, coreConstants, nativeGlobal, inlineStyle) {
  var domObserver, docElem, originalBody, observedProperties = [], callbacks = [], READY_STATE = coreConstants.READY_STATE, readyState = READY_STATE.UNINITIALIZED, LOCK_ATTR = constants.LOCK_ATTR, // We always need to listen for inline style mutations
  observedAttributes = [ "style" ], /*
     * {
     *   property: ['valueA', 'valueB']
     * }
     *
     * Declarations we're listening for
     * */
  observedPropertyToValues = {}, /*
    * {
    *   property_value: [elementA, elementB]
    * }
    *
    * List of elements that have resolved to this declaration
    * */
  resolvedElementsMap = {}, /*
     * {
     *   direction_property_value: [handlerA, handlerB]
     * }
     *
     * Handlers keyed with their directional style hooks
     * e.g. to_position_fixed: [handlerFn]
     * */
  handlerMap = {}, /*
    * {
    *   elementReference: { property: [handler] }
    * }
    *
    * The outer map keys an element reference to a map of the properties we're listening for specifically for this element, and the handlers that fire when
    * this property mutates
    * */
  elementPropertyHandlerMap = new WeakMap(), observerOptions = {
    attributes: true,
    attributeOldValue: true,
    subtree: true,
    attributeFilter: observedAttributes
  };
  // This handler is run on mutated elements /intended/ to be in the original body, which is to say elements currently nested in the
  // original body and original elements currently nested in the clone body
  function onOriginalElementMutations(mutations) {
    var len = mutations.length, selectorsToRefresh = [];
    function evaluateProperty(target, property) {
      evaluateResolvedValue(target, {
        property: property
      });
    }
    for (var i = 0; i < len; i++) {
      var mutation = mutations[i], target = mutation.target, attribute = mutation.attributeName, oldValue = mutation.oldValue;
      if (elementInfo.isClone(target) || elementInfo.isSitecuesElement(target)) {
        // We only consider changes to original elements when refreshing the fixed elementMap
        // We don't bother listening to sitecues element changes
        continue;
      }
      // This switch evaluates attribute mutations for their styling impact
      switch (attribute) {
       case "class":
        var // SVG elements in IE11 do not define classList
        newClasses = target.classList ? Array.prototype.slice.call(target.classList, 0) : target.className.baseVal.split(" "), oldClasses = oldValue ? oldValue.split(" ") : [], changedClasses = arrayUtil.symmetricDifference(newClasses, oldClasses);
        if (changedClasses.length) {
          selectorsToRefresh = selectorsToRefresh.concat(selectors.filterByClasses(changedClasses));
        }
        break;

       case "id":
        selectorsToRefresh = selectorsToRefresh.concat(selectors.filterByIds(target.id, oldValue));
        break;

       case "style":
        for (var j = 0, propertyCount = observedProperties.length; j < propertyCount; j++) {
          var property = observedProperties[j], inlineKey = property + "_inline_value", inlineValue = inlineStyle(target)[property], oldInlineValue = elementMap.getField(target, inlineKey), didChange = oldInlineValue !== inlineValue;
          if (didChange) {
            elementMap.setField(target, inlineKey, inlineValue);
            nativeGlobal.setTimeout(evaluateProperty, 0, target, property);
          }
        }
      }
    }
    if (selectorsToRefresh.length) {
      queryManager.queue(selectorsToRefresh);
    }
  }
  function evaluateResolvedValue(element, opts) {
    var properties, fromHandlers = new nativeGlobal.Map(), toHandlers = new nativeGlobal.Map(), style = getComputedStyle(element);
    function runHandlers(directionHandlers) {
      directionHandlers.forEach(function(opts, propertyHandlers) {
        for (var i = 0, handlerCount = propertyHandlers.length; i < handlerCount; i++) {
          propertyHandlers[i].call(element, opts);
        }
      });
    }
    if (opts.selector) {
      // Returns the css properties we collected this selector for
      properties = selectors.getPropertiesBySelector(opts.selector);
    } else {
      properties = [ opts.property ];
    }
    properties.forEach(function(property) {
      var handlerKey, observedValues = observedPropertyToValues[property] || [], lockAttribute = LOCK_ATTR + property, lockValue = element.getAttribute(lockAttribute), cachedValue = elementInfo.getCacheValue(element, property);
      if (lockValue) {
        // This attribute 'reinforces' the value this element previously resolved to by applying it with importance
        // We need to remove it in order to compute the intended resolved value
        element.setAttribute(lockAttribute, "");
      }
      var resolvedValue = style[property], elementHandlers = elementPropertyHandlerMap.get(element), propertyHandlers = elementHandlers && elementHandlers[property], opts = {
        property: property,
        toValue: resolvedValue,
        fromValue: cachedValue
      };
      if (lockValue) {
        element.setAttribute(lockAttribute, lockValue);
      }
      if (propertyHandlers && cachedValue !== resolvedValue) {
        // These element handlers run when the element's resolved value for a given style property has mutated from its cached value
        propertyHandlers.forEach(function(fn) {
          fn.call(element, opts);
        });
      }
      for (var i = 0, valueCount = observedValues.length; i < valueCount; i++) {
        var handlers, // Style value we're listening for, e.g. 'fixed' or 'absolute'
        observedValue = observedValues[i], declarationKey = property + "_" + observedValue, resolvedElements = resolvedElementsMap[declarationKey] || [], isMatching = resolvedValue === observedValue, elementIndex = resolvedElements.indexOf(element), wasMatching = elementIndex !== -1;
        if (isMatching && !wasMatching) {
          handlerKey = "to_" + declarationKey;
          handlers = handlerMap[handlerKey];
          if (handlers) {
            toHandlers.set(handlers, opts);
          }
          resolvedElements.push(element);
        } else {
          if (!isMatching && wasMatching) {
            handlerKey = "from_" + declarationKey;
            handlers = handlerMap[handlerKey];
            if (handlers) {
              fromHandlers.set(handlers, opts);
            }
            resolvedElements.splice(elementIndex, 1);
          }
        }
      }
      elementInfo.setCacheValue(element, property, resolvedValue);
    });
    runHandlers(fromHandlers);
    runHandlers(toHandlers);
  }
  function disconnectDOMObserver() {
    var mutationRecords = domObserver.takeRecords();
    // Handle the remaining queued mutation records
    if (mutationRecords.length) {
      nativeGlobal.setTimeout(function(mutationRecords) {
        onOriginalElementMutations(mutationRecords);
      }, 0, mutationRecords);
    }
    domObserver.disconnect();
  }
  function observeOriginalElements() {
    anchors.forEach(function(element) {
      domObserver.observe(element, observerOptions);
    });
    domObserver.observe(originalBody, observerOptions);
  }
  function listenForDynamicStyling(property) {
    var propertySelectors = selectors.getForProperty(property), compositeAttributes = selectors.getCompositeAttributes(propertySelectors);
    selectorMap.cacheInitialQueries(propertySelectors);
    observedAttributes = arrayUtil.union(observedAttributes, compositeAttributes);
    observerOptions.attributeFilter = observedAttributes;
    disconnectDOMObserver();
    observeOriginalElements();
  }
  function getDeclarationKey(declaration) {
    return getPropertyValueKey(declaration.property, declaration.value);
  }
  function getPropertyValueKey(property, value) {
    return property + "_" + value;
  }
  function addHandlerToMap(handler, key) {
    if (!handlerMap[key]) {
      handlerMap[key] = [];
    }
    handlerMap[key].push(handler);
  }
  function registerResolvedValueHandler(declaration, handlerKey, handler) {
    var property = declaration.property, value = declaration.value, observedValues = observedPropertyToValues[property] || [], key = getPropertyValueKey(property, value), isPropertyObserved = observedProperties.indexOf(property) !== -1, isValueObserved = observedValues.indexOf(value) !== -1;
    if (!isValueObserved) {
      observedValues.push(value);
      observedPropertyToValues[property] = observedValues;
      if (!isPropertyObserved) {
        observedProperties.push(property);
      }
      nativeGlobal.setTimeout(function() {
        resolvedElementsMap[key] = getElementsWithResolvedValue(declaration);
        if (!isPropertyObserved) {
          listenForDynamicStyling(property);
        }
      }, 0);
    }
    addHandlerToMap(handler, handlerKey);
  }
  // Runs the passed handler when @element's resolved style @property value has changed
  function registerPropertyMutationHandler(element, declarationOrProperty, handler) {
    var declaration = "object" === typeof declarationOrProperty ? declarationOrProperty : {
      property: declarationOrProperty
    }, property = declaration.property, value = declaration.value, isPropertyObserved = observedProperties.indexOf(property) !== -1, handlers = elementPropertyHandlerMap.get(element) || {};
    // If we've already attached handlers to run when this element's resolved property value mutates,
    // we know that we're already listening for relevant document mutations
    if (handlers[property]) {
      handlers[property].push(handler);
    } else {
      handlers[property] = [ handler ];
      if (!isPropertyObserved) {
        listenForDynamicStyling(property);
        observedProperties.push(property);
      }
    }
    addToResolvedElementsMap(element, property, value);
    elementPropertyHandlerMap.set(element, handlers);
  }
  // This map caches elements we know have a given resolved value
  function addToResolvedElementsMap(element, property, value) {
    var key = getPropertyValueKey(property, value);
    if (resolvedElementsMap[key]) {
      resolvedElementsMap[key] = arrayUtil.addUnique(resolvedElementsMap[key], element);
    } else {
      resolvedElementsMap[key] = [ element ];
    }
    elementInfo.setCacheValue(element, property, value);
  }
  // When the document is mutated such that an element's computed style matches the declaration, pass it to the handler
  function registerToResolvedValueHandler(declaration, handler) {
    var declarationKey = getDeclarationKey(declaration), handlerKey = "to_" + declarationKey;
    registerResolvedValueHandler(declaration, handlerKey, handler);
  }
  // When an element's computed style was matching the passed declaration, and the document is mutated such that it no longer matches
  function registerFromResolvedValueHandler(declaration, handler) {
    var declarationKey = getDeclarationKey(declaration), handlerKey = "from_" + declarationKey;
    registerResolvedValueHandler(declaration, handlerKey, handler);
  }
  function getElementsWithResolvedValue(declaration) {
    var property = declaration.property, value = declaration.value, observedValues = observedPropertyToValues[property], declarationKey = getDeclarationKey(declaration);
    // If we're already listening for elements with this resolved style value, return the list
    if (observedValues && observedValues.indexOf(value) >= 0 && resolvedElementsMap[declarationKey]) {
      return resolvedElementsMap[declarationKey];
    }
    var transplantAnchors = anchors.get(), allBodyElements = Array.prototype.slice.call(document.body.getElementsByTagName("*"), 0);
    resolvedElementsMap[declarationKey] = [];
    // If original elements are transplanted to the auxiliary body, include them in the search
    transplantAnchors.forEach(function(anchor) {
      allBodyElements = allBodyElements.concat(Array.prototype.slice.call(anchor.getElementsByTagName("*"), 0));
    });
    for (var i = 0, elementCount = allBodyElements.length; i < elementCount; i++) {
      var element = allBodyElements[i];
      if (getComputedStyle(element)[property] === value) {
        resolvedElementsMap[declarationKey].push(element);
        elementInfo.setCacheValue(element, property, value);
      }
    }
    return resolvedElementsMap[declarationKey];
  }
  function onNewTransplantAnchor() {
    /*jshint validthis: true */
    domObserver.observe(this, observerOptions);
  }
  function onRemovedTransplantAnchor() {
    disconnectDOMObserver();
    observeOriginalElements();
  }
  function executeCallbacks() {
    callbacks.forEach(function(callback) {
      callback();
    });
    callbacks = null;
  }
  function init(callback) {
    switch (readyState) {
     case READY_STATE.UNINITIALIZED:
      callbacks.push(callback);
      elementInfo.init();
      readyState = READY_STATE.INITIALIZING;
      docElem = document.documentElement;
      originalBody = document.body;
      domObserver = new MutationObserver(onOriginalElementMutations);
      selectors.init(function() {
        readyState = READY_STATE.COMPLETE;
        queryManager.init(evaluateResolvedValue);
        executeCallbacks();
      });
      anchors.registerNewAnchorHandler(onNewTransplantAnchor);
      anchors.registerRemovedAnchorHandler(onRemovedTransplantAnchor);
      break;

     case READY_STATE.INITIALIZING:
      callbacks.push(callback);
      break;

     case READY_STATE.COMPLETE:
      callback();
    }
  }
  return {
    registerPropertyMutationHandler: registerPropertyMutationHandler,
    registerToResolvedValueHandler: registerToResolvedValueHandler,
    registerFromResolvedValueHandler: registerFromResolvedValueHandler,
    getElementsWithResolvedValue: getElementsWithResolvedValue,
    init: init
  };
});

// This module serves as an interface for the document's fixed elements.
sitecues.define("page/highlight/fixed-elements", [ "page/positioner/constants", "page/positioner/style-lock/style-listener/style-listener", "run/util/array-utility", "mini-core/native-global" ], function(constants, styleListener, arrayUtil, nativeGlobal) {
  var docElem, fixedElements, doDisable = false, POINTER_SHEET_ID = "sitecues-js-disable-pointer-events", POINTER_ATTR = constants.POINTER_ATTR;
  function enableMouseEventsForElement(element) {
    element.removeAttribute(POINTER_ATTR);
  }
  function enableMouseEventsForAll() {
    doDisable = false;
    fixedElements.forEach(enableMouseEventsForElement);
  }
  function disableMouseEventsForElement(element) {
    element.setAttribute(POINTER_ATTR, "");
  }
  function disableMouseEventsForAll() {
    doDisable = true;
    fixedElements.forEach(disableMouseEventsForElement);
  }
  function get() {
    return arrayUtil.fromSet(fixedElements);
  }
  function has(element) {
    return fixedElements.has(element);
  }
  function add() {
    /*jshint validthis: true */
    var elements = Array.isArray(this) ? this : [ this ];
    elements.forEach(function(element) {
      fixedElements.add(element);
      if (doDisable) {
        disableMouseEventsForElement(element);
      }
    });
  }
  function remove() {
    /*jshint validthis: true */
    fixedElements.delete(this);
    if (doDisable) {
      enableMouseEventsForElement(this);
    }
  }
  function insertStylesheet() {
    var pointerSelector = "[" + POINTER_ATTR + "]", pointerDeclarationBlock = " { pointer-events: none; }", style = document.createElement("style");
    style.innerHTML = pointerSelector + pointerDeclarationBlock;
    style.id = POINTER_SHEET_ID;
    document.head.appendChild(style);
  }
  function init() {
    var declaration = {
      property: "position",
      value: "fixed"
    };
    docElem = document.documentElement;
    fixedElements = new Set();
    insertStylesheet();
    styleListener.init(function() {
      styleListener.registerToResolvedValueHandler(declaration, add);
      styleListener.registerFromResolvedValueHandler(declaration, remove);
      nativeGlobal.setTimeout(function() {
        add.call(styleListener.getElementsWithResolvedValue(declaration));
      }, 0);
    });
  }
  return {
    enableMouseEvents: enableMouseEventsForAll,
    disableMouseEvents: disableMouseEventsForAll,
    get: get,
    has: has,
    add: add,
    remove: remove,
    init: init
  };
});

sitecues.define("page/highlight/move-keys", [ "$", "page/highlight/highlight", "page/util/common", "page/highlight/pick", "page/zoom/util/body-geometry", "page/util/geo", "run/events", "page/highlight/fixed-elements", "mini-core/native-global", "run/inline-style/inline-style" ], function($, mh, common, picker, bodyGeo, geo, events, fixedElements, nativeGlobal, inlineStyle) {
  var // Helps us know whether it's the first repeat and therefore how much to delay
  isKeyRepeating, isInitialized, repeatDelayTimer, hlbElement, isKeyStillDown, lastMoveCommand, $lastPicked, STEP_SIZE_VERT = 18, STEP_SIZE_HORIZ = 24, // Different step sizes because content tends to be wider than tall (lines of text)
  SPREAD_STEP_SIZE = 32, // How quickly do we fan out in our point testing?
  // If this is too large, we will go diagonally too often. Too small and we miss stuff that's not quite in line
  SPREAD_SLOPE = .1, MAX_SPREAD = 200, PIXELS_TO_PAN_PER_MS_HIGHLIGHT = .3, PIXELS_TO_PAN_PER_MS_HLB_SEARCH = 2, PIXELS_TO_SCROLL_PER_MS_HLB = .1, // For highlight moves, it's hard to track a quickly moving highlight with your eyes
  // This is the delay before the first repeat
  HIGHLIGHT_MOVE_FIRST_REPEAT_DELAY_MS = 400, // For highlight moves, prevent one keystroke from acting like two
  // This is the delay before additional repeats
  HIGHLIGHT_MOVE_NEXT_REPEAT_DELAY_MS = 250, MAX_PIXELS_TO_PAN = 999, HEADING_TAGS = {
    h1: 1,
    h2: 1,
    h3: 1,
    h4: 1,
    h5: 1,
    h6: 1
  }, DO_SHOW_DEBUG_POINTS = false, MH_EXTRA_WIDTH = 10, // Amount to account for padding/border of mouse highlight
  isShowingDebugPoints = false, // Queue of key navigation command
  navQueue = [], // Approximate amount of time for one animation frame
  ONE_ANIMATION_FRAME_MS = 16, // 16ms is about 60fps
  // Method for animation
  requestFrame = window.requestAnimationFrame, isNavigationEnabled = true, // labs.isEnabled('arrowKeyNav'), // We no longer use labs here, it is on by default
  SAFE_ZONE = 30;
  // Begin scrolling when we get this close to window edge
  // Move the highlight in the direction requested
  // We start with a point in the middle of the highlight
  // Then move the point in the direction until we
  // are outside of the current highlight and we can pick something from that point.
  // Whenever the point gets close to the edge, we pan/scroll to bring up new content until we cant anymore.
  function queueKey(event, keyName) {
    if (isKeyStillDown) {
      return;
    }
    if (true) {
      $(".sc-debug-dots").remove();
    }
    navQueue.push({
      keyName: keyName,
      shiftKey: event.shiftKey
    });
    clearKeyRepeat();
    isKeyStillDown = true;
    // Assume it's down until it's let up
    if (1 === navQueue.length) {
      // Key was just pressed
      dequeueNextCommand();
    }
  }
  function clearKeyRepeat() {
    isKeyRepeating = false;
    isKeyStillDown = false;
    clearTimeout(repeatDelayTimer);
  }
  // Execute the next navigation command off the front of the queue
  function dequeueNextCommand() {
    var nextCommand = navQueue.shift();
    if (nextCommand) {
      lastMoveCommand = null;
      var keyName = nextCommand.keyName;
      // Non-movement command
      if ("space" === keyName) {
        onSpace(nextCommand.shiftKey);
      } else {
        if ("esc" === keyName) {
          onEscape(keyName);
        } else {
          lastMoveCommand = nextCommand;
          onMovementCommand(nextCommand);
        }
      }
    } else {
      mh.setScrollTracking(true);
    }
  }
  function onMovementCommand(nextMove) {
    // Movement command
    if (hlbElement && !nextMove.shiftKey && performHLBScroll(nextMove)) {
      return;
    }
    if (isNavigationEnabled) {
      performMovement(nextMove);
    }
  }
  // TODO Use bottoms of lines when scrolling down, so that the bottom of a line
  // matches with the bottom of the HLB
  function getHLBLineTops(currTop) {
    // Measure height of one line for first visible text node
    var nodeIterator = document.createNodeIterator(hlbElement, NodeFilter.SHOW_TEXT, null, false), range = document.createRange(), lineTops = [], hlbZoom = common.getComputedScale(hlbElement);
    while (true) {
      var rawClientRects, textNode = nodeIterator.nextNode(), index = 0;
      if (!textNode) {
        break;
      }
      range.selectNode(textNode);
      rawClientRects = range.getClientRects();
      for (;index < rawClientRects.length; index++) {
        // Add each rectangle with a top greater than the last
        var numLines = lineTops.length, lineTop = Math.floor(rawClientRects[index].top / hlbZoom) + currTop;
        if (0 === numLines || lineTop > lineTops[numLines - 1]) {
          lineTops[numLines] = lineTop;
        }
      }
    }
    return lineTops;
  }
  function getLineInRange(origTop, direction, seekStart, seekEnd) {
    var currTop, minSeek = Math.min(seekStart, seekEnd), maxSeek = Math.max(seekStart, seekEnd), lineTops = getHLBLineTops(origTop), numLines = lineTops.length, index = direction < 0 ? numLines - 1 : 0;
    for (;index >= 0 && index < numLines; index += direction) {
      currTop = lineTops[index];
      if (currTop >= minSeek && currTop < maxSeek) {
        return currTop;
      }
    }
    // No line top found -- go as far as allowed
    return seekEnd;
  }
  // Scroll HLB and return truthy value if a significant scroll occurred
  function performHLBScroll(nextMove) {
    var targetTop, startScrollTime, direction, SCROLL_KEYS = // Map key codes to scroll direction
    {
      up: {
        dir: -1,
        type: "line"
      },
      /* up */
      pageup: {
        dir: -1,
        type: "page"
      },
      /* pageup */
      home: {
        dir: -1,
        type: "doc"
      },
      /* home */
      down: {
        dir: 1,
        type: "line"
      },
      /* down */
      pagedn: {
        dir: 1,
        type: "page"
      },
      /* pagedown */
      end: {
        dir: 1,
        type: "doc"
      }
    }, keyEntry = SCROLL_KEYS[nextMove.keyName], origTop = hlbElement.scrollTop, // Where it's scrolled to now
    lastTop = origTop, // Where we want to scroll to
    hlbHeight = hlbElement.offsetHeight, FUZZ_FACTOR = 5, // Make sure we can scroll far enough in all browsers
    maxTop = Math.max(0, hlbElement.scrollHeight - hlbHeight + FUZZ_FACTOR), MIN_SCROLL = 5, MAX_SCROLL = 50;
    if (!keyEntry) {
      return;
    }
    direction = keyEntry.dir;
    switch (keyEntry.type) {
     case "page":
      // Pageup/pagedown default behavior always affect window/document scroll
      // (simultaneously with element's local scroll).
      // So prevent default and define new scroll logic.
      targetTop = getLineInRange(origTop, direction, origTop + .8 * hlbHeight * direction, direction < 0 ? 0 : maxTop);
      break;

     case "line":
      targetTop = getLineInRange(origTop, direction, origTop + MIN_SCROLL * direction, origTop + MAX_SCROLL * direction);
      break;

     case "doc":
      hlbElement.scrollTop = direction < 0 ? 0 : maxTop;
      dequeueNextCommand();
      return true;
    }
    function smoothScroll() {
      var isTargetReached, msElapsed = Date.now() - startScrollTime + ONE_ANIMATION_FRAME_MS, // How many pixels to scroll from the original start
      pixelsToScroll = msElapsed * PIXELS_TO_SCROLL_PER_MS_HLB, // Value to scroll to for this animation frame
      midAnimationTop = Math.floor(lastTop + direction * pixelsToScroll);
      if (lastTop !== midAnimationTop) {
        hlbElement.scrollTop = midAnimationTop;
        if (direction < 0 ? midAnimationTop <= targetTop : midAnimationTop >= targetTop) {
          isTargetReached = true;
        }
      }
      // Didn't move or target reached
      if (isTargetReached) {
        // Finished
        if (isKeyStillDown) {
          performHLBScroll(nextMove);
        }
      } else {
        requestFrame(smoothScroll);
      }
    }
    // Sanity constraints on scrolling request
    targetTop = Math.round(constrained(targetTop, 0, maxTop));
    if (Math.abs(targetTop - origTop) > MIN_SCROLL) {
      startScrollTime = Date.now();
      smoothScroll();
      return true;
    }
  }
  function getHighlight() {
    var highlight = mh.getHighlight();
    return highlight && (highlight.isVisible || hlbElement) && highlight;
  }
  function performMovement(nextMove) {
    if (!getHighlight()) {
      return;
    }
    prepareMovement();
    var type = nextMove.keyName, shiftKey = nextMove.shiftKey;
    switch (type) {
     case "up":
      moveInDirection(0, -1, shiftKey);
      break;

     case "down":
      moveInDirection(0, 1, shiftKey);
      break;

     case "left":
      moveInDirection(-1, 0, shiftKey);
      break;

     case "right":
      moveInDirection(1, 0, shiftKey);
      break;

     case "heading":
      moveByTagName(HEADING_TAGS, shiftKey);
      break;

     default:
      if (true) {
        console.log("Illegal command");
      }
    }
  }
  // Prepare movement by hiding existing HLB and fixed position content so they do not interfere with elementFromPoint()
  function prepareMovement() {
    // Hide current HLB so it doesn't interfere with getElementFromPoint
    if (hlbElement) {
      inlineStyle(hlbElement).display = "none";
    }
    fixedElements.disableMouseEvents();
    // Pre-require audio
    sitecues.require([ "audio/audio" ], function(audio) {
      audio.init();
    });
  }
  function fail(origPanX, origPanY) {
    // Don't process the rest of the command queue
    navQueue = [];
    // Restore mouse events and highlighting
    mh.setScrollTracking(true);
    fixedElements.enableMouseEvents();
    // Make lens visible again
    if (hlbElement) {
      inlineStyle(hlbElement).display = "block";
      // Scroll back to original position if the lens is now offscreen
      if ("number" === typeof origPanX) {
        var lensRect = hlbElement.getBoundingClientRect();
        if (lensRect.left < 0 && lensRect.right > window.innerWidth || lensRect.top < 0 || lensRect.bottom > window.innerHeight) {
          window.scrollTo(origPanX, origPanY);
        }
      }
    }
    // Play bonk sound
    sitecues.require([ "audio/audio" ], function(audio) {
      audio.playEarcon("bump");
    });
  }
  function speakHighlight() {
    sitecues.require([ "page/keys/commands" ], function(commands) {
      commands.speakHighlight();
    });
  }
  function succeed(doAllowRepeat, doSpeakText) {
    fixedElements.enableMouseEvents();
    if (doSpeakText) {
      speakHighlight();
    }
    if (hlbElement) {
      // Open new HLB
      if (true) {
        console.log("Retarget HLB");
      }
      retargetHLB();
    } else {
      if (doAllowRepeat && isKeyStillDown && lastMoveCommand) {
        // For movement, we need a delay between command, otherwise it can happen too fast
        var isFirstRepeat = !isKeyRepeating, repeatDelay = isFirstRepeat ? HIGHLIGHT_MOVE_FIRST_REPEAT_DELAY_MS : HIGHLIGHT_MOVE_NEXT_REPEAT_DELAY_MS;
        // Repeat last command if key is still pressed down
        isKeyRepeating = true;
        repeatDelayTimer = nativeGlobal.setTimeout(function() {
          onMovementCommand(lastMoveCommand);
        }, repeatDelay);
        return;
      }
    }
    dequeueNextCommand();
  }
  function moveInDirection(horizDir, vertDir, isShifted) {
    var // ** Panning state **
    // Starting pan time and location
    startPanTime, // Target end point for panning
    targetPanLeft, targetPanRight, targetPanUp, targetPanDown, lastPanX, lastPanY, highlight = getHighlight(), // *** Window size ***
    winRight = window.innerWidth - 1, winBottom = window.innerHeight - 1, // Farthest panning could possibly go
    maxPanUp = 0, maxPanLeft = bodyGeo.getBodyLeft(), maxPanRight = bodyGeo.getBodyRight() - winRight, maxPanDown = document.documentElement.scrollHeight - winBottom;
    updateLastPanXY();
    var doPickNewHighlight, // *** Highlight state ***
    origPanX = lastPanX, origPanY = lastPanY, origPickedRect = getHighlightRect(highlight, origPanX, origPanY), // *** Current position and direction of dot movement ***
    isHorizMovement = !vertDir, isVertMovement = !isHorizMovement, // x start point will be at the left edge, middle or right edge
    // depending on whether horizDir is -1, 0 or 1
    x = Math.floor(constrained(origPickedRect.left + (1 + horizDir) * origPickedRect.width / 2, 0, winRight)), // y start point will be at the top edge, middle or bottom edge
    // depending on whether vertDir is -1, 0 or 1
    y = Math.floor(constrained(origPickedRect.top + (1 + vertDir) * origPickedRect.height / 2, 0, winBottom)), // *** Spread state for dots as we go farther out (how it fans out) ****
    // The minimum size of a row (spread is how far from the center do to venture on that row)
    minSpread = Math.max((isHorizMovement ? origPickedRect.height : origPickedRect.width) / 2, SPREAD_STEP_SIZE + 1), // How many pixels from the original screen coordinate ar we?
    distanceFromOriginal = 0, // How many rows of points from the original aka how far from the original are we?
    numberOfDotRowsChecked = 0, // How fast to pan -- if HLB we want to pan immediately (better UX)
    pixelsToPanPerMs = hlbElement ? PIXELS_TO_PAN_PER_MS_HLB_SEARCH : PIXELS_TO_PAN_PER_MS_HIGHLIGHT;
    isShowingDebugPoints = DO_SHOW_DEBUG_POINTS && isShifted;
    // Show debugging dots if shift is pressed
    var doSpeakText = !isShowingDebugPoints && isShifted;
    $lastPicked = highlight.picked;
    function testPointIfOnscreen(x, y) {
      if (x < 0 || y < 0 || x > winRight || y > winBottom) {
        return null;
      }
      return testPoint(x, y, $lastPicked, "blue");
    }
    function testNextRowOfPointsAt(x, y, distance) {
      ++numberOfDotRowsChecked;
      var // Can we pick something from the center dot?
      $picked = testPoint(x, y, $lastPicked, "red"), // How far from center dot will we check?
      spreadEnd = constrained(distance * SPREAD_SLOPE, minSpread, MAX_SPREAD), // These are to enable the cross-hatch pattern that allows fewer points to be more effective
      toggleExtraY = 0, spreadStart = isHorizMovement ? SPREAD_STEP_SIZE * (numberOfDotRowsChecked % 2 ? .7 : 1.2) : SPREAD_STEP_SIZE;
      // Each iteration of this loop will test another dot on the current row of dots
      // spread out from the red center dot
      for (var spreadDistance = spreadStart; !$picked && spreadDistance < spreadEnd; spreadDistance += SPREAD_STEP_SIZE) {
        if (isVertMovement) {
          // Enable crosshatch pattern
          toggleExtraY = toggleExtraY ? 0 : SPREAD_STEP_SIZE / 2;
        }
        // Test dots in orthogonal directions from base direction of movement
        // Spreading out in a fan shape in the direction of travel
        $picked = testPointIfOnscreen(x - isVertMovement * spreadDistance, y - isHorizMovement * spreadDistance + toggleExtraY) || testPointIfOnscreen(x + isVertMovement * spreadDistance, y + isHorizMovement * spreadDistance + toggleExtraY);
      }
      if (!$picked) {
        return;
      }
      updateLastPanXY();
      if (isValidDirectionForNewHighlight(origPickedRect, $picked, origPanX, origPanY, lastPanX, lastPanY, horizDir, vertDir) && tryHighlight($picked)) {
        // Pan until highlight is fully visible onscreen (if necessary)
        var pickedRect = getHighlight().fixedContentRect;
        if (horizDir < 0 && pickedRect.left < SAFE_ZONE) {
          // Pan left far enough so that full width of the highlight is visible
          targetPanLeft = lastPanX + pickedRect.left - SAFE_ZONE;
        } else {
          if (horizDir > 0 && pickedRect.right > winRight - SAFE_ZONE) {
            // Pan right far enough so that full width of the highlight is visible
            targetPanRight = lastPanX + pickedRect.right - winRight + SAFE_ZONE;
          } else {
            if (vertDir < 0 && pickedRect.top < SAFE_ZONE) {
              // Pan up far enough so that the full height of the highlight is visible
              targetPanUp = lastPanY + pickedRect.top - SAFE_ZONE;
            } else {
              if (vertDir > 0 && pickedRect.bottom > winBottom - SAFE_ZONE) {
                targetPanDown = lastPanY + pickedRect.bottom - winBottom + SAFE_ZONE;
              } else {
                // No need to pan -- finish up
                succeed(!hlbElement, doSpeakText);
                return true;
              }
            }
          }
        }
        // Start final highlight panning after all other operations are finished
        startPanning(false);
        return true;
      }
    }
    function updateLastPanXY() {
      lastPanX = window.pageXOffset;
      lastPanY = window.pageYOffset;
    }
    function startPanning(isHighlightStillNeeded) {
      // Don't allow the mouse highlight to follow scroll events from keyboard panning
      mh.setScrollTracking(false);
      targetPanUp = Math.floor(constrained(targetPanUp, maxPanUp, maxPanDown));
      targetPanLeft = Math.floor(constrained(targetPanLeft, maxPanLeft, maxPanRight));
      targetPanRight = Math.floor(constrained(targetPanRight, maxPanLeft, maxPanRight));
      targetPanDown = Math.floor(constrained(targetPanDown, maxPanUp, maxPanDown));
      doPickNewHighlight = isHighlightStillNeeded;
      startPanTime = Date.now();
      // Turn mousemove-to-highlight off
      // so that the invisible mouse doesn't pick stuff moving underneath it
      panInDirection();
    }
    function isPanningTargetReached(panX, panY) {
      return horizDir < 0 && panX <= targetPanLeft || horizDir > 0 && panX >= targetPanRight || vertDir < 0 && panY <= targetPanUp || vertDir > 0 && panY >= targetPanDown;
    }
    function panInDirection() {
      // Check if there is anything more to pan to
      var msElapsed = Date.now() - startPanTime, pixelsToPan = msElapsed * pixelsToPanPerMs, attemptPanX = Math.floor(constrained(lastPanX + pixelsToPan * horizDir, targetPanLeft, targetPanRight)), attemptPanY = Math.floor(constrained(lastPanY + pixelsToPan * vertDir, targetPanUp, targetPanDown));
      // TODO can we find a way to disable the mouse pointer
      // without making scrolling jerkier? The problem is we need pointer-events for checking the highlight
      // Maybe we can put a fixed 1px thing right under the mouse that captures it?
      // Unfortunately, fixed position stuff doesn't work with zoom!
      // Perhaps we can do a row of dots
      window.scrollTo(attemptPanX, attemptPanY);
      // If we haven't found anything yet, check the next row of points
      if (doPickNewHighlight && testNextRowOfPointsAt(x - horizDir, y, distanceFromOriginal + pixelsToPan)) {
        // FOUND SOMETHING!
        return;
      }
      if (isPanningTargetReached(attemptPanX, attemptPanY)) {
        // THE TARGET HAS BEEN REACHED!
        if (doPickNewHighlight) {
          // Was not successful
          fail(origPanX, origPanY);
        } else {
          // Successful -- already had a highlight
          succeed(!hlbElement, doSpeakText);
        }
        return;
      }
      // Continue panning
      requestFrame(panInDirection);
    }
    // Go quickly through visible possibilities
    while (true) {
      var panX = 0, panY = 0;
      if (horizDir) {
        x += horizDir * STEP_SIZE_HORIZ;
        if (x < SAFE_ZONE) {
          panX = SAFE_ZONE - x;
        } else {
          if (x > winRight - SAFE_ZONE) {
            panX = winRight - SAFE_ZONE - x;
          }
        }
      } else {
        y += vertDir * STEP_SIZE_VERT;
        if (y < SAFE_ZONE) {
          panY = SAFE_ZONE - y;
        } else {
          if (y > winBottom - SAFE_ZONE) {
            panY = winBottom - SAFE_ZONE - y;
          }
        }
      }
      if (panX || panY) {
        // NO HIGHLIGHT FOUND ON VISIBLE SCREEN (Haven't panned yet though ...)
        // Reached the edge -- but we haven't found a highlight yet.
        // We need to begin panning to find a highlight
        x += panX;
        y += panY;
        // Panning too much is crazy. Give up after MAX_PIXELS_TO_PAN pixels.
        // User can keep arrowing in that direction if they want ... but don't autoscroll forever!
        targetPanUp = lastPanY - MAX_PIXELS_TO_PAN;
        targetPanLeft = lastPanX - MAX_PIXELS_TO_PAN;
        targetPanRight = lastPanX + MAX_PIXELS_TO_PAN;
        targetPanDown = lastPanY + MAX_PIXELS_TO_PAN;
        startPanning(true);
        break;
      }
      distanceFromOriginal += isHorizMovement ? STEP_SIZE_HORIZ : STEP_SIZE_VERT;
      if (testNextRowOfPointsAt(x, y, distanceFromOriginal)) {
        break;
      }
    }
  }
  // Ensure that the entire newly picked item's rect is in the correct direction
  // It may not be if the spread picks an object that covers a a large area
  function isValidDirectionForNewHighlight(origPickedRect, $picked, origPanX, origPanY, panX, panY, horizDir, vertDir) {
    var newRect = $picked[0].getBoundingClientRect(), FUZZ_FACTOR = 9;
    if (horizDir > 0) {
      // Correct move to the right?
      return newRect.left + panX + FUZZ_FACTOR > origPickedRect.right + origPanX;
    }
    if (horizDir < 0) {
      // Correct move to the left?
      return newRect.right + panX - FUZZ_FACTOR < origPickedRect.left + origPanX;
    }
    if (vertDir > 0) {
      // Correct move down?
      return newRect.top + panY + FUZZ_FACTOR > origPickedRect.bottom + origPanY;
    }
    // Correct move up?
    return newRect.bottom + panY - FUZZ_FACTOR < origPickedRect.top + origPanY;
  }
  // The current target that we might want to pick/highlight
  // is not an ancestor of the last picked item, or vice-versa
  function isValidTarget(target, $lastPicked) {
    if (!$lastPicked) {
      return !!target;
    }
    return target && !$lastPicked.is(target) && !$.contains(target, $lastPicked[0]) && !$.contains($lastPicked[0], target);
  }
  function testPoint(x, y, $lastPicked, color) {
    var target = document.elementFromPoint(x, y);
    if (true && isShowingDebugPoints) {
      // Briefly display the points being tested
      var debugDiv = $('<div class="sc-debug-dots">').appendTo("html");
      inlineStyle.set(debugDiv[0], {
        position: "absolute",
        left: x + window.pageXOffset + "px",
        top: y + window.pageYOffset + "px",
        width: "0px",
        height: "0px",
        outline: "3px solid " + color,
        zIndex: 999999
      });
    }
    // Need to use something that's not a container of the last picked item
    if (!isValidTarget(target, $lastPicked)) {
      return null;
    }
    var $picked = picker.find(target);
    if (!$picked || !isValidTarget($picked[0], $lastPicked)) {
      return null;
    }
    return $picked;
  }
  function tryHighlight($picked) {
    var doKeepHighlightHidden = !!hlbElement;
    return mh.highlight($picked, false, false, doKeepHighlightHidden);
  }
  function moveByTagName(acceptableTagsMap, isReverse) {
    var treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false), $lastPicked = getHighlight().picked;
    function doesMatchTags(element) {
      if (!acceptableTagsMap[element.localName]) {
        return;
      }
      if (!isValidTarget(element, $lastPicked)) {
        return;
      }
      var $picked = $(element);
      if (!$picked.text().trim()) {
        return;
      }
      element.scrollIntoView(true);
      if (!tryHighlight($picked)) {
        return;
      }
      if (!isValidTarget(getHighlight().picked[0], $lastPicked)) {
        return;
      }
      // Successful highlight
      return true;
    }
    function searchDocument() {
      while (true) {
        var newNode = isReverse ? treeWalker.previousNode() : treeWalker.nextNode();
        if (!newNode) {
          return false;
        }
        if (doesMatchTags(newNode)) {
          return true;
        }
      }
    }
    // Set the starting point (can do with tree walker but doesn't look like the similar node iterator API can do this)
    if ($lastPicked) {
      treeWalker.currentNode = $lastPicked[0];
    }
    if (!searchDocument()) {
      // Search one more time, from beginning instead of mid-point.
      // Wraps to beginning/end of document depending on direction.
      // This doesn't happen often so code here is optimized for size rather than speed.
      // Don't try to use H command to navigate headings in the fixed areas.
      treeWalker.currentNode = isReverse ? treeWalker.currentNode = $(document.body).find("*").last()[0] : document.body;
      if (!searchDocument()) {
        fail();
        return;
      }
    }
    // Adjust final scroll position so that highlight that it's not jammed against the top/left of window unless it needs to
    window.scrollBy(-100, -100);
    succeed();
  }
  function constrained(value, min, max) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }
  function getHighlightRect(highlight, pageOffsetX, pageOffsetY) {
    // First get the outline in absolute coordinates
    var outlineRect = geo.expandOrContractRect(highlight.absoluteRect, -MH_EXTRA_WIDTH);
    // Next subtract the current scroll position
    outlineRect.left -= pageOffsetX;
    outlineRect.right -= pageOffsetX;
    outlineRect.top -= pageOffsetY;
    outlineRect.bottom -= pageOffsetY;
    return outlineRect;
  }
  function toggleHLB() {
    sitecues.require([ "hlb/hlb" ], function(hlb) {
      hlb.toggleHLB(getHighlight());
    });
  }
  function retargetHLB() {
    sitecues.require([ "hlb/hlb" ], function(hlb) {
      // Nothing found .. close HLB and enable highlight on last known item
      hlb.retargetHLB(getHighlight());
    });
  }
  function onSpace(doSpeakText) {
    if (hlbElement || getHighlight()) {
      // Has an HLB or a highlight -- toggle HLB
      toggleHLB();
    } else {
      if (isNavigationEnabled) {
        // No highlight -- make one
        mh.autoPick();
      }
    }
    if (doSpeakText) {
      speakHighlight();
    }
  }
  function onEscape() {
    if (hlbElement) {
      toggleHLB();
    } else {
      // TODO next arrow key is still moving highlight
      // Probably the invisible mouse cursor is messing us up as well
      mh.hide(true);
      navQueue = [];
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    fixedElements.init();
    $(window).on("keyup", function() {
      clearTimeout(repeatDelayTimer);
      isKeyStillDown = false;
      isKeyRepeating = false;
    });
    events.on("hlb/did-create", function($hlb) {
      hlbElement = $hlb[0];
    });
    events.on("hlb/closed", function() {
      hlbElement = null;
    });
  }
  return {
    queueKey: queueKey,
    init: init
  };
});

sitecues.define("page/keys/commands", [ "page/zoom/zoom", "page/highlight/move-keys", "page/highlight/highlight", "page/reset/reset" ], function(zoomMod, moveKeys, mh, reset) {
  return {
    decreaseZoom: function(event) {
      zoomMod.init();
      zoomMod.beginZoomDecrease(event);
    },
    increaseZoom: function(event) {
      zoomMod.init();
      zoomMod.beginZoomIncrease(event);
    },
    stopZoom: function() {
      zoomMod.zoomStopRequested();
    },
    queueKey: function(event, keyName) {
      moveKeys.init();
      moveKeys.queueKey(event, keyName);
    },
    resetSitecues: function(event) {
      // 0 by itself -> reset zoom
      // Alt+0 -> Also reset speech
      // Alt+Shift+0 -> Full reset for all of sitecues, including themes, cursors, cues ... everything
      // Turn off zoom
      reset.resetZoom();
      if (event.altKey) {
        reset.resetAudio(function() {
          if (event.shiftKey) {
            reset.resetMinorSettings();
            sitecues.require([ "audio/audio" ], function(audio) {
              audio.playEarcon("quit-organ");
            });
          }
        });
      }
    },
    speakHighlight: function() {
      var highlight = mh.getHighlight();
      if (highlight) {
        sitecues.require([ "audio/audio" ], function(audio) {
          audio.init();
          audio.speakContent(highlight.picked);
        });
      }
    },
    stopAudio: function() {
      sitecues.require([ "audio/audio" ], function(audio) {
        audio.init();
        audio.stopAudio();
      });
    },
    toggleSpeech: function() {
      sitecues.require([ "audio/audio" ], function(audio) {
        audio.init();
        audio.toggleSpeech();
      });
    },
    notImplemented: function() {}
  };
});

sitecues.define("page/keys/keys", [ "page/util/element-classifier", "page/keys/commands", "run/metric/metric", "run/events", "page/highlight/constants", "run/constants", "mini-core/native-global" ], function(elemClassifier, commands, metric, events, HIGHLIGHT_CONST, CORE_CONST, nativeGlobal) {
  var wasOnlyShiftKeyDown, isStopSpeechKey, isHighlightVisible, isLensVisible, // Init called when sitecues turned on for the first time
  isAudioPlaying, isInitialized, didFireLastKeyInfoMetric, fakeKeyRepeatTimer, // KEY_TESTS defines keys used to bind actions to hotkeys.
  // The key tests return true if the correct key was pressed, the current focus
  // is not on an element that needs the key, and the sitecues state is appropriate).
  // 'Correct key' includes all key possible codes including alternate keys on the numeric keypad for +/-
  // and additional codes resulting from browser differences.
  // See http://www.javascripter.net/faq/keycodes.htm
  //
  // ** A key test should return true if the key is considered fired and valid **
  //
  // Note: for movement keys we also support the numeric keypad:
  // [7 Home ]  [ 8 Up ]  [9 PgUp  ]
  // [4 Left ]  [ 5    ]  [6 Right ]
  // [1 End  ]  [ 2 Dn ]  [3 PgDn  ]
  keyCode = CORE_CONST.KEY_CODE, ZOOM_IN_CODES = CORE_CONST.ZOOM_IN_CODES, ZOOM_OUT_CODES = CORE_CONST.ZOOM_OUT_CODES, HIGHLIGHT_TOGGLE_EVENT = HIGHLIGHT_CONST.HIGHLIGHT_TOGGLE_EVENT, isSitecuesOn = true, lastKeyInfo = {}, KEY_TESTS = {
    space: function(event) {
      var isUnmodifiedSpace = event.keyCode === keyCode.SPACE && !hasCommandModifier(event), isNeededByPage = elemClassifier.isSpacebarConsumer(event.target);
      return isUnmodifiedSpace && isSitecuesOn && !isNeededByPage;
    },
    minus: function(event) {
      // Test all of the possible minus keycodes, including from the numeric keypad
      if (ZOOM_OUT_CODES.indexOf(event.keyCode) > -1) {
        return canUseZoomKey(event);
      }
    },
    plus: function(event) {
      // Test all of the possible plus keycodes, including from the numeric keypad.
      // Also tests for equals (=) key, which is effectively an unmodified + key press
      if (ZOOM_IN_CODES.indexOf(event.keyCode) > -1) {
        return canUseZoomKey(event);
      }
    },
    hlbMinus: function(event) {
      // Test all of the possible minus keycodes, including from the numeric keypad
      if (ZOOM_OUT_CODES.indexOf(event.keyCode) > -1) {
        return isLensVisible && hasCommandModifier(event);
      }
    },
    hlbPlus: function(event) {
      // Test all of the possible plus keycodes, including from the numeric keypad.
      // Also tests for equals (=) key, which is effectively an unmodified + key press
      if (ZOOM_IN_CODES.indexOf(event.keyCode) > -1) {
        return isLensVisible && hasCommandModifier(event);
      }
    },
    reset: function(event) {
      // Ctrl+0, Cmd+0 or just 0 to reset zoom only, Alt+0 to reset zoom & speech, Alt+Shift+0 to reset all
      return event.keyCode === keyCode.NUMPAD_0 && (!elemClassifier.isEditable(event.target) || hasCommandModifier(event));
    },
    speech: function(event) {
      return event.keyCode === keyCode.QUOTE && event.altKey && !elemClassifier.isEditable(event.target);
    },
    esc: function(event) {
      // Escape key is only valid if there is an lens to close
      return event.keyCode === keyCode.ESCAPE && (isHighlightVisible || isLensVisible);
    },
    // For arrow keys, allow number pad usage as well (2/4/6/8)
    up: function(event) {
      return (event.keyCode === keyCode.UP || event.keyCode === keyCode.NUMPAD_8) && canMoveHighlight(event);
    },
    down: function(event) {
      return (event.keyCode === keyCode.DOWN || event.keyCode === keyCode.NUMPAD_2) && canMoveHighlight(event);
    },
    left: function(event) {
      return (event.keyCode === keyCode.LEFT || event.keyCode === keyCode.NUMPAD_4) && canMoveHighlight(event);
    },
    right: function(event) {
      return (event.keyCode === keyCode.RIGHT || event.keyCode === keyCode.NUMPAD_6) && canMoveHighlight(event);
    },
    heading: function(event) {
      return event.keyCode === keyCode.LETTER_H && !elemClassifier.isEditable(event.target) && !event.altKey && !event.ctrlKey && !event.metaKey;
    },
    pageup: function(event) {
      return (event.keyCode === keyCode.PAGE_UP || event.keyCode === keyCode.NUMPAD_9) && canScrollLens(event);
    },
    pagedn: function(event) {
      return (event.keyCode === keyCode.PAGE_DN || event.keyCode === keyCode.NUMPAD_3) && canScrollLens(event);
    },
    home: function(event) {
      // Also support cmd+up on Mac
      if (!canScrollLens(event)) {
        return false;
      }
      return event.keyCode === keyCode.HOME && !hasAnyModifier(event) || event.keyCode === keyCode.NUMPAD_7 || event.keyCode === keyCode.UP && event.metaKey;
    },
    end: function(event) {
      // Also support cmd+down on Mac
      if (!canScrollLens(event)) {
        return false;
      }
      return event.keyCode === keyCode.END && !hasAnyModifier(event) || event.keyCode === keyCode.NUMPAD_1 || event.keyCode === keyCode.DOWN && event.metaKey;
    },
    f8: function(event) {
      return event.keyCode === keyCode.F8 && !hasAnyModifier(event);
    }
  }, // define keys map used to bind actions to hotkeys
  KEY_EVENT_MAP = {
    minus: "decreaseZoom",
    plus: "increaseZoom",
    hlbMinus: "notImplemented",
    hlbPlus: "notImplemented",
    reset: "resetSitecues",
    speech: "toggleSpeech"
  }, KEY_EVENT_DEFAULT = "queueKey";
  function canMoveHighlight(event) {
    // Plain or shifted keystroke
    // Visible highlight or HLB
    return !hasCommandModifier(event) && (isHighlightVisible || isLensVisible) && !elemClassifier.isEditable(event.target);
  }
  function canScrollLens(event) {
    return isLensVisible && !elemClassifier.isEditable(event.target);
  }
  function canUseZoomKey(event) {
    // Minus/plus cannot trigger if there is a lens
    if (isLensVisible) {
      return;
    }
    // If modified (ctrl/cmd/etc.), then the minus/plus command can be used no matter what is focused,
    // because it is not being used to type '-'
    if (hasCommandModifier(event)) {
      return true;
    }
    // Plain minus/plus was pressed without a modifier -- the command is only valid if we're not in an editable field
    // (which needs to allow the user to type the minus/plus key)
    return !elemClassifier.isEditable(event.target);
  }
  // Non-shift modifier keys (ctrl, cmd, alt)
  function hasCommandModifier(event) {
    return event.altKey || event.ctrlKey || event.metaKey;
  }
  // Any modifer key, including shift
  function hasAnyModifier(event) {
    return event.shiftKey || hasCommandModifier(event);
  }
  // Handle key
  function handle(commandName, event, keyName) {
    // Prevent default behavior of key. The browser listens to these events
    // and does not execute command based on the key pressed
    // (such as spacebar to page down, cmd+plus to zoom, arrow key to scroll, shift+arrow to select)
    event.preventDefault();
    // Keeps the rest of the handlers from being executed and prevents the event from bubbling up the DOM tree.
    // It's nother layer of protection. Here's why we need it even though web browsers respect the defaultPrevented flag.
    // Scripts generally do not look at that flag. If they get a key, they just consume it.
    // Therefore, if the user is focused on a JS widget, such as a
    // <div onkeydown="..."/>, there is the possibility that both sitecues and the widget would handle the key.
    // Examples:
    // - spacebar in a button
    // - plus or minus key in a tree view or map (for zoom)
    // Spacebar is probably the most likely, but as we start handling other keys such
    // as arrows, we need to be careful. We could either decide which keys that we consume
    // need stopImmediatePropagation, or just do it always to be safe.
    event.stopImmediatePropagation();
    executeCommand(event, commandName, keyName);
  }
  function executeCommand(event, commandName, keyName) {
    // Emit event defined for key
    commands[commandName](event, keyName);
    // Ready metric info to be fired during keyup
    var isDifferentKey = lastKeyInfo.keyName !== keyName;
    if (isDifferentKey) {
      // Different key from last time -- fire no matter what
      didFireLastKeyInfoMetric = false;
      lastKeyInfo = {
        keyName: keyName,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        repeatCount: 0
      };
    } else {
      // Same key
      ++lastKeyInfo.repeatCount;
    }
  }
  // key event hook
  function onKeyDown(event) {
    // Shift key gets additional processing before other keys
    preProcessKeyDown(event);
    if (event.defaultPrevented) {
      return;
    }
    processKey(event);
  }
  function processKey(event) {
    // iterate over key map
    for (var key in KEY_TESTS) {
      if (KEY_TESTS.hasOwnProperty(key) && KEY_TESTS[key](event)) {
        handle(KEY_EVENT_MAP[key] || KEY_EVENT_DEFAULT, event, key);
        notifySitecuesKeyDown(true);
        return key;
      }
    }
    // All other keys will fall through to default processing
    // Don't allow panning via arrow or other scroll keys to accidentally activate highlighting.
    // This happens when the panning causes the mouse on the screen to go over new content, firing a mouseover event.
    notifySitecuesKeyDown(false);
  }
  function onKeyUp(event) {
    notifySitecuesKeyDown(true);
    if (event.keyCode === keyCode.SHIFT) {
      if (isBeginSpeechCommand()) {
        commands.speakHighlight();
      }
    }
    // Once the shift key is up, we clear the any key down flag.
    // This is a simple approach that handles all except very weird key behavior
    // such as shift up down up all while another key is pressed.
    isStopSpeechKey = false;
    wasOnlyShiftKeyDown = false;
    emitOnlyShiftStatus();
    fireLastCommandMetric();
  }
  function fireLastCommandMetric() {
    if (!didFireLastKeyInfoMetric && lastKeyInfo.keyName) {
      // Fire key metric, but only if it wasn't fired for this key yet (we don't fire multiple events for key repeats)
      new metric.KeyCommand(lastKeyInfo).send();
      didFireLastKeyInfoMetric = true;
    }
    clearTimeout(fakeKeyRepeatTimer);
    fakeKeyRepeatTimer = nativeGlobal.setTimeout(function() {
      // If the next key is the same and occurs quickly after the last keyup, it will be considered a key repeat,
      // because some configurations on Windows seem to fire multiple keyups and keydowns for key repeats
      // Once this timer fires, we clear a flag that allows even the same key to be fired as a new metric
      didFireLastKeyInfoMetric = false;
      lastKeyInfo = {};
    }, CORE_CONST.MIN_TIME_BETWEEN_KEYS);
  }
  // Track to find out whether the shift key is pressed by itself
  function emitOnlyShiftStatus() {
    events.emit("key/only-shift", wasOnlyShiftKeyDown);
  }
  function isBeginSpeechCommand() {
    return wasOnlyShiftKeyDown && !isStopSpeechKey;
  }
  // If shift key down, process it
  function preProcessKeyDown(event) {
    var isShift = event.keyCode === keyCode.SHIFT;
    if (!isShift || isAudioPlaying) {
      // Key down stops speech/audio
      // Exception is repeated shift key, which also starts speech when shift is held down
      commands.stopAudio();
      isStopSpeechKey = true;
    }
    wasOnlyShiftKeyDown = isShift;
    emitOnlyShiftStatus();
  }
  function notifySitecuesKeyDown(isFollowMouseEnabled) {
    events.emit("keys/sitecues-key-down", isFollowMouseEnabled);
  }
  function init(keyEvent, isKeyAlreadyReleased) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // bind key hook to window
    // 3rd param changes event order: false == bubbling; true = capturing.
    // We use capturing because we want to get the key before anything else does --
    // this allows us to have the first choice, and we can preventDefault on it so that
    // nothing else uses it after us.
    addEventListener("keydown", onKeyDown, true);
    // Will reenable highlight on mouse follow
    addEventListener("keyup", onKeyUp, true);
    events.on(HIGHLIGHT_TOGGLE_EVENT, function(isVisible) {
      isHighlightVisible = isVisible;
    });
    events.on("hlb/did-create", function() {
      isLensVisible = true;
    });
    events.on("hlb/closed", function() {
      isLensVisible = false;
    });
    events.on("sitecues/did-toggle", function(isOn) {
      isSitecuesOn = isOn;
    });
    events.on("audio/did-toggle", function(isOn) {
      isAudioPlaying = isOn;
    });
    if (keyEvent) {
      var executedKey = processKey(keyEvent);
      if (isKeyAlreadyReleased && ("minus" === executedKey || "plus" === executedKey)) {
        // If zoom key was released before zoom module was listening for keyup, make sure we stop zoom
        // This can happen when the key was captured before the keys/zoom module were requested,
        // and released before they finished loading/initializing.
        commands.stopZoom();
      }
    }
    events.emit("keys/did-init");
  }
  return {
    init: init
  };
});

sitecues.define("page/hpan/hpan", [ "page/zoom/util/body-geometry", "run/events", "page/viewport/viewport", "run/dom-events", "page/zoom/zoom" ], function(bodyGeo, events, viewport, domEvents, zoomMod) {
  var isListeningToResize, xLastPos, isOn = false, isHlbOn = false, isPanelOpen = false, isZooming = false, MIN_EDGE_PORTION = .1, MAX_EDGE_PORTION = .25, SPEED_FACTOR = 4, MAX_SPEED = 100;
  // get dependencies
  function mousemove(evt) {
    var // Get direction to pan, or return if mouse too near center of screen to cause panning
    direction, // Amount of horizontal mouse movement
    movementX = getBackfillMovementX(evt), // Right side of body in absolute coordinates
    bodyRight = bodyGeo.getBodyRight(), pageXOffset = viewport.getPageXOffset(), // Width of window
    winWidth = viewport.getInnerWidth(), // Amount of content that didn't fit in the window
    ratioContentToWindowWidth = bodyRight / winWidth, // Amount of edge to use for panning
    edgePortion = Math.max(Math.min(ratioContentToWindowWidth / 2 - .55, MAX_EDGE_PORTION), MIN_EDGE_PORTION), edgeSize = winWidth * edgePortion;
    if (evt.clientX < edgeSize && movementX < 0) {
      direction = -1;
    } else {
      if (evt.clientX > winWidth - edgeSize && movementX > 0) {
        direction = 1;
      } else {
        return;
      }
    }
    var // How far into the panning zone are we?
    pixelsUntilMouseAtWindowEdge = 1 === direction ? winWidth - evt.clientX : evt.clientX, pixelsIntoPanningZone = edgeSize - pixelsUntilMouseAtWindowEdge, percentageIntoPanningZone = pixelsIntoPanningZone / edgeSize, // .5 = 50%, 1 = 100%, etc.
    // How much to boost mouse movement?
    // Factor in how much more content there is than can fit in the window
    // Factor in how far into the panning zone we are, so it accelerates as we get toward edge
    // (sort of a magic formula developed through tinkering, which seems to work nicely)
    extraMovement = Math.max(.5, (ratioContentToWindowWidth - .3) * SPEED_FACTOR * (percentageIntoPanningZone + .5)), // How far can we move until we reach the right edge of the visible content
    maxMovementUntilRightEdge = bodyRight - winWidth - pageXOffset, // Calculate movement size: amount of mouse movement + extraMovement
    movementSize = Math.min(Math.round(Math.abs(movementX) * extraMovement), MAX_SPEED), // Finally, calculate the total movement -- do not allow move past right or left edge
    movement = Math.min(direction * movementSize, maxMovementUntilRightEdge);
    movement = Math.max(movement, -pageXOffset);
    // Scroll it
    if (movement >= 1 || movement <= -1) {
      window.scrollBy(movement, 0);
    }
  }
  function getBackfillMovementX(evt) {
    var movementX = evt.movementX;
    if ("undefined" !== typeof movementX) {
      return movementX;
    }
    movementX = evt.mozMovementX;
    if ("undefined" !== typeof movementX) {
      return movementX;
    }
    movementX = evt.webkitMovementX;
    if ("undefined" !== typeof movementX) {
      return movementX;
    }
    // Does not require new browser capabilities, but not quite as smooth
    movementX = "undefined" === typeof xLastPos ? 0 : evt.clientX - xLastPos;
    xLastPos = evt.clientX;
    return movementX;
  }
  function onZoomBegin() {
    isZooming = true;
  }
  function onZoomChange(zoomLevel) {
    if (zoomLevel > 1 && !isListeningToResize) {
      isListeningToResize = true;
      events.on("resize", refresh);
    }
    isZooming = false;
    refresh();
  }
  function getZoom() {
    return zoomMod.getCompletedZoom() || 1;
  }
  function refresh() {
    // Turn on if zoom is > 1 and content overflows window more than a tiny amount
    var zoom = getZoom(), doTurnOn = zoom > 1 && bodyGeo.getBodyRight() / viewport.getInnerWidth() > 1.02 && !isHlbOn && !isPanelOpen && !isZooming;
    if (doTurnOn !== isOn) {
      if (doTurnOn) {
        domEvents.on(document, "mousemove", mousemove);
      } else {
        domEvents.off(document, "mousemove", mousemove);
        xLastPos = void 0;
      }
    }
    isOn = doTurnOn;
  }
  function init() {
    events.on("hlb/ready", function() {
      isHlbOn = true;
      refresh();
    });
    events.on("hlb/closed", function() {
      isHlbOn = false;
      refresh();
    });
    // Dont pan while the bp is expanded.
    events.on("bp/will-expand", function() {
      isPanelOpen = true;
      refresh();
    });
    // Allow panning while the bp is shrunk.
    events.on("bp/did-shrink", function() {
      isPanelOpen = false;
      refresh();
    });
    events.on("zoom/begin", onZoomBegin);
    // react on any zoom change
    events.on("zoom", onZoomChange);
    onZoomChange(getZoom());
  }
  return {
    init: init
  };
});

/*
* Style-Lock
*
* The style-lock gets elements mutating to certain style values, and 'locks' that value by applying a data attribute
* tied to a rule applying the current style value with importance. Handlers are run before and after allowing the
* style mutation to take effect.
* e.g.
* We request position: fixed styles to be locked
* All elements currently styled with position: fixed are returned by the style listener, and data-sc-lock-position='fixed' is set on each
* Subsequently when an element is dynamically unfixed, attached handlers can run before and after the style has been resolved
*
* */
sitecues.define("page/positioner/style-lock/style-lock", [ "page/positioner/style-lock/style-listener/style-listener", "page/positioner/constants", "run/constants", "page/positioner/util/element-info", "mini-core/native-global" ], function(styleListener, constants, coreConstants, elementInfo, nativeGlobal) {
  var stylesheet, noop = function() {}, elementHandlerMap = new WeakMap(), declarationHandlerMap = {}, initCallbacks = [], lockSelectorMap = {}, stylesheetId = "sitecues-js-locked-styles", LOCK_ATTR = constants.LOCK_ATTR, READY_STATE = coreConstants.READY_STATE, readyState = READY_STATE.UNINITIALIZED;
  // This function is the entry point for the module. Depending on the arguments passed to the function, it will either
  // lock a single element's resolved property value, or lock all elements in the document matching a given resolved declaration
  function lock() {
    var args = Array.prototype.slice.call(arguments, 0), arg1 = args[0];
    // Three arguments means an element is meant to be locked
    if (null === typeof arg1 || arg1.nodeType === Node.ELEMENT_NODE) {
      lockElementProperty.apply(null, args);
    } else {
      lockResolvedDeclaration.apply(null, args);
    }
  }
  // The handlers are run before and after the property's resolved value mutates
  function lockElementProperty(element, property, handlers) {
    handlers = handlers || {};
    styleListener.init(function() {
      function onPropertyMutation(opts) {
        /*jshint validthis: true */
        var value = opts.toValue, results = [], elementHandlers = elementHandlerMap.get(this), propertyHandlers = elementHandlers[opts.property], beforeHandlers = propertyHandlers.before, afterHandlers = propertyHandlers.after;
        for (var i = 0, beforeCount = beforeHandlers.length; i < beforeCount; i++) {
          results.push(beforeHandlers[i].call(this, opts));
        }
        lockStyle(this, property, value);
        for (var j = 0, afterCount = afterHandlers.length; j < afterCount; j++) {
          afterHandlers[j].call(this, results[j]);
        }
      }
      var before = handlers.before || noop, after = handlers.after || noop, currentValue = getComputedStyle(element)[property], declaration = {
        property: property,
        value: currentValue
      }, elementHandlers = elementHandlerMap.get(element) || {}, propertyHandlers = elementHandlers[property];
      if (propertyHandlers) {
        propertyHandlers.before.push(before);
        propertyHandlers.after.push(after);
      } else {
        elementHandlers[property] = {
          after: [ after ],
          before: [ before ]
        };
      }
      elementHandlerMap.set(element, elementHandlers);
      lockStyle(element, property, currentValue);
      styleListener.registerPropertyMutationHandler(element, declaration, onPropertyMutation);
    });
  }
  // Before and after handlers will run respectively before and after a non-sitecues element's resolved style value mutates
  // to or from the declaration
  // The initial handler will run when we identify elements with a resolved value matching the declaration
  function lockResolvedDeclaration(declaration, handlers) {
    handlers = handlers || {};
    styleListener.init(function() {
      var initial = handlers.initial || noop, before = handlers.before || noop, after = handlers.after || noop, property = declaration.property, value = declaration.value, key = getDeclarationKey(declaration);
      function isValidLockTarget(element) {
        return !elementInfo.isSitecuesElement(element);
      }
      function fromHandler(args) {
        /*jshint validthis: true */
        if (isValidLockTarget(this)) {
          var results = [], property = args.property, value = args.fromValue, key = property + "_" + value, handlers = declarationHandlerMap[key];
          var beforeHandlers = handlers.before, afterHandlers = handlers.after;
          for (var i = 0, beforeCount = beforeHandlers.length; i < beforeCount; i++) {
            results.push(beforeHandlers[i].call(this, args));
          }
          unlockStyle(this, property);
          for (var j = 0, afterCount = afterHandlers.length; j < afterCount; j++) {
            afterHandlers[j].call(this, results[j]);
          }
        }
      }
      function toHandler(args) {
        /*jshint validthis: true */
        if (isValidLockTarget(this)) {
          var property = args.property, value = args.toValue, key = property + "_" + value, initialHandlers = declarationHandlerMap[key].initial;
          lockStyle(this, property, value);
          for (var i = 0, initialCount = initialHandlers.length; i < initialCount; i++) {
            initialHandlers[i].call(this, args);
          }
        }
      }
      var declarationHandlers = declarationHandlerMap[key];
      if (declarationHandlers) {
        // We're already listening for when elements lose or gain this resolved style value, add additional handlers
        declarationHandlers.before.push(before);
        declarationHandlers.after.push(after);
        declarationHandlers.initial.push(initial);
      } else {
        declarationHandlerMap[key] = {
          before: [ before ],
          after: [ after ],
          initial: [ initial ]
        };
        styleListener.registerToResolvedValueHandler(declaration, toHandler);
        styleListener.registerFromResolvedValueHandler(declaration, fromHandler);
      }
      // We run this asynchronously because it is an expensive operation
      // and we want to allow the browser to run other events before we begin it
      nativeGlobal.setTimeout(function() {
        var elements = styleListener.getElementsWithResolvedValue(declaration);
        function runHandler(element) {
          toHandler.call(element, {
            toValue: value,
            property: property
          });
        }
        for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
          if (initial !== noop) {
            // Likewise each initial handler call is potentially expensive if we have to transplant the target
            nativeGlobal.setTimeout(runHandler, 0, elements[i]);
          } else {
            lockStyle(elements[i], property, value);
          }
        }
      }, 0);
    });
  }
  function getDeclarationKey(declaration) {
    return declaration.property + "_" + declaration.value;
  }
  function lockStyle(element, property, value) {
    var attributeName = LOCK_ATTR + property, valueLocks = lockSelectorMap[attributeName] || {}, lockSelector = valueLocks[value];
    if (!lockSelector) {
      lockSelector = "[" + attributeName + '="' + value + '"]';
      appendStylesheet(lockSelector + " { " + property + ": " + value + " !important; }\n");
      valueLocks[value] = lockSelector;
      lockSelectorMap[attributeName] = valueLocks;
    }
    element.setAttribute(attributeName, value);
  }
  function unlockStyle(element, property) {
    function removeLock(element, attribute) {
      element.removeAttribute(attribute);
    }
    // Remove all of the style locks for @element
    // if @property is undefined
    if (!property) {
      var attributes = Object.keys(lockSelectorMap);
      attributes.forEach(function(attribute) {
        removeLock(element, attribute);
      });
      return;
    }
    var lockAttribute = LOCK_ATTR + property;
    // If @element and @property are defined, remove the property lock from @element
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      removeLock(element, lockAttribute);
      return;
    }
    // If @element is undefined, unlock all elements with @property locks
    var propertyLockSelector = "[" + lockAttribute + "]", elements = document.querySelectorAll(propertyLockSelector);
    for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
      removeLock(elements[i], lockAttribute);
    }
  }
  function insertStylesheet(css) {
    stylesheet = document.createElement("style");
    stylesheet.id = stylesheetId;
    stylesheet.textContent = css;
    document.head.appendChild(stylesheet);
  }
  function appendStylesheet(css) {
    if (!stylesheet) {
      insertStylesheet(css);
    } else {
      stylesheet.textContent += css;
    }
  }
  function executeCallbacks() {
    initCallbacks.forEach(function(callback) {
      callback();
    });
    initCallbacks = null;
  }
  function init(callback) {
    switch (readyState) {
     case READY_STATE.UNINITIALIZED:
      initCallbacks.push(callback);
      readyState = READY_STATE.INITIALIZING;
      styleListener.init(function() {
        readyState = READY_STATE.COMPLETE;
        executeCallbacks();
      });
      break;

     case READY_STATE.INITIALIZING:
      initCallbacks.push(callback);
      break;

     case READY_STATE.COMPLETE:
      callback();
    }
  }
  lock.init = init;
  lock.unlockStyle = unlockStyle;
  return lock;
});

/**
 * clone
 *
 * Can clone a generation, a subtree or an element
 * Does not need to copy element-map data because you will never have any for uncloned elements.
 *
 * TODO add ascii art comment
 */
sitecues.define("page/positioner/transplant/clone", [ "$", "page/positioner/util/element-map", "page/positioner/util/element-info", "page/positioner/style-lock/style-lock", "page/positioner/constants", "page/viewport/viewport", "run/inline-style/inline-style" ], function($, elementMap, elementInfo, styleLock, constants, viewport, inlineStyle) {
  var docElem, originalBody, auxiliaryBody;
  function clone(target, opts) {
    opts = opts || {};
    var resultWrapper = {}, // Aliases for the shorter options names at the call site
    wordyOpts = {};
    // Is @target a transplant root
    // We cache this information in the element map for each element in its subtree
    wordyOpts.isRoot = opts.isRoot;
    // Defined if @target is nested in the subtree of an ancestor transplant root
    wordyOpts.superRoot = opts.superRoot;
    // Do not clone @target
    wordyOpts.doExcludeTargetElement = opts.excludeTarget;
    // An element's heredity structure is:
    // 1. The sibling elements of @target
    // 2. Each of @target's ancestor elements until the body, and all of their siblings
    wordyOpts.doCloneHeredityStructure = opts.heredityStructure;
    // Insert @target into its clone's position in the heredity structure
    wordyOpts.doInsertTargetIntoCloneTree = opts.insertTargetIntoCloneTree;
    // Return a reference to the nearest ancestor clone of the target
    // That's probably where we want to insert the heredity tree
    // We save a little work with this option, because we already need to find it when cloning heredityStructure from the body
    wordyOpts.doGetNearestAncestorClone = opts.getNearestAncestorClone;
    if (!wordyOpts.doExcludeTargetElement) {
      resultWrapper.clone = cloneElement(target, wordyOpts);
    }
    if (wordyOpts.doCloneHeredityStructure) {
      var results = cloneHeredityStructure(target, wordyOpts);
      resultWrapper.heredityStructure = results.heredityStructure;
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
      var isCloned, ancestor = element, ancestors = [];
      do {
        ancestor = ancestor.parentElement;
        isCloned = Boolean(getComplement(ancestor));
        ancestors.push(ancestor);
      } while (!isCloned && ancestor !== originalBody);
      return ancestors;
    }
    var container, nearestAncestorClone, ancestorsToWalk = getAncestorsToWalk(target), nearestClonedAncestor = ancestorsToWalk[ancestorsToWalk.length - 1], ancestorCount = ancestorsToWalk.length, originalInChain = target, // As an optimization we can insert the target into the clone heredityStructure, typically because we are trying to insert a fixed element
    // into the auxiliary body with the clone heredityStructure in place to catch inherited styles
    cloneInChain = opts.doInsertTargetIntoCloneTree ? target : cloneElement(target);
    for (var i = 0; i < ancestorCount; i++) {
      var ancestorClone, ancestor = ancestorsToWalk[i], children = Array.prototype.slice.call(ancestor.children, 0), generationFragment = document.createDocumentFragment(), isAncestorCloned = ancestor === nearestClonedAncestor, childrenCount = children.length;
      if (isAncestorCloned) {
        ancestorClone = ancestor === originalBody ? getAuxiliaryBody() : getComplement(ancestor);
        nearestAncestorClone = ancestorClone;
      } else {
        ancestorClone = cloneElement(ancestor);
      }
      for (var j = 0; j < childrenCount; j++) {
        var originalChild = children[j];
        // We've already cloned this child, because in the previous iteration we cloned
        // and appended its children to it, so now we just need to append the existing clone
        if (originalChild === originalInChain) {
          generationFragment.appendChild(cloneInChain);
        } else {
          generationFragment.appendChild(cloneElement(originalChild));
        }
      }
      if (isAncestorCloned) {
        container = generationFragment;
      } else {
        // If the ancestor is newly cloned, we know that the clone isn't inserted into the document
        ancestorClone.appendChild(generationFragment);
      }
      originalInChain = ancestor;
      cloneInChain = ancestorClone;
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
    var len, i, // If @element should be considered the root element for its subtree
    isRoot = opts.isRoot, // The closest ancestor root of @element
    superRoot = opts.superRoot, clone = element.cloneNode(), $element = $(element), $clone = $(clone), traitFields = [ "complement", "isRoot" ], traitValues = [ clone, isRoot ], tagName = element.localName;
    switch (tagName) {
     case "script":
      // This prevents clone script tags from running when we insert them into the DOM
      clone.type = "application/json";
      break;

     case "video":
      // This prevents clone video elements from playing
      clone.pause();
      clone.src = "";
      clone.load();
      break;

     case "link":
      // Don't reload link tags
      clone.href = "";
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
    var $badgeClone = $clone.find("#sitecues-badge");
    if ($badgeClone.get().length) {
      var $sitecuesCloneSet = $badgeClone.find("*").addBack(), sitecuesSet = $sitecuesCloneSet.add($element.find("#sitecues-badge").find("*").addBack()).get();
      len = sitecuesSet.length;
      for (i = 0; i < len; i++) {
        elementMap.setField(sitecuesSet[i], [ "complement", "isClone" ], [ null, null ]);
      }
      $sitecuesCloneSet.attr("id", "").attr("class", "");
    }
    // We don't want clone elements to be visible
    clone.removeAttribute(constants.ROOT_ATTR);
    // Remove all the style-locks from the clone element
    styleLock.unlockStyle(clone);
    elementMap.setField(element, traitFields, traitValues);
    elementMap.setField(clone, [ "isClone", "complement" ], [ true, element ]);
    return clone;
  }
  // Returns the clone of an original element, or the original element of a clone
  function getComplement(element) {
    return elementMap.getField(element, "complement");
  }
  function getAuxiliaryBody() {
    if (!auxiliaryBody) {
      auxiliaryBody = cloneElement(originalBody);
      // Removes position lock from clone
      styleLock.unlockStyle(auxiliaryBody);
      var bodyStyle = inlineStyle(auxiliaryBody);
      // Strange bug, don't really understand it, but visible elements nested in hidden elements don't show up as
      // expected when the original body has overflowY set to scroll (reproduces on Desire To Learn)
      bodyStyle.visibility = "scroll" === getComputedStyle(originalBody).overflowY ? "" : "hidden";
      bodyStyle.transform = "none";
      bodyStyle.pointerEvents = "";
      bodyStyle.position = "absolute";
      bodyStyle.top = 0;
      bodyStyle.height = viewport.getInnerHeight();
      bodyStyle.width = viewport.getInnerWidth();
      docElem.appendChild(auxiliaryBody);
    }
    return auxiliaryBody;
  }
  function init() {
    docElem = document.documentElement;
    originalBody = document.body;
  }
  clone.init = init;
  clone.get = getComplement;
  clone.getAuxiliaryBody = getAuxiliaryBody;
  return clone;
});

/*
* Graft
*
* The purpose of the graft module is to prevent 'transplant rejection', i.e. when a transplant root is replanted into the original body by an outside
* script. Graft attaches an observer to each transplant root's parent element, and listens for node removals. The handler then correctly
* returns the transplant root to its position in the auxiliary body.
*
* This is only an issue on inhomecare currently
* */
sitecues.define("page/positioner/transplant/graft", [ "page/positioner/util/element-map", "page/positioner/util/element-info", "page/positioner/transplant/clone" ], function(elementMap, elementInfo, clone) {
  var originalBody, rejectionListenerMap;
  function implantNodeStructure(element, parent, sibling) {
    if (sibling) {
      parent.insertBefore(element, sibling);
    } else {
      parent.appendChild(element);
    }
  }
  // This function listens for removed roots, if we haven't set a flag indicating we're replanting the root somewhere else in the DOM
  // it will return the root to the auxiliary body. If the root has been replanted to a new location in the original body
  // from where it was transplanted from, transplant it into the auxiliary body at the complementary position
  function onTransplantRejection(mutations) {
    function replantNode(node) {
      /* jshint validthis: true */
      var isRoot = elementInfo.isTransplantRoot(node), wasReplanted = elementMap.flushField(node, "wasReplanted");
      // If we didn't remove this root intentionally, it's been removed by another script and we need to re-implant it
      if (!wasReplanted && isRoot) {
        var newParent = node.parentElement, inAuxBody = newParent && !elementInfo.isInOriginalBody(newParent), cloneParent = newParent && clone.get(newParent), newSibling = node.nextSibling, cloneSibling = newSibling && clone.get(newSibling);
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
        } else {
          if (!inAuxBody && cloneParent) {
            graftToAuxiliaryBody({
              root: node,
              parent: cloneParent,
              sibling: cloneSibling,
              handleTransplantRejection: true
            });
          } else {
            if (inAuxBody) {
              graftToAuxiliaryBody({
                root: node,
                parent: newParent,
                sibling: newSibling,
                handleTransplantRejection: true
              });
            }
          }
        }
      }
    }
    for (var i = 0, mutationCount = mutations.length; i < mutationCount; i++) {
      var mutation = mutations[i], removedNodes = Array.prototype.slice.call(mutation.removedNodes, 0);
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
    } else {
      observer.disconnect();
    }
    observer.observe(target.parentElement, {
      childList: true
    });
  }
  function graftToBody(opts) {
    var // The insertion target is either the root itself, or the top of its node structure
    insertionTarget = opts.insertionTarget || opts.root, root = opts.root, sibling = opts.sibling, parent = opts.parent, hostBody = opts.hostBody;
    elementInfo.setHostBody(root, hostBody);
    elementMap.setField(root, "transplantParent", parent);
    elementMap.setField(root, "transplantSibling", sibling);
    implantNodeStructure(insertionTarget, parent, sibling);
  }
  function graftToOriginalBody(opts) {
    opts.hostBody = originalBody;
    graftToBody(opts);
  }
  function graftToAuxiliaryBody(opts) {
    opts.hostBody = clone.getAuxiliaryBody();
    graftToBody(opts);
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

/*
 * Mutation Relay
 *
 * This module is responsible for copying attribute changes from original elements to clone elements.
 * NOTE: This module currently only copies class mutations, other mutations can be monitored for and copied over as necessary
 * */
sitecues.define("page/positioner/transplant/mutation-relay", [ "page/positioner/util/element-info", "page/positioner/transplant/clone" ], function(elementInfo, clone) {
  var domObserver, originalBody;
  function copyClassToComplement(mutation) {
    var target = mutation.target, complement = clone.get(target);
    if (complement) {
      complement.className = target.className;
    }
  }
  function init() {
    originalBody = document.body;
    domObserver = new MutationObserver(function(mutations) {
      var len = mutations.length;
      for (var i = 0; i < len; i++) {
        var mutation = mutations[i], target = mutation.target;
        // Don't bother looking for a complement to Sitecues elements, they have been removed
        if (elementInfo.isSitecuesElement(target)) {
          continue;
        }
        copyClassToComplement(mutation);
      }
    });
    domObserver.observe(originalBody, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      // For now we only need to copy classes over, it's the simplest case. Copying inline styles over is more complicated
      // and will need to be more thoroughly thought through
      attributeFilter: [ "class" ]
    });
  }
  return {
    init: init
  };
});

// The transplanter is responsible for moving original elements between the original and auxiliary bodies. Transplant operations only
// run once we've scaled the page for the first time.
sitecues.define("page/positioner/transplant/transplant", [ "$", "page/positioner/util/element-map", "page/positioner/transplant/clone", "page/positioner/constants", "run/util/array-utility", "page/positioner/util/element-info", "page/positioner/transplant/graft", "page/positioner/transplant/anchors", "page/positioner/transplant/mutation-relay" ], function($, elementMap, clone, constants, arrayUtil, elementInfo, graft, anchors, mutationRelay) {
  var originalBody, elementQuerySelectorAll, documentQuerySelectorAll, getElementsByClassName, TRANSPLANT_STATE = constants.TRANSPLANT_STATE, ORIGINAL_STYLESHEET_ID = "sitecues-js-originals", ROOT_ATTR = constants.ROOT_ATTR, ROOT_SELECTOR = constants.ROOT_SELECTOR;
  // When we transplant elements into the auxiliary body, we need to re-direct queries in the original body to include
  // the original element's new position in the DOM tree, and to exclude clone elements in the heredity tree
  // TODO: If we ever drop IE11, use a Proxy intercept to accomplish this
  function rerouteDOMQueries() {
    getElementsByClassName = Document.prototype.getElementsByClassName;
    elementQuerySelectorAll = Element.prototype.querySelectorAll;
    documentQuerySelectorAll = Document.prototype.querySelectorAll;
    function scElementQuerySelectorAll(selector) {
      /*jshint validthis: true */
      var complement = clone.get(this);
      if (complement) {
        var auxResults = elementQuerySelectorAll.call(complement, selector), originalResults = elementQuerySelectorAll.call(this, selector), results = arrayUtil.union(auxResults, originalResults);
        return results.filter(elementInfo.isOriginal);
      }
      return elementQuerySelectorAll.call(this, selector);
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
    Document.prototype.querySelectorAll = scDocumentQuerySelectorAll;
    Element.prototype.querySelectorAll = scElementQuerySelectorAll;
    Document.prototype.getElementsByClassName = scGetElementsByClassName;
  }
  // Returns falsey if there isn't a root in the element's ancestor chain
  function getClosestRoot(element) {
    var ancestor = element.parentElement, cloneBody = clone.get(originalBody), doesCloneBodyExist = Boolean(cloneBody);
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
      var placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      elementMap.setField(element, "placeholder", placeholder);
      elementMap.setField(placeholder, "placeholderFor", element);
      return placeholder;
    }
    var placeholder = elementInfo.getPlaceholder(element) || createPlaceholder(element);
    graft.implantNodeStructure(placeholder, parent, sibling);
  }
  function evaluateTransplantState(element) {
    var hasDescendantPlaceholders = element.querySelectorAll(".placeholder").length > 0, isCloned = Boolean(clone.get(element)), isTransplantRoot = elementInfo.isTransplantRoot(element), isNested = Boolean(getClosestRoot(element));
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
    if ("iframe" === element.localName) {
      return false;
    }
    var isFixed = flags.isFixed, isInOriginalBody = flags.isInOriginalBody, isInAuxBody = !isInOriginalBody, isTransplantRoot = flags.isTransplantRoot, isNestedElement = !isTransplantRoot && isInAuxBody;
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
    var results = {
      flags: flags
    };
    if (doRunTransplantOperation(element, flags)) {
      results.transplantState = evaluateTransplantState(element);
      return results;
    }
  }
  // If an element hasn't been cloned, we need to clone the rest of its heredity structure (which at a minimum is its own generation), insert the
  // root element into the node structure, and graft the structure to the element's closest clone ancestor
  function transplantUnclonedRoot(element) {
    var parent = element.parentElement, sibling = element.nextSibling, insertionGroup = clone(element, {
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
    var parent = element.parentElement, sibling = element.nextSibling, cloneEl = clone.get(element), cloneParent = cloneEl.parentElement, cloneSibling = cloneEl.nextSibling;
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
    var cloneParent, cloneSibling, placeholder = opts.placeholder || elementInfo.getPlaceholder(root), originalParent = placeholder.parentElement, originalSibling = placeholder.nextSibling, subroots = elementInfo.getSubroots(), // It's important that we clone the root if it hasn't already been cloned, otherwise nested roots might not find a cloned original ancestor
    // in the auxiliary body. We can then insert the heredity trees of each of the nested roots into this clone, and then finally insert this clone
    // into its complement's position in the auxiliary body.
    rootClone = clone.get(root) || clone(root);
    for (var i = 0, subrootCount = subroots.length; i < subrootCount; i++) {
      var subroot = subroots[i], subrootParent = subroot.parentElement, subrootSibling = subroot.nextSibling, subrootClone = clone.get(subroot);
      // If the subroot is already cloned, we know that its complete heredity tree is already built
      if (subrootClone) {
        cloneParent = subrootClone.parentElement;
        cloneSibling = subrootClone.nextSibling;
        graft.toAuxiliaryBody({
          root: subroot,
          parent: cloneParent,
          sibling: cloneSibling
        });
      } else {
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
      anchors.add(subroot);
      elementMap.setField(subroot, "wasReplanted", true);
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
    var subroots = elementInfo.getSubroots(root), superRoot = elementInfo.getRoot(root);
    subroots.forEach(function(subroot) {
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
    var superRoot = getClosestRoot(element), siblingSubroots = elementInfo.getSubroots(superRoot), deepSubroots = Array.prototype.slice.call(element.querySelectorAll(ROOT_SELECTOR), 0), directSubroots = arrayUtil.intersection(deepSubroots, siblingSubroots);
    directSubroots.forEach(function(subroot) {
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
    var nestedPlaceholders = element.querySelectorAll(".placeholder");
    for (var i = 0, placeholderCount = nestedPlaceholders.length; i < placeholderCount; i++) {
      var placeholder = nestedPlaceholders[i], transplantedRoot = elementInfo.getPlaceholderOwner(placeholder), cloneParent = transplantedRoot.parentElement, cloneSibling = transplantedRoot.nextSibling, originalParent = placeholder.parentElement, originalSibling = placeholder.nextSibling, cloneRoot = clone.get(transplantedRoot) || clone(transplantedRoot);
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
      elementMap.setField(transplantedRoot, "wasReplanted", true);
    }
  }
  function performOperation(element, opts) {
    var status = TRANSPLANT_STATE, flags = opts.flags, transplantState = opts.transplantState;
    flags.wasTransplantRoot = flags.isTransplantRoot;
    flags.wasTransplantAnchor = flags.isTransplantAnchor;
    switch (transplantState) {
     case status.UNCLONED:
      transplantUnclonedRoot(element, opts);
      flags.isTransplantAnchor = true;
      flags.isTransplantRoot = true;
      flags.isInOriginalBody = false;
      break;

     case status.MIXED:
      unifyMixedSubtree(element);
      transplantClonedRoot(element, opts);
      flags.isTransplantAnchor = true;
      flags.isTransplantRoot = true;
      flags.isInOriginalBody = false;
      break;

     case status.CLONED:
      transplantClonedRoot(element, opts);
      flags.isTransplantAnchor = true;
      flags.isTransplantRoot = true;
      flags.isInOriginalBody = false;
      break;

     case status.ROOT:
      replantAnchorRoot(element, opts);
      flags.isTransplantRoot = false;
      flags.isTransplantAnchor = false;
      flags.isInOriginalBody = true;
      break;

     case status.NESTED_ROOT:
      removeNestedRoot(element);
      flags.isTransplantRoot = false;
      break;

     case status.NESTED:
      addNestedRoot(element);
      flags.isTransplantRoot = true;
    }
  }
  function postOperation(element, args) {
    var flags = args.flags;
    if (flags.isTransplantAnchor) {
      if (!elementQuerySelectorAll) {
        rerouteDOMQueries();
      }
      anchors.add(element);
    } else {
      if (flags.wasTransplantAnchor) {
        anchors.remove(element);
      }
    }
    if (flags.isTransplantRoot) {
      element.setAttribute(ROOT_ATTR, "root");
      elementInfo.isTransplantRoot(element, true);
    } else {
      if (flags.wasTransplantRoot) {
        element.removeAttribute(ROOT_ATTR);
        elementInfo.isTransplantRoot(element, false);
      }
    }
  }
  function insertStylesheet() {
    var $style, rootDeclarationBlock = " { visibility: visible; }\n";
    $style = $("<style>");
    $style.attr("id", ORIGINAL_STYLESHEET_ID).text(ROOT_SELECTOR + rootDeclarationBlock).insertBefore(document.head.firstChild);
  }
  function init() {
    originalBody = document.body;
    insertStylesheet();
    clone.init();
    mutationRelay.init();
    graft.init();
  }
  return {
    evaluateCandidate: evaluateCandidate,
    performOperation: performOperation,
    postOperation: postOperation,
    init: init
  };
});

/*
* Targets
*
* This modules keeps track of fixed transform target elements
* Transform handlers are run when we add and remove targets
* */
sitecues.define("page/positioner/transform/targets", [ "run/util/array-utility" ], function(arrayUtil) {
  var addHandler, removeHandler, fixedTargets;
  function removeTarget(element) {
    if (hasElement(element)) {
      fixedTargets.delete(element);
      removeHandler(element);
    }
  }
  function addTarget(element) {
    if (!hasElement(element)) {
      fixedTargets.add(element);
      addHandler(element);
    }
  }
  function hasElement(element) {
    return fixedTargets.has(element);
  }
  function getTargets() {
    return arrayUtil.fromSet(fixedTargets);
  }
  function getCount() {
    return fixedTargets.size;
  }
  function registerAddHandler(fn) {
    addHandler = fn;
  }
  function forEach(fn) {
    fixedTargets.forEach(fn);
  }
  function registerRemoveHandler(fn) {
    removeHandler = fn;
  }
  function init() {
    var noop = function() {};
    addHandler = noop;
    removeHandler = noop;
    fixedTargets = new Set();
  }
  return {
    init: init,
    add: addTarget,
    get: getTargets,
    has: hasElement,
    forEach: forEach,
    remove: removeTarget,
    registerAddHandler: registerAddHandler,
    registerRemoveHandler: registerRemoveHandler,
    getCount: getCount
  };
});

sitecues.define("page/positioner/transform/rect-cache", [ "$", "run/bp/helper", "page/positioner/style-lock/style-lock", "page/positioner/style-lock/style-listener/style-listener", "run/events", "run/dom-events", "page/viewport/viewport" ], function($, helper, styleLock, styleListener, events, domEvents, viewport) {
  var isTransformXOriginCentered, noop = function() {}, // For convenience this map keeps track of which elements we're currently observing
  observedElementMap = new WeakMap(), // This map caches the bounding rectangle for observed elements
  elementToRectDataMap = new WeakMap();
  function clearCache() {
    /*jshint validthis: true */
    if (this && this.nodeType === Node.ELEMENT_NODE) {
      elementToRectDataMap.set(this, null);
    } else {
      elementToRectDataMap = new WeakMap();
    }
  }
  function getUnscaledRect(element, position, scale) {
    var rect = getRect(element, position);
    function getRectLeft() {
      // If the element has been transformed from 50 0 origin, the left boundary of its bounding box has been shifted by half of the scaled width
      // When we unscale the rect, take the difference between the scaled width and the unscaled width
      // then divide this number by 2 (because 50% of that width is shifting the right boundary) and add it to the left boundary to get its
      // unscaled position
      return isTransformXOriginCentered ? rect.left + rect.width * (1 - 1 / scale) / 2 : rect.left;
    }
    rect.left = getRectLeft();
    rect.height /= scale;
    rect.width /= scale;
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  }
  function getRect(element, position) {
    var offsetDeltas, rectData = elementToRectDataMap.get(element) || {}, rect = rectData.rect ? $.extend({}, rectData.rect) : null, isFixed = rectData.isFixed, isElementObserved = observedElementMap.get(element);
    function getOffsetDeltas(currentOffsets, cachedOffsets) {
      return {
        x: cachedOffsets.x - currentOffsets.x,
        y: cachedOffsets.y - currentOffsets.y
      };
    }
    if (rect) {
      if (isFixed) {
        // If the rectangle is fixed, we don't need to update its location coordinates on scroll
        // because fixed elements don't move on scroll
        return rect;
      }
      offsetDeltas = getOffsetDeltas(viewport.getPageOffsets(), rectData.offsets);
      rect.top += offsetDeltas.y;
      rect.bottom += offsetDeltas.y;
      rect.left += offsetDeltas.x;
      rect.right += offsetDeltas.x;
      return rect;
    }
    rect = helper.getRect(element);
    if (isElementObserved) {
      isFixed = "fixed" === position;
      elementToRectDataMap.set(element, {
        rect: rect,
        offsets: viewport.getPageOffsets(),
        isFixed: isFixed
      });
    }
    return rect;
  }
  function updateRect(element, rect) {
    var currentRectData = elementToRectDataMap.get(element);
    // The rect may have been invalidated already, in which case we should recalculate the rectangle on the next request
    if (currentRectData) {
      currentRectData.rect = rect;
      currentRectData.offsets = viewport.getPageOffsets();
      elementToRectDataMap.set(element, currentRectData);
    }
  }
  function deleteRect(element) {
    elementToRectDataMap.delete(element);
  }
  // listen for style mutations that will impact the element's bounding rectangle
  function listenForMutatedRect(element, handler) {
    handler = handler || noop;
    // We only allow a single handler to be attached
    if (observedElementMap.get(element)) {
      return;
    }
    styleLock.init(function() {
      styleListener.registerPropertyMutationHandler(element, "top", function() {
        clearCache.call(this);
        handler.call(this);
      });
      // We don't want to lock width or height because they are styles that a commonly animated, so a lock is impractical
      styleListener.registerPropertyMutationHandler(element, "width", function() {
        /*jshint validthis: true */
        clearCache.call(this);
        handler.call(this);
      });
      styleListener.registerPropertyMutationHandler(element, "height", function() {
        /*jshint validthis: true */
        clearCache.call(this);
        handler.call(this);
      });
      styleLock(element, "display", {
        before: clearCache,
        after: handler
      });
      // This listener is a hacky way to detect if jQuery.fadeIn / fadeOut has been called on an element
      // We need to unlock display in this case, otherwise we see a flicker when opacity is removed but before
      // the display style lock is removed. This is an issue on TICC.com
      styleListener.registerPropertyMutationHandler(element, "opacity", function() {
        /*jshint validthis: true */
        styleLock.unlockStyle(this, "display");
      });
      styleLock(element, "position", {
        before: clearCache
      });
      observedElementMap.set(element, true);
    });
  }
  function init(isOriginCentered) {
    isTransformXOriginCentered = isOriginCentered;
    events.on("zoom", clearCache);
    domEvents.on(window, "resize", clearCache);
  }
  return {
    listenForMutatedRect: listenForMutatedRect,
    getUnscaledRect: getUnscaledRect,
    getRect: getRect,
    update: updateRect,
    delete: deleteRect,
    init: init
  };
});

/*
 * Transform
 *
 * Scales and translates fixed elements. Fixed elements are scaled with the body, but restricted to a maximum of 1.8x
 *
 * Fixed elements are translated in the following cases:
 *   1. If a fixed element is overlapping with the Sitecues toolbar
 *   2. If a fixed element is taller or wider than the viewport, we translate the element on scroll
 *   3. If a fixed element's bounding rect is contained in the 'middle' 60% of the viewport's height, and there is a toolbar, we
 *     shift it down by the height of the toolbar. This handles cases where fixed elements are intended to be positioned over static elements
 *     that have already been shifted down by the toolbar height. We don't shift down fixed elements close to the top or bottom of the viewport
 *     because they are more likely to be part of a fixed menu that we shouldn't shift down (like a drop down menu)
 * */
/*jshint -W072 */
sitecues.define("page/positioner/transform/transform", [ "page/positioner/util/element-map", "page/zoom/util/body-geometry", "page/zoom/state", "page/positioner/transform/targets", "page/viewport/viewport", "page/positioner/util/element-info", "run/platform", "page/positioner/transform/rect-cache", "run/dom-events", "run/util/array-utility", "page/zoom/style", "page/viewport/scrollbars", "page/zoom/config/config", "run/events", "mini-core/native-global", "run/inline-style/inline-style", "page/util/transition-util" ], function(elementMap, bodyGeo, state, targets, viewport, elementInfo, platform, rectCache, domEvents, arrayUtil, zoomStyle, scrollbars, config, events, nativeGlobal, inlineStyle, transitionUtil) {
  var shouldRestrictWidth, originalBody, isTransformXOriginCentered, shouldRepaintOnZoomChange, // Fixed elements taller than the viewport
  tallElements = [], // Fixed elements wider than the viewport
  wideElements = [], cachedXOffset = null, cachedYOffset = null, animationFrame = null, lastRepaintZoomLevel = null, resizeTimer = null, toolbarHeight = 0, MARGIN_FROM_EDGE = 15, isTransformingOnResize = false, // If we're using the toolbar, we need to transform fixed elements immediately or they may cover the toolbar / be covered
  isTransformingOnScroll = false;
  // This function scales and translates fixed elements as needed, e.g. if we've zoomed and the body is wider than the element
  function transformFixedElement(element, opts) {
    function getRectLeft(left, width, scale) {
      // Since transform origin 50 0 splits the scaled width evenly between the left and right sides, we need to subtract
      // half of the difference between the scaled and unscaled width from the left side
      return isTransformXOriginCentered ? left - width * (scale - 1) / 2 : left;
    }
    var resetCurrentTranslation = opts.resetTranslation, pageOffsets = viewport.getPageOffsets(), viewportDims = viewport.getInnerDimensions(), currentPageXOffset = pageOffsets.x, currentPageYOffset = pageOffsets.y, lastPageXOffset = elementMap.getField(element, "lastPageXOffset") || cachedXOffset, lastPageYOffset = elementMap.getField(element, "lastPageYOffset") || cachedYOffset, viewportWidth = viewportDims.width, viewportHeight = viewportDims.height, currentScale = elementInfo.getScale(element, "fixed"), unscaledRect = rectCache.getUnscaledRect(element, "fixed", currentScale), translationValues = getTranslationValues(element), currentXTranslation = translationValues.x, currentYTranslation = translationValues.y;
    // On zoom we should reset the current translations to
    // 1. reassess if we should shift the element vertically down by the toolbar offset
    // 2. we may not need to horizontally pan the element depending on its new width
    if (resetCurrentTranslation) {
      unscaledRect.left -= currentXTranslation;
      unscaledRect.top -= currentYTranslation;
      currentYTranslation = 0;
      currentXTranslation = 0;
    }
    var newScale = getRestrictedScale(unscaledRect, opts.onResize), newXTranslation = currentXTranslation, newYTranslation = currentYTranslation;
    elementInfo.setScale(element, newScale);
    if (!unscaledRect.width || !unscaledRect.height) {
      setNewTransform(element, 0, 0, newScale);
      cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
      return;
    }
    // Calculate the dimensions of the fixed element after we apply the next scale transform
    var rect = {
      width: unscaledRect.width * newScale,
      height: unscaledRect.height * newScale,
      top: unscaledRect.top
    };
    rect.left = getRectLeft(unscaledRect.left, unscaledRect.width, newScale);
    rect.bottom = rect.top + rect.height;
    rect.right = rect.left + rect.width;
    newXTranslation = calculateXTranslation({
      scale: newScale,
      dimensions: rect,
      viewportWidth: viewportWidth,
      lastPageXOffset: lastPageXOffset,
      scrollDifference: currentPageXOffset - lastPageXOffset,
      currentPageXOffset: currentPageXOffset,
      currentXTranslation: currentXTranslation
    });
    newYTranslation = calculateYTranslation({
      dimensions: rect,
      viewportHeight: viewportHeight,
      scrollDifference: currentPageYOffset - lastPageYOffset,
      currentPageYOffset: currentPageYOffset,
      currentYTranslation: currentYTranslation,
      resetCurrentTranslation: resetCurrentTranslation
    });
    var xDelta = resetCurrentTranslation ? newXTranslation : newXTranslation - currentXTranslation, yDelta = resetCurrentTranslation ? newYTranslation : newYTranslation - currentYTranslation;
    // Translate the rectangle by our transformation, so that we can update the cached rectangle for this element. This allows us to avoid re-calculating
    // the binding rectangle on scroll, which is a very expensive operation
    rect.top += yDelta;
    rect.bottom += yDelta;
    rect.left += xDelta;
    rect.right += xDelta;
    setNewTransform(element, newXTranslation, newYTranslation, newScale);
    cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
    rectCache.update(element, rect);
  }
  function getTranslationValues(element) {
    var split = inlineStyle(element).transform.split(/(?:\()|(?:px,*)/), index = split.indexOf("translate3d"), values = {
      x: 0,
      y: 0
    };
    if (index >= 0) {
      values.x = parseFloat(split[index + 1]);
      values.y = parseFloat(split[index + 2]);
    }
    return values;
  }
  function cachePageOffsets(element, xOffset, yOffset) {
    elementMap.setField(element, "lastPageXOffset", xOffset);
    elementMap.setField(element, "lastPageYOffset", yOffset);
  }
  function setNewTransform(element, translateX, translateY, scale) {
    var transform = "translate3d(" + translateX + "px, " + translateY + "px, 0) scale(" + scale + ")";
    transitionUtil.applyInstantTransform(element, transform);
  }
  function calculateXTranslation(args) {
    var currentXTranslation = args.currentXTranslation, elementWidth = Math.round(args.dimensions.width), left = args.dimensions.left, viewportWidth = args.viewportWidth, currentPageXOffset = args.currentPageXOffset, scrollDifference = args.scrollDifference, offLeft = elementWidth > viewportWidth ? left - scrollDifference : left, offRight = elementWidth - viewportWidth + offLeft, newXTranslation = elementWidth > viewportWidth ? currentXTranslation - scrollDifference : currentXTranslation, scrollWidth = bodyGeo.getScrollWidth();
    var bodyRect = rectCache.getRect(originalBody), percentOff = (bodyRect.left + currentPageXOffset) / bodyRect.width, intendedOff = elementWidth * percentOff;
    // Shift fixed elements out of the viewport by the same proportion as the body
    offLeft -= intendedOff;
    scrollWidth -= intendedOff;
    // If the fixed element is wider than the viewport
    if (elementWidth >= viewportWidth) {
      var scrollLimit = scrollWidth - viewportWidth, remainingScroll = scrollLimit - currentPageXOffset;
      // If the length of the element outside of the right side of the viewport is greater than the remaining scroll width, shift
      // the element the difference between the two values (so that we can pan the entire element into view)
      if (offRight > remainingScroll) {
        newXTranslation -= offRight - remainingScroll;
      } else {
        if (offRight < 0) {
          newXTranslation -= offRight;
        } else {
          if (currentPageXOffset >= 0 && currentPageXOffset < -offLeft || currentPageXOffset < 0 && currentPageXOffset !== -offLeft) {
            // Subtract
            newXTranslation -= offLeft + currentPageXOffset;
          } else {
            if (offLeft > 0 && currentPageXOffset >= 0) {
              // Shift the element to the left side of the viewport
              newXTranslation -= offLeft;
            }
          }
        }
      }
    } else {
      if (offRight > 0) {
        newXTranslation = -offRight + currentXTranslation - MARGIN_FROM_EDGE;
      } else {
        if (offLeft < 0) {
          newXTranslation = -offLeft + currentXTranslation + MARGIN_FROM_EDGE;
        }
      }
    }
    return newXTranslation;
  }
  function calculateYTranslation(args) {
    var viewportHeight = args.viewportHeight, currentYTranslation = args.currentYTranslation, currentPageYOffset = args.currentPageYOffset, resetCurrentTranslation = args.resetCurrentTranslation, elementHeight = args.dimensions.height, bottom = args.dimensions.bottom, top = args.dimensions.top, scrollDifference = args.scrollDifference, scrollHeight = bodyGeo.getScrollHeight(), isTallerThanViewport = elementHeight > viewportHeight - toolbarHeight;
    if (resetCurrentTranslation && toolbarHeight) {
      if (shouldVerticallyShiftFixedElement(top, bottom, viewportHeight, elementHeight)) {
        currentYTranslation += toolbarHeight;
        top += toolbarHeight;
        bottom += toolbarHeight;
      }
    }
    var newYTranslation = currentYTranslation, bottomOutOfView = bottom > viewportHeight, topOutOfView = top < toolbarHeight;
    if (resetCurrentTranslation) {
      // On reset, translate fixed elements below the toolbar
      // or if they're below the viewport, translate them into view
      if (isTallerThanViewport) {
        var correctedYTranslation = currentYTranslation, yTranslationLimit = viewportHeight - elementHeight - toolbarHeight, scrollLimit = scrollHeight - viewportHeight, offsetRemaining = Math.abs(yTranslationLimit - currentYTranslation), scrollRemaining = scrollLimit - currentPageYOffset, scrollPercent = currentPageYOffset / scrollLimit;
        // If the scroll distance to the edge of the page is less than the distance required to translate the
        // fixed element completely into the viewport, set the current y offset to a proportional value to the current pageYOffset
        if (offsetRemaining > scrollRemaining) {
          correctedYTranslation = yTranslationLimit * scrollPercent;
        }
        newYTranslation = correctedYTranslation;
      } else {
        if (topOutOfView) {
          newYTranslation += toolbarHeight - top;
        } else {
          if (bottomOutOfView) {
            newYTranslation += viewportHeight - bottom;
          }
        }
      }
    } else {
      if (isTallerThanViewport) {
        // If we've scrolled down
        if (scrollDifference > 0) {
          if (bottomOutOfView) {
            newYTranslation -= Math.min(scrollDifference, bottom - viewportHeight);
          }
        } else {
          if (scrollDifference < 0) {
            if (topOutOfView) {
              newYTranslation += Math.min(-scrollDifference, toolbarHeight - top);
            }
          }
        }
      }
    }
    return newYTranslation;
  }
  function getRestrictedScale(dimensions, isOnResize) {
    var scrollWidth = bodyGeo.getScrollWidth(isOnResize), elementWidth = dimensions.width;
    return Math.min(state.fixedZoom, scrollWidth / elementWidth);
  }
  function shouldVerticallyShiftFixedElement(top, bottom, viewportHeight, elementHeight) {
    // We shift fixed elements if they are clipping the boundaries of the toolbar
    // or if they are positioned in the middle 60% of the viewport height. This heuristic works pretty well, we don't shift elements that
    // are near the bottom of the screen, and we don't shift dropdown fixed menus that are intended to be flush with the top menu
    var isOverlappingToolbar = top < toolbarHeight, isFlushWithToolbar = top === toolbarHeight, isCloseToBottom = .8 * viewportHeight < bottom, isTallerThanViewport = elementHeight > viewportHeight;
    // Fixed elements that are close to the bottom or top are much more likely to be part of fixed menus that are
    // intended to be flush with the edges of the viewport
    return isTallerThanViewport || isOverlappingToolbar || !isFlushWithToolbar && !isCloseToBottom;
  }
  function transformAllTargets(opts) {
    targets.forEach(function(element) {
      transformFixedElement(element, opts);
    });
    if (lastRepaintZoomLevel !== state.completedZoom && shouldRepaintOnZoomChange) {
      lastRepaintZoomLevel = state.completedZoom;
      zoomStyle.repaintToEnsureCrispText();
    }
  }
  function refreshResizeListener() {
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = nativeGlobal.setTimeout(function() {
        targets.forEach(scaleTop);
        transformAllTargets({
          resetTranslation: true,
          onResize: true
        });
        refreshScrollListener();
      }, 200);
    }
    var doTransformOnResize = Boolean(targets.getCount());
    if (!isTransformingOnResize && doTransformOnResize) {
      // There may be css media rules that change positioning of fixed elements when the viewport is resized
      window.addEventListener("resize", onResize);
    } else {
      if (isTransformingOnResize && !doTransformOnResize) {
        window.removeEventListener("resize", onResize);
      }
    }
  }
  function refreshElementTransform(element) {
    transformFixedElement(element, {
      resetTranslation: true
    });
    refreshScrollListener(element);
    refreshResizeListener();
  }
  function fixZIndex(element) {
    // In IE, transformed fixed elements show up underneath other elements on the page when we apply a transformation
    // This is because we don't transplant fixed elements in IE, so the new containing blocks created by the transformation
    // are layered within the original body
    if (platform.browser.isIE) {
      var zIndex = getComputedStyle(element).zIndex;
      if ("auto" === zIndex) {
        inlineStyle.override(element, {
          zIndex: "999999"
        });
      }
    }
  }
  function scaleTop(element) {
    restoreTop(element);
    // Absolute elements return the used top value if there isn't one specified. Setting the position to static ensures
    // that only specified top values are returned with the computed style
    // EXCEPTION: IE returns the used value for both
    if (!platform.browser.isIE) {
      inlineStyle.override(element, [ "position", "static", "important" ]);
    }
    var specifiedTop = getComputedStyle(element).top, specifiedValue = parseFloat(specifiedTop);
    if (!isNaN(specifiedValue) && specifiedTop.indexOf("px") >= 0) {
      inlineStyle.override(element, {
        top: specifiedValue * state.fixedZoom + "px"
      });
    }
    inlineStyle.restoreLast(element, "position");
  }
  function restoreTop(element) {
    inlineStyle.restore(element, "top");
  }
  function onTargetAdded(element) {
    inlineStyle.override(element, [ "transformOrigin", isTransformXOriginCentered ? "50% 0" : "0 0" ]);
    // This handler runs when a style relevant to @element's bounding rectangle has mutated
    rectCache.listenForMutatedRect(element, function() {
      /*jshint validthis: true */
      if (targets.has(this)) {
        scaleTop(element);
        fixZIndex(element);
        refreshElementTransform(this);
      }
    });
    rectCache.listenForMutatedRect(originalBody);
    refreshElementTransform(element);
  }
  function onTargetRemoved(element) {
    inlineStyle.restore(element, [ "transform", "transformOrigin", "top" ]);
    rectCache.delete(element);
    // This is the cached metadata we used for transforming the element. We need to clear it now that
    // the information is stale
    elementMap.flushField(element, [ "lastPageXOffset", "lastPageYOffset", "scale", "unscaledTop" ]);
    refreshResizeListener();
    refreshScrollListener(element);
  }
  function onScroll() {
    function transformOnScroll() {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(function() {
        transformAllTargets({});
      });
    }
    var currentOffsets = viewport.getPageOffsets(), xDelta = currentOffsets.x - cachedXOffset, yDelta = currentOffsets.y - cachedYOffset, doVerticalTransform = Boolean(tallElements.length), doHorizontalTransform = Boolean(wideElements.length);
    cachedXOffset = currentOffsets.x;
    cachedYOffset = currentOffsets.y;
    if (xDelta && doHorizontalTransform || yDelta && doVerticalTransform) {
      transformOnScroll();
    }
  }
  function refreshScrollListener(element) {
    var viewportDims = viewport.getInnerDimensions(), viewportHeight = viewportDims.height, viewportWidth = viewportDims.width;
    function identifyTallOrWideElement(element) {
      var rect = rectCache.getRect(element, "fixed"), height = rect.height, width = rect.width;
      if (height > viewportHeight) {
        arrayUtil.addUnique(tallElements, element);
      } else {
        tallElements = arrayUtil.remove(tallElements, element);
      }
      if (width > viewportWidth) {
        arrayUtil.addUnique(wideElements, element);
      } else {
        wideElements = arrayUtil.remove(wideElements, element);
      }
    }
    // If this function is called when we add a transform target, evaluate the new target
    if (element) {
      identifyTallOrWideElement(element);
    } else {
      tallElements = [];
      wideElements = [];
      targets.forEach(identifyTallOrWideElement);
    }
    var addOrRemoveFn, doTransformOnHorizontalScroll = Boolean(wideElements.length), doTransformOnVerticalScroll = Boolean(tallElements.length), doTransformOnScroll = doTransformOnHorizontalScroll || doTransformOnVerticalScroll;
    scrollbars.forceScrollbars(doTransformOnHorizontalScroll, doTransformOnVerticalScroll);
    if (doTransformOnScroll !== isTransformingOnScroll) {
      addOrRemoveFn = doTransformOnScroll ? domEvents.on : domEvents.off;
      addOrRemoveFn(window, "scroll", onScroll, {
        capture: false
      });
      isTransformingOnScroll = doTransformOnScroll;
    }
  }
  function onZoom() {
    nativeGlobal.setTimeout(function() {
      targets.forEach(scaleTop);
      refresh();
    }, 0);
  }
  // Typically these are shift transforms that assume that the body is untransformed. Once we transform the body, these fixed elements will effectively
  // be absolutely positioned relative to the body and thus do not need to be specifically shifted. We'll update these transformations once they've been
  // transplanted.
  function clearInvalidTransforms() {
    targets.forEach(function(element) {
      if (!platform.browser.isIE && 1 === state.completedZoom && elementInfo.isInOriginalBody(element)) {
        inlineStyle.restore(element, "transform");
      }
    });
  }
  function refresh() {
    transformAllTargets({
      resetTranslation: true
    });
    refreshScrollListener();
  }
  function init(toolbarHght) {
    if (toolbarHght) {
      toolbarHeight = toolbarHght;
    }
    originalBody = document.body;
    shouldRestrictWidth = config.shouldRestrictWidth;
    isTransformXOriginCentered = !shouldRestrictWidth;
    rectCache.init(isTransformXOriginCentered);
    // In Chrome we have to trigger a repaint after we transform elements because it causes blurriness
    shouldRepaintOnZoomChange = platform.browser.isChrome;
    targets.init();
    targets.registerAddHandler(onTargetAdded);
    targets.registerRemoveHandler(onTargetRemoved);
    events.on("zoom", onZoom);
    events.on("zoom/begin", clearInvalidTransforms);
  }
  return {
    init: init,
    refresh: refresh,
    allTargets: transformAllTargets
  };
});

/**
   * This module adjusts positioned elements to correctly render
   * for the current zoom and scroll position in the window.
   *
   */
sitecues.define("page/positioner/positioner", [ "run/platform", "page/positioner/transplant/transplant", "page/positioner/transform/transform", "page/positioner/transform/targets", "page/zoom/state", "page/positioner/style-lock/style-lock", "page/positioner/util/element-info", "page/positioner/constants", "page/zoom/util/body-geometry", "run/events", "mini-core/native-global" ], function(platform, transplant, transform, transformTargets, state, styleLock, elementInfo, constants, bodyGeo, events, nativeGlobal) {
  var originalBody, docElem, unprocessedTransplantCandidates, // Should we transplant elements from the original body to the auxiliary body
  isTransplanting = false, isTransplantInitialized = false, // Should we replant elements from the auxiliary body to the original body
  isReplanting = false, // Do we ever use the transplant operation (not IE browser flag)
  doUseTransplantOperation = false, isInitialized = false, // If there's a toolbar we need to translate fixed elements down
  areFixedHandlersRegistered = false, isFirstZoom = true, TRANSPLANT_STATE = constants.TRANSPLANT_STATE;
  function onZoom(completedZoom) {
    isTransplanting = Boolean(completedZoom > 1 && doUseTransplantOperation);
    if (isTransplanting) {
      initializeTransplant();
      processTransplantCandidates();
    }
    // If we we're listening for fixed positioning, initialize the listener
    if (isFirstZoom) {
      onFirstZoom();
    }
    unlockPositionIfNotZoomed();
  }
  function onFirstZoom() {
    if (!areFixedHandlersRegistered) {
      styleLock.init(function() {
        initFixedPositionListener();
      });
    }
    // This flag means that we should run the transplant operation even if we're aren't zoomed in cases
    // where we have to replant an element back to the original body
    isReplanting = doUseTransplantOperation;
    isFirstZoom = false;
  }
  function initializeTransplant() {
    if (!isTransplantInitialized) {
      transplant.init();
      isTransplantInitialized = true;
    }
  }
  function processTransplantCandidates() {
    unprocessedTransplantCandidates.forEach(function(candidate) {
      // TODO: order these initial position handlers by distance from body, closest distance runs first
      nativeGlobal.setTimeout(function(candidate) {
        var position = getComputedStyle(candidate).position;
        if ("fixed" === position) {
          toPositionHandler.call(candidate, {
            toValue: position
          });
        }
      }, 0, candidate);
    });
    unprocessedTransplantCandidates.clear();
  }
  function initFixedPositionListener() {
    styleLock({
      property: "position",
      value: "fixed"
    }, {
      initial: toPositionHandler,
      before: fromPositionBeforeHandler,
      after: fromPositionAfterHandler
    });
    areFixedHandlersRegistered = true;
  }
  function unlockPositionIfNotZoomed(element) {
    // If we haven't zoomed we haven't applied a horizontal translation to the fixed element, so it isn't worth the delay
    // to unlock the element (there is a slight blink on chicagolighthouse's fixed navbar without this)
    if (1 === state.completedZoom) {
      // If @element is undefined, unlocks all elements with a locked position
      styleLock.unlockStyle(element, "position");
    }
  }
  // This handler runs when we find an element with a resolved fixed or absolute position
  function toPositionHandler(args) {
    /*jshint validthis: true */
    var position = args.toValue, oldPosition = args.fromValue, wasFixed = "fixed" === oldPosition;
    // These cases are handled by fromPosition hooks
    if (wasFixed) {
      return;
    }
    var isFixed = "fixed" === position, isInOriginalBody = elementInfo.isInOriginalBody(this), flags = {
      isFixed: isFixed,
      isInOriginalBody: isInOriginalBody
    };
    if (isReplanting) {
      var results = transplant.evaluateCandidate(this, flags);
      if (results) {
        var transplantState = results.transplantState, needsTransplant = transplantState === TRANSPLANT_STATE.UNCLONED || transplantState === TRANSPLANT_STATE.CLONED || transplantState === TRANSPLANT_STATE.MIXED;
        if (!needsTransplant || needsTransplant && isTransplanting) {
          transplant.performOperation(this, results);
          transformElement(this, flags);
          transplant.postOperation(this, results);
        } else {
          unprocessedTransplantCandidates.add(this);
        }
      }
    } else {
      if (doUseTransplantOperation) {
        // Evaluate the element's transplant status once we have to transplant fixed elements (after a zoom is applied to the body)
        unprocessedTransplantCandidates.add(this);
      }
    }
    // Even if we don't transplant the fixed element, potentially we still need to shift the element below the toolbar
    if (isFixed && !isTransplanting) {
      transformTargets.add(this);
    }
    unlockPositionIfNotZoomed(this);
  }
  // This handler runs when the document is mutated such that an element no longer resolves to the specified style value
  // Since we've applied a 'locking' style, that resolved style hasn't taken effect yet when this handler runs
  function fromPositionBeforeHandler(args) {
    /*jshint validthis: true */
    var oldPosition = args.fromValue, position = args.toValue, // A transplant root is an element with a position value that requires that it be transplanted into the auxiliary body.
    // Typically this value is 'fixed', but occasionally we also need to transplant absolute elements
    isTransplantRoot = elementInfo.isTransplantRoot(this), // A transplant anchor is a root element with no ancestor roots. All of the elements in its subtree are original,
    // regardless of their current position value. If a subroot becomes statically positioned, it will not be replanted
    // into the original body. If a transplant anchor becomes statically positioned, it will be replanted into the original body
    // and each of its subroots will be transplanted back into the auxiliary body
    isTransplantAnchor = elementInfo.isTransplantAnchor(this), isInOriginalBody = elementInfo.isInOriginalBody(this), isFixed = "fixed" === position, wasFixed = "fixed" === oldPosition, flags = {
      isTransplantAnchor: isTransplantAnchor,
      isTransplantRoot: isTransplantRoot,
      isInOriginalBody: isInOriginalBody,
      isFixed: isFixed,
      wasFixed: wasFixed
    };
    if (isReplanting) {
      var results = transplant.evaluateCandidate(this, flags);
      if (results) {
        var transplantState = results.transplantState, needsTransplant = transplantState === TRANSPLANT_STATE.UNCLONED || transplantState === TRANSPLANT_STATE.CLONED || transplantState === TRANSPLANT_STATE.MIXED;
        if (!needsTransplant || needsTransplant && isTransplanting) {
          results.doPerformTransplant = true;
          return results;
        } else {
          unprocessedTransplantCandidates.add(this);
        }
      }
    } else {
      if (doUseTransplantOperation) {
        // Evaluate the element's transplant status once we have to transplant fixed elements (after a zoom is applied to the body)
        unprocessedTransplantCandidates.add(this);
      }
    }
    return {
      flags: flags
    };
  }
  // This handler runs after we've unlocked the style value on the element, so that its new resolved value takes effect
  // e.g., if we we're applying 'position: absolute !important', that style has now been removed and the element's true position is in effect
  function fromPositionAfterHandler(opts) {
    /*jshint validthis: true */
    var flags = opts.flags, doPerformTransplant = opts.doPerformTransplant;
    if (doPerformTransplant) {
      transplant.performOperation(this, opts);
      transformElement(this, flags);
      transplant.postOperation(this, opts);
    } else {
      transformElement(this, flags);
    }
    unlockPositionIfNotZoomed(this);
  }
  // Applies or removes transformation from element, based on position and transplant status
  function transformElement(element, flags) {
    var isTransplantAnchor = flags.isTransplantAnchor, isFixed = flags.isFixed;
    if (isTransplantAnchor || isFixed) {
      transformTargets.add(element);
    } else {
      transformTargets.remove(element);
    }
  }
  function initFromToolbar(callback, toolbarHeight) {
    if (isInitialized) {
      callback();
      return;
    }
    init(function() {
      transform.init(toolbarHeight);
      styleLock.init(function() {
        // The toolbar may overlap with fixed elements so we'll need to transform them immediately
        // Fixed position elements are located and their position locked, so that we can run handlers before
        // and after the element's position changes.
        initFixedPositionListener();
        callback();
      });
    });
  }
  function initFromZoom() {
    if (isInitialized) {
      return;
    }
    init(function() {
      transform.init();
      // We only need to use the transplant algorithm once we've applied a transformation on the body, i.e. when we've zoomed
      nativeGlobal.setTimeout(onZoom, 0, state.completedZoom);
    });
  }
  function init(callback) {
    isInitialized = true;
    function onBodyGeoInitialized() {
      elementInfo.init();
      if (doUseTransplantOperation) {
        unprocessedTransplantCandidates = new Set();
      }
      events.on("zoom", onZoom);
      callback();
    }
    // Internet Explorer doesn't require us to use the transplant algorithm because transformed elements do not create new
    // containing blocks for fixed descendants, and fixed descendants do not inherit transformations
    doUseTransplantOperation = !platform.browser.isIE;
    docElem = document.documentElement;
    originalBody = document.body;
    return bodyGeo.init(onBodyGeoInitialized);
  }
  return {
    initFromZoom: initFromZoom,
    initFromToolbar: initFromToolbar
  };
});

// focus enhancement (make focus easier to see)
sitecues.define("page/focus/focus", [ "$", "run/conf/preferences" ], function($, pref) {
  var isDark, isEnabled, MIN_ZOOM = 1.4, // minimum zoom at which focus enhancement appears
  FOCUS_RING_COLOR_ON_LIGHT = "rgba(82,168,236,.8)", // color of focus enhancement on normal/warm/bold theme
  FOCUS_RING_COLOR_ON_DARK = "rgba(255,255,100,.8)", // color of focus enhancement on dark theme
  $styleSheet = $(), zoomLevel = 1;
  // show focus enhancement
  function show() {
    // hide focus first to allow
    // recalculate outline thickness
    hide();
    var color = isDark ? FOCUS_RING_COLOR_ON_DARK : FOCUS_RING_COLOR_ON_LIGHT;
    // create style element
    // append focus css rule to it
    $styleSheet = $("<style>").html('*:not(html):not(body):not(#sitecues-badge):not([id^="scp-"]):focus{outline:0;box-shadow:0 0 3pt 2pt ' + color + ";}").appendTo("head");
  }
  // hide focus enhancement
  function hide() {
    $styleSheet.remove();
  }
  // refresh focus enhancement bindings on the page
  function refreshFeatureEnablement() {
    if (isEnabled) {
      // if focus enhancement is enabled,
      // bind `blur` and `focus` events to
      // proper handlers. use selector for
      // filtering of matched elements
      show();
    } else {
      // unbind event handlers if focus
      // enhancement is disabled
      hide();
    }
  }
  function refresh(newZoomLevel, willBeDark) {
    // remember previous state of focus
    var wasEnabled = isEnabled, isColorChanging = willBeDark !== isDark;
    zoomLevel = newZoomLevel;
    isDark = willBeDark;
    // determinate should focus enhancement
    // be enabled or not
    isEnabled = newZoomLevel >= MIN_ZOOM || willBeDark;
    // if state of enhancement was changed
    // refresh module bindings on the page
    if (wasEnabled !== isEnabled || isColorChanging) {
      refreshFeatureEnablement();
    }
  }
  function init() {
    // subscribe to zoom changes and update
    // enhancement state with each change
    pref.bindListener("zoom", function(currZoom) {
      refresh(currZoom, isDark);
    });
    pref.bindListener("themeName", function(themeName) {
      refresh(zoomLevel, "dark" === themeName);
    });
  }
  return {
    init: init
  };
});

sitecues.define("page/cursor/cursor-css", [ "run/platform", "page/zoom/constants", "page/util/color", "run/conf/urls" ], function(platform, ZOOM_CONST, colorUtil, urls) {
  // Viewbox coordinates are multiplied by 10 so that we can remove coordinates from our decimal places
  // Also, viewbox left side begins at -10px (-100) so that the left side of the thumb shows up in the hand cursor on Windows
  var PREFIX = '<svg xmlns="http://www.w3.org/2000/svg" width="SIDE" height="SIDE" viewBox="-100,0,SIDE0,SIDE0"><defs><filter id="d" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx="2.5" dy="5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="scale(SIZE)" filter="url(#d)">', POSTFIX = "</g><defs/></svg>", CURSOR_SVG = {
    // Optimized to 2 decimal places via the SVG optimizer at https://petercollingridge.appspot.com/svg-editor
    // Turned into relative paths via the SVG editor at http://svg-edit.googlecode.com/svn-history/r1771/trunk/editor/svg-editor.html
    // (first paste in markup, accept the markup, then go back to markup view via <SVG> button)
    win: {
      _default: '<path d="M0,0L03,172L42,136L81,213L113,196L74,120L128,113L0,0z"/><path fill="HUE" d="M10,10L11,154L45,120L85,201L102,192L61,112L109,108L10,20z"/>',
      _pointer: '<path d="m166,143c0,15 -1,16 -2,20c-2,5 -7,16 -12,24l-5,6l0,12l0,15l-49,0c-39,0 -49,0 -49,0c0,-9 -8,-31 -11,-40c-7,-18 -13,-28 -30,-51c-10,-14 -10,-16 -10,-23c-1,-10 3,-17 16,-16c7,0 11,3 20,8l4,4l1,-45c0,-44 0,-45 1,-47c2,-3 8,-6 12,-8c2,0 6,0 9,0c9,0 15,4 17,11c0,2 1,11 1,23l0,19l3,0c7,-1 17,3 20,8c2,3 3,3 4,3c11,-2 19,0 26,6c1,2 3,3 3,3c0,1 2,1 4,1c6,-1 12,0 15,2c3,1 7,5 9,8c1,4 2,4 3,23c0,10 0,26 0,34z"/><path fill="HUE" d="m155,164c1,-5 2,-14 1,-49c-1,-16 -1,-20 -2,-22c-2,-5 -8,-8 -14,-7l-4,0l0,15c0,14 0,16 -1,16c-1,1 -5,1 -6,0c-2,0 -2,-1 -2,-15l0,-16l-2,-3c-3,-4 -7,-6 -13,-6c-2,0 -4,0 -5,0c0,0 -1,5 -1,15c0,10 0,15 0,15c-1,1 -2,1 -4,1c-5,0 -5,0 -5,-17c0,-17 0,-19 -5,-22c-3,-2 -4,-2 -9,-2l-5,0l0,20c0,17 -1,20 -2,20c-1,1 -4,1 -6,0c-1,0 -1,-1 -1,-44l0,-45l-2,-1c-1,-1 -3,-2 -4,-3c-5,-1 -9,0 -12,3l-2,1l0,54c0,60 1,56 -5,56c-3,-1 -4,-1 -4,-7l0,-7l-5,-4c-5,-3 -9,-8 -13,-9c-3,-1 -8,-2 -10,0c-5,4 -3,9 -2,12c3,6 4,7 9,14c20,27 19,28 37,78l1,6l40,0l41,0l0,-8l0,-9l5,-7c6,-9 10,-16 12,-23z"/>'
    },
    mac: {
      _default: '<path fill="HUE" d="M10 4L10 168 43 133 65 185 103 170 81 119 125 119 10 4z"/><path d="M19 29L20 142 45 116 70 173 90 166 67 109 100 109"/>',
      _pointer: '<path d="m51,13c-3,1 -6,3 -7,5c-5,7 -5,20 -2,39c2,7 5,23 6,25c0,1 -1,0 -3,-1c-6,-6 -11,-9 -17,-9c-6,0 -12,4 -15,10c-1,3 -1,4 -1,8c0,8 2,12 14,27c6,8 8,11 13,20c2,2 5,6 13,14l11,11l0,6l0,6l19,1l18,0l6,-6l6,-6l5,6l6,6l9,0l9,-1l1,-10l0,-10l2,-3c1,-2 4,-6 6,-9c3,-4 6,-9 8,-11c7,-10 7,-10 7,-37c0,-21 0,-21 -2,-24c-1,-3 -4,-5 -7,-7c-2,-1 -3,-1 -7,-1c-3,0 -4,0 -7,1c-2,1 -3,2 -3,2c0,0 -1,-2 -2,-3c-1,-4 -4,-6 -8,-8c-2,-1 -3,-2 -7,-2c-6,0 -8,1 -12,4c-1,2 -2,2 -2,1c0,-2 -6,-6 -9,-7c-4,-2 -9,-2 -12,0c-2,1 -4,2 -5,3c-1,0 -2,1 -2,0c0,-1 -1,-11 -2,-14c-3,-13 -8,-21 -15,-24c-3,-2 -9,-2 -12,-2z"/><path fill="HUE" d="m0,0l60,22c3,2 6,6 8,12c2,6 2,9 4,22c1,6 1,13 2,15c2,11 5,15 8,12c1,-1 1,-2 1,-10c0,-5 1,-10 1,-10c1,-3 5,-5 9,-5c2,0 6,2 8,4c1,2 1,2 1,7c0,7 1,12 2,14c1,0 2,0 3,0c3,0 4,-1 5,-10l0,-8l2,-1c3,-3 7,-4 11,-3c6,1 7,2 8,13c0,9 1,10 4,10c2,0 4,-1 5,-6c2,-6 5,-8 10,-7c2,1 4,2 4,5c1,4 1,26 0,34c0,7 0,7 -2,11c-2,4 -8,12 -15,21c-1,2 -3,4 -3,4c-1,1 -2,14 -2,19l0,2l-4,0l-5,0l-6,-7c-3,-4 -6,-7 -7,-7c0,0 -3,3 -7,7l-6,7l-14,0l-13,0l0,-5l0,-4l-5,-4c-2,-2 -6,-5 -8,-7c-6,-5 -9,-9 -14,-17c-2,-3 -8,-12 -13,-19c-12,-17 -12,-18 -12,-20c0,-4 5,-10 9,-10c5,0 16,8 22,17c4,6 5,7 8,5c2,0 2,-1 2,-3c1,-3 -1,-11 -3,-21c-7,-24 -10,-36 -10,-44c0,-10 2,-14 8,-14c1,0 3,0 4,1l-60,-22z"/><path d="m87,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -3,-1 -3,-3l0,-34c0,-2 1,-3 3,-3z"/><path d="m108,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -4,-1 -4,-3l0,-34c0,-2 2,-3 4,-3z"/><path d="m127,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -4,-1 -4,-3l0,-34c0,-2 2,-3 4,-3z"/>'
    }
  }, CURSOR_HUE_LIGHTNESS = .7, MAX_CURSOR_SIZE_DEFAULT = 128, MAX_CURSOR_PIXELS_WIN = 71, CURSOR_ZOOM_MAX = platform.os.isWin ? 3.15 : 4, CURSOR_OFFSETS = {
    // TODO do we need different values for each platform?
    _default: {
      x: 10,
      y: 5,
      xStep: 0,
      yStep: 2.5
    },
    _pointer: {
      x: 12,
      y: 5,
      xStep: 3.6,
      yStep: 1.7
    }
  };
  /**
   * Get a URL for the cursor given the current platform
   * @param type 'default' or 'pointer'  (for auto cursor, use 'default')
   * @param sizeRatio a number > 1 (e.g. 2 = 2x)
   * @param pixelRatio = 1 for normal, 2 for retina cursor
   */
  function getCursorCss(type, sizeRatio, doUseAjaxCursors, hue) {
    var doUseRetinaCursors = platform.isRetina() && platform.canUseRetinaCursors, pixelRatio = doUseRetinaCursors ? 2 : 1, cursorGeneratorFn = doUseRetinaCursors ? generateCursorStyle2x : generateCursorStyle1x;
    var url = getUrl(type, sizeRatio, pixelRatio, doUseAjaxCursors, hue), hotspotOffset = getCursorHotspotOffset(type, sizeRatio);
    return cursorGeneratorFn(url, hotspotOffset, type);
  }
  function getUrl(type, sizeRatio, pixelRatio, doUseAjaxCursors, hue) {
    if (sizeRatio > CURSOR_ZOOM_MAX) {
      sizeRatio = CURSOR_ZOOM_MAX;
    }
    if (doUseAjaxCursors) {
      return urls.resolveResourceUrl("images/cursors/win_" + type + "_" + getAjaxCursorSize(sizeRatio) + ".cur");
    }
    var maxCursorSize = platform.os.isWin ? MAX_CURSOR_PIXELS_WIN : MAX_CURSOR_SIZE_DEFAULT, hueString = hue ? colorUtil.getColorString(colorUtil.hslToRgb(hue, 1, CURSOR_HUE_LIGHTNESS)) : "#FFF", prefix = PREFIX.replace(/SIZE/g, "" + sizeRatio * pixelRatio).replace(/SIDE/g, "" + maxCursorSize * pixelRatio), middle = CURSOR_SVG[platform.os.is]["_" + type].replace(/HUE/g, hueString), cursorSvg = prefix + middle + POSTFIX;
    // TODO: escape() is deprecated, replace with custom helper
    return "data:image/svg+xml," + escape(cursorSvg);
  }
  /**
   * Generates the cursor url for a given type and zoom level for NON retina displays
   * @param  {string} type
   * @param  {number} zoom
   * @return {string}
   */
  function generateCursorStyle1x(image, hotspotOffset, type) {
    return "url(" + image + ")" + hotspotOffset + ", " + type;
  }
  // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
  // The maths below based on experience and doesn't use any kind of specific logic.
  // We are likely to change it better one when we have final images.
  // There's no need for specific approach while we constantly change images and code.
  /**
   * Gets custom cursor's hotspot offset.
   * @param zl Number or string, represents zoom level.
   * @return {string} result A string in format 'x y' which is later used a part of cursor property value.
   */
  function getCursorHotspotOffset(type, zl) {
    if (platform.browser.isMS) {
      // Don't use in IE or Edge -- it will be part of .cur file
      return "";
    }
    var zoomDiff = zl - 1, // Lowest zoom level is 1, this is the difference from that
    offset = CURSOR_OFFSETS["_" + type];
    return (offset.x + offset.xStep * zoomDiff).toFixed(0) + " " + (offset.y + offset.yStep * zoomDiff).toFixed(0);
  }
  /**
   * Generates the cursor url for a given type and zoom level for retina displays
   * @param  {string} type
   * @param  {number} zoom
   * @return {string}
   */
  function generateCursorStyle2x(image, hotspotOffset, type) {
    return "-webkit-image-set(    url(" + image + ") 1x,    url(" + image + ") 2x) " + hotspotOffset + ", " + type;
  }
  function getAjaxCursorSize(sizeRatio) {
    var MIN_AJAX_CURSOR_SIZE = 1.2, MAX_AJAX_CURSOR_SIZE = 3, rounded = Math.round(5 * sizeRatio) / 5;
    return Math.max(Math.min(rounded, MAX_AJAX_CURSOR_SIZE), MIN_AJAX_CURSOR_SIZE);
  }
  function getCursorZoom(pageZoom) {
    var zoomDiff = pageZoom - ZOOM_CONST.MIN_ZOOM, // SC-1431 Need to keep the cursor smaller than MAX_CURSOR_SIZE_WIN (defined in custom.js)
    // when on Windows OS, otherwise the cursor intermittently can become a large black square.
    // Therefore, on Windows we cannot zoom the cursor up as much as on the Mac (3.5x instead of 4x)
    CURSOR_ZOOM_MIN = 1, CURSOR_ZOOM_RANGE = CURSOR_ZOOM_MAX - CURSOR_ZOOM_MIN;
    // ALGORITHM - SINUSOIDAL EASING OUT HOLLADAY SPECIAL: Decelerating to zero velocity, more quickly.
    return CURSOR_ZOOM_RANGE * Math.sin(zoomDiff / ZOOM_CONST.ZOOM_RANGE * (Math.PI / 2.8)) + CURSOR_ZOOM_MIN;
  }
  return {
    getCursorCss: getCursorCss,
    getCursorZoom: getCursorZoom
  };
});

/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.define("page/cursor/cursor", [ "$", "page/style-service/style-service", "run/conf/preferences", "page/cursor/cursor-css", "run/platform", "run/events", "mini-core/native-global" ], function($, styleService, pref, cursorCss, platform, events, nativeGlobal) {
  var isInitialized, // URLs for IE cursors that have already been fetched via AJAX
  $stylesheet, $bpStylesheet, // For BP cursors, having a min size of MIN_BP_CURSOR_SIZE -- cursor is always large in BP
  cursorStylesheetObject, bpCursorStylesheetObject, // If > 1.0 then use white
  autoSize, userSpecifiedSize, userSpecifiedHue, // Regexp is used to match URL in the string given(see below).
  URL_REGEXP = "//[a-z0-9-_]+(.[a-z0-9-_]+)+([a-z0-9-_.,@?^=%&;:/~+#]*[a-z0-9-@?^=%&;/~+#])?", CURSOR_TYPES = [ "default", "pointer" ], CURSOR_SYNONYMS = {
    _default: "auto"
  }, // Map cursor: auto -> cursor: default
  SITECUES_CURSOR_CSS_ID = "sitecues-js-cursor", SITECUES_BP_CURSOR_CSS_ID = "sitecues-js-bp-cursor", MIN_BP_CURSOR_SIZE = 1.9, REENABLE_CURSOR_MS = 20, ajaxCursors = {}, MAX_USER_SPECIFIED_CURSOR_SIZE = 3.5, MAX_USER_SPECIFIED_MOUSE_HUE = 1.09;
  /*
   * Change a style rule in the sitecues-cursor stylesheet to use the new cursor URL
   * @param {Object CSSStyleRule} rule CSSStyleRule
   * @param {String} cursorValueURL  Example: 'url(data:image/svg+xml,%3....)0 8, default'
   * @returns {void}
   */
  function setCursorStyle(rule, cursorValueURL) {
    try {
      if (platform.browser.isWebKit) {
        // Hack .. wake up Chrome and Safari! They weren't refreshing the rule on hue-only changes
        // E.g. when you drag the mouse hue slider you should see instant changes
        rule.style.setProperty("cursor", "", "important");
      }
      rule.style.setProperty("cursor", cursorValueURL, "important");
    } catch (e) {
      if (true) {
        console.log("Catch setting cursor property: %o", e);
      }
    }
  }
  function isCursorReadyToUse(url) {
    if (!ajaxCursors[url]) {
      return false;
    }
    // Ready to use if it's fetch is complete
    return ajaxCursors[url].isComplete;
  }
  function flushPendingCursorRules(url) {
    var ajaxCursor = ajaxCursors[url], cursorValue = ajaxCursor.cursorValue;
    ajaxCursor.isComplete = true;
    ajaxCursor.pendingRules.forEach(function(rule) {
      setCursorStyle(rule, cursorValue);
    });
  }
  // Begin to fetch the cursor if it's the first
  // attempt to use
  function beginCursorFetchIfFirst(rule, url, cursorValue) {
    if (ajaxCursors[url]) {
      // Fetch for this URL has already begin, don't start another one
      ajaxCursors[url].pendingRules.push(rule);
      return;
    }
    ajaxCursors[url] = {
      isFetched: false,
      cursorValue: cursorValue,
      pendingRules: [ rule ]
    };
    sitecues.require([ "run/util/xhr" ], function(xhr) {
      xhr.get({
        url: url,
        crossDomain: true,
        headers: {
          Accept: "application/octet-stream"
        },
        success: function() {
          if (true) {
            console.log("Loading of CUR file completed!");
          }
          flushPendingCursorRules(url);
        },
        error: function() {
          if (true) {
            console.log("[Error] Unable to fetch cursor image from server: " + url);
          }
        }
      });
    });
  }
  /**
   * We want to async load the cursor images before they used, for performance benefit.
   * For ex., if the image isn't available for some reason then don't wait for it,
   * go to another operation.
   *
   * @param {String} cursorValue  Example: "url(data:image/svg+xml,%3....)0 8, auto"
   * @param {Function} callback A function called after the ajax request completed
   * @returns {void}
   */
  function setCursorStyleWhenReady(rule, cursorValue) {
    function getUrlFromCursorValue() {
      var urlRegexp = new RegExp(URL_REGEXP, "i"), cursorValueArray = urlRegexp.exec(cursorValue);
      return cursorValueArray[0];
    }
    var url = getUrlFromCursorValue();
    if (!platform.browser.isMS || isCursorReadyToUse(url)) {
      // No prefetch needed
      setCursorStyle(rule, cursorValue);
    } else {
      beginCursorFetchIfFirst(rule, url, cursorValue);
    }
  }
  /**
   * Does the given URL value match the cursor type?
   * @param cursorType
   * @param url
   * @returns {boolean}
   */
  function isCursorOfType(cursorType, url) {
    if (url.indexOf(cursorType) > -1) {
      return true;
    }
    var synonym = CURSOR_SYNONYMS["_" + cursorType];
    return synonym && url.indexOf(synonym) > -1;
  }
  /**
   * Refresh all cursor rules in the sitecues-cursor stylesheet, mapping them to cursorTypeUrls
   * @param cursorTypeUrls
   */
  function refreshCursorStyles(styleSheet, cursorTypeUrls) {
    if (!styleSheet || !styleSheet.cssRules) {
      return;
    }
    var cursorTypeIndex, cursorType, rules = styleSheet.cssRules, numRules = rules.length, ruleIndex = 0;
    for (;ruleIndex < numRules; ruleIndex++) {
      var rule = rules[ruleIndex], value = rule.style.cursor;
      // Find the cursor type (auto, pointer, etc) and replace the style with our generated image.
      for (cursorTypeIndex = 0; cursorTypeIndex < CURSOR_TYPES.length; cursorTypeIndex++) {
        cursorType = CURSOR_TYPES[cursorTypeIndex];
        if (isCursorOfType(cursorType, value)) {
          var cursorValueURL = cursorTypeUrls[cursorType];
          setCursorStyleWhenReady(rule, cursorValueURL);
        }
      }
    }
  }
  // Turning off custom cursor improves zoom animation in IE
  function toggleZoomOptimization(doDisable) {
    if (platform.browser.isMS) {
      // Only necessary for MS Browsers
      // Still seems to help in Edge as of version 13
      // The style service may not have initialized
      if (cursorStylesheetObject) {
        cursorStylesheetObject.disabled = Boolean(doDisable);
      }
    }
  }
  function createStyleSheet(id, cssText) {
    return $("<style>").appendTo("head").attr("id", id).text(cssText);
  }
  function getCursorStylesAsText() {
    // Use all cursor styles from the user agent stylesheet and the page
    var cursorStyleSubset = styleService.getAllMatchingStyles("cursor");
    return styleService.getStyleText(cursorStyleSubset, "cursor");
  }
  // Create a stylesheet with only the cursor-related style rules
  function constructCursorStylesheet(callback) {
    var cssText = getCursorStylesAsText();
    // Create the sitecues <style id="sitecues-js-cursor"> element and content
    $stylesheet = createStyleSheet(SITECUES_CURSOR_CSS_ID, cssText);
    // Now set the cursorStyles global to the rules in the cursor style sheet.
    // The refresh methods will iterate over these styles and modify them
    styleService.getDOMStylesheet($stylesheet, function(styleSheetObject) {
      cursorStylesheetObject = styleSheetObject;
      callback();
    });
    // While zooming, turn off our CSS rules so that the browser doesn't spend
    // CPU cycles recalculating the custom cursor rules to apply during each frame
    // This makes a difference in IE 9/10 -- doesn't seem to help in other browsers.
    events.on("zoom/begin", function() {
      toggleZoomOptimization(true);
    });
  }
  // Stylesheet just for BP cursors
  // The cursors have a minimum size, and are NOT disabled during smooth zoom for performance,
  // as opposed to the page cursors, which can be disabled during smooth zoom for performance
  function constructBPCursorStylesheet() {
    var cssText = "#scp-bp-container,.scp-toolbar {cursor:default;}\n.scp-hand-cursor {cursor:pointer}";
    $bpStylesheet = createStyleSheet(SITECUES_BP_CURSOR_CSS_ID, cssText);
    styleService.getDOMStylesheet($bpStylesheet, function(styleSheetObject) {
      bpCursorStylesheetObject = styleSheetObject;
    });
  }
  /**
   * Generates a CSS cursor property for every supported
   * cursor type at the current zoom level and then changes
   * all cursor properties in the <style id="sitecues-js-cursor">
   */
  function doRefresh() {
    // Get cursor URLs for current zoom levels
    var useCursorZoom = userSpecifiedSize || autoSize, cursorTypeUrls = getCursorTypeUrls(useCursorZoom), useDifferentBpSizes = !userSpecifiedSize && autoSize < MIN_BP_CURSOR_SIZE, bpCursorTypeUrls = useDifferentBpSizes ? getCursorTypeUrls(MIN_BP_CURSOR_SIZE) : cursorTypeUrls;
    // Refresh document cursor stylesheet if we're using one
    if (cursorStylesheetObject) {
      refreshCursorStyles(cursorStylesheetObject, cursorTypeUrls);
      nativeGlobal.setTimeout(toggleZoomOptimization, REENABLE_CURSOR_MS);
    }
    // Refresh BP cursor stylesheet
    if (bpCursorStylesheetObject) {
      refreshCursorStyles(bpCursorStylesheetObject, bpCursorTypeUrls);
    }
  }
  function isCustomCursorNeeded() {
    return autoSize > 1 || userSpecifiedSize || userSpecifiedHue;
  }
  function refreshStylesheetsIfNecessary() {
    if (!isCustomCursorNeeded()) {
      // Cursor is normal size or no custom cursor allowed right now
      if ($stylesheet) {
        $stylesheet.remove();
        $stylesheet = null;
      }
      doRefresh();
    } else {
      if (!$stylesheet) {
        styleService.init(function() {
          constructCursorStylesheet(doRefresh);
        });
      } else {
        doRefresh();
      }
    }
  }
  /**
   * Get the cursor URLs to support the current cursorZoom level
   * @returns {Array} Array of cursor URLS
   */
  function getCursorTypeUrls(size) {
    var cursorTypeUrls = [], i = 0, doUseMSCursors = platform.browser.isMS;
    // Generate cursor images for every cursor type...
    for (;i < CURSOR_TYPES.length; i++) {
      // Don't use hotspotOffset in IE because that's part of the .cur file.
      var type = CURSOR_TYPES[i], css = cursorCss.getCursorCss(type, size, doUseMSCursors, getRealUserHue());
      cursorTypeUrls[CURSOR_TYPES[i]] = css;
    }
    return cursorTypeUrls;
  }
  function onMouseSizeSetting(size) {
    userSpecifiedSize = size;
    styleService.init(refreshStylesheetsIfNecessary);
  }
  function onMouseHueSetting(hue) {
    userSpecifiedHue = hue;
    styleService.init(refreshStylesheetsIfNecessary);
  }
  function sanitizeMouseSize(size) {
    return Math.min(Math.max(size, 1), MAX_USER_SPECIFIED_CURSOR_SIZE);
  }
  function sanitizeMouseHue(hue) {
    if (!hue || hue < 0 || hue > MAX_USER_SPECIFIED_MOUSE_HUE) {
      return 0;
    }
    return hue;
  }
  function getRealUserHue() {
    return userSpecifiedHue > 0 && userSpecifiedHue <= 1 ? userSpecifiedHue : 0;
  }
  // Get the auto size for the cursor at the supplied page zoom level, or at the current page zoom if none supplied
  function getSize(pageZoom) {
    return userSpecifiedSize || cursorCss.getCursorZoom(pageZoom || pref.get("zoom") || 1);
  }
  function onPageZoom(pageZoom) {
    if (userSpecifiedSize) {
      toggleZoomOptimization();
      // Re-enable cursors -- they were disabled for zoom performance in IE
      return;
    }
    // At page zoom level 1.0, the cursor is the default size (same as us being off).
    // After that, the cursor grows faster than the zoom level, maxing out at 4x at zoom level 3
    var newCursorZoom = cursorCss.getCursorZoom(pageZoom);
    if (autoSize !== newCursorZoom) {
      autoSize = newCursorZoom;
      refreshStylesheetsIfNecessary();
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    pref.defineHandler("mouseSize", sanitizeMouseSize);
    pref.defineHandler("mouseHue", sanitizeMouseHue);
    pref.bindListener("mouseSize", onMouseSizeSetting);
    pref.bindListener("mouseHue", onMouseHueSetting);
    events.on("zoom", onPageZoom);
    constructBPCursorStylesheet();
    autoSize = getSize();
    refreshStylesheetsIfNecessary();
  }
  return {
    init: init,
    getSize: getSize
  };
});

sitecues.define("page/page", [ "page/reset/reset", "page/keys/keys", "page/keys/commands", "page/util/element-classifier", "page/highlight/highlight", "page/util/common", "page/highlight/move-keys", "page/zoom/zoom", "page/hpan/hpan", "page/positioner/positioner", "page/focus/focus", "page/cursor/cursor", "page/zoom/util/body-geometry", "page/zoom/util/restrict-zoom", "page/viewport/viewport", "page/viewport/scrollbars", "page/zoom/config/config", "page/zoom/animation", "page/zoom/constants", "page/zoom/state", "page/zoom/style" ], function(reset) {
  function init() {
    reset.init();
  }
  return {
    init: init
  };
});

sitecues.define("page", function() {});
//# sourceMappingURL=page.js.map