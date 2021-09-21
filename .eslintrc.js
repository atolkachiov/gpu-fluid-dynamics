module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true
  },
  'extends': 'react-app',
  'rules': {
    'semi': 0,
    'no-console': 0,
    // 'quotes': ['error', 'single'],
    // we want to force semicolons
    // 'semi': ['error', 'always'],
    // we use 2 spaces to indent our code
    'indent': ['error', 2],
    // we want to avoid extraneous spaces
    'no-multi-spaces': ['error']
  }
};