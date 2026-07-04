import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jestPlugin from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "lib/**", "docs/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      jest: jestPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.eslintRecommended.rules,
      ...tseslint.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      "no-unused-vars": "off"
    }
  }
);
