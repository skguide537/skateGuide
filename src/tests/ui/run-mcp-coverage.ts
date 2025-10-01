/**
 * MCP Coverage Runner
 * Simple script to run MCP full site coverage analysis
 */

import { chromium } from '@playwright/test';
import { MCPFullCoverageTester } from './mcp-full-coverage';
import fs from 'fs';
import path from 'path';

async function runMCPCoverage() {
  console.log('🚀 Starting MCP Full Site Coverage Analysis...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    // Create coverage tester
    const coverageTester = new MCPFullCoverageTester(page);

    // Try route list mode first
    const routesFile = process.env.MCP_ROUTES || path.join(process.cwd(), 'src', 'tests', 'ui', 'mcp-routes.txt');
    const routes: string[] = fs.existsSync(routesFile)
      ? fs.readFileSync(routesFile, 'utf-8')
          .split(/\r?\n/)
          .map((l: string) => l.trim())
          .filter((l: string) => l && !l.startsWith('#'))
      : [];

    let coverageReport: any;

    if (routes.length > 0) {
      console.log(`📄 Using routes file: ${routesFile}`);
      const pages: any[] = [];

      for (const route of routes) {
        const pathOnly = route.startsWith('/') ? route : `/${route}`;
        const url = route.startsWith('http') ? route : `${baseURL}${pathOnly}`;
        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
          const pageCoverage = await (coverageTester as any).analyzePageCoverage(pathOnly, pathOnly === '/' ? 'Home Page' : pathOnly);
          pages.push(pageCoverage);
          console.log(`✅ Scanned ${url}`);
        } catch (err: any) {
          console.log(`⚠️ Failed to scan ${url}: ${err?.message || err}`);
        }
      }

      const overallTotal = pages.length > 0
        ? pages.reduce((sum, p) => sum + (p.coverage || 0), 0) / pages.length
        : 0;

      coverageReport = {
        pages,
        components: [],
        userFlows: [],
        accessibility: { overall: 0, wcag: { violations: [] }, keyboard: {}, screenReader: {} },
        performance: { overall: 0, metrics: [], thresholds: [] },
        overall: {
          total: overallTotal,
          pages: overallTotal,
          components: 0,
          userFlows: 0,
          accessibility: 0,
          performance: 0,
          issues: 0,
          recommendations: []
        }
      };

      // Attach report to tester so summary/export work
      (coverageTester as any).coverageReport = coverageReport;
    } else {
      // Fallback to tester's full crawl if no routes file is present
      console.log('📊 Generating comprehensive coverage report (no routes file found)...');
      coverageReport = await coverageTester.generateFullCoverage();
    }

    // Generate summary
    const summary = coverageTester.generateCoverageSummary();
    console.log('\n' + summary);

    // Export detailed report
    const coverageJson = coverageTester.exportCoverageReport();
    
    // Save report to file
    const reportDir = path.join(process.cwd(), 'test-results', 'mcp-coverage');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `coverage-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, coverageJson);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Generate recommendations
    console.log('\n💡 Coverage Recommendations:');
    for (const recommendation of coverageReport.overall.recommendations) {
      console.log(`   • ${recommendation}`);
    }
    
    // Generate test recommendations
    console.log('\n🧪 Test Generation Recommendations:');
    
    // Page test recommendations
    const lowCoveragePages = coverageReport.pages.filter((p: any) => p.coverage < 80);
    if (lowCoveragePages.length > 0) {
      console.log('\n📄 Pages needing more tests:');
      for (const page of lowCoveragePages) {
        console.log(`   • ${page.title}: ${page.coverage.toFixed(1)}% coverage`);
        console.log(`     - Add tests for ${page.interactions.length} interactions`);
        console.log(`     - Fix ${page.issues.length} accessibility issues`);
      }
    }
    
    // Component test recommendations
    const lowCoverageComponents = coverageReport.components.filter((c: any) => c.coverage < 80);
    if (lowCoverageComponents.length > 0) {
      console.log('\n🧩 Components needing more tests:');
      for (const component of lowCoverageComponents) {
        console.log(`   • ${component.name}: ${component.coverage.toFixed(1)}% coverage`);
        console.log(`     - Add tests for ${component.states.length} states`);
        console.log(`     - Add tests for ${component.props.length} props`);
        console.log(`     - Add tests for ${component.interactions.length} interactions`);
      }
    }
    
    // User flow test recommendations
    const lowCoverageFlows = coverageReport.userFlows.filter((f: any) => f.coverage < 80);
    if (lowCoverageFlows.length > 0) {
      console.log('\n🔄 User flows needing more tests:');
      for (const flow of lowCoverageFlows) {
        console.log(`   • ${flow.name}: ${flow.coverage.toFixed(1)}% coverage`);
        console.log(`     - Add tests for ${flow.steps.length} steps`);
        console.log(`     - Add tests for ${flow.edgeCases.length} edge cases`);
      }
    }
    
    // Accessibility recommendations
    if (coverageReport.accessibility.overall < 80) {
      console.log('\n♿ Accessibility improvements needed:');
      console.log(`   • Overall accessibility: ${coverageReport.accessibility.overall.toFixed(1)}%`);
      console.log(`   • WCAG violations: ${coverageReport.accessibility.wcag.violations.length}`);
      console.log(`   • Keyboard navigation: ${coverageReport.accessibility.keyboard.navigable} elements`);
      console.log(`   • Screen reader support: ${coverageReport.accessibility.screenReader.landmarks} landmarks`);
    }
    
    // Performance recommendations
    if (coverageReport.performance.overall < 80) {
      console.log('\n⚡ Performance improvements needed:');
      console.log(`   • Overall performance: ${coverageReport.performance.overall.toFixed(1)}%`);
      for (const metric of coverageReport.performance.metrics) {
        console.log(`   • ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.status})`);
      }
    }
    
    console.log('\n✅ MCP Full Site Coverage Analysis Complete!');
    console.log(`📊 Overall Coverage: ${coverageReport.overall.total.toFixed(1)}%`);
    console.log(`📄 Pages: ${coverageReport.pages.length}`);
    console.log(`🧩 Components: ${coverageReport.components.length}`);
    console.log(`🔄 User Flows: ${coverageReport.userFlows.length}`);
    console.log(`♿ Accessibility: ${coverageReport.accessibility.overall.toFixed(1)}%`);
    console.log(`⚡ Performance: ${coverageReport.performance.overall.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error during MCP coverage analysis:', error);
  } finally {
    await browser.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMCPCoverage().catch(console.error);
}

module.exports = { runMCPCoverage };
