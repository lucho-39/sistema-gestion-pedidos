import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Las filas de Excel y los datos dinámicos de xlsx se tipan como `any` a
      // propósito en los bordes. Se deja como advertencia para que la deuda quede
      // visible sin bloquear el build por algo intencional.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]

export default eslintConfig
