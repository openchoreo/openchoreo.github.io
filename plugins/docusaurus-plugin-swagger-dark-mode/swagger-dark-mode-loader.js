/**
 * Webpack loader that replaces `html.dark-mode` selectors in swagger-ui CSS
 * with `html[data-theme="dark"]` so they work with Docusaurus's theme system.
 */
module.exports = function swaggerDarkModeLoader(source) {
  return source.replace(/html\.dark-mode/g, 'html[data-theme="dark"]');
};
