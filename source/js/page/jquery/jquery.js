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


( function( global, factory ) {

  "use strict";

  if ( typeof module === "object" && typeof module.exports === "object" ) {

    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get jQuery.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    // This accentuates the need for the creation of a real `window`.
    // e.g. var jQuery = require("jquery")(window);
    // See ticket #14549 for more info.
    module.exports = global.document ?
      factory( global, true ) :
      function( w ) {
        if ( !w.document ) {
          throw new Error( "jQuery requires a window with a document" );
        }
        return factory( w );
      };
  } else {
    factory( global );
  }

// Pass this if window is not defined yet
}( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
  "use strict";

  // Recover potentially overridden window methods from a nested browsing context
  function getNativeWindow() {
    // jshint -W117
    return SC_EXTENSION ? window : sitecues._getHelperFrame('sitecues-context').contentWindow;
    // jshint +W117
  }

  function cacheSetTimeoutReference() {
    return getNativeWindow().setTimeout.bind(window);
  }

  function cacheJSONReference() {
    return getNativeWindow().JSON;
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

  var ObjectFunctionString = fnToString.call( Object );

  var support = {};

  function DOMEval( code, doc ) {
    doc = doc || document;

    var script = doc.createElement( "script" );

    script.text = code;
    doc.head.appendChild( script ).parentNode.removeChild( script );
  }


  var
    version = "3.0.0",

  // Define a local copy of jQuery
    jQuery = function( selector, context ) {

      // The jQuery object is actually just the init constructor 'enhanced'
      // Need init if jQuery is called (just allow error to be thrown if not included)
      return new jQuery.fn.init( selector, context );
    },

  // Support: Android <=4.0 only
  // Make sure we trim BOM and NBSP
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

  // Matches dashed string for camelizing
    rmsPrefix = /^-ms-/,
    rdashAlpha = /-([a-z])/g,

  // Used by jQuery.camelCase as callback to replace()
    fcamelCase = function( all, letter ) {
      return letter.toUpperCase();
    };

  jQuery.fn = jQuery.prototype = {

    // The current version of jQuery being used
    jquery: version,

    constructor: jQuery,

    // The default length of a jQuery object is 0
    length: 0,

    toArray: function() {
      return slice.call( this );
    },

    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function( num ) {
      return num != null ?

        // Return just the one element from the set
        ( num < 0 ? this[ num + this.length ] : this[ num ] ) :

        // Return all the elements in a clean array
        slice.call( this );
    },

    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function( elems ) {

      // Build a new jQuery matched element set
      var ret = jQuery.merge( this.constructor(), elems );

      // Add the old object onto the stack (as a reference)
      ret.prevObject = this;

      // Return the newly-formed element set
      return ret;
    },

    // Execute a callback for every element in the matched set.
    each: function( callback ) {
      return jQuery.each( this, callback );
    },

    map: function( callback ) {
      return this.pushStack( jQuery.map( this, function( elem, i ) {
        return callback.call( elem, i, elem );
      } ) );
    },

    slice: function() {
      return this.pushStack( slice.apply( this, arguments ) );
    },

    first: function() {
      return this.eq( 0 );
    },

    last: function() {
      return this.eq( -1 );
    },

    eq: function( i ) {
      var len = this.length,
        j = +i + ( i < 0 ? len : 0 );
      return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
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
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[ 0 ] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
      deep = target;

      // Skip the boolean and the target
      target = arguments[ i ] || {};
      i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
      target = {};
    }

    // Extend jQuery itself if only one argument is passed
    if ( i === length ) {
      target = this;
      i--;
    }

    for ( ; i < length; i++ ) {

      // Only deal with non-null/undefined values
      if ( ( options = arguments[ i ] ) != null ) {

        // Extend the base object
        for ( name in options ) {
          src = target[ name ];
          copy = options[ name ];

          // Prevent never-ending loop
          if ( target === copy ) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
            ( copyIsArray = jQuery.isArray( copy ) ) ) ) {

            if ( copyIsArray ) {
              copyIsArray = false;
              clone = src && jQuery.isArray( src ) ? src : [];

            } else {
              clone = src && jQuery.isPlainObject( src ) ? src : {};
            }

            // Never move original objects, clone them
            target[ name ] = jQuery.extend( deep, clone, copy );

            // Don't bring in undefined values
          } else if ( copy !== undefined ) {
            target[ name ] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  jQuery.extend( {

    // Unique for each copy of jQuery on the page
    expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

    // Assume jQuery is ready without the ready module
    isReady: true,

    error: function( msg ) {
      throw new Error( msg );
    },

    noop: function() {},

    isFunction: function( obj ) {
      return jQuery.type( obj ) === "function";
    },

    isArray: Array.isArray,

    isWindow: function( obj ) {
      return obj != null && obj === obj.window;
    },

    isNumeric: function( obj ) {

      // As of jQuery 3.0, isNumeric is limited to
      // strings and numbers (primitives or objects)
      // that can be coerced to finite numbers (gh-2662)
      var type = jQuery.type( obj );
      return ( type === "number" || type === "string" ) &&

          // parseFloat NaNs numeric-cast false positives ("")
          // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
          // subtraction forces infinities to NaN
        !isNaN( obj - parseFloat( obj ) );
    },

    isPlainObject: function( obj ) {
      var proto, Ctor;

      // Detect obvious negatives
      // Use toString instead of jQuery.type to catch host objects
      if ( !obj || toString.call( obj ) !== "[object Object]" ) {
        return false;
      }

      proto = getProto( obj );

      // Objects with no prototype (e.g., `Object.create( null )`) are plain
      if ( !proto ) {
        return true;
      }

      // Objects with prototype are plain iff they were constructed by a global Object function
      Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
      return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
    },

    isEmptyObject: function( obj ) {
      var name;
      for ( name in obj ) {
        return false;
      }
      return true;
    },

    type: function( obj ) {
      if ( obj == null ) {
        return obj + "";
      }

      // Support: Android <=2.3 only (functionish RegExp)
      return typeof obj === "object" || typeof obj === "function" ?
      class2type[ toString.call( obj ) ] || "object" :
        typeof obj;
    },

    // Evaluates a script in a global context
    globalEval: function( code ) {
      DOMEval( code );
    },

    // Convert dashed to camelCase; used by the css and data modules
    // Support: IE <=9 - 11, Edge 12 - 13
    // Microsoft forgot to hump their vendor prefix (#9572)
    camelCase: function( string ) {
      return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    },

    nodeName: function( elem, name ) {
      return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    },

    each: function( obj, callback ) {
      var length, i = 0;

      if ( isArrayLike( obj ) ) {
        length = obj.length;
        for ( ; i < length; i++ ) {
          if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
            break;
          }
        }
      } else {
        for ( i in obj ) {
          if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
            break;
          }
        }
      }

      return obj;
    },

    // Support: Android <=4.0 only
    trim: function( text ) {
      return text == null ?
        "" :
        ( text + "" ).replace( rtrim, "" );
    },

    // results is for internal usage only
    makeArray: function( arr, results ) {
      var ret = results || [];

      if ( arr != null ) {
        if ( isArrayLike( Object( arr ) ) ) {
          jQuery.merge( ret,
            typeof arr === "string" ?
              [ arr ] : arr
          );
        } else {
          push.call( ret, arr );
        }
      }

      return ret;
    },

    inArray: function( elem, arr, i ) {
      return arr == null ? -1 : indexOf.call( arr, elem, i );
    },

    // Support: Android <=4.0 only, PhantomJS 1 only
    // push.apply(_, arraylike) throws on ancient WebKit
    merge: function( first, second ) {
      var len = +second.length,
        j = 0,
        i = first.length;

      for ( ; j < len; j++ ) {
        first[ i++ ] = second[ j ];
      }

      first.length = i;

      return first;
    },

    grep: function( elems, callback, invert ) {
      var callbackInverse,
        matches = [],
        i = 0,
        length = elems.length,
        callbackExpect = !invert;

      // Go through the array, only saving the items
      // that pass the validator function
      for ( ; i < length; i++ ) {
        callbackInverse = !callback( elems[ i ], i );
        if ( callbackInverse !== callbackExpect ) {
          matches.push( elems[ i ] );
        }
      }

      return matches;
    },

    // arg is for internal usage only
    map: function( elems, callback, arg ) {
      var length, value,
        i = 0,
        ret = [];

      // Go through the array, translating each of the items to their new values
      if ( isArrayLike( elems ) ) {
        length = elems.length;
        for ( ; i < length; i++ ) {
          value = callback( elems[ i ], i, arg );

          if ( value != null ) {
            ret.push( value );
          }
        }

        // Go through every key on the object,
      } else {
        for ( i in elems ) {
          value = callback( elems[ i ], i, arg );

          if ( value != null ) {
            ret.push( value );
          }
        }
      }

      // Flatten any nested arrays
      return concat.apply( [], ret );
    },

    // A global GUID counter for objects
    guid: 1,

    // Bind a function to a context, optionally partially applying any
    // arguments.
    proxy: function( fn, context ) {
      var tmp, args, proxy;

      if ( typeof context === "string" ) {
        tmp = fn[ context ];
        context = fn;
        fn = tmp;
      }

      // Quick check to determine if target is callable, in the spec
      // this throws a TypeError, but we will just return undefined.
      if ( !jQuery.isFunction( fn ) ) {
        return undefined;
      }

      // Simulated bind
      args = slice.call( arguments, 2 );
      proxy = function() {
        return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
      };

      // Set the guid of unique handler to the same of original handler, so it can be removed
      proxy.guid = fn.guid = fn.guid || jQuery.guid++;

      return proxy;
    },

    now: Date.now,

    // jQuery.support is not used in Core but other projects attach their
    // properties to it so it needs to exist.
    support: support
  } );

// JSHint would error on this code due to the Symbol not being defined in ES5.
// Defining this global in .jshintrc would create a danger of using the global
// unguarded in another place, it seems safer to just disable JSHint for these
// three lines.
  /* jshint ignore: start */
  if ( typeof Symbol === "function" ) {
    jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
  }
  /* jshint ignore: end */

// Populate the class2type map
  jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
    function( i, name ) {
      class2type[ "[object " + name + "]" ] = name.toLowerCase();
    } );

  function isArrayLike( obj ) {

    // Support: real iOS 8.2 only (not reproducible in simulator)
    // `in` check used to prevent JIT error (gh-2145)
    // hasOwn isn't used here due to false negatives
    // regarding Nodelist length in IE
    var length = !!obj && "length" in obj && obj.length,
      type = jQuery.type( obj );

    if ( type === "function" || jQuery.isWindow( obj ) ) {
      return false;
    }

    return type === "array" || length === 0 ||
      typeof length === "number" && length > 0 && ( length - 1 ) in obj;
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

  var hasDuplicate, sortInput,
    sortStable = jQuery.expando.split( "" ).sort( sortOrder ).join( "" ) === jQuery.expando,
    matches = documentElement.matches ||
      documentElement.webkitMatchesSelector ||
      documentElement.mozMatchesSelector ||
      documentElement.oMatchesSelector ||
      documentElement.msMatchesSelector,

  // CSS string/identifier serialization
  // https://drafts.csswg.org/cssom/#common-serializing-idioms
    rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g,
    fcssescape = function( ch, asCodePoint ) {
      if ( asCodePoint ) {

        // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
        if ( ch === "\0" ) {
          return "\uFFFD";
        }

        // Control characters and (dependent upon position) numbers get escaped as code points
        return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
      }

      // Other potentially-special ASCII characters get backslash-escaped
      return "\\" + ch;
    };

  function sortOrder( a, b ) {

    // Flag for duplicate removal
    if ( a === b ) {
      hasDuplicate = true;
      return 0;
    }

    // Sort on method existence if only one input has compareDocumentPosition
    var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
    if ( compare ) {
      return compare;
    }

    // Calculate position if both inputs belong to the same document
    compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
      a.compareDocumentPosition( b ) :

      // Otherwise we know they are disconnected
      1;

    // Disconnected nodes
    if ( compare & 1 ) {

      // Choose the first element that is related to our preferred document
      if ( a === document || a.ownerDocument === document &&
        jQuery.contains( document, a ) ) {
        return -1;
      }
      if ( b === document || b.ownerDocument === document &&
        jQuery.contains( document, b ) ) {
        return 1;
      }

      // Maintain original order
      return sortInput ?
        ( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
        0;
    }

    return compare & 4 ? -1 : 1;
  }

  function uniqueSort( results ) {
    var elem,
      duplicates = [],
      j = 0,
      i = 0;

    hasDuplicate = false;
    sortInput = !sortStable && results.slice( 0 );
    results.sort( sortOrder );

    if ( hasDuplicate ) {
      while ( ( elem = results[ i++ ] ) ) {
        if ( elem === results[ i ] ) {
          j = duplicates.push( i );
        }
      }
      while ( j-- ) {
        results.splice( duplicates[ j ], 1 );
      }
    }

    // Clear input after sorting to release objects
    // See https://github.com/jquery/sizzle/pull/225
    sortInput = null;

    return results;
  }

  function escape( sel ) {
    return ( sel + "" ).replace( rcssescape, fcssescape );
  }

  jQuery.extend( {
    uniqueSort: uniqueSort,
    unique: uniqueSort,
    escapeSelector: escape,
    find: function( selector, context, results, seed ) {
      var elem, nodeType,
        i = 0;

      results = results || [];
      context = context || document;

      // Same basic safeguard as Sizzle
      if ( !selector || typeof selector !== "string" ) {
        return results;
      }

      // Early return if context is not an element or document
      if ( ( nodeType = context.nodeType ) !== 1 && nodeType !== 9 ) {
        return [];
      }

      if ( seed ) {
        while ( ( elem = seed[ i++ ] ) ) {
          if ( jQuery.find.matchesSelector( elem, selector ) ) {
            results.push( elem );
          }
        }
      } else {
        jQuery.merge( results, context.querySelectorAll( selector ) );
      }

      return results;
    },
    text: function( elem ) {
      var node,
        ret = "",
        i = 0,
        nodeType = elem.nodeType;

      if ( !nodeType ) {

        // If no nodeType, this is expected to be an array
        while ( ( node = elem[ i++ ] ) ) {

          // Do not traverse comment nodes
          ret += jQuery.text( node );
        }
      } else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {

        // Use textContent for elements
        return elem.textContent;
      } else if ( nodeType === 3 || nodeType === 4 ) {
        return elem.nodeValue;
      }

      // Do not include comment or processing instruction nodes

      return ret;
    },
    contains: function( a, b ) {
      var adown = a.nodeType === 9 ? a.documentElement : a,
        bup = b && b.parentNode;
      return a === bup || !!( bup && bup.nodeType === 1 && adown.contains( bup ) );
    },
    isXMLDoc: function( elem ) {

      // documentElement is verified for cases where it doesn't yet exist
      // (such as loading iframes in IE - #4833)
      var documentElement = elem && ( elem.ownerDocument || elem ).documentElement;
      return documentElement ? documentElement.nodeName !== "HTML" : false;
    },
    expr: {
      attrHandle: {},
      match: {
        bool: new RegExp( "^(?:checked|selected|async|autofocus|autoplay|controls|defer" +
          "|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$", "i" ),
        needsContext: /^[\x20\t\r\n\f]*[>+~]/
      }
    }
  } );

  jQuery.extend( jQuery.find, {
    matches: function( expr, elements ) {
      return jQuery.find( expr, null, null, elements );
    },
    matchesSelector: function( elem, expr ) {
      return matches.call( elem, expr );
    },
    attr: function( elem, name ) {
      var fn = jQuery.expr.attrHandle[ name.toLowerCase() ],

      // Don't get fooled by Object.prototype properties (jQuery #13807)
        value = fn && hasOwn.call( jQuery.expr.attrHandle, name.toLowerCase() ) ?
          fn( elem, name, jQuery.isXMLDoc( elem ) ) :
          undefined;
      return value !== undefined ? value : elem.getAttribute( name );
    }
  } );



  var dir = function( elem, dir, until ) {
    var matched = [],
      truncate = until !== undefined;

    while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
      if ( elem.nodeType === 1 ) {
        if ( truncate && jQuery( elem ).is( until ) ) {
          break;
        }
        matched.push( elem );
      }
    }
    return matched;
  };


  var siblings = function( n, elem ) {
    var matched = [];

    for ( ; n; n = n.nextSibling ) {
      if ( n.nodeType === 1 && n !== elem ) {
        matched.push( n );
      }
    }

    return matched;
  };


  var rneedsContext = jQuery.expr.match.needsContext;

  var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



  var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
  function winnow( elements, qualifier, not ) {
    if ( jQuery.isFunction( qualifier ) ) {
      return jQuery.grep( elements, function( elem, i ) {
        /* jshint -W018 */
        return !!qualifier.call( elem, i, elem ) !== not;
      } );

    }

    if ( qualifier.nodeType ) {
      return jQuery.grep( elements, function( elem ) {
        return ( elem === qualifier ) !== not;
      } );

    }

    if ( typeof qualifier === "string" ) {
      if ( risSimple.test( qualifier ) ) {
        return jQuery.filter( qualifier, elements, not );
      }

      qualifier = jQuery.filter( qualifier, elements );
    }

    return jQuery.grep( elements, function( elem ) {
      return ( indexOf.call( qualifier, elem ) > -1 ) !== not && elem.nodeType === 1;
    } );
  }

  jQuery.filter = function( expr, elems, not ) {
    var elem = elems[ 0 ];

    if ( not ) {
      expr = ":not(" + expr + ")";
    }

    return elems.length === 1 && elem.nodeType === 1 ?
      jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
      jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
        return elem.nodeType === 1;
      } ) );
  };

  jQuery.fn.extend( {
    find: function( selector ) {
      var i, ret,
        len = this.length,
        self = this;

      if ( typeof selector !== "string" ) {
        return this.pushStack( jQuery( selector ).filter( function() {
          for ( i = 0; i < len; i++ ) {
            if ( jQuery.contains( self[ i ], this ) ) {
              return true;
            }
          }
        } ) );
      }

      ret = this.pushStack( [] );

      for ( i = 0; i < len; i++ ) {
        jQuery.find( selector, self[ i ], ret );
      }

      return len > 1 ? jQuery.uniqueSort( ret ) : ret;
    },
    filter: function( selector ) {
      return this.pushStack( winnow( this, selector || [], false ) );
    },
    not: function( selector ) {
      return this.pushStack( winnow( this, selector || [], true ) );
    },
    is: function( selector ) {
      return !!winnow(
        this,

        // If this is a positional/relative selector, check membership in the returned set
        // so $("p:first").is("p:last") won't return true for a doc with two "p".
        typeof selector === "string" && rneedsContext.test( selector ) ?
          jQuery( selector ) :
        selector || [],
        false
      ).length;
    }
  } );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
  var rootjQuery,

  // A simple way to check for HTML strings
  // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
  // Strict HTML recognition (#11290: must start with <)
  // Shortcut simple #id case for speed
    rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

    init = jQuery.fn.init = function( selector, context, root ) {
      var match, elem;

      // HANDLE: $(""), $(null), $(undefined), $(false)
      if ( !selector ) {
        return this;
      }

      // Method init() accepts an alternate rootjQuery
      // so migrate can support jQuery.sub (gh-2101)
      root = root || rootjQuery;

      // Handle HTML strings
      if ( typeof selector === "string" ) {
        if ( selector[ 0 ] === "<" &&
          selector[ selector.length - 1 ] === ">" &&
          selector.length >= 3 ) {

          // Assume that strings that start and end with <> are HTML and skip the regex check
          match = [ null, selector, null ];

        } else {
          match = rquickExpr.exec( selector );
        }

        // Match html or make sure no context is specified for #id
        if ( match && ( match[ 1 ] || !context ) ) {

          // HANDLE: $(html) -> $(array)
          if ( match[ 1 ] ) {
            context = context instanceof jQuery ? context[ 0 ] : context;

            // Option to run scripts is true for back-compat
            // Intentionally let the error be thrown if parseHTML is not present
            jQuery.merge( this, jQuery.parseHTML(
              match[ 1 ],
              context && context.nodeType ? context.ownerDocument || context : document,
              true
            ) );

            // HANDLE: $(html, props)
            if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
              for ( match in context ) {

                // Properties of context are called as methods if possible
                if ( jQuery.isFunction( this[ match ] ) ) {
                  this[ match ]( context[ match ] );

                  // ...and otherwise set as attributes
                } else {
                  this.attr( match, context[ match ] );
                }
              }
            }

            return this;

            // HANDLE: $(#id)
          } else {
            elem = document.getElementById( match[ 2 ] );

            if ( elem ) {

              // Inject the element directly into the jQuery object
              this[ 0 ] = elem;
              this.length = 1;
            }
            return this;
          }

          // HANDLE: $(expr, $(...))
        } else if ( !context || context.jquery ) {
          return ( context || root ).find( selector );

          // HANDLE: $(expr, context)
          // (which is just equivalent to: $(context).find(expr)
        } else {
          return this.constructor( context ).find( selector );
        }

        // HANDLE: $(DOMElement)
      } else if ( selector.nodeType ) {
        this[ 0 ] = selector;
        this.length = 1;
        return this;

        // HANDLE: $(function)
        // Shortcut for document ready
      } else if ( jQuery.isFunction( selector ) ) {
        return root.ready !== undefined ?
          root.ready( selector ) :

          // Execute immediately if ready is not present
          selector( jQuery );
      }

      return jQuery.makeArray( selector, this );
    };

