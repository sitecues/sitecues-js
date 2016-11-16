# Change Log

All notable changes to this project will be documented here.

 - **Fixed**      : Bug fixes to align with expected behavior.
 - **Added**      : New features.
 - **Changed**    : Updates to expected behavior.
 - **Deprecated** : Planned for removal in the near future.
 - **Removed**    : Disabled or deleted within the source code.

## Unreleased

## [5.0.0] - 2016-11-16
### Added
 - Toolbar menu can be turned on with config setting hasOptionsMenu: true
 - Dutch localization and Swedish verbal cues
### Changed  
 - Loaded by new Sitecues core, repo hosted on github, built in circleci
 - Extra sensitive badge turned on for first time users
 - Expanded more button timer A/B test
 - Verbal cues now built from text in sitecues-js client source, served from js.sitecues.com

## [4.2.19] - 2016-11-3
### Fixed
 - Buttons and forms in the lens can now be interacted with
 - Live update of text fields in the lens allow `enter` to work correctly when intended

## [4.2.18] - 2016-11-1
### Fixed
 - Hidden fixed elements now maintain their intended visibility when transplanted
 - Input elements are more reliably recognized by the lens

## [4.2.17] - 2016-10-19
### Fixed
 - Fixed elements are now vertically positioned outside of the viewport if that is their intended position

## [4.2.15] - 2016-09-28
### Fixed
 - data-sc-pick="disable" works correctly. The picker won't pick any ancestor of something marked as such
 - Css can use the following code to enable sitecues badge callouts that only show up when Siteces is loaded and visible:
  some_selector { visibility: hidden; }
  html[data-sitecues-active="desktop"] { some_selector: visibility: visible; }

## [4.2.12] - 2016-09-22
### Fixed
 - Lens is more stable and performant

## [4.2.9] - 2016-09-16
### Fixed
 - Fixed a regression in Internet Explorer where we failed to clean up after ourselves. That left the page in a weird state.

## [4.2.8] - 2016-09-15
### Fixed
 - Improved support for Google Translate.
 - Improved support for dropdown menus in Firefox.
 - Improved support for sites that use transitions.

## [4.2.7] - 2016-09-13
### Fixed
 - Ignore irrelevant whitespace when evaluating media queries.
 - Better detection of backgrounds for the Lens.
 - Improved handling of fixed position elements.

## [4.2.6] - 2016-08-29
### Fixed
 - No longer attempt to read text from cross-origin sources.

## [4.2.5] - 2016-08-26
### Fixed
 - Improve fixed positioning for flash elements. Ignore invalid documents.
 - Improve performance for inverting SVG images.
 - Improve debouncing for key-command metrics.
 - Ensure local TTS errors are always reported.
 - Background images are added to the Lens

### Changed
 - Fire panel-clicked metric when Enter or Space used to trigger item in panel

### Added
 - Add badge size, placement, and color to all metrics.
 - Combo-boxes can now be highlighted.

## [4.2.1] - 2016-08-02
### Added
 - Support for Flash elements.

### Fixed
 - Toggling audio with a keyboard command now correctly triggers on / off audio cue.
 - Prevent highlighting of alt-text hidden with text-indent styling.
 - Remove redundant metrics fields from the object before firing the network request.

## [4.1.2] - 2016-07-21
### Changed
 - Ensure fixed positioned elements have a higher z-index than static content.
 - Ensure fixed positioned elements are correctly positioned vertically in IE.
 - Avoid using modern Number methods which are not supported in IE.

## [4.1.1] - 2016-07-13
### Compatibility
 - Much better handling of fixed positioned content, by moving content out of the body during zoom where it can remain fixed. Docs at https://equinox.atlassian.net/wiki/display/EN/Positioner
 - SC-3797: compatible with the history API: https://developer.mozilla.org/en-US/docs/Web/API/History_API
 - SC-3722: fix toolbar jiggle issues in IE and Edge
 - Differentiate between unpinch and ctrl+mousewheel, at least on Mac Chrome -- not possible on other browsers
 - SC-3788: couldn't highlight forms in IE/Edge
 - SC-3615: support zoom glide stop in Edge (wouldn't stop gliding)
 - SC-3765: hide Sitecues in print media
 - SC-3767: arrowing with lens in Firefox threw exception and didn't work
 - SC-3667: fixes for zoom and highlighting with combo boxes
 - SC-3734: use passive event listeners when possible -- should improve scrolling performance on complex sites. Currently only affects Chrome.
 - Upgrade to custom build of jQuery 3 (old version 2.1.1), saving about 2.5k from page.tar.gz

### Metrics
 - Metric version updated to 15
 - Provide parsed browser, OS (both name/version) in every metric
 - SC-3535: Added current settings to every metric
 - Use isBadgeHidden: true on page-visited metric if a site hides the Sitecues badge
 - Better unsupported platform detection -- don't be fooled by IE compatibility mode, Linux running on Mac or Windows machine
 - The panel-focus-moved metric is now only fired for panel tab presses
 - The slider-setting-changed metric is now only fired once per slider interaction
 - SC-3766. The pageUrl field is incorrect when the reverse proxy is used. r=seth

### UX
 - SC-3808. Should use same voice for local cues and local speech
 - Smoother, better, more reliable animations for BP


[Unreleased]: https://bitbucket.org/ai_squared/sitecues-js/commits/branch/dev
[4.2.1]:      https://bitbucket.org/ai_squared/sitecues-js/commits/79da45fdc3928821852f0e55a89acc7abe991739?at=release-4.2
[4.1.2]:      https://bitbucket.org/ai_squared/sitecues-js/commits/5b257009e1979cbca9cab6eb53aafe52c8b4d5b2?at=release-4.1
[4.1.1]:      https://bitbucket.org/ai_squared/sitecues-js/commits/c792d3364843a2c1ecee03bbcec3dfdd042b2fd5?at=release-4.1
