/**
 * Service that lazily gets user agent stylesheets
 * and provides information about them.
 */
sitecues.def('ua-css', function (UA_CSS, callback) {

'use strict';

UA_CSS.text =
'html,#scp-main {\n\
  cursor:auto;\n\
}\n\
input,textarea,select,button,label[for]{\n\
  cursor:pointer;\n\
}\n\
body,html,input {\n\
    background-color: white;\n\
    color: black;\n\
}\n\
input[type="image"] {\n\
  background-color: transparent;\n\
}\n\
select {\n\
  background-color: white;\n\
  color: black;\n\
  border-color: foo;\n\
}\n\
button,\n\
  input[type="color"],\n\
  input[type="reset"],\n\
  input[type="button"],\n\
  input[type="submit"] {\n\
  color: ButtonText;\n\
  border: 2px outset ButtonFace;\n\
  background-color: ButtonFace;\n\
}\n\
input:disabled, select:disabled {\n\
  color: GrayText !important;\n\
  background-color: ThreeDFace !important;\n\
}\n\
blockquote[type="cite"] {\n\
  border-color: blue;\n\
}\n\
mark {\n\
  background: yellow;\n\
  color: black;\n\
}\n\
hr {\n\
  color: gray;\n\
}\n\
img[usemap], object[usemap] {\n\
  color: blue;\n\
}\n\
:link {\n\
  color:blue;\n\
  cursor:pointer;\n\
}\n\
:visited {\n\
  color: #551a8b;\n\
}';

callback();
});
