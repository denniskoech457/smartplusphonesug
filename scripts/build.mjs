import { build } from 'esbuild';
for (const name of ['main','dashboard','smartpay-admin']) {
  await build({entryPoints:[`js/${name}.js`],outfile:`js/${name}.bundle.js`,bundle:true,platform:'browser',format:'iife',target:'es2020',minify:true,logLevel:'info'});
}
