import {defineConfig} from 'vite'
import {resolve} from 'path';
import dts from 'vite-plugin-dts'

export default defineConfig({
    define: {'process.env': {}},
    build: {
        minify: "esbuild",
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'aieditor',
            // fileName: (format) => `index.${format}.js`,
            fileName: `index`,
            formats: ['es', 'cjs']
        },
    },
    plugins: [dts({rollupTypes: true}),
        // legacy({
        //     targets: ['defaults', 'not IE 11','chrome 52'],
        // }),
    ],
})
