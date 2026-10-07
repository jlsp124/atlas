import { refreshBleecker } from './bleecker';
const result = await refreshBleecker({
  apply: !process.argv.includes('--dry-run'),
});
console.log(
  `Bleecker: ${result.manifest.sources.length} sources; ${result.changed.length} changes; ${result.failures.length} fetch failures.`,
);
for (const source of result.manifest.sources)
  console.log(
    `${source.id}: HTTP ${source.httpStatus}; ${source.linkedResources.length} links; ${source.calendarEvents.length} events`,
  );
if (result.failures.length) {
  console.error(result.failures.join('\n'));
  process.exitCode = 1;
}
