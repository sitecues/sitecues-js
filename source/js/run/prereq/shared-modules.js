/**
 * These are modules that the minicore implements for us
 * IMPORTANT: they must be marked as 'empty:' in task/common/amd-config
 * sitecues._getHelperFrame must also be defined by the minicore
 * Also needs to go into task/extension/amd-config and be overridden by extension
 */
sitecues.define('mini-core/native-global', [], function () { return sitecues._shared.nativeGlobal; });
sitecues.define('mini-core/page-view', [], function () { return sitecues._shared.pageView; });
sitecues.define('mini-core/session', [], function () { return sitecues._shared.session; });
sitecues.define('mini-core/user', [], function () { return sitecues._shared.user; });
