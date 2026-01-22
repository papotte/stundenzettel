import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/.next/",
    "**/next-env.d.ts",
    "**/out/",
    "**/dist/",
    "**/coverage/",
    "**/public/",
    "**/build/",
    "functions/lib",
    "**/e2e/",
    "**/scripts/",
    "**/jest.setup.tsx",
    "**/tailwind.config.ts",
  ]),
  ...fixupConfigRules(
    compat.extends(
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:jsx-a11y/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "prettier",
    ),
  ),
  {
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "import/order": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["functions/**/*.ts"],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "import/no-unresolved": "off",
    },
}, {
    files: ["**/*.tsx"],

    rules: {
        "react/prop-types": "off",
    },
}]);