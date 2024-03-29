/**
 * @license alameda-sitecues 0.0.1 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/alameda/LICENSE
 */
// Going sloppy because loader plugin execs may depend on non-strict execution.
/*jslint sloppy: true, nomen: true, regexp: true */
/*global document, navigator, importScripts, Promise */

// Supports IE 11, Edge, Safari 9+, modern Chrome, modern Firefox
// Only uses prim for IE11
// No support for certain config options: packages, bundles, shim, deps

// ----- BEGIN SITECUES CUSTOM BLOCK -----
// All custom sitecues code is marked this way
/* globals -define, -require, importScripts */
/* jshint proto: true */
// TODO Once we kill off IE11 we can use alameda.js instead of alameda-prim.js (native promise only)
var require = sitecues._require;
// ----- END SITECUES CUSTOM BLOCK -----

var requirejs, require, define;
(function (global, Promise, undef) {

  // ----- BEGIN SITECUES CUSTOM BLOCK -----
  function reportError(error) {
    var event = new CustomEvent('SitecuesUnhandledRejection', {detail: error});
    window.dispatchEvent(event);
  }
  // Cache native function references
  var hasOwn     = Object.prototype.hasOwnProperty,
    setTimeout = sitecues._shared.nativeGlobal.setTimeout,
    slice      = Array.prototype.slice;
  // ----- END SITECUES CUSTOM BLOCK -----

  if (!Promise) {
    //START prim 1.0.0
    /**
     * Changes from baseline prim
     * - removed UMD registration
     * - Assigns Promise = prim at the bottom.
     */
    (function () {
      'use strict';

      var prim, waitingId, nextTick,
        waiting = [];

      function callWaiting() {
        waitingId = 0;
        var w = waiting;
        waiting = [];
        while (w.length) {
          w.shift()();
        }
      }

      function asyncTick(fn) {
        waiting.push(fn);
        if (!waitingId) {
          waitingId = setTimeout(callWaiting, 0);
        }
      }

      function isFunObj(x) {
        var type = typeof x;
        return type === 'object' || type === 'function';
      }

      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      nextTick = asyncTick;
      // The below code caused SC-3449
      // Trying to call nextTick() in IE11 on some websites even with the . bind()
      // caused SCRIPT65535: Invalid calling object
      //Use setImmediate.bind() because attaching it (or setTimeout directly
      //to prim will result in errors. Noticed first on IE10,
      //issue requirejs/alameda#2)
      //nextTick = typeof setImmediate === 'function' ? setImmediate.bind() :
      //  (typeof process !== 'undefined' && process.nextTick ?
      //    process.nextTick : (typeof setTimeout !== 'undefined' ?
      //    asyncTick : syncTick));
      // ----- END SITECUES CUSTOM BLOCK -----

      function notify(ary, value) {
        prim.nextTick(function () {
          ary.forEach(function (item) {
            item(value);
          });
        });
      }

      function callback(p, ok, yes) {
        if (p.hasOwnProperty('v')) {
          prim.nextTick(function () {
            yes(p.v);
          });
        } else {
          ok.push(yes);
        }
      }

      function errback(p, fail, no) {
        if (p.hasOwnProperty('e')) {
          prim.nextTick(function () {
            no(p.e);
          });
        } else {
          fail.push(no);
        }
      }

      prim = function prim(fn) {
        var promise, f,
          p = {},
          ok = [],
          fail = [];

        function makeFulfill() {
          var f, f2,
            called = false;

          function fulfill(v, prop, listeners) {
            if (called) {
              return;
            }
            called = true;

            if (promise === v) {
              called = false;
              f.reject(new TypeError('value is same promise'));
              return;
            }

            try {
              var then = v && v.then;
              if (isFunObj(v) && typeof then === 'function' &&
                  // if error, keep on error pathway if a promise,
                  // 2.2.7.2 tests.
                prop !== 'e') {
                f2 = makeFulfill();
                then.call(v, f2.resolve, f2.reject);
              } else {
                p[prop] = v;
                notify(listeners, v);
              }
            } catch (e) {
              called = false;
              // ----- BEGIN SITECUES CUSTOM BLOCK -----
              reportError(e);
              // ----- END SITECUES CUSTOM BLOCK -----
              f.reject(e);
            }
          }

          f = {
            resolve: function (v) {
              fulfill(v, 'v', ok);
            },
            reject: function(e) {
              fulfill(e, 'e', fail);
            }
          };
          return f;
        }

        f = makeFulfill();

        promise = {
          then: function (yes, no) {
            var next = prim(function (nextResolve, nextReject) {

              function finish(fn, nextFn, v) {
                try {
                  if (fn && typeof fn === 'function') {
                    v = fn(v);
                    nextResolve(v);
                  } else {
                    nextFn(v);
                  }
                } catch (e) {
                  // ----- BEGIN SITECUES CUSTOM BLOCK -----
                  reportError(e);
                  // ----- END SITECUES CUSTOM BLOCK -----
                  nextReject(e);
                }
              }

              callback(p, ok, finish.bind(undefined, yes, nextResolve));
              errback(p, fail, finish.bind(undefined, no, nextReject));

            });
            return next;
          },

          catch: function (no) {
            return promise.then(null, no);
          }
        };

        try {
          fn(f.resolve, f.reject);
        } catch (e) {
          // ----- BEGIN SITECUES CUSTOM BLOCK -----
          reportError(e);
          // ----- END SITECUES CUSTOM BLOCK -----
          f.reject(e);
        }

        return promise;
      };

      prim.resolve = function (value) {
        return prim(function (yes) {
          yes(value);
        });
      };

      prim.reject = function (err) {
        return prim(function (yes, no) {
          no(err);
        });
      };

      prim.cast = function (x) {
        // A bit of a weak check, want "then" to be a function,
        // but also do not want to trigger a getter if accessing
        // it. Good enough for now.
        if (isFunObj(x) && 'then' in x) {
          return x;
        } else {
          return prim(function (yes, no) {
            if (x instanceof Error) {
              no(x);
            } else {
              yes(x);
            }
          });
        }
      };

      prim.all = function (ary) {
        return prim(function (yes, no) {
          var count = 0,
            length = ary.length,
            result = [];

          function resolved(i, v) {
            result[i] = v;
            count += 1;
            if (count === length) {
              yes(result);
            }
          }

          if (!ary.length) {
            yes([]);
          } else {
            ary.forEach(function (item, i) {
              prim.cast(item).then(function (v) {
                resolved(i, v);
              }, function (err) {
                no(err);
              });
            });
          }
        });
      };

      prim.nextTick = nextTick;
      Promise = prim;
    }());
    //END prim

  }

  var topReq,
    bootstrapConfig = requirejs || require,
    contexts = {},
    queue = [],
    // ----- BEGIN SITECUES CUSTOM BLOCK -----
    //currDirRegExp = /^\.\//,
    // ----- END SITECUES CUSTOM BLOCK -----
    commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
    cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
    jsSuffixRegExp = /\.js$/;

  if (typeof requirejs === 'function') {
    return;
  }

  // Could match something like ')//comment', do not lose the prefix to comment.
  function commentReplace(match, multi, multiText, singlePrefix) {
    return singlePrefix || '';
  }

  function hasProp(obj, prop) {
    return hasOwn.call(obj, prop);
  }

  function getOwn(obj, prop) {
    return obj && hasProp(obj, prop) && obj[prop];
  }

  /**
   * Cycles over properties in an object and calls a function for each
   * property value. If the function returns a truthy value, then the
   * iteration is stopped.
   */
  function eachProp(obj, func) {
    var prop;
    for (prop in obj) {
      if (hasProp(obj, prop)) {
        if (func(obj[prop], prop)) {
          break;
        }
      }
    }
  }

  /**
   * Simple function to mix in properties from source into target,
   * but only if target does not already have a property of the same name.
   */
  function mixin(target, source, force, deepStringMixin) {
    if (source) {
      eachProp(source, function (value, prop) {
        if (force || !hasProp(target, prop)) {
          if (deepStringMixin && typeof value === 'object' && value &&
            !Array.isArray(value) && typeof value !== 'function' &&
            !(value instanceof RegExp)) {

            if (!target[prop]) {
              target[prop] = {};
            }
            mixin(target[prop], value, force, deepStringMixin);
          } else {
            target[prop] = value;
          }
        }
      });
    }
    return target;
  }

  // ----- BEGIN SITECUES CUSTOM BLOCK -----
  // Allow getting a global that expressed in
  // dot notation, like 'a.b.c'.
  // function getGlobal(value) {
  //   if (!value) {
  //     return value;
  //   }
  //   var g = global;
  //   value.split('.').forEach(function (part) {
  //     g = g[part];
  //   });
  //   return g;
  // }
  // ----- END SITECUES CUSTOM BLOCK -----

  function newContext(contextName) {
    var req, main, makeMap, callDep, handlers, checkingLater, load, context,
      defined = {},
    // ----- BEGIN SITECUES CUSTOM BLOCK -----
    //We want Promises to be treated as a module, whether they are native or prim,
    //so that they can be used via define() and we do not have to change
    //the global definition of Promise when we do use prim
      waiting = { Promise:  ['Promise', [], function () { return Promise; }] },
    // ----- END SITECUES CUSTOM BLOCK -----
      config = {
        // Defaults. Do not set a default for map
        // config to speed up normalize(), which
        // will run faster if there is no default.
        baseUrl: './',
        paths: {},
        bundles: {},
        pkgs: {},
        shim: {},
        config: {}
      },
      mapCache = {},
      requireDeferreds = [],
      deferreds = {},
      calledDefine = {},
      calledPlugin = {},
      loadCount = 0,
      startTime = (new Date()).getTime(),
      errCount = 0,
      trackedErrors = {},
      urlFetched = {},
      bundlesMap = {},
      asyncResolve = Promise.resolve();

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
      var i, part, length = ary.length;
      for (i = 0; i < length; i++) {
        part = ary[i];
        if (part === '.') {
          ary.splice(i, 1);
          i -= 1;
        } else if (part === '..') {
          // If at the start, or previous value is still ..,
          // keep them so that when converted to a path it may
          // still work when converted to a path, even though
          // as an ID it is less than ideal. In larger point
          // releases, may be better to just kick out an error.
          if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
            continue;
          } else if (i > 0) {
            ary.splice(i - 1, 2);
            i -= 2;
          }
        }
      }
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @param {Boolean} applyMap apply the map config to the value. Should
     * only be done if this normalization is for a dependency ID.
     * @returns {String} normalized name
     */
    function normalize(name, baseName, applyMap) {
      var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
        foundMap, foundI, foundStarMap, starI,
        baseParts = baseName && baseName.split('/'),
        normalizedBaseParts = baseParts,
        map = config.map,
        starMap = map && map['*'];


      //Adjust any relative paths.
      if (name) {
        name = name.split('/');
        lastIndex = name.length - 1;

        // If wanting node ID compatibility, strip .js from end
        // of IDs. Have to do this here, and not in nameToUrl
        // because node allows either .js or non .js to map
        // to same file.
        if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
          name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
        }

        // Starts with a '.' so need the baseName
        if (name[0].charAt(0) === '.' && baseParts) {
          //Convert baseName to array, and lop off the last part,
          //so that . matches that 'directory' and not name of the baseName's
          //module. For instance, baseName of 'one/two/three', maps to
          //'one/two/three.js', but we want the directory, 'one/two' for
          //this normalization.
          normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
          name = normalizedBaseParts.concat(name);
        }

        trimDots(name);
        name = name.join('/');
      }

      // Apply map config if available.
      if (applyMap && map && (baseParts || starMap)) {
        nameParts = name.split('/');

        outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join('/');

          if (baseParts) {
            // Find the longest baseName segment match in the config.
            // So, do joins on the biggest to smallest lengths of baseParts.
            for (j = baseParts.length; j > 0; j -= 1) {
              mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

              // baseName segment has config, find if it has one for
              // this name.
              if (mapValue) {
                mapValue = getOwn(mapValue, nameSegment);
                if (mapValue) {
                  // Match, update name to the new value.
                  foundMap = mapValue;
                  foundI = i;
                  break outerLoop;
                }
              }
            }
          }

          // Check for a star map match, but just hold on to it,
          // if there is a shorter segment match later in a matching
          // config, then favor over this star map.
          if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
            foundStarMap = getOwn(starMap, nameSegment);
            starI = i;
          }
        }

        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }

        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join('/');
        }
      }

      // If the name points to a package's name, use
      // the package main instead.
      pkgMain = getOwn(config.pkgs, name);

      return pkgMain ? pkgMain : name;
    }

    // ----- BEGIN SITECUES CUSTOM BLOCK -----
    // Shim is not supported
    //function makeShimExports(value) {
    //  function fn() {
    //    var ret;
    //    if (value.init) {
    //      ret = value.init.apply(global, arguments);
    //    }
    //    return ret || (value.exports && getGlobal(value.exports));
    //  }
    //  return fn;
    //}
    // ----- END SITECUES CUSTOM BLOCK -----

    function takeQueue(anonId) {
      var i, id, args, shim;
      for (i = 0; i < queue.length; i += 1) {
        // Peek to see if anon
        if (typeof queue[i][0] !== 'string') {
          if (anonId) {
            queue[i].unshift(anonId);
            anonId = undef;
          } else {
            // Not our anon module, stop.
            break;
          }
        }
        args = queue.shift();
        id = args[0];
        i -= 1;

        if (!hasProp(defined, id) && !hasProp(waiting, id)) {
          if (hasProp(deferreds, id)) {
            main.apply(undef, args);
          } else {
            waiting[id] = args;
          }
        }
      }

      // if get to the end and still have anonId, then could be
      // a shimmed dependency.
      if (anonId) {
        shim = getOwn(config.shim, anonId) || {};
        main(anonId, shim.deps || [], shim.exportsFn);
      }
    }

    function makeRequire(relName, topLevel) {
      var req = function (deps, callback, errback, alt) {
        var name, cfg;

        if (topLevel) {
          takeQueue();
        }

        if (typeof deps === "string") {
          if (handlers[deps]) {
            return handlers[deps](relName);
          }
          // Just return the module wanted. In this scenario, the
          // deps arg is the module name, and second arg (if passed)
          // is just the relName.
          // Normalize module name, if it contains . or ..
          name = makeMap(deps, relName, true).id;
          if (!hasProp(defined, name)) {
            throw new Error('Not loaded: ' + name);
          }
          return defined[name];
        } else if (deps && !Array.isArray(deps)) {
          // deps is a config object, not an array.
          cfg = deps;
          deps = undef;

          if (Array.isArray(callback)) {
            // callback is an array, which means it is a dependency list.
            // Adjust args if there are dependencies
            deps = callback;
            callback = errback;
            errback = alt;
          }

          if (topLevel) {
            // Could be a new context, so call returned require
            return req.config(cfg)(deps, callback, errback);
          }
        }

        // Support require(['a'])
        callback = callback || function () {
            // In case used later as a promise then value, return the
            // arguments as an array.
            return slice.call(arguments, 0);
          };

        // Complete async to maintain expected execution semantics.
        return asyncResolve.then(function () {
          // Grab any modules that were defined after a require call.
          takeQueue();

          return main(undef, deps || [], callback, errback, relName);
        });
      };

      req.isBrowser = typeof document !== 'undefined' &&
        typeof navigator !== 'undefined';

      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      req.nameToUrl = function (moduleName, ext, skipExt) {
        var syms, url, bundleId = moduleName.split('/')[0];

        if (bundleId && bundleId !== 'locale-data') {  // locale-data is all in one subfolder
          return config.baseUrl + bundleId + '.js';
        }

        //A module that needs to be converted to a path.
        syms = moduleName.split('/');

        // Join the path parts together, then figure out if baseUrl is needed.
        url = syms.join('/');
        url += (ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js'));
        url = (url.charAt(0) === '/' ||
          url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;

        return config.urlArgs && !/^blob\:/.test(url) ? url + config.urlArgs(moduleName, url) : url;
      };
      // ----- END SITECUES CUSTOM BLOCK -----

      /**
       * Converts a module name + .extension into an URL path.
       * *Requires* the use of a module name. It does not support using
       * plain URLs like nameToUrl.
       */
      req.toUrl = function (moduleNamePlusExt) {
        var ext,
          index = moduleNamePlusExt.lastIndexOf('.'),
          segment = moduleNamePlusExt.split('/')[0],
          isRelative = segment === '.' || segment === '..';

        // Have a file extension alias, and it is not the
        // dots from a relative path.
        if (index !== -1 && (!isRelative || index > 1)) {
          ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
          moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
        }

        return req.nameToUrl(normalize(moduleNamePlusExt, relName), ext, true);
      };

      req.defined = function (id) {
        return hasProp(defined, makeMap(id, relName, true).id);
      };

      req.specified = function (id) {
        id = makeMap(id, relName, true).id;
        return hasProp(defined, id) || hasProp(deferreds, id);
      };

      return req;
    }

    function resolve(name, d, value) {
      if (name) {
        defined[name] = value;
        if (requirejs.onResourceLoad) {
          requirejs.onResourceLoad(context, d.map, d.deps);
        }
      }
      d.finished = true;
      d.resolve(value);
    }

    function reject(d, err) {
      d.finished = true;
      d.rejected = true;
      d.reject(err);
    }

    function makeNormalize(relName) {
      return function (name) {
        return normalize(name, relName, true);
      };
    }

    function defineModule(d) {
      d.factoryCalled = true;

      var ret,
        name = d.map.id;

      try {
        ret = d.factory.apply(defined[name], d.values);
      } catch(err) {
        return reject(d, err);
      }

      if (name) {
        // Favor return value over exports. If node/cjs in play,
        // then will not have a return value anyway. Favor
        // module.exports assignment over exports object.
        if (ret === undef) {
          if (d.cjsModule) {
            ret = d.cjsModule.exports;
          } else if (d.usingExports) {
            ret = defined[name];
          }
        }
      } else {
        // Remove the require deferred from the list to
        // make cycle searching faster. Do not need to track
        // it anymore either.
        requireDeferreds.splice(requireDeferreds.indexOf(d), 1);
      }
      resolve(name, d, ret);
    }

    // This method is attached to every module deferred,
    // so the "this" in here is the module deferred object.
    function depFinished(val, i) {
      if (!this.rejected && !this.depDefined[i]) {
        this.depDefined[i] = true;
        this.depCount += 1;
        this.values[i] = val;
        if (!this.depending && this.depCount === this.depMax) {
          defineModule(this);
        }
      }
    }

    function makeDefer(name) {
      var d = {};
      d.promise = new Promise(function (resolve, reject) {
        d.resolve = resolve;
        d.reject = function(err) {
          if (!name) {
            requireDeferreds.splice(requireDeferreds.indexOf(d), 1);
          }
          reject(err);
        };
      });
      d.map = name ? makeMap(name, null, true) : {};
      d.depCount = 0;
      d.depMax = 0;
      d.values = [];
      d.depDefined = [];
      d.depFinished = depFinished;
      if (d.map.pr) {
        // Plugin resource ID, implicitly
        // depends on plugin. Track it in deps
        // so cycle breaking can work
        d.deps = [makeMap(d.map.pr)];
      }
      return d;
    }

    function getDefer(name) {
      var d;
      if (name) {
        d = hasProp(deferreds, name) && deferreds[name];
        if (!d) {
          d = deferreds[name] = makeDefer(name);
        }
      } else {
        d = makeDefer();
        requireDeferreds.push(d);
      }
      return d;
    }

    function makeErrback(d, name) {
      return function (err) {
        if (!d.rejected) {
          if (!err.dynaId) {
            err.dynaId = 'id' + (errCount += 1);
            err.requireModules = [name];
          }
          reject(d, err);
        }
      };
    }

    function waitForDep(depMap, relName, d, i) {
      d.depMax += 1;

      // Do the fail at the end to catch errors
      // in the then callback execution.
      callDep(depMap, relName).then(function (val) {
        d.depFinished(val, i);
      }, makeErrback(d, depMap.id)).catch(makeErrback(d, d.map.id));
    }

    function makeLoad(id) {
      var fromTextCalled;
      function load(value) {
        // Protect against older plugins that call load after
        // calling load.fromText
        if (!fromTextCalled) {
          resolve(id, getDefer(id), value);
        }
      }

      load.error = function (err) {
        getDefer(id).reject(err);
      };

      load.fromText = function (text, textAlt) {
        /*jslint evil: true */
        var d = getDefer(id),
          map = makeMap(makeMap(id).n),
          plainId = map.id;

        fromTextCalled = true;

        // Set up the factory just to be a return of the value from
        // plainId.
        d.factory = function (p, val) {
          return val;
        };

        // As of requirejs 2.1.0, support just passing the text, to reinforce
        // fromText only being called once per resource. Still
        // support old style of passing moduleName but discard
        // that moduleName in favor of the internal ref.
        if (textAlt) {
          text = textAlt;
        }

        // Transfer any config to this other module.
        if (hasProp(config.config, id)) {
          config.config[plainId] = config.config[id];
        }

        try {
          req.exec(text);
        } catch (e) {
          reject(d, new Error('fromText eval for ' + plainId +
            ' failed: ' + e));
        }

        // Execute any waiting define created by the plainId
        takeQueue(plainId);

        // Mark this as a dependency for the plugin
        // resource
        d.deps = [map];
        waitForDep(map, null, d, d.deps.length);
      };

      return load;
    }

    load = typeof importScripts === 'function' ?
      function (map) {
        var url = map.url;
        if (urlFetched[url]) {
          return;
        }
        urlFetched[url] = true;

        // Ask for the deferred so loading is triggered.
        // Do this before loading, since loading is sync.
        getDefer(map.id);
        importScripts(url);
        takeQueue(map.id);
      } :
      function (map) {
        var script,
          id = map.id,
          url = map.url;

        if (urlFetched[url]) {
          return;
        }
        urlFetched[url] = true;

        script = document.createElement('script');
        // ----- BEGIN SITECUES CUSTOM BLOCK -----
        // We need this so that we have permission to log unhandled rejections/exceptions from our cross-origin scripts
        script.setAttribute('crossorigin', 'anonymous');
        // ----- END SITECUES CUSTOM BLOCK -----
        script.setAttribute('data-requiremodule', id);
        script.type = config.scriptType || 'text/javascript';
        script.charset = 'utf-8';
        script.async = true;

        loadCount += 1;

        script.addEventListener('load', function () {
          loadCount -= 1;
          takeQueue(id);
        }, false);
        script.addEventListener('error', function () {
          loadCount -= 1;
          var err,
            pathConfig = getOwn(config.paths, id),
            d = getOwn(deferreds, id);
          if (pathConfig && Array.isArray(pathConfig) &&
            pathConfig.length > 1) {
            script.parentNode.removeChild(script);
            // Pop off the first array value, since it failed, and
            // retry
            pathConfig.shift();
            d.map = makeMap(id);
            load(d.map);
          } else {
            err = new Error('Load failed: ' + id + ': ' + script.src);
            err.requireModules = [id];
            getDefer(id).reject(err);
          }
        }, false);

        script.src = url;

        document.head.appendChild(script);
      };

    function callPlugin(plugin, map, relName) {
      plugin.load(map.n, makeRequire(relName), makeLoad(map.id), config);
    }

    callDep = function (map, relName) {
      var args, bundleId,
        name = map.id,
        shim = config.shim[name];

      if (hasProp(waiting, name)) {
        args = waiting[name];
        delete waiting[name];
        main.apply(undef, args);
      } else if (!hasProp(deferreds, name)) {
        if (map.pr) {
          // If a bundles config, then just load that file instead to
          // resolve the plugin, as it is built into that bundle.
          if ((bundleId = getOwn(bundlesMap, name))) {
            map.url = req.nameToUrl(bundleId);
            load(map);
          } else {
            return callDep(makeMap(map.pr)).then(function (plugin) {
              // Redo map now that plugin is known to be loaded
              var newMap = makeMap(name, relName, true),
                newId = newMap.id,
                shim = getOwn(config.shim, newId);

              // Make sure to only call load once per resource. Many
              // calls could have been queued waiting for plugin to load.
              if (!hasProp(calledPlugin, newId)) {
                calledPlugin[newId] = true;
                if (shim && shim.deps) {
                  req(shim.deps, function () {
                    callPlugin(plugin, newMap, relName);
                  });
                } else {
                  callPlugin(plugin, newMap, relName);
                }
              }
              return getDefer(newId).promise;
            });
          }
        } else if (shim && shim.deps) {
          req(shim.deps, function () {
            load(map);
          });
        } else {
          load(map);
        }
      }

      return getDefer(name).promise;
    };

    // Turns a plugin!resource to [plugin, resource]
    // with the plugin being undefined if the name
    // did not have a plugin prefix.
    function splitPrefix(name) {
      var prefix,
        index = name ? name.indexOf('!') : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName, applyMap) {
      if (typeof name !== 'string') {
        return name;
      }

      var plugin, url, parts, prefix, result,
        cacheKey = name + ' & ' + (relName || '') + ' & ' + !!applyMap;

      parts = splitPrefix(name);
      prefix = parts[0];
      name = parts[1];

      if (!prefix && hasProp(mapCache, cacheKey)) {
        return mapCache[cacheKey];
      }

      if (prefix) {
        prefix = normalize(prefix, relName, applyMap);
        plugin = hasProp(defined, prefix) && defined[prefix];
      }

      // Normalize according
      if (prefix) {
        if (plugin && plugin.normalize) {
          name = plugin.normalize(name, makeNormalize(relName));
        } else {
          // If nested plugin references, then do not try to
          // normalize, as it will not normalize correctly. This
          // places a restriction on resourceIds, and the longer
          // term solution is not to normalize until plugins are
          // loaded and all normalizations to allow for async
          // loading of a loader plugin. But for now, fixes the
          // common uses. Details in requirejs#1131
          name = name.indexOf('!') === -1 ?
            normalize(name, relName, applyMap) :
            name;
        }
      } else {
        name = normalize(name, relName, applyMap);
        parts = splitPrefix(name);
        prefix = parts[0];
        name = parts[1];

        url = req.nameToUrl(name);
      }

      // Using ridiculous property names for space reasons
      result = {
        id: prefix ? prefix + '!' + name : name, // fullName
        n: name,
        pr: prefix,
        url: url
      };

      if (!prefix) {
        mapCache[cacheKey] = result;
      }

      return result;
    };

    handlers = {
      require: function (name) {
        return makeRequire(name);
      },
      exports: function (name) {
        var e = defined[name];
        if (typeof e !== 'undefined') {
          return e;
        } else {
          return (defined[name] = {});
        }
      },
      module: function (name) {
        return {
          id: name,
          uri: '',
          exports: handlers.exports(name),
          config: function () {
            return getOwn(config.config, name) || {};
          }
        };
      }
    };

    function breakCycle(d, traced, processed) {
      var id = d.map.id;

      traced[id] = true;
      if (!d.finished && d.deps) {
        d.deps.forEach(function (depMap) {
          var depId = depMap.id,
            dep = !hasProp(handlers, depId) && getDefer(depId);

          // Only force things that have not completed
          // being defined, so still in the registry,
          // and only if it has not been matched up
          // in the module already.
          if (dep && !dep.finished && !processed[depId]) {
            if (hasProp(traced, depId)) {
              d.deps.forEach(function (depMap, i) {
                if (depMap.id === depId) {
                  d.depFinished(defined[depId], i);
                }
              });
            } else {
              breakCycle(dep, traced, processed);
            }
          }
        });
      }
      processed[id] = true;
    }

    function check(d) {
      var err,
        notFinished = [],
        waitInterval = config.waitSeconds * 1000,
      // It is possible to disable the wait interval by using waitSeconds 0.
        expired = waitInterval &&
          (startTime + waitInterval) < (new Date()).getTime();

      if (loadCount === 0) {
        // If passed in a deferred, it is for a specific require call.
        // Could be a sync case that needs resolution right away.
        // Otherwise, if no deferred, means it was the last ditch
        // timeout-based check, so check all waiting require deferreds.
        if (d) {
          if (!d.finished) {
            breakCycle(d, {}, {});
          }
        } else if (requireDeferreds.length) {
          requireDeferreds.forEach(function (d) {
            breakCycle(d, {}, {});
          });
        }
      }

      // If still waiting on loads, and the waiting load is something
      // other than a plugin resource, or there are still outstanding
      // scripts, then just try back later.
      if (expired) {
        // If wait time expired, throw error of unloaded modules.
        eachProp(deferreds, function (d) {
          if (!d.finished) {
            notFinished.push(d.map.id);
          }
        });
        err = new Error('Timeout for modules: ' + notFinished);
        err.requireModules = notFinished;
        req.onError(err);
      } else
      if (loadCount || requireDeferreds.length) {
        // Something is still waiting to load. Wait for it, but only
        // if a later check is not already scheduled. Using setTimeout
        // because want other things in the event loop to happen,
        // to help in dependency resolution, and this is really a
        // last ditch check, mostly for detecting timeouts (cycles
        // should come through the main() use of check()), so it can
        // wait a bit before doing the final check.
        if (!checkingLater) {
          checkingLater = true;
          setTimeout(function () {
            checkingLater = false;
            check();
          }, 70);
        }
      }
    }

    // Used to break out of the promise try/catch chains.
    function delayedError(e) {
      setTimeout(function () {
        if (!e.dynaId || !trackedErrors[e.dynaId]) {
          trackedErrors[e.dynaId] = true;
          req.onError(e);
        }
      });
      return e;
    }

    main = function (name, deps, factory, errback, relName) {
      // Only allow main calling once per module.
      if (name && hasProp(calledDefine, name)) {
        return;
      }
      calledDefine[name] = true;

      var d = getDefer(name);

      // This module may not have dependencies
      if (deps && !Array.isArray(deps)) {
        // deps is not an array, so probably means
        // an object literal or factory function for
        // the value. Adjust args.
        factory = deps;
        deps = [];
      }

      if (!errback) {
        if (hasProp(config, 'defaultErrback')) {
          if (config.defaultErrback) {
            errback = config.defaultErrback;
          }
        } else {
          errback = delayedError;
        }
      }

      if (errback) {
        d.promise.catch(errback);
      }

      // Use name if no relName
      relName = relName || name;

      // Call the factory to define the module, if necessary.
      if (typeof factory === 'function') {

        if (!deps.length && factory.length) {
          // Remove comments from the callback string,
          // look for require calls, and pull them into the dependencies,
          // but only if there are function args.
          factory
            .toString()
            .replace(commentRegExp, commentReplace)
            .replace(cjsRequireRegExp, function (match, dep) {
              deps.push(dep);
            });

          // May be a CommonJS thing even without require calls, but still
          // could use exports, and module. Avoid doing exports and module
          // work though if it just needs require.
          // REQUIRES the function to expect the CommonJS variables in the
          // order listed below.
          deps = (factory.length === 1 ?
            ['require'] :
            ['require', 'exports', 'module']).concat(deps);
        }

        // Save info for use later.
        d.factory = factory;
        d.deps = deps;

        d.depending = true;
        deps.forEach(function (depName, i) {
          var depMap;
          deps[i] = depMap = makeMap(depName, relName, true);
          depName = depMap.id;

          // Fast path CommonJS standard dependencies.
          if (depName === "require") {
            d.values[i] = handlers.require(name);
          } else if (depName === "exports") {
            // CommonJS module spec 1.1
            d.values[i] = handlers.exports(name);
            d.usingExports = true;
          } else if (depName === "module") {
            // CommonJS module spec 1.1
            d.values[i] = d.cjsModule = handlers.module(name);
          } else if (depName === undefined) {
            d.values[i] = undefined;
          } else {
            waitForDep(depMap, relName, d, i);
          }
        });
        d.depending = false;

        // Some modules just depend on the require, exports, modules, so
        // trigger their definition here if so.
        if (d.depCount === d.depMax) {
          defineModule(d);
        }
      } else if (name) {
        // May just be an object definition for the module. Only
        // worry about defining if have a module name.
        resolve(name, d, factory);
      }

      startTime = (new Date()).getTime();

      if (!name) {
        check(d);
      }

      return d.promise;
    };

    req = makeRequire(null, true);

    /*
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
      if (cfg.context && cfg.context !== contextName) {
        return newContext(cfg.context).config(cfg);
      }

      // Since config changed, mapCache may not be valid any more.
      mapCache = {};

      // Make sure the baseUrl ends in a slash.
      if (cfg.baseUrl) {
        if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
          cfg.baseUrl += '/';
        }
      }

      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      // No support for urlArgs config
      //// Convert old style urlArgs string to a function.
      //if (typeof cfg.urlArgs === 'string') {
      //  var urlArgs = cfg.urlArgs;
      //  cfg.urlArgs = function(id, url) {
      //    return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
      //  };
      //}
      // ----- END SITECUES CUSTOM BLOCK -----

      // Save off the paths and packages since they require special processing,
      // they are additive.
      var // shim = config.shim,
        objs = {
          paths: true,
          bundles: true,
          config: true,
          map: true
        };

      eachProp(cfg, function (value, prop) {
        if (objs[prop]) {
          if (!config[prop]) {
            config[prop] = {};
          }
          mixin(config[prop], value, true, true);
        } else {
          config[prop] = value;
        }
      });

      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      // Removing unused code for bundles, shim, packages, deps
      // Reverse map the bundles
      //if (cfg.bundles) {
      //  eachProp(cfg.bundles, function (value, prop) {
      //    value.forEach(function (v) {
      //      if (v !== prop) {
      //        bundlesMap[v] = prop;
      //      }
      //    });
      //  });
      //}
      //
      //// Merge shim
      //if (cfg.shim) {
      //  eachProp(cfg.shim, function (value, id) {
      //    // Normalize the structure
      //    if (Array.isArray(value)) {
      //      value = {
      //        deps: value
      //      };
      //    }
      //    if ((value.exports || value.init) && !value.exportsFn) {
      //      value.exportsFn = makeShimExports(value);
      //    }
      //    shim[id] = value;
      //  });
      //  config.shim = shim;
      //}
      //
      //// Adjust packages if necessary.
      //if (cfg.packages) {
      //  cfg.packages.forEach(function (pkgObj) {
      //    var location, name;
      //
      //    pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;
      //
      //    name = pkgObj.name;
      //    location = pkgObj.location;
      //    if (location) {
      //      config.paths[name] = pkgObj.location;
      //    }
      //
      //    // Save pointer to main module ID for pkg name.
      //    // Remove leading dot in main, so main paths are normalized,
      //    // and remove any trailing .js, since different package
      //    // envs have different conventions: some use a module name,
      //    // some use a file name.
      //    config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
      //        .replace(currDirRegExp, '')
      //        .replace(jsSuffixRegExp, '');
      //  });
      //}
      //
      //// If a deps array or a config callback is specified, then call
      //// require with those args. This is useful when require is defined as a
      //// config object before require.js is loaded.
      //if (cfg.deps || cfg.callback) {
      //  req(cfg.deps, cfg.callback);
      //}
      // ----- END SITECUES CUSTOM BLOCK -----

      return req;
    };

    req.onError = function (err) {
      throw err;
    };

    context = {
      id: contextName,
      defined: defined,
      waiting: waiting,
      config: config,
      deferreds: deferreds
    };

    contexts[contextName] = context;

    return req;
  }

  requirejs = topReq = newContext('_');

  if (typeof require !== 'function') {
    require = topReq;
  }

  /**
   * Executes the text. Normally just uses eval, but can be modified
   * to use a better, environment-specific call. Only used for transpiling
   * loader plugins, not for plain JS modules.
   * @param {String} text the text to execute/evaluate.
   */
  topReq.exec = function (text) {
    /*jslint evil: true */
    return eval(text);
  };

  topReq.contexts = contexts;

  define = function () {
    queue.push(slice.call(arguments, 0));
  };

  define.amd = {
    jQuery: true
  };

  if (bootstrapConfig) {
    topReq.config(bootstrapConfig);
  }

  // ----- BEGIN SITECUES CUSTOM BLOCK -----
  // Removing data-main support as it is not needed. In fact it is not acceptable because we are a 3rd party
  // application and customers have no reason to assume we would run data-main scripts.
  //// data-main support.
  //if (topReq.isBrowser && !contexts._.config.skipDataMain) {
  //  dataMain = document.querySelectorAll('script[data-main]')[0];
  //  dataMain = dataMain && dataMain.getAttribute('data-main');
  //  if (dataMain) {
  //    // Strip off any trailing .js since dataMain is now
  //    // like a module name.
  //    dataMain = dataMain.replace(jsSuffixRegExp, '');
  //
  //    // Set final baseUrl if there is not already an explicit one,
  //    // but only do so if the data-main value is not a loader plugin
  //    // module ID.
  //    if ((!bootstrapConfig || !bootstrapConfig.baseUrl) &&
  //      dataMain.indexOf('!') === -1) {
  //      // Pull off the directory of data-main for use as the
  //      // baseUrl.
  //      src = dataMain.split('/');
  //      dataMain = src.pop();
  //      subPath = src.length ? src.join('/')  + '/' : './';
  //
  //      topReq.config({baseUrl: subPath});
  //    }
  //
  //    topReq([dataMain]);
  //  }
  //}
// ----- END SITECUES CUSTOM BLOCK -----
}(this, (typeof Promise !== 'undefined' ? Promise : undefined)));
