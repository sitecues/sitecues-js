/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_EQ-1508
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1508
 * Description : This customization fixes problems with overflow:hidden elements
 *               on EEOC.gov by updating the CSS rules of some elements of the home-page.
 * 
*/
sitecues.def('custom_a-0000ee0c_EQ-1492', function (module, callback, log) {
  sitecues.use('custom', 'jquery', function (custom, $) {
    
    custom.register({
      module   : 'highlight-box',
      customId : 'custom_a-0000ee0c_EQ-1492',
      
      func: function (event) {
        if (true) {

         // todo: still need to find out whether it is eeoc?
         // #1 way
         // idea: cancel clears
         // pros: general solution, the underlying content stays on the page(but is shifted)
         // cons: positining problems, the same as on techbuffalo
         // also: need to re-calculate the position? Left border goes offscreen.
         (function _rec($children) {
             if ($children.length === 0) {
                 return;
             }
 
             $children.each(function() {
                 $(this).css('clear') !== 'none' && $(this).css('clear', 'none');
                 return _rec($(this).children());
             });
         }($('#centercol').children()));
         }

         console.log(this);

      }
    });

    callback();
  });
});