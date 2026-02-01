#!/usr/bin/env node
/**
 * ============================================================================
 * VIBE STACK - Coverage Generator
 * ============================================================================
 * Generates test coverage reports with summaries and trends
 * @version 1.0.0
 * ============================================================================
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const COVERAGE_DIR = join(ROOT_DIR, 'tests/coverage');

/**
 * ANSI color codes
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Print colored output
 */
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Ensure coverage directory exists
 */
function ensureDir() {
  if (!existsSync(COVERAGE_DIR)) {
    mkdirSync(COVERAGE_DIR, { recursive: true });
  }
}

/**
 * Parse coverage from test output
 */
function parseCoverage(output) {
  const lines = output.split('\n');
  const coverage = {};

  for (const line of lines) {
    // Look for file coverage lines
    // Format: File | % | Lines | Uncovered
    const match = line.match(/([^\s|]+)\s+\|\s+(\d+\.?\d*)%\s+\|\s+(\d+)\s+\|\s+(\d+)/);
    if (match) {
      const [, file, percentage, total, uncovered] = match;
      coverage[file] = {
        percentage: parseFloat(percentage),
        total: parseInt(total),
        uncovered: parseInt(uncovered),
        covered: parseInt(total) - parseInt(uncovered)
      };
    }
  }

  return coverage;
}

/**
 * Generate coverage summary
 */
function generateSummary(coverage) {
  const files = Object.keys(coverage);
  const totalLines = files.reduce((sum, f) => sum + coverage[f].total, 0);
  const totalCovered = files.reduce((sum, f) => sum + coverage[f].covered, 0);
  const overallCoverage = totalLines > 0 ? ((totalCovered / totalLines) * 100).toFixed(1) : 0;

  const summary = {
    timestamp: new Date().toISOString(),
    overallCoverage,
    files: files.length,
    totalLines,
    totalCovered,
    totalUncovered: totalLines - totalCovered,
    byFile: coverage
  };

  return summary;
}

/**
 * Print coverage report to console
 */
function printReport(summary) {
  console.log('\n' + colorize('╔════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║' + ' '.repeat(58) + '║', 'cyan'));
  console.log(colorize('║' + colorize('  📊 TEST COVERAGE REPORT', 'bold') + ' '.repeat(38) + '║', 'cyan'));
  console.log(colorize('║' + ' '.repeat(58) + '║', 'cyan'));
  console.log(colorize('╠════════════════════════════════════════════════════════════╣', 'cyan'));

  // Overall coverage
  const overallColor = summary.overallCoverage >= 90 ? 'green' : summary.overallCoverage >= 75 ? 'yellow' : 'red';
  console.log(colorize('║' + ' '.repeat(58) + '║', 'cyan'));
  console.log(colorize('║', 'cyan') + ' Overall Coverage: ' + colorize(`${summary.overallCoverage}%`, overallColor + ' bold') + ' '.repeat(38) + colorize('║', 'cyan'));
  console.log(colorize('║', 'cyan') + ` Files: ${colorize(summary.files.toString(), 'bold')}` + ' '.repeat(48) + colorize('║', 'cyan'));
  console.log(colorize('║', 'cyan') + ` Lines: ${colorize(summary.totalCovered.toLocaleString(), 'bold')} / ${colorize(summary.totalLines.toLocaleString(), 'bold')}` + ' '.repeat(35) + colorize('║', 'cyan'));

  // File breakdown
  console.log(colorize('╠════════════════════════════════════════════════════════════╣', 'cyan'));
  console.log(colorize('║  File' + ' '.repeat(42) + 'Coverage  ║', 'cyan'));
  console.log(colorize('╠════════════════════════════════════════════════════════════╣', 'cyan'));

  for (const [file, data] of Object.entries(summary.byFile)) {
    const fileName = file.split('/').pop().padEnd(45);
    const percentage = data.percentage.toFixed(1).padStart(7);
    const fileColor = data.percentage >= 90 ? 'green' : data.percentage >= 75 ? 'yellow' : 'red';
    console.log(colorize('║ ', 'cyan') + colorize(fileName, 'white') + colorize(' ', 'cyan') + colorize(percentage + '%', fileColor) + colorize(' ║', 'cyan'));
  }

  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'cyan'));

  // Status message
  if (summary.overallCoverage >= 90) {
    console.log('\n' + colorize('✅ Excellent coverage! All critical paths are well tested.', 'green bold') + '\n');
  } else if (summary.overallCoverage >= 75) {
    console.log('\n' + colorize('⚠️  Good coverage, but there\'s room for improvement.', 'yellow bold') + '\n');
  } else {
    console.log('\n' + colorize('❌ Coverage is below threshold. Add more tests!', 'red bold') + '\n');
  }
}

/**
 * Save coverage data for dashboard
 */
function saveCoverageData(summary) {
  const dataPath = join(COVERAGE_DIR, 'coverage-data.json');
  writeFileSync(dataPath, JSON.stringify(summary, null, 2));

  // Also save minimal version for dashboard consumption
  const minimalPath = join(COVERAGE_DIR, 'coverage.json');
  const minimalData = Object.entries(summary.byFile).reduce((acc, [file, data]) => {
    acc[file] = {
      coverage: data.percentage,
      lines: data.total,
      covered: data.covered
    };
    return acc;
  }, {});
  writeFileSync(minimalPath, JSON.stringify(minimalData, null, 2));
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('\n' + colorize('🔄 Generating test coverage report...', 'cyan'));

    ensureDir();

    // Run tests with coverage
    console.log(colorize('📊 Running tests with coverage...', 'cyan'));
    const output = execSync('npm run test:coverage:json', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Parse and generate summary
    const coverage = parseCoverage(output);
    const summary = generateSummary(coverage);

    // Print report
    printReport(summary);

    // Save for dashboard
    saveCoverageData(summary);

    // Open dashboard in browser
    console.log(colorize('📖 Coverage report saved to: tests/coverage/', 'cyan'));
    console.log(colorize('🌐 Opening coverage dashboard...', 'cyan'));

    // In a real implementation, you'd open the browser here
    // For now, just indicate where to find it
    console.log(colorize('   Open: file://' + join(COVERAGE_DIR, 'dashboard.html'), 'blue'));

    process.exit(summary.overallCoverage >= 75 ? 0 : 1);
  } catch (error) {
    console.error(colorize('❌ Error generating coverage:', 'red'), error.message);
    process.exit(1);
  }
}

main();
