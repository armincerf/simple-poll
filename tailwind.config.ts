import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./src/frontend/**/*.{ts,tsx,html}'],
  plugins: [], // v4 bundles core plugins; animation utils are built-in
} 