/*
 * This module defines the basic structure of the roles which elements play on a
 * page. The concept is loosely based on WAI-ARIA roles but ours are more
 * broadly defined and more visually differentiated. The design goal is that we
 * have a model that maps more closely to our behaviors and we inspect the page
 * and can assign a role. We can then build rules against roles to determine
 * actions.
 *
 * At the simplest level, a role is based on the tag name of the element, but
 * this can change depending on usage and styling. For example a ul tag with
 * only one li element is not really a list anymore, it is just a container. An
 * em tag with display:block setting is no longer a fragment, it is now a
 * shortText or a longText or something else, depending on what it contains. 
 */
sitecues.def('mouse-highlight/roles', function(role, callback, console) {

  role.roles = {
     // We completely ignore these elements
    ignore: {
       name: 'ignore',
      tags: [
        '!--...--',
        '!doctype',
        'area',
        'base',
        'basefont',
        'bdo',
        'br',
        'head',
        'body',
        'center',
        'col',
        'colgroup',
        'font',
        'hr',
        'html',
        'frame',
        'frameset',
        'iframe',
        'link',
        'map',
        'meta',
        'noframes',
        'noscript',
        'optgroup',
        'option',
        'param',
        'script',
        'style',
        'tbody',
        'tfoot',
        'thead',
        'title'],
      aria: [
        'presentation',
        'separator'],
      sitecues: [
        'ignore'],
      canHighlight: false
    },
    // We just zoom these elements automatically
    graphic: {
      name: 'graphic',
      tags: [
        'applet',
        'img',
        'svg',
        'canvas',
        'video',
        'object'],
      aria: [
        'img'],
      sitecues: [
        'graphic'],
      shouldBeChild: true,
      canHighlight: true,
	  alwaysHighlight: true
    },
    // We treat these elements as inline text fragments
    fragment: {
      name: 'fragment',
      tags: [
        'a',
        'abbr',
        'acronym',
        'b',
        'big',
        'cite',
        'dfn',
        'kbd',
        'em',
        'i',
        'ins',
        'q',
        'small',
        'span',
        'strike',
        'strong',
        's',
        'samp',
        'var',
        'sub',
        'sup',
        'u'],
      aria: [],
      sitecues: [
        'fragment'],
      shouldBeChild: true,
      shouldContainText: true,
      // TODO anHighlight might be false here, if we require that we find a
      // more suitable parent element, or reassign this element to a
      // different role
      canHighlight: true
    },
    // We treat these elements as headers.  This means they should probably
    // include some of the following content to be useful.
    heading: {
      name: 'heading',
      tags: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'caption',
        'legend'],
       aria: [
         'heading'],
      sitecues: [
        'heading'],
      shouldContainText: true,
      canHighlight: true
    },
    // We treat these elements as large or typically independent text blocks
    longText: {
      name: 'longText',
      tags: [
        'address',
        'blockquote',
        'code',
        'p',
        'pre',
        'tt'],
      aria: [
        'article'],
      sitecues: [
        'longtext'],
      shouldContainText: true,
      canHighlight: true
    },
    // We treat these elements as small text blocks that we may want to join
    // together.  Note that these are conventionally used in lists.
    shortText: {
      name: 'shortText',
      tags: [
        'dt',
        'th',
        'td',
        'dd',
        'li'],
      aria: [
        'listitem'],
      sitecues: [
        'shorttext'],
      shouldContainText: true,
      canHighlight: true
    },
    // We treat these elements as arbitrary containers Note that all unknown
    // elements are effectively part of this list too.
    container: {
      name: 'container',
      tags: [
        'div',
        'fieldset',
        'tr'],
      aria: [
        'region'],
      sitecues: [
        'container'],
      shouldHaveChildren: true,
      canHighlight: true
    },
    // These elements contain a series of other items.
    list: {
      name: 'list',
      tags: [
        'table',
        'dir',
        'dl',
        'form',
        'ol',
        'ul',
        'menu'],
      aria: [
        'list'],
      sitecues: [
        'list'],
      shouldHaveChildren: true,
      canHighlight: true
    },
    // These are inputs.  They are pretty similar to small text blocks but less flexible.
    input: {
      name: 'input',
      tags: [
        'button',
        'input',
        'isindex',
        'select',
        'textarea',
        'label'],
      aria: [
        'combobox',
        'listbox',
        'checkbox',
        'radio'],
      sitecues: [
        'input'],
      canHighlight: true
    }
  };

  sitecues.use('jquery', function($) {

    role.find = function (elem) {

      if (elem.get(0)) {
        var nodeName = elem.get(0).nodeName.toLowerCase();
        // These attributes may have been set on the markup as
        // hints/overrides.
        var siteCuesRole = elem.data('sitecues-role');
        var ariaRole = elem.attr('aria-role');
        var roleName, roleData;
        if (siteCuesRole) {
          // First we'll check sitecues attributes
          for(roleName in role.roles) {
            roleData = role.roles[roleName];
            if($.inArray(siteCuesRole, roleData.sitecues) >= 0) {
              // console.info("Sitecues role match for " + nodeName);
              return roleData;
            }
          }
        }

        if (ariaRole) {
          // Then we'll check aria attributes
          for(roleName in role.roles) {
            roleData = role.roles[roleName];
            if($.inArray(ariaRole, roleData.aria) >= 0) {
              // console.info("Aria role match for " + nodeName);
              return roleData;
            }
          }
        }

        // Now we'll fall back to tag names
        var match;
        $.each(role.roles, function(key, value) {
          if($.inArray(nodeName, value.tags) >= 0) {
            // console.info("Tag name match for " + nodeName + " to " + value.name);
            match = value;
            return false;
          }
        });

        if (match) {
          return match;
        } 

        // console.info("No match for " + nodeName);
        return role.roles.container;
      }
    }

    callback();
  });
});
