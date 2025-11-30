// eslint.config.mjs

import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

// Grab Next's core-web-vitals config object
const coreWebVitals = nextPlugin.configs["core-web-vitals"];

export default tseslint.config(
  // Ignore build + deps
  {
    ignores: ["**/.next/**", "**/node_modules/**"],
  },

  // TypeScript recommended configs
  ...tseslint.configs.recommended,

  // Next core web vitals + our overrides
  {
    ...coreWebVitals,
    plugins: {
      ...(coreWebVitals?.plugins ?? {}),
      "@next/next": nextPlugin,
    },
    rules: {
      ...(coreWebVitals?.rules ?? {}),

      // === Our relaxations (Stage 6 tooling only) ===
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "off",
      "eslint-comments/no-unused-disable": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
