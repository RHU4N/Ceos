// The Sass dependency is unchanged. Supply its identity source-map contract to test the URL loader.
const { SourceMapGenerator } = require('source-map');
module.exports = function(source) {
  const map = new SourceMapGenerator({ file: this.resourcePath });
  for (let column=0; column<source.split('\n')[0].length; column++) map.addMapping({ generated:{line:1,column}, original:{line:1,column}, source:this.resourcePath });
  map.setSourceContent(this.resourcePath, source);
  this.callback(null, source, map.toJSON());
};
