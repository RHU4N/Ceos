const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const image = require('./icon.svg');
require('./style.scss');
module.exports = {
  url: image.default,
  markup: renderToStaticMarkup(React.createElement(image.ReactComponent, { title: 'SVG contract', ref: React.createRef() })),
};