// Give the init function the jQuery prototype for later instantiation
  init.prototype = jQuery.fn;

// Initialize central reference
  rootjQuery = jQuery( document );


  var rparentsprev = /^(?:parents|prev(?:Until|All))/,

  // Methods guaranteed to produce a unique set when starting from a unique set
    guaranteedUnique = {
      children: true,
      contents: true,
      next: true,
      prev: true
    };

  jQuery.fn.extend( {
    has: function( target ) {
      var targets = jQuery( target, this ),
        l = targets.length;

      return this.filter( function() {
        var i = 0;
        for ( ; i < l; i++ ) {
          if ( jQuery.contains( this, targets[ i ] ) ) {
            return true;
          }
        }
      } );
    },

    closest: function( selectors, context ) {
      var cur,
        i = 0,
        l = this.length,
        matched = [],
        targets = typeof selectors !== "string" && jQuery( selectors );

      // Positional selectors never match, since there's no _selection_ context
      if ( !rneedsContext.test( selectors ) ) {
        for ( ; i < l; i++ ) {
          for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

            // Always skip document fragments
            if ( cur.nodeType < 11 && ( targets ?
              targets.index( cur ) > -1 :

                // Don't pass non-elements to Sizzle
              cur.nodeType === 1 &&
              jQuery.find.matchesSelector( cur, selectors ) ) ) {

              matched.push( cur );
              break;
            }
          }
        }
      }

      return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
    },

    // Determine the position of an element within the set
    index: function( elem ) {

      // No argument, return index in parent
      if ( !elem ) {
        return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
      }

      // Index in selector
      if ( typeof elem === "string" ) {
        return indexOf.call( jQuery( elem ), this[ 0 ] );
      }

      // Locate the position of the desired element
      return indexOf.call( this,

        // If it receives a jQuery object, the first element is used
        elem.jquery ? elem[ 0 ] : elem
      );
    },

    add: function( selector, context ) {
      return this.pushStack(
        jQuery.uniqueSort(
          jQuery.merge( this.get(), jQuery( selector, context ) )
        )
      );
    },

    addBack: function( selector ) {
      return this.add( selector == null ?
        this.prevObject : this.prevObject.filter( selector )
      );
    }
  } );

  function sibling( cur, dir ) {
    while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
    return cur;
  }

  jQuery.each( {
    parent: function( elem ) {
      var parent = elem.parentNode;
      return parent && parent.nodeType !== 11 ? parent : null;
    },
    parents: function( elem ) {
      return dir( elem, "parentNode" );
    },
    parentsUntil: function( elem, i, until ) {
      return dir( elem, "parentNode", until );
    },
    next: function( elem ) {
      return sibling( elem, "nextSibling" );
    },
    prev: function( elem ) {
      return sibling( elem, "previousSibling" );
    },
    nextAll: function( elem ) {
      return dir( elem, "nextSibling" );
    },
    prevAll: function( elem ) {
      return dir( elem, "previousSibling" );
    },
    nextUntil: function( elem, i, until ) {
      return dir( elem, "nextSibling", until );
    },
    prevUntil: function( elem, i, until ) {
      return dir( elem, "previousSibling", until );
    },
    siblings: function( elem ) {
      return siblings( ( elem.parentNode || {} ).firstChild, elem );
    },
    children: function( elem ) {
      return siblings( elem.firstChild );
    },
    contents: function( elem ) {
      return elem.contentDocument || jQuery.merge( [], elem.childNodes );
    }
  }, function( name, fn ) {
    jQuery.fn[ name ] = function( until, selector ) {
      var matched = jQuery.map( this, fn, until );

      if ( name.slice( -5 ) !== "Until" ) {
        selector = until;
      }

      if ( selector && typeof selector === "string" ) {
        matched = jQuery.filter( selector, matched );
      }

      if ( this.length > 1 ) {

        // Remove duplicates
        if ( !guaranteedUnique[ name ] ) {
          jQuery.uniqueSort( matched );
        }

        // Reverse order for parents* and prev-derivatives
        if ( rparentsprev.test( name ) ) {
          matched.reverse();
        }
      }

      return this.pushStack( matched );
    };
  } );
  var rnotwhite = ( /\S+/g );



