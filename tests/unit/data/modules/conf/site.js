exports.get = function(key) {
  var data = {
    siteId: '99',
    ttsAudioFormats: ['aac']
  };
  return data[key];
};

exports.getSiteId = function() {
  return '99';
}
