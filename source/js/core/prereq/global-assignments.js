// Apologies for putting this on the native window
// Must be inserted before alameda by the build process
// `iframeFactory` has been defined for us in iframe-factory.js and inserted prior to this code running, same for nativeFn

sitecues._getHelperFrame  = iframeFactory;
sitecues._nativeFn        = nativeFn;
nativeFn.init();