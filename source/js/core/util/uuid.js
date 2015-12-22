// Taken from here (free public license): https://gist.github.com/LeverOne/1308368
// jshint -W016
define([], function() {

  function getUUID() {
    var a, b;

    for (
      b = a = '';              // b - result , a - numeric variable
      a++ < 36;
      b += a * 51&52 ?         // if "a" is not 9 or 14 or 19 or 24
        (                      //  return a random number or 4
          a^15 ?               // if "a" is not 15
            8 ^ Math.random()* //   generate a random number from 0 to 15
            (a ^ 20 ? 16 : 4)  //   unless "a" is 20, in which case a random number from 8 to 11
          :
            4                  // otherwise 4
        ).toString(16)
      :
        '-'                    //  in other cases (if "a" is 9,14,19,24) insert "-"
    ) {}

    return b;
  }

  return getUUID;
});
