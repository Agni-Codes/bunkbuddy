import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "src/**",
      "**/dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".lighthouseci/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.tsx"],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
);
