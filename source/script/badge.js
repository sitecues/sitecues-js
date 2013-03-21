eqnx.def('badge', function(badge, callback){

    // use jquery, we can rid off this dependency
    // if we will start using vanilla js functions
    eqnx.use('jquery', 'ui', function($){

        // create badge element
        badge.panel = $('<div>')
            .attr('id', 'eqnx-badge') // set element id for proper styling
            .hover(function () {
                eqnx.emit('badge/hover', badge.element); // emit event about hover
            }, function(){
                eqnx.emit('badge/leave', badge.element); // emit event about leave
            })
            .click(function () {
                eqnx.emit('badge/click', badge.element); // emit event about badge click
            })
            .appendTo('html');

        badge.element = $('<img>')
            .attr('id', 'eqnx-badge-image')
            .attr('src', '//ai2.s3.amazonaws.com/assets/newlogo.png')
            .appendTo(badge.panel);

        // end
        callback();

    });

});