// Fix urls and localize strings in markup
define(['core/locale', 'core/platform', 'bp/view/styles', 'core/conf/urls'], function(locale, platform, styles, urls) {
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

  // Sitecues URLs must be absolute.
  // For example, change /images/foo.png to http://js.sitecues.com/images/foo.png
  function convertSitecuesUrlsToAbsolute(text) {
    var MATCH_URLS = /(href="|url\()(\/.*)"/g;

    return text.replace(MATCH_URLS, function (totalMatch, attributeName, url) {
      return attributeName + urls.resolveSitecuesUrl(url);
    });
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
    var withCorrectSitecuesUrls = convertSitecuesUrlsToAbsolute(markup),
      withAllAbsoluteUrls = convertRelativeUrlsToAbsolute(withCorrectSitecuesUrls),
      localized = locale.localizeStrings(withAllAbsoluteUrls);

    return localized;
  };
});