// Convert String-formatted options into Object-formatted ones
  function createOptions( options ) {
    var object = {};
    jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
      object[ flag ] = true;
    } );
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
  jQuery.Callbacks = function( options ) {

    // Convert options from String-formatted to Object-formatted if needed
    // (we check in cache first)
    options = typeof options === "string" ?
      createOptions( options ) :
      jQuery.extend( {}, options );

    var // Flag to know if list is currently firing
      firing,

    // Last fire value for non-forgettable lists
      memory,

    // Flag to know if list was already fired
      fired,

    // Flag to prevent firing
      locked,

    // Actual callback list
      list = [],

    // Queue of execution data for repeatable lists
      queue = [],

    // Index of currently firing callback (modified by add/remove as needed)
      firingIndex = -1,

    // Fire callbacks
      fire = function() {

        // Enforce single-firing
        locked = options.once;

        // Execute callbacks for all pending executions,
        // respecting firingIndex overrides and runtime changes
        fired = firing = true;
        for ( ; queue.length; firingIndex = -1 ) {
          memory = queue.shift();
          while ( ++firingIndex < list.length ) {

            // Run callback and check for early termination
            if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
              options.stopOnFalse ) {

              // Jump to end and forget the data so .add doesn't re-fire
              firingIndex = list.length;
              memory = false;
            }
          }
        }

        // Forget the data if we're done with it
        if ( !options.memory ) {
          memory = false;
        }

        firing = false;

        // Clean up if we're done firing for good
        if ( locked ) {

          // Keep an empty list if we have data for future add calls
          if ( memory ) {
            list = [];

            // Otherwise, this object is spent
          } else {
            list = "";
          }
        }
      },

    // Actual Callbacks object
      self = {

        // Add a callback or a collection of callbacks to the list
        add: function() {
          if ( list ) {

            // If we have memory from a past run, we should fire after adding
            if ( memory && !firing ) {
              firingIndex = list.length - 1;
              queue.push( memory );
            }

            ( function add( args ) {
              jQuery.each( args, function( _, arg ) {
                if ( jQuery.isFunction( arg ) ) {
                  if ( !options.unique || !self.has( arg ) ) {
                    list.push( arg );
                  }
                } else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

                  // Inspect recursively
                  add( arg );
                }
              } );
            } )( arguments );

            if ( memory && !firing ) {
              fire();
            }
          }
          return this;
        },

        // Remove a callback from the list
        remove: function() {
          jQuery.each( arguments, function( _, arg ) {
            var index;
            while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
              list.splice( index, 1 );

              // Handle firing indexes
              if ( index <= firingIndex ) {
                firingIndex--;
              }
            }
          } );
          return this;
        },

        // Check if a given callback is in the list.
        // If no argument is given, return whether or not list has callbacks attached.
        has: function( fn ) {
          return fn ?
          jQuery.inArray( fn, list ) > -1 :
          list.length > 0;
        },

        // Remove all callbacks from the list
        empty: function() {
          if ( list ) {
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
          if ( !memory && !firing ) {
            list = memory = "";
          }
          return this;
        },
        locked: function() {
          return !!locked;
        },

        // Call all callbacks with the given context and arguments
        fireWith: function( context, args ) {
          if ( !locked ) {
            args = args || [];
            args = [ context, args.slice ? args.slice() : args ];
            queue.push( args );
            if ( !firing ) {
              fire();
            }
          }
          return this;
        },

        // Call all the callbacks with the given arguments
        fire: function() {
          self.fireWith( this, arguments );
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
  var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
    var i = 0,
      len = elems.length,
      bulk = key == null;

    // Sets many values
    if ( jQuery.type( key ) === "object" ) {
      chainable = true;
      for ( i in key ) {
        access( elems, fn, i, key[ i ], true, emptyGet, raw );
      }

      // Sets one value
    } else if ( value !== undefined ) {
      chainable = true;

      if ( !jQuery.isFunction( value ) ) {
        raw = true;
      }

      if ( bulk ) {

        // Bulk operations run against the entire set
        if ( raw ) {
          fn.call( elems, value );
          fn = null;

          // ...except when executing function values
        } else {
          bulk = fn;
          fn = function( elem, key, value ) {
            return bulk.call( jQuery( elem ), value );
          };
        }
      }

      if ( fn ) {
        for ( ; i < len; i++ ) {
          fn(
            elems[ i ], key, raw ?
              value :
              value.call( elems[ i ], i, fn( elems[ i ], key ) )
          );
        }
      }
    }

    return chainable ?
      elems :

      // Gets
      bulk ?
        fn.call( elems ) :
        len ? fn( elems[ 0 ], key ) : emptyGet;
  };
  var acceptData = function( owner ) {

    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    /* jshint -W018 */
    return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
  };




  function Data() {
    this.expando = jQuery.expando + Data.uid++;
  }

  Data.uid = 1;

  Data.prototype = {

    cache: function( owner ) {

      // Check if the owner object already has a cache
      var value = owner[ this.expando ];

      // If not, create one
      if ( !value ) {
        value = {};

        // We can accept data for non-element nodes in modern browsers,
        // but we should not, see #8335.
        // Always return an empty object.
        if ( acceptData( owner ) ) {

          // If it is a node unlikely to be stringify-ed or looped over
          // use plain assignment
          if ( owner.nodeType ) {
            owner[ this.expando ] = value;

            // Otherwise secure it in a non-enumerable property
            // configurable must be true to allow the property to be
            // deleted when data is removed
          } else {
            Object.defineProperty( owner, this.expando, {
              value: value,
              configurable: true
            } );
          }
        }
      }

      return value;
    },
    set: function( owner, data, value ) {
      var prop,
        cache = this.cache( owner );

      // Handle: [ owner, key, value ] args
      // Always use camelCase key (gh-2257)
      if ( typeof data === "string" ) {
        cache[ jQuery.camelCase( data ) ] = value;

        // Handle: [ owner, { properties } ] args
      } else {

        // Copy the properties one-by-one to the cache object
        for ( prop in data ) {
          cache[ jQuery.camelCase( prop ) ] = data[ prop ];
        }
      }
      return cache;
    },
    get: function( owner, key ) {
      return key === undefined ?
        this.cache( owner ) :

        // Always use camelCase key (gh-2257)
      owner[ this.expando ] && owner[ this.expando ][ jQuery.camelCase( key ) ];
    },
    access: function( owner, key, value ) {

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
      if ( key === undefined ||
        ( ( key && typeof key === "string" ) && value === undefined ) ) {

        return this.get( owner, key );
      }

      // When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //
      this.set( owner, key, value );

      // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]
      return value !== undefined ? value : key;
    },
    remove: function( owner, key ) {
      var i,
        cache = owner[ this.expando ];

      if ( cache === undefined ) {
        return;
      }

      if ( key !== undefined ) {

        // Support array or space separated string of keys
        if ( jQuery.isArray( key ) ) {

          // If key is an array of keys...
          // We always set camelCase keys, so remove that.
          key = key.map( jQuery.camelCase );
        } else {
          key = jQuery.camelCase( key );

          // If a key with the spaces exists, use it.
          // Otherwise, create an array by matching non-whitespace
          key = key in cache ?
            [ key ] :
            ( key.match( rnotwhite ) || [] );
        }

        i = key.length;

        while ( i-- ) {
          delete cache[ key[ i ] ];
        }
      }

      // Remove the expando if there's no more data
      if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

        // Support: Chrome <=35 - 45
        // Webkit & Blink performance suffers when deleting properties
        // from DOM nodes, so set to undefined instead
        // https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
        if ( owner.nodeType ) {
          owner[ this.expando ] = undefined;
        } else {
          delete owner[ this.expando ];
        }
      }
    },
    hasData: function( owner ) {
      var cache = owner[ this.expando ];
      return cache !== undefined && !jQuery.isEmptyObject( cache );
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

  var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
    rmultiDash = /[A-Z]/g;

  function dataAttr( elem, key, data ) {
    var name;

    // If nothing was found internally, try to fetch any
    // data from the HTML5 data-* attribute
    if ( data === undefined && elem.nodeType === 1 ) {
      name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
      data = elem.getAttribute( name );

      if ( typeof data === "string" ) {
        try {
          data = data === "true" ? true :
            data === "false" ? false :
              data === "null" ? null :

                // Only convert to a number if it doesn't change the string
                +data + "" === data ? +data :
                  rbrace.test( data ) ? JSON.parse( data ) :
                    data;
        } catch ( e ) {}

        // Make sure we set the data so it isn't changed later
        dataUser.set( elem, key, data );
      } else {
        data = undefined;
      }
    }
    return data;
  }

  jQuery.extend( {
    hasData: function( elem ) {
      return dataUser.hasData( elem ) || dataPriv.hasData( elem );
    },

    data: function( elem, name, data ) {
      return dataUser.access( elem, name, data );
    },

    removeData: function( elem, name ) {
      dataUser.remove( elem, name );
    },

    // TODO: Now that all calls to _data and _removeData have been replaced
    // with direct calls to dataPriv methods, these can be deprecated.
    _data: function( elem, name, data ) {
      return dataPriv.access( elem, name, data );
    },

    _removeData: function( elem, name ) {
      dataPriv.remove( elem, name );
    }
  } );

  jQuery.fn.extend( {
    data: function( key, value ) {
      var i, name, data,
        elem = this[ 0 ],
        attrs = elem && elem.attributes;

      // Gets all values
      if ( key === undefined ) {
        if ( this.length ) {
          data = dataUser.get( elem );

          if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
            i = attrs.length;
            while ( i-- ) {

              // Support: IE 11 only
              // The attrs elements can be null (#14894)
              if ( attrs[ i ] ) {
                name = attrs[ i ].name;
                if ( name.indexOf( "data-" ) === 0 ) {
                  name = jQuery.camelCase( name.slice( 5 ) );
                  dataAttr( elem, name, data[ name ] );
                }
              }
            }
            dataPriv.set( elem, "hasDataAttrs", true );
          }
        }

        return data;
      }

      // Sets multiple values
      if ( typeof key === "object" ) {
        return this.each( function() {
          dataUser.set( this, key );
        } );
      }

      return access( this, function( value ) {
        var data;

        // The calling jQuery object (element matches) is not empty
        // (and therefore has an element appears at this[ 0 ]) and the
        // `value` parameter was not undefined. An empty jQuery object
        // will result in `undefined` for elem = this[ 0 ] which will
        // throw an exception if an attempt to read a data cache is made.
        if ( elem && value === undefined ) {

          // Attempt to get data from the cache
          // The key will always be camelCased in Data
          data = dataUser.get( elem, key );
          if ( data !== undefined ) {
            return data;
          }

          // Attempt to "discover" the data in
          // HTML5 custom data-* attrs
          data = dataAttr( elem, key );
          if ( data !== undefined ) {
            return data;
          }

          // We tried really hard, but the data doesn't exist.
          return;
        }

        // Set the data...
        this.each( function() {

          // We always store the camelCased key
          dataUser.set( this, key, value );
        } );
      }, null, value, arguments.length > 1, null, true );
    },

    removeData: function( key ) {
      return this.each( function() {
        dataUser.remove( this, key );
      } );
    }
  } );
  var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

  var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


  var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

  var isHiddenWithinTree = function( elem, el ) {

    // isHiddenWithinTree might be called from jQuery#filter function;
    // in that case, element will be second argument
    elem = el || elem;

    // Inline style trumps all
    return elem.style.display === "none" ||
      elem.style.display === "" &&

        // Otherwise, check computed style
        // Support: Firefox <=43 - 45
        // Disconnected elements can have computed display: none, so first confirm that elem is
        // in the document.
      jQuery.contains( elem.ownerDocument, elem ) &&

      jQuery.css( elem, "display" ) === "none";
  };

  var swap = function( elem, options, callback, args ) {
    var ret, name,
      old = {};

    // Remember the old values, and insert the new ones
    for ( name in options ) {
      old[ name ] = elem.style[ name ];
      elem.style[ name ] = options[ name ];
    }

    ret = callback.apply( elem, args || [] );

    // Revert the old values
    for ( name in options ) {
      elem.style[ name ] = old[ name ];
    }

    return ret;
  };




  function adjustCSS( elem, prop, valueParts, tween ) {
    var adjusted,
      scale = 1,
      maxIterations = 20,
      currentValue = tween ?
        function() { return tween.cur(); } :
        function() { return jQuery.css( elem, prop, "" ); },
      initial = currentValue(),
      unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

    // Starting value computation is required for potential unit mismatches
      initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
        rcssNum.exec( jQuery.css( elem, prop ) );

    if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

      // Trust units reported by jQuery.css
      unit = unit || initialInUnit[ 3 ];

      // Make sure we update the tween properties later on
      valueParts = valueParts || [];

      // Iteratively approximate from a nonzero starting point
      initialInUnit = +initial || 1;

      do {

        // If previous iteration zeroed out, double until we get *something*.
        // Use string for doubling so we don't accidentally see scale as unchanged below
        scale = scale || ".5";

        // Adjust and apply
        initialInUnit = initialInUnit / scale;
        jQuery.style( elem, prop, initialInUnit + unit );

        // Update scale, tolerating zero or NaN from tween.cur()
        // Break the loop if scale is unchanged or perfect, or if we've just had enough.
      } while (
      scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
        );
    }

    if ( valueParts ) {
      initialInUnit = +initialInUnit || +initial || 0;

      // Apply relative offset (+=/-=) if specified
      adjusted = valueParts[ 1 ] ?
      initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
        +valueParts[ 2 ];
      if ( tween ) {
        tween.unit = unit;
        tween.start = initialInUnit;
        tween.end = adjusted;
      }
    }
    return adjusted;
  }
  var rcheckableType = ( /^(?:checkbox|radio)$/i );

  var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

  var rscriptType = ( /^$|\/(?:java|ecma)script/i );



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


  function getAll( context, tag ) {

    // Support: IE <=9 - 11 only
    // Use typeof to avoid zero-argument method invocation on host objects (#15151)
    var ret = typeof context.getElementsByTagName !== "undefined" ?
      context.getElementsByTagName( tag || "*" ) :
      typeof context.querySelectorAll !== "undefined" ?
        context.querySelectorAll( tag || "*" ) :
        [];

    return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
      jQuery.merge( [ context ], ret ) :
      ret;
  }


