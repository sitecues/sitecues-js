if (sitecues && sitecues.exists) {
  throw new Error("The sitecues library already exists on this page.");
}

Object.defineProperty(sitecues, "version", {
  value: "20161018220841-LOCAL-AARON",
  writable: false
});

/**
 * These are modules that the minicore implements for us
 * IMPORTANT: they must be marked as 'empty:' in task/common/amd-config
 * sitecues._getHelperFrame must also be defined by the minicore
 */
sitecues.define("mini-core/native-global", [], function() {
  return sitecues._shared.nativeGlobal;
});

sitecues.define("mini-core/page-view", [], function() {
  return sitecues._shared.pageView;
});

sitecues.define("mini-core/session", [], function() {
  return sitecues._shared.session;
});

sitecues.define("mini-core/site", [], function() {
  return sitecues._shared.site;
});

sitecues.define("mini-core/user", [], function() {
  return sitecues._shared.user;
});

// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
// Currently only needed for IE11
// Used for SitecuesPromiseError events, which help log errors that occur inside Sitecues promises
// Must be inserted before alameda by the build process
!function() {
  if ("function" === typeof window.CustomEvent) {
    return false;
  }
  function CustomEvent(event, params) {
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: void 0
    };
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}();

// Alameda configuration
// Must be inserted before alameda by the build process
/* globals SC_RESOURCE_FOLDER_NAME  */
sitecues._require = {
  defaultErrback: function(error) {
    var event = new CustomEvent("SitecuesRequireFailure", {
      detail: error
    });
    window.dispatchEvent(event);
  },
  waitSeconds: 30,
  baseUrl: function(config) {
    var resourceFolderName = SC_RESOURCE_FOLDER_NAME, scriptUrl = config.scriptUrl || config.script_url, // Old load script sometimes used underscore names, which is deprecated but still supported
    folderOnly = scriptUrl.substring(0, scriptUrl.lastIndexOf("/js/")), withVersionName = folderOnly + "/" + resourceFolderName + "/js/", withLatestReplaced = withVersionName.replace("/latest/", "/" + resourceFolderName + "/");
    // The /latest/ means the current version
    return withLatestReplaced;
  }(sitecues.everywhereConfig || sitecues.config),
  map: {
    "*": {
      $: "page/jquery/jquery"
    }
  }
};

var sitecues;

