module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  rules: {},
  ignoreFiles: ['dist/**/*', 'node_modules/**/*', 'public/**/*', 'android/**/*', 'src-tauri/**/*'],
}; 