import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import dts from 'unplugin-dts/vite'
import packageJson from './package.json' with {type: 'json'}

const dependencies = Object.keys(packageJson.dependencies)

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: (id) => dependencies.some((dependency) =>
        id === dependency || id.startsWith(`${dependency}/`)),
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      bundleTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
})
