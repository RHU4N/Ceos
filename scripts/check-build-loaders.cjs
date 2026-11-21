const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
process.env.NODE_ENV='production';
require('react-scripts/config/env');
const config=require('react-scripts/config/webpack.config')('production');
const webpack=require('webpack');
const output=path.resolve('node_modules/.cache/ceos-build-contract');
const scss=config.module.rules.flatMap(rule=>rule.oneOf||[]).find(rule=>rule.test instanceof RegExp && rule.test.test('style.scss') && !(rule.exclude instanceof RegExp && rule.exclude.test('style.scss')));
assert.ok(scss, 'CRA SCSS rule must be present');
let replaced=0;
scss.use=scss.use.map(loader=>{
  if (typeof loader==='object' && /[\\/]sass-loader[\\/]/.test(loader.loader)) { replaced++; return {loader:path.join(__dirname,'fixture-source-map.cjs')}; }
  return loader;
});
assert.equal(replaced,1,'Only the unchanged Sass preprocessing stage is stubbed');
config.entry=path.resolve('src/__fixtures__/build-contract/entry.js');
config.target='node'; config.cache=false; config.devtool=false;
config.output={...config.output,path:output,filename:'contract.cjs',library:{type:'commonjs2'}};
config.optimization={...config.optimization,splitChunks:false,runtimeChunk:false};
config.plugins=config.plugins.filter(plugin=>['DefinePlugin','MiniCssExtractPlugin'].includes(plugin.constructor.name));
const compiler=webpack(config);
compiler.run((error,stats)=>{
  compiler.close(()=>{});
  if(error||stats.hasErrors()) { console.error(error?.message || stats.toString({all:false,errors:true})); process.exitCode=1; return; }
  const result=require(path.join(output,'contract.cjs'));
  assert.match(result.markup,/<title[^>]*>SVG contract<\/title>/);
  assert.match(result.markup,/viewBox="0 0 10 10"/);
  assert.match(result.url,/\.svg$/);
  const css=stats.toJson({all:false,assets:true,cachedAssets:true,groupAssetsByEmitStatus:false,groupAssetsByPath:false,groupAssetsByExtension:false,groupAssetsByChunk:false,groupAssetsByInfo:false}).assets.filter(asset=>asset.name.endsWith('.css'));
  assert.ok(css.length>0,'SCSS pipeline must emit CSS');
  assert.ok(css.some(asset=>/url\([^)]*\.svg\)/.test(fs.readFileSync(path.join(output,asset.name),'utf8'))),'Sass source-map URLs must resolve to emitted SVG assets');
  console.log('CRA loader contracts passed: SVG URL/named component/title/ref and CSS URL source maps.');
});
