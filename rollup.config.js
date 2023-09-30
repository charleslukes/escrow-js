import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import nodePolyfills from 'rollup-plugin-node-polyfills';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.ts",
  output: {
    file: "public/bundle.js",
    format: "iife", // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true,
    name: "GibEscrow"
  },
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
      preferBuiltins: false,
    }), 
    commonjs(),
    json(),
    typescript(),
    nodePolyfills({
      exclude: ['node_modules'],
      crypto: true
    }),
    production && terser(), // minify, but only in production
  ],
};
