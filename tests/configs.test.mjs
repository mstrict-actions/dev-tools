import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { format } from 'prettier'
import { createActionConfig } from '../configs/eslint.mjs'
import prettierConfig from '../configs/prettier.mjs'
import vitestConfig from '../configs/vitest.mjs'

/**
 * @param {unknown} value
 * @returns {value is unknown[]}
 */
function isUnknownArray(value) {
  return Array.isArray(value)
}

const rootDirectory = fileURLToPath(new URL('../', import.meta.url))
const baseConfig = resolve(rootDirectory, 'configs/tsconfig.json')

/** @returns {string} */
function createProject() {
  const directory = mkdtempSync(join(tmpdir(), 'action-configs-'))
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}')
  writeFileSync(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      extends: baseConfig,
      compilerOptions: { types: [] },
      include: ['*.ts'],
    }),
  )
  return directory
}

/** @type {readonly [string, string, string][]} */
const failures = [
  [
    'return type',
    'export const sample = () => 1',
    '@typescript-eslint/explicit-function-return-type',
  ],
  [
    'callback return type',
    'export const sample: () => number = () => 1',
    '@typescript-eslint/explicit-function-return-type',
  ],
  [
    'explicit any',
    'export function sample(value: any): unknown { return value }',
    '@typescript-eslint/no-explicit-any',
  ],
  [
    'unsafe any',
    'export function sample(value: any): string { return value.name }',
    '@typescript-eslint/no-unsafe-member-access',
  ],
  [
    'type assertion',
    'export function sample(value: unknown): string { return value as string }',
    '@typescript-eslint/consistent-type-assertions',
  ],
  [
    'non-null assertion',
    'export function sample(value: string | undefined): string { return value! }',
    '@typescript-eslint/no-non-null-assertion',
  ],
  [
    'non-boolean condition',
    'export function sample(value: string): boolean { if (value) { return true } return false }',
    '@typescript-eslint/strict-boolean-expressions',
  ],
  [
    'floating promise',
    'export function sample(): void { Promise.resolve(1) }',
    '@typescript-eslint/no-floating-promises',
  ],
  [
    'void promise',
    'export function sample(): void { void Promise.resolve(1) }',
    '@typescript-eslint/no-floating-promises',
  ],
  [
    'unnecessary async',
    'export async function sample(): Promise<number> { return 1 }',
    '@typescript-eslint/require-await',
  ],
  [
    'incomplete switch',
    "export function sample(value: 'a' | 'b'): number { switch (value) { case 'a': { return 1 } } return 0 }",
    '@typescript-eslint/switch-exhaustiveness-check',
  ],
]

