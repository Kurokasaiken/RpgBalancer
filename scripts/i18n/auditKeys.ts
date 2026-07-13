import {
  buildReports,
  extractUsedKeys,
  formatKeyUsage,
  loadNamespaces,
} from './keyUtils.ts';

async function auditKeys(): Promise<void> {
  const root = process.argv[2] || 'src/ui';
  const usages = await extractUsedKeys(root);
  const namespaces = await loadNamespaces();
  const reports = buildReports(usages, namespaces);

  let missingTotal = 0;
  let obsoleteTotal = 0;

  for (const report of reports) {
    console.log(`\nNamespace: ${report.namespace}`);
    console.log(`  Present: ${report.present.length}`);
    console.log(`  Missing: ${report.missing.length}`);
    console.log(`  Obsolete: ${report.obsolete.length}`);

    if (report.missing.length > 0) {
      missingTotal += report.missing.length;
      console.log('  Missing keys:');
      for (const usage of report.missing) {
        console.log(formatKeyUsage(usage));
      }
    }

    if (report.obsolete.length > 0) {
      obsoleteTotal += report.obsolete.length;
      console.log('  Obsolete keys:');
      for (const key of report.obsolete) {
        console.log(`    ${key}`);
      }
    }
  }

  console.log(
    `\nAudit summary: ${missingTotal} missing, ${obsoleteTotal} obsolete across ${reports.length} namespace(s).`,
  );

  if (missingTotal > 0) {
    process.exit(1);
  }
}

auditKeys().catch((error) => {
  console.error('Unexpected error during audit:', error);
  process.exit(1);
});
