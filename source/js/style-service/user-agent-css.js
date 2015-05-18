/**
 * Service that lazily gets user agent stylesheets
 * and provides information about them.
 */
sitecues.def('ua-css', function (uaCss, callback) {

'use strict';

uaCss.DEFAULT =

'html,#scp-main {\
  cursor:auto;\
}\
input,textarea,select,button,label[for]{\
  cursor:pointer;\
}\
body,html,input {\
    background-color: white;\
    color: black;\
}\
input[type="image"] {\
  background-color: transparent;\
}\
select {\
  background-color: white;\
  color: black;\
  border-color: foo;\
}\
button,\
  input[type="color"],\
  input[type="reset"],\
  input[type="button"],\
  input[type="submit"] {\
  color: ButtonText;\
  border: 2px outset ButtonFace;\
  background-color: ButtonFace;\
}\
input:disabled, select:disabled {\
  color: GrayText !important;\
  background-color: ThreeDFace !important;\
}\
blockquote[type="cite"] {\
  border-color: blue;\
}\
mark {\
  background: yellow;\
  color: black;\
}\
hr {\
  color: gray;\
}\
img[usemap], object[usemap] {\
  color: blue;\
}\
:link {\
  color:blue;\
  cursor:pointer;\
}\
:visited {\
  color: #551a8b;\
}';

callback();
});