// Mark scripts as having already been evaluated
  function setGlobalEval( elems, refElements ) {
    var i = 0,
      l = elems.length;

    for ( ; i < l; i++ ) {
      dataPriv.set(
        elems[ i ],
        "globalEval",
        !refElements || dataPriv.get( refElements[ i ], "globalEval" )
      );
    }
  }


  var rhtml = /<|&#?\w+;/;

  function buildFragment( elems, context, scripts, selection, ignored ) {
    var elem, tmp, tag, wrap, contains, j,
      fragment = context.createDocumentFragment(),
      nodes = [],
      i = 0,
      l = elems.length;

    for ( ; i < l; i++ ) {
      elem = elems[ i ];

      if ( elem || elem === 0 ) {

        // Add nodes directly
        if ( jQuery.type( elem ) === "object" ) {

          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

          // Convert non-html into a text node
        } else if ( !rhtml.test( elem ) ) {
          nodes.push( context.createTextNode( elem ) );

          // Convert html into DOM nodes
        } else {
          tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

          // Deserialize a standard representation
          tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
          wrap = wrapMap[ tag ] || wrapMap._default;
          tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

          // Descend through wrappers to the right content
          j = wrap[ 0 ];
          while ( j-- ) {
            tmp = tmp.lastChild;
          }

          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          jQuery.merge( nodes, tmp.childNodes );

          // Remember the top-level container
          tmp = fragment.firstChild;

          // Ensure the created nodes are orphaned (#12392)
          tmp.textContent = "";
        }
      }
    }

    // Remove wrapper from fragment
    fragment.textContent = "";

    i = 0;
    while ( ( elem = nodes[ i++ ] ) ) {

      // Skip elements already in the context collection (trac-4087)
      if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
        if ( ignored ) {
          ignored.push( elem );
        }
        continue;
      }

      contains = jQuery.contains( elem.ownerDocument, elem );

      // Append to fragment
      tmp = getAll( fragment.appendChild( elem ), "script" );

      // Preserve script evaluation history
      if ( contains ) {
        setGlobalEval( tmp );
      }

      // Capture executables
      if ( scripts ) {
        j = 0;
        while ( ( elem = tmp[ j++ ] ) ) {
          if ( rscriptType.test( elem.type || "" ) ) {
            scripts.push( elem );
          }
        }
      }
    }

    return fragment;
  }


  ( function() {
    var fragment = document.createDocumentFragment(),
      div = fragment.appendChild( document.createElement( "div" ) ),
      input = document.createElement( "input" );

    // Support: Android 4.0 - 4.3 only
    // Check state lost if the name is set (#11217)
    // Support: Windows Web Apps (WWA)
    // `name` and `type` must use .setAttribute for WWA (#14901)
    input.setAttribute( "type", "radio" );
    input.setAttribute( "checked", "checked" );
    input.setAttribute( "name", "t" );

    div.appendChild( input );

    // Support: Android <=4.1 only
    // Older WebKit doesn't clone checked state correctly in fragments
    support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

    // Support: IE <=11 only
    // Make sure textarea (and checkbox) defaultValue is properly cloned
    div.innerHTML = "<textarea>x</textarea>";
    support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
  } )();


  var
    rkeyEvent = /^key/,
    rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
    rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

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
    } catch ( err ) { }
  }

  function on( elem, types, selector, data, fn, one ) {
    var origFn, type;

    // Types can be a map of types/handlers
    if ( typeof types === "object" ) {

      // ( types-Object, selector, data )
      if ( typeof selector !== "string" ) {

        // ( types-Object, data )
        data = data || selector;
        selector = undefined;
      }
      for ( type in types ) {
        on( elem, type, selector, data, types[ type ], one );
      }
      return elem;
    }

    if ( data == null && fn == null ) {

      // ( types, fn )
      fn = selector;
      data = selector = undefined;
    } else if ( fn == null ) {
      if ( typeof selector === "string" ) {

        // ( types, selector, fn )
        fn = data;
        data = undefined;
      } else {

        // ( types, data, fn )
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if ( fn === false ) {
      fn = returnFalse;
    } else if ( !fn ) {
      return elem;
    }

    if ( one === 1 ) {
      origFn = fn;
      fn = function( event ) {

        // Can use an empty set, since event contains the info
        jQuery().off( event );
        return origFn.apply( this, arguments );
      };

      // Use same guid so caller can remove using origFn
      fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
    }
    return elem.each( function() {
      jQuery.event.add( this, types, fn, data, selector );
    } );
  }

  /*
   * Helper functions for managing events -- not part of the public interface.
   * Props to Dean Edwards' addEvent library for many of the ideas.
   */
  jQuery.event = {

    global: {},

    add: function( elem, types, handler, data, selector ) {

      var handleObjIn, eventHandle, tmp,
        events, t, handleObj,
        special, handlers, type, namespaces, origType,
        elemData = dataPriv.get( elem );

      // Don't attach events to noData or text/comment nodes (but allow plain objects)
      if ( !elemData ) {
        return;
      }

      // Caller can pass in an object of custom data in lieu of the handler
      if ( handler.handler ) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      }

      // Ensure that invalid selectors throw exceptions at attach time
      // Evaluate against documentElement in case elem is a non-element node (e.g., document)
      if ( selector ) {
        jQuery.find.matchesSelector( documentElement, selector );
      }

      // Make sure that the handler has a unique ID, used to find/remove it later
      if ( !handler.guid ) {
        handler.guid = jQuery.guid++;
      }

      // Init the element's event structure and main handler, if this is the first
      if ( !( events = elemData.events ) ) {
        events = elemData.events = {};
      }
      if ( !( eventHandle = elemData.handle ) ) {
        eventHandle = elemData.handle = function( e ) {

          // Discard the second event of a jQuery.event.trigger() and
          // when an event is called after a page has unloaded
          return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
            jQuery.event.dispatch.apply( elem, arguments ) : undefined;
        };
      }

      // Handle multiple events separated by a space
      types = ( types || "" ).match( rnotwhite ) || [ "" ];
      t = types.length;
      while ( t-- ) {
        tmp = rtypenamespace.exec( types[ t ] ) || [];
        type = origType = tmp[ 1 ];
        namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

        // There *must* be a type, no attaching namespace-only handlers
        if ( !type ) {
          continue;
        }

        // If event changes its type, use the special event handlers for the changed type
        special = jQuery.event.special[ type ] || {};

        // If selector defined, determine special event api type, otherwise given type
        type = ( selector ? special.delegateType : special.bindType ) || type;

        // Update special based on newly reset type
        special = jQuery.event.special[ type ] || {};

        // handleObj is passed to all event handlers
        handleObj = jQuery.extend( {
          type: type,
          origType: origType,
          data: data,
          handler: handler,
          guid: handler.guid,
          selector: selector,
          needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
          namespace: namespaces.join( "." )
        }, handleObjIn );

        // Init the event handler queue if we're the first
        if ( !( handlers = events[ type ] ) ) {
          handlers = events[ type ] = [];
          handlers.delegateCount = 0;

          // Only use addEventListener if the special events handler returns false
          if ( !special.setup ||
            special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

            if ( elem.addEventListener ) {
              elem.addEventListener( type, eventHandle );
            }
          }
        }

        if ( special.add ) {
          special.add.call( elem, handleObj );

          if ( !handleObj.handler.guid ) {
            handleObj.handler.guid = handler.guid;
          }
        }

        // Add to the element's handler list, delegates in front
        if ( selector ) {
          handlers.splice( handlers.delegateCount++, 0, handleObj );
        } else {
          handlers.push( handleObj );
        }

        // Keep track of which events have ever been used, for event optimization
        jQuery.event.global[ type ] = true;
      }

    },

    // Detach an event or set of events from an element
    remove: function( elem, types, handler, selector, mappedTypes ) {

      var j, origCount, tmp,
        events, t, handleObj,
        special, handlers, type, namespaces, origType,
        elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

      if ( !elemData || !( events = elemData.events ) ) {
        return;
      }

      // Once for each type.namespace in types; type may be omitted
      types = ( types || "" ).match( rnotwhite ) || [ "" ];
      t = types.length;
      while ( t-- ) {
        tmp = rtypenamespace.exec( types[ t ] ) || [];
        type = origType = tmp[ 1 ];
        namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

        // Unbind all events (on this namespace, if provided) for the element
        if ( !type ) {
          for ( type in events ) {
            jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
          }
          continue;
        }

        special = jQuery.event.special[ type ] || {};
        type = ( selector ? special.delegateType : special.bindType ) || type;
        handlers = events[ type ] || [];
        tmp = tmp[ 2 ] &&
          new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

        // Remove matching events
        origCount = j = handlers.length;
        while ( j-- ) {
          handleObj = handlers[ j ];

          if ( ( mappedTypes || origType === handleObj.origType ) &&
            ( !handler || handler.guid === handleObj.guid ) &&
            ( !tmp || tmp.test( handleObj.namespace ) ) &&
            ( !selector || selector === handleObj.selector ||
            selector === "**" && handleObj.selector ) ) {
            handlers.splice( j, 1 );

            if ( handleObj.selector ) {
              handlers.delegateCount--;
            }
            if ( special.remove ) {
              special.remove.call( elem, handleObj );
            }
          }
        }

        // Remove generic event handler if we removed something and no more handlers exist
        // (avoids potential for endless recursion during removal of special event handlers)
        if ( origCount && !handlers.length ) {
          if ( !special.teardown ||
            special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

            jQuery.removeEvent( elem, type, elemData.handle );
          }

          delete events[ type ];
        }
      }

      // Remove data and the expando if it's no longer used
      if ( jQuery.isEmptyObject( events ) ) {
        dataPriv.remove( elem, "handle events" );
      }
    },

    dispatch: function( nativeEvent ) {

      // Make a writable jQuery.Event from the native event object
      var event = jQuery.event.fix( nativeEvent );

      var i, j, ret, matched, handleObj, handlerQueue,
        args = new Array( arguments.length ),
        handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
        special = jQuery.event.special[ event.type ] || {};

      // Use the fix-ed jQuery.Event rather than the (read-only) native event
      args[ 0 ] = event;

      for ( i = 1; i < arguments.length; i++ ) {
        args[ i ] = arguments[ i ];
      }

      event.delegateTarget = this;

      // Call the preDispatch hook for the mapped type, and let it bail if desired
      if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
        return;
      }

      // Determine handlers
      handlerQueue = jQuery.event.handlers.call( this, event, handlers );

      // Run delegates first; they may want to stop propagation beneath us
      i = 0;
      while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
        event.currentTarget = matched.elem;

        j = 0;
        while ( ( handleObj = matched.handlers[ j++ ] ) &&
        !event.isImmediatePropagationStopped() ) {

          // Triggered event must either 1) have no namespace, or 2) have namespace(s)
          // a subset or equal to those in the bound event (both can have no namespace).
          if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

            event.handleObj = handleObj;
            event.data = handleObj.data;

            ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
            handleObj.handler ).apply( matched.elem, args );

            if ( ret !== undefined ) {
              if ( ( event.result = ret ) === false ) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      }

      // Call the postDispatch hook for the mapped type
      if ( special.postDispatch ) {
        special.postDispatch.call( this, event );
      }

      return event.result;
    },

    handlers: function( event, handlers ) {
      var i, matches, sel, handleObj,
        handlerQueue = [],
        delegateCount = handlers.delegateCount,
        cur = event.target;

      // Support: IE <=9
      // Find delegate handlers
      // Black-hole SVG <use> instance trees (#13180)
      //
      // Support: Firefox <=42
      // Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
      if ( delegateCount && cur.nodeType &&
        ( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {

        for ( ; cur !== this; cur = cur.parentNode || this ) {

          // Don't check non-elements (#13208)
          // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
          if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
            matches = [];
            for ( i = 0; i < delegateCount; i++ ) {
              handleObj = handlers[ i ];

              // Don't conflict with Object.prototype properties (#13203)
              sel = handleObj.selector + " ";

              if ( matches[ sel ] === undefined ) {
                matches[ sel ] = handleObj.needsContext ?
                jQuery( sel, this ).index( cur ) > -1 :
                  jQuery.find( sel, this, null, [ cur ] ).length;
              }
              if ( matches[ sel ] ) {
                matches.push( handleObj );
              }
            }
            if ( matches.length ) {
              handlerQueue.push( { elem: cur, handlers: matches } );
            }
          }
        }
      }

      // Add the remaining (directly-bound) handlers
      if ( delegateCount < handlers.length ) {
        handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
      }

      return handlerQueue;
    },

    addProp: function( name, hook ) {
      Object.defineProperty( jQuery.Event.prototype, name, {
        enumerable: true,
        configurable: true,

        get: jQuery.isFunction( hook ) ?
          function() {
            if ( this.originalEvent ) {
              return hook( this.originalEvent );
            }
          } :
          function() {
            if ( this.originalEvent ) {
              return this.originalEvent[ name ];
            }
          },

        set: function( value ) {
          Object.defineProperty( this, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          } );
        }
      } );
    },

    fix: function( originalEvent ) {
      return originalEvent[ jQuery.expando ] ?
        originalEvent :
        new jQuery.Event( originalEvent );
    },

    special: {
      load: {

        // Prevent triggered image.load events from bubbling to window.load
        noBubble: true
      },
      focus: {

        // Fire native event if possible so blur/focus sequence is correct
        trigger: function() {
          if ( this !== safeActiveElement() && this.focus ) {
            this.focus();
            return false;
          }
        },
        delegateType: "focusin"
      },
      blur: {
        trigger: function() {
          if ( this === safeActiveElement() && this.blur ) {
            this.blur();
            return false;
          }
        },
        delegateType: "focusout"
      },
      click: {

        // For checkbox, fire native event so checked state will be right
        trigger: function() {
          if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
            this.click();
            return false;
          }
        },

        // For cross-browser consistency, don't fire native .click() on links
        _default: function( event ) {
          return jQuery.nodeName( event.target, "a" );
        }
      },

      beforeunload: {
        postDispatch: function( event ) {

          // Support: Firefox 20+
          // Firefox doesn't alert if the returnValue field is not set.
          if ( event.result !== undefined && event.originalEvent ) {
            event.originalEvent.returnValue = event.result;
          }
        }
      }
    }
  };

  jQuery.removeEvent = function( elem, type, handle ) {

    // This "if" is needed for plain objects
    if ( elem.removeEventListener ) {
      elem.removeEventListener( type, handle );
    }
  };

  jQuery.Event = function( src, props ) {

    // Allow instantiation without the 'new' keyword
    if ( !( this instanceof jQuery.Event ) ) {
      return new jQuery.Event( src, props );
    }

    // Event object
    if ( src && src.type ) {
      this.originalEvent = src;
      this.type = src.type;

      // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.
      this.isDefaultPrevented = src.defaultPrevented ||
      src.defaultPrevented === undefined &&

        // Support: Android <=2.3 only
      src.returnValue === false ?
        returnTrue :
        returnFalse;

      // Create target properties
      // Support: Safari <=6 - 7 only
      // Target should not be a text node (#504, #13143)
      this.target = ( src.target && src.target.nodeType === 3 ) ?
        src.target.parentNode :
        src.target;

      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget;

      // Event type
    } else {
      this.type = src;
    }

    // Put explicitly provided properties onto the event object
    if ( props ) {
      jQuery.extend( this, props );
    }

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || jQuery.now();

    // Mark it as fixed
    this[ jQuery.expando ] = true;
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

      if ( e && !this.isSimulated ) {
        e.preventDefault();
      }
    },
    stopPropagation: function() {
      var e = this.originalEvent;

      this.isPropagationStopped = returnTrue;

      if ( e && !this.isSimulated ) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function() {
      var e = this.originalEvent;

      this.isImmediatePropagationStopped = returnTrue;

      if ( e && !this.isSimulated ) {
        e.stopImmediatePropagation();
      }

      this.stopPropagation();
    }
  };

