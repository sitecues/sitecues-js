// module for showing equinox badge on the page
// and notifying system about interactions (hover/click)
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
            .hide()
            .appendTo('html');

        // create badge image inside of panel
        badge.element = $('<img>')
            .attr('id', 'eqnx-badge-image')
            .attr('src', eqnx.resolveEqnxUrl('/images/eq360-badge.png'))
            .appendTo(badge.panel);

        // handle image loading
        badge.element.load(function(){
            // show badge panel only after image was loaded
            badge.panel.fadeIn(callback);
        });

    });

});