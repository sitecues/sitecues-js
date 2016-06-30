/*
 * Allow listening to changes in browser location that occur via history APIc
 */

define([], function () {
  var listeners,
    origPath;

  function getPath() {
    return document.location.pathname;
  }

  function trigger() {
    var index = 0,
      newPath = getPath(),
      numListeners = listeners.length;

    for (index; index < numListeners; index ++) {
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
    setTimeout(triggerIfPathChanged, 0);
  }

  function on(fn) {
    if (!listeners) {
      listeners = [];
      origPath = getPath();
      // The popstate event is fired when the user uses the browser's back/forward command
      // Unfortunately this is not fired when the user clicks on a link that causes a JS-based history change
      // via the history API
      window.addEventListener('popstate', trigger);
      // Listening to click and then checking for the a location change
      // allows us to notice history changes via pushState()
      // See http://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate
      // The click event is also fired for links triggered via Enter key
      // We must to click via capturing listener in case page cancels
      window.addEventListener('click', onClick, true);
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
    on   : on,
    off  : off
  };
});