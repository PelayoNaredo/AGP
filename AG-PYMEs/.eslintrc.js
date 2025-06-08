module.exports = {
  env: {
    browser: true,
    es2021: true,
    "react-native/react-native": true,
  },
  extends: ["eslint:recommended", "@react-native-community"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "react-native"],
  rules: {
    // Reglas para detectar código muerto
    "no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "no-undef": "error",
    "no-unreachable": "error",
    "no-unreachable-loop": "error",
    "no-unused-expressions": "error",

    // Reglas específicas para React/React Native
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "react/no-unused-state": "error",
    "react-native/no-unused-styles": "error",

    // Reglas de estilo que ayudan a mantener código limpio
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",

    // Desactivar reglas que pueden ser problemáticas en React Native
    "no-console": "warn", // Permitir console.log en desarrollo
    "react-native/no-inline-styles": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
