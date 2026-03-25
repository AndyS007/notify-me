const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAllowBackupFix(config) {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults;

        const app = manifest.manifest.application[0];

        // 加上 tools:replace
        app.$['tools:replace'] = 'android:allowBackup';

        return config;
    });
};