/**
 * Customer-Customization File
 * -----------------------------------------------------------------------------------------------
 *
 * INSTRUCTIONS:
 *
 *   This file is used to deliver a custom customer customization.
 *
 *     USAGE STEPS:
 *
 *       1 - DO NOT EDIT THIS FILE!
 *
 *       2 - Copy this file into to the customization directory, using a [FUNCTIONAL-NAME] that
 *           describes what your customization does, Eg: "css-set-clear-none-on-nav.js"
 *
 *              Example: "source/js/custom-scripts/[FUNCTIONAL-NAME].js"
 *
 *       3 - Fill out the CUSTOMIZATION-DESCRIPTION below dashed line.
 *       4 - Follow the comments below the dotted line, making sure you fill in the blanks.
 *
 * -----------------------------------------------------------------------------------------------
 * IssueLinks  : [ISSUE-REFERENCE-NUMBER],
 * Description : [Write the description of what the customization does in here. Example: "This
 *               customization fixes problems with overflow:hidden elements on EEOC.gov by
 *               updating the CSS rules of some elements of the home-page."]
 */

define(['custom', '[required-module-1]', '[required-module-2]'], function (custom, required_module_1, required_module_2) {

  'use strict';

  // 6 - Insert the [module-to-customize] for the module that the customization should run in.
  //          You can find the [module-to-customize] name in the define() statement of the module
  //          that you want to customize. Make sure you use the full path-name of the module
  //          including any slashes.
  //
  //          Eg:
  //
  //          custom.register('mouse-highlight/pick', function (event) {
  //
  custom.register('[module-to-customize]', function (event) {

    // 7 - Insert your customization code here. This function runs AFTER the module is loaded.
    console.log('Your customization callback executed successfully! %o %o %o', required_module_1, required_module_2, event);

  });

});

// 8 - Delete all instruction comments from you customization script file.

// 9 - Reference this file in the custom .mk file, which can be found in /custom-config/