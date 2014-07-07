function doSomethingCool (a, b) {
  return a+b;
}

function doSomethingUnCool (youSuck) {
  var stupid = doSomethingCool(false, false);
  return 'nothing!';
}

exports.doSomethingCool = doSomethingCool;
exports.doSomethingUnCool = doSomethingUnCool;