// Includes all common event props including KeyEvent and MouseEvent specific props
  jQuery.each( {
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
    "char": true,
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

    which: function( event ) {
      var button = event.button;

      // Add which for key events
      if ( event.which == null && rkeyEvent.test( event.type ) ) {
        return event.charCode != null ? event.charCode : event.keyCode;
      }

      // Add which for click: 1 === left; 2 === middle; 3 === right
      if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
        return ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
      }

      return event.which;
    }
  }, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
  jQuery.each( {
    mouseenter: "mouseover",
    mouseleave: "mouseout",
    pointerenter: "pointerover",
    pointerleave: "pointerout"
  }, function( orig, fix ) {
    jQuery.event.special[ orig ] = {
      delegateType: fix,
      bindType: fix,

      handle: function( event ) {
        var ret,
          target = this,
          related = event.relatedTarget,
          handleObj = event.handleObj;

        // For mouseenter/leave call the handler if related is outside the target.
        // NB: No relatedTarget if the mouse left/entered the browser window
        if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
          event.type = handleObj.origType;
          ret = handleObj.handler.apply( this, arguments );
          event.type = fix;
        }
        return ret;
      }
    };
  } );

  jQuery.fn.extend( {

    on: function( types, selector, data, fn ) {
      return on( this, types, selector, data, fn );
    },
    one: function( types, selector, data, fn ) {
      return on( this, types, selector, data, fn, 1 );
    },
    off: function( types, selector, fn ) {
      var handleObj, type;
      if ( types && types.preventDefault && types.handleObj ) {

        // ( event )  dispatched jQuery.Event
        handleObj = types.handleObj;
        jQuery( types.delegateTarget ).off(
          handleObj.namespace ?
          handleObj.origType + "." + handleObj.namespace :
            handleObj.origType,
          handleObj.selector,
          handleObj.handler
        );
        return this;
      }
      if ( typeof types === "object" ) {

        // ( types-object [, selector] )
        for ( type in types ) {
          this.off( type, selector, types[ type ] );
        }
        return this;
      }
      if ( selector === false || typeof selector === "function" ) {

        // ( types [, fn] )
        fn = selector;
        selector = undefined;
      }
      if ( fn === false ) {
        fn = returnFalse;
      }
      return this.each( function() {
        jQuery.event.remove( this, types, fn, selector );
      } );
    }
  } );


  var
    rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

  // Support: IE <=10 - 11, Edge 12 - 13
  // In IE/Edge using regex groups here causes severe slowdowns.
  // See https://connect.microsoft.com/IE/feedback/details/1736512/
    rnoInnerhtml = /<script|<style|<link/i,

  // checked="checked" or checked
    rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
    rscriptTypeMasked = /^true\/(.*)/,
    rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

  function manipulationTarget( elem, content ) {
    if ( jQuery.nodeName( elem, "table" ) &&
      jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

      return elem.getElementsByTagName( "tbody" )[ 0 ] || elem;
    }

    return elem;
  }

// Replace/restore the type attribute of script elements for safe DOM manipulation
  function disableScript( elem ) {
    elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
    return elem;
  }
  function restoreScript( elem ) {
    var match = rscriptTypeMasked.exec( elem.type );

    if ( match ) {
      elem.type = match[ 1 ];
    } else {
      elem.removeAttribute( "type" );
    }

    return elem;
  }

  function cloneCopyEvent( src, dest ) {
    var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

    if ( dest.nodeType !== 1 ) {
      return;
    }

    // 1. Copy private data: events, handlers, etc.
    if ( dataPriv.hasData( src ) ) {
      pdataOld = dataPriv.access( src );
      pdataCur = dataPriv.set( dest, pdataOld );
      events = pdataOld.events;

      if ( events ) {
        delete pdataCur.handle;
        pdataCur.events = {};

        for ( type in events ) {
          for ( i = 0, l = events[ type ].length; i < l; i++ ) {
            jQuery.event.add( dest, type, events[ type ][ i ] );
          }
        }
      }
    }

    // 2. Copy user data
    if ( dataUser.hasData( src ) ) {
      udataOld = dataUser.access( src );
      udataCur = jQuery.extend( {}, udataOld );

      dataUser.set( dest, udataCur );
    }
  }

