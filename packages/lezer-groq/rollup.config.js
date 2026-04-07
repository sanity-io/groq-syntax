import {nodeResolve} from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'

export default {
  input: './src/index.ts',
  output: {
    format: 'es',
    file: './dist/index.js',
  },
  external(id) {
    return !/^[\.\/]/.test(id)
  },
  plugins: [nodeResolve(), esbuild()],
}
