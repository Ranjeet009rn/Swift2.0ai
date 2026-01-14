const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Custom resolver to fix React Native 0.79.6 module resolution issues
  config.resolver = {
    ...config.resolver,
    unstable_enableSymlinks: true,
    resolveRequest: (context, moduleName, platform) => {
      // Fix for relative imports in React Native that don't resolve correctly
      if (moduleName === '../Utilities/Platform' || moduleName === './Platform') {
        // For web, use android as fallback since Platform.web.js doesn't exist
        const targetPlatform = platform === 'web' ? 'android' : (platform || 'android');
        const platformFile = `Platform.${targetPlatform}.js`;

        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/react-native/Libraries/Utilities',
            platformFile
          ),
          type: 'sourceFile',
        };
      }

      // Fix for BaseViewConfig resolution
      if (moduleName === './BaseViewConfig') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/react-native/Libraries/NativeComponent/BaseViewConfig.js'
          ),
          type: 'sourceFile',
        };
      }

      // Default resolution
      return context.resolveRequest(context, moduleName, platform);
    },
  };

  // Ensure proper file watching on Windows
  config.watchFolders = [__dirname];

  return config;
})();