// Fix IE bugs, see support tests
  function fixInput( src, dest ) {
    var nodeName = dest.nodeName.toLowerCase();

    // Fails to persist the checked state of a cloned checkbox or radio button.
    if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
      dest.checked = src.checked;

      // Fails to return the selected option to the default selected state when cloning options
    } else if ( nodeName === "input" || nodeName === "textarea" ) {
      dest.defaultValue = src.defaultValue;
    }
  }

  function domManip( collection, args, callback, ignored ) {

    // Flatten any nested arrays
    args = concat.apply( [], args );

    var fragment, first, scripts, hasScripts, node, doc,
      i = 0,
      l = collection.length,
      iNoClone = l - 1,
      value = args[ 0 ],
      isFunction = jQuery.isFunction( value );

    // We can't cloneNode fragments that contain checked, in WebKit
    if ( isFunction ||
      ( l > 1 && typeof value === "string" &&
      !support.checkClone && rchecked.test( value ) ) ) {
      return collection.each( function( index ) {
        var self = collection.eq( index );
        if ( isFunction ) {
          args[ 0 ] = value.call( this, index, self.html() );
        }
        domManip( self, args, callback, ignored );
      } );
    }

    if ( l ) {
      fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
      first = fragment.firstChild;

      if ( fragment.childNodes.length === 1 ) {
        fragment = first;
      }

      // Require either new content or an interest in ignored elements to invoke the callback
      if ( first || ignored ) {
        scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
        hasScripts = scripts.length;

        // Use the original fragment for the last item
        // instead of the first because it can end up
        // being emptied incorrectly in certain situations (#8070).
        for ( ; i < l; i++ ) {
          node = fragment;

          if ( i !== iNoClone ) {
            node = jQuery.clone( node, true, true );

            // Keep references to cloned scripts for later restoration
            if ( hasScripts ) {

              // Support: Android <=4.0 only, PhantomJS 1 only
              // push.apply(_, arraylike) throws on ancient WebKit
              jQuery.merge( scripts, getAll( node, "script" ) );
            }
          }

          callback.call( collection[ i ], node, i );
        }

        if ( hasScripts ) {
          doc = scripts[ scripts.length - 1 ].ownerDocument;

          // Reenable scripts
          jQuery.map( scripts, restoreScript );

          // Evaluate executable scripts on first document insertion
          for ( i = 0; i < hasScripts; i++ ) {
            node = scripts[ i ];
            if ( rscriptType.test( node.type || "" ) &&
              !dataPriv.access( node, "globalEval" ) &&
              jQuery.contains( doc, node ) ) {

              if ( node.src ) {

                // Optional AJAX dependency, but won't run scripts if not present
                if ( jQuery._evalUrl ) {
                  jQuery._evalUrl( node.src );
                }
              } else {
                DOMEval( node.textContent.replace( rcleanScript, "" ), doc );
              }
            }
          }
        }
      }
    }

    return collection;
  }

  function remove( elem, selector, keepData ) {
    var node,
      nodes = selector ? jQuery.filter( selector, elem ) : elem,
      i = 0;

    for ( ; ( node = nodes[ i ] ) != null; i++ ) {
      if ( !keepData && node.nodeType === 1 ) {
        jQuery.cleanData( getAll( node ) );
      }

      if ( node.parentNode ) {
        if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
          setGlobalEval( getAll( node, "script" ) );
        }
        node.parentNode.removeChild( node );
      }
    }

    return elem;
  }

  jQuery.extend( {
    htmlPrefilter: function( html ) {
      return html.replace( rxhtmlTag, "<$1></$2>" );
    },

    clone: function( elem, dataAndEvents, deepDataAndEvents ) {
      var i, l, srcElements, destElements,
        clone = elem.cloneNode( true ),
        inPage = jQuery.contains( elem.ownerDocument, elem );

      // Fix IE cloning issues
      if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
        !jQuery.isXMLDoc( elem ) ) {

        // We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
        destElements = getAll( clone );
        srcElements = getAll( elem );

        for ( i = 0, l = srcElements.length; i < l; i++ ) {
          fixInput( srcElements[ i ], destElements[ i ] );
        }
      }

      // Copy the events from the original to the clone
      if ( dataAndEvents ) {
        if ( deepDataAndEvents ) {
          srcElements = srcElements || getAll( elem );
          destElements = destElements || getAll( clone );

          for ( i = 0, l = srcElements.length; i < l; i++ ) {
            cloneCopyEvent( srcElements[ i ], destElements[ i ] );
          }
        } else {
          cloneCopyEvent( elem, clone );
        }
      }

      // Preserve script evaluation history
      destElements = getAll( clone, "script" );
      if ( destElements.length > 0 ) {
        setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
      }

      // Return the cloned set
      return clone;
    },

    cleanData: function( elems ) {
      var data, elem, type,
        special = jQuery.event.special,
        i = 0;

      for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
        if ( acceptData( elem ) ) {
          if ( ( data = elem[ dataPriv.expando ] ) ) {
            if ( data.events ) {
              for ( type in data.events ) {
                if ( special[ type ] ) {
                  jQuery.event.remove( elem, type );

                  // This is a shortcut to avoid jQuery.event.remove's overhead
                } else {
                  jQuery.removeEvent( elem, type, data.handle );
                }
              }
            }

            // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove
            elem[ dataPriv.expando ] = undefined;
          }
          if ( elem[ dataUser.expando ] ) {

            // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove
            elem[ dataUser.expando ] = undefined;
          }
        }
      }
    }
  } );

  jQuery.fn.extend( {
    detach: function( selector ) {
      return remove( this, selector, true );
    },

    remove: function( selector ) {
      return remove( this, selector );
    },

    text: function( value ) {
      return access( this, function( value ) {
        return value === undefined ?
          jQuery.text( this ) :
          this.empty().each( function() {
            if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
              this.textContent = value;
            }
          } );
      }, null, value, arguments.length );
    },

    append: function() {
      return domManip( this, arguments, function( elem ) {
        if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
          var target = manipulationTarget( this, elem );
          target.appendChild( elem );
        }
      } );
    },

    prepend: function() {
      return domManip( this, arguments, function( elem ) {
        if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
          var target = manipulationTarget( this, elem );
          target.insertBefore( elem, target.firstChild );
        }
      } );
    },

    before: function() {
      return domManip( this, arguments, function( elem ) {
        if ( this.parentNode ) {
          this.parentNode.insertBefore( elem, this );
        }
      } );
    },

    after: function() {
      return domManip( this, arguments, function( elem ) {
        if ( this.parentNode ) {
          this.parentNode.insertBefore( elem, this.nextSibling );
        }
      } );
    },

    empty: function() {
      var elem,
        i = 0;

      for ( ; ( elem = this[ i ] ) != null; i++ ) {
        if ( elem.nodeType === 1 ) {

          // Prevent memory leaks
          jQuery.cleanData( getAll( elem, false ) );

          // Remove any remaining nodes
          elem.textContent = "";
        }
      }

      return this;
    },

    clone: function( dataAndEvents, deepDataAndEvents ) {
      dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
      deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

      return this.map( function() {
        return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
      } );
    },

    html: function( value ) {
      return access( this, function( value ) {
        var elem = this[ 0 ] || {},
          i = 0,
          l = this.length;

        if ( value === undefined && elem.nodeType === 1 ) {
          return elem.innerHTML;
        }

        // See if we can take a shortcut and just use innerHTML
        if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
          !wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

          value = jQuery.htmlPrefilter( value );

          try {
            for ( ; i < l; i++ ) {
              elem = this[ i ] || {};

              // Remove element nodes and prevent memory leaks
              if ( elem.nodeType === 1 ) {
                jQuery.cleanData( getAll( elem, false ) );
                elem.innerHTML = value;
              }
            }

            elem = 0;

            // If using innerHTML throws an exception, use the fallback method
          } catch ( e ) {}
        }

        if ( elem ) {
          this.empty().append( value );
        }
      }, null, value, arguments.length );
    },

    replaceWith: function() {
      var ignored = [];

      // Make the changes, replacing each non-ignored context element with the new content
      return domManip( this, arguments, function( elem ) {
        var parent = this.parentNode;

        if ( jQuery.inArray( this, ignored ) < 0 ) {
          jQuery.cleanData( getAll( this ) );
          if ( parent ) {
            parent.replaceChild( elem, this );
          }
        }

        // Force callback invocation
      }, ignored );
    }
  } );

  jQuery.each( {
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
  }, function( name, original ) {
    jQuery.fn[ name ] = function( selector ) {
      var elems,
        ret = [],
        insert = jQuery( selector ),
        last = insert.length - 1,
        i = 0;

      for ( ; i <= last; i++ ) {
        elems = i === last ? this : this.clone( true );
        jQuery( insert[ i ] )[ original ]( elems );

        // Support: Android <=4.0 only, PhantomJS 1 only
        // .get() because push.apply(_, arraylike) throws on ancient WebKit
        push.apply( ret, elems.get() );
      }

      return this.pushStack( ret );
    };
  } );
  var rmargin = ( /^margin/ );

  var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

  var getStyles = function( elem ) {

    // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
    // IE throws on elements created in popups
    // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    var view = elem.ownerDocument.defaultView;

    if ( !view || !view.opener ) {
      view = window;
    }

    return view.getComputedStyle( elem );
  };



  ( function() {

    // Executing both pixelPosition & boxSizingReliable tests require only one layout
    // so they're executed at the same time to save the second computation.
    function computeStyleTests() {

      // This is a singleton, we need to execute it only once
      if ( !div ) {
        return;
      }

      div.style.cssText =
        "box-sizing:border-box;" +
        "position:relative;display:block;" +
        "margin:auto;border:1px;padding:1px;" +
        "top:1%;width:50%";
      div.innerHTML = "";
      documentElement.appendChild( container );

      var divStyle = window.getComputedStyle( div );
      pixelPositionVal = divStyle.top !== "1%";

      // Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
      reliableMarginLeftVal = divStyle.marginLeft === "2px";
      boxSizingReliableVal = divStyle.width === "4px";

      // Support: Android 4.0 - 4.3 only
      // Some styles come back with percentage values, even though they shouldn't
      div.style.marginRight = "50%";
      pixelMarginRightVal = divStyle.marginRight === "4px";

      documentElement.removeChild( container );

      // Nullify the div so it wouldn't be stored in the memory and
      // it will also be a sign that checks already performed
      div = null;
    }

    var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
      container = document.createElement( "div" ),
      div = document.createElement( "div" );

    // Finish early in limited (non-browser) environments
    if ( !div.style ) {
      return;
    }

    // Support: IE <=9 - 11 only
    // Style of cloned element affects source element cloned (#8908)
    div.style.backgroundClip = "content-box";
    div.cloneNode( true ).style.backgroundClip = "";
    support.clearCloneStyle = div.style.backgroundClip === "content-box";

    container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
      "padding:0;margin-top:1px;position:absolute";
    container.appendChild( div );

    jQuery.extend( support, {
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
    } );
  } )();


  function curCSS( elem, name, computed ) {
    var width, minWidth, maxWidth, ret,
      style = elem.style;

    computed = computed || getStyles( elem );

    // Support: IE <=9 only
    // getPropertyValue is only needed for .css('filter') (#12537)
    if ( computed ) {
      ret = computed.getPropertyValue( name ) || computed[ name ];

      if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
        ret = jQuery.style( elem, name );
      }

      // A tribute to the "awesome hack by Dean Edwards"
      // Android Browser returns percentage for some values,
      // but width seems to be reliably pixels.
      // This is against the CSSOM draft spec:
      // https://drafts.csswg.org/cssom/#resolved-values
      if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

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

    return ret !== undefined ?

      // Support: IE <=9 - 11 only
      // IE returns zIndex value as an integer.
    ret + "" :
      ret;
  }


  function addGetHookIf( conditionFn, hookFn ) {

    // Define the hook, we'll check on the first run if it's really needed.
    return {
      get: function() {
        if ( conditionFn() ) {

          // Hook not needed (or it's not possible to use it due
          // to missing dependency), remove it.
          delete this.get;
          return;
        }

        // Hook needed; redefine it so that the support test is not executed again.
        return ( this.get = hookFn ).apply( this, arguments );
      }
    };
  }


  var

  // Swappable if display is none or starts with table
  // except "table", "table-cell", or "table-caption"
  // See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
    rdisplayswap = /^(none|table(?!-c[ea]).+)/,
    cssShow = { position: "absolute", visibility: "hidden", display: "block" },
    cssNormalTransform = {
      letterSpacing: "0",
      fontWeight: "400"
    },

    cssPrefixes = [ "Webkit", "Moz", "ms" ],
    emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
  function vendorPropName( name ) {

    // Shortcut for names that are not vendor prefixed
    if ( name in emptyStyle ) {
      return name;
    }

    // Check for vendor prefixed names
    var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
      i = cssPrefixes.length;

    while ( i-- ) {
      name = cssPrefixes[ i ] + capName;
      if ( name in emptyStyle ) {
        return name;
      }
    }
  }

  function setPositiveNumber( elem, value, subtract ) {

    // Any relative (+/-) values have already been
    // normalized at this point
    var matches = rcssNum.exec( value );
    return matches ?

      // Guard against undefined "subtract", e.g., when used as in cssHooks
    Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
      value;
  }

  function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
    var i = extra === ( isBorderBox ? "border" : "content" ) ?

        // If we already have the right measurement, avoid augmentation
        4 :

        // Otherwise initialize for horizontal or vertical properties
        name === "width" ? 1 : 0,

      val = 0;

    for ( ; i < 4; i += 2 ) {

      // Both box models exclude margin, so add it if we want it
      if ( extra === "margin" ) {
        val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
      }

      if ( isBorderBox ) {

        // border-box includes padding, so remove it if we want content
        if ( extra === "content" ) {
          val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
        }

        // At this point, extra isn't border nor margin, so remove border
        if ( extra !== "margin" ) {
          val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
        }
      } else {

        // At this point, extra isn't content, so add padding
        val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

        // At this point, extra isn't content nor padding, so add border
        if ( extra !== "padding" ) {
          val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
        }
      }
    }

    return val;
  }

  function getWidthOrHeight( elem, name, extra ) {

    // Start with offset property, which is equivalent to the border-box value
    var val,
      valueIsBorderBox = true,
      styles = getStyles( elem ),
      isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

    // Support: IE <=11 only
    // Running getBoundingClientRect on a disconnected node
    // in IE throws an error.
    if ( elem.getClientRects().length ) {
      val = elem.getBoundingClientRect()[ name ];
    }

    // Some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if ( val <= 0 || val == null ) {

      // Fall back to computed then uncomputed css if necessary
      val = curCSS( elem, name, styles );
      if ( val < 0 || val == null ) {
        val = elem.style[ name ];
      }

      // Computed unit is not pixels. Stop here and return.
      if ( rnumnonpx.test( val ) ) {
        return val;
      }

      // Check for style in case a browser which returns unreliable values
      // for getComputedStyle silently falls back to the reliable elem.style
      valueIsBorderBox = isBorderBox &&
        ( support.boxSizingReliable() || val === elem.style[ name ] );

      // Normalize "", auto, and prepare for extra
      val = parseFloat( val ) || 0;
    }

    // Use the active box-sizing model to add/subtract irrelevant styles
    return ( val +
        augmentWidthOrHeight(
          elem,
          name,
          extra || ( isBorderBox ? "border" : "content" ),
          valueIsBorderBox,
          styles
        )
      ) + "px";
  }

  jQuery.extend( {

    // Add in style property hooks for overriding the default
    // behavior of getting and setting a style property
    cssHooks: {
      opacity: {
        get: function( elem, computed ) {
          if ( computed ) {

            // We should always get a number back from opacity
            var ret = curCSS( elem, "opacity" );
            return ret === "" ? "1" : ret;
          }
        }
      }
    },

    // Don't automatically add "px" to these possibly-unitless properties
    cssNumber: {
      "animationIterationCount": true,
      "columnCount": true,
      "fillOpacity": true,
      "flexGrow": true,
      "flexShrink": true,
      "fontWeight": true,
      "lineHeight": true,
      "opacity": true,
      "order": true,
      "orphans": true,
      "widows": true,
      "zIndex": true,
      "zoom": true
    },

    // Add in properties whose names you wish to fix before
    // setting or getting the value
    cssProps: {
      "float": "cssFloat"
    },

    // Get and set the style property on a DOM Node
    style: function( elem, name, value, extra ) {

      // Don't set styles on text and comment nodes
      if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
        return;
      }

      // Make sure that we're working with the right name
      var ret, type, hooks,
        origName = jQuery.camelCase( name ),
        style = elem.style;

      name = jQuery.cssProps[ origName ] ||
        ( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

      // Gets hook for the prefixed version, then unprefixed version
      hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

      // Check if we're setting a value
      if ( value !== undefined ) {
        type = typeof value;

        // Convert "+=" or "-=" to relative numbers (#7345)
        if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
          value = adjustCSS( elem, name, ret );

          // Fixes bug #9237
          type = "number";
        }

        // Make sure that null and NaN values aren't set (#7116)
        if ( value == null || value !== value ) {
          return;
        }

        // If a number was passed in, add the unit (except for certain CSS properties)
        if ( type === "number" ) {
          value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
        }

        // background-* props affect original clone's values
        if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
          style[ name ] = "inherit";
        }

        // If a hook was provided, use that value, otherwise just set the specified value
        if ( !hooks || !( "set" in hooks ) ||
          ( value = hooks.set( elem, value, extra ) ) !== undefined ) {

          style[ name ] = value;
        }

      } else {

        // If a hook was provided get the non-computed value from there
        if ( hooks && "get" in hooks &&
          ( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

          return ret;
        }

        // Otherwise just get the value from the style object
        return style[ name ];
      }
    },

    css: function( elem, name, extra, styles ) {
      var val, num, hooks,
        origName = jQuery.camelCase( name );

      // Make sure that we're working with the right name
      name = jQuery.cssProps[ origName ] ||
        ( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

      // Try prefixed name followed by the unprefixed name
      hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

      // If a hook was provided get the computed value from there
      if ( hooks && "get" in hooks ) {
        val = hooks.get( elem, true, extra );
      }

      // Otherwise, if a way to get the computed value exists, use that
      if ( val === undefined ) {
        val = curCSS( elem, name, styles );
      }

      // Convert "normal" to computed value
      if ( val === "normal" && name in cssNormalTransform ) {
        val = cssNormalTransform[ name ];
      }

      // Make numeric if forced or a qualifier was provided and val looks numeric
      if ( extra === "" || extra ) {
        num = parseFloat( val );
        return extra === true || isFinite( num ) ? num || 0 : val;
      }
      return val;
    }
  } );

  jQuery.each( [ "height", "width" ], function( i, name ) {
    jQuery.cssHooks[ name ] = {
      get: function( elem, computed, extra ) {
        if ( computed ) {

          // Certain elements can have dimension info if we invisibly show them
          // but it must have a current display style that would benefit
          return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

            // Support: Safari 8+
            // Table columns in Safari have non-zero offsetWidth & zero
            // getBoundingClientRect().width unless display is changed.
            // Support: IE <=11 only
            // Running getBoundingClientRect on a disconnected node
            // in IE throws an error.
          ( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
            swap( elem, cssShow, function() {
              return getWidthOrHeight( elem, name, extra );
            } ) :
            getWidthOrHeight( elem, name, extra );
        }
      },

      set: function( elem, value, extra ) {
        var matches,
          styles = extra && getStyles( elem ),
          subtract = extra && augmentWidthOrHeight(
              elem,
              name,
              extra,
              jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
              styles
            );

        // Convert to pixels if value adjustment is needed
        if ( subtract && ( matches = rcssNum.exec( value ) ) &&
          ( matches[ 3 ] || "px" ) !== "px" ) {

          elem.style[ name ] = value;
          value = jQuery.css( elem, name );
        }

        return setPositiveNumber( elem, value, subtract );
      }
    };
  } );

  jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
    function( elem, computed ) {
      if ( computed ) {
        return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
            elem.getBoundingClientRect().left -
            swap( elem, { marginLeft: 0 }, function() {
              return elem.getBoundingClientRect().left;
            } )
          ) + "px";
      }
    }
  );

