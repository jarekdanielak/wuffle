/* eslint-env node */

const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const url = require('@rollup/plugin-url');
const terser = require('@rollup/plugin-terser');

const copy = require('rollup-plugin-copy');
const css = require('rollup-plugin-css-only');
const svelte = require('rollup-plugin-svelte');

const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');

const { string } = require('rollup-plugin-string');

const svelteConfig = require('./svelte.config');

const distDirectory = '../app/public';

const production = !process.env.ROLLUP_WATCH;

module.exports = [
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: distDirectory + '/bundle.js'
    },
    plugins: [
      copy({
        targets: [
          { src: 'public/*', dest: distDirectory }
        ]
      }),
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/board/'
      }),
      svelte({

        compilerOptions: {

          // enable run-time checks during development
          dev: !production,

          immutable: true
        },

        preprocess: svelteConfig.preprocess
      }),

      css({ output: 'bundle.css' }),

      resolve({
        browser: true,
        exportConditions: [ 'svelte' ],
        extensions: [ '.svelte' ]
      }),
      commonjs(),

      // minify in production
      production && terser(),

      // dev server in development (serves static files on port 3001)
      !production && serve({
        contentBase: distDirectory,
        host: 'localhost',
        port: 3001,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }),

      // livereload in development
      !production && livereload({
        watch: distDirectory
      })
    ],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/service-worker.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'serviceWorker',
      file: distDirectory + '/service-worker.js'
    },
    plugins: [
      resolve(),
      commonjs(),

      string({
        include: '**/*.svg'
      }),

      // minify in production
      production && terser()
    ]
  },
  {
    input: 'src/register-service-worker.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'registerServiceWorker',
      file: distDirectory + '/register-service-worker.js'
    },
    plugins: [
      resolve(),
      commonjs(),

      // minify in production
      production && terser()
    ]
  }
];