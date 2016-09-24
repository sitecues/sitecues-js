const amdclean = require('amdclean');

console.log(amdclean.clean({
  filePath : './source/js/core/prereq/native-functions.js',
  wrap : {
    start : '\n',
    end : '\n'
  }
}));