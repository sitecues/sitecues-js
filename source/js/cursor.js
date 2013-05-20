// make 'switch' module for choosing what cursor
// view to use with current setup
sitecues.def('cursor', function(cursor, callback){

	// use old 'element' cursor which using
	// absolutely positioned div on the page
	sitecues.use('cursor/element', callback);

});