// These hooks are used by animate to expand properties
  jQuery.each( {
    margin: "",
    padding: "",
    border: "Width"
  }, function( prefix, suffix ) {
    jQuery.cssHooks[ prefix + suffix ] = {
      expand: function( value ) {
        var i = 0,
          expanded = {},

        // Assumes a single number if not a string
          parts = typeof value === "string" ? value.split( " " ) : [ value ];

        for ( ; i < 4; i++ ) {
          expanded[ prefix + cssExpand[ i ] + suffix ] =
            parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
        }

        return expanded;
      }
    };

    if ( !rmargin.test( prefix ) ) {
      jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
    }
  } );

  jQuery.fn.extend( {
    css: function( name, value ) {
      return access( this, function( elem, name, value ) {
        var styles, len,
          map = {},
          i = 0;

        if ( jQuery.isArray( name ) ) {
          styles = getStyles( elem );
          len = name.length;

          for ( ; i < len; i++ ) {
            map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
          }

          return map;
        }

        return value !== undefined ?
          jQuery.style( elem, name, value ) :
          jQuery.css( elem, name );
      }, name, value, arguments.length > 1 );
    }
  } );


  ( function() {
    var input = document.createElement( "input" ),
      select = document.createElement( "select" ),
      opt = select.appendChild( document.createElement( "option" ) );

    input.type = "checkbox";

    // Support: Android <=4.3 only
    // Default value for a checkbox should be "on"
    support.checkOn = input.value !== "";

    // Support: IE <=11 only
    // Must access selectedIndex to make default options select
    support.optSelected = opt.selected;

    // Support: IE <=11 only
    // An input loses its value after becoming a radio
    input = document.createElement( "input" );
    input.value = "t";
    input.type = "radio";
    support.radioValue = input.value === "t";
  } )();


  var boolHook,
    attrHandle = jQuery.expr.attrHandle;

  jQuery.fn.extend( {
    attr: function( name, value ) {
      return access( this, jQuery.attr, name, value, arguments.length > 1 );
    },

    removeAttr: function( name ) {
      return this.each( function() {
        jQuery.removeAttr( this, name );
      } );
    }
  } );

  jQuery.extend( {
    attr: function( elem, name, value ) {
      var ret, hooks,
        nType = elem.nodeType;

      // Don't get/set attributes on text, comment and attribute nodes
      if ( nType === 3 || nType === 8 || nType === 2 ) {
        return;
      }

      // Fallback to prop when attributes are not supported
      if ( typeof elem.getAttribute === "undefined" ) {
        return jQuery.prop( elem, name, value );
      }

      // Attribute hooks are determined by the lowercase version
      // Grab necessary hook if one is defined
      if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
        hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
          ( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
      }

      if ( value !== undefined ) {
        if ( value === null ) {
          jQuery.removeAttr( elem, name );
          return;
        }

        if ( hooks && "set" in hooks &&
          ( ret = hooks.set( elem, value, name ) ) !== undefined ) {
          return ret;
        }

        elem.setAttribute( name, value + "" );
        return value;
      }

      if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
        return ret;
      }

      ret = jQuery.find.attr( elem, name );

      // Non-existent attributes return null, we normalize to undefined
      return ret == null ? undefined : ret;
    },

    attrHooks: {
      type: {
        set: function( elem, value ) {
          if ( !support.radioValue && value === "radio" &&
            jQuery.nodeName( elem, "input" ) ) {
            var val = elem.value;
            elem.setAttribute( "type", value );
            if ( val ) {
              elem.value = val;
            }
            return value;
          }
        }
      }
    },

    removeAttr: function( elem, value ) {
      var name,
        i = 0,
        attrNames = value && value.match( rnotwhite );

      if ( attrNames && elem.nodeType === 1 ) {
        while ( ( name = attrNames[ i++ ] ) ) {
          elem.removeAttribute( name );
        }
      }
    }
  } );

