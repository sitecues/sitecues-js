/**
 * This provides the default user agent style rules we care about -- e.g. cursor and colors
 * They have been gleaned from some of the *.css files at:
 * http://mxr.mozilla.org/mozilla-central/source/layout/style
 */
sitecues.def('ua-css', function (UA_CSS, callback) {

'use strict';
/*jshint multistr: true */

// The following system colors are converted to hex colors here to improve performance:
// button { color:ButtonText; border-color:ButtonFace; background-color:ButtonFace; }
// input:disabled, select:disabled {color:GrayText; background-color:ThreeDFace; }

UA_CSS.text =
'html{\n\
  cursor:default;\n\
}\n\
input,textarea,select,button,label[for]{\n\
  cursor:pointer;\n\
}\n\
body {\n\
    background-color:#fff;\n\
    color:#000;\n\
}\n\
select {\n\
  background-color:#fff;\n\
  color:#000;\n\
  border-color:#fff;\n\
}\n\
textarea,input,button{\n\
  color:#000;\n\
  border-color:#c0c0c0;\n\
  background-color:#fff;\n\
}\n\
input:disabled, select:disabled {\n\
  color:#7f7f7f !important;\n\
  background-color:#c0c0c0 !important;\n\
}\n\
blockquote[type="cite"] {\n\
  border-color:#00f;\n\
}\n\
mark {\n\
  background-color:#ffff00;\n\
  color:#000;\n\
}\n\
hr {\n\
  color:#808080;\n\
}\n\
img[usemap], object[usemap] {\n\
  color:#00f;\n\
}\n\
:link {\n\
  color:#00f;\n\
  cursor:pointer;\n\
}\n\
:visited {\n\
  color:#551a8b;\n\
}';

callback();
});
