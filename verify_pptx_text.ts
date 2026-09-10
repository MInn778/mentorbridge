// Self-check for src/lib/pptxText.ts — builds a minimal in-memory .pptx (zip + slide XML)
// and asserts extraction pulls the right text, in order, without a real PowerPoint file.
// Run: npx tsx verify_pptx_text.ts
import assert from 'node:assert';
import JSZip from 'jszip';
import { extractPptxText } from './src/lib/pptxText';

function slideXml(...texts: string[]) {
  const runs = texts.map((t) => `<a:r><a:t>${t}</a:t></a:r>`).join('');
  return `<?xml version="1.0"?><p:sld xmlns:a="a" xmlns:p="p"><p:cSld><p:spTree><p:sp><p:txBody>${runs}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
}

async function main() {
  const zip = new JSZip();
  zip.file('ppt/slides/slide1.xml', slideXml('Title Slide', 'Subtitle here'));
  zip.file('ppt/slides/slide2.xml', slideXml('Agenda'));
  // out-of-order filenames should still come back sorted by slide number
  zip.file('ppt/slides/slide10.xml', slideXml('Last slide &amp; thanks'));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });

  const slides = await extractPptxText(buf as unknown as Blob);

  assert.strictEqual(slides.length, 3, `expected 3 slides, got ${slides.length}`);
  assert.strictEqual(slides[0], 'Title Slide Subtitle here');
  assert.strictEqual(slides[1], 'Agenda');
  assert.strictEqual(slides[2], 'Last slide & thanks', 'XML entity decoding failed');

  console.log('OK: pptx text extraction —', slides);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
