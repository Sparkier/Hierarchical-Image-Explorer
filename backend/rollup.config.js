import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from "@rollup/plugin-json"

export default {
  input: 'src/server.ts',
  output: {
    dir: 'build',
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
		typescript(),
    json(),
  ]
};