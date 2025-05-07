module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // …vos autres plugins,
      'react-native-reanimated/plugin',  // <-- OBLIGATOIRE et en dernier
    ],
  };
};