for (const [name, source, ruleId] of failures) {
  await test(`ESLint rejects ${name} in a consumer project`, async () => {
    const directory = createProject()
    try {
      const path = join(directory, 'sample.ts')
      writeFileSync(path, source)
      const eslint = new ESLint({
        cwd: directory,
        overrideConfigFile: true,
        overrideConfig: createActionConfig({ rootDirectory: directory }),
      })
      const [result] = await eslint.lintFiles([path])
      assert.ok(result !== undefined)
      assert.ok(result.messages.some((message) => message.ruleId === ruleId))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
}

await test('ESLint accepts as const, satisfies and an exhaustive default', async () => {
  const directory = createProject()
  try {
    const path = join(directory, 'sample.ts')
    writeFileSync(
      path,
      "export function sample(value: 'a' | 'b'): number { const choices = [1, 2] as const satisfies readonly number[]; switch (value) { case 'a': { return choices[0] } default: { return choices[1] } } }",
    )
    const eslint = new ESLint({
      cwd: directory,
      overrideConfigFile: true,
      overrideConfig: createActionConfig({ rootDirectory: directory }),
    })
    const [result] = await eslint.lintFiles([path])
    assert.equal(result?.errorCount, 0, JSON.stringify(result?.messages))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

await test('TypeScript inherits strict checks while include stays local', () => {
  const directory = createProject()
  try {
    writeFileSync(
      join(directory, 'sample.ts'),
      'export const length = ["a"][0].length\nexport const options: { token?: string } = { token: undefined }',
    )
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(import.meta.resolve('typescript/bin/tsc')),
        '--project',
        join(directory, 'tsconfig.json'),
      ],
      { encoding: 'utf8' },
    )
    assert.equal(result.status, 2)
    assert.match(result.stdout, /TS2532/)
    assert.match(result.stdout, /TS2375/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

await test('Prettier applies the shared style', async () => {
  const formatted = await format('const greeting = "Hello";', {
    ...prettierConfig,
    parser: 'typescript',
  })
  assert.equal(formatted, "const greeting = 'Hello'\n")
})

await test('Vitest covers source modules with four 100% thresholds', () => {
  const coverage = vitestConfig.test?.coverage
  assert.ok(coverage !== undefined)
  assert.deepEqual(coverage.include, ['src/**/*.ts'])
  assert.deepEqual(coverage.exclude, ['src/index.ts'])
  assert.deepEqual(coverage.thresholds, {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  })
})

await test('Package includes every exported config without a build', () => {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: rootDirectory,
    encoding: 'utf8',
  })
  // Parse the command output as unknown before checking its public shape.
  /** @type {unknown} */
  const packages = JSON.parse(output)
  assert.ok(isUnknownArray(packages))
  const [metadata] = packages
  assert.ok(
    typeof metadata === 'object' && metadata !== null && 'files' in metadata,
  )
  /** @type {unknown} */
  const files = metadata.files
  assert.ok(isUnknownArray(files))
  for (const expected of [
    'configs/eslint.mjs',
    'configs/prettier.mjs',
    'configs/vitest.mjs',
    'configs/tsconfig.json',
  ]) {
    assert.ok(
      files.some(
        (file) =>
          typeof file === 'object' &&
          file !== null &&
          'path' in file &&
          file.path === expected,
      ),
    )
  }
})

await test('Installed JS exports retain JSDoc types without a build', () => {
  const directory = createProject()
  try {
    const nodeModules = join(directory, 'node_modules')
    mkdirSync(nodeModules)
    for (const name of readdirSync(join(rootDirectory, 'node_modules'))) {
      if (!name.startsWith('.')) {
        symlinkSync(
          join(rootDirectory, 'node_modules', name),
          join(nodeModules, name),
          'dir',
        )
      }
    }
    const packageDirectory = join(nodeModules, '@mstrict-actions/dev-tools')
    mkdirSync(packageDirectory, { recursive: true })
    execFileSync('npm', ['pack', '--pack-destination', directory, '--silent'], {
      cwd: rootDirectory,
    })
    execFileSync('tar', [
      '-xzf',
      join(directory, 'mstrict-actions-dev-tools-1.0.0.tgz'),
      '-C',
      packageDirectory,
      '--strip-components=1',
    ])
    writeFileSync(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        extends: '@mstrict-actions/dev-tools/tsconfig.json',
        compilerOptions: { types: [] },
        include: ['*.mjs'],
      }),
    )
    const entry = join(directory, 'eslint.config.mjs')
    writeFileSync(
      entry,
      "import { createActionConfig } from '@mstrict-actions/dev-tools/eslint'; export default createActionConfig({ rootDirectory: '.' })",
    )
    const args = [
      fileURLToPath(import.meta.resolve('typescript/bin/tsc')),
      '--project',
      join(directory, 'tsconfig.json'),
    ]
    const valid = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(valid.status, 0, valid.stdout + valid.stderr)
    writeFileSync(
      entry,
      "import { createActionConfig } from '@mstrict-actions/dev-tools/eslint'; export default createActionConfig({ rootDirectory: 42 })",
    )
    const invalid = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(invalid.status, 2)
    assert.match(invalid.stdout, /TS2322/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
