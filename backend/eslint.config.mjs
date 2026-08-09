import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**"]
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
        }
    },
    {
        // Express's official pattern for augmenting Request via declaration merging
        // requires a `namespace` block — not a real lint violation here.
        files: ["src/middleware/requireAuth.ts"],
        rules: {
            "@typescript-eslint/no-namespace": "off"
        }
    }
);