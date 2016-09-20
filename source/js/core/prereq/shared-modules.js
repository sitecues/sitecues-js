/**
 * These are modules that the minicore implements for us
 * IMPORTANT: they must be marked as 'empty:' in task/common/amd-config
 * sitecues._getHelperFrame must also be defined by the minicore
 */

sitecues.define('core/native-functions', [], function() { return sitecues._shared.nativeFn; });
sitecues.define('core/conf/user/storage', [], function() { return sitecues._shared.storage; });
sitecues.define('core/conf/user/storage-backup', [], function() { return sitecues._shared.storageBackup; });

