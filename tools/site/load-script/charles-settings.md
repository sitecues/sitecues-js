#Charles Settings
=================

##Type
Body

##Where

[ ] Request
[x] Response


##Match

###Value
(</[Hh][Ee][Aa][Dd](>|\s))

###Options:
[x] Regex
[ ] Match Whole Value
[x] Case Sensitive

##Replace:

###Value
<script data-provider="sitecues-proxy" type="text/javascript" src="http://localhost:8000/tools/load-script/sitecues-load-script.js"></script> $1

###Options:
[x] Replace First
[ ] ReplaceAll