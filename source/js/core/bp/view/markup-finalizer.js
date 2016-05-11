// Fix urls and localize strings in markup
define(['core/locale'], function(locale) {
  function removeHash(loc) {
    return loc.replace(/\#.*/, '');
  }

  // Relative URLs must be full URLS that a different base doesn't mess them up!
  // Without this fix, markup such as xlink:href="#foo" or filter="url(#foo)" will not work in Firefox
  // or recent Chrome, when the source document uses a base.
  // Even if the base points to the default base, we still need to convert hashes, otherwise a page
  // such as http://wokiss.pl/szkolenia.html will have an invisible badge in some browsers.
  // Note: the base can be set via <base> tag or http header.
  function convertRelativeUrlsToAbsolute(text) {
    var MATCH_URLS = /(href="|url\()(?:#)/g,
      pageUrlMinusHash = removeHash(document.location.href);

    return text.replace(MATCH_URLS, function (totalMatch, attributeName) {
      return attributeName + pageUrlMinusHash + '#';
    });
  }

  return function(markup) {
    var withAllAbsoluteUrls = convertRelativeUrlsToAbsolute(markup),
      localized = locale.localizeStrings(withAllAbsoluteUrls);

    return localized;
  };
});
