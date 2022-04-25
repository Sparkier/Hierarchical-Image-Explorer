import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from "@rollup/plugin-json"

export default {
  input: './build-ts/server.js',
  output: {
    dir: 'build',
    format: 'cjs'
  },
  plugins: [json(), commonjs(), nodeResolve()]
};