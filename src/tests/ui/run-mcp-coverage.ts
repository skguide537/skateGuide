/**
 * MCP Coverage Runner
 * Simple script to run MCP full site coverage analysis
 */

import { chromium } from '@playwright/test';
import { MCPFullCoverageTester } from './mcp-full-coverage';

async function runMCPCoverage() {
  console.log('🚀 Starting MCP Full Site Coverage Analysis...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Create coverage tester
    const coverageTester = new MCPFullCoverageTester(page);
    
    // Generate full coverage report
    console.log('📊 Generating comprehensive coverage report...');
    const coverageReport = await coverageTester.generateFullCoverage();
    
    // Generate summary
    const summary = coverageTester.generateCoverageSummary();
    console.log('\n' + summary);
    
    // Export detailed report
    const coverageJson = coverageTester.exportCoverageReport();
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
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
    const lowCoveragePages = coverageReport.pages.filter(p => p.coverage < 80);
    if (lowCoveragePages.length > 0) {
      console.log('\n📄 Pages needing more tests:');
      for (const page of lowCoveragePages) {
        console.log(`   • ${page.title}: ${page.coverage.toFixed(1)}% coverage`);
        console.log(`     - Add tests for ${page.interactions.length} interactions`);
        console.log(`     - Fix ${page.issues.length} accessibility issues`);
      }
    }
    
    // Component test recommendations
    const lowCoverageComponents = coverageReport.components.filter(c => c.coverage < 80);
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
    const lowCoverageFlows = coverageReport.userFlows.filter(f => f.coverage < 80);
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

export { runMCPCoverage };
