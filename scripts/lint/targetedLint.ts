import { ESLint } from 'eslint'

const DEFAULT_TARGETS = [
  'src/ui/idleVillage/utils/activityCardMapping.ts',
  'tests/unit/idleVillage/activityCardMapping.test.ts',
]

async function run() {
  const cliTargets = process.argv.slice(2).filter(Boolean)
  const targets = cliTargets.length > 0 ? cliTargets : DEFAULT_TARGETS

  const eslint = new ESLint({
    ignore: false,
    cache: false,
    errorOnUnmatchedPattern: false,
  })

  const results = await eslint.lintFiles(targets)
  const formatter = await eslint.loadFormatter('stylish')
  const resultText = formatter.format(results)

  if (resultText.trim().length > 0) {
    console.log(resultText)
  }

  const errorCount = results.reduce((sum, file) => sum + file.errorCount, 0)
  const warningCount = results.reduce((sum, file) => sum + file.warningCount, 0)

  console.log(`ESLint completed – ${errorCount} error(s), ${warningCount} warning(s) across ${results.length} file(s).`)

  if (errorCount > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('[lint] ESLint runner failed.')
  console.error(error)
  process.exitCode = 1
})