// Hooks for boolean attributes
  boolHook = {
    set: function( elem, value, name ) {
      if ( value === false ) {

        // Remove boolean attributes when set to false
        jQuery.removeAttr( elem, name );
      } else {
        elem.setAttribute( name, name );
      }
      return name;
    }
  };

  jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
    var getter = attrHandle[ name ] || jQuery.find.attr;

    attrHandle[ name ] = function( elem, name, isXML ) {
      var ret, handle,
        lowercaseName = name.toLowerCase();

      if ( !isXML ) {

        // Avoid an infinite loop by temporarily removing this function from the getter
        handle = attrHandle[ lowercaseName ];
        attrHandle[ lowercaseName ] = ret;
        ret = getter( elem, name, isXML ) != null ?
          lowercaseName :
          null;
        attrHandle[ lowercaseName ] = handle;
      }
      return ret;
    };
  } );




  var rfocusable = /^(?:input|select|textarea|button)$/i,
    rclickable = /^(?:a|area)$/i;

  jQuery.fn.extend( {
    prop: function( name, value ) {
      return access( this, jQuery.prop, name, value, arguments.length > 1 );
    },

    removeProp: function( name ) {
      return this.each( function() {
        delete this[ jQuery.propFix[ name ] || name ];
      } );
    }
  } );

  jQuery.extend( {
    prop: function( elem, name, value ) {
      var ret, hooks,
        nType = elem.nodeType;

      // Don't get/set properties on text, comment and attribute nodes
      if ( nType === 3 || nType === 8 || nType === 2 ) {
        return;
      }

      if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

        // Fix name and attach hooks
        name = jQuery.propFix[ name ] || name;
        hooks = jQuery.propHooks[ name ];
      }

      if ( value !== undefined ) {
        if ( hooks && "set" in hooks &&
          ( ret = hooks.set( elem, value, name ) ) !== undefined ) {
          return ret;
        }

        return ( elem[ name ] = value );
      }

      if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
        return ret;
      }

      return elem[ name ];
    },

    propHooks: {
      tabIndex: {
        get: function( elem ) {

          // Support: IE <=9 - 11 only
          // elem.tabIndex doesn't always return the
          // correct value when it hasn't been explicitly set
          // https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
          // Use proper attribute retrieval(#12072)
          var tabindex = jQuery.find.attr( elem, "tabindex" );

          return tabindex ?
            parseInt( tabindex, 10 ) :
            rfocusable.test( elem.nodeName ) ||
            rclickable.test( elem.nodeName ) && elem.href ?
              0 :
              -1;
        }
      }
    },

    propFix: {
      "for": "htmlFor",
      "class": "className"
    }
  } );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
  if ( !support.optSelected ) {
    jQuery.propHooks.selected = {
      get: function( elem ) {
        var parent = elem.parentNode;
        if ( parent && parent.parentNode ) {
          parent.parentNode.selectedIndex;
        }
        return null;
      },
      set: function( elem ) {
        var parent = elem.parentNode;
        if ( parent ) {
          parent.selectedIndex;

          if ( parent.parentNode ) {
            parent.parentNode.selectedIndex;
          }
        }
      }
    };
  }

  jQuery.each( [
    "tabIndex",
    "readOnly",
    "maxLength",
    "cellSpacing",
    "cellPadding",
    "rowSpan",
    "colSpan",
    "useMap",
    "frameBorder",
    "contentEditable"
  ], function() {
    jQuery.propFix[ this.toLowerCase() ] = this;
  } );




  var rclass = /[\t\r\n\f]/g;

  function getClass( elem ) {
    return elem.getAttribute && elem.getAttribute( "class" ) || "";
  }

  jQuery.fn.extend( {
    addClass: function( value ) {
      var classes, elem, cur, curValue, clazz, j, finalValue,
        i = 0;

      if ( jQuery.isFunction( value ) ) {
        return this.each( function( j ) {
          jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
        } );
      }

      if ( typeof value === "string" && value ) {
        classes = value.match( rnotwhite ) || [];

        while ( ( elem = this[ i++ ] ) ) {
          curValue = getClass( elem );
          cur = elem.nodeType === 1 &&
            ( " " + curValue + " " ).replace( rclass, " " );

          if ( cur ) {
            j = 0;
            while ( ( clazz = classes[ j++ ] ) ) {
              if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
                cur += clazz + " ";
              }
            }

            // Only assign if different to avoid unneeded rendering.
            finalValue = jQuery.trim( cur );
            if ( curValue !== finalValue ) {
              elem.setAttribute( "class", finalValue );
            }
          }
        }
      }

      return this;
    },

    removeClass: function( value ) {
      var classes, elem, cur, curValue, clazz, j, finalValue,
        i = 0;

      if ( jQuery.isFunction( value ) ) {
        return this.each( function( j ) {
          jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
        } );
      }

      if ( !arguments.length ) {
        return this.attr( "class", "" );
      }

      if ( typeof value === "string" && value ) {
        classes = value.match( rnotwhite ) || [];

        while ( ( elem = this[ i++ ] ) ) {
          curValue = getClass( elem );

          // This expression is here for better compressibility (see addClass)
          cur = elem.nodeType === 1 &&
            ( " " + curValue + " " ).replace( rclass, " " );

          if ( cur ) {
            j = 0;
            while ( ( clazz = classes[ j++ ] ) ) {

              // Remove *all* instances
              while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
                cur = cur.replace( " " + clazz + " ", " " );
              }
            }

            // Only assign if different to avoid unneeded rendering.
            finalValue = jQuery.trim( cur );
            if ( curValue !== finalValue ) {
              elem.setAttribute( "class", finalValue );
            }
          }
        }
      }

      return this;
    },

    toggleClass: function( value, stateVal ) {
      var type = typeof value;

      if ( typeof stateVal === "boolean" && type === "string" ) {
        return stateVal ? this.addClass( value ) : this.removeClass( value );
      }

      if ( jQuery.isFunction( value ) ) {
        return this.each( function( i ) {
          jQuery( this ).toggleClass(
            value.call( this, i, getClass( this ), stateVal ),
            stateVal
          );
        } );
      }

      return this.each( function() {
        var className, i, self, classNames;

        if ( type === "string" ) {

          // Toggle individual class names
          i = 0;
          self = jQuery( this );
          classNames = value.match( rnotwhite ) || [];

          while ( ( className = classNames[ i++ ] ) ) {

            // Check each className given, space separated list
            if ( self.hasClass( className ) ) {
              self.removeClass( className );
            } else {
              self.addClass( className );
            }
          }

          // Toggle whole class name
        } else if ( value === undefined || type === "boolean" ) {
          className = getClass( this );
          if ( className ) {

            // Store className if set
            dataPriv.set( this, "__className__", className );
          }

          // If the element has a class name or if we're passed `false`,
          // then remove the whole classname (if there was one, the above saved it).
          // Otherwise bring back whatever was previously saved (if anything),
          // falling back to the empty string if nothing was stored.
          if ( this.setAttribute ) {
            this.setAttribute( "class",
              className || value === false ?
                "" :
              dataPriv.get( this, "__className__" ) || ""
            );
          }
        }
      } );
    },

    hasClass: function( selector ) {
      var className, elem,
        i = 0;

      className = " " + selector + " ";
      while ( ( elem = this[ i++ ] ) ) {
        if ( elem.nodeType === 1 &&
          ( " " + getClass( elem ) + " " ).replace( rclass, " " )
            .indexOf( className ) > -1
        ) {
          return true;
        }
      }

      return false;
    }
  } );




  var rreturn = /\r/g,
    rspaces = /[\x20\t\r\n\f]+/g;

  jQuery.fn.extend( {
    val: function( value ) {
      var hooks, ret, isFunction,
        elem = this[ 0 ];

      if ( !arguments.length ) {
        if ( elem ) {
          hooks = jQuery.valHooks[ elem.type ] ||
            jQuery.valHooks[ elem.nodeName.toLowerCase() ];

          if ( hooks &&
            "get" in hooks &&
            ( ret = hooks.get( elem, "value" ) ) !== undefined
          ) {
            return ret;
          }

          ret = elem.value;

          return typeof ret === "string" ?

            // Handle most common string cases
            ret.replace( rreturn, "" ) :

            // Handle cases where value is null/undef or number
            ret == null ? "" : ret;
        }

        return;
      }

      isFunction = jQuery.isFunction( value );

      return this.each( function( i ) {
        var val;

        if ( this.nodeType !== 1 ) {
          return;
        }

        if ( isFunction ) {
          val = value.call( this, i, jQuery( this ).val() );
        } else {
          val = value;
        }

        // Treat null/undefined as ""; convert numbers to string
        if ( val == null ) {
          val = "";

        } else if ( typeof val === "number" ) {
          val += "";

        } else if ( jQuery.isArray( val ) ) {
          val = jQuery.map( val, function( value ) {
            return value == null ? "" : value + "";
          } );
        }

        hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

        // If set returns undefined, fall back to normal setting
        if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
          this.value = val;
        }
      } );
    }
  } );

  jQuery.extend( {
    valHooks: {
      option: {
        get: function( elem ) {

          var val = jQuery.find.attr( elem, "value" );
          return val != null ?
            val :

            // Support: IE <=10 - 11 only
            // option.text throws exceptions (#14686, #14858)
            // Strip and collapse whitespace
            // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
            jQuery.trim( jQuery.text( elem ) ).replace( rspaces, " " );
        }
      },
      select: {
        get: function( elem ) {
          var value, option,
            options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === "select-one",
            values = one ? null : [],
            max = one ? index + 1 : options.length,
            i = index < 0 ?
              max :
              one ? index : 0;

          // Loop through all the selected options
          for ( ; i < max; i++ ) {
            option = options[ i ];

            // Support: IE <=9 only
            // IE8-9 doesn't update selected after form reset (#2551)
            if ( ( option.selected || i === index ) &&

                // Don't return options that are disabled or in a disabled optgroup
              !option.disabled &&
              ( !option.parentNode.disabled ||
              !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

              // Get the specific value for the option
              value = jQuery( option ).val();

              // We don't need an array for one selects
              if ( one ) {
                return value;
              }

              // Multi-Selects return an array
              values.push( value );
            }
          }

          return values;
        },

        set: function( elem, value ) {
          var optionSet, option,
            options = elem.options,
            values = jQuery.makeArray( value ),
            i = options.length;

          while ( i-- ) {
            option = options[ i ];
            if ( option.selected =
                jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
            ) {
              optionSet = true;
            }
          }

          // Force browsers to behave consistently when non-matching value is set
          if ( !optionSet ) {
            elem.selectedIndex = -1;
          }
          return values;
        }
      }
    }
  } );

// Radios and checkboxes getter/setter
  jQuery.each( [ "radio", "checkbox" ], function() {
    jQuery.valHooks[ this ] = {
      set: function( elem, value ) {
        if ( jQuery.isArray( value ) ) {
          return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
        }
      }
    };
    if ( !support.checkOn ) {
      jQuery.valHooks[ this ].get = function( elem ) {
        return elem.getAttribute( "value" ) === null ? "on" : elem.value;
      };
    }
  } );




// Return jQuery for attributes-only inclusion


  support.focusin = "onfocusin" in window;


  var
    rbracket = /\[\]$/,
    rCRLF = /\r?\n/g,
    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
    rsubmittable = /^(?:input|select|textarea|keygen)/i;

  function buildParams( prefix, obj, traditional, add ) {
    var name;

    if ( jQuery.isArray( obj ) ) {

      // Serialize array item.
      jQuery.each( obj, function( i, v ) {
        if ( traditional || rbracket.test( prefix ) ) {

          // Treat each array item as a scalar.
          add( prefix, v );

        } else {

          // Item is non-scalar (array or object), encode its numeric index.
          buildParams(
            prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
            v,
            traditional,
            add
          );
        }
      } );

    } else if ( !traditional && jQuery.type( obj ) === "object" ) {

      // Serialize object item.
      for ( name in obj ) {
        buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
      }

    } else {

      // Serialize scalar item.
      add( prefix, obj );
    }
  }

// Serialize an array of form elements or a set of
// key/values into a query string
  jQuery.param = function( a, traditional ) {
    var prefix,
      s = [],
      add = function( key, valueOrFunction ) {

        // If value is a function, invoke it and use its return value
        var value = jQuery.isFunction( valueOrFunction ) ?
          valueOrFunction() :
          valueOrFunction;

        s[ s.length ] = encodeURIComponent( key ) + "=" +
          encodeURIComponent( value == null ? "" : value );
      };

    // If an array was passed in, assume that it is an array of form elements.
    if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

      // Serialize the form elements
      jQuery.each( a, function() {
        add( this.name, this.value );
      } );

    } else {

      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for ( prefix in a ) {
        buildParams( prefix, a[ prefix ], traditional, add );
      }
    }

    // Return the resulting serialization
    return s.join( "&" );
  };

  jQuery.fn.extend( {
    serialize: function() {
      return jQuery.param( this.serializeArray() );
    },
    serializeArray: function() {
      return this.map( function() {

          // Can add propHook for "elements" to filter or add form elements
          var elements = jQuery.prop( this, "elements" );
          return elements ? jQuery.makeArray( elements ) : this;
        } )
        .filter( function() {
          var type = this.type;

          // Use .is( ":disabled" ) so that fieldset[disabled] works
          return this.name && !jQuery( this ).is( ":disabled" ) &&
            rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
            ( this.checked || !rcheckableType.test( type ) );
        } )
        .map( function( i, elem ) {
          var val = jQuery( this ).val();

          return val == null ?
            null :
            jQuery.isArray( val ) ?
              jQuery.map( val, function( val ) {
                return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
              } ) :
            { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
        } ).get();
    }
  } );


// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
  support.createHTMLDocument = ( function() {
    var body = document.implementation.createHTMLDocument( "" ).body;
    body.innerHTML = "<form></form><form></form>";
    return body.childNodes.length === 2;
  } )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
  jQuery.parseHTML = function( data, context, keepScripts ) {
    if ( typeof data !== "string" ) {
      return [];
    }
    if ( typeof context === "boolean" ) {
      keepScripts = context;
      context = false;
    }

    var base, parsed, scripts;

    if ( !context ) {

      // Stop scripts or inline event handlers from being executed immediately
      // by using document.implementation
      if ( support.createHTMLDocument ) {
        context = document.implementation.createHTMLDocument( "" );

        // Set the base href for the created document
        // so any parsed elements with URLs
        // are based on the document's URL (gh-2965)
        base = context.createElement( "base" );
        base.href = document.location.href;
        context.head.appendChild( base );
      } else {
        context = document;
      }
    }

    parsed = rsingleTag.exec( data );
    scripts = !keepScripts && [];

    // Single tag
    if ( parsed ) {
      return [ context.createElement( parsed[ 1 ] ) ];
    }

    parsed = buildFragment( [ data ], context, scripts );

    if ( scripts && scripts.length ) {
      jQuery( scripts ).remove();
    }

    return jQuery.merge( [], parsed.childNodes );
  };



  var readyCallbacks = [],
    readyFiring = false,
    whenReady = function( fn ) {
      readyCallbacks.push( fn );
    },
    executeReady = function( fn ) {

      // Prevent errors from freezing future callback execution (gh-1823)
      // Not backwards-compatible as this does not execute sync
      setTimeout( function() {
        fn.call( document, jQuery );
      } );
    };

  jQuery.fn.ready = function( fn ) {
    whenReady( fn );
    return this;
  };

  jQuery.extend( {

    // Is the DOM ready to be used? Set to true once it occurs.
    isReady: false,

    // A counter to track how many items to wait for before
    // the ready event fires. See #6781
    readyWait: 1,

    // Hold (or release) the ready event
    holdReady: function( hold ) {
      if ( hold ) {
        jQuery.readyWait++;
      } else {
        jQuery.ready( true );
      }
    },

    ready: function( wait ) {

      // Abort if there are pending holds or we're already ready
      if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
        return;
      }

      // Remember that the DOM is ready
      jQuery.isReady = true;

      // If a normal DOM Ready event fired, decrement, and wait if need be
      if ( wait !== true && --jQuery.readyWait > 0 ) {
        return;
      }

      whenReady = function( fn ) {
        readyCallbacks.push( fn );

        if ( !readyFiring ) {
          readyFiring = true;

          while ( readyCallbacks.length ) {
            fn = readyCallbacks.shift();
            if ( jQuery.isFunction( fn ) ) {
              executeReady( fn );
            }
          }
          readyFiring = false;
        }
      };

      whenReady();
    }
  } );

// Make jQuery.ready Promise consumable (gh-1778)
  jQuery.ready.then = jQuery.fn.ready;

  /**
   * The ready event handler and self cleanup method
   */
  function completed() {
    document.removeEventListener( "DOMContentLoaded", completed );
    window.removeEventListener( "load", completed );
    jQuery.ready();
  }

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE9-10 only
// Older IE sometimes signals "interactive" too soon
  if ( document.readyState === "complete" ||
    ( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

    // Handle it asynchronously to allow scripts the opportunity to delay ready
    setTimeout( jQuery.ready );

  } else {

    // Use the handy event callback
    document.addEventListener( "DOMContentLoaded", completed );

    // A fallback to window.onload, that will always work
    window.addEventListener( "load", completed );
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
  if ( !SC_EXTENSION ) {
    sitecues.define( "page/jquery/jquery", [], function() {
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

  // --- END SITECUES CUSTOM CODE ---

}));