!function() {
  if (!sitecues || !sitecues.requirejs) {
    if (!sitecues) {
      sitecues = {};
    } else {
      require = sitecues;
    }
    /**
 * @license alameda-sitecues 0.0.1 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/alameda/LICENSE
 */
    // Going sloppy because loader plugin execs may depend on non-strict execution.
    /*jslint sloppy: true, nomen: true, regexp: true */
    /*global document, navigator, importScripts, Promise, setTimeout */
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
    !function(global, Promise, undef) {
      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      function reportError(error) {
        var event = new CustomEvent("SitecuesUnhandledRejection", {
          detail: error
        });
        window.dispatchEvent(event);
      }
      // ----- END SITECUES CUSTOM BLOCK -----
      if (!Promise) {
        //START prim 1.0.0
        /**
     * Changes from baseline prim
     * - removed UMD registration
     * - Assigns Promise = prim at the bottom.
     */
        !function() {
          "use strict";
          var prim, waitingId, nextTick, waiting = [];
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
            return "object" === type || "function" === type;
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
            prim.nextTick(function() {
              ary.forEach(function(item) {
                item(value);
              });
            });
          }
          function callback(p, ok, yes) {
            if (p.hasOwnProperty("v")) {
              prim.nextTick(function() {
                yes(p.v);
              });
            } else {
              ok.push(yes);
            }
          }
          function errback(p, fail, no) {
            if (p.hasOwnProperty("e")) {
              prim.nextTick(function() {
                no(p.e);
              });
            } else {
              fail.push(no);
            }
          }
          prim = function prim(fn) {
            var promise, f, p = {}, ok = [], fail = [];
            function makeFulfill() {
              var f, f2, called = false;
              function fulfill(v, prop, listeners) {
                if (called) {
                  return;
                }
                called = true;
                if (promise === v) {
                  called = false;
                  f.reject(new TypeError("value is same promise"));
                  return;
                }
                try {
                  var then = v && v.then;
                  if (isFunObj(v) && "function" === typeof then && // if error, keep on error pathway if a promise,
                  // 2.2.7.2 tests.
                  "e" !== prop) {
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
                resolve: function(v) {
                  fulfill(v, "v", ok);
                },
                reject: function(e) {
                  fulfill(e, "e", fail);
                }
              };
              return f;
            }
            f = makeFulfill();
            promise = {
              then: function(yes, no) {
                var next = prim(function(nextResolve, nextReject) {
                  function finish(fn, nextFn, v) {
                    try {
                      if (fn && "function" === typeof fn) {
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
                  callback(p, ok, finish.bind(void 0, yes, nextResolve));
                  errback(p, fail, finish.bind(void 0, no, nextReject));
                });
                return next;
              },
              catch: function(no) {
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
          prim.resolve = function(value) {
            return prim(function(yes) {
              yes(value);
            });
          };
          prim.reject = function(err) {
            return prim(function(yes, no) {
              no(err);
            });
          };
          prim.cast = function(x) {
            // A bit of a weak check, want "then" to be a function,
            // but also do not want to trigger a getter if accessing
            // it. Good enough for now.
            if (isFunObj(x) && "then" in x) {
              return x;
            } else {
              return prim(function(yes, no) {
                if (x instanceof Error) {
                  no(x);
                } else {
                  yes(x);
                }
              });
            }
          };
          prim.all = function(ary) {
            return prim(function(yes, no) {
              var count = 0, length = ary.length, result = [];
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
                ary.forEach(function(item, i) {
                  prim.cast(item).then(function(v) {
                    resolved(i, v);
                  }, function(err) {
                    no(err);
                  });
                });
              }
            });
          };
          prim.nextTick = nextTick;
          Promise = prim;
        }();
      }
      var topReq, setTimeout, slice, hasOwn, bootstrapConfig = requirejs || require, contexts = {}, queue = [], // ----- BEGIN SITECUES CUSTOM BLOCK -----
      //currDirRegExp = /^\.\//,
      // ----- END SITECUES CUSTOM BLOCK -----
      commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm, cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g, jsSuffixRegExp = /\.js$/;
      if ("function" === typeof requirejs) {
        return;
      }
      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      function cacheNativeFnReferences() {
        hasOwn = Object.prototype.hasOwnProperty;
        setTimeout = sitecues._shared.nativeGlobal.setTimeout;
        slice = Array.prototype.slice;
      }
      // ----- END SITECUES CUSTOM BLOCK -----
      // Could match something like ')//comment', do not lose the prefix to comment.
      function commentReplace(match, multi, multiText, singlePrefix) {
        return singlePrefix || "";
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
          eachProp(source, function(value, prop) {
            if (force || !hasProp(target, prop)) {
              if (deepStringMixin && "object" === typeof value && value && !Array.isArray(value) && "function" !== typeof value && !(value instanceof RegExp)) {
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
        var req, main, makeMap, callDep, handlers, checkingLater, load, context, defined = {}, // ----- BEGIN SITECUES CUSTOM BLOCK -----
        //We want Promises to be treated as a module, whether they are native or prim,
        //so that they can be used via define() and we do not have to change
        //the global definition of Promise when we do use prim
        waiting = {
          Promise: [ "Promise", [], function() {
            return Promise;
          } ]
        }, // ----- END SITECUES CUSTOM BLOCK -----
        config = {
          // Defaults. Do not set a default for map
          // config to speed up normalize(), which
          // will run faster if there is no default.
          baseUrl: "./",
          paths: {},
          bundles: {},
          pkgs: {},
          shim: {},
          config: {}
        }, mapCache = {}, requireDeferreds = [], deferreds = {}, calledDefine = {}, calledPlugin = {}, loadCount = 0, startTime = new Date().getTime(), errCount = 0, trackedErrors = {}, urlFetched = {}, bundlesMap = {}, asyncResolve = Promise.resolve();
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
            if ("." === part) {
              ary.splice(i, 1);
              i -= 1;
            } else {
              if (".." === part) {
                // If at the start, or previous value is still ..,
                // keep them so that when converted to a path it may
                // still work when converted to a path, even though
                // as an ID it is less than ideal. In larger point
                // releases, may be better to just kick out an error.
                if (0 === i || 1 === i && ".." === ary[2] || ".." === ary[i - 1]) {
                  continue;
                } else {
                  if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                  }
                }
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
          var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex, foundMap, foundI, foundStarMap, starI, baseParts = baseName && baseName.split("/"), normalizedBaseParts = baseParts, map = config.map, starMap = map && map["*"];
          //Adjust any relative paths.
          if (name) {
            name = name.split("/");
            lastIndex = name.length - 1;
            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
              name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "");
            }
            // Starts with a '.' so need the baseName
            if ("." === name[0].charAt(0) && baseParts) {
              //Convert baseName to array, and lop off the last part,
              //so that . matches that 'directory' and not name of the baseName's
              //module. For instance, baseName of 'one/two/three', maps to
              //'one/two/three.js', but we want the directory, 'one/two' for
              //this normalization.
              normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
              name = normalizedBaseParts.concat(name);
            }
            trimDots(name);
            name = name.join("/");
          }
          // Apply map config if available.
          if (applyMap && map && (baseParts || starMap)) {
            nameParts = name.split("/");
            outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
              nameSegment = nameParts.slice(0, i).join("/");
              if (baseParts) {
                // Find the longest baseName segment match in the config.
                // So, do joins on the biggest to smallest lengths of baseParts.
                for (j = baseParts.length; j > 0; j -= 1) {
                  mapValue = getOwn(map, baseParts.slice(0, j).join("/"));
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
              name = nameParts.join("/");
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
            if ("string" !== typeof queue[i][0]) {
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
          var req = function(deps, callback, errback, alt) {
            var name, cfg;
            if (topLevel) {
              takeQueue();
            }
            if ("string" === typeof deps) {
              if (handlers[deps]) {
                return handlers[deps](relName);
              }
              // Just return the module wanted. In this scenario, the
              // deps arg is the module name, and second arg (if passed)
              // is just the relName.
              // Normalize module name, if it contains . or ..
              name = makeMap(deps, relName, true).id;
              if (!hasProp(defined, name)) {
                throw new Error("Not loaded: " + name);
              }
              return defined[name];
            } else {
              if (deps && !Array.isArray(deps)) {
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
            }
            // Support require(['a'])
            callback = callback || function() {
              // In case used later as a promise then value, return the
              // arguments as an array.
              return slice.call(arguments, 0);
            };
            // Complete async to maintain expected execution semantics.
            return asyncResolve.then(function() {
              // Grab any modules that were defined after a require call.
              takeQueue();
              return main(undef, deps || [], callback, errback, relName);
            });
          };
          req.isBrowser = "undefined" !== typeof document && "undefined" !== typeof navigator;
          // ----- BEGIN SITECUES CUSTOM BLOCK -----
          req.nameToUrl = function(moduleName, ext, skipExt) {
            var syms, url, bundleId = moduleName.split("/")[0];
            if (bundleId && "locale-data" !== bundleId) {
              // locale-data is all in one subfolder
              return config.baseUrl + bundleId + ".js";
            }
            //A module that needs to be converted to a path.
            syms = moduleName.split("/");
            // Join the path parts together, then figure out if baseUrl is needed.
            url = syms.join("/");
            url += ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? "" : ".js");
            url = ("/" === url.charAt(0) || url.match(/^[\w\+\.\-]+:/) ? "" : config.baseUrl) + url;
            return config.urlArgs && !/^blob\:/.test(url) ? url + config.urlArgs(moduleName, url) : url;
          };
          // ----- END SITECUES CUSTOM BLOCK -----
          /**
       * Converts a module name + .extension into an URL path.
       * *Requires* the use of a module name. It does not support using
       * plain URLs like nameToUrl.
       */
          req.toUrl = function(moduleNamePlusExt) {
            var ext, index = moduleNamePlusExt.lastIndexOf("."), segment = moduleNamePlusExt.split("/")[0], isRelative = "." === segment || ".." === segment;
            // Have a file extension alias, and it is not the
            // dots from a relative path.
            if (index !== -1 && (!isRelative || index > 1)) {
              ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
              moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
            }
            return req.nameToUrl(normalize(moduleNamePlusExt, relName), ext, true);
          };
          req.defined = function(id) {
            return hasProp(defined, makeMap(id, relName, true).id);
          };
          req.specified = function(id) {
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
          return function(name) {
            return normalize(name, relName, true);
          };
        }
        function defineModule(d) {
          d.factoryCalled = true;
          var ret, name = d.map.id;
          try {
            ret = d.factory.apply(defined[name], d.values);
          } catch (err) {
            return reject(d, err);
          }
          if (name) {
            // Favor return value over exports. If node/cjs in play,
            // then will not have a return value anyway. Favor
            // module.exports assignment over exports object.
            if (ret === undef) {
              if (d.cjsModule) {
                ret = d.cjsModule.exports;
              } else {
                if (d.usingExports) {
                  ret = defined[name];
                }
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
          d.promise = new Promise(function(resolve, reject) {
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
            d.deps = [ makeMap(d.map.pr) ];
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
          return function(err) {
            if (!d.rejected) {
              if (!err.dynaId) {
                err.dynaId = "id" + (errCount += 1);
                err.requireModules = [ name ];
              }
              reject(d, err);
            }
          };
        }
        function waitForDep(depMap, relName, d, i) {
          d.depMax += 1;
          // Do the fail at the end to catch errors
          // in the then callback execution.
          callDep(depMap, relName).then(function(val) {
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
          load.error = function(err) {
            getDefer(id).reject(err);
          };
          load.fromText = function(text, textAlt) {
            /*jslint evil: true */
            var d = getDefer(id), map = makeMap(makeMap(id).n), plainId = map.id;
            fromTextCalled = true;
            // Set up the factory just to be a return of the value from
            // plainId.
            d.factory = function(p, val) {
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
              reject(d, new Error("fromText eval for " + plainId + " failed: " + e));
            }
            // Execute any waiting define created by the plainId
            takeQueue(plainId);
            // Mark this as a dependency for the plugin
            // resource
            d.deps = [ map ];
            waitForDep(map, null, d, d.deps.length);
          };
          return load;
        }
        load = "function" === typeof importScripts ? function(map) {
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
        } : function(map) {
          var script, id = map.id, url = map.url;
          if (urlFetched[url]) {
            return;
          }
          urlFetched[url] = true;
          script = document.createElement("script");
          // ----- BEGIN SITECUES CUSTOM BLOCK -----
          // We need this so that we have permission to log unhandled rejections/exceptions from our cross-origin scripts
          script.setAttribute("crossorigin", "anonymous");
          // ----- END SITECUES CUSTOM BLOCK -----
          script.setAttribute("data-requiremodule", id);
          script.type = config.scriptType || "text/javascript";
          script.charset = "utf-8";
          script.async = true;
          loadCount += 1;
          script.addEventListener("load", function() {
            loadCount -= 1;
            takeQueue(id);
          }, false);
          script.addEventListener("error", function() {
            loadCount -= 1;
            var err, pathConfig = getOwn(config.paths, id), d = getOwn(deferreds, id);
            if (pathConfig && Array.isArray(pathConfig) && pathConfig.length > 1) {
              script.parentNode.removeChild(script);
              // Pop off the first array value, since it failed, and
              // retry
              pathConfig.shift();
              d.map = makeMap(id);
              load(d.map);
            } else {
              err = new Error("Load failed: " + id + ": " + script.src);
              err.requireModules = [ id ];
              getDefer(id).reject(err);
            }
          }, false);
          script.src = url;
          document.head.appendChild(script);
        };
        function callPlugin(plugin, map, relName) {
          plugin.load(map.n, makeRequire(relName), makeLoad(map.id), config);
        }
        callDep = function(map, relName) {
          var args, bundleId, name = map.id, shim = config.shim[name];
          if (hasProp(waiting, name)) {
            args = waiting[name];
            delete waiting[name];
            main.apply(undef, args);
          } else {
            if (!hasProp(deferreds, name)) {
              if (map.pr) {
                // If a bundles config, then just load that file instead to
                // resolve the plugin, as it is built into that bundle.
                if (bundleId = getOwn(bundlesMap, name)) {
                  map.url = req.nameToUrl(bundleId);
                  load(map);
                } else {
                  return callDep(makeMap(map.pr)).then(function(plugin) {
                    // Redo map now that plugin is known to be loaded
                    var newMap = makeMap(name, relName, true), newId = newMap.id, shim = getOwn(config.shim, newId);
                    // Make sure to only call load once per resource. Many
                    // calls could have been queued waiting for plugin to load.
                    if (!hasProp(calledPlugin, newId)) {
                      calledPlugin[newId] = true;
                      if (shim && shim.deps) {
                        req(shim.deps, function() {
                          callPlugin(plugin, newMap, relName);
                        });
                      } else {
                        callPlugin(plugin, newMap, relName);
                      }
                    }
                    return getDefer(newId).promise;
                  });
                }
              } else {
                if (shim && shim.deps) {
                  req(shim.deps, function() {
                    load(map);
                  });
                } else {
                  load(map);
                }
              }
            }
          }
          return getDefer(name).promise;
        };
        // Turns a plugin!resource to [plugin, resource]
        // with the plugin being undefined if the name
        // did not have a plugin prefix.
        function splitPrefix(name) {
          var prefix, index = name ? name.indexOf("!") : -1;
          if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
          }
          return [ prefix, name ];
        }
        /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
        makeMap = function(name, relName, applyMap) {
          if ("string" !== typeof name) {
            return name;
          }
          var plugin, url, parts, prefix, result, cacheKey = name + " & " + (relName || "") + " & " + !!applyMap;
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
              name = name.indexOf("!") === -1 ? normalize(name, relName, applyMap) : name;
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
            id: prefix ? prefix + "!" + name : name,
            // fullName
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
          require: function(name) {
            return makeRequire(name);
          },
          exports: function(name) {
            var e = defined[name];
            if ("undefined" !== typeof e) {
              return e;
            } else {
              return defined[name] = {};
            }
          },
          module: function(name) {
            return {
              id: name,
              uri: "",
              exports: handlers.exports(name),
              config: function() {
                return getOwn(config.config, name) || {};
              }
            };
          }
        };
        function breakCycle(d, traced, processed) {
          var id = d.map.id;
          traced[id] = true;
          if (!d.finished && d.deps) {
            d.deps.forEach(function(depMap) {
              var depId = depMap.id, dep = !hasProp(handlers, depId) && getDefer(depId);
              // Only force things that have not completed
              // being defined, so still in the registry,
              // and only if it has not been matched up
              // in the module already.
              if (dep && !dep.finished && !processed[depId]) {
                if (hasProp(traced, depId)) {
                  d.deps.forEach(function(depMap, i) {
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
          var err, notFinished = [], waitInterval = 1e3 * config.waitSeconds, // It is possible to disable the wait interval by using waitSeconds 0.
          expired = waitInterval && startTime + waitInterval < new Date().getTime();
          if (0 === loadCount) {
            // If passed in a deferred, it is for a specific require call.
            // Could be a sync case that needs resolution right away.
            // Otherwise, if no deferred, means it was the last ditch
            // timeout-based check, so check all waiting require deferreds.
            if (d) {
              if (!d.finished) {
                breakCycle(d, {}, {});
              }
            } else {
              if (requireDeferreds.length) {
                requireDeferreds.forEach(function(d) {
                  breakCycle(d, {}, {});
                });
              }
            }
          }
          // If still waiting on loads, and the waiting load is something
          // other than a plugin resource, or there are still outstanding
          // scripts, then just try back later.
          if (expired) {
            // If wait time expired, throw error of unloaded modules.
            eachProp(deferreds, function(d) {
              if (!d.finished) {
                notFinished.push(d.map.id);
              }
            });
            err = new Error("Timeout for modules: " + notFinished);
            err.requireModules = notFinished;
            req.onError(err);
          } else {
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
                setTimeout(function() {
                  checkingLater = false;
                  check();
                }, 70);
              }
            }
          }
        }
        // Used to break out of the promise try/catch chains.
        function delayedError(e) {
          setTimeout(function() {
            if (!e.dynaId || !trackedErrors[e.dynaId]) {
              trackedErrors[e.dynaId] = true;
              req.onError(e);
            }
          });
          return e;
        }
        main = function(name, deps, factory, errback, relName) {
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
            if (hasProp(config, "defaultErrback")) {
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
          if ("function" === typeof factory) {
            if (!deps.length && factory.length) {
              // Remove comments from the callback string,
              // look for require calls, and pull them into the dependencies,
              // but only if there are function args.
              factory.toString().replace(commentRegExp, commentReplace).replace(cjsRequireRegExp, function(match, dep) {
                deps.push(dep);
              });
              // May be a CommonJS thing even without require calls, but still
              // could use exports, and module. Avoid doing exports and module
              // work though if it just needs require.
              // REQUIRES the function to expect the CommonJS variables in the
              // order listed below.
              deps = (1 === factory.length ? [ "require" ] : [ "require", "exports", "module" ]).concat(deps);
            }
            // Save info for use later.
            d.factory = factory;
            d.deps = deps;
            d.depending = true;
            deps.forEach(function(depName, i) {
              var depMap;
              deps[i] = depMap = makeMap(depName, relName, true);
              depName = depMap.id;
              // Fast path CommonJS standard dependencies.
              if ("require" === depName) {
                d.values[i] = handlers.require(name);
              } else {
                if ("exports" === depName) {
                  // CommonJS module spec 1.1
                  d.values[i] = handlers.exports(name);
                  d.usingExports = true;
                } else {
                  if ("module" === depName) {
                    // CommonJS module spec 1.1
                    d.values[i] = d.cjsModule = handlers.module(name);
                  } else {
                    if (void 0 === depName) {
                      d.values[i] = void 0;
                    } else {
                      waitForDep(depMap, relName, d, i);
                    }
                  }
                }
              }
            });
            d.depending = false;
            // Some modules just depend on the require, exports, modules, so
            // trigger their definition here if so.
            if (d.depCount === d.depMax) {
              defineModule(d);
            }
          } else {
            if (name) {
              // May just be an object definition for the module. Only
              // worry about defining if have a module name.
              resolve(name, d, factory);
            }
          }
          startTime = new Date().getTime();
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
        req.config = function(cfg) {
          if (cfg.context && cfg.context !== contextName) {
            return newContext(cfg.context).config(cfg);
          }
          // Since config changed, mapCache may not be valid any more.
          mapCache = {};
          // Make sure the baseUrl ends in a slash.
          if (cfg.baseUrl) {
            if ("/" !== cfg.baseUrl.charAt(cfg.baseUrl.length - 1)) {
              cfg.baseUrl += "/";
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
          eachProp(cfg, function(value, prop) {
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
        req.onError = function(err) {
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
      // ----- BEGIN SITECUES CUSTOM BLOCK -----
      cacheNativeFnReferences();
      // ----- END SITECUES CUSTOM BLOCK -----
      requirejs = topReq = newContext("_");
      if ("function" !== typeof require) {
        require = topReq;
      }
      /**
   * Executes the text. Normally just uses eval, but can be modified
   * to use a better, environment-specific call. Only used for transpiling
   * loader plugins, not for plain JS modules.
   * @param {String} text the text to execute/evaluate.
   */
      topReq.exec = function(text) {
        /*jslint evil: true */
        return eval(text);
      };
      topReq.contexts = contexts;
      define = function() {
        queue.push(slice.call(arguments, 0));
      };
      define.amd = {
        jQuery: true
      };
      if (bootstrapConfig) {
        topReq.config(bootstrapConfig);
      }
    }(this, "undefined" !== typeof Promise ? Promise : void 0);
    sitecues.requirejs = requirejs;
    sitecues.require = require;
    sitecues.define = define;
  }
}();

sitecues.define("run/prereq/alameda-custom", function() {});

sitecues.define("run/util/object-utility", [], function() {
  "use strict";
  // Using the MDN polyfill for IE11
  var assign = "function" === typeof Object.assign ? Object.assign : function(target) {
    if (void 0 === target || null === target) {
      throw new TypeError("Cannot convert undefined or null to object");
    }
    target = Object(target);
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (void 0 !== source && null !== source) {
        Object.keys(source).forEach(function(key) {
          target[key] = source[key];
        });
      }
    });
    return target;
  };
  return {
    assign: assign
  };
});

sitecues.define("run/conf/preferences", [ "mini-core/user", "run/util/object-utility" ], function(user, objectUtil) {
  "use strict";
  var cachedPrefs, handlers = {}, listeners = {};
  // Listeners are passed new preference values once they've been handled
  function bindListener(key, listener) {
    var prefValue = getPref(key);
    if ("undefined" !== typeof prefValue) {
      // Here we're perpetuating a pattern from the previous module design, if the
      // value has already been defined when we bind this listener, call the listener
      // with the current value. It's a little funky
      listener(prefValue);
    }
    listeners[key] = listeners[key] || [];
    listeners[key].push(listener);
  }
  // Handlers are passed new preference values, and the return value is saved and passed to
  // listeners to the preference
  function defineHandler(key, handler) {
    // set handler for key
    if ("function" === typeof handler) {
      handlers[key] = handler;
    }
  }
  // If callback is defined,
  function getPref(key) {
    if (!key) {
      return objectUtil.assign({}, cachedPrefs);
    }
    return cachedPrefs[key];
  }
  function setPref(key, value) {
    var safeValue;
    if (handlers[key]) {
      safeValue = handlers[key](value);
    } else {
      safeValue = value;
    }
    if (listeners[key]) {
      listeners.forEach(function(listener) {
        listener(safeValue);
      });
    }
    cachedPrefs[key] = safeValue;
    user.setPref(cachedPrefs);
  }
  function unset(key) {
    setPref(key, void 0);
  }
  // Reset all settings as if it is a new user
  function resetPrefs() {
    // Undefine all settings and call setting notification callbacks
    Object.keys(cachedPrefs).forEach(unset);
  }
  function hasPref(key) {
    return Boolean(cachedPrefs[key]);
  }
  function init() {
    return user.getPref().then(function(prefs) {
      cachedPrefs = prefs;
    });
  }
  return {
    get: getPref,
    set: setPref,
    has: hasPref,
    reset: resetPrefs,
    defineHandler: defineHandler,
    bindListener: bindListener,
    init: init
  };
});

sitecues.define("run/conf/id", [ "mini-core/user", "mini-core/session", "mini-core/page-view", "mini-core/site" ], function(user, session, pageView, site) {
  "use strict";
  var exports = {
    init: init
  };
  function init() {
    return user.getId().then(function(userId) {
      // Only the user id needs to be fetch asynchronously (it is retrieved from global storage)
      exports.session = session.getId();
      exports.pageView = pageView.getId();
      exports.user = userId;
      exports.site = site.getId();
    });
  }
  return exports;
});

/**
 * This module is responsible for handling site configuration. This configuration can be supplied in
 * two ways:
 *   1) The 'window.sitecues.config' object:
 *         This object is required and must have at least the 'siteId' and 'scriptUrl' properties. This
 *         requirement is validated by core.js
 *   2) The web services server
 *         This configuration is currently not required, and inability to fetch these setting should be handled
 *         gracefully by the library (e.g., disable TTS, do not crash the web page).
 *
 *   All properties provided in 'window.sitecues.config' currently take precedence over the server configuration.
 *   However, in the future this will be updated so that a customer can not, for example, override the TTS provider
 *   with one that is not available to them.
 */
sitecues.define("run/conf/site", [], function() {
  var providedSiteConfig, everywhereConfig;
  // Get the site configuration property
  function get(key) {
    return everywhereConfig[key] || providedSiteConfig[key];
  }
  // Names with underscores deprecated.
  // Here is the order of precedence:
  // 1. sitecues everywhere siteId
  // 2. sitecues.config.siteId (camelCase is the new way)
  // 3. sitecues.config.site_id (underscore in config field names is deprecated)
  function getSiteId() {
    var siteId = everywhereConfig.siteId || providedSiteConfig.siteId || providedSiteConfig.site_id;
    return siteId && siteId.trim();
  }
  // Get the entire site config object
  function getProvidedSiteConfig() {
    return sitecues.config || {};
  }
  // Configuration for sitecues everywhere, if it exists
  // TODO Should go away once we go to the new extension which is entirely in a content script
  function getEverywhereConfig() {
    return sitecues.everywhereConfig || {};
  }
  function init() {
    providedSiteConfig = getProvidedSiteConfig();
    everywhereConfig = getEverywhereConfig();
  }
  return {
    init: init,
    get: get,
    getSiteId: getSiteId,
    getSiteConfig: getProvidedSiteConfig,
    getEverywhereConfig: getEverywhereConfig
  };
});

/**
 * data-map implementation for the IN-PAGE library (not extension)
 * This returns the data for a data module name.
 * Data is retrieved from the network as needed
 * Example of data folder is locale-data
 * See source-folders.json to get a list of data folders
 */
sitecues.define("run/data-map", [], function() {
  // Hack: sitecues.require() is used instead of require() so that we can use it with a variable name
  function get(dataModuleName, callback) {
    sitecues.require([ dataModuleName ], function(data) {
      callback(data);
    });
  }
  return {
    get: get
  };
});

/**
 * Localization / language functions, such as:
 * - Get the current language for the document or an element
 * - Provide localized strings for current language
 * - Translate text with {{keys}} in it
 * - Localize a number string
 *
 * Definitions:
 * - lang is a 2 letter code such as 'en'
 * - locale is either a lang or can include more info, such as 'en-GB'
 */
sitecues.define("run/locale", [ "run/data-map", "Promise" ], function(dataMap, Promise) {
  var mainBrowserLocale, translations = {}, DEFAULT_LOCALE = "en-us", LOCALE_DATA_PREFIX = "locale-data/", SUPPORTED_UI_LANGS = {
    de: 1,
    en: 1,
    es: 1,
    fr: 1,
    pl: 1,
    sv: 1
  }, // Countries which have localization files that are different from the default for that language
  // For example, en-us files use 'color' instead of the worldwide standard 'colour'
  COUNTRY_EXCEPTIONS = {
    "en-US": 1
  };
  // Get the language but not the regional differences
  // For example, return just 'en' but not 'en-US'.
  function getLanguageFromLocale(locale) {
    return locale.split("-")[0];
  }
  // The the full xx-XX code for the web page
  function getPageLocale() {
    var validDocLocale, docElem = document.documentElement, docLocales = [ getTranslationLocale(), docElem.lang, docElem.getAttribute("xml:lang"), getMetaTagLocale() ];
    docLocales.some(function(locale) {
      if (isValidLocale(locale)) {
        validDocLocale = locale;
        return true;
      }
    });
    return validDocLocale || mainBrowserLocale || DEFAULT_LOCALE;
  }
  function getCookies() {
    var nameValSplit, chunks = document.cookie.split("; "), cookies = {}, index = chunks.length;
    while (index--) {
      nameValSplit = chunks[index].split("=");
      cookies[nameValSplit[0]] = nameValSplit[1];
    }
    return cookies;
  }
  // TODO bing translator
  function getTranslationLocale() {
    var googtrans = getCookies().googtrans;
    // In format of /fromlang/tolang
    return googtrans && googtrans.substring(googtrans.lastIndexOf("/") + 1);
  }
  function isValidLocale(locale) {
    // Regex from http://stackoverflow.com/questions/3962543/how-can-i-validate-a-culture-code-with-a-regular-expression
    var VALID_LOCALE_REGEX = /^[a-z]{2,3}(?:-[A-Z]{2,3}(?:-[a-zA-Z]{4})?)?$/;
    return locale && locale.match(VALID_LOCALE_REGEX);
  }
  function getMetaTagLocale() {
    var metaLocale, META_LANG_SELECTOR = "meta[name=language],meta[http-equiv=language],meta[name=Content-Language],meta[http-equiv=Content-Language]", // TODO Once we kill off Firefox < 47 and Chrome < 49 we can do a case insensitive check:
    // 'meta[name=language i],meta[http-equiv=language i],meta[name=Content-Language i],meta[http-equiv=Content-Language i]',
    metaLocaleElement = document.querySelector(META_LANG_SELECTOR);
    if (metaLocaleElement) {
      metaLocale = metaLocaleElement.getAttribute("content").split(",")[0].trim();
      // Can be comma-separated
      // Validate the format of the attribute -- some docs online use invalid strings such as 'Spanish'
      return isValidLocale(metaLocale) && metaLocale;
    }
  }
  /**
   * Represents website language.
   * For example, returns 'en', 'de'
   * If there are country-specific translation exceptions, such as 'en-US', we strip the last part and return only 'en'
   * @returns String
   */
  function getLang() {
    var websiteLanguage = getPageLocale();
    return getLanguageFromLocale(websiteLanguage);
  }
  function getSupportedUiLang() {
    var lang = getLang();
    return SUPPORTED_UI_LANGS[lang] ? lang : DEFAULT_LOCALE;
  }
  // If document is in the same language as the browser, then
  // we should prefer to use the browser's country-specific version of that language.
  // This helps make sure UK users get a UK accent on all English sites, for example.
  // We now check all the preferred languages of the browser.
  // @param countriesWhiteList -- if provided, it is the list of acceptable fully country codes, e.g. en-US.
  // If not provided, all countries and langs are acceptable
  // @param langsWhiteList -- if provided, it is the list of acceptable languages.
  function swapToPreferredRegion(locale, countriesWhiteList, langsWhiteList) {
    var langWithCountry, langPrefix = getLanguageFromLocale(locale), prioritizedBrowserLocales = function() {
      var browserLocales = (navigator.languages || []).slice();
      // Put the mainBrowserLang at the start of the prioritized list of languages
      if (!browserLocales.length) {
        browserLocales = [ mainBrowserLocale ];
      }
      return browserLocales;
    }(), index = 0;
    function extendLangWith(extendCode) {
      if (extendCode.indexOf("-") > 0 && langPrefix === getLanguageFromLocale(extendCode)) {
        if (!countriesWhiteList || countriesWhiteList.hasOwnProperty(extendCode)) {
          return extendCode;
        }
        if (langsWhiteList[langPrefix]) {
          return langPrefix;
        }
      }
    }
    for (;index < prioritizedBrowserLocales.length; index++) {
      langWithCountry = extendLangWith(prioritizedBrowserLocales[index]);
      if (langWithCountry) {
        return langWithCountry;
      }
    }
    return locale;
  }
  // Return the translated text for the key
  function translate(key) {
    var lang = getLang(), text = translations[key];
    if ("undefined" === typeof text) {
      if (true) {
        console.log('Unable to get translation for text code: "' + key + '" and language: "' + lang + '".');
      }
      return "-";
    }
    return text;
  }
  // Globally replace all instances of the pattern {{keyname}} with the translation using that key
  // Key names can container lower case letters, numbers and underscores
  function localizeStrings(text) {
    var MATCH_KEY = /\{\{([a-z0-9\_]+)\}\}/g;
    return text.replace(MATCH_KEY, function(match, capture) {
      return translate(capture);
    });
  }
  /**
   * Translate a number
   * @param number  Number to translate
   * @param numDigits (optional)
   */
  function translateNumber(number, numDigits) {
    var lang = getLang();
    //Number.toLocaleString locale parameter is unsupported in Safari
    var translated = number.toLocaleString(lang);
    return numDigits ? translated.slice(0, numDigits + 1) : translated;
  }
  // The language of user interface text:
  // In most cases, just returns 'en', 'de', etc.
  // However, when there are special files for a country translation, returns a longer name like 'en-us' for the U.S.
  // The language is based on the page, but the country is based on the browser (if the lang is the same)
  function getUiLocale() {
    var langOnly = getSupportedUiLang();
    return swapToPreferredRegion(langOnly, COUNTRY_EXCEPTIONS, SUPPORTED_UI_LANGS).toLowerCase();
  }
  // The preferred language of the current browser
  function getBrowserLocale() {
    return mainBrowserLocale;
  }
  function getMainBrowserLocale() {
    return navigator.language || navigator.userLanguage || navigator.browserLanguage || DEFAULT_LOCALE;
  }
  function init() {
    return new Promise(function(resolve, reject) {
      mainBrowserLocale = getMainBrowserLocale();
      // On load fetch the translations only once
      var lang = getSupportedUiLang(), langModuleName = LOCALE_DATA_PREFIX + lang;
      dataMap.get(langModuleName, function(data) {
        translations = data;
        if (translations) {
          resolve();
        } else {
          // TODO solve this mystery error (this info should help)
          reject(new Error("Translation not found for " + lang));
        }
      });
    });
  }
  return {
    getLang: getLang,
    getBrowserLang: getBrowserLocale,
    getPageLocale: getPageLocale,
    getUiLocale: getUiLocale,
    getTranslationLocale: getTranslationLocale,
    isValidLocale: isValidLocale,
    swapToPreferredRegion: swapToPreferredRegion,
    translate: translate,
    localizeStrings: localizeStrings,
    translateNumber: translateNumber,
    init: init
  };
});

// Cheap, extremely minimal XHR
// Takes subset of $.ajax params -- data, contentType, headers, cache, dataType, url, success, error
sitecues.define("run/util/xhr", [ "mini-core/native-global" ], function(nativeGlobal) {
  "use strict";
  // -- PRIVATE --
  // Cross-browser XHR requests
  function initRequest(postData, requestObj, optionalContentTypeOverride, successFnOverride) {
    var xhr = new XMLHttpRequest(), type = postData ? "POST" : "GET", contentType = optionalContentTypeOverride || requestObj.contentType;
    xhr.open(type, requestObj.url, true);
    if (contentType) {
      // If post, the content type is what we're sending, if get it's what we're receiving
      xhr.setRequestHeader(postData ? "Content-Type" : "Accept", contentType);
    }
    xhr.onload = function() {
      if (xhr.status < 400) {
        var successFn = successFnOverride || requestObj.success;
        if (successFn) {
          successFn(xhr.responseText);
        }
      } else {
        var errorFn = requestObj.error;
        if (errorFn) {
          errorFn(xhr.statusText);
        }
      }
    };
    // Send it!
    xhr.send(postData);
  }
  // -- PUBLIC ---
  // Gets the JSON text and returns a JS object
  function getJSON(requestObj) {
    initRequest(null, requestObj, "application/json", function(jsonText) {
      requestObj.success(nativeGlobal.JSON.parse(jsonText));
    });
  }
  function get(requestObj) {
    initRequest(null, requestObj, null);
  }
  function post(requestObj) {
    // Sending with text/plain instead of application/json avoids the extra CORS preflight requests
    // This is called a "Simple CORS Request" and has a number of requirements.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Simple_requests
    initRequest(nativeGlobal.JSON.stringify(requestObj.data), requestObj, "text/plain");
  }
  return {
    getJSON: getJSON,
    get: get,
    post: post
  };
});

sitecues.define("run/conf/urls", [ "run/conf/site" ], function(site) {
  "use strict";
  var apiPrefix, // Either ws.sitecues.com/ or ws.dev.sitecues.com/
  scriptOrigin, // Either http[s]://js.sitecues.com/ or http[s]://js.dev.sitecues.com/
  BASE_RESOURCE_URL;
  function getBaseResourceUrl() {
    var basis = void 0 ? getRawScriptUrl() : sitecues.require.toUrl(""), unsecureBaseUrl = basis.substring(0, basis.lastIndexOf("/js/") + 1);
    return enforceHttps(unsecureBaseUrl);
  }
  // Change http:// or protocol-relative (just //) urls to use https
  // TODO Occasionally the sitecues.js core is loaded with http -- we will change that in the minicore. Remove this once we do that.
  function enforceHttps(absoluteUrl) {
    return "https:" + absoluteUrl.replace(/^https?:/, "");
  }
  // URL string for API calls
  function getApiUrl(restOfUrl) {
    return "https://" + apiPrefix + "sitecues/api/" + restOfUrl;
  }
  // Get an API like http://ws.sitecues.com/sitecues/api/css/passthrough/?url=http%3A%2F%2Fportal.dm.gov.ae%2FHappiness...
  // We use this for the image and CSS proxy services
  // Pass in the proxyApi, e.g. 'image/invert' or 'css/passthrough'
  function getProxyApiUrl(proxyApi, url) {
    var absoluteUrl = resolveUrl(url);
    return getApiUrl(proxyApi + "/?url=" + encodeURIComponent(absoluteUrl));
  }
  // URL string for sitecues.js
  // Enforces https so that all the resources we fetch and origin checking also uses https
  function getRawScriptUrl() {
    return enforceHttps(site.get("scriptUrl") || site.get("script_url"));
  }
  // Parsed URL object for sitecues.js
  function getParsedLibraryURL() {
    // Underscore names deprecated
    var url = getRawScriptUrl();
    return url && parseUrl(url);
  }
  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  URL Processing
  //
  //////////////////////////////////////////////////////////////////////////////////////////
  // Parse a URL into { protocol, hostname, origin, path }
  // Does not support mailto links (or anything where the protocol isn't followed by //)
  // TODO After we kill IE11, we can move to new URL(), but be careful of IE incompatibilities (e.g. port, origin, host)
  function parseUrl(urlStr) {
    if ("string" !== typeof urlStr) {
      return;
    }
    var pathname, lastSlashIndex, protocol, path, hostname, origin, port, parser = document.createElement("a");
    // Set up parser
    parser.href = urlStr;
    // Extract the path of the pathname.
    pathname = parser.pathname;
    // Ensure pathname begins with /
    // TODO is this necessary in any browser? Used to be for IE9
    if (pathname.indexOf("/") > 0) {
      pathname = "/" + pathname;
    }
    lastSlashIndex = pathname.lastIndexOf("/") + 1;
    protocol = parser.protocol || document.location.protocol;
    // IE does not include protocol unless it was specified. If not specified, get from current document.
    path = pathname.substring(0, lastSlashIndex);
    hostname = parser.hostname;
    origin = parser.origin;
    if (!origin) {
      // IE didn't give us the origin, so we construct it from the protocol, hostname and maybe the port
      origin = protocol + "//" + hostname;
      port = parser.port;
      // Fallback approach for IE -- note this doesn't include @username or password info
      // Add the port if it's specified in the url (80/443 is the default port, so only add that if it's really present in the url)
      if (port && urlStr.indexOf(":" + port + "/") > 0) {
        origin += ":" + port;
      }
    }
    return {
      protocol: protocol,
      path: path,
      hostname: hostname,
      origin: origin
    };
  }
  function isValidLibraryUrl() {
    return !!getParsedLibraryURL().hostname;
  }
  // Resolve a URL as relative to the main script URL.
  // Add a version parameter so that new versions of the library always get new versions of files we use, rather than cached versions.
  function resolveResourceUrl(urlStr, paramsMap) {
    var url = BASE_RESOURCE_URL + urlStr, params = paramsMap && Object.keys(paramsMap);
    function addParam(name) {
      url += name + "=" + encodeURIComponent(paramsMap[name]) + "&";
    }
    if (params) {
      url += "?";
      params.forEach(addParam);
    }
    return url;
  }
  // Is this production sitecues?
  function isProduction() {
    return "js.sitecues.com" === getParsedLibraryURL().hostname;
  }
  // Most sitecues scripts are loaded with https
  function getScriptOrigin() {
    if (!scriptOrigin) {
      scriptOrigin = getParsedLibraryURL().origin;
    }
    return scriptOrigin;
  }
  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REGEXP = /^[a-zA-Z0-9-]+:(\/\/.*)$/i;
  // Return an absolute URL. If the URL was relative, return an absolute URL that is relative to a base URL.
  // @optional parsedBaseUrl If not provided, will use the current page.
  function resolveUrl(urlStr, baseUrl) {
    if ("function" === typeof URL) {
      // URL object exists in IE11 but "new URL()" throws error "Object doesn’t support this action"
      // TODO Strangely, saw an exception in Firefox 38: -- Illegal constructor
      // {"eventId":"87611cd9-5e0c-4ad9-b338-f4ce5b312e09","serverTs":1463709667327,"clientIp":"10.235.39.83","siteKey":"s-1e3f787a","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"12d5eb35-2f8b-4dd3-8006-722f6cfec4a5","pageViewId":"ac606acb-b05c-42b8-adba-13a764ee7372","siteId":"s-1e3f787a","userId":"cdbb986e-29e2-4a27-b07f-c1f253b2c645","pageUrl":"http://bestfriends.org/sanctuary/animals-special-needs/current/harvard?utm_medium=email&utm_source=bsd&utm_campaign=newsletter&utm_content=20160519&utm_term=2016national","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; rv:38.9) Gecko/20100101 Goanna/2.0 Firefox/38.9 PaleMoon/26.1.1","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1463709666975,"zoomLevel":1,"ttsState":false,"details":{"message":"Illegal constructor.","stack":".resolveUrl@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:28\nr@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\na@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\no@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nh@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\ns@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\n.each@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.prototype.each@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nx@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nZ.Callbacks/c@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.Callbacks/f.add@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.fn.ready@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\ny@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nc@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nv@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\ng@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nm@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nr/<@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/bp-toolbar-badge.js:1\nW@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:8\nO@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:9\nP/<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:10\nk@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:20\nO/k.then/</<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:21\nc/</<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\nc/<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\na@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\n"}}}
      var parsedUrl = new URL(urlStr, baseUrl || document.location);
      return parsedUrl.toString();
    }
    // IE 9-11 polyfill (also Edge 12)
    // TODO remove if IE11 ever goes away!!
    var parsedBaseUrl = parseUrl(baseUrl || ".");
    var absRegExpResult = ABSOLUTE_URL_REGEXP.exec(urlStr);
    if (absRegExpResult) {
      // We have an absolute URL, with protocol. That's a no-no, so, convert to a
      // protocol-relative URL.
      urlStr = urlStr;
    } else {
      if (0 === urlStr.indexOf("//")) {
        // Protocol-relative. Add parsedBaseUrl's protocol.
        urlStr = parsedBaseUrl.protocol + urlStr;
      } else {
        if (0 === urlStr.indexOf("/")) {
          // Host-relative URL.
          urlStr = parsedBaseUrl.origin + urlStr;
        } else {
          // A directory-relative URL.
          urlStr = parsedBaseUrl.origin + parsedBaseUrl.path + urlStr;
        }
      }
    }
    // Replace ../ at beginning of path with just / as there is no parent folder to go to
    urlStr = urlStr.replace(/(^http[^\/]+\/\/[^\/]+\/)(?:\.\.\/)/, "$1", "i");
    return urlStr;
  }
  function isSameOrigin(url) {
    return parseUrl(url).origin === window.location.origin;
  }
  // Will cross-origin restrictions possibly burn us?
  function isCrossOrigin(url) {
    return !isSameOrigin(url);
  }
  // Returns the resource file extension, or an empty string if one isn't found
  function extname(url) {
    var index = url.lastIndexOf(".");
    return index >= 0 ? url.substring(index) : "";
  }
  function init() {
    var domainEnding = isProduction() ? ".sitecues.com" : ".dev.sitecues.com";
    BASE_RESOURCE_URL = getBaseResourceUrl();
    apiPrefix = "ws" + domainEnding + "/";
  }
  return {
    init: init,
    getApiUrl: getApiUrl,
    getProxyApiUrl: getProxyApiUrl,
    getScriptOrigin: getScriptOrigin,
    isValidLibraryUrl: isValidLibraryUrl,
    getRawScriptUrl: getRawScriptUrl,
    resolveResourceUrl: resolveResourceUrl,
    parseUrl: parseUrl,
    isSameOrigin: isSameOrigin,
    isCrossOrigin: isCrossOrigin,
    isProduction: isProduction,
    resolveUrl: resolveUrl,
    extname: extname
  };
});

sitecues.define("run/constants", [], function() {
  var constants = {};
  constants.READY_STATE = {
    UNINITIALIZED: 0,
    INITIALIZING: 1,
    COMPLETE: 2
  };
  constants.METRIC_NAME = {
    BADGE_HOVER: "badge-hovered",
    ERROR: "error",
    FEEDBACK: "feedback-sent",
    KEY_COMMAND: "key-command",
    LENS_OPEN: "hlb-opened",
    MOUSE_SHAKE: "mouse-shake",
    PAGE_CLICK_FIRST: "page-clicked-first",
    PAGE_SCROLL_FIRST: "page-scrolled-first",
    PAGE_UNLOAD: "page-unloaded",
    PANEL_CLICK: "panel-clicked",
    PANEL_CLOSE: "panel-closed",
    PANEL_FOCUS_MOVE: "panel-focus-moved",
    SITECUES_READY: "sc-ready",
    SLIDER_SETTING_CHANGE: "slider-setting-changed",
    TTS_REQUEST: "tts-requested",
    ZOOM_CHANGE: "zoom-changed"
  };
  constants.KEY_CODE = {
    MINUS_ALT1: 173,
    MINUS_ALT2: 45,
    MINUS_ALT3: 189,
    EQUALS_ALT1: 187,
    EQUALS_ALT2: 61,
    PLUS: 43,
    NUMPAD_SUBTRACT: 109,
    NUMPAD_ADD: 107,
    NUMPAD_0: 48,
    NUMPAD_1: 97,
    NUMPAD_2: 98,
    NUMPAD_3: 99,
    NUMPAD_4: 100,
    NUMPAD_6: 102,
    NUMPAD_7: 103,
    NUMPAD_8: 104,
    NUMPAD_9: 105,
    QUOTE: 222,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    LETTER_H: 72,
    SHIFT: 16,
    CTRL: 17,
    F8: 119,
    TAB: 9,
    ENTER: 13
  };
  constants.ZOOM_OUT_CODES = [ constants.KEY_CODE.MINUS_ALT1, constants.KEY_CODE.MINUS_ALT2, constants.KEY_CODE.MINUS_ALT3, constants.KEY_CODE.NUMPAD_SUBTRACT ];
  constants.ZOOM_IN_CODES = [ constants.KEY_CODE.EQUALS_ALT1, constants.KEY_CODE.EQUALS_ALT2, constants.KEY_CODE.PLUS, constants.KEY_CODE.NUMPAD_ADD ];
  constants.INIT_CODES = [ constants.KEY_CODE.QUOTE ].concat(constants.ZOOM_IN_CODES, constants.ZOOM_OUT_CODES);
  constants.MIN_TIME_BETWEEN_KEYS = 80;
  // How quickly might humans reasonably repeat keys
  return constants;
});

/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
sitecues.define("run/platform", [], function() {
  // Store the agent and platform variables for later use
  var agent, isInitialized, isRetinaDisplay, exports = {
    browser: null,
    os: null,
    canUseRetinaCursors: null,
    cssPrefix: null,
    transitionEndEvent: null,
    nativeZoom: null,
    isRetina: isRetina,
    isUnsupportedPlatform: false,
    platformWarning: null,
    init: init
  };
  // Is the current display a retina display?
  // Determine which browser is being used
  function getBrowserStr(agent) {
    return agent.indexOf(" MSIE") > 0 || agent.indexOf(" Trident") > 0 || agent.indexOf(" Edge") > 0 ? "IE" : agent.indexOf(" Firefox/") > 0 ? "Firefox" : agent.indexOf(" Chrome") > 0 ? "Chrome" : agent.indexOf(" Safari") > 0 ? "Safari" : agent.indexOf(" Opera/") > 0 || agent.indexOf(" Presto/") > 0 ? "Opera" : "";
  }
  // If a vendor prefix is needed for a CSS property, what would it be?
  function getCssPrefix(currBrowser) {
    return currBrowser.isWebKit ? "-webkit-" : currBrowser.isFirefox ? "-moz-" : currBrowser.isMS ? "-ms-" : "";
  }
  // Set globally accessible browser constants
  function getBrowser(agent) {
    var version, browserStr = getBrowserStr(agent), isMS = "IE" === browserStr, browser = {
      zoom: "zoom" in document.createElement("div").style,
      is: browserStr,
      isFirefox: "Firefox" === browserStr,
      //Evaluates true for Internet Explorer and Edge (there is a lot of overlap in browser specific logic)
      isMS: isMS,
      // Includes Edge
      isIE: isMS && version < 12,
      // Does not include Edge
      isEdge: isMS && version >= 12,
      isChrome: "Chrome" === browserStr,
      isOpera: "Opera" === browserStr,
      isSafari: "Safari" === browserStr,
      isWebKit: "Chrome" === browserStr || "Opera" === browserStr || "Safari" === browserStr
    };
    browser.version = version = getVersion(agent, browser);
    browser.isIE = isMS && version < 12;
    browser.isEdge = isMS && version >= 12;
    return browser;
  }
  // Set globally accessible version constants
  function getVersion(agent, browser) {
    var charIndex = -1;
    // If IE is being used, determine which version
    if (browser.isChrome) {
      charIndex = agent.indexOf("Chrome/");
      if (charIndex > 0) {
        charIndex += 7;
      }
    } else {
      if (browser.isSafari) {
        charIndex = agent.indexOf("Version/");
        if (charIndex > 0) {
          charIndex += 8;
        }
      } else {
        if (browser.isMS) {
          // Use MSIE XX.X
          charIndex = agent.indexOf("MSIE");
          if (charIndex < 0) {
            charIndex = agent.indexOf("Edge");
          }
          if (charIndex > 0) {
            charIndex += 5;
          }
        }
      }
    }
    if (charIndex < 0) {
      charIndex = agent.indexOf("rv:");
      if (charIndex > 0) {
        charIndex += 3;
      }
    }
    return charIndex < 0 ? 0 : parseInt(agent.substring(charIndex));
  }
  // Determine which operating system is being used
  function getOSStr(agent) {
    return agent.indexOf("Mac OS X ") > -1 ? "mac" : agent.indexOf("Windows NT") > -1 ? "win" : agent.indexOf("Linux") > -1 ? "linux" : "other";
  }
  // Set globally accessible operating system constants
  function getOS(agent) {
    var osStr = getOSStr(agent);
    var os = {
      is: osStr,
      isMac: "mac" === osStr,
      isWin: "win" === osStr,
      // Set globally accessible version constants
      versionString: function() {
        // If IE is being used, determine which version
        var charIndex = agent.indexOf("win" === osStr ? "Windows NT" : "Mac OS X "), UNKNOWN_VERSION = "0";
        if (charIndex === -1) {
          return UNKNOWN_VERSION;
        }
        var versionMatches = agent.slice(charIndex).replace(/^\D*/, "").replace("_", ".").match(/[\d\.]+/);
        return versionMatches ? versionMatches[0] : UNKNOWN_VERSION;
      }()
    };
    // Windows versions are weird:
    // 5.1, 5.2 = Windows XP
    // 5 = Windows Vista, Windows Server 2008
    // 6.1 = Windows 7
    // 6.2 = Windows 8
    // 6.3 = Windows 8.1
    // 10 = Windows 10
    // For more details see https://en.wikipedia.org/?title=Windows_NT
    os.majorVersion = parseInt(os.versionString);
    os.fullVersion = parseFloat(os.versionString);
    // Restore if needed
    // os.minorVersion = parseInt(platformModule.os.versionString.split(/\D/)[1]);
    return os;
  }
  // Retrieve and store the user's intentional amount of native browser zoom
  function getNativeZoom() {
    var browser = exports.browser, computedNativeZoom = 1;
    if (browser.isWebKit) {
      computedNativeZoom = outerWidth / innerWidth;
    } else {
      if (browser.isMS) {
        // Note: on some systems the default zoom is > 100%. This happens on our Windows 7 + IE10 Dell Latitude laptop
        // See http://superuser.com/questions/593162/how-do-i-change-the-ctrl0-zoom-level-in-ie10
        // This means the actual zoom may be 125% but the user's intentional zoom is only 100%
        // To get the user's actual zoom use screen.deviceXDPI / screen.logicalXDPI
        computedNativeZoom = screen.deviceXDPI / screen.systemXDPI;
      } else {
        if (browser.isFirefox) {
          // Since isRetina() is not 100% accurate, neither will this be
          computedNativeZoom = isRetina() ? devicePixelRatio / 2 : devicePixelRatio;
        }
      }
    }
    return computedNativeZoom;
  }
  // Retrieve and store whether the current window is on a Retina display
  function isRetina() {
    var browser = exports.browser, nativeZoom = exports.nativeZoom;
    if ("undefined" !== typeof isRetinaDisplay) {
      return isRetinaDisplay;
    }
    isRetinaDisplay = false;
    // Safari doesn't alter devicePixelRatio for native zoom
    if (browser.isSafari) {
      isRetinaDisplay = 2 === devicePixelRatio;
    } else {
      if (browser.isChrome) {
        isRetinaDisplay = 2 === Math.round(devicePixelRatio / nativeZoom);
      } else {
        if (browser.isFirefox) {
          // This is only a guess, unfortunately
          // The following devicePixelRatios can be either on a retina or not:
          // 2, 2.4000000953674316, 3
          // Fortunately, these would correspond to a relatively high level of zoom on a non-Retina display,
          // so hopefully we're usually right (2x, 2.4x, 3x)
          // We can check the Firefox zoom metrics to see if they are drastically different from other browsers.
          isRetinaDisplay = devicePixelRatio >= 2;
        }
      }
    }
    return isRetinaDisplay;
  }
  // Returns a string if the current OS/browser combo is not supported.
  // The reason string is human-readable description as to why the platform is not supported
  // TODO localize
  function getPlatformWarning(os, browser) {
    if (!os.isWin && !os.isMac) {
      return "Microsoft Windows or Mac OS X is required";
    }
    var version = browser.version;
    if (browser.isIE) {
      return 11 !== version && "for Internet Explorer, version 11 is required";
    }
    if (browser.isEdge) {
      return version < 13 && "for Microsoft Edge, version 13 or later is required";
    }
    if (browser.isFirefox) {
      return version < 34 && "for Firefox, version 34 or later is required";
    }
    if (browser.isSafari) {
      return version < 9 && "for Safari, version 9 or later is required";
    }
    if (browser.isChrome) {
      return version < 41 && "for Chrome, version 41 or later is required";
    }
    return "IE, Firefox, Chrome or Safari is required";
  }
  function isStorageUnsupported() {
    var TEST_KEY = "-sc-storage-test";
    if (0 === localStorage.length && 0 === sessionStorage.length) {
      try {
        sessionStorage.setItem(TEST_KEY, "");
        sessionStorage.removeItem(TEST_KEY);
      } catch (ex) {
        return true;
      }
    }
  }
  // return truthy if platform is supported
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    agent = navigator.userAgent || "";
    exports.browser = getBrowser(agent);
    exports.os = getOS(agent);
    exports.nativeZoom = getNativeZoom();
    var platformWarning = getPlatformWarning(exports.os, exports.browser);
    if (platformWarning) {
      throw new Error(platformWarning);
    }
    exports.isStorageUnsupported = isStorageUnsupported();
    exports.canUseRetinaCursors = exports.browser.isChrome;
    exports.cssPrefix = getCssPrefix(exports.browser);
    exports.transitionEndEvent = exports.browser.isWebKit ? "webkitTransitionEnd" : "transitionend";
    exports.featureSupport = {
      themes: !exports.browser.isMS
    };
    // Invalidate cached retina info on window resize, as it may have moved to another display.
    // When a window moves to another display, it can change whether we're on a retina display.
    // Kinda evil that we have a listener in this module, but it helps keep things efficient as we need this info cached.
    addEventListener("resize", function() {
      isRetinaDisplay = void 0;
    });
  }
  return exports;
});

/**
 * Does the current site/browser require classic mode?
 * Classic mode is where the ? shows up instead of the down arrow. This can be necessary if themes aren't working.
 */
sitecues.define("run/bp/model/classic-mode", [ "run/conf/site", "run/platform" ], function(site, platform) {
  var CLASSIC_SITES = {};
  function isClassicBrowser() {
    // Edge is too, at least for now
    return platform.browser.isEdge;
  }
  function isClassicSite() {
    var classicPref = site.get("classicMode");
    if ("undefined" !== typeof classicPref) {
      return classicPref;
    }
    return CLASSIC_SITES[site.getSiteId()];
  }
  function isClassicMode() {
    return Boolean(isClassicSite() || isClassicBrowser());
  }
  return isClassicMode;
});

sitecues.define("run/has", [], function() {
  function hasEvent(name) {
    return "on" + name in window;
  }
  // TODO: Remove this when issue is resolved:
  // https://github.com/jshint/jshint/issues/3014
  var speechSynthesis = window.speechSynthesis;
  return {
    pointerEvents: hasEvent("pointerdown"),
    touchEvents: hasEvent("touchstart"),
    lightEvents: hasEvent("devicelight"),
    proximityEvents: hasEvent("deviceproximity"),
    motionEvents: hasEvent("devicemotion"),
    orientationEvents: hasEvent("deviceorientation"),
    batteryApi: "function" === typeof navigator.getBattery,
    vibrateApi: "function" === typeof navigator.vibrate,
    speechSynthApi: "object" === typeof speechSynthesis && Boolean(speechSynthesis),
    speechRecApi: "function" === typeof SpeechRecognition
  };
});

/**
 * Global configuration for A/B testing for this version of Sitecues
 * Wiki: https://equinox.atlassian.net/wiki/display/EN/AB+Testing
 * Provided in layers, weight in one layer are separate from other layers and implicitly add to 100%
 * If the weight field is not provided it is assumed to be 1
 * If an array is provided for layer, then all values get weight of 1, e.g. timer values [0, 1000, 2000]
 */
sitecues.define("run/ab-test/config", [], function() {
  "use strict";
  // Maximum layer depth is 5 (because of 5 sections of user id)
  // TODO this is just an example of what's possible, let's actually use it
  var globalAbConfig = {
    NONE: {
      // Special value meaning no A/B test is occurring
      weight: 3
    },
    // Commented but kept in source as an example of what's possible
    // 'iconTest': {
    //   weight: 10,
    //   values: {
    //     'settingsIconTest': {
    //       values: [
    //         'gear',
    //         'sliders'
    //       ]
    //     },
    //     'tipsIconTest': {
    //       values: [
    //         'question',
    //         'lightbulb'
    //       ]
    //     }
    //   }
    // },
    extraSensitiveBadgeNewUser: {
      // Test Marc's idea to have an extra sensitive badge for first time users
      weight: 1
    },
    moreButtonTimerV2: {
      weight: 1,
      values: [ 0, 1e3, 2e3, 3e3, 4e3, 5e3, 6e3, 7e3 ]
    }
  };
  return globalAbConfig;
});

/**
 * Sitecues A/B test switch for the current user
 * Wiki: https://equinox.atlassian.net/wiki/display/EN/AB+Testing
 *
 * Input: user id + ab-test/config
 * Output: something like undefined for no test, or 'icontest.settingsTest.gear'
 *
 * Terminology:
 * - Layer: a scope in the tests corresponding to the config or a sub-object of the config
 *   In the example 'icontest.settingsTest.gear', there are 3 layers
 * - Weight: how likely a test outcome in one of the layers is, relative to other outcomes in the same layer
 */
sitecues.define("run/ab-test/ab-test", [ "run/conf/id", "run/ab-test/config" ], function(id, globalABConfig) {
  "use strict";
  var userAbConfig = [];
  function getLayerWeight(layer, keys) {
    var total = 0;
    keys.forEach(function(key) {
      total += layer[key].weight || 1;
    });
    return total;
  }
  function selectKeyInLayer(seed, layer, keys) {
    var key, layerWeight = getLayerWeight(layer, keys), selectionIndex = seed % layerWeight, weightAccumulator = 0, index = 0, numKeys = keys.length;
    for (;index < numKeys - 1; index++) {
      key = keys[index];
      weightAccumulator += layer[key].weight || 1;
      if (selectionIndex < weightAccumulator) {
        return key;
      }
    }
    return keys[numKeys - 1];
  }
  function getArrayKeys(array) {
    return array.map(function(value, index) {
      return index;
    });
  }
  function selectTests(layerValues, userIdParts, layerIndex) {
    var usesValuesArray = Array.isArray(layerValues), // Otherwise Object map of key: value
    layerKeys = usesValuesArray ? getArrayKeys(layerValues) : Object.keys(layerValues), seed = parseInt(userIdParts[layerIndex], 16), // Choose an option in the layer based on this part of the user id
    selectedKey = selectKeyInLayer(seed, layerValues, layerKeys), nextLayerValues = layerValues[selectedKey].values;
    // If array is provided, use the simple value provided, otherwise the key
    userAbConfig[layerIndex] = usesValuesArray ? layerValues[selectedKey] : selectedKey;
    if (nextLayerValues) {
      ++layerIndex;
      if (layerIndex > userIdParts.length) {
        // Realistically this is always 5
        if (true) {
          console.log("Too much depth in A/B test config");
        }
        return;
      }
      selectTests(nextLayerValues, userIdParts, layerIndex);
    }
  }
  // Return a value for the key
  // Input: a key
  // The key can be simple, e.g. 'moreButtonTimer' or
  // you can string keys together, such as 'iconTest.settingsIconTest'
  // No key will return the user's entire ab test configuration array
  //
  // Returns:
  // Values are together with . (or just true if there are no remaining keys)
  //
  // Examples (where userAbConfig = ['iconTest', 'settingsIconTest', 'lightbulb']) :
  // get() => 'iconTest.settingsIconTest.lightbulb'
  // get('iconTest') => 'settingsIconTest.lightbulb'
  // get('iconTest.settingsIconTest') => 'lightbulb'
  // get('iconTest.settingsIconTest.lightbulb') => true
  // get('qqqq') => undefined   (not a current A/B test)
  // get('iconText.qqq') => undefined (not a current A/B test)
  function get(key, defaultVal) {
    if (!userAbConfig.length || // Occurs when AB testing was never initialized (e.g. when not a supported platform)
    "NONE" === userAbConfig[0]) {
      return defaultVal;
    }
    var keyIndex = 0, keys = key ? key.split(".") : [], numKeys = keys.length;
    for (;keyIndex < numKeys; keyIndex++) {
      if (keys[keyIndex] !== userAbConfig[keyIndex]) {
        return defaultVal;
      }
    }
    // Remaining keys make up te value
    // or true is returned
    var valueSlice = userAbConfig.slice(keyIndex);
    return valueSlice.length ? valueSlice.join(".") : true;
  }
  function init() {
    var userId = id.user, userIdParts = userId.split("-");
    selectTests(globalABConfig, userIdParts, 0);
    if (true) {
      console.log("A/B test: " + get());
    }
  }
  return {
    init: init,
    get: get
  };
});

/**
 * Basic metrics logger
 */
sitecues.define("run/metric/metric", [ "run/conf/preferences", "run/conf/id", "run/conf/site", "run/locale", "run/util/xhr", "run/conf/urls", "run/constants", "run/bp/model/classic-mode", "run/platform", "run/has", "run/ab-test/ab-test", "mini-core/native-global" ], function(pref, id, site, locale, xhr, urls, constants, classicMode, platform, has, abTest, nativeGlobal) {
  "use strict";
  // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
  // IMPORTANT! Have the backend team review all metrics changes!!!
  var isInitialized, doSuppressMetrics, doLogMetrics, platformData, sessionData, METRICS_VERSION = 20, name = constants.METRIC_NAME, metricHistory = [];
  function Metric(name, details) {
    if (doLogMetrics) {
      console.log("Metric / %s", name + (details ? " / " + nativeGlobal.JSON.stringify(details) : ""));
    }
    this.sent = false;
    var data = this.data = {};
    var settings = getSettings();
    // Gets all prefs
    // Session data
    assign(data, sessionData);
    // Common fields
    data.name = name;
    data.clientTimeMs = Number(new Date());
    // Epoch time in milliseconds  when the event occurred
    data.zoomLevel = pref.get("zoom") || 1;
    data.ttsState = pref.get("ttsOn") || false;
    // Platform data -- goes into details field for historical reason
    details = details || {};
    assign(details, platformData);
    // Ensure data we send has simple types
    flattenData(data);
    flattenData(details);
    flattenData(settings);
    // Should already be flat, but we're being extra careful about superfluous fields
    // Log errors -- check for field name collisions and type errors in details
    if (true) {
      logNameCollisions(name, data, details);
    }
    data.details = details;
    data.settings = settings;
    data.has = function() {
      var bool = {};
      Object.keys(has).forEach(function(key) {
        // In the future, some has tests might be functions (may have side effects),
        // here we are careful to not copy those, ensuring no downstream code can
        // accidentally stringify them and send source code with the metric.
        if ("boolean" === typeof has[key]) {
          bool[key] = has[key];
        }
      });
      return bool;
    }();
  }
  // In dev, log field name collisions because the backend is going to flatten the metrics object
  function logNameCollisions(metricName, data, details) {
    function logFieldNameCollision(propName) {
      if (data.hasOwnProperty(propName)) {
        // TODO: Sadly, we do not currently throw an error here, because our errors.js module sends an error metric
        // for exceptions, which could then lead to an infinite loop. This could be solved by having errors.js
        // skip sending a metric when it is the metrics code that is borked anyway.
        console.error("Sitecues error: name collision for metric " + metricName + " field name " + propName);
      }
    }
    if (details) {
      Object.keys(details).forEach(logFieldNameCollision);
    }
  }
  // Data must be of simple types.
  function flattenData(data) {
    Object.keys(data).forEach(function(propName) {
      var value = data[propName];
      var type = typeof value;
      if (null !== value && "boolean" !== type && "number" !== type && "string" !== type && "undefined" !== type) {
        data[propName] = nativeGlobal.JSON.stringify(data[propName]);
      }
    });
  }
  // TODO: Delete this and use Object.assign() when we drop IE support.
  function assign(target, source) {
    if (source) {
      Object.keys(source).forEach(function(key) {
        target[key] = source[key];
      });
    }
  }
  Metric.prototype.send = function() {
    /*jshint validthis: true */
    if (false || doSuppressMetrics) {
      // No metric events in local mode
      return;
    }
    xhr.post({
      url: urls.getApiUrl("metrics/site/" + this.data.siteId + "/notify.json?name=" + this.data.name),
      data: this.data
    });
    metricHistory.push(this);
  };
  function getMetricHistory() {
    return metricHistory;
  }
  function wrap(metricName) {
    function metricFn(details) {
      /*jshint validthis: true */
      Metric.call(this, metricName, details);
    }
    metricFn.prototype = Object.create(Metric.prototype);
    metricFn.prototype.constructor = metricFn;
    return metricFn;
  }
  function isTester() {
    if (pref.get("isTester")) {
      // Once a tester, always a tester
      return true;
    }
    if (site.get("isTester") || !urls.isProduction()) {
      pref.set("isTester", true);
      // Remember this tester
      return true;
    }
    return false;
  }
  // TODO Should go away once we go to the new extension which is entirely in a content script
  function isOldExtension() {
    return Boolean(sitecues.everywhereConfig);
  }
  // Return settings we care about
  function getSettings() {
    var settings = pref.get(), BLACKLIST = {
      firstHighZoom: 1,
      // Not interesting
      firstSpeechOn: 1,
      // Not interesting
      isTester: 1,
      // Redundant with field on main object
      ttsOn: 1,
      // Redundant with field on main object
      zoom: 1
    }, reducedSettings = {};
    Object.keys(settings).forEach(function(settingName) {
      if (!BLACKLIST[settingName]) {
        reducedSettings[settingName] = settings[settingName];
      }
    });
    return reducedSettings;
  }
  function getSource() {
    if (void 0 || isOldExtension()) {
      return "extension";
    }
    var hostname = window.location.hostname;
    if (0 === hostname.indexOf("proxy.") && hostname.indexOf(".sitecues.com") > 0) {
      return "reverse-proxy";
    }
    if (document.querySelector('script[data-provider="sitecues-proxy"]')) {
      return "forward-proxy";
    }
    return "page";
  }
  function getPageUrl(source) {
    if ("reverse-proxy" === source) {
      // We want the viewed page's target url, not the url for the proxy itself
      var targetUrl = location.pathname + location.search + location.hash;
      // TODO: Remove page/ replacement once the proxy stops using this route prefix in Fall 2016. We'll still need to remove the extra / at the start.
      targetUrl = targetUrl.replace(/^\/(?:page\/)?/, "");
      targetUrl = decodeURIComponent(targetUrl);
      // In case target url was escaped
      return targetUrl;
    }
    return location.href;
  }
  // This info is not available right away -- we add to session data as soon as available
  function initViewInfo(viewInfo) {
    assign(sessionData, viewInfo);
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    doSuppressMetrics = site.get("suppressMetrics");
    var source = getSource();
    sessionData = {
      scVersion: sitecues.getVersion(),
      metricVersion: METRICS_VERSION,
      sessionId: id.session,
      pageViewId: id.pageView,
      siteId: id.site,
      userId: id.user,
      abTest: abTest.get(),
      pageUrl: getPageUrl(source),
      browserUserAgent: navigator.userAgent,
      isClassicMode: classicMode(),
      clientLanguage: locale.getBrowserLang(),
      source: source,
      isTester: isTester()
    };
    platform.init();
    platformData = {
      os: platform.os.is,
      osVersion: platform.os.fullVersion,
      browser: platform.browser.is,
      browserVersion: platform.browser.version,
      navPlatform: navigator.platform
    };
  }
  sitecues.toggleLogMetrics = function() {
    doLogMetrics = !doLogMetrics;
    return doLogMetrics;
  };
  return {
    init: init,
    initViewInfo: initViewInfo,
    getMetricHistory: getMetricHistory,
    BadgeHover: wrap(name.BADGE_HOVER),
    Error: wrap(name.ERROR),
    Feedback: wrap(name.FEEDBACK),
    KeyCommand: wrap(name.KEY_COMMAND),
    LensOpen: wrap(name.LENS_OPEN),
    MouseShake: wrap(name.MOUSE_SHAKE),
    PageClickFirst: wrap(name.PAGE_CLICK_FIRST),
    PageScrollFirst: wrap(name.PAGE_SCROLL_FIRST),
    PageUnload: wrap(name.PAGE_UNLOAD),
    PanelClick: wrap(name.PANEL_CLICK),
    PanelClose: wrap(name.PANEL_CLOSE),
    PanelFocusMove: wrap(name.PANEL_FOCUS_MOVE),
    SitecuesReady: wrap(name.SITECUES_READY),
    SliderSettingChange: wrap(name.SLIDER_SETTING_CHANGE),
    TtsRequest: wrap(name.TTS_REQUEST),
    ZoomChange: wrap(name.ZOOM_CHANGE)
  };
});

/**
 * Error logger -- sends errors to Sitecues servers for analysis. Requires <script crossorigin="anonymous">
 * - Not currently used in extension
 * - Does not require init() so that it's easier to add/remove in different builds
 */
sitecues.define("run/errors", [ "run/metric/metric", "run/conf/urls" ], function(metric, urls) {
  function isSitecuesError(source) {
    return urls.parseUrl(source).origin === urls.getScriptOrigin();
  }
  function logError(detail) {
    console.log("%cSitecues Error %s", "color: orange", detail.message);
    if (detail.stack) {
      console.log(detail.stack);
    }
    // detail object contains everything we need (message, line, col, etc.)
    metric.init();
    new metric.Error(detail).send();
  }
  function onError(event) {
    var error = event.error, filename = event.filename;
    if (!error || !filename || !isSitecuesError(filename)) {
      // We only care about Sitecues errors
      return;
    }
    logError({
      type: "exception",
      message: error.message,
      filename: filename,
      // JS file with error
      lineno: event.lineno,
      colno: event.colno,
      stack: error.stack
    });
  }
  function onPrimRejection(event) {
    var detail = event.detail;
    logError({
      type: "prim rejection",
      message: detail.message,
      stack: detail.stack
    }, true);
  }
  function onNativeRejection(event) {
    // event.reason can be an object or value
    var reason = event.reason || {};
    logError({
      type: "native promise rejection",
      message: reason.message || reason,
      stack: reason.stack
    });
  }
  function onRequireFailure(event) {
    var detail = event.detail;
    logError({
      type: "require error",
      stack: detail.stack,
      message: "Could not find module: " + detail.requireModules
    });
  }
  function report(error) {
    logError({
      type: "non-fatal error",
      stack: error.stack,
      message: error.message
    });
  }
  window.addEventListener("error", onError);
  // May get both JS and resource errors
  window.addEventListener("SitecuesUnhandledRejection", onPrimRejection);
  // Thrown from prim library
  window.addEventListener("unhandledrejection", onNativeRejection);
  window.addEventListener("rejectionhandled", onNativeRejection);
  window.addEventListener("SitecuesRequireFailure", onRequireFailure);
  // Thrown from prim library
  return {
    report: report
  };
});

sitecues.define("run/events", [], function() {
  "use strict";
  var arr = Array.prototype, manager = {};
  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////
  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `'*'` will bind the callback to all events fired
  function on(events, callback, context) {
    /* jshint validthis: true */
    var ev, list, tail;
    events = events.split(/\s+/);
    var calls = this._events || (this._events = {});
    // The events.length check before events.shift() protects us against prototype.js
    while (events.length && (ev = events.shift())) {
      // create an immutable callback list, allowing traversal during
      // modification. the tail is an empty object that will always be used
      // as the next node
      list = calls[ev] || (calls[ev] = {});
      tail = list.tail || (list.tail = list.next = {});
      tail.callback = callback;
      tail.context = context;
      list.tail = tail.next = {};
    }
    return this;
  }
  // remove one or many callbacks. if `context` is null, removes all callbacks
  // with that function. if `callback` is null, removes all callbacks for the
  // event. if `events` is null, removes all bound callbacks for all events
  function off(events, callback, context) {
    /* jshint validthis: true */
    var ev, node, calls = this._events;
    if (!events) {
      delete this._events;
    } else {
      if (calls) {
        events = events.split(/\s+/);
        while (events.length && (ev = events.shift())) {
          node = calls[ev];
          delete calls[ev];
          if (!callback || !node) {
            continue;
          }
          // create a new list, omitting the indicated event/context pairs
          while ((node = node.next) && node.next) {
            if (node.callback === callback && (!context || node.context === context)) {
              continue;
            }
            this.on(ev, node.callback, node.context);
          }
        }
      }
    }
    return this;
  }
  // emit an event, firing all bound callbacks. callbacks are passed the
  // same arguments as `emit` is, apart from the event name.
  function emit(events) {
    /* jshint validthis: true */
    var event, node, calls, tail, args, rest;
    if (!(calls = this._events)) {
      return this;
    }
    (events = events.split(/\s+/)).push(null);
    // save references to the current heads & tails
    while (events.length && (event = events.shift())) {
      if (!(node = calls[event])) {
        continue;
      }
      events.push({
        next: node.next,
        tail: node.tail
      });
    }
    // traverse each list, stopping when the saved tail is reached.
    rest = arr.slice.call(arguments, 1);
    while (node = events.pop()) {
      tail = node.tail;
      args = node.event ? [ node.event ].concat(rest) : rest;
      while ((node = node.next) !== tail) {
        node.callback.apply(node.context || this, args);
      }
    }
    return this;
  }
  manager.on = function() {
    var args = Array.prototype.slice.call(arguments);
    on.apply(manager, args);
  };
  manager.off = function() {
    var args = Array.prototype.slice.call(arguments);
    off.apply(manager, args);
  };
  manager.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    emit.apply(manager, args);
  };
  return {
    on: manager.on,
    off: manager.off,
    emit: manager.emit
  };
});

sitecues.define("run/exports", [ "run/constants", "run/events" ], function(constants, events) {
  "use strict";
  // Enums for sitecues loading state
  var state = constants.READY_STATE;
  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  function init(isOn) {
    // Events
    //Currently used on Chicago Lighthouse, we should discourage customer use of public event API
    //in preparation for changing it in the future
    sitecues.on = events.on;
    // Start listening for an event.
    sitecues.emit = events.emit;
    // Tell listeners about an event.
    sitecues.off = events.off;
    // Stop listening for an event.
    // Get info about the currently running sitecues client
    sitecues.status = getStatus;
    sitecues.getVersion = getVersion;
    sitecues.isOn = isOn;
    // Control BP expansion
    sitecues.expandPanel = expandPanel;
    sitecues.shrinkPanel = shrinkPanel;
    // Sitecues reset
    sitecues.reset = function() {};
    // noop unless page module is loaded (if not loaded, there is nothing to reset)
    //Loading state enumerations
    sitecues.readyStates = state;
    // 'Plant our flag' on this page.
    sitecues.exists = true;
  }
  function expandPanel() {
    sitecues.require([ "run/bp/controller/expand-controller" ], function(expandController) {
      expandController.expandPanel();
    });
  }
  function shrinkPanel() {
    sitecues.require([ "bp-expanded/controller/shrink-controller" ], function(shrinkController) {
      shrinkController.shrinkPanel();
    });
  }
  function getVersion() {
    return sitecues.version;
  }
  function getStatus() {
    var args = arguments;
    sitecues.require([ "status/status" ], function(statusFn) {
      statusFn.apply(this, args);
    });
  }
  return {
    init: init
  };
});

//jshint -W071
sitecues.define("run/bp/constants", [], function() {
  var constants = {};
  // TODO don't repeat this in styles.js
  constants.IS_BADGE = "scp-is-badge";
  // BP is already badge and not animating
  constants.IS_PANEL = "scp-is-panel";
  // BP is already panel and not animating (used to be called scp-ready)
  constants.WANT_BADGE = "scp-want-badge";
  // BP is already badge or shrinking into one
  constants.WANT_PANEL = "scp-want-panel";
  // BP is already panel or expanding into one
  // IDs
  constants.SMALL_A_ID = "scp-small-A";
  constants.LARGE_A_ID = "scp-large-A";
  constants.SPEECH_ID = "scp-speech";
  constants.MAIN_ID = "scp-main";
  constants.MAIN_CONTENT_FILL_ID = "scp-main-content-fill";
  constants.MOUSEOVER_TARGET = "scp-mouseover-target";
  // Mousing over this element causes BP to expand
  constants.SVG_ID = "scp-svg";
  constants.BADGE_ID = "sitecues-badge";
  constants.BP_CONTAINER_ID = "scp-bp-container";
  // Speech
  constants.HEAD_ID = "scp-head";
  constants.SPEECH_LABEL_ID = "scp-speech-label";
  constants.ZOOM_LABEL_ID = "scp-zoom-label";
  constants.SPEECH_TARGET_ID = "scp-speech-target";
  constants.WAVE_1_ID = "scp-wave1";
  constants.WAVE_2_ID = "scp-wave2";
  constants.WAVE_3_ID = "scp-wave3";
  constants.VERT_DIVIDER_ID = "scp-vert-divider";
  constants.BOTTOM_TEXT_ID = "scp-bottom-text";
  constants.BOTTOM_MOUSETARGET_ID = "scp-bottom-mousetarget";
  constants.BOTTOM_MORE_ID = "scp-bottom-secondary";
  constants.CLOSE_BUTTON_ID = "scp-close-button";
  constants.ZOOM_VALUE_ID = "scp-zoom-value";
  constants.ZOOM_SLIDER_ID = "scp-zoom-slider-target";
  constants.ZOOM_SLIDER_BAR_ID = "scp-zoom-slider-bar";
  constants.ZOOM_SLIDER_THUMB_ID = "scp-zoom-slider-thumb";
  constants.SHOW_ID = "scp-show";
  constants.SECONDARY_ID = "scp-secondary";
  constants.MORE_BUTTON_GROUP_ID = "scp-more-button-group";
  constants.MORE_BUTTON_CONTAINER_ID = "scp-more-button-container";
  constants.SHADOW_ID = "scp-shadow";
  constants.OUTLINE_ID = "scp-focus-outline";
  constants.MAIN_OUTLINE_ID = "scp-main-outline";
  constants.MAIN_OUTLINE_BORDER_ID = "scp-outline-def";
  constants.MORE_OUTLINE_ID = "scp-secondary-outline";
  constants.BUTTON_MENU_ID = "scp-button-menu";
  constants.TIPS_BUTTON_ID = "scp-tips-button";
  constants.SETTINGS_BUTTON_ID = "scp-settings-button";
  constants.FEEDBACK_BUTTON_ID = "scp-feedback-button";
  constants.ABOUT_BUTTON_ID = "scp-about-button";
  constants.ABOUT_ROTATE_HELPER_ID = "scp-about-rotate-helper";
  constants.TIPS_LABEL_ID = "scp-tips-label";
  constants.SETTINGS_LABEL_ID = "scp-settings-label";
  constants.FEEDBACK_LABEL_ID = "scp-feedback-label";
  constants.ABOUT_LABEL_ID = "scp-about-label";
  constants.ABOUT_CONTENT_ID = "scp-about";
  constants.ABOUT_CONTENT_IMAGE_ID = "scp-logo-text";
  constants.FEEDBACK_CONTENT_ID = "scp-feedback";
  constants.FEEDBACK_INPUT_RECT = "scp-feedback-input-rect";
  constants.FEEDBACK_TEXTAREA = "scp-feedback-textarea";
  constants.FEEDBACK_SEND_BUTTON = "scp-feedback-send-button";
  // Looks like a button
  constants.FEEDBACK_SEND_LINK = "scp-feedback-send-link";
  // Actual active link child with click handler
  constants.RATING = "scp-rating";
  constants.RATING_STAR_CLASS = "scp-rating-star";
  constants.SETTINGS_CONTENT_ID = "scp-settings";
  constants.TIPS_CONTENT_ID = "scp-tips";
  constants.ARROWS_ID = "scp-arrows";
  constants.NEXT_ID = "scp-next-card";
  constants.PREV_ID = "scp-prev-card";
  constants.DEFAULT_BADGE_CLASS = "scp-default-badge";
  // Tips panel gadgets
  constants.DEMO_PAGE = "scp-demo-page";
  constants.DEMO_PAGE_CONTENTS = "scp-demo-page-contents";
  constants.DEMO_PARA = "scp-demo-para";
  constants.DEMO_MOUSE = "scp-demo-mouse";
  constants.DEMO_SLIDER_THUMB = "scp-demo-slider-thumb";
  constants.DEMO_ZOOM_PLUS = "scp-demo-zoom-plus";
  constants.DEMO_ZOOM_MINUS = "scp-demo-zoom-minus";
  constants.DEMO_LENS_SPACE = "scp-demo-lens-spacebar";
  constants.DEMO_SPEECH_SPACE = "scp-demo-speech-spacebar";
  // Settings panel gadgets
  constants.THEME_POWER_ID = "scp-theme-power-group";
  constants.THEME_TEXT_HUE_ID = "scp-theme-text-hue-group";
  constants.MOUSE_SIZE_ID = "scp-mouse-size";
  constants.HOVER_DELAY_NOMOVE_BADGE = 30;
  // If mouse stays still inside badge for this long, open
  constants.HOVER_DELAY_STAY_INSIDE_BADGE = 150;
  // If mouse stays inside badge or toolbar for this long, open
  constants.HOVER_DELAY_STAY_INSIDE_FIRST_TIME = 40;
  // First time users get more sensitive badge
  constants.MOUSELEAVE_DELAY_SHRINK_BP = 2e3;
  constants.TRANSFORMS = {
    PANEL: {},
    BADGE: {},
    ABOUT_ENABLED: {},
    SETTINGS_ENABLED: {},
    FEEDBACK_ENABLED: {},
    TIPS_ENABLED: {}
  };
  constants.TRANSFORMS.PANEL[constants.VERT_DIVIDER_ID] = {
    translateX: 44
  };
  constants.TRANSFORMS.BADGE[constants.VERT_DIVIDER_ID] = {
    translateX: -98
  };
  constants.TRANSFORMS.PANEL[constants.SMALL_A_ID] = {
    translateX: 27
  };
  constants.TRANSFORMS.BADGE[constants.SMALL_A_ID] = {
    translateX: 0
  };
  constants.TRANSFORMS.PANEL[constants.LARGE_A_ID] = {
    translateX: 27
  };
  constants.TRANSFORMS.BADGE[constants.LARGE_A_ID] = {
    translateX: -115
  };
  constants.TRANSFORMS.PANEL[constants.SPEECH_ID] = {
    translateX: 54
  };
  constants.TRANSFORMS.BADGE[constants.SPEECH_ID] = {
    translateX: -100
  };
  constants.TRANSFORMS.PANEL[constants.ZOOM_SLIDER_THUMB_ID] = {
    translateX: 44
  };
  constants.TRANSFORMS.BADGE[constants.ZOOM_SLIDER_THUMB_ID] = {
    translateX: 8
  };
  constants.TRANSFORMS.FAKE_BADGE_TRANSLATEX = 116;
  constants.TRANSFORMS.PANEL[constants.ZOOM_SLIDER_BAR_ID] = {
    translateX: 27,
    scaleX: 1,
    scaleY: 1
  };
  constants.TRANSFORMS.BADGE[constants.ZOOM_SLIDER_BAR_ID] = {
    translateX: 19,
    scaleX: .65,
    scaleY: 1
  };
  constants.TRANSFORMS[constants.SECONDARY_ID] = {
    translateY: -198
  };
  constants.TRANSFORMS[constants.MORE_BUTTON_CONTAINER_ID] = {};
  constants.TRANSFORMS[constants.TIPS_BUTTON_ID] = {
    translateX: 25
  };
  constants.TRANSFORMS[constants.SETTINGS_BUTTON_ID] = {
    translateX: 235
  };
  constants.TRANSFORMS[constants.FEEDBACK_BUTTON_ID] = {
    translateX: 465
  };
  constants.TRANSFORMS[constants.ABOUT_BUTTON_ID] = {
    translateX: 675
  };
  // Elements that are only shown when panel is expanded
  // Attributes
  constants.PANEL_CONTAINER_ATTRS = {
    id: constants.BP_CONTAINER_ID,
    // First role "application" tells screen reader to go into focus (not browse) mode
    // Second role "dialog" gives more detail
    role: "dialog",
    tabindex: -1,
    class: "scp-loading",
    "aria-label": "Sitecues"
  };
  constants.BADGE_ATTRS = {
    role: "button",
    tabindex: 0,
    "aria-busy": "false",
    "data-sc-reversible": "false"
  };
  constants.DEFAULT_TOOLBAR_ATTRS = {
    id: constants.BADGE_ID,
    class: "scp-toolbar"
  };
  // Labels
  constants.ZOOM_STATE_LABELS = {
    ZOOM_OFF: "zoom_off",
    PRE_ZOOM: "pre_zoom",
    POST_ZOOM: "post_zoom"
  };
  constants.SPEECH_STATE_LABELS = {
    ON: "on",
    OFF: "off"
  };
  constants.STRINGS = {
    BADGE_LABEL: "badge_label"
  };
  // Zoom
  constants.ZOOM_KEY_INCREMENT = .1;
  // When arrow key pressed zoom is changed by this amount
  constants.FAKE_ZOOM_AMOUNT = 2.2;
  // If sitecues was never used, badge pretends zoom is here, to enhance attractiveness
  // Other
  constants.EXPAND_ANIMATION_DURATION_MS = 1500;
  // Time it takes to expand from badge to panel -- no hovers during this time
  constants.SHRINK_ANIMATION_DURATION_MS = 750;
  // Time it takes to shrink panel to badge -- no hovers during this time
  constants.NO_INPUT_TIMEOUT = 7e3;
  // Show more button if no activity for this amount of time
  // TODO is this still needed? It's fixed in Firefox
  constants.FIREFOX_SLIDER_OFFSET = 69;
  // Hardcoded because of https://bugzilla.mozilla.org/show_bug.cgi?id=479058
  // TODO compute this ratio
  // It's used to set the slider thumb properly
  constants.LARGE_SLIDER_WIDTH = 256;
  constants.SMALL_SLIDER_WIDTH = 160;
  // Ideal panel size for correct formatting of all contents.
  // We may need to use a larger size if the badge was already large
  // In that case we will make up the extra size using transform scale, so as not to disturb the HTML formatting
  constants.IDEAL_PANEL_WIDTH = 506;
  constants.IDEAL_PANEL_HEIGHT = 148;
  // Amount toolbar space that will open badge
  constants.ACTIVE_TOOLBAR_WIDTH = 500;
  // Amount of pixels of whitespace at the top of the badge
  // (This whitespace exists for a reason -- it turns into the top border when the panel opens)
  constants.BADGE_VERTICAL_OFFSET = 2;
  // Common palettes
  constants.PALETTE_NAME_ADAPTIVE = "adaptive";
  constants.PALETTE_NAME_NORMAL = "normal";
  constants.PALETTE_NAME_REVERSE_BLUE = "reverse-blue";
  // Map legal full palette names to short names, used to create a class e.g. .scp-palette-rb
  constants.PALETTE_NAME_MAP = {
    normal: "-n",
    adaptive: "*",
    "reverse-blue": "-rb",
    "reverse-yellow": "-ry"
  };
  // Wave animation (on hover over TTS button)
  constants.ANIMATE_WAVES_OPACITY = [ [ .2, .4, .6, .8, .8, .6, .4, .2, .2, .2, .2, .4, .6, .8, .8, .6, .4, .2, .2, .2 ], // Wave 1
  [ .2, .2, .4, .6, .8, .8, .6, .4, .2, .2, .2, .2, .4, .6, .8, .8, .6, .4, .2, .4 ], // Wave 2
  [ .2, .2, .2, .4, .6, .8, .8, .6, .4, .2, .2, .2, .2, .4, .6, .8, .8, .6, .4, .6 ] ];
  constants.ANIMATE_WAVES_STEP_DURATION = 100;
  constants.BADGE_MODE = 0;
  constants.PANEL_MODE = 1;
  constants.SECONDARY_PANEL_DISABLED = 0;
  constants.SECONDARY_PANEL_ENABLED = 1;
  return constants;
});

// TODO we can save a lot of bytes by setting these directly on the state object (instead of inside .data)
sitecues.define("run/bp/model/state", [], function() {
  "use strict";
  var data = {
    currentMode: 0,
    // 0 - 1, 0 is badge, 1 is panel, anything in between means its currently transitioning
    transitionTo: 0,
    // 0 or 1, 0 is badge, 1 is panel, it cannot be anything in between (doesn't seem to make sense to transition to anything other than the badge or panel state)
    isSecondaryPanel: false,
    // Are we currently in the secondary panel
    secondaryPanelTransitionTo: 0,
    scale: 1,
    // How much transform scale used on expanded BP
    isRealSettings: true,
    // Are we currently showing the actual settings or fake settings?
    isFirstBadgeUse: true,
    // Is this a first time user?
    secondaryPanelName: "button-menu",
    // 'button-menu', 'tips', 'settings', 'feedback', 'about'
    isSecondaryExpanding: false,
    // Is secondary panel currently expanding to accommodate new contents?
    isSecondaryExpanded: false,
    // Is secondary panel fully expanded?
    isStickyPanel: false,
    // Sticky panel is for debugging -- mouseout doesn't close the panel
    isClassicMode: false,
    // Use question mark if browser support is weak or site is incompatible with themes
    doSuppressHovers: false,
    // Suppress mouse hovers until next mousemove, because browser won't recompute them until then (useful for animations)
    isKeyboardMode: false,
    // Show focus in this mode, support tab navigation
    isOpenedWithScreenReader: false,
    // If opened with screen reader, be careful of spurious click events outside panel
    isMoreButtonVisible: false,
    // Should the more button be shown?
    isPageBadge: true,
    // Is set to false if default badge is inserted
    isToolbarBadge: false,
    // Set to true if using a badge toolbar. This may eventually become redundant with isPageBadge (the opposite of it) if we only use toolbar default badges.
    wasMouseInPanel: false,
    // Was the mouse inside the panel since last expansion
    paletteKey: "",
    // Current palette See BP_CONST.PALETTE_NAME_MAP for possible keys.
    defaultPaletteKey: "",
    // Palette to use if sitecues theme determines that default palette should be used based on the background behind the badge.
    isAdaptivePalette: false,
    // Is an adaptive palette name
    isShrinkingFromKeyboard: false,
    // Is the panel shrinking because of a keyboard command?
    isFeedbackSent: false,
    // Is the feedback sent?
    ratioOfSVGToVisibleBadgeSize: void 0
  };
  /*
  Public accessors.
   */
  /**
   * Get state model value specified by the property name given.
   * @param propName String
   * @returns {*}
   */
  function get(propName) {
    if (data.hasOwnProperty(propName)) {
      return data[propName];
    }
    if (true) {
      console.log("ERROR: Cannot get property with name " + propName + ".");
    }
  }
  /**
   * Set state model value specified by the property name given
   * @param propName String
   * @param propValue String or Number
   */
  function set(propName, propValue) {
    if (data.hasOwnProperty(propName)) {
      data[propName] = propValue;
    } else {
      if (true) {
        console.log("ERROR: Cannot set property with name " + propName + ".");
      }
    }
  }
  /*
  Some of the most popular getters are listed below.
   */
  function isPanel() {
    return 1 === data.currentMode;
  }
  function isBadge() {
    return 0 === data.currentMode;
  }
  function isPanelRequested() {
    return 1 === data.transitionTo;
  }
  function isExpanding() {
    return 1 === data.transitionTo && 1 !== data.currentMode;
  }
  function isSecondaryPanelRequested() {
    return 1 === data.secondaryPanelTransitionTo;
  }
  function isSecondaryFeaturePanel() {
    var panelName = getSecondaryPanelName();
    return panelName && "button-menu" !== panelName;
  }
  function isShrinking() {
    return 0 === data.transitionTo && 0 !== data.currentMode;
  }
  /**
   * Returns 'button-menu' or name of secondary panel
   * @returns {string}
   */
  function getSecondaryPanelName() {
    return data.secondaryPanelName;
  }
  function getPanelName() {
    if (isPanel() && isSecondaryPanelRequested()) {
      return data.secondaryPanelName;
    }
    return "main";
  }
  function isButtonMenu() {
    return isPanel() && "button-menu" === data.secondaryPanelName;
  }
  function turnOnRealSettings() {
    set("isRealSettings", true);
  }
  return {
    get: get,
    set: set,
    isPanel: isPanel,
    isBadge: isBadge,
    isPanelRequested: isPanelRequested,
    isExpanding: isExpanding,
    isSecondaryPanelRequested: isSecondaryPanelRequested,
    isSecondaryFeaturePanel: isSecondaryFeaturePanel,
    isShrinking: isShrinking,
    getSecondaryPanelName: getSecondaryPanelName,
    isButtonMenu: isButtonMenu,
    turnOnRealSettings: turnOnRealSettings,
    getPanelName: getPanelName
  };
});

// It is too similar to utils.js which is confusing
sitecues.define("run/bp/helper", [ "run/bp/constants" ], function(BP_CONST) {
  "use strict";
  /**
   *** Getters ***
   */
  var elementByIdCache = {};
  function byId(id) {
    var result = elementByIdCache[id];
    if (!result) {
      result = document.getElementById(id);
      elementByIdCache[id] = result;
    }
    return result;
  }
  function invalidateId(id) {
    elementByIdCache[id] = void 0;
  }
  /**
   * getRect returns the bounding client rect for the given element.
   * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
   * @param element
   * @returns {Object} rectangle
   */
  function getRect(element) {
    var rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height
    };
  }
  /**
   * getRectById returns the bounding client rect for the given ID.
   * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
   * @param id
   * @returns {Object} rectangle
   */
  function getRectById(id) {
    return getRect(byId(id));
  }
  /**
   *** Setters ***
   */
  // Leave this method here rather than take it out to 'util / common' to avoid extra modules deps.
  // In the end, we only want to load badge on the page w/o any other modules.
  // Important note: do not use this function to set inline styles on original (non-Sitecues) elements
  function setAttributes(element, attrs) {
    for (var attrName in attrs) {
      if (attrs.hasOwnProperty(attrName)) {
        element.setAttribute(attrName, attrs[attrName]);
      }
    }
  }
  function getCurrentSVGElementTransforms() {
    var result = {};
    function mapTranslate(id) {
      var transformAttrValue = byId(id).getAttribute("transform") || "";
      result[id] = {
        translateX: getNumberFromString(transformAttrValue) || 0
      };
    }
    // Everything except slider
    mapTranslate(BP_CONST.SMALL_A_ID);
    mapTranslate(BP_CONST.LARGE_A_ID);
    mapTranslate(BP_CONST.SPEECH_ID);
    mapTranslate(BP_CONST.VERT_DIVIDER_ID);
    mapTranslate(BP_CONST.ZOOM_SLIDER_THUMB_ID);
    // Slider bar is special because it stretches
    var sliderBar = byId(BP_CONST.ZOOM_SLIDER_BAR_ID), // translate(19) scale(.65, 1) -> ['translate(19)' , '(.65, 1)']
    sliderBarTransforms = sliderBar.getAttribute("transform").split("scale"), splitter = sliderBarTransforms[1].indexOf(",") >= 0 ? "," : " ", // IE fix
    sliderBarScale = sliderBarTransforms[1].split(splitter), sliderBarScaleX = sliderBarScale[0], sliderBarScaleY = sliderBarScale.length > 1 ? sliderBarScale[1] : sliderBarScaleX;
    result[BP_CONST.ZOOM_SLIDER_BAR_ID] = {
      translateX: getNumberFromString(sliderBarTransforms[0]),
      scaleX: getNumberFromString(sliderBarScaleX),
      scaleY: getNumberFromString(sliderBarScaleY)
    };
    return result;
  }
  function getNumberFromString(str) {
    return +str.match(/[0-9\.\-]+/);
  }
  // Fix for events in SVG in IE:
  // IE sometimes gives us the <defs> element for the event, and we need the <use> element
  function getEventTarget(evt) {
    return evt.target.correspondingUseElement || evt.target;
  }
  function cancelEvent(evt) {
    evt.returnValue = false;
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    return false;
  }
  //Edge can't handle text anchors during transformations, so we manually fix the x position of text within SVGs
  // A text anchor in SVG allows text to be centered, right-justified, etc.
  //TODO: Remove this when Edge fixes its support for text anchors, see SC-3434
  function fixTextAnchors(svg) {
    var elementsWithAnchors = svg.parentElement.querySelectorAll("[text-anchor]");
    Array.prototype.forEach.call(elementsWithAnchors, function(element) {
      var anchor = element.getAttribute("text-anchor"), x = parseFloat(element.getAttribute("x")), textWidthInPixels = element.getComputedTextLength();
      function setX(val) {
        var DECIMAL_PLACES = 2;
        element.setAttribute("x", val.toFixed(DECIMAL_PLACES));
      }
      if ("middle" === anchor) {
        setX(x - textWidthInPixels / 2);
      } else {
        if ("end" === anchor) {
          setX(x - textWidthInPixels);
        }
      }
      element.removeAttribute("text-anchor");
    });
  }
  // This will roughly help us group similar types of element clicks
  function getAriaOrNativeRole(elem) {
    var tag, role = elem.getAttribute("role");
    if (!role) {
      // No role: use tag name
      tag = elem.localName;
      if ("input" === tag) {
        // Tag name is input, use @type
        role = elem.getAttribute("type");
      } else {
        if ("g" === tag || "div" === tag) {
          // Tag name is g|div, use 'group'
          role = "group";
        }
      }
    }
    return role;
  }
  return {
    byId: byId,
    invalidateId: invalidateId,
    getRect: getRect,
    getRectById: getRectById,
    setAttributes: setAttributes,
    getCurrentSVGElementTransforms: getCurrentSVGElementTransforms,
    getNumberFromString: getNumberFromString,
    getEventTarget: getEventTarget,
    cancelEvent: cancelEvent,
    fixTextAnchors: fixTextAnchors,
    getAriaOrNativeRole: getAriaOrNativeRole
  };
});

// Fix urls and localize strings in markup
sitecues.define("run/bp/view/markup-finalizer", [ "run/locale" ], function(locale) {
  function removeHash(loc) {
    return loc.replace(/\#.*/, "");
  }
  // Relative URLs must be full URLS that a different base doesn't mess them up!
  // Without this fix, markup such as xlink:href="#foo" or filter="url(#foo)" will not work in Firefox
  // or recent Chrome, when the source document uses a base.
  // Even if the base points to the default base, we still need to convert hashes, otherwise a page
  // such as http://wokiss.pl/szkolenia.html will have an invisible badge in some browsers.
  // Note: the base can be set via <base> tag or http header.
  function convertRelativeUrlsToAbsolute(text) {
    var MATCH_URLS = /(href="|url\()(?:#)/g, pageUrlMinusHash = removeHash(document.location.href);
    return text.replace(MATCH_URLS, function(totalMatch, attributeName) {
      return attributeName + pageUrlMinusHash + "#";
    });
  }
  return function(markup) {
    var withAllAbsoluteUrls = convertRelativeUrlsToAbsolute(markup), localized = locale.localizeStrings(withAllAbsoluteUrls);
    return localized;
  };
});

sitecues.define("run/bp/view/styles", [ "run/bp/helper", "run/platform", "run/conf/site" ], function(helper, platform, site) {
  var isInitialized, palette, hasCustomPalette, customBadgePalette, doWebKitPrefix, BASE_CSS, isAnimationDebuggingOn = false, MAX_ZINDEX = 2147483647, BASE_SHEET_ID = "sitecues-js-bp-css", HIDE_IN_PRINT_MEDIA = // Turn off toolbar, dimmer, lens and zoom
  // TODO needs more work to reset body width if page sets it to something different
  "@media print { .scp-toolbar, #scp-bp-container, #sitecues-background-dimmer, #sitecues-hlb-wrapper { display: none !important; } body { transform: none !important; width: auto !important; } }";
  function toCSS(jsonObject) {
    var styles = HIDE_IN_PRINT_MEDIA;
    var isTransformPrefixNeeded = void 0 === document.createElement("p").style.transform;
    for (var selector in jsonObject) {
      if (jsonObject.hasOwnProperty(selector)) {
        styles += selector + " {\n";
        for (var attribute in jsonObject[selector]) {
          if (jsonObject[selector].hasOwnProperty(attribute)) {
            var value = jsonObject[selector][attribute];
            if (isTransformPrefixNeeded) {
              if ("transform" === attribute || "transition" === attribute || "transform-origin" === attribute) {
                // TEMPORARY DEBUGGING CODE
                if (true && isAnimationDebuggingOn && "transition" === attribute) {
                  value = value.replace(".", "");
                }
                if (doWebKitPrefix) {
                  attribute = "-webkit-" + attribute;
                  value = value.replace("transform", "-webkit-transform");
                }
              }
            }
            styles += "  " + attribute + ": " + value + ";\n";
          }
        }
        styles += "}\n";
      }
    }
    return styles;
  }
  function initBaseCss() {
    BASE_CSS = {
      /**
       General CSS rules for panel

       Basic structure of panel:
       <sc #scp-bp-container>
       <sc #scp-close-button>
       <sc .scp-feature-content>
       <svg #scp-svg>
       <defs>
       <g #scp-main>
       #scp-zoom-slider
       #scp-speech›
       ...
       <g #scp-secondary>     // Secondary panel that slides down
       <g .scp-feature-content>
       <g .scp-tips> etc.
       <sc-cards>
       <sc-card>
       <sc-card>
       ...

       Classes important for CSS:
       - On #scp-bp-container
       .scp-is-badge: BP is badge
       .scp-is-panel: BP is panel
       .scp-want-badge: BP is badge or shrinking into one
       .scp-want-panel: BP is panel or expanding into one
       .scp-is-panel-only  // Only display in panel mode or when becoming panel
       .scp-keyboard: Keyboard mode
       - Elsewhere:
       .scp-secondary-only   // Only display in more panel
       .scp-feature-content // Only display in feature panel (reachable for more panel)
       .scp-hand-cursor: show a hand (aka pointer) cursor over this element
       .scp-hidden-target: a click target that is hidden (e.g. a rect that covers more area than the visible part of the target)


       ARIA roles:
       - dialog, button, checkbox (speech button), slider, link, presentation (means don't expose to screen reader)
       ARIA modes:
       - Used for CSS: aria-checked, aria-disabled
       - Not used for CSS: aria-activedescendant (focused item ID), aria-valuenow, aria-valuemin, aria-valuemax, aria-label, aria-labelledby
       */
      "#scp-bp-container,#scp-bp-container textarea": {
        // We used to do #scp-bp-container *, but this could be dangerously slow
        "box-sizing": "content-box !important"
      },
      /***************** Loading/badge  ****************/
      // If there is an old badge image, do not show it -- we will show new BP-based badge in place of it
      "img#sitecues-badge, #sitecues-badge>img": {
        visibility: "hidden !important",
        opacity: "0 !important"
      },
      // When panel is closed, we use position: absolute
      // When open, we use position: fixed
      "#sitecues-badge>#scp-bp-container": {
        position: "absolute"
      },
      // Fade in the badge when it appears
      "#scp-bp-container": {
        position: "fixed",
        direction: "ltr !important",
        "z-index": MAX_ZINDEX,
        transition: "opacity 1.5s",
        "transform-origin": "0 0",
        "text-align": "left",
        // To prevent style pollution found on http://codecanyon.net/
        //          'will-change': 'transform',   // Removing helps Chrome not get blurry on sitecues.com after zoom
        outline: 0,
        // don't show default dotted focus outline
        "-webkit-user-select": "none",
        "-moz-user-select": "none",
        "-ms-user-select": "none"
      },
      "#scp-svg": {
        direction: "ltr !important",
        "max-width": "none",
        overflow: "hidden",
        position: "absolute"
      },
      // The new badge is hidden until sitecues is loaded
      // The old badge is visible until sitecues is loaded
      '#scp-bp-container.scp-loading,#sitecues-badge[aria-busy="false"]>img': {
        opacity: "0 !important",
        // We force the <img> placeholder to have a display of block so the wrapper height
        // is the same as the <img> height.  vertical-align:top was tried, tested, but
        // it did not work on faast.org.  Below is a link to information about the problem
        // and solutions.
        // http://stackoverflow.com/questions/11447707/div-container-larger-than-image-inside
        display: "block"
      },
      "#scp-bp-container:not(.scp-loading)": {
        opacity: "1 !important"
      },
      // .scp-toolbar means it's a toolbar
      ".scp-toolbar": {
        position: "fixed !important",
        top: 0,
        left: 0,
        width: "100%",
        height: "38px !important",
        margin: "0 !important",
        // Prevent page style pollution
        "box-sizing": "border-box",
        "box-shadow": "1px 1px 15px 0 rgba(9, 9, 9, .5)",
        padding: "6px 0 8px calc(50% - 66px)",
        "background-color": customBadgePalette.toolbar || "#f7fcff",
        // Ensure our own theme engine doesn't turn the toolbar dark
        "z-index": MAX_ZINDEX,
        direction: "ltr !important"
      },
      ".scp-toolbar > #scp-bp-container": {
        "background-color": "transparent !important",
        margin: "0 !important"
      },
      // Move the body down by the height of the toolbar
      "html[data-sitecues-toolbar]": {
        "padding-top": "38px !important"
      },
      /********** Transform animation speed **********/
      // TODO: Transitions are pretty efficient for opacity, but it may be worth trading
      //       that for simplicity (using JS animations for EVERYTHING).
      "#scp-main > *, .scp-wave": {
        transition: "fill .2s, opacity .2s"
      },
      "#scp-bottom-text": {
        transition: "opacity 1s",
        visibility: "hidden"
      },
      ".scp-is-panel text": {
        "font-family": "Arial",
        "font-size": "29px",
        "font-weight": "bold"
      },
      /* Text label animation for main panel labels */
      /* The problem with the text scale transition is jerkiness, so for now we delay text labels until panel is large */
      /* One way to fix this might be to render text into a canvas element, or maybe there's another font that doesn't do this */
      ".scp-is-panel #scp-bottom-text": {
        visibility: "visible !important",
        opacity: "1 !important"
      },
      /************** Shadow *********************/
      "#scp-shadow": {
        position: "absolute",
        top: "-437px",
        width: "513px",
        height: "564px",
        "background-image": "url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20820%20902%22%20preserveAspectRatio%3D%22xMinYMin%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22shadowblur%22%3E%20%3CfeGaussianBlur%20in%3D%22SourceGraphic%22%20stdDeviation%3D%225%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Cpath%20filter%3D%22url%28%23shadowblur%29%22%20d%3D%22m808%2C888c0%2C6%20-5%2C11%20-11%2C11H11m797%2C-11v-888%22%20stroke%3D%22%23222%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E)"
      },
      "#scp-shadow-container": {
        display: "none",
        opacity: 0,
        "pointer-events": "none"
      },
      ".scp-want-panel #scp-shadow-container": {
        transition: "opacity 1s",
        display: "block"
      },
      ".scp-is-panel #scp-shadow-container": {
        opacity: 1
      },
      /************ Small vs. large  *************/
      ".scp-want-panel > #scp-svg": {
        opacity: "1 !important"
      },
      ".scp-want-panel:not(.scp-is-panel) .scp-hand-cursor": {
        "pointer-events": "none"
      },
      ".scp-want-panel .scp-panel-only": {
        // element is visible in the large state of the badge-panel
        opacity: "1 !important"
      },
      ".scp-want-panel #scp-mouseover-target": {
        display: "none"
      },
      /**************** Waves ************************/
      ".scp-wave,.scp-head": {
        "pointer-events": "none"
      },
      /* Waves use gray off state if not hovering and showing real settings (not first time badge) */
      '.scp-realsettings #scp-speech[aria-checked="false"]:not(.scp-dim-waves) > .scp-wave': {
        /* First time we're small we always show on state because it's more inviting. However, going from small to large the first time, we're going from fake on to real off. Transition gently, don't draw attention to that. */
        fill: "#aaa"
      },
      ".scp-dim-waves> #scp-wave1": {
        opacity: ".3"
      },
      ".scp-dim-waves > #scp-wave2": {
        opacity: ".38"
      },
      ".scp-dim-waves > #scp-wave3": {
        opacity: ".44"
      },
      /******************* More **********************/
      ".scp-classic-true #scp-more-arrow": {
        display: "none"
      },
      ".scp-classic-false #scp-question": {
        display: "none"
      },
      "#scp-more-button-opacity": {
        opacity: 0,
        "pointer-events": "all"
      },
      ".scp-transition-opacity-fast": {
        transition: "opacity 0.4s",
        opacity: 1
      },
      "#scp-secondary, .scp-secondary-feature": {
        display: "none"
      },
      /******** Mouse targets must be hidden but still able to handle events *************/
      ".scp-hidden-target": {
        opacity: 0
      },
      /*************** Focus **************************/
      /* Do not use outline because it ends up being larger than the visible content, at least in Firefox */
      "#sitecues-badge:focus,#scp-bp-container:focus,#scp-bp-container *:focus": {
        outline: "0 !important"
      },
      '#sitecues-badge[aria-expanded="false"]:focus > .scp-is-badge #scp-badge-focus-rect': {
        stroke: "rgba(82, 168, 236, 0.8)",
        "stroke-width": "24px"
      },
      "#scp-focus-outline": {
        "box-shadow": "0 0 4px 6px rgba(82,168,236,0.8)",
        "border-radius": "4px",
        display: "none",
        position: "absolute",
        "pointer-events": "none",
        "z-index": 99999
      },
      /*** Firefox focus rules, since getBoundingClientRect() is broken for SVG */
      // Firefox focus for SVG
      '.scp-is-panel [data-show-focus="stroke-child"]:not([data-own-focus-ring]) rect,.scp-is-panel [data-show-focus="stroke-child"]:not([data-own-focus-ring])>.scp-hidden-target': {
        stroke: "rgba(82,168,236,.8)",
        "stroke-width": "8px",
        opacity: 1,
        display: "block",
        fill: "transparent",
        "z-index": -1,
        filter: "url(#scp-focusblur)"
      },
      // Firefox focus for HTML
      '.scp-is-panel [data-show-focus="box-shadow"]:not([data-own-focus-ring])': {
        "box-shadow": "0 0 10px 3px rgb(82,168,236)"
      },
      ".scp-is-panel.scp-keyboard:not(.scp-secondary-expanding) > #scp-focus-outline[data-show]": {
        display: "block"
      },
      // The feedback text area has its own focus ring so that it can show behind the feedback button :/ !
      "#scp-feedback-input-rect[data-show-focus]": {
        // Using id selector which is faster than [data-own-focus-ring][data-show-focus]
        stroke: "rgba(82,168,236,.8)",
        "stroke-width": "6px",
        filter: "url(#scp-focusblur)",
        "-webkit-filter": "url(#scp-focusblur)"
      },
      /*************** Clipping rules for badge **************************/
      // When the badge is fully collapsed, we clip it so that the invisible parts
      // of the SVG do not take mouse events.
      // The clipping is computed in placement.js
      // This rule undoes the placement.js clipping when the BP is not currently fully collapsed.
      "#scp-bp-container:not(.scp-is-badge)": {
        clip: "auto !important"
      },
      // ---- Badge colors (normal or object-based palette) ----
      // For instructions on setting up a palette, see https://equinox.atlassian.net/wiki/display/EN/sitecues+config+options
      "#scp-head": {
        fill: customBadgePalette.head || "#000"
      },
      ".scp-A-button": {
        fill: customBadgePalette.A || "#000"
      },
      "#scp-zoom-slider-thumb": {
        fill: customBadgePalette.sliderThumb || "#447AC4"
      },
      "#scp-zoom-slider-bar": {
        fill: customBadgePalette.sliderBar || "#383838"
      },
      "#scp-wave1": {
        fill: customBadgePalette.wave1On || "#80A9F8"
      },
      "#scp-wave2": {
        fill: customBadgePalette.wave2On || "#6B9AE0"
      },
      "#scp-wave3": {
        fill: customBadgePalette.wave3On || "#447AC4"
      },
      // ----- Pre-packaged palettes -----
      // .scp-palette-n  = palette: 'normal'
      // .scp-palette-rb = palette: 'reverse-blue'
      // .scp-palette-ry = palette: 'reverse-yellow'
      // -- Reverse blue ---
      ".scp-palette-rb #scp-zoom-slider-thumb": {
        fill: "#447AC4"
      },
      ".scp-palette-rb #scp-wave1": {
        fill: "#80A9F8"
      },
      ".scp-palette-rb #scp-wave2": {
        fill: "#6B9AE0"
      },
      ".scp-palette-rb #scp-wave3": {
        fill: "#447AC4"
      },
      ".scp-palette-rb .scp-A-button, .scp-palette-rb #scp-head, .scp-palette-rb #scp-zoom-slider-bar": {
        fill: "#fff"
      },
      ".scp-palette-rb.scp-toolbar": {
        "background-color": "#080300"
      },
      // -- Reverse yellow ---
      ".scp-palette-ry #scp-wave1": {
        fill: "#FFE460"
      },
      ".scp-palette-ry #scp-wave2": {
        fill: "#FFCC00"
      },
      ".scp-palette-ry #scp-wave3": {
        fill: "#FDAC00"
      },
      ".scp-palette-ry #scp-zoom-slider-thumb": {
        fill: "#FFCD00"
      },
      ".scp-palette-ry .scp-A-button, .scp-palette-ry #scp-head, .scp-palette-ry #scp-zoom-slider-bar": {
        fill: "#fff"
      },
      ".scp-palette-ry.scp-toolbar": {
        "background-color": "#080300"
      },
      // -- Expanded panel colors --
      // Panel must go back to normal colors when expanded
      // This is currently true for all palettes
      ".scp-want-panel .scp-A-button, .scp-want-panel #scp-head, .scp-want-panel  #scp-zoom-slider-bar": {
        fill: "#000"
      },
      ".scp-want-panel #scp-zoom-slider-thumb": {
        fill: "#447AC4"
      },
      ".scp-want-panel #scp-wave1": {
        fill: "#80A9F8"
      },
      ".scp-want-panel #scp-wave2": {
        fill: "#6B9AE0"
      },
      ".scp-want-panel #scp-wave3": {
        fill: "#447AC4"
      },
      ".scp-is-panel .scp-A-button:hover": {
        fill: "#447AC4"
      },
      ".scp-is-panel #scp-zoom-slider-thumb:hover": {
        fill: "#6B9AE0"
      },
      // General way of showing the content only if sitecues-badge is also shown.
      // Note: the page must also have the following rule:
      // .sitecues-only { visibility: hidden; opacity: 0; }
      ".sitecues-only": {
        visibility: "visible",
        opacity: 1
      }
    };
  }
  function createStyleSheet(sheetId, cssDefs) {
    var sheet = document.createElement("style");
    sheet.id = sheetId;
    sheet.innerHTML = toCSS(cssDefs);
    document.head.appendChild(sheet);
  }
  function init() {
    palette = site.get("palette");
    hasCustomPalette = "object" === typeof palette;
    customBadgePalette = hasCustomPalette && palette.badge || {};
    doWebKitPrefix = platform.browser.isSafari;
    initBaseCss();
    if (!isInitialized) {
      isInitialized = true;
      createStyleSheet(BASE_SHEET_ID, BASE_CSS);
    }
  }
  if (true) {
    sitecues.toggleSlowBPAnimations = function() {
      isAnimationDebuggingOn = !isAnimationDebuggingOn;
      document.head.removeChild(helper.byId(BASE_SHEET_ID));
      createStyleSheet(BASE_SHEET_ID, BASE_CSS);
    };
  }
  return {
    init: init
  };
});

// todo:
// 1. move this code to .svg file so it's easier to edit
/*
The purpose of some elements:
- #scp-zoom-slider-target used for slider size manipulation while dragging the slider thumb or other actions
- #scpspeechtarget adds animation styles for speech icon waves
-
 */
sitecues.define("run/bp/view/svg", [ "run/bp/view/markup-finalizer", "run/bp/view/styles" ], function(finalizer, styles) {
  /*jshint multistr: true */
  var svg = '<sc id="scp-focus-outline" role="presentation"></sc><sc id="scp-shadow-container" role="presentation" style="position:absolute;width:513px;height:630px;overflow:hidden">  <sc id="scp-shadow"></sc></sc><svg id="scp-svg" role="group" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 810 300" preserveAspectRatio="xMinYMin" data-sc-reversible="false" data-metric="panel"><defs>  <g id="scp-small-A-def">    <path d="m37 .2l23 62h-14l-5 -14h-23l-5 14h-14l23 -62h14zm1 38l-9 -23h0l-8 23h16z"/>    <rect class="scp-hidden-target scp-hand-cursor" x="-22" y="-35" width="102" height="134"/>  </g>  <g id="scp-large-A-def">    <path d="m54 0l33 89h-20l-7 -20h-33l-7 20h-20l34 -89h20zm1 55l-11 -32h0l-12 33h23z"/>    <rect class="scp-hidden-target scp-hand-cursor" x="-22" y="-20" width="140" height="132"/>  </g>  <path id="scp-zoom-slider-bar-def" d="m278 3v27c0 2 -1 3 -3 3h-273c-2 0 -3 -1 -3 -3v-6c0 -1 1 -2 2 -3l273 -22c1 0 3 1 3 3z"/>  <path id="scp-zoom-slider-thumb-def" d="m11,64l-10,-15v-41c0,-2 3,-7 5,-7h15c1,0 5,3 5,7v41l-10,15c0,0 -2.5,2 -5,0"/>  <path id="scp-head-def" d="m76 45c0 1 2 4 -2 5c-1 0 -2 .5 -4 .5c-1 0 -2 1 -1 2c0 1 0 2 -2 3c1 0 2 0 2 1c0 1 -1 1 -1 3c0 1 3 5 2 8c0 3 -10 2 -20 2c0 0 -3 11 10 13c7 1 14 7 14 16h-74c0 -5 0 -12 8 -14c0 0 14 -5 14 -14c1 -13 -9 -17 -11 -27c-5 -21 6 -39 29 -39c8 0 13 2 15 4c10 5 12 16 12 22c0 3 -2 6 .5 8c8 6 8 6 9 7z"/>  <path id="scp-wave1-def" d="m105 26c0 0 26 25 1 52c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c0 0 17 -18 0 -41c-1 -2 0 -5 2 -6c2 -1 8 -2 11 1z"/>  <path id="scp-wave2-def" d="m134 14c37 41 0 74 0 74c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c27 -35 0 -64 0 -64l0 0c-1 -2 0 -5 2 -6c2 -1 9 -1 11 1z"/>  <path id="scp-wave3-def" d="m167 2c0 0 48 47 0 97c-3 3 -9 2 -11 1c-2 -1 -3 -5 -2 -6c36 -47 0 -87 0 -87c-1 -2 0 -5 2 -6c2 -1 9 -2 11 1z"/>  <g id="scp-bottom-def">    <rect x="0" y="134" width="808" stroke="#C0BFBF" stroke-width="1" height="1" fill="none"/>    <path transform="translate(0,1)" d="M806,186c0,6-5,11-11,11H12C6,196,1,192,1,187v-42 c0-6,0-11,0-11h806c0,0,0,5,0,11V186" fill="#EEE"/>  </g>  <path id="scp-outline-def" d="M 808 187c0 6-5 11-11 11H11.5 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V187" stroke="#999" stroke-width="1.5"/>  <g id="scp-rating-star-def">    <path d="M30 45L48 54L44 35L59 21L39 18L30 0L21 18L1 21L16 35L12 54L30 45"/>    <rect class="scp-hidden-target scp-hand-cursor" width="66" height="62"/>  </g>  <filter id="scp-focusblur">    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/>  </filter>  <path id="scp-arrow" d="m18,-1.9c-1.3,1.4 -15.6,15 -15.6,15c-.7,.7 -1.7,1.2 -2.7,1.2c-1,0 -1.89999,-.4 -2.7,-1.2c0,0 -14.2,-13.6 -15.6,-15c-1.3,-1.4 -1.4,-3.9 0,-5.3c1.4,-1.5 3.5,-1.6 5.2,0l13,12.5l13,-12.5c1.8,-1.6 3.8,-1.5 5.2,0c1.3,1.8 1.3,4 0,5.3l.2,0z"/></defs><rect id="scp-badge-bg" fill="white" stroke-width="0" x="0" y="0" width="630" height="124" opacity="0"/><rect id="scp-badge-focus-rect" fill="transparent" stroke-width="0" x="10" y="10" width="620" height="114" rx="15" ry="15" filter="url(#scp-focusblur)"/><g id="scp-main" aria-label="{{sitecues_main_panel}}">  <rect id="scp-main-content-fill" role="presentation" fill="white" stroke-width="0" x="1" y="1" width="806" height="134" class="scp-panel-only" opacity="0"/>  <use id="scp-small-A" xlink:href="#scp-small-A-def" y="48" role="button" aria-label="{{zoom_out}}" class="scp-A-button"/>  <g id="scp-zoom-slider-bar" role="slider" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1" aria-labelledby="scp-zoom-label" data-thumb-mover="scp-zoom-slider-thumb">    <use xlink:href="#scp-zoom-slider-bar-def" x="80" y="60"/>    <rect id="scp-zoom-slider-target" role="presentation" class="scp-hidden-target scp-hand-cursor" x="80" y="44" width="280" height="67"/>  </g>  <use id="scp-zoom-slider-thumb" class="scp-hand-cursor" xlink:href="#scp-zoom-slider-thumb-def" role="presentation" aria-controls="scp-zoom-slider-bar" y="48" x="60"/>  <use id="scp-large-A" xlink:href="#scp-large-A-def" x="380" y="21" role="button" aria-label="{{zoom_in}}" class="scp-A-button"/>  <line id="scp-vert-divider" class="scp-panel-only" opacity="0" stroke="#888" stroke-width="2" x1="500" y1="31" x2="500" y2="99"/>  <g id="scp-speech" role="checkbox" aria-checked="false" aria-label="{{speech}}"> <!-- ARIA Toggle button not working well with NVDA screen reader -->    <use id="scp-head" role="presentation" xlink:href="#scp-head-def" x="530" y="11"/>    <use id="scp-wave1" role="presentation" xlink:href="#scp-wave1-def" class="scp-wave" x="530" y="11"/>    <use id="scp-wave2" role="presentation" xlink:href="#scp-wave2-def" class="scp-wave" x="530" y="11"/>    <use id="scp-wave3" role="presentation" xlink:href="#scp-wave3-def" class="scp-wave" y="11" x="530"/>    <rect id="scp-speech-target" role="presentation" x="530" y="5" width="193" height="115" class="scp-hidden-target scp-hand-cursor"/>  </g>  <g id="scp-bottom" class="scp-panel-only" opacity="0">    <use id="scp-bottom-mousetarget" role="presentation" xlink:href="#scp-bottom-def"/>    <g id="scp-bottom-text" role="presentation" opacity="0">      <text id="scp-zoom-label" x="25" y="178"><tspan id="scp-zoom-value" role="presentation">{{zoom_off}}</tspan></text>      <text id="scp-speech-label" x="581" y="178" data-x-start="581" data-x-end="795">        {{speech}} {{off}}      </text>    </g>    <rect opacity="0" x="0" y="195" width="808" height="64"/>  </g></g><g id="scp-secondary-anchor" role="presentation" /><use id="scp-main-outline" role="presentation" xlink:href="#scp-outline-def" class="scp-panel-only" fill="none" opacity="0"/><g id="scp-more-button-opacity" role="presentation" transform="translate(400,198)">  <g id="scp-more-button-container" role="presentation">    <g id="scp-more-button-group" data-hover="scale(1.2)" class="scp-hand-cursor" role="button" aria-label="{{more_features}}">      <circle fill="#FFF" stroke="#777" stroke-width="5" stroke-miterlimit="10" cx="0" cy="0" r="34"/>      <use id="scp-more-arrow" role="presentation" fill="#777" xlink:href="#scp-arrow"/>      <path id="scp-question" role="presentation" fill="#777" stroke="#777" stroke-width="2" d="M0,-16c-3.4 0-6 1-7.5 2.6-1.6 1.6-2.2 3.6-2.4 5.1l4 .5c.2-1 .5-2 1.2-2.8 .8-.8 2-1.5 4.6-1.5 2.6 0 4.1 .5 4 1.4 .8 .7 1.1 1.6 1.1 2.6 0 3.3-1.4 4.2-3.4 6-2 1.8-4.6 4.3-4.6 9v1h4v-1c0-3.3 1.2-4.2 3.2-6 2-1.8 4.8-4.3 4.8-9 0-2-.7-4.1-2.4-5.6-1.7-1.6-4.3-2.4-7.6-2.4zm-2.8 28v4h4v-4h-4z"></path>      <circle cx="0" cy="0" r="36" class="scp-hidden-target"/>    </g>  </g></g><rect id="scp-mouseover-target" role="presentation" x="-100" y="-40" width="820" height="200" opacity="0"/></svg><sc id="scp-html-secondary-anchor" role="presentation" style="display:none"></sc>';
  // Hack to make sure innerHTML doesn't remove any important last element
  return function() {
    styles.init();
    return finalizer(svg);
  };
});

sitecues.define("run/util/array-utility", [], function() {
  "use strict";
  // Return an array with the members of arr1 that aren't in arr2, and the members of arr2 that aren't in arr1
  // NOTE: if elements aren't unique in an array, they will be repeated in the difference
  function symmetricDifference(arr1, arr2) {
    var difference, array1 = from(arr1), array2 = from(arr2);
    if (array1.length) {
      difference = array2.filter(function(member) {
        if ("undefined" !== typeof member) {
          var index = array1.indexOf(member);
          if (index !== -1) {
            array1.splice(index, 1);
            return false;
          }
          return true;
        }
      });
      difference = difference.concat(array1);
    } else {
      difference = array2;
    }
    return difference;
  }
  // Takes any number of arrays and returns the union of all sets, i.e. an array with the unique members of each array
  function union() {
    var set = new Set(), arrays = from(arguments), arrayCount = arrays.length;
    for (var i = 0; i < arrayCount; i++) {
      var array = arrays[i], arraySize = array.length;
      for (var j = 0; j < arraySize; j++) {
        set.add(array[j]);
      }
    }
    return fromSet(set);
  }
  // Returns an array with elements that are in all of the passed arrays
  function intersection() {
    var arrays = arguments, i = arrays.length;
    return Array.prototype.filter.call(arrays[0], function(elem) {
      while (--i) {
        var arr = arrays[i];
        if (arr.indexOf(elem) === -1) {
          return false;
        }
      }
      return true;
    });
  }
  // Only add element if it isn't currently in the array. Return original array
  function addUnique(arr, element) {
    if (arr.indexOf(element) === -1) {
      arr.push(element);
    }
    return arr;
  }
  // Returns a new array with only the unique elements in @arr
  function unique(original) {
    var results = [], i = original.length;
    while (i--) {
      if (results.indexOf(original[i]) === -1) {
        results.unshift(original[i]);
      }
    }
    return results;
  }
  // Removes all elements matching @element from the @array, returns a new array
  function remove(array, element) {
    var index;
    do {
      index = array.indexOf(element);
      if (index !== -1) {
        array.splice(index, 1);
      }
    } while (index !== -1);
    return array;
  }
  function fromSet(set) {
    var arr = [];
    set.forEach(function(member) {
      arr.push(member);
    });
    return arr;
  }
  function from(arrayLike) {
    return Array.prototype.slice.call(arrayLike, 0);
  }
  function wrap(data) {
    return Array.isArray(data) ? data : [ data ];
  }
  return {
    remove: remove,
    addUnique: addUnique,
    unique: unique,
    symmetricDifference: symmetricDifference,
    union: union,
    intersection: intersection,
    fromSet: fromSet,
    from: from,
    wrap: wrap
  };
});

/*
* Inline-Style
*
* This module is responsible for watching inline style mutations of elements modified by Sitecues in order to accurately
* calculate the `intended style` of an element, i.e. the style an element would have if Sitecues had not manipulated its inline value.
*
* This is important for a couple reasons:
 A complete reset of Sitecues should restore all the original styles. The problem with our past solution, caching an element's style value before setting
 our own style, is that it doesn't allow for dynamic re-setting of the style during the lifetime of the document, so we end up overwriting
 the updated style with our cached value.

 Even without a complete reset, we frequently want to restore individual elements to their intended state for certain operations.
 For example zoom resets the transform and width of the body element to an empty string when it recomputes the original body dimensions,
 instead of restoring values that were potentially already defined. This makes that process very easy now: inlineStyle.restore(body, ['width', 'transform'])

 If instead we actually do want to restore only the prior value of a style, rather than its intended style (for example, if we had set overflow-x on the document element and need to
 override that value briefly), you can do this: inlineStyle.restoreLast(docElem, ['overflow-x'])
* */
sitecues.define("run/inline-style/inline-style", [ "mini-core/native-global", "run/util/array-utility", "run/util/object-utility" ], function(nativeGlobal, arrayUtil, objectUtil) {
  "use strict";
  var proxyMap, kebabCaseCache, assignmentDictionary, assignmentRecords, lastStyleMap, intendedStyleMap, updateTimer, styleParser, // Arbitrarily long timeout between updating the intended style.
  // This isn't an especially well tuned number, we just don't need it to update very often
  UPDATE_TIMEOUT = 300, cssNumbers = {
    "animation-iteration-count": true,
    "column-count": true,
    "fill-opacity": true,
    "flex-grow": true,
    "flex-shrink": true,
    "font-weight": true,
    "line-height": true,
    opacity: true,
    order: true,
    orphans: true,
    widows: true,
    "z-index": true,
    zoom: true
  };
  // This function replicates jQuery's coercion of numeric style values to unit strings when appropriate
  function fixUnits(property, value) {
    return "number" === typeof value && 0 !== value && !cssNumbers[property] ? value + "px" : value;
  }
  function arrayAssignment(element, styleInfo, styleField) {
    var property = toKebabCase(styleInfo[0]);
    element[styleField].setProperty(property, fixUnits(property, styleInfo[1]), styleInfo[2] || "");
  }
  function objectAssignment(element, styleInfo, styleField) {
    Object.keys(styleInfo).forEach(function(prop) {
      var property = toKebabCase(prop);
      element[styleField].setProperty(property, fixUnits(property, styleInfo[prop]));
    });
  }
  function stringAssignment(element, styleInfo, styleField) {
    element[styleField].cssText = styleInfo;
  }
  // @param elmts     : the elements to apply inline styles to
  // @param styleInfo : accepts a string, array or object in the following formats:
  /*
     * { property : value, ... }
     * 'property: value; ...'
     * ['property', 'value', 'importance']
     * */
  // @param callback  : if a callback is defined, instead of inserting a style proxy for each element, cache their intended styles, apply our style values,
  // run the callback function, and then restore the intended styles. By doing this in a synchronous block we can guarantee that no other scripts will have an opportunity
  // to assign a new value
  function overrideStyle(elmts, styleInfo) {
    var assignmentFn = getAssignmentFunction(styleInfo), elements = arrayUtil.wrap(elmts);
    elements.forEach(function(element) {
      var currentStyles = getCurrentStyles(element);
      if (isStyleProxied(element)) {
        updateLastStyles(element, styleInfo, currentStyles);
      } else {
        lastStyleMap.set(element, objectUtil.assign({}, currentStyles));
        intendedStyleMap.set(element, objectUtil.assign({}, currentStyles));
        insertStyleProxy(element);
      }
      assignmentFn(element, styleInfo, "_scStyle");
    });
  }
  function toKebabCase(str) {
    var memoizedValue = kebabCaseCache[str];
    if ("string" !== typeof memoizedValue) {
      memoizedValue = kebabCaseCache[str] = str.replace(/([A-Z])/g, function(g) {
        return "-" + g[0].toLowerCase();
      });
    }
    return memoizedValue;
  }
  function getIntendedStyles(element) {
    updateIntendedStyles();
    return intendedStyleMap.get(element);
  }
  function getCurrentStyles(element) {
    return parseCss(getCssText(element));
  }
  function getLastStyles(element) {
    updateIntendedStyles();
    return lastStyleMap.get(element);
  }
  function getStyleType(styleInfo) {
    return Array.isArray(styleInfo) ? "array" : typeof styleInfo;
  }
  function getAssignmentFunction(styleInfo) {
    return assignmentDictionary[getStyleType(styleInfo)];
  }
  function setStyle(elmts, styleInfo) {
    var assignmentFn = getAssignmentFunction(styleInfo), elements = arrayUtil.wrap(elmts);
    elements.forEach(function(element) {
      assignmentFn(element, styleInfo, "style");
    });
  }
  function removeProperty(element, property) {
    getStyle(element).removeProperty(toKebabCase(property));
  }
  function clearStyle(element) {
    element.removeAttribute("style");
  }
  // This function exists mainly because we need a linting rule against /.style[^\w]/ to ensure that other modules do not interact directly
  // with elements' style object directly.
  /* NOTE: It is important to use `setStyle` to set style values for `original elements`, defined as elements in the DOM that were not
    * inserted by Sitecues. Though this method can return the style object of an element for conveniently reading and writing from
    * Sitecues elements, it must NOT be used to get the style object of original elements for the intention of setting style values */
  function getStyle(element) {
    var styleProperty = getDirectStyleProperty(element);
    return element[styleProperty];
  }
  function queueAssignmentRecord(element, styleInfo) {
    assignmentRecords.push({
      element: element,
      styleInfo: styleInfo
    });
    if (!updateTimer) {
      updateTimer = nativeGlobal.setTimeout(function() {
        updateIntendedStyles();
      }, UPDATE_TIMEOUT);
    }
  }
  // when we override a proxied element, we need to update the last style cache
  // for element, saving the current field values before the overriding values are assigned
  // Fields that are untouched by this new override retain their existing last value
  function updateLastStyles(element, styleInfo, currentStyles) {
    var lastStyles = getLastStyles(element), styleType = getStyleType(styleInfo), styleObj = getStyle(element);
    function updateProperty(prop) {
      var property = toKebabCase(prop);
      saveStyleValue(styleObj, property, lastStyles);
    }
    switch (styleType) {
     case "array":
      updateProperty(styleInfo[0]);
      break;

     case "object":
      Object.keys(styleInfo).forEach(updateProperty);
      break;

     case "string":
      lastStyles = currentStyles;
    }
    lastStyleMap.set(element, lastStyles);
  }
  function updateIntendedStyles() {
    assignmentRecords.forEach(function(record) {
      var cssObject, element = record.element, styleInfo = record.styleInfo, // cssText was assigned in this case
      isCssOverwritten = "string" === typeof styleInfo, intendedStyles = isCssOverwritten ? {} : intendedStyleMap.get(element) || {}, lastStyles = isCssOverwritten ? {} : lastStyleMap.get(element) || {};
      if (isCssOverwritten) {
        cssObject = parseCss(styleInfo);
      } else {
        // This gives us kebab-case property names
        cssObject = parseCss(stringifyCss(styleInfo));
      }
      Object.keys(cssObject).forEach(function(property) {
        var declaration = cssObject[property];
        intendedStyles[property] = objectUtil.assign({}, declaration);
        // We don't want a reversion to the `last styles`, the inline values of an element cached before its latest override, to clobber
        // dynamic updates to its intended styles.
        lastStyles[property] = objectUtil.assign({}, declaration);
      });
      intendedStyleMap.set(element, intendedStyles);
      lastStyleMap.set(element, lastStyles);
    });
    assignmentRecords = [];
    clearTimeout(updateTimer);
    updateTimer = null;
  }
  function restoreLast(element, props) {
    var lastStyles = getLastStyles(element);
    // Styles only need to be restored if we have overridden them.
    if (!lastStyles) {
      return;
    }
    var style = getStyle(element), properties = arrayUtil.wrap(props).map(toKebabCase);
    properties.forEach(function(property) {
      restoreStyleValue(style, property, lastStyles);
    });
  }
  // @param property must be kebab case in order to look up the cached styles
  function restoreStyleValue(style, property, cachedStyles) {
    var value, priority, declaration = cachedStyles[property];
    if (declaration && declaration.value) {
      value = declaration.value;
      priority = declaration.priority;
      style.setProperty(property, value, priority);
    } else {
      style.removeProperty(property);
    }
  }
  // @param property must be kebab case in order to look up the cached styles
  function saveStyleValue(style, property, cachedStyles) {
    var value = style.getPropertyValue(property) || "", priority = style.getPropertyPriority(property) || "";
    cachedStyles[property] = {
      value: value,
      priority: priority
    };
  }
  /*
  * If this function is called with an undefined `props` parameter, de-proxy the element's style property
  * */
  function restore(element, props) {
    var properties, style = getStyle(element), intendedStyles = getIntendedStyles(element);
    // Styles only need to be restored if we have overridden them.
    if (!intendedStyles) {
      return;
    }
    if (props) {
      properties = arrayUtil.wrap(props).map(toKebabCase);
      properties.forEach(function(property) {
        restoreStyleValue(style, property, intendedStyles);
      });
      // Only restore the specified properties
      return;
    }
    var cssText = stringifyCss(intendedStyles);
    if (cssText) {
      style.cssText = cssText;
    } else {
      clearStyle(element);
    }
    delete element.style;
    delete element._scStyle;
    delete element._scStyleProxy;
  }
  function styleProxyGetter(property) {
    /*jshint validthis: true */
    // TODO: We should return a proxied version of setProperty / removeProperty
    if ("function" === typeof this._scStyle[property]) {
      return this._scStyle[property].bind(this._scStyle);
    }
    return this._scStyle[property];
  }
  function styleProxySetter(property, value) {
    /*jshint validthis: true */
    var record = {};
    record[property] = value;
    queueAssignmentRecord(this, record);
    this._scStyle[property] = value;
  }
  // This inserts a proxy to catch intended style changes set by other scripts, allowing those intended
  // styles to be re-applied after Sitecues styles are removed.
  function insertStyleProxy(element) {
    var proxy = proxyMap.get(element);
    if (element.style === proxy) {
      return;
    }
    if (!proxy) {
      proxy = createProxy(element);
    }
    element._scStyle = element.style;
    element._scStyleProxy = proxy;
    Object.defineProperty(element, "style", {
      configurable: true,
      // note : get & set function declarations / expressions de-optimize their containing
      // function. Don't put more in this function than needs to happen
      get: function() {
        return element._scStyleProxy;
      },
      // element.style = cssText is equivalent to element.style.cssText = cssText
      set: function(cssText) {
        queueAssignmentRecord(element, cssText);
        element._scStyle.cssText = cssText;
      }
    });
  }
  function createProxy(element) {
    var styleChain = element.style, styleProxy = {}, proxiedProperties = {};
    function interceptProperty(property) {
      if (proxiedProperties[property]) {
        return;
      }
      var boundGetter = nativeGlobal.bindFn.call(styleProxyGetter, element, property), boundSetter = nativeGlobal.bindFn.call(styleProxySetter, element, property);
      proxiedProperties[property] = true;
      Object.defineProperty(styleProxy, property, {
        get: boundGetter,
        set: boundSetter
      });
    }
    while (styleChain) {
      Object.getOwnPropertyNames(styleChain).forEach(interceptProperty);
      styleChain = Object.getPrototypeOf(styleChain);
    }
    proxyMap.set(element, styleProxy);
    return styleProxy;
  }
  function isStyleProxied(element) {
    return element.style === element._scStyleProxy;
  }
  function getDirectStyleProperty(element) {
    return isStyleProxied(element) ? "_scStyle" : "style";
  }
  function getCssText(element) {
    return getStyle(element).cssText;
  }
  function stringifyCss(cssObject) {
    styleParser.cssText = "";
    Object.keys(cssObject).forEach(function(prop) {
      var value, priority, //setProperty only takes kebab-case
      property = toKebabCase(prop), propertyData = cssObject[prop];
      if (propertyData && "object" === typeof propertyData) {
        value = cssObject[prop].value;
        priority = cssObject[prop].priority;
      } else {
        value = propertyData;
        priority = "";
      }
      styleParser.setProperty(property, value, priority);
    });
    return styleParser.cssText;
  }
  // Returns an object keyed with style properties to a property data object containing value and priority
  // @return { property : { value : foo, priority : 'important' } }
  function parseCss(cssText) {
    var cssObj = {};
    styleParser.cssText = cssText;
    for (var i = 0; i < styleParser.length; i++) {
      var property = styleParser[i];
      saveStyleValue(styleParser, property, cssObj);
    }
    return cssObj;
  }
  function init() {
    // element -> intended css object
    intendedStyleMap = new WeakMap();
    // element -> last css object
    lastStyleMap = new WeakMap();
    // element -> style proxy object
    proxyMap = new WeakMap();
    assignmentRecords = [];
    styleParser = document.createElement("div").style;
    assignmentDictionary = {
      array: arrayAssignment,
      object: objectAssignment,
      string: stringAssignment
    };
    kebabCaseCache = {};
  }
  getStyle.override = overrideStyle;
  getStyle.set = setStyle;
  getStyle.restore = restore;
  getStyle.restoreLast = restoreLast;
  getStyle.removeProperty = removeProperty;
  getStyle.clear = clearStyle;
  getStyle.init = init;
  return getStyle;
});

/**
 * PLACEMENT -- on screen and in DOM
 *
 * --- What? ---
 *
 * Ensure that the BP always has both:
 * - The right parent (this switches depending on BP state)
 * - Correct size and position (must originate from in-page badge)
 *
 * --- When? ---
 *
 * 1. At initialization time (goes inside badge)
 * 2. Before expansion (goes inside html)
 * 3. After shrinking (goes back inside badge)
 *
 * --- Where? ---
 *
 * There are three important elements at work here:
 *
 * 1. Badge element (#sitecues-badge) --
 *    This is a badge that is placed in the page by the site owner.
 *    Element:
 *      - Old way: use an <img> -- still supported for now
 *      - New way: use an empty container that we will fill with the sitecues badge
 *    Position:      whatever site owner chooses
 *    Parent:        whatever site owner chooses
 *    Display type:  whatever site owner chooses
 *    Accessibility: Uses role="button" and placed in the tab order of the page via tabindex="0"
 *
 * 2. BP element (#scp-bp-container)
 *    Container that moves around the page and parents all of the BP content
 *    Element:      <div> inserted by bp.js
 *    Position:     absolute (TODO will be static when it goes inside parent?)
 *    Parent: it switches parents depending on whether it is small or not:
 *    - Parented by the badge when it's small (badge state) -- this allows it to scale and move with the page
 *      Special default badge case: always parented by badge (which is outside of the <body>) and doesn't switch on expansion.
 *      (Note: if the #sitecues-badge is an <img> we make it a previous sibling of that, because <img>s can't parent)
 *      TODO previous sibling is breaking page layout
 *    - Parented by the <html> element when it's not small so that it doesn't change size or position while it's being used.
 *    Display type: block
 *    Accessibility: treated as application dialog; receives focus in keyboard mode
 *
 *  3. SVG Element (#scp-svg)
 *    This is all the BP content. We need this element to change it's width/height as appropriate (TODO when?)
 *    Element: <svg> inserted by bp.js
 *    Position: static
 *    Parent: #scp-bp-container
 *    Accessibility: uses ARIA to describe controls
 */
sitecues.define("run/bp/view/badge/placement", [ "run/bp/model/state", "run/bp/constants", "run/bp/helper", "run/platform", "run/events", "run/inline-style/inline-style" ], function(state, BP_CONST, helper, platform, events, inlineStyle) {
  "use strict";
  var currentBPParent, badgeElement, badgeGeometry, bpElement, svgElement, isInitialized, // The width/height of the <SVG>
  // Note: this currently stays the same in badge vs panel sizes even though the panel stretches,
  // because of transparent space to the right/bottom of the visible BP
  svgAspectRatio, SHOULD_FIX_USE_ELEMENTS, BADGE_PARENT = BP_CONST.BADGE_MODE, HTML_PARENT = BP_CONST.PANEL_MODE, badgeRect = {}, currentZoom = 1, documentElement = document.documentElement;
  // Allow animations just before panel expands
  function disableAnimations() {
    svgElement.removeAttribute("class");
  }
  // Reparent panel container to badgeElement so that page badge grows and moves
  // in-place inside the page where it is attached.
  // Also, position and size the bpContainer and set height and width of the SVG
  function switchToBadgeParent() {
    var styles = {
      tranform: ""
    };
    // Remove transform/translate so that badge is fully returned to origin state
    inlineStyle.set(bpElement, styles);
    badgeElement.appendChild(bpElement);
    currentBPParent = BADGE_PARENT;
    repositionBPOverBadge();
    fitSVGtoBadgeRect();
  }
  // Reparent panel container to <html> so that panel stays constant size and position during zooming/panning
  function switchToHtmlParent() {
    if (bpElement.parentElement === documentElement) {
      return;
    }
    // HTML_PARENT
    // Case 3. Insert outside body (as a child of <html>)
    documentElement.insertBefore(bpElement, documentElement.childNodes[0]);
    currentBPParent = HTML_PARENT;
    // The BP must be positioned over the #sitecues-badge
    repositionBPOverBadge();
    fitSVGtoBadgeRect();
  }
  // Edge and IE11 on Windows 10 fix
  // Once the BP is moved, these browsers are not re-recognizing the @xlink:href on <use> elements
  // if they are moved. However, toggling a space in front of the attribute value fixes the issue.
  function fixUseElementsInIE() {
    if (SHOULD_FIX_USE_ELEMENTS) {
      var useElement, useElements = svgElement.getElementsByTagName("use"), numUseElements = useElements.length, useIndex = 0;
      for (;useIndex < numUseElements; useIndex++) {
        useElement = useElements[useIndex];
        // Toggle space in front of href attribute to get
        // IE to 'wake up' and understand it again
        var href = useElement.getAttribute("xlink:href"), newHref = " " === href.charAt(0) ? href.substr(1) : " " + href;
        useElement.setAttribute("xlink:href", newHref);
      }
    }
  }
  // Move the BP object so that the top, left sits exactly over the badge rectangle top, left
  // This is only called when the BP is small (about to expand or finished collapsing)
  function repositionBPOverBadge() {
    // Current badge rectangle in screen coordinates
    var newBadgeRect = helper.getRect(badgeElement), // Get the amount of zoom being applied to the badge
    appliedZoom = getAppliedBPZoom(), badgeComputedStyle = window.getComputedStyle(badgeElement), // Adjust for padding
    paddingLeft = getPadding("Left"), paddingTop = getPadding("Top"), isToolbarBadge = state.get("isToolbarBadge");
    function getPadding(property) {
      return parseFloat(badgeComputedStyle["padding" + property]) * appliedZoom;
    }
    // Used for setting the bpContainer left, top, width, and height
    function setBPProperty(prop) {
      var styles = {};
      styles[prop] = badgeRect[prop] / appliedZoom + "px";
      inlineStyle.set(bpElement, styles);
    }
    // If the badge is currently dimensionless, use the cached badge dimensions
    if (rectHasNoArea(newBadgeRect)) {
      // We saved the badge rect when it was a child of the documentElement, so we multiply by the current zoom
      newBadgeRect.height = badgeGeometry.cachedRect.height * appliedZoom;
      newBadgeRect.width = badgeGeometry.cachedRect.width * appliedZoom;
    }
    if (currentBPParent === BADGE_PARENT) {
      // Not a toolbar badge and in body (inside of #sitecues-badge)
      // It's already inside of the #sitecues-badge, which is in the right place on the page,
      // and we only need transform translate to move it from there for padding and vertical offset.
      // By being a child of #sitecues-badge, it will automatically be positioned within that.
      newBadgeRect.left = 0;
      newBadgeRect.top = 0;
    }
    // Adjust for top whitespace in SVG badge (it's there because it turns into an outline on expansion)
    if (!isToolbarBadge) {
      newBadgeRect.top -= BP_CONST.BADGE_VERTICAL_OFFSET;
    }
    badgeRect.left = newBadgeRect.left + paddingLeft;
    badgeRect.top = newBadgeRect.top + paddingTop;
    // A toolbar badge's size remains the same for the lifetime of the page, so we use the cached version of size in that case
    if (!badgeRect.width || !isToolbarBadge) {
      badgeRect.width = newBadgeRect.width - paddingLeft - getPadding("Right");
      badgeRect.height = newBadgeRect.height - paddingTop - getPadding("Bottom");
    }
    // Set left and top for positioning.
    setBPProperty("width");
    setBPProperty("height");
    var styles = {
      top: 0,
      left: 0,
      transform: "translate(" + badgeRect.left / appliedZoom + "px," + badgeRect.top / appliedZoom + "px)"
    };
    inlineStyle.set(bpElement, styles);
  }
  // This makes the collapsed svg large enough so that even with
  // all the whitespace it stretches to cover the badge
  // So it should be the actual svg width / badge width
  function fitSVGtoBadgeRect() {
    var svgWidth = badgeRect.width * getRatioOfSVGToVisibleBadgeSize(badgeRect) / getAppliedBPZoom(), svgHeight = svgWidth / svgAspectRatio;
    inlineStyle.set(svgElement, {
      width: svgWidth + "px",
      height: svgHeight + "px"
    });
    // Do not animate the adjustment of the SVG to fit the size of the badge
    // We only animate large-scale size changes (badge->panel or panel->badge)
    disableAnimations();
    // Oh, IE (Edge, we know you're still really IE).
    fixUseElementsInIE();
  }
  function getWaveHeight() {
    return helper.getRectById(BP_CONST.WAVE_3_ID).height;
  }
  function getRatioOfSVGToVisibleBadgeSize(badgeRect) {
    // This is the ratio of the height allotted by the badge to the visible height.
    // It is what we need to multiply the SVG height by to get the final desired height.
    var ratioOfSVGToVisibleBadgeSize = state.get("ratioOfSVGToVisibleBadgeSize");
    if (ratioOfSVGToVisibleBadgeSize) {
      return ratioOfSVGToVisibleBadgeSize;
    }
    // First get the height for the third wave in the speech button, useful for measurements
    // It is the tallest and rightmost element
    var waveHeight, badgeRectWidth = badgeRect.width;
    // Set default height and width, because this normalizes cross browser inconsistencies
    // for SVG sizing.  Basically, if no height or width are set explicitly, then the viewBox
    // attribute effects the values of the boundingClient height and width of the SVG in Chrome,
    // but not IE.  Therefore, setting these values allows getRatioOfSVGToVisibleBadgeSize() to return the proper
    // values no matter the browser.
    inlineStyle.set(svgElement, {
      width: badgeRectWidth + "px",
      height: badgeRectWidth / svgAspectRatio + "px"
    });
    waveHeight = getWaveHeight() || badgeGeometry.waveHeight;
    ratioOfSVGToVisibleBadgeSize = badgeRect.height / waveHeight;
    state.set("ratioOfSVGToVisibleBadgeSize", ratioOfSVGToVisibleBadgeSize);
    return ratioOfSVGToVisibleBadgeSize;
  }
  function addClipRectStyleFix() {
    var badgeRect = helper.getRect(badgeElement), // A magic number to fix SC-2759.  Underlying issue is probably
    // rectangle calculations are a bit off...
    // TODO: Figure out why we are using magic numbers
    EXTRA_PIXELS_HEIGHT = 5, EXTRA_PIXELS_WIDTH = 10;
    if (rectHasNoArea(badgeRect)) {
      badgeRect = badgeGeometry.cachedRect;
    }
    inlineStyle(bpElement).clip = "rect(0," + (badgeRect.width + EXTRA_PIXELS_WIDTH) + "px," + (badgeRect.height + EXTRA_PIXELS_HEIGHT) + "px,0)";
  }
  function onZoomChange(zoomLevel) {
    currentZoom = zoomLevel;
  }
  function getAppliedBPZoom() {
    var isBPInBody = state.get("isPageBadge") && currentBPParent === BADGE_PARENT;
    return isBPInBody ? currentZoom : 1;
  }
  function executeWhileElementIsRendered(element, fn) {
    var isReparented, inlineTransform = inlineStyle(element).transform, nextSibling = element.nextSibling, parent = element.parentElement, rect = helper.getRect(element);
    // If the element isn't displayed, translate it out of the viewport and attach it to the document element.
    // This way we can be confident that an ancestor of the element isn't hiding it
    // This doesn't guarantee that a stylesheet isn't hiding the element, but it is sufficient for our current purposes
    if (rectHasNoArea(rect)) {
      inlineStyle(element).transform = "translate(-99999px,-99999px)";
      documentElement.appendChild(element);
      isReparented = true;
    }
    fn();
    if (isReparented) {
      inlineStyle(element).transform = inlineTransform;
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    }
  }
  // This method caches the dimensions of the badge, and if it is not currently visible
  // temporarily appends the badge directly to the document element to prevent its ancestors from hiding it.
  // This ensures that we have a fallback size reference when we need to reposition the bp SVG.
  // Otherwise, if we collapse the panel when the badge element has no area
  // the panel will disappear entirely!
  function initBadgeGeometry() {
    badgeElement.appendChild(bpElement);
    events.emit("bp/did-insert-bp-element");
    executeWhileElementIsRendered(badgeElement, function() {
      var cachedRect = helper.getRect(badgeElement), contentBox = Object.create(cachedRect), computedStyle = getComputedStyle(badgeElement), paddingTop = parseFloat(computedStyle.paddingTop), paddingBottom = parseFloat(computedStyle.paddingBottom), paddingRight = parseFloat(computedStyle.paddingRight), paddingLeft = parseFloat(computedStyle.paddingLeft);
      contentBox.width -= paddingLeft + paddingRight;
      contentBox.height -= paddingTop + paddingBottom;
      inlineStyle.set(bpElement, {
        width: contentBox.width,
        height: contentBox.height
      });
      inlineStyle.set(svgElement, {
        width: contentBox.width + "px",
        height: contentBox.width / svgAspectRatio + "px"
      });
      badgeGeometry = {
        cachedRect: cachedRect,
        waveHeight: getWaveHeight()
      };
    });
  }
  function rectHasNoArea(rect) {
    return !rect.width || !rect.height;
  }
  /**
   * [init initializes the placement of the bpElement, svgElement, and badgeElement]
   * @param  {[DOM element]} badge       [Either placeholder or badge we create with ID 'sitecues-badge']
   * @param  {[DOM element]} bpContainer [SVG container <div> with ID 'scp-bp-container']
   * @param  {[DOM element]} svg         [SVG with ID 'scp-svg']
   */
  function init(badge, bpContainer, svg) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    SHOULD_FIX_USE_ELEMENTS = platform.browser.isMS && platform.os.majorVersion >= 10;
    // Compute the aspect ratio (the width:height ratio required for the <svg>)
    var viewBoxRect = svg.viewBox.baseVal;
    // Set module scoped variables.
    badgeElement = badge;
    bpElement = bpContainer;
    svgElement = svg;
    svgAspectRatio = viewBoxRect.width / viewBoxRect.height;
    //Store initial badge dimensions and SVG scale while we know they're available
    initBadgeGeometry();
    // Initially, BP must always be contained by #sitecues-badge
    switchToBadgeParent();
    // For some reason, without this fix elements around the badge
    // do not get mouse events because the sizing of something is off.
    // See SC-2759.
    addClipRectStyleFix();
    // Listen for change events for page badges
    if (state.get("isPageBadge")) {
      // Page badges must switch back and forth dynamically
      events.on("bp/will-expand", switchToHtmlParent);
      events.on("bp/did-shrink", switchToBadgeParent);
      events.on("zoom", onZoomChange);
    } else {
      window.addEventListener("resize", repositionBPOverBadge);
    }
  }
  return {
    init: init
  };
});

/**
 * Expand or contract the BP
 */
sitecues.define("run/bp/view/size-animation", [ "run/bp/model/state", "run/bp/constants", "run/bp/helper", "run/platform", "run/events", "mini-core/native-global", "run/inline-style/inline-style" ], function(state, BP_CONST, helper, platform, events, nativeGlobal, inlineStyle) {
  "use strict";
  var // Linear looks better for collapse animation
  animationStartTime, animationId, panelScaleFromBadge, badgeScaleFromPanel, // The stable target badge width
  targetBadgeWidth, requestFrameFn = window.requestAnimationFrame, cancelFrameFn = window.cancelAnimationFrame, expandEasingFn = function(t) {
    return --t * t * t + 1;
  }, // https://gist.github.com/gre/1650294
  collapseEasingFn = function(t) {
    return t;
  }, MINIMUM_DISTANCE_FROM_EDGE = 20, MINIMUM_DISTANCE_FROM_EDGE_TOP = 2, // More forgiving on top side because of toolbar
  ZOOM_MIN = 1, ZOOM_RANGE = 2, // What we're transitioning from and to
  // Note that if you exit/enter the panel in the middle of animation you can
  // end up transitioning as badge -> badge, or panel -> panel
  currentlyTransitioningFrom = BP_CONST.BADGE_MODE, currentlyTransitioningTo = null, // Not currently transitioning to anything
  // The minimum amount we want to increase the badge size
  // when transitioning to the panel.  Basically, the panel
  // should be BP_CONST.IDEAL_PANEL_WIDTH by BP_CONST.IDEAL_PANEL_HEIGHT
  // or 1.2x the size of the badge.
  MINIMUM_PANEL_SIZE_INCREASE = 1.2, transformElementId = BP_CONST.BP_CONTAINER_ID, // Amount of zoom currently applied to the badge
  currentZoom = 1, // Convenience methods
  byId = helper.byId, getRect = helper.getRect;
  function isToolbarBadge() {
    return state.get("isToolbarBadge");
  }
  function getSvgElement() {
    return byId(BP_CONST.SVG_ID);
  }
  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }
  /**
   * getDifferenceObject builds and returns an object that represents the differences
   * between two objects.  The two objects must contain only numbers or objects as values
   * for properties.
   *
   * @example
   *
   *      PARAM 1               PARAM 2                 OUTPUT
   *
   *    {                     {                      {
   *      'a': 4,              'a': 10,                'a': 6,
   *      'b': {       =>       'b': {          =      'b': {
   *        'c': 1                'c': 5                 'c': 4
   *      }                     }                      }
   *    }                     }                      }
   *
   * @param  {Object} obj1 [Object whose values are numbers or objects]
   * @param  {Object} obj2 [Object whose values are numbers or objects]
   * @return {Object}      [Object whose values are numbers or objects]
   */
  function getDifferenceObject(obj1, obj2) {
    var obj1Prop, obj2Prop, result = {};
    for (var prop in obj1) {
      if (obj1.hasOwnProperty(prop)) {
        obj1Prop = obj1[prop];
        obj2Prop = obj2[prop];
        if ("number" === typeof obj1Prop) {
          result[prop] = obj2Prop - obj1Prop;
        } else {
          result[prop] = getDifferenceObject(obj1Prop, obj2Prop);
        }
      }
    }
    return result;
  }
  /**
   * getPossibleOutlineRects returns the visible panel rectangle to be.  This is useful in our
   * calculation for determining where the panel should be animated to when expanding.
   * The actual containers of the UI (and even the UI to some degree) are much larger
   * than what the appearance suggests.
   * @param  {number} targetDimensions The target width and height for the SVG_ID element.
   * @return {Object}           The bounding client rect of the MAIN_OUTLINE_ID element after
   *                            panel expansion.
   */
  function getPossibleOutlineRects(targetDimensions) {
    var possibleOutlineRects, currentSVGWidth = helper.getRectById(BP_CONST.SVG_ID).width, targetSVGWidth = targetDimensions.width, increaseFactor = targetSVGWidth / currentSVGWidth, currentOutlineRect = helper.getRectById(BP_CONST.MAIN_OUTLINE_ID), remainingTime = 1 - state.get("currentMode");
    if (isToolbarBadge()) {
      // Centered toolbar gets centered expansion treatment
      possibleOutlineRects = {
        center: getScaledRect(currentOutlineRect, .68 * remainingTime, 0, increaseFactor)
      };
    } else {
      possibleOutlineRects = {
        "25%0%": getScaledRect(currentOutlineRect, .25 * remainingTime, 0, increaseFactor),
        topLeft: getScaledRect(currentOutlineRect, 0, 0, increaseFactor),
        "75%0%": getScaledRect(currentOutlineRect, .75 * remainingTime, 0, increaseFactor),
        topRight: getScaledRect(currentOutlineRect, 1, 0, increaseFactor),
        botRight: getScaledRect(currentOutlineRect, 0, 1, increaseFactor),
        botLeft: getScaledRect(currentOutlineRect, 1, 1, increaseFactor)
      };
    }
    return possibleOutlineRects;
  }
  /**
   * getScaledRect scales a rectangle from an origin
   * @param  {Object} rect    Rectangle
   * @param  {number} originX  0 - 1
   * @param  {number} originY  0 - 1
   * @param  {number} scale    How much we scale the rectangle
   * @return {Object}         Rectangle
   */
  function getScaledRect(rect, originX, originY, scale) {
    var scaledWidth = rect.width * scale, scaledHeight = rect.height * scale, resultRect = {};
    resultRect.left = rect.left - scaledWidth * originX / 2;
    resultRect.top = rect.top - scaledHeight * originY / 2;
    resultRect.width = scaledWidth;
    resultRect.height = scaledHeight;
    resultRect.right = resultRect.left + scaledWidth;
    resultRect.bottom = resultRect.top + scaledHeight;
    return resultRect;
  }
  function isRectLeftOfViewport(rect) {
    return rect.left < MINIMUM_DISTANCE_FROM_EDGE;
  }
  function isRectRightOfViewport(rect) {
    return rect.right > window.innerWidth - MINIMUM_DISTANCE_FROM_EDGE;
  }
  function isRectAboveViewport(rect) {
    return rect.top < MINIMUM_DISTANCE_FROM_EDGE_TOP;
  }
  function isRectBelowViewport(rect) {
    return rect.bottom > window.innerHeight - MINIMUM_DISTANCE_FROM_EDGE;
  }
  /**
   * [isRectOutsideViewport determines if the provided rectangle will be outside the viewport]
   * @param  {[Object]} rect [Bounding Client Rectangle]
   * @return {[Boolean]}     [True if rect is outside viewport]
   */
  function isRectOutsideViewport(rect) {
    return isRectLeftOfViewport(rect) || isRectRightOfViewport(rect) || isRectAboveViewport(rect) || isRectBelowViewport(rect);
  }
  /**
   * [moveRectIntoViewport returns a rectangle that is guarenteed to be within the viewport]
   * @param  {Object} rect [Rectangle]
   * @return {Object}      [Rectangle]
   */
  function moveRectIntoViewport(rect) {
    if (isRectLeftOfViewport(rect)) {
      rect.left = MINIMUM_DISTANCE_FROM_EDGE;
    }
    if (isRectAboveViewport(rect)) {
      rect.top = MINIMUM_DISTANCE_FROM_EDGE;
    }
    if (isRectRightOfViewport(rect)) {
      rect.left = window.innerWidth - rect.width - 2 * MINIMUM_DISTANCE_FROM_EDGE;
    }
    if (isRectBelowViewport(rect)) {
      rect.top = window.innerHeight - rect.height - 2 * MINIMUM_DISTANCE_FROM_EDGE;
    }
    return rect;
  }
  /**
   * [getTargetSize computes and returns the size of whatever we are animating to]
   * @return {Object} [width and height]
   */
  function getTargetSize() {
    return state.isPanelRequested() ? getTargetPanelSize() : getTargetBadgeSize();
  }
  function getTargetPanelSize() {
    var svgRect = getRect(getSvgElement()), portionRemaining = 1 - state.get("currentMode"), newPanelWidth = Math.max(BP_CONST.IDEAL_PANEL_WIDTH, svgRect.width * MINIMUM_PANEL_SIZE_INCREASE * portionRemaining), newPanelHeight = newPanelWidth * BP_CONST.IDEAL_PANEL_HEIGHT / BP_CONST.IDEAL_PANEL_WIDTH;
    return {
      width: newPanelWidth,
      height: newPanelHeight
    };
  }
  function getAspectRatio() {
    var viewBoxRect = getSvgElement().viewBox.baseVal;
    return viewBoxRect.width / viewBoxRect.height;
  }
  function getAppliedBadgeZoom() {
    return state.get("isPageBadge") ? currentZoom : 1;
  }
  function getTargetBadgeSize() {
    if (!targetBadgeWidth || !state.get("isToolbarBadge")) {
      targetBadgeWidth = getTargetBadgeWidth(getAppliedBadgeZoom());
    }
    return {
      width: targetBadgeWidth,
      height: targetBadgeWidth / getAspectRatio()
    };
  }
  function getTargetBadgeWidth(zoomMult) {
    var badgeElement = getBadgeElement(), badgeRect = getRect(badgeElement), badgeComputedStyles = window.getComputedStyle(badgeElement), extraWidth = (parseFloat(badgeComputedStyles.paddingLeft) + parseFloat(badgeComputedStyles.paddingRight)) * zoomMult, badgeRectWidth = badgeRect.width - extraWidth;
    return badgeRectWidth * state.get("ratioOfSVGToVisibleBadgeSize");
  }
  /**
   * [getTargetBadgePosition computes and returns the desired badge position]
   * @return {Object} [top and left]
   */
  function getTargetBadgePosition() {
    var top, left, FUDGE_FACTOR = -.5, // This makes it  not jerk to a new spot, not sure why
    isPageBadge = state.get("isPageBadge"), badgeElement = getBadgeElement(), badgeComputedStyles = window.getComputedStyle(badgeElement), badgeRect = getRect(badgeElement), completedZoom = currentZoom, paddingTop = parseFloat(badgeComputedStyles.paddingTop), paddingLeft = parseFloat(badgeComputedStyles.paddingLeft);
    // Badge implemented by customer
    if (isPageBadge) {
      top = badgeRect.top + paddingTop * completedZoom - BP_CONST.BADGE_VERTICAL_OFFSET + FUDGE_FACTOR;
      left = badgeRect.left + paddingLeft * completedZoom + FUDGE_FACTOR;
    } else {
      top = paddingTop;
      left = paddingLeft;
    }
    return {
      top: Math.ceil(top),
      left: Math.ceil(left)
    };
  }
  /**
   * [getTargetPosition gets all desired outline boundlingClientRects based on the
   * current SVG_ID height and width.  It checks if any of them would be inside the
   * viewport.  The first that does is the boundingClientRect of the outlineRect.]
   * @param  {Object} targetDimensions [Height and width of the SVG_ID]
   * @return {Object}                  [top and left]
   */
  function getTargetPanelPosition() {
    var rect, currentRect, resultRect, targetSize = getTargetSize(), outlineRects = getPossibleOutlineRects(targetSize);
    if (isToolbarBadge()) {
      return outlineRects.center;
    }
    for (rect in outlineRects) {
      if (outlineRects.hasOwnProperty(rect)) {
        currentRect = outlineRects[rect];
        if (!isRectOutsideViewport(currentRect)) {
          resultRect = currentRect;
          if (true) {
            console.log("Panel position using origin: " + rect);
          }
          break;
        }
      }
    }
    // Must animate into the viewport.
    if (!resultRect) {
      if (true) {
        console.log("Panel position forced into viewport.");
      }
      resultRect = moveRectIntoViewport(outlineRects.topLeft);
    }
    return resultRect;
  }
  function getTargetTransformPosition() {
    if (state.isPanelRequested()) {
      return getTargetPanelPosition();
    }
    return getTargetBadgePosition();
  }
  /**
   * [getTargetSVGElementTransforms returns the transforms for multiple SVG elements]
   * @return {Object} [Keys are the IDs for SVG elements, Values are their transforms]
   */
  function getTargetSVGElementTransforms() {
    function copyObj(obj) {
      return nativeGlobal.JSON.parse(nativeGlobal.JSON.stringify(obj));
    }
    var isPanelRequested = state.isPanelRequested(), transforms = isPanelRequested ? BP_CONST.TRANSFORMS.PANEL : BP_CONST.TRANSFORMS.BADGE, sliderWidth = isPanelRequested ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH, percentage = (currentZoom - ZOOM_MIN) / ZOOM_RANGE, result = copyObj(transforms);
    result[BP_CONST.ZOOM_SLIDER_THUMB_ID].translateX += percentage * sliderWidth;
    return result;
  }
  // TODO just move this right into the SVG? Why not just have it in the markup
  function firstTimeRender() {
    var SLIDER_BAR_ID = BP_CONST.ZOOM_SLIDER_BAR_ID, SLIDER_THUMB_ID = BP_CONST.ZOOM_SLIDER_THUMB_ID, badgeTransforms = BP_CONST.TRANSFORMS.BADGE, TRANSFORM_STRING = "transform", TRANSLATE_STRING = "translate(", SCALE_STRING = "scale(", CLOSING_PAREN = ") ", sliderBarTransforms = badgeTransforms[SLIDER_BAR_ID], sliderBarTransform = sliderBarTransforms.translateX + CLOSING_PAREN + SCALE_STRING + sliderBarTransforms.scaleX + "," + sliderBarTransforms.scaleY, isRealSettings = state.get("isRealSettings"), sliderThumbTranslateX = isRealSettings ? badgeTransforms[SLIDER_THUMB_ID].translateX : BP_CONST.TRANSFORMS.FAKE_BADGE_TRANSLATEX;
    function getTranslateX(id) {
      return badgeTransforms[id].translateX;
    }
    function setTransform(id, value) {
      byId(id).setAttribute(TRANSFORM_STRING, TRANSLATE_STRING + (value || getTranslateX(id)) + CLOSING_PAREN);
    }
    setTransform(BP_CONST.SMALL_A_ID);
    setTransform(BP_CONST.LARGE_A_ID);
    setTransform(BP_CONST.SPEECH_ID);
    setTransform(BP_CONST.VERT_DIVIDER_ID);
    setTransform(SLIDER_BAR_ID, sliderBarTransform);
    setTransform(SLIDER_THUMB_ID, sliderThumbTranslateX);
  }
  function getCurrentTransformPosition() {
    var transformValues, translateLeft, translateTop, transform = inlineStyle(byId(transformElementId)).transform, position = {};
    if ("none" === transform || "" === transform) {
      position.left = 0;
      position.top = 0;
    } else {
      transformValues = transform.split(",");
      translateLeft = transformValues[0];
      translateTop = transformValues[1].split("scale")[0];
      position.left = helper.getNumberFromString(translateLeft);
      position.top = helper.getNumberFromString(translateTop);
    }
    return position;
  }
  function getCurrentSize() {
    var svgRect = getRect(getSvgElement());
    return {
      width: svgRect.width,
      height: svgRect.height
    };
  }
  function getCurrentScale() {
    var transformValues, transformStyle = inlineStyle(byId(transformElementId)).transform;
    if (transformStyle.indexOf("scale") !== -1) {
      transformValues = transformStyle.split("scale");
      return helper.getNumberFromString(transformValues[1]);
    }
    return 1;
  }
  function setSize(size, crispFactor) {
    inlineStyle.set(getSvgElement(), {
      // Height and Width
      width: size.width * crispFactor + "px",
      height: size.height * crispFactor + "px"
    });
  }
  function setTransform(left, top, transformScale) {
    inlineStyle(byId(transformElementId)).transform = "translate(" + left + "px , " + top + "px) scale(" + transformScale + ")";
  }
  /**
   * [setSVGElementTransforms sets the transform attribute of all SVG elements that need to
   * be translated and scaled]
   * @param {Object} startingSVGElementTransforms  [Object representing the translation and
   *                                                  scale of the SVG elements before any animation]
   * @param {Object} svgElementTransformDifference [Object representing the difference elements
   *                                                  must translate and scale]
   * @param {Float}  animationTime                 [0 - 1, the fraction the animation is at]
   */
  function setSVGElementTransforms(startingSVGElementTransforms, svgElementTransformDifference, animationTime) {
    var translateX, transformStr, scaleX, scaleY, currentStartingValue, currentDifferenceValue, id;
    for (id in startingSVGElementTransforms) {
      if (startingSVGElementTransforms.hasOwnProperty(id)) {
        currentStartingValue = startingSVGElementTransforms[id];
        currentDifferenceValue = svgElementTransformDifference[id];
        translateX = currentStartingValue.translateX + currentDifferenceValue.translateX * animationTime;
        transformStr = "translate(" + translateX + ")";
        if (currentStartingValue.scaleX) {
          scaleX = currentStartingValue.scaleX + currentDifferenceValue.scaleX * animationTime;
          scaleY = currentStartingValue.scaleY + currentDifferenceValue.scaleY * animationTime;
          transformStr += " scale(" + scaleX + "," + scaleY + ")";
        }
        byId(id).setAttribute("transform", transformStr);
      }
    }
  }
  //  https://equinox.atlassian.net/wiki/display/EN/BP2%3A+Implementation+Details
  function getTargetScale(endingSizeToStartingSizeRatio, crispFactor) {
    var scalingFunction, isPanelRequested = state.isPanelRequested(), BADGE_TO_PANEL = 0, TWEEN_TO_PANEL_CRISPED = 1, TWEEN_TO_PANEL_UNCRISPED = 2, PANEL_TO_BADGE = 3, TWEEN_TO_BADGE_CRISPED = 4, TWEEN_TO_BADGE_UNCRISPED = 5;
    if (isPanelRequested) {
      if (state.isBadge()) {
        scalingFunction = BADGE_TO_PANEL;
      } else {
        if (currentlyTransitioningFrom === BP_CONST.PANEL_MODE) {
          scalingFunction = TWEEN_TO_PANEL_UNCRISPED;
        }
        if (currentlyTransitioningFrom === BP_CONST.BADGE_MODE) {
          scalingFunction = TWEEN_TO_PANEL_CRISPED;
        }
      }
    } else {
      if (state.isPanel()) {
        scalingFunction = PANEL_TO_BADGE;
      } else {
        if (currentlyTransitioningFrom === BP_CONST.PANEL_MODE) {
          scalingFunction = TWEEN_TO_BADGE_UNCRISPED;
        }
        if (currentlyTransitioningFrom === BP_CONST.BADGE_MODE) {
          scalingFunction = TWEEN_TO_BADGE_CRISPED;
        }
      }
    }
    switch (scalingFunction) {
     case BADGE_TO_PANEL:
      panelScaleFromBadge = endingSizeToStartingSizeRatio / crispFactor;
      return panelScaleFromBadge;

     case TWEEN_TO_PANEL_CRISPED:
      return panelScaleFromBadge;

     case TWEEN_TO_PANEL_UNCRISPED:
      return 1;

     case PANEL_TO_BADGE:
      badgeScaleFromPanel = endingSizeToStartingSizeRatio;
      return badgeScaleFromPanel;

     case TWEEN_TO_BADGE_CRISPED:
      return getCurrentScale() * endingSizeToStartingSizeRatio;

     case TWEEN_TO_BADGE_UNCRISPED:
      return badgeScaleFromPanel;
    }
  }
  /**
   * performAnimation begins the animation. We must animate the following:
   *   - position
   *   - size
   *   - transforms (translateX and scale)
   */
  function performAnimation() {
    var startingScale, endingScale, scaleDifference, startCrispFactor, isPanelRequested = state.isPanelRequested(), startingPosition = getCurrentTransformPosition(), startingSize = getCurrentSize(), startingSVGElementTransforms = helper.getCurrentSVGElementTransforms(), endingPosition = getTargetTransformPosition(), endingSize = getTargetSize(), endingSVGElementTransforms = getTargetSVGElementTransforms(), positionDifference = getDifferenceObject(startingPosition, endingPosition), svgElementTransformDifference = getDifferenceObject(startingSVGElementTransforms, endingSVGElementTransforms), fullAnimationDuration = isPanelRequested ? BP_CONST.EXPAND_ANIMATION_DURATION_MS : BP_CONST.SHRINK_ANIMATION_DURATION_MS, percentEnlarged = state.get("currentMode"), percentAnimationComplete = isPanelRequested ? percentEnlarged : 1 - percentEnlarged;
    function animationTick() {
      var timeSinceFirstAnimationTick = Date.now() - animationStartTime, animationEasingFn = isPanelRequested ? expandEasingFn : collapseEasingFn, normalizedAnimationTime = Math.min(1, animationEasingFn(timeSinceFirstAnimationTick / fullAnimationDuration)), currentMode = isPanelRequested ? normalizedAnimationTime : 1 - normalizedAnimationTime, isAnimationEnding = 1 === normalizedAnimationTime;
      state.set("currentMode", currentMode);
      // Don't set width and height of <svg>, but instead use scale transform
      // To quote from http://www.html5rocks.com/en/tutorials/speed/high-performance-animations/
      // To achieve silky smooth animations you need to avoid work, and the best way to do that is to only change properties
      // that affect compositing -- transform and opacity.
      setTransform(startingPosition.left + positionDifference.left * normalizedAnimationTime, startingPosition.top + positionDifference.top * normalizedAnimationTime, startingScale + scaleDifference * normalizedAnimationTime);
      setSVGElementTransforms(startingSVGElementTransforms, svgElementTransformDifference, normalizedAnimationTime);
      if (isAnimationEnding) {
        // The final size must be IDEAL_PANEL_WIDTH x IDEAL_PANEL_HEIGHT
        // We use scale to make up the difference so that all HTML BP content is also sized properly (not just SVG)
        var currentSize = getCurrentSize(), ratioFromIdealSize = isPanelRequested ? BP_CONST.IDEAL_PANEL_WIDTH / currentSize.width : 1;
        setSize(getCurrentSize(), ratioFromIdealSize);
        setTransform(startingPosition.left + positionDifference.left * normalizedAnimationTime, startingPosition.top + positionDifference.top * normalizedAnimationTime, isPanelRequested ? 1 / ratioFromIdealSize : 1);
        endAnimation();
        return;
      }
      animationId = requestFrameFn(animationTick);
    }
    // Chrome is affected by the size of the source of what's scaled
    // It ends up being faster when the source is smaller, but less crisp
    function getStartCrispFactor() {
      if (!platform.browser.isChrome) {
        return 1;
      }
      return platform.isRetina() ? 1.5 : 3;
    }
    if (isPanelRequested && state.isBadge()) {
      startCrispFactor = getStartCrispFactor();
      setSize(startingSize, startCrispFactor);
      setTransform(startingPosition.left, startingPosition.top, 1 / startCrispFactor);
    }
    startingScale = getCurrentScale();
    endingScale = getTargetScale(endingSize.width / startingSize.width, startCrispFactor);
    scaleDifference = endingScale - startingScale;
    // The animation start time will be NOW minus how long the previous animation duration.
    animationStartTime = Date.now() - percentAnimationComplete * fullAnimationDuration;
    animationId = requestFrameFn(animationTick);
  }
  function endAnimation() {
    var isPanelRequested = state.isPanelRequested();
    cancelAnimation();
    getBadgeElement().setAttribute("aria-expanded", isPanelRequested);
    state.set("currentMode", currentlyTransitioningTo);
    currentlyTransitioningFrom = currentlyTransitioningTo;
    currentlyTransitioningTo = null;
    events.emit(isPanelRequested ? "bp/did-expand" : "bp/did-shrink");
    sitecues.require([ "run/bp/view/view" ], function(view) {
      view.update();
    });
  }
  function cancelAnimation() {
    cancelFrameFn(animationId);
  }
  function onZoomChange(zoomLevel) {
    currentZoom = zoomLevel;
  }
  function animate() {
    if (currentlyTransitioningTo === state.get("transitionTo")) {
      // Already where we've been requested to be
      // This prevents us from starting a new animation of the same kind when we've already started one
      return;
    }
    if (state.isExpanding() || state.isShrinking()) {
      // There is room to animate, not already at the size limit of where we're transitioning to
      performAnimation();
    }
    currentlyTransitioningTo = state.get("transitionTo");
  }
  function init() {
    firstTimeRender();
    events.on("bp/will-expand bp/will-shrink", cancelAnimation);
    events.on("zoom/begin", function() {
      animationStartTime = 0;
    });
    events.on("zoom", onZoomChange);
  }
  return {
    init: init,
    animate: animate
  };
});

sitecues.define("run/bp/view/panel/panel-classes", [ "run/bp/constants", "run/bp/model/state" ], function(BP_CONST, state) {
  /**
   *** Getters ***
   */
  // These classes add styles based on the current state of the panel
  function getViewClasses() {
    var classBuilder = "", isSecondary = state.isSecondaryPanelRequested();
    // Is or will be secondary panel
    // In enlarged view we always show the real settings.
    // See badge.js for more about real vs fake settings.
    classBuilder += " scp-realsettings";
    if (state.isPanel()) {
      // *** scp-panel ***
      // The panel is fully enlarged and ready to accept mouse input
      classBuilder += " " + BP_CONST.IS_PANEL;
    }
    // *** scp-want-panel ***
    // Sets larger panel sizes on everything.
    // It can take time to take effect because of the animation properties.
    classBuilder += " " + BP_CONST.WANT_PANEL + (isSecondary ? " scp-want-secondary" : " " + BP_CONST.MAIN_ID);
    if (state.get("isKeyboardMode")) {
      // *** scp-keyboard ***
      // Keyboard mode is enabled and therefore current focus outline must be visible
      classBuilder += " scp-keyboard";
    }
    classBuilder += " scp-classic-" + state.get("isClassicMode");
    return classBuilder + getSecondaryPanelClasses();
  }
  /*
   A feature panel is a special panel that is triggered from the secondary panel. It can be one of four things right now:
   Settings
   Tips
   Feedback
   About

   These can only be shown when the panel is large.
   */
  // TODO Ideally this belongs in the bp-secondary/ folder only if isSecondaryPanel, but since require() is async it wouldn't really be worth it
  function getSecondaryPanelClasses() {
    var panelName = state.getSecondaryPanelName(), className = " scp-panel-" + panelName;
    if (state.get("isSecondaryPanel")) {
      className += " scp-is-secondary";
      if (state.get("isFeedbackSent")) {
        className += " scp-feedback-sent";
      }
    }
    if (state.get("isSecondaryExpanding")) {
      className += " scp-secondary-expanding";
    }
    return className;
  }
  return {
    getViewClasses: getViewClasses
  };
});

/**
 * Badge, toolbar and panel base view
 */
sitecues.define("run/bp/view/badge/badge-classes", [ "run/bp/constants", "run/bp/model/state" ], function(BP_CONST, state) {
  /**
   *** Public ***
   */
  function getPaletteClass() {
    var paletteKey = state.get("paletteKey"), paletteName = BP_CONST.PALETTE_NAME_MAP[paletteKey || "normal"];
    return " scp-palette" + paletteName;
  }
  function getViewClasses() {
    var classBuilder = BP_CONST.WANT_BADGE;
    if (state.isBadge()) {
      classBuilder += " " + BP_CONST.IS_BADGE;
    }
    if (void 0 || state.get("isRealSettings")) {
      // *** scp-realsettings ***
      // Show the real settings for the badge (not the fake ones)
      // Why it's used:
      // The initial badge is easier-to-see, more attractive and more inviting when speech is on and zoom is
      // somewhere in the middle. Therefore the initial badge uses fake settings.
      // However, once the user has ever expanded the badge or used sitecues we show the real settings.
      classBuilder += " scp-realsettings";
    }
    return classBuilder;
  }
  return {
    getViewClasses: getViewClasses,
    getPaletteClass: getPaletteClass
  };
});

/*
 * Allow listening to changes in browser location that occur via history APIc
 */
sitecues.define("run/history-change-events", [ "mini-core/native-global" ], function(nativeGlobal) {
  "use strict";
  var listeners, origPath;
  function getPath() {
    return document.location.pathname;
  }
  function trigger() {
    var index = 0, newPath = getPath(), numListeners = listeners.length;
    for (index; index < numListeners; index++) {
      listeners[index](origPath, newPath);
    }
    origPath = newPath;
  }
  function triggerIfPathChanged() {
    var currPath = getPath();
    if (origPath !== currPath) {
      trigger();
    }
  }
  function onClick() {
    nativeGlobal.setTimeout(triggerIfPathChanged, 0);
  }
  function on(fn) {
    if (!listeners) {
      listeners = [];
      origPath = getPath();
      // The popstate event is fired when the user uses the browser's back/forward command
      // Unfortunately this is not fired when the user clicks on a link that causes a JS-based history change
      // via the history API
      window.addEventListener("popstate", trigger);
      // Listening to click and then checking for the a location change
      // allows us to notice history changes via pushState()
      // See http://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate
      // The click event is also fired for links triggered via Enter key
      // We must to click via capturing listener in case page cancels
      window.addEventListener("click", onClick, true);
    }
    listeners.push(fn);
  }
  function off(fn) {
    var index = listeners.indexOf(fn);
    if (index >= 0) {
      listeners = listeners.splice(index, 1);
    }
  }
  return {
    on: on,
    off: off
  };
});

/**
 * Badge, toolbar and panel base view
 */
sitecues.define("run/bp/view/view", [ "run/bp/constants", "run/bp/helper", "run/bp/view/svg", "run/bp/view/badge/placement", "run/bp/model/state", "run/conf/preferences", "run/bp/view/size-animation", "run/locale", "run/conf/site", "run/bp/view/panel/panel-classes", "run/bp/view/badge/badge-classes", "run/events", "run/history-change-events", "run/inline-style/inline-style" ], /*jshint -W072 */
//Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
function(BP_CONST, helper, bpSVG, placement, state, pref, sizeAnimation, locale, site, panelClasses, badgeClasses, events, historyChange, inlineStyle) {
  /*jshint +W072 */
  "use strict";
  var bpContainer, badgeElement, svgElement, byId = helper.byId;
  /*
   *** Private ***
   */
  function getBpContainerElement() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  // The bpContainer lives just inside the badge placeholder, contains all the visible BP content, and can change size
  function createBpContainer() {
    // Create the svg container
    var bpContainerElem = document.createElement("sc");
    // Set attributes
    helper.setAttributes(bpContainerElem, BP_CONST.PANEL_CONTAINER_ATTRS);
    bpContainerElem.innerHTML = bpSVG();
    return bpContainerElem;
  }
  // Can get SVG element whether currently attached to document or not
  function getSVGElement(bpContainer) {
    // Don't use helper.byId() because the element isn't inserted in DOM yet.
    return bpContainer.querySelector("#" + BP_CONST.SVG_ID);
  }
  // Update accessibility attributes
  function updateAria(isPanel) {
    // Let the user know that the button is expandable
    badgeElement.setAttribute("aria-expanded", isPanel);
    // Hide the inner contents of the button when it's just a button
    getBpContainerElement().setAttribute("aria-hidden", !isPanel);
  }
  // If the settings are not undefined it means sitecues has been turned on before
  function hasSitecuesEverBeenOn() {
    return pref.has("zoom") || pref.has("ttsOn");
  }
  // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
  // The badge label will be absolutely positioned offscreen in order to not affect layout
  function addLabel(badgeOrToolbarElement) {
    var badgeLabelElement = document.createElement("sc");
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);
    inlineStyle.set(badgeLabelElement, {
      position: "absolute",
      left: "-9999px"
    });
    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }
  /**
   *** Public ***
   */
  // Rerender the panel with the current model (state).
  // isNewPanel is true when a new view is shown within the panel (different widgets are present)
  function update(isNewSubpanel) {
    // Get the view classes that will create the desired appearance
    var isOrWillBePanel = state.isPanelRequested(), classes = isOrWillBePanel ? panelClasses.getViewClasses() : badgeClasses.getViewClasses();
    // This will cause the CSS to update
    bpContainer.setAttribute("class", classes);
    if (!isOrWillBePanel) {
      updateBadgePalette();
    }
    // If we are expanding or contracting, aria-expanded is true (enables CSS and communicates with screen readers)
    updateAria(isOrWillBePanel);
    // Animate to new size (only if new state requires a different size)
    sizeAnimation.animate();
    // Fire new panel event if appropriate
    if (isNewSubpanel) {
      events.emit("bp/did-open-subpanel");
    }
  }
  function updateBadgePalette() {
    var currentBadgeClassAttr = badgeElement.getAttribute("class") || "", newBadgeClassAttr = currentBadgeClassAttr.replace(/scp-palette-[a-z]+/, "") + " " + badgeClasses.getPaletteClass();
    badgeElement.setAttribute("class", newBadgeClassAttr);
  }
  // Location of page has changed via history API.
  // We must update our hashes so that they are not pointing to the wrong place,
  // otherwise the badge/panel will show up empty (SC-3797)
  function updateSvgHashes(oldPath, newPath) {
    function updateAttribute(element, attribute) {
      var oldValue = element.getAttribute(attribute), newValue = oldValue.replace(oldPath + "#", newPath + "#");
      element.setAttribute(attribute, newValue);
    }
    function updateElements(selector, attribute) {
      var elements = svgElement.querySelectorAll(selector), index = elements.length;
      while (index--) {
        updateAttribute(elements[index], attribute);
      }
    }
    updateElements("use", "xlink:href");
    updateElements("a", "href");
    updateElements("[filter]", "filter");
  }
  // This function augments the badge placement element, which is passed in.
  // This is an element that will have <svg> and other markup inserted inside of it.
  //
  // It binds the permanent event handlers. It positions the elements so they appear directly over
  // the websites placeholder.  It sets the SVG height and width so that it visually covers the
  // placeholder/badgeElement.  It binds event handlers to append the BPContainer to <html> or
  // the badgeElement (switching parent).
  function init(badgePlacementElem) {
    // Create the container and insert the SVG
    badgeElement = badgePlacementElem;
    bpContainer = createBpContainer();
    svgElement = getSVGElement(bpContainer);
    historyChange.on(updateSvgHashes);
    // Real settings or fake initial settings?
    if (true) {
      // Use fake settings if undefined -- user never used sitecues before.
      // This will be turned off once user interacts with sitecues.
      state.set("isRealSettings", site.get("alwaysRealSettings") || hasSitecuesEverBeenOn());
    }
    // Set attributes
    helper.setAttributes(badgeElement, BP_CONST.BADGE_ATTRS);
    // Label it
    addLabel(badgeElement);
    // Append the container to the badgeElement and fit to the space available
    placement.init(badgeElement, bpContainer, svgElement);
    // Get size animations ready so that the badge can gracefully grow into a panel
    sizeAnimation.init();
    // Set badge classes. Render the badge. Render slider.
    update();
  }
  return {
    init: init,
    update: update
  };
});

/*
 * Replacement for addEventListener that by default
 * - uses passive events
 * - uses capturing events
 * Supports options object, with the following options:
 * {
 *   passive: boolean,   (default is true, in contrast to addEventListener)
 *   capture: boolean    (default is true, in contrast to addEventListener)
 * }
 */
sitecues.define("run/dom-events", [], function() {
  var isPassiveSupported = false;
  function getThirdParam(opts) {
    opts = opts || {};
    var isCapturing = false !== opts.capture, isPassive = false !== opts.passive;
    if (isPassiveSupported) {
      return {
        capture: isCapturing,
        passive: isPassive
      };
    }
    return isCapturing;
  }
  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, getThirdParam(opts));
  }
  function off(target, type, fn, opts) {
    target.removeEventListener(type, fn, getThirdParam(opts));
  }
  function init() {
    try {
      var opts = Object.defineProperty({}, "passive", {
        get: function() {
          isPassiveSupported = true;
        }
      });
      window.addEventListener("test", null, opts);
    } catch (e) {}
  }
  return {
    on: on,
    // Note: use { passive: false } if you ever need to cancel the event!
    off: off,
    init: init
  };
});

/*
BP Controller
 */
sitecues.define("run/bp/controller/expand-controller", [ "run/bp/constants", "run/bp/model/state", "run/bp/helper", "run/metric/metric", "run/ab-test/ab-test", "run/conf/preferences", "run/conf/site", "run/bp/view/view", "run/events", "run/dom-events", "mini-core/native-global" ], function(BP_CONST, state, helper, metric, abTest, pref, site, view, events, domEvents, nativeGlobal) {
  "use strict";
  // How long we wait before expanding BP
  var hoverIfNoMoveTimer, // If mouse stays still inside badge, open
  hoverIfStayInsideTimer, // If mouse stays inside badge pr toolbar, open
  isInitialized, sensitivity, // We ignore the first mouse move when a window becomes active, otherwise badge opens
  // if the mouse happens to be over the badge/toolbar
  doIgnoreNextMouseMove = true, DEFAULT_SENSITIVITY = 1;
  /* How much more or less sensitive is the badge than usual, e.g. 1.5 = 50% more sensitive */
  function getBadgeElement() {
    return helper.byId(BP_CONST.BADGE_ID);
  }
  function isInBadgeArea(evt, badgeRect) {
    return evt.clientX >= badgeRect.left && evt.clientX <= badgeRect.right && evt.clientY >= badgeRect.top && evt.clientY <= badgeRect.bottom;
  }
  function getVisibleBadgeRect() {
    return helper.getRect(helper.byId(BP_CONST.MOUSEOVER_TARGET));
  }
  // When window is newly activated, ignore the automatic first mousemove that is generated
  // that may happen to be over the badge/toolbar. Require that the user intentionally moves to the toolbar.
  function onWindowFocus() {
    doIgnoreNextMouseMove = true;
  }
  // Logic to determine whether we should begin to expand panel
  function onMouseMove(evt) {
    if (doIgnoreNextMouseMove) {
      doIgnoreNextMouseMove = false;
      return;
    }
    if (state.isExpanding()) {
      return;
    }
    cancelHoverIfNoMoveTimer();
    // Is the event related to the visible contents of the badge?
    // (as opposed to the hidden areas around the badge)
    var badgeRect = getVisibleBadgeRect();
    if (!isInBadgeArea(evt, badgeRect)) {
      return;
    }
    // Check if shrinking and need to reopen
    if (state.isShrinking()) {
      changeModeToPanel();
      // User changed their mind -- reverse course and reopen
      return;
    }
    // Set timers to open the badge if the user stays inside of it
    // We use two timers so that if the user actually stops, the badge opens faster (more responsive feeling)
    // Hover if no move -- start a new timer every time mouse moves
    hoverIfNoMoveTimer = nativeGlobal.setTimeout(changeModeToPanel, getHoverDelayNoMove());
    if (!hoverIfStayInsideTimer) {
      hoverIfStayInsideTimer = nativeGlobal.setTimeout(changeModeToPanel, getHoverDelayStayInside());
    }
  }
  function getSensitivity() {
    return sensitivity;
  }
  function getHoverDelayNoMove() {
    return BP_CONST.HOVER_DELAY_NOMOVE_BADGE / sensitivity;
  }
  function getHoverDelayStayInside() {
    // First interaction is most sensitive
    if (abTest.get("extraSensitiveBadgeNewUser") && isFirstInteraction()) {
      return BP_CONST.HOVER_DELAY_STAY_INSIDE_FIRST_TIME;
    }
    // Second or later interaction
    return BP_CONST.HOVER_DELAY_STAY_INSIDE_BADGE / sensitivity;
  }
  function isFirstInteraction() {
    // Once the badge opens the first time, we show the actual zoom and tts states
    // Before that, we don't show real settings (we show a zoom of about 2 and TTS on)
    return !state.get("isRealSettings");
  }
  /*
   Show panel according to settings.
   */
  function expandPanel(isOpenedWithHover) {
    if (state.isPanel()) {
      return;
    }
    var isFirstBadgeUse = isFirstInteraction();
    state.set("isFirstBadgeUse", isFirstBadgeUse);
    // Will stay true throught this use of the badge
    setPanelExpandedState(isOpenedWithHover);
    events.emit("bp/will-expand");
    new metric.BadgeHover({
      isFirstBadgeUse: isFirstBadgeUse
    }).send();
    view.update();
  }
  function ensureFutureRealSettings() {
    // Use real settings on next page load
    // Save zoom level so that Sitecues does not see this as a first time user
    if (!pref.has("zoom")) {
      pref.set("zoom", 1);
    }
  }
  function setPanelExpandedState(isOpenedWithHover) {
    state.set("isSecondaryExpanded", false);
    // Only main panel expanded, not secondary
    state.set("wasMouseInPanel", isOpenedWithHover);
    state.set("transitionTo", BP_CONST.PANEL_MODE);
    state.turnOnRealSettings();
    ensureFutureRealSettings();
  }
  function changeModeToPanel(isOpenedWithKeyboard) {
    cancelHoverTimers();
    if (!state.get("isShrinkingFromKeyboard")) {
      // Don't re-expand while trying to close via Escape key
      expandPanel(!isOpenedWithKeyboard);
    }
  }
  function cancelHoverTimers() {
    cancelHoverIfNoMoveTimer();
    cancelHoverIfStayInsideTimer();
  }
  function cancelHoverIfNoMoveTimer() {
    clearTimeout(hoverIfNoMoveTimer);
    hoverIfNoMoveTimer = 0;
  }
  function cancelHoverIfStayInsideTimer() {
    clearTimeout(hoverIfStayInsideTimer);
    hoverIfStayInsideTimer = 0;
  }
  // When a click happens on the badge, it can be from one of two things:
  // - A fake click event pushed by a screen reader when the user presses Enter -- in this case we should expand the panel
  // - An actual click in the whitespace around the panel (before they moused over the visible area) -- we should ignore these
  //   so that clicks around the panel don't accidentally open it.
  function clickToOpenPanel(evt) {
    if (state.isBadge()) {
      var badgeElem = helper.byId(BP_CONST.BADGE_ID), isBadgeFocused = document.activeElement === badgeElem, target = evt.target, isChildClicked = target && target.parentNode === badgeElem, badgeRect = getVisibleBadgeRect(), isClickInVisibleBadgeRect = isInBadgeArea(evt, badgeRect);
      if (!isClickInVisibleBadgeRect) {
        // Click is in the toolbar, outside of visible badge
        // Focus should be in the document, otherwise HLB won't work (confusing)
        if (isBadgeFocused) {
          document.body.focus();
        }
        // Don't focus badge
        evt.preventDefault();
        return false;
      } else {
        if (isBadgeFocused || isChildClicked) {
          // Screen reader pseudo-click
          // Click is in visible area and badge has focus --
          // * or *
          // Click in invisible child -- only screen readers can do this -- NVDA does it
          // Go ahead and open the panel in focus/keyboard mode
          // First ensure it has focus (it didn't in second case)
          badgeElem.focus();
          // Opened with click means opened with keyboard in screen reader
          nativeGlobal.setTimeout(function() {
            changeModeToPanel(true);
            // Set screen reader flag for the life of this page view
            state.set("isOpenedWithScreenReader", true);
          }, 0);
        } else {
          // Actual click -- not fake screen reader click, so no need to focus
          changeModeToPanel();
        }
      }
    }
  }
  function processBadgeActivationKeys(evt) {
    var ENTER = 13, SPACE = 32;
    if (state.isBadge() && (evt.keyCode === ENTER || evt.keyCode === SPACE)) {
      evt.preventDefault();
      changeModeToPanel(true);
    }
  }
  function didExpand() {
    sitecues.require([ "bp-expanded/bp-expanded" ], function(bpExpanded) {
      bpExpanded.init();
    });
  }
  function didZoom() {
    sitecues.require([ "bp-expanded/controller/slider-controller" ], function(sliderController) {
      state.turnOnRealSettings();
      sliderController.init();
      view.update();
    });
  }
  function didChangeSpeech(isOn) {
    sitecues.require([ "bp-expanded/view/tts-button" ], function(ttsButton) {
      // Update the TTS button view on any speech state change
      state.turnOnRealSettings();
      ttsButton.init();
      ttsButton.updateTTSStateView(isOn);
      view.update();
    });
  }
  /*
   Private functions.
   */
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      sensitivity = site.get("badgeSensitivity") || DEFAULT_SENSITIVITY;
      var badgeElement = getBadgeElement();
      domEvents.on(badgeElement, "keydown", processBadgeActivationKeys, {
        passive: false
      });
      domEvents.on(badgeElement, "mousedown", clickToOpenPanel, {
        passive: false
      });
      domEvents.on(badgeElement, "mousemove", onMouseMove);
      domEvents.on(badgeElement, "mouseleave", cancelHoverTimers);
      domEvents.on(window, "focus", onWindowFocus);
      events.on("bp/did-expand", didExpand);
      events.on("zoom", didZoom);
      events.on("speech/did-change", didChangeSpeech);
      // Turn on TTS button if the setting is on
      if (pref.get("ttsOn")) {
        didChangeSpeech(true);
      }
      if (true) {
        sitecues.toggleStickyPanel = function() {
          var isSticky = !state.get("isStickyPanel");
          state.set("isStickyPanel", isSticky);
          return isSticky;
        };
      }
    }
  }
  return {
    init: init,
    getSensitivity: getSensitivity,
    expandPanel: expandPanel
  };
});

// Badge palette code.
// Not included in the extension since that always uses the same colors in the toolbar.
sitecues.define("run/bp/view/palette", [ "run/bp/model/state", "run/conf/site", "run/bp/constants", "Promise" ], function(state, site, BP_CONST, Promise) {
  // badgeFileName is optional, and used in the case of old <img> badge placeholders.
  // In that case the filename defines which palette to use, e.g. sitecues-badge-reverse-blue.png
  // If no badge file name, check the site preferences for a palette
  // Otherwise use the default palette.
  // Custom palettes are a different story ...
  function getSimplePaletteType(badgeFileName) {
    var paletteName = badgeFileName || site.get("palette") || "", paletteMap = BP_CONST.PALETTE_NAME_MAP, fullNames = Object.keys(paletteMap), index = 0;
    // Check for a string because site.get('palette')
    // returns an Object if a custom palette is used.
    if ("string" === typeof paletteName) {
      for (;index < fullNames.length; index++) {
        var fullName = fullNames[index];
        if (paletteName.indexOf(fullName) >= 0) {
          return fullNames[index];
        }
      }
    }
    return "";
  }
  // initialize the badge color palette support
  // @badgeFileName is optional -- provided when the badge is from an <img>, which clues us into the palette
  function init(badgeFileName) {
    var paletteKey = getSimplePaletteType(badgeFileName);
    // Handle 'adaptive' palette
    if (paletteKey === BP_CONST.PALETTE_NAME_ADAPTIVE) {
      if (void 0 || state.get("isToolbarBadge")) {
        // Toolbars don't adapt to theme changes -- 'adaptive' is not valid in tat case
        paletteKey = BP_CONST.PALETTE_NAME_NORMAL;
      } else {
        return new Promise(function(resolve) {
          sitecues.require([ "bp-adaptive/bp-adaptive" ], function(bpAdaptive) {
            state.set("defaultPaletteKey", BP_CONST.PALETTE_NAME_NORMAL);
            bpAdaptive.initAdaptivePalette();
            resolve();
          });
        });
      }
    }
    state.set("defaultPaletteKey", paletteKey);
    state.set("paletteKey", paletteKey);
    return Promise.resolve();
  }
  return {
    init: init
  };
});

/**
 * Page badge view. Not included in the extension since that always uses the toolbar.
 */
sitecues.define("run/bp/view/badge/page-badge", [ "run/bp/view/view", "run/bp/view/palette", "Promise", "run/inline-style/inline-style" ], function(baseView, palette, Promise, inlineStyle) {
  "use strict";
  // Make sure the badge has non-static positioning to make it easy to place
  // the position: absolute sc-bp-container inside of it
  function ensureNonStaticPositioning(badge) {
    var existingPositionCss = getComputedStyle(badge).position;
    if ("static" === existingPositionCss) {
      inlineStyle(badge).position = "relative";
    }
  }
  function initBadgeView(badge, badgeFileName) {
    return palette.init(badgeFileName).then(function() {
      ensureNonStaticPositioning(badge);
      baseView.init(badge);
    });
  }
  function init(origBadgeElem) {
    return new Promise(function(resolve) {
      if ("img" !== origBadgeElem.localName) {
        // Normal placeholder badge
        return resolve({
          badgeElem: origBadgeElem
        });
      }
      // If a customer uses the <img> placeholder...
      sitecues.require([ "bp-img-placeholder/bp-img-placeholder" ], function(imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(origBadgeElem);
        resolve({
          badgeElem: newBadge,
          origSrc: origBadgeElem.src
        });
      });
    }).then(function(badgeInfo) {
      return initBadgeView(badgeInfo.badgeElem, badgeInfo.origSrc);
    });
  }
  return {
    init: init
  };
});

// Structure of BP:
// bp.js -- initialization and common logic for badge and panel
// badge.js -- logic specific to badge
// panel.js -- logic specific to panel
// placement.js -- logic related to placing the BP in the right place in the DOM and on the screen
//
// sitecues events used by BP
//
// Information:
// bp/did-create   -- BP inserted in page
// bp/did-complete -- BP ready for input
// bp/will-expand  -- BP is about to expand
// bp/did-expand   -- BP has finished expanding
// bp/will-shrink  -- BP is about to shrink
// bp/did-shrink   -- BP has finished shrinking
sitecues.define("run/bp/bp", [ "run/events", "run/bp/controller/expand-controller", "run/bp/model/state", "run/bp/helper", "run/bp/constants", "run/conf/site", "run/bp/model/classic-mode", "run/bp/view/badge/page-badge", "Promise", "mini-core/native-global", "run/inline-style/inline-style" ], function(events, expandController, state, helper, BP_CONST, site, classicMode, pageBadgeView, Promise, nativeGlobal, inlineStyle) {
  "use strict";
  /*
   *** Public methods ***
   */
  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var docElem, badgeView, hasFixedBody = false, byId = helper.byId;
  /**
   *** Start point ***
   */
  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }
  function isToolbarUIRequested() {
    return "toolbar" === site.get("uiMode");
  }
  /**
   * initializeBPFeature is the main initialization function that is run when the
   * BP feature is ready to be enabled.  It creates the necessary elements,
   * renders them, and emits events for the rest of the application too
   */
  function initBPView() {
    if (true && !isToolbarUIRequested()) {
      var badgePlaceholderElem = getBadgeElement();
      // Get site's in-page placeholder badge or create our own
      if (badgePlaceholderElem) {
        badgeView = pageBadgeView;
        return pageBadgeView.init(badgePlaceholderElem);
      }
    }
    // Toolbar mode requested or no badge (toolbar is default)
    // Note: cannot use require().then because we use AMD clean in the extension
    return new Promise(function(resolve) {
      sitecues.require([ "bp-toolbar-badge/bp-toolbar-badge" ], function(toolbarView) {
        badgeView = toolbarView;
        badgeView.init().then(resolve);
      });
    });
  }
  function initBPFeature() {
    return initBPView().then(function() {
      expandController.init();
      events.on("zoom/begin", function() {
        if (!hasFixedBody) {
          fixDimensionsOfBody();
          hasFixedBody = true;
        }
      });
      return getViewInfo();
    });
  }
  /*
                         ********  INITIALIZATION **********

      - Immediately initialize if the any of the following are true:
        - If the document is interactive and the customer does not use the <img>
        - If the document is complete
      - If we can't immediately initialize, add the appropriate event listener
        - If the customer uses the <img>, attach a load event listener to the <img>
        - If the customer does NOT use the <img>, attach a readystatechange event listener to the document.
  */
  function isDocReady() {
    if (!document.body) {
      // Pages that contain parsing errors may not have a body --
      // don't load Sitecues unless there is a body
      return false;
    }
    var readyState = document.readyState;
    return "complete" === readyState || "interactive" === readyState;
  }
  // Init BP if the badge is ready and the document is 'interactive'|'complete'
  // Return true if BP initialized
  function docReady() {
    if (isDocReady()) {
      return Promise.resolve();
    }
    return new Promise(function(resolve) {
      function onReadyStateChange() {
        if (isDocReady()) {
          resolve();
          document.removeEventListener("readystatechange", onReadyStateChange);
        }
      }
      document.addEventListener("readystatechange", onReadyStateChange);
    });
  }
  function badgeReady() {
    // If badge is already in the DOM, we can already init
    var badgeElem = getBadgeElement();
    if (badgeElem) {
      return Promise.resolve();
    }
    // No badge yet -- wait until doc is interactive or complete
    return docReady();
  }
  // The toolbar gets to init earlier than a site-provided badge
  // It's safe to init as soon as the <body> is available
  function bodyReady() {
    var CHECK_BODY_INTERVAL = 250;
    return new Promise(function(resolve) {
      function checkBody() {
        if (document.body) {
          resolve();
        } else {
          nativeGlobal.setTimeout(checkBody, CHECK_BODY_INTERVAL);
        }
      }
      checkBody();
    });
  }
  // Classic mode is where the ? shows up instead of the down pointing arrow
  // TODO remove one day, we hope
  function initClassicMode() {
    state.set("isClassicMode", classicMode());
    sitecues.toggleClassicMode = function() {
      state.set("isClassicMode", !state.get("isClassicMode"));
    };
  }
  //It's possible that the transformations we apply to the body disrupt absolutely positioned elements
  //contained by the initial containing block. This is a hacky solution to the problem, but it is much cheaper
  //than analyzing the page and manually repositioning absolute elements.
  //TODO: Check client site CNIB's absolutely positioned elements if this gets changed
  function fixDimensionsOfBody() {
    var body = document.body, bodyStyle = getComputedStyle(body), docStyle = getComputedStyle(docElem), botMargin = parseFloat(bodyStyle.marginBottom), topMargin = bodyStyle.marginTop, leftMargin = bodyStyle.marginLeft, rightMargin = bodyStyle.marginRight;
    if (parseFloat(bodyStyle.height) < parseFloat(docStyle.height)) {
      inlineStyle.override(body, {
        height: docStyle.height
      });
    }
    if (0 !== botMargin) {
      //marginBottom doesn't override bottom margins that are set with the shorthand 'margin' style,
      //so we get all the margins and set our own inline shorthand margin
      inlineStyle.override(body, {
        margin: topMargin + " " + rightMargin + " 0px " + leftMargin
      });
    }
  }
  function getViewInfo() {
    var badgeElem = document.getElementById("sitecues-badge"), rect = badgeElem ? badgeElem.getBoundingClientRect() : {};
    if (!rect.height) {
      return {
        isBadgeHidden: true
      };
    }
    var isToolbar = state.get("isToolbarBadge"), hasCustomPalette = "object" === typeof site.get("palette"), viewInfo = {
      badgePalette: hasCustomPalette ? "custom" : state.get("defaultPaletteKey") || BP_CONST.PALETTE_NAME_NORMAL
    };
    if (isToolbar) {
      viewInfo.isToolbar = true;
    } else {
      viewInfo.badgeHeight = Math.round(rect.height);
      viewInfo.badgeTop = Math.round(rect.top - window.pageYOffset);
      viewInfo.badgeLeft = Math.round(rect.left - window.pageXOffset);
    }
    viewInfo.sensitivity = expandController.getSensitivity();
    return viewInfo;
  }
  /**
   * init()
   *
   * @return Promise
   *
   * Looks for the badge element, or wait for it to load, and insert and display the BP based on it's position.
   *    When this is called:
   * There are many cases for badge markup or config, and we also can't be sure exactly when this function is called
   * in the lifetime of the document.
   *
   * Conditions required before we create and display BP -- any of the following:
   *   1. site.get('uiMode') = 'toolbar' AND document.body is available
   *   2. Page readyState is 'interactive' AND badge element is found (also loaded if it was an <img>)
   *   3. Page readyState is 'complete' (will use a toolbar if no badge element is found at this point)
   *
   * BP config/setup cases:
   *   1. Toolbar config (e.g. sitecues everywhere) -- allowed to load early
   *   2. Empty badge placeholder <div id="sitecues-badge"> (normal in-page customer case)
   *   3. Badge image present <img id="sitecues-badge"> (old-school, these are deprecated)
   *     a) Already loaded
   *     b) Need to wait for <img>
   *   4. Missing badge and document not complete -- need to wait to see if badge shows up
   *   5. Missing badge and document complete (causes toolbar)
   */
  function init() {
    docElem = document.documentElement;
    // Get whether the BP will run in classic mode (still needed for MS Edge)
    initClassicMode();
    // ---- Look for toolbar config ----
    if (isToolbarUIRequested()) {
      // Case 1: toolbar config -- no need to wait for badge placeholder
      if (true) {
        console.log("Early initialization of toolbar.");
      }
      return bodyReady().then(initBPFeature);
    }
    // ---- Look for badge, fall back to toolbar if necessary ----
    // Page may still be loading -- check if the badge is available
    return badgeReady().then(initBPFeature);
  }
  return {
    init: init
  };
});

/**
 * Track status of modifier keys
 * For now, we are only using this to track the Ctrl key (to help understand wheel events)
 */
sitecues.define("run/modifier-key-state", [ "run/dom-events", "run/constants" ], function(domEvents, constants) {
  var isCtrlKeyDownNow = false, CTRL_KEY_CODE = constants.KEY_CODE.CTRL;
  function onKeyDown(event) {
    if (event.keyCode === CTRL_KEY_CODE) {
      isCtrlKeyDownNow = true;
    }
  }
  function onKeyUp(event) {
    if (event.keyCode === CTRL_KEY_CODE) {
      isCtrlKeyDownNow = false;
    }
  }
  function isCtrlKeyDown() {
    return isCtrlKeyDownNow;
  }
  function init() {
    domEvents.on(window, "keydown", onKeyDown);
    domEvents.on(window, "keyup", onKeyUp);
  }
  return {
    init: init,
    isCtrlKeyDown: isCtrlKeyDown
  };
});

sitecues.define("run/shake/constants", [], function() {
  return {
    SESSION_SHAKE_COUNT_KEY: "-sc-mouseshake-count",
    MOUSE_POSITIONS_ARRAY_SIZE: 12,
    // Number of mouse positions stored
    MIN_DIR_SWITCHES_FOR_SHAKE: 2,
    // How many vertical/horizontal direction switches required to be considered a shake
    MIN_SHAKE_DIST: 3,
    // Minimum pixels moved to begin a mouse shake
    MAX_DIST_NON_SHAKE_AXIS: 30,
    // Max pixels moved on axis not being shaken (vertical/horizontal)
    MIN_SHAKE_VIGOR_DECREASE: 4,
    // Minimum speed of shake decrease
    MAX_SHAKE_VIGOR_DECREASE: 32,
    // Maximum speed of shake decrease
    SHAKE_DECREASE_MULTIPLIER: 6,
    // Magic value for shake decreases based on mouse speed
    SHAKE_INCREASE_POWER: 1.2,
    // Magic value for exponential shake increase based on mouse speed
    MAX_SHAKE_VIGOR_INCREASE: 100,
    // Max shake increase (out of total possible MAX_SHAKE_VIGOR)
    MAX_SHAKE_VIGOR: 400,
    // Max total shake vigor
    MIN_MOVE_SIZE_FOR_SHAKE: 3,
    // Pixel-size for irrelevant mousemove
    MS_BETWEEN_SHAKE_EVENTS: 50,
    // ms between internal shake events
    MAX_TIME_BETWEEN_MOVES: 100,
    // if more ms than this since last mouse move, reset
    METRIC_THRESHOLD_SHAKE_PERCENT_RESET: 10,
    // Shake percent must dip below this amount before firing again
    METRIC_THRESHOLD_SHAKE_PERCENT_FIRE: 50
  };
});

/**
 * Mouseshake feature
 * - Value of shake vigor at any one time is 0-MAX_SHAKE_VIGOR (internal value)
 * - Value of shake vigor percent is 0-100 (external value -- used to communicate with other modules)
 * - For now, only fires a metric so that we can measure the potential usefulness
 * - Ideas for use -- make mouse larger, make badge glow temporarily
 */
sitecues.define("run/shake/shake", [ "run/metric/metric", // 'run/events',
"run/dom-events", "run/shake/constants", "run/platform", "mini-core/native-global" ], function(metric, // events,
domEvents, constants, platform, nativeGlobal) {
  "use strict";
  var lastShakeTimeout, mousePositionsQueue = [], lastShakeVigor = 0, lastShakeVigorPercent = 0, canFireMetricAgain = true, MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE, MOUSE_POSITIONS_ARRAY_SIZE = constants.MOUSE_POSITIONS_ARRAY_SIZE, MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST, MAX_DIST_NON_SHAKE_AXIS = constants.MAX_DIST_NON_SHAKE_AXIS, MAX_SHAKE_VIGOR = constants.MAX_SHAKE_VIGOR, MIN_SHAKE_VIGOR_DECREASE = constants.MIN_SHAKE_VIGOR_DECREASE, MAX_SHAKE_VIGOR_DECREASE = constants.MAX_SHAKE_VIGOR_DECREASE, SHAKE_DECREASE_MULTIPLIER = constants.SHAKE_DECREASE_MULTIPLIER, SHAKE_INCREASE_POWER = constants.SHAKE_INCREASE_POWER, MAX_SHAKE_VIGOR_INCREASE = constants.MAX_SHAKE_VIGOR_INCREASE, MIN_MOVE_SIZE_FOR_SHAKE = constants.MIN_MOVE_SIZE_FOR_SHAKE, MAX_TIME_BETWEEN_MOVES = constants.MAX_TIME_BETWEEN_MOVES, METRIC_THRESHOLD_SHAKE_PERCENT_FIRE = constants.METRIC_THRESHOLD_SHAKE_PERCENT_FIRE, METRIC_THRESHOLD_SHAKE_PERCENT_RESET = constants.METRIC_THRESHOLD_SHAKE_PERCENT_RESET;
  function reset() {
    mousePositionsQueue = [];
    clearTimeout(lastShakeTimeout);
    if (lastShakeVigor > 0) {
      lastShakeVigor = lastShakeVigorPercent = 0;
      fireNotifications(0);
    }
  }
  function onMouseLeave(evt) {
    if (evt.target === document.documentElement) {
      reset();
    }
  }
  function getMovementSummary() {
    var prevMove = mousePositionsQueue[0], xDir = mousePositionsQueue[1].x > prevMove.x ? 1 : -1, yDir = mousePositionsQueue[1].y > prevMove.y ? 1 : -1, totalDist = 0, xDirectionSwitches = 0, yDirectionSwitches = 0, distanceRequirement = lastShakeVigor ? 0 : MIN_SHAKE_DIST, minX = prevMove.x, minY = prevMove.y, maxX = minX, maxY = minY;
    mousePositionsQueue.slice(1).forEach(function(currMove) {
      var x = currMove.x, y = currMove.y, xDelta = x - prevMove.x, xDist = Math.abs(xDelta), yDelta = y - prevMove.y, yDist = Math.abs(yDelta), xDirection = xDist < distanceRequirement ? 0 : xDist / xDelta, yDirection = yDist < distanceRequirement ? 0 : yDist / yDelta;
      totalDist += xDist + yDist;
      // Calculate horizontal direction switches
      if (xDirection === -xDir) {
        ++xDirectionSwitches;
        xDir = xDirection;
      }
      // Calculate vertical direction switches
      if (yDirection === -yDir) {
        ++yDirectionSwitches;
        yDir = yDirection;
      }
      if (x < minX) {
        minX = x;
      } else {
        if (x > maxX) {
          maxX = x;
        }
      }
      if (y < minY) {
        minY = y;
      } else {
        if (y > maxY) {
          maxY = y;
        }
      }
      prevMove = currMove;
    });
    return {
      xSwitches: xDirectionSwitches,
      ySwitches: yDirectionSwitches,
      totalXDist: maxX - minX,
      totalYDist: maxY - minY
    };
  }
  function getShakeVigorIncrease() {
    var isShakeX, isShakeY, movementSummary = getMovementSummary(mousePositionsQueue);
    function isMouseShake() {
      if (lastShakeVigor) {
        // Was already shaking -- make it easy to keep it going
        return movementSummary.xSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE || movementSummary.ySwitches >= MIN_DIR_SWITCHES_FOR_SHAKE;
      }
      // Possible new shake -- be more stringent
      isShakeX = movementSummary.xSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE;
      isShakeY = movementSummary.ySwitches >= MIN_DIR_SWITCHES_FOR_SHAKE;
      if (isShakeX && isShakeY) {
        // Horizontal AND vertical shake => is a shake
        return true;
      }
      if (isShakeX) {
        // Horizontal only -- require small total vertical movement
        return movementSummary.totalYDist < MAX_DIST_NON_SHAKE_AXIS;
      }
      if (isShakeY) {
        // Vertical only -- require small total horizontal movement
        return movementSummary.totalXDist < MAX_DIST_NON_SHAKE_AXIS;
      }
    }
    if (isMouseShake()) {
      var distanceFactor = Math.max(movementSummary.totalXDist, movementSummary.totalYDist);
      return Math.min(Math.pow(distanceFactor, SHAKE_INCREASE_POWER), MAX_SHAKE_VIGOR_INCREASE);
    }
  }
  function getShakeVigorDecrease(lastDistance) {
    // Shake factor shrinks back down as mouse moves (faster as speed increases)
    var unboundedResult = lastDistance * SHAKE_DECREASE_MULTIPLIER, boundedResult = Math.max(Math.min(unboundedResult, MAX_SHAKE_VIGOR_DECREASE), MIN_SHAKE_VIGOR_DECREASE);
    return boundedResult;
  }
  function processMouseMove(x, y, t) {
    // Add move to queue
    var currMove = {
      x: x,
      y: y,
      t: t
    }, numMoves = mousePositionsQueue.length, lastMove = numMoves > 0 && mousePositionsQueue[numMoves - 1];
    mousePositionsQueue.push(currMove);
    var shakeVigorPercent, lastDistance = lastMove ? getDistanceBetweenMoves(currMove, lastMove) : 0, shakeVigor = getShakeVigor(numMoves, lastDistance);
    if (shakeVigor !== lastShakeVigor) {
      shakeVigorPercent = Math.round(100 * shakeVigor / MAX_SHAKE_VIGOR);
      fireNotifications(shakeVigorPercent);
      lastShakeVigor = shakeVigor;
      lastShakeVigorPercent = shakeVigorPercent;
    }
    // Shift oldest item out of moves queue
    if (lastMove && numMoves > MOUSE_POSITIONS_ARRAY_SIZE) {
      mousePositionsQueue.shift();
    }
  }
  function onMouseMove(evt) {
    var x = evt.screenX, y = evt.screenY, t = evt.timeStamp, numMoves = mousePositionsQueue.length, lastMove = numMoves > 0 && mousePositionsQueue[numMoves - 1];
    if (lastMove && t - lastMove.t > MAX_TIME_BETWEEN_MOVES) {
      mousePositionsQueue = [];
    }
    nativeGlobal.setTimeout(function() {
      processMouseMove(x, y, t);
    }, 0);
  }
  // Rough approximation for faster math
  function getDistanceBetweenMoves(move1, move2) {
    return Math.abs(move2.x - move1.x) + Math.abs(move2.y - move1.y);
  }
  function getShakeVigor(numMoves, lastDistance) {
    var shakeVigor, isShakeIncreaseAllowed = numMoves >= MOUSE_POSITIONS_ARRAY_SIZE && (lastShakeVigor || lastDistance >= MIN_MOVE_SIZE_FOR_SHAKE), shakeVigorIncrease = isShakeIncreaseAllowed && getShakeVigorIncrease(), shakeVigorDelta = shakeVigorIncrease || -getShakeVigorDecrease(lastDistance);
    shakeVigor = lastShakeVigor + shakeVigorDelta;
    if (shakeVigor < 0) {
      return 0;
    } else {
      if (shakeVigor > MAX_SHAKE_VIGOR) {
        return MAX_SHAKE_VIGOR;
      }
    }
    return Math.floor(shakeVigor);
  }
  function fireNotifications(shakeVigorPercent) {
    // Internal change event
    // TODO add back once we use it
    // if (!lastShakeTimeout) {
    // lastShakeTimeout = nativeGlobal.setTimeout(function() {
    //   fireShakeVigorChange(shakeVigorPercent);
    // }, constants.MS_BETWEEN_SHAKE_EVENTS);
    // }
    // Debugging
    // Too noisy for main build
    // if (SC_DEV) {
    //   console.log('Shake value: ' + shakeVigorPercent);
    // }
    // Metric
    // Fires only when it goes over the threshold, to limit network requests
    if (shakeVigorPercent >= METRIC_THRESHOLD_SHAKE_PERCENT_FIRE && canFireMetricAgain) {
      canFireMetricAgain = false;
      nativeGlobal.setTimeout(function() {
        fireShakeVigorMetric(shakeVigorPercent);
      }, 0);
    } else {
      if (shakeVigorPercent < METRIC_THRESHOLD_SHAKE_PERCENT_RESET) {
        canFireMetricAgain = true;
      }
    }
  }
  function fireShakeVigorMetric(shakeVigorPercent) {
    var details = {
      vigor: shakeVigorPercent,
      sessionCount: incrementSessionShakes()
    };
    if (true) {
      console.log("Mouse shake metric fired: ", JSON.stringify(details));
    }
    new metric.MouseShake(details).send();
  }
  function incrementSessionShakes() {
    if (!platform.isStorageUnsupported) {
      var numShakes = sessionStorage.getItem(constants.SESSION_SHAKE_COUNT_KEY) || 0;
      ++numShakes;
      sessionStorage.setItem(constants.SESSION_SHAKE_COUNT_KEY, numShakes);
      return numShakes;
    }
  }
  // Add back once we use it
  // function fireShakeVigorChange(shakeVigorPercent) {
  //   lastShakeTimeout = 0;
  //   events.emit('run/mouseshake', shakeVigorPercent);
  // }
  function init() {
    domEvents.on(document, "mousemove", onMouseMove);
    domEvents.on(document, "mouseleave", onMouseLeave);
  }
  return {
    init: init
  };
});

/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and page-visited metric
 */
sitecues.define("run/run", [ "Promise", "run/conf/preferences", "run/conf/id", "run/conf/site", "run/conf/urls", "run/exports", "run/locale", "run/metric/metric", "run/platform", "run/bp/bp", "run/constants", "run/events", "run/dom-events", "run/modifier-key-state", "run/ab-test/ab-test", "run/shake/shake", "run/inline-style/inline-style" ], /*jshint -W072 */
//Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
function(Promise, pref, id, site, urls, exports, locale, metric, platform, bp, CORE_CONST, events, domEvents, modifierKeyState, abTest, shake, inlineStyle) {
  /*jshint +W072 */
  "use strict";
  var areZoomEnhancementsInitialized, isZoomInitialized, isSpeechInitialized, isZoomOn, isSpeechOn, isKeyReleased, isKeyHandlingInitialized, wasSitecuesEverOn, startSitecuesLoad, isSitecuesOn = false, // Keys that can init sitecues
  INIT_CODES = CORE_CONST.INIT_CODES, // Enums for sitecues loading states
  state = CORE_CONST.READY_STATE;
  function performInitialLoadZoom(initialZoom) {
    sitecues.require([ "page/zoom/zoom" ], function(zoomMod) {
      zoomMod.init();
      zoomMod.performInitialLoadZoom(initialZoom);
    });
  }
  function initZoomEnhancingFeatures() {
    sitecues.require([ "page/hpan/hpan", "page/positioner/positioner", "page/focus/focus", "page/cursor/cursor" ], function(hpan, positioner, focus, cursor) {
      hpan.init();
      positioner.initFromZoom();
      focus.init();
      cursor.init();
    });
  }
  function initSpeech() {
    sitecues.require([ "audio/audio", "page/page" ], function(page, audio) {
      page.init();
      audio.init();
    });
  }
  function initSitecuesOn() {
    sitecues.require([ "page/page", "page/highlight/highlight", "page/keys/keys", "page/highlight/move-keys" ], function(page, highlight, keys, moveKeys) {
      page.init();
      highlight.init();
      keys.init();
      moveKeys.init();
    });
  }
  function initThemes() {
    sitecues.require([ "page/page", "theme/theme", "page/focus/focus", "page/keys/keys" ], function(page, theme, focus, keys) {
      page.init();
      theme.init();
      focus.init();
      keys.init();
    });
  }
  function initMouse() {
    sitecues.require([ "page/page", "page/cursor/cursor", "page/keys/keys" ], function(page, cursor, keys) {
      page.init();
      cursor.init();
      keys.init();
    });
  }
  // Init features that require *either* zoom or speech to be on
  function onFeatureSettingChange() {
    var isOn = isZoomOn || isSpeechOn;
    if (isOn !== isSitecuesOn) {
      isSitecuesOn = isOn;
      events.emit("sitecues/did-toggle", isSitecuesOn);
    }
    if (isOn && !wasSitecuesEverOn) {
      initSitecuesOn();
      wasSitecuesEverOn = true;
    }
  }
  function onZoomChange(zoomLevel) {
    isZoomOn = zoomLevel > 1;
    onFeatureSettingChange();
    if (isZoomOn && !areZoomEnhancementsInitialized) {
      initZoomEnhancingFeatures();
      areZoomEnhancementsInitialized = true;
    }
  }
  function firePageVisitedMetric() {
    var initDetails = {
      startSitecuesLoad: startSitecuesLoad,
      startSitecuesInteractive: getCurrentTime(),
      // TODO These should be moved into the page-visited metric that moved to the minicore
      // startPageLoad: performance.timing.responseEnd - fetchStartTime,
      // startPageInteractive: performance.timing.domInteractive - fetchStartTime,
      nativeZoom: platform.nativeZoom,
      isRetina: platform.isRetina(),
      isStorageUnsupported: platform.isStorageUnsupported
    };
    new metric.SitecuesReady(initDetails).send();
  }
  function getCurrentTime() {
    return Math.floor(performance.now());
  }
  function onSitecuesReady() {
    firePageVisitedMetric();
    sitecues.readyState = state.COMPLETE;
    //Freeze readyState on load
    Object.defineProperty(sitecues, "readyState", {
      writable: false
    });
    if ("function" === typeof sitecues.onReady) {
      sitecues.onReady.call(sitecues);
    }
    Object.defineProperty(sitecues, "readyState", {
      writable: false
    });
    // Do not allow reassignment, e.g. sitecues.readyState = 0;
    createPageCssHook();
  }
  // Page can make any special badge callouts visible when data-sitecues-active="desktop"
  function createPageCssHook() {
    document.documentElement.setAttribute("data-sitecues-active", "desktop");
  }
  // Initialize page feature listeners
  // This means: if a setting or event changes that requires some modules, we load and initialize the modules
  function initPageFeatureListeners() {
    // -- Zoom --
    // Previously saved values
    var initialZoom = pref.get("zoom");
    if (initialZoom > 1) {
      performInitialLoadZoom(initialZoom);
    }
    // Monitor any runtime changes
    events.on("zoom", onZoomChange);
    // -- Speech --
    pref.bindListener("ttsOn", function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChange();
      if (isOn && !isSpeechInitialized) {
        initSpeech();
        isSpeechInitialized = true;
      }
    });
    // -- Themes --
    if (platform.featureSupport.themes) {
      pref.bindListener("themeName", function(themeName) {
        if (themeName) {
          initThemes();
        }
      });
    }
    // -- Mouse --
    pref.bindListener("mouseSize", function(mouseSize) {
      if (mouseSize) {
        // If undefined we use the default as set by the zoom module
        initMouse();
      }
    });
    pref.bindListener("mouseHue", function(mouseHue) {
      if (mouseHue <= 1) {
        // if undefined || > 1, mouse hue is ignored, and we keep the default mouse hue
        initMouse();
      }
    });
    // -- Keys --
    // Init keys module if sitecues was off but key is pressed that might turn it on
    if (!isKeyHandlingInitialized) {
      // Keys are not be initialized, therefore,
      // we add our lightweight keyboard listener that only
      // checks for a few keys like  +, - or alt+'
      window.addEventListener("keydown", onPossibleTriggerKeyPress);
    }
    if (!isZoomInitialized) {
      window.addEventListener("wheel", onPossibleScreenPinch);
    }
    modifierKeyState.init();
    shake.init();
    onSitecuesReady();
  }
  function isInitializerKey(event) {
    var keyCode = event.keyCode;
    return INIT_CODES.indexOf(keyCode) >= 0;
  }
  // Check for keys that can trigger sitecues, such as cmd+, cmd-, alt+'
  function onPossibleTriggerKeyPress(event) {
    if (isInitializerKey(event)) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        // Don't allow default behavior of modified key, e.g. native zoom
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      isKeyReleased = false;
      window.addEventListener("keyup", onKeyUp);
      sitecues.require([ "page/keys/keys" ], function(keys) {
        keys.init(event, isKeyReleased);
      });
    }
  }
  // Ctrl + wheel events (screen pinch) can trigger sitecues
  function onPossibleScreenPinch(event) {
    if (event.ctrlKey) {
      // Don't allow default behavior of screen pinch, e.g. native zoom
      event.preventDefault();
      event.stopImmediatePropagation();
      sitecues.require([ "page/zoom/zoom" ], function(zoomMod) {
        // TODO IE11: TypeError: Unable to get property 'init' of undefined or null reference
        // {"eventId":"10e771ce-97a8-4d53-985a-c4912485032a","serverTs":1463756071982,"clientIp":"10.235.39.83","siteKey":"s-0000ee0c","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"5fd5d275-5204-4e45-af83-c134e3c7bce8","pageViewId":"ceb79818-a1bf-47ec-8b3e-6b3419796adc","siteId":"s-0000ee0c","userId":"6f90e948-9980-4e19-87e0-9ec50958db05","pageUrl":"https://www.eeoc.gov/eeoc/publications/ada-leave.cfm","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET CLR 1.1.4322; InfoPath.3; .NET4.0C; .NET4.0E; Tablet PC 2.0; rv:11.0) like Gecko","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1463756071497,"zoomLevel":1,"ttsState":false,"details":{"message":"Unable to get property 'init' of undefined or null reference","stack":"TypeError: Unable to get property 'init' of undefined or null reference\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:128:442)\n   at W (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:8:256)\n   at O (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:9:31)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:10:28)\n   at k (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:20:460)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:21:72)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:226)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:204)\n   at a (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:94)"}}}
        zoomMod.init(event);
      });
    }
  }
  function onKeyUp(event) {
    if (isInitializerKey(event)) {
      isKeyReleased = true;
    }
  }
  function onZoomInitialized() {
    isZoomInitialized = true;
    window.removeEventListener("wheel", onPossibleScreenPinch);
  }
  function onKeyHandlingInitialized() {
    isKeyHandlingInitialized = true;
    window.removeEventListener("keydown", onPossibleTriggerKeyPress);
    window.removeEventListener("keyup", onKeyUp);
  }
  function isOn() {
    return isSitecuesOn;
  }
  function init() {
    startSitecuesLoad = getCurrentTime();
    // When keyboard listening is ready
    events.on("keys/did-init", onKeyHandlingInitialized);
    events.on("zoom/ready", onZoomInitialized);
    // Set sitecues state flag to initializing
    sitecues.readyState = state.INITIALIZING;
    // Early synchronous initialization
    site.init();
    // Initialize configuration module
    urls.init();
    // Initialize API and services URLs
    exports.init(isOn);
    Promise.all([ pref.init(), id.init() ]).then(function() {
      // Synchronous initialization
      inlineStyle.init();
      platform.init();
      domEvents.init();
      abTest.init();
      metric.init();
    }).then(function() {
      return locale.init().then(bp.init).then(metric.initViewInfo).then(initPageFeatureListeners);
    });
  }
  return {
    isOn: isOn,
    init: init
  };
});

sitecues.define("run", function() {});

sitecues.require([ "run/errors", "run/run" ]);
//# sourceMappingURL=run.js.map