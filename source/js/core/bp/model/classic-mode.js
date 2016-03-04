/**
 * Does the current site/browser require classic mode?
 * Classic mode is where the ? shows up instead of the down arrow. This can be necessary if themes aren't working.
 */

define(['core/conf/site', 'core/platform'], function(site, platform) {
  var CLASSIC_SITES = {
    's-00e27714': 1, // http://millburnlibrary.org                   
    's-0796b61d': 1, // http://bip.wokiss.pl/wagrowiecm/              // http://www.brzeziny-gmina.pl -- no sitecues
    's-14949bfa': 1, // http://bip.wokiss.pl/koscianm                
    's-190630d2': 1, // http://bip.powiat-slupca.pl                  
    's-389f76da': 1, // http://www.gminakoscian.pl                   
    's-456e33ab': 1, // http://bip.wokiss.pl/kamieniec                // http://www.gminakoscian.pl  -- sitecues broken
    's-4bfe60ab': 1, // http://www.windoweyesforoffice.com           
    's-542edffc': 1, // http://bip.wokiss.pl/przedecz                
    's-548f9948': 1, // http://ialvs.com                             
    's-6097a290': 1, // http://gatfl.org                             
    's-620610ee': 1, // http://makingcareeasier.com                  
    's-6fd0ef74': 1, // http://adapadvocacyassociation.org           
    's-73dd0fcf': 1, // http://bip.kornik.pl                         
    's-742d6f96': 1, // http://ruhglobal.com
    's-789901d0': 1, // http://latan.org                             
    's-79b6a3ce': 1, // http://campabilitiessaratoga.org             
    's-7b90f601': 1, // http://tiicann.org                           
    's-9afa6ab9': 1, // http://perkins.org                           
    's-a5851e07': 1, // http://harpo.com.pl                          
    's-acc8f046': 1, // http://oxfordlanecapital.com                 
    's-b737790f': 1, // http://window-eyes.at                        
    's-c27fa71d': 1, // http://www.texasat.net                       
    's-f424d83d': 1  // http://faast.org
  };

  function isClassicBrowser() {
    // IE 9 is awful
    // Edge is too, at least for now
    return platform.browser.isIE9 || platform.browser.isEdge;
  }

  function isClassicSite() {
    var classicPref = site.get('classicMode');
    if (typeof classicPref !== 'undefined') {
      return classicPref;
    }
    return CLASSIC_SITES[site.getSiteId()];
  }

  function isClassicMode() {
    return Boolean(isClassicSite() || isClassicBrowser());
  }

  return isClassicMode;
});
