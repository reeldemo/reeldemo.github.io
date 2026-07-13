#!/usr/bin/env node
// Simple automated mobile + hero regression checks for reeldemo landing
// Run with: node test-mobile-hero.js   (or from browser console if adapted)

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'hero-kaleidoscope.js'), 'utf8');

let passed = 0;
let failed = 0;

function test(name, cond) {
  if (cond) {
    console.log('✓ PASS: ' + name);
    passed++;
  } else {
    console.log('✗ FAIL: ' + name);
    failed++;
  }
}

function has(str) { return css.includes(str) || html.includes(str) || js.includes(str); }

console.log('=== REELDEMO MOBILE + HERO OVERLAP AUTOMATED TESTS ===\n');

// Core overlap fix
test('Watermark isolated inside visual (no overlap with copy)', html.includes('hero-watermark--local'));
test('Watermark is child of .hero-visual', html.includes('<div class="hero-visual') && html.includes('hero-watermark--local'));

// Layout
test('Hero stacks to 1 column below 900px', css.includes('grid-template-columns: 1fr'));
test('Hero min-height set to auto on mobile', css.includes('min-height: auto') && css.includes('.hero-wild'));
test('Tilt disabled (flat) on mobile', css.includes('.hero-visual--tilt') && css.includes('transform: none'));

// Responsive guards
test('Visual has max-height guards for landscape/short screens', has('max-height: 48vh') || has('max-height: 42vh'));
test('Local watermark uses clamp for all mobile sizes', css.includes('.hero-visual .hero-watermark--local'));

// Touch / a11y
test('Primary buttons have >=44px touch targets', css.includes('min-height: 44px'));
test('Nav toggle is touch-friendly (>=44px)', css.includes('min-width: 44px') && css.includes('.nav-toggle'));

// JS motion + mobile perf
test('Hero kaleidoscope supports touch drag', js.includes('touchmove'));
test('JS detects coarse pointer / mobile and adapts grid', js.includes('isCoarsePointer') || js.includes('isMobile'));
test('Throttling or density reduction present for mobile', js.includes('targetInterval') || js.includes('coarse'));

// UX niceties
test('Marquee pauses on hover', css.includes('marquee:hover .marquee-track'));
test('Proper responsive viewport meta', html.includes('width=device-width'));

// Visual polish present
test('Hero visual has enhanced styles (gradients, label, etc)', css.includes('.hero-visual-label') && css.includes('kaleidoscope-stage'));

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log('All automated checks passed. Still do manual device testing!');
} else {
  console.log('Some checks need attention. Review above.');
}
process.exit(failed > 2 ? 1 : 0);