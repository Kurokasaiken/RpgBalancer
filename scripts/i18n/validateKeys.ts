import {
  buildReports,
  extractUsedKeys,
  formatKeyUsage,
  loadNamespaces,
} from './keyUtils.ts';

async function validateKeys(): Promise<void> {
  const root = process.argv[2] || 'src/ui';
  const usages = await extractUsedKeys(root);
  const namespaces = await loadNamespaces();
  const reports = buildReports(usages, namespaces);

  let totalMissing = 0;

  for (const report of reports) {
    if (report.missing.length === 0) continue;
    totalMissing += report.missing.length;
    console.error(`\nMissing keys in namespace "${report.namespace}":`);
    for (const usage of report.missing) {
      console.error(formatKeyUsage(usage));
    }
  }

  if (totalMissing > 0) {
    console.error(`\nValidation failed: ${totalMissing} missing key(s) found.`);
    process.exit(1);
  }

  const checkedNamespaces = [...new Set(usages.map((u) => u.namespace))];
  if (checkedNamespaces.length === 0) {
    console.log('No i18n keys found in source. Nothing to validate.');
  } else {
    console.log(
      `Validated keys across ${checkedNamespaces.length} namespace(s): ${checkedNamespaces.join(', ')}.`,
    );
  }
  console.log('All used keys are present in the English locale.');
}

validateKeys().catch((error) => {
  console.error('Unexpected error during validation:', error);
  process.exit(1);
});
