/*
 * Sitecues:  keys.js
 *
 * The module for handling keyboard shortcuts.
 *
 */

sitecues.def('keys', function (keys, callback, log) {

console.log(123);


  ////  Key Event Definitions ////

  var eventKeyDefinitions = {
      "minus" : "zoom/decrease"
    , "plus"  : "zoom/increase"
    , "r"     : "inverse/toggle"
    , "f8"    : "toolbar/toggle"
    , "space" : "highlight/animate"
  };


sitecues.use('jquery', 'mouse-highlight', 'util/common', function($, mh, common){



  ////  State & Event Maps ////

  // Key State ENUM
  var up    = 0
    , down  = 1
    ;

  // KeyCode to KeyName Map
  var keyMap = {
      16  : "shift"
    , 17  : "ctrl"
    , 18  : "alt"
    , 32  : "space"
    , 82  : "r"
    , 91  : "command"
    , 189 : "minus"
    , 187 : "plus"
  };

  // KeyName to KeyState Map
  var keyState = {
     "shift"    : up
    , "ctrl"    : up
    , "alt"     : up
    , "space"   : up
    , "r"       : up
    , "command" : up
    , "minus"   : up
    , "plus"    : up
  };



  //// Add Events to the EventKeyMap ////

  // Eg: { "zoom/decrease": ["ctrl", "r"] }
  var eventKeyMap = {};

  // Store the events with their keys in the eventKeyMap
  function addKeyEvent (keyCombo, eventName) {
    eventKeyMap[ eventName ] = keyCombo.split('+');
  };



  //// Check eventKeyMap ////

  function checkKeyEvents(keyName, e) {

    // Array stores events that have keyCodes matching incoming event
    var eventMatchList = [],

      // Track total number of keys being held down
      numberOfKeysDown = 0;
    
    // Loop through the events in the eventKeyMap
    for (var eventName in eventKeyMap) {
      
      // Get the array of keys listed in the key combination for this event
      var eventKeys     = eventKeyMap[ eventName ]

          // Count possible key states required in this combo ie: alt+c=2 keys
          , stateCount  = eventKeys.length

          // Track the number of required keys that are down for this event
          , statesTrue  = 0
      ;

      // Loop through the keys states in this event combo
      for (i=0; i< stateCount; i++) {

        // Sum the state of the keys: 0=up, 1=down, not stored returns 0
        statesTrue += keyState[ eventKeys[i] ] || 0;
      
      }

      // If there are more keys down for this combo then in prev. interations...
      if (statesTrue > numberOfKeysDown) {

        // Set the number of keys down to the new value
        numberOfKeysDown = statesTrue;
      
      }

      // If all the keys states are down in the current key-combo iteration...
      if (statesTrue == stateCount) {

        // Add this key eventName to the eventMatchList auto-ordered-array

        eventMatchList[ stateCount ] = eventName;
      }
    }
    
    // If there was at least one complete key-state match...
    if (eventMatchList.length > 0 ) {

      // Select last event from match list (events with more keys take priority)
      var selectedEvent = eventMatchList[ eventMatchList.length -1 ];

      // If the number of keys currently down matches the number of possible
      // keys required in this combination...
      if (eventKeyMap[ selectedEvent ].length === numberOfKeysDown) {

        // INFO: Sometimes you will have 2 keys down eg: if pressing 'shift+r'.
        // If you have an singular key-event of 'r', you don't want the 'r' event
        // to fire when both 'shift' and 'r' are in the down state, this would be
        // very confusing for the user.
        
        console.log( selectedEvent );
        
        // Emit the sitecues event, passing the origin key event
        sitecues.emit(selectedEvent, e)
      }
    }
  };



  //// Handle Window KeyDown ////

  function keyDownHandler (e){
    console.log(e.keyCode);

    // Get the keyName from the keyMap
    var keyName = keyMap[ e.keyCode ];

    // Set the state of the Key in the keyState object
    keyState[ keyName ] = down;
    
    // Now keyState has changed, check the keyEventMap
    checkKeyEvents(keyName, e);
  };



  //// Handle Window KeyUp ////

  function keyUpHandler (e) {
    //console.log( e.keyCode );
    
    keyState[ keyMap[ e.keyCode ] ] = up;

    // Get the keyName from the keyMap
    var keyName = keyMap[ e.keyCode ];
    
    // Now keyState has changed, check the keyEventMap
    checkKeyEvents(keyName, e);
  };



  //// Instantiation ////

  // Add keydown & keyup event listeners to the
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  // Map Events to Key Combinations
  function addKeyEvent (keyCombo, eventName) {
    eventKeyMap[ eventName ] = keyCombo.split('+');
  };

  // Loop through the key-combo-event definitions...
  for (var keyCombo in eventKeyDefinitions) {

    // Call addKeyEvent to create maps between combinations of keys and
    // sitecues-emit-event strings, ie: "{ "ctrl+plus" : "zoom/increase" }
    addKeyEvent(keyCombo, eventKeyDefinitions[ keyCombo ]);
  }


  







  
 //   // define keys map used to bind actions to hotkeys
  // keys.map = {
  //  'minus':  { preventDefault: true, event: 'zoom/decrease' },
  //  'plus':   { preventDefault: true, event: 'zoom/increase' },
  //  'r':    { preventDefault: true, event: 'inverse/toggle'},
  //  'f8':   { event: 'toolbar/toggle' },
  //  'space':  {
  //    event: 'highlight/animate',
  //    preventDefault: true,
  //    requiresMouseHighlight: true
  //  }
  // };

  // keys.hlbKeysMap = {
  //   'esc':      {event: 'key/esc'},
  //   // If HLB is opened then scroll should only work for HLB inner content, not bubbling up to window.
  //   // scroll
  //   'up':       { stopOuterScroll: true, up: true },
  //   'pageup':   { stopOuterScroll: true, up: true },
  //   'home':     { stopOuterScroll: true, up: true },
  //   'down':     { stopOuterScroll: true, down: true },
  //   'pagedown': { stopOuterScroll: true, down: true },
  //   'end':      { stopOuterScroll: true, down: true }
  // };

  //sitecues.use('jquery', 'mouse-highlight', 'util/common', function($, mh, common){
  //  sitecues.on('hlb/ready', function (hlbElement) {
    //  extra_event_properties.dom.highlight_box = $(hlbElement);
  //     $.extend(keys.test, keys.hlbKeysTest);
  //     $.extend(keys.map, keys.hlbKeysMap);
    // });

    // done
  }); //use?
  
  callback();
  



// var kkeys = [], konami = "38,38,40,40,37,39,37,39,66,65";
// $(document).keydown(function(e) {
//   kkeys.push( e.keyCode );
//   if ( kkeys.toString().indexOf( konami ) >= 0 ){
//     $(document).unbind('keydown',arguments.callee);
//     $.getScript('http://www.cornify.com/js/cornify.js',function(){
//       cornify_add();
//       $(document).keydown(cornify_add);
//     });
//   }
// });


});
