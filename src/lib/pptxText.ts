import JSZip from 'jszip';

// pptx is a zip of XML; each slide's text runs live in ppt/slides/slideN.xml as <a:t>...</a:t>.
// ponytail: regex-based XML text extraction, not a real XML parser — good enough for plain text runs,
// breaks on nested/escaped edge cases. Upgrade to DOMParser if slides start producing garbled output.
const TEXT_RUN = /<a:t>([\s\S]*?)<\/a:t>/g;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Extracts the visible text of each slide in a .pptx file, in slide order. */
export async function extractPptxText(file: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(file);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)![1]);
      const nb = Number(b.match(/slide(\d+)\.xml/)![1]);
      return na - nb;
    });

  const slides: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async('text');
    const runs = [...xml.matchAll(TEXT_RUN)].map((m) => decodeXmlEntities(m[1]));
    slides.push(runs.join(' ').replace(/\s+/g, ' ').trim());
  }
  return slides;
}
