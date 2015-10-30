// Fix urls and localize strings in markup
define(['core/locale', 'core/platform'], function(locale, platform) {
  // The original base URL for the current page regardless of <base> tag
  function removeEnd(loc) {
    var locString = '' + loc; // Convert to string
    return locString.substring(0, locString.lastIndexOf('/'));
  }

  function removeHash(loc) {
    return loc.replace(/\#.*/, '');
  }

  function getBaseURI() {
    var link = document.createElement('a');
    link.href = '';
    return link.href;
  }

  function hasAlteredBaseURI() {
    return removeEnd(getBaseURI()) !== removeEnd(document.location.href);
  }

  // Relative URLs must be full URLS that <base> tag doesn't mess them up!
  // Without this fix, markup such as xlink:href="#foo" or filter="url(#foo)" will not work in Firefox
  // when the source document uses a <base> tag.
  function convertRelativeUrlsToAbsolute(text) {
    if (hasAlteredBaseURI() && !platform.browser.isIE9) {
      var MATCH_URLS = /(href="|url\()(?:#)/g,
        pageUrlMinusHash = removeHash(document.location.href);

      return text.replace(MATCH_URLS, function (totalMatch, attributeName) {
        return attributeName + pageUrlMinusHash + '#';
      });
    }

    return text;
  }
  return function(markup) {
    var withAllAbsoluteUrls = convertRelativeUrlsToAbsolute(markup),
      localized = locale.localizeStrings(withAllAbsoluteUrls);

    return localized;
  };
});
