module.exports = function (api) {
  //process.env.NODE_ENV === "production"
  api.cache(false)
  const presets = [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "debug": true
      }
    ],
    "@babel/preset-typescript",
  ];
  const plugins = [];

  return {
    presets,
    plugins
  };
}