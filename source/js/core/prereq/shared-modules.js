/**
 * These are modules that the minicore implements for us
 * IMPORTANT: they must be marked as 'empty:' in task/common/amd-config
 * sitecues._getHelperFrame must also be defined by the minicore
 */
sitecues.define('mini-core/native-global', [], function () { return sitecues._shared.nativeGlobal; });
sitecues.define('mini-core/storage', [], function () { return sitecues._shared.storage; });