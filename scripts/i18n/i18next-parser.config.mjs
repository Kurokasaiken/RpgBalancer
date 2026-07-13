import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  contextSeparator: false,
  createOldCatalogs: false,
  defaultNamespace: 'common',
  defaultValue: '',
  indentation: 2,
  keepRemoved: true,
  keySeparator: '.',
  lineEnding: 'auto',
  locales: ['en'],
  namespaceSeparator: ':',
  output: `${__dirname}/../../public/locales/$LOCALE/$NAMESPACE.json`,
  pluralSeparator: false,
  sort: true,
  verbose: true,
  input: [
    `${__dirname}/../../src/ui/**/*.{ts,tsx}`,
    `!${__dirname}/../../src/ui/**/__tests__/**`,
    `!${__dirname}/../../src/ui/**/*.test.{ts,tsx}`,
    `!${__dirname}/../../src/ui/**/*.spec.{ts,tsx}`,
    `!${__dirname}/../../src/ui/**/__mocks__/**`,
  ],
  lexers: {
    ts: [{ lexer: 'JsxLexer' }],
    tsx: [{ lexer: 'JsxLexer' }],
    js: [{ lexer: 'JsxLexer' }],
    jsx: [{ lexer: 'JsxLexer' }],
    default: [{ lexer: 'JsxLexer' }],
  },
};
