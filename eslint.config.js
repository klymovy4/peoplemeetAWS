// import js from '@eslint/js'
// import globals from 'globals'
// import reactHooks from 'eslint-plugin-react-hooks'
// import reactRefresh from 'eslint-plugin-react-refresh'
// import tseslint from 'typescript-eslint'
// import { ESLint } from "eslint"


// export default tseslint.config(
//   { ignores: ['dist'] },
//   {
//     extends: [js.configs.recommended, ...tseslint.configs.recommended],
//     files: ['**/*.{ts,tsx}'],
//     languageOptions: {
//       ecmaVersion: 2020,
//       globals: globals.browser,
//     },
//     plugins: {
//       'react-hooks': reactHooks,
//       'react-refresh': reactRefresh,
//     },
//     rules: {
//       ...reactHooks.configs.recommended.rules,
//       'react-refresh/only-export-components': [
//         'warn',
//         { allowConstantExport: true },
//       ],
//     },
//   },
// )

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsParser from '@typescript-eslint/parser'; // Парсер для TypeScript
import tseslint from '@typescript-eslint/eslint-plugin'; // Плагин для TypeScript

// Основная конфигурация
export default {
    extends: [
        js.configs.recommended, // Рекомендуемые правила для JS
        'plugin:@typescript-eslint/recommended', // Рекомендуемые правила для TypeScript
    ],
    parser: tsParser, // Указываем парсер для TypeScript
    parserOptions: {
        ecmaVersion: 2020, // Современный синтаксис
        sourceType: 'module', // Модули ES6
    },
    globals: {
        ...globals.browser, // Глобальные переменные для браузера
    },
    plugins: {
        '@typescript-eslint': tseslint, // Плагин для TypeScript
        'react-hooks': reactHooks, // Плагин для React Hooks
        'react-refresh': reactRefresh, // Плагин для React Refresh
    },
    rules: {
        '@typescript-eslint/no-unused-vars': 'off', // Отключить предупреждения о неиспользуемых переменных
        '@typescript-eslint/explicit-module-boundary-types': 'off', // Не требовать явных типов
        '@typescript-eslint/no-explicit-any': 'off', // Разрешить использование `any`
        'react-hooks/rules-of-hooks': 'warn', // Правила React Hooks
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
    },
    overrides: [
        {
            files: ['**/*.{ts,tsx}'], // Применяем для файлов TypeScript
            rules: {
                'no-console': 'off', // Разрешаем console.log в разработке
            },
        },
    ],
};

