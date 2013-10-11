sitecues.def('invert', function (invert, callback, log) {

  sitecues.use('conf', 'highlight-box', 'util/common', 'jquery', function (conf, highlight_box, common, $) {

    invert.states = {
        invert  : 0
      , match   : 1
      , normal  : 2
    };

    invert.stateMap = {
        0 : 'invert'
      , 1 : 'match'
      , 2 : 'normal'
    };

    var elem_invert_state = {
        highlight_box  : null
      , page           : null
    };

    var states = invert.states;

    var dom_elem = {
        page          : $(conf.get("invertRootSelector") || 'body')
      , highlight_box : null
    }

    var cssInvert = {
        empty   : {'-webkit-filter': ''}
      , full    : {'-webkit-filter': 'invert(1)'}
      , none    : {'-webkit-filter': 'none'}
    };

    var hlbState = conf.get('invert.highlight-box.state') || "match";
    setState("highlight_box", hlbState);

    var pageState = conf.get('invert.page.state') || "normal";
    setState("page", pageState);


    invert.disable = function() {
        setState("highlight_box", "normal");
        setState("page", "normal");
        
        setStyle('highlight_box', 'none');
        setStyle('page', 'none');
    }

    function setState(elem, state){
      elem_invert_state[ elem ] = states[state];
      var elemS = elem.replace("_",'-'); // Not happy this line is nessecary. A product of the module system. -al
      conf.set("invert."+elemS+".state", state);
      sitecues.emit("invert/"+elemS+"/"+state);
    };

    var staticBorderColor;

    function setStyle(elem, invert) {
      var $hlb = $(dom_elem[ elem ]);
      // Maintain HLB outline color during reverse contrast.
      if (invert) {
          staticBorderColor = staticBorderColor? staticBorderColor :  $hlb.css('borderColor');
          var newBorderColor;
          switch (invert) {
              // Revert original color before it is reverted again by invert feature. => double inverts give the original color.
              case 'full':
                  newBorderColor = common.getRevertColor(staticBorderColor);
                  break;
              // Neutralize [possible] impact of invert color(case 'full'): set the original color.
              case 'none':
                  newBorderColor = staticBorderColor;
                  break;
          }
          $hlb.css('borderColor', newBorderColor);
      }
      $hlb.css(cssInvert[ invert ]);
    };

    sitecues.on('hlb/deflating', function () {
      if (elem_invert_state.highlight_box === elem_invert_state.page) {
        setState("highlight_box", "match");
      }
    });

    sitecues.on('hlb/ready', function (data) {
      dom_elem.highlight_box = $(data);

      switch (elem_invert_state.highlight_box) {

        case states.invert:
          if (elem_invert_state.page === states.invert) {
            setStyle("highlight_box", "empty");
          } else {
            setStyle("highlight_box", "full");
          }
          break;

        case states.match:
          setStyle("highlight_box", "empty");
          break;

        case states.normal:
          if (elem_invert_state.page === states.normal) {
            setStyle("highlight_box", "empty");
          } else {
            setStyle("highlight_box", "full");
          }
          break;
      }
    });

    /**
     * Inverts the page colors.  Currently only works in webkit.
     *
     * @param  keypress event A keypress event, optional.
     * @return void
     */
    sitecues.on('inverse/toggle', function (event) {

      if (!event) {
        // We have no key event.
        if (elem_invert_state.page === states.invert) {
          setStyle("page", "none");
          elem_invert_state.page = states.normal;
          log.info("invert off - without key event");

        } else {
          setStyle("page", "full");
          elem_invert_state.page = states.invert;
          log.info("invert on - without key event");

        }

        // There should not be a highlight box open so we'll just set
        // it to match
        elem_invert_state.highlight_box = states.match;
        setStyle("highlight_box", "none");
        return;
      }

      //TODO We should probably clean up what's below here, or put it on
      //the menu in the North End.

        var highlight_box_state  = highlight_box.getState();
        var highlight_box_states = highlight_box.STATES;

        dom_elem.highlight_box = $(event.dom.highlight_box);

        if ( highlight_box_state === highlight_box_states.READY     ||
             highlight_box_state === highlight_box_states.INFLATING ||
             highlight_box_state === highlight_box_states.CREATE ) {

          switch (elem_invert_state.highlight_box) {

            case states.invert:
              switch (elem_invert_state.page) {
                case states.invert:
                  setStyle("highlight_box", "full");
                  break;

                case states.normal:
                  setStyle('highlight_box', 'none')
                  break;
              }
              setState("highlight_box","normal");
              break;

            case states.match:
              switch (elem_invert_state.page) {
                case states.invert:
                  setStyle('highlight_box', 'none')
                  setState("highlight_box","normal");
                  break;

                case states.normal:
                  setStyle('highlight_box', 'full')
                  setState("highlight_box","invert");
                  break;
              }
              break;

            case states.normal:
              switch (elem_invert_state.page) {
                case states.invert:
                  setStyle('highlight_box', 'none')
                  break;

                case states.normal:
                  setStyle('highlight_box', 'full')
                  break;
              }
              setState("highlight_box","invert");
              break;
          }

        } else if ( highlight_box_state === highlight_box_states.ON ||
                    highlight_box_state === highlight_box_states.CLOSED ) {

          if (elem_invert_state.highlight_box === states.match) {

            // NOTE: This following line of code was the replacement for a
            // switch statement, but I am not convinced that the cases in the
            // statement were ever executing. Perhaps there is some state that
            // I am not aware of yet.
            setState("highlight_box", invert.stateMap[elem_invert_state.page]);
          }

          switch (elem_invert_state.page) {
            case states.invert:
              setStyle('page', 'none')
              setState("page","normal");
              break;

            case states.normal:
              setStyle('page', 'full');
              setState("page", "invert");
              break;
          }

        }
    });

    sitecues.on('inverse/disable', function() {
        invert.disable();
    })

    callback();

  });

});