import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js", "next-env.d.ts", "prisma/migrations/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Unused values are a bug signal, but a leading underscore is the
      // conventional way to say "deliberately ignored".
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Build/deploy scripts are CLI tools; their output is the point.
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
];

export default config;
