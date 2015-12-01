// Fix urls and localize strings in markup
define(['core/locale', 'core/platform'], function(locale, platform) {
  function removeHash(loc) {
    return loc.replace(/\#.*/, '');
  }

  // Returns truthy value if there is a base tag
  function hasBaseTag() {
    return document.getElementsByTagName('base').length;
  }

  // Relative URLs must be full URLS that <base> tag doesn't mess them up!
  // Without this fix, markup such as xlink:href="#foo" or filter="url(#foo)" will not work in Firefox
  // when the source document uses a <base> tag.
  // Even if the <base> tag points to the default base, we still need to convert hashes, otherwise a page
  // such as http://wokiss.pl/szkolenia.html will have an invisible badge in some browsers.
  function convertRelativeUrlsToAbsolute(text) {
    if (hasBaseTag() && !platform.browser.isIE9) {
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
