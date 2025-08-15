// eslint.config.js —— 极简可用版（只启用 no-raw-text）
const tsParser = require('@typescript-eslint/parser');
const reactNative = require('eslint-plugin-react-native');

module.exports = [
    // 忽略（取代 .eslintignore）
    {
        ignores: [
            'node_modules/**',
            'android/**',
            'ios/**',
            'dist/**',
            'build/**',
            '.expo/**',
            '.expo-shared/**',
            'coverage/**',
        ],
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        plugins: {
            'react-native': reactNative,
        },
        rules: {
            // ✅ 关键规则：非 <Text> 下禁止裸字符串
            // 你的项目有自定义标题组件 <Title>，把它加入 skip（Text 默认允许）
            'react-native/no-raw-text': ['error', { skip: ['Title'] }],
        },
    },
];
