/**
 * Standalone Node.js script & module to generate pixel-perfect PDFs from HTML using Puppeteer.
 * Treats all input fields as strings, preserving 100% of formatting, alignments, and styles.
 * 
 * Usage from terminal:
 *   node "pdf generation/generateReportPdf.js" [reportId] [outputPath]
 * Example:
 *   node "pdf generation/generateReportPdf.js" REP-2026-088 output.pdf
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// Find browser executable
function getExecutablePath() {
  const possiblePaths = [
    'C:\\Users\\Adina\\.cache\\puppeteer\\chrome\\win64-154.0.8037.57\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Builds the HTML content by replacing string placeholders with provided values.
 * Unprovided values safely fall back to "Not Available" or default template strings.
 */
export function buildHtml(templatePath, stringData = {}) {
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace each provided key or fallback
  for (const [key, value] of Object.entries(stringData)) {
    const token = key.startsWith('{{') ? key : `{{${key}}}`;
    html = html.split(token).join(String(value ?? 'Not Available'));
  }

  // Replace any leftover {{...}} with 'Not Available'
  html = html.replace(/\{\{[A-Z0-9_]+\}\}/g, 'Not Available');

  return html;
}

/**
 * Generates an exact A4 PDF from the HTML template.
 */
export async function generatePdf(templatePath, stringData = {}, outputPath = null) {
  const html = buildHtml(templatePath, stringData);
  const execPath = getExecutablePath();

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  if (execPath) launchOptions.executablePath = execPath;

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    if (outputPath) {
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`[+] PDF successfully written to: ${outputPath} (${pdfBuffer.length} bytes)`);
    }

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// CLI execution check
if (process.argv[1] && process.argv[1].endsWith('generateReportPdf.js')) {
  const templatePath = path.resolve('pdf generation/CyberVision_AI_Incident_Investigation_Report_.html');
  const reportId = process.argv[2] || 'REP-2026-088';
  const outPath = process.argv[3] || path.resolve(`pdf generation/${reportId}.pdf`);

  console.log(`[*] Generating PDF for ${reportId}...`);
  generatePdf(templatePath, { REPORT_ID: reportId, INCIDENT_ID: 'CAS-2026-004' }, outPath)
    .then(() => console.log('[*] Done!'))
    .catch(err => {
      console.error('[!] Error generating PDF:', err);
      process.exit(1);
    });
}
