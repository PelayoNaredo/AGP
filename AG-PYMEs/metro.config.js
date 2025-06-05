// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Para asegurar que SVG y otros archivos se manejen correctamente
config.resolver.assetExts.push("cjs");
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);

// Fix para errores de exportaciones en módulos
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

module.exports = config;
