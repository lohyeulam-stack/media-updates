import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore legacy vite code:
    "legacy-vite/**",
  ]),
  // Project-level rules — see docs/adr/0004-dependency-layers.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Type-safety rules: agents reach for `any` to silence errors. Block it.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      // React Hooks correctness — silent bugs without these.
      "react-hooks/exhaustive-deps": "error",

      // Server / Client boundary safety. ADR 0004 forbids `lib/data.ts` in
      // client components; this catches `process.cwd()` / `fs` leaking via
      // direct usage too.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fs",
              message:
                "fs is server-only. If you need data in a client component, pass it via props from a server component (see docs/adr/0004-dependency-layers.md).",
            },
            {
              name: "fs/promises",
              message:
                "fs/promises is server-only. Read in a server component and pass via props.",
            },
            {
              name: "path",
              message:
                "path is server-only. Compute paths in lib/data.ts and pass values down.",
            },
          ],
          patterns: [
            {
              group: ["../../../*", "../../../../*"],
              message:
                "Reach across more than two directory levels via the `@/` alias instead of long relative paths.",
            },
          ],
        },
      ],
    },
  },
  // Server-only modules may import fs / path freely.
  {
    files: ["src/lib/data.ts", "src/lib/monitoring.ts", "src/app/**/route.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Test files — Playwright fixtures sometimes need any-typed args.
  {
    files: ["tests/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
