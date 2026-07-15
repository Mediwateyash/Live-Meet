import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { obfuscator } from 'rollup-obfuscator'

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    plugins: [
      react(),
      isBuild && obfuscator({
        include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
        exclude: ['node_modules/**'],
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'mangled',
        ignoreImports: true,
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        renameProperties: false,
        rotateStringArray: true,
        selfDefending: false,
        simplify: true,
        splitStrings: false,
        stringArray: true,
        stringArrayCallsTransform: false,
        stringArrayCallsTransformThreshold: 0.5,
        stringArrayEncoding: ['base64'],
        stringArrayIndexesType: ['hexadecimal-number'],
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
      })
    ].filter(Boolean),
    server: {
      port: 5173,
      allowedHosts: ['localhost', '127.0.0.1', '.onrender.com'],
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/sitemap.xml': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  };
})
