import {
  transform as nativeTransform,
} from '@babel/core';
import test from 'ava';
import plugin from '../src';

const transform = (code, filename = 'unset.js') => {
  return nativeTransform(code, {
    babelrc: false,
    filename,
    plugins: [
      plugin,
    ],
  }).code.replace(/\n/gu, ' ').replace(/\s+/gu, ' ');
};

test('exporting an arrow function with a safe file name: uses the file name to create an export variable', (t) => {
  const actual = transform('export default () => {};', 'foo.js');
  const expected = 'const foo = () => {}; export default foo;';

  t.is(actual, expected);
});

test('exporting an arrow function with an unsafe file name: sanitizes the file name using camelCase', (t) => {
  const actual = transform('export default () => {};', 'foo bar.js');
  const expected = 'const fooBar = () => {}; export default fooBar;';

  t.is(actual, expected);
});

test('exporting an arrow function with a file name that matches an existing variable: derives a new name using an incremental index', (t) => {
  const actual = transform('const foo = true; export default () => {};', 'foo.js');
  const expected = 'const foo = true; const foo0 = () => {}; export default foo0;';

  t.is(actual, expected);
});

test('exporting an arrow function with an invalid file name: derives a new name using an underscore', (t) => {
  const actual = transform('export default () => {};', '1.js');
  const expected = 'const _1 = () => {}; export default _1;';

  t.is(actual, expected);
});

test('exporting an arrow function with a conflicting invalid file name: derives a new name using an underscore and index', (t) => {
  const actual = transform('const _1 = true; export default () => {};', '1.js');
  const expected = 'const _1 = true; const _10 = () => {}; export default _10;';

  t.is(actual, expected);
});

test('exporting an arrow function with a file name that matches an existing variable: derives a new name using an incremental index (multiple iterations)', (t) => {
  const actual = transform('const foo = true;\nconst foo0 = true; export default () => {};', 'foo.js');
  const expected = 'const foo = true; const foo0 = true; const foo1 = () => {}; export default foo1;';

  t.is(actual, expected);
});

test('exporting an arrow function with "index" file name: uses the directory name', (t) => {
  const actual = transform('export default () => {};', 'foo/index.js');
  const expected = 'const foo = () => {}; export default foo;';

  t.is(actual, expected);
});

test('exporting an async arrow function', (t) => {
  const actual = transform('export default async () => {};', 'foo/index.js');
  const expected = 'const foo = async () => {}; export default foo;';

  t.is(actual, expected);
});

test('exporting an anonymous async function', (t) => {
  const actual = transform('export default async function () {}', 'foo.js');
  const expected = 'const foo = async function () {}; export default foo;';

  t.is(actual, expected);
});

test('exporting an anonymous class: uses the file name to create an export variable', (t) => {
  const actual = transform('export default class {}', 'Foo.js');
  const expected = 'const Foo = class {}; export default Foo;';

  t.is(actual, expected);
});

const fixtures = [
  '[];',
  '\'a string\';',
  '1;',
  'true;',
  'new String("foo");',
  'null;',
  'class Foo {}',
  'function foo() {}',
];

for (const fixture of fixtures) {
  test('exporting ' + fixture + ' does not transform code', (t) => {
    t.is(transform('export default ' + fixture), 'export default ' + fixture);
  });
}
