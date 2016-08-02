# Change Log

All notable changes to this project will be documented here.

 - **Fixed**      : Bug fixes to align with expected behavior.
 - **Added**      : New features.
 - **Changed**    : Updates to expected behavior.
 - **Deprecated** : Planned for removal in the near future.
 - **Removed**    : Disabled or deleted within the source code.

## [Unreleased]
### Fixed
 - Only search for flash elements in valid documents

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
