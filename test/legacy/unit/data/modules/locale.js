exports.getLang=function() {return document.documentElement.lang || 'en';};
exports.getAudioLocale=function() {return document.documentElement.lang || 'en-US';};
exports.getElementLang=function(elem) {return (elem && elem.getAttribute('lang')) || document.documentElement.lang || 'en-US';};
exports.getDocumentLang=function() { return document.documentElement.lang || 'en-US';};