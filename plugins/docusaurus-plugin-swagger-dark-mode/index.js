/**
 * Docusaurus plugin that transforms swagger-ui's dark mode CSS selectors
 * from `html.dark-mode` to `html[data-theme="dark"]` at build time via a
 * custom webpack loader.
 *
 * This lets swagger-ui's built-in dark theme work natively with Docusaurus's
 * theme toggle without any runtime JavaScript or class syncing.
 */
const path = require('path');

module.exports = function pluginSwaggerDarkMode() {
  return {
    name: 'docusaurus-plugin-swagger-dark-mode',

    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /swagger-ui\.css$/,
              enforce: 'pre',
              use: [
                {
                  loader: path.resolve(__dirname, 'swagger-dark-mode-loader.js'),
                },
              ],
            },
          ],
        },
      };
    },
  };
};
