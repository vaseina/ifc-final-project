import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'bim-model.js',
    output: [
        {
            format: 'esm',
            file: './dist/bundle.js'
        },
    ],
    plugins: [
        resolve(),
        commonjs()
    ]
};