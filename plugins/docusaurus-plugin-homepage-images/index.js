const fs = require('fs');
const path = require('path');

// Widths generated for every raster screenshot in /img/homepage/. Keep in sync
// with RESPONSIVE_WIDTHS in src/components/WhatIsOpenChoreo/index.tsx.
const WIDTHS = [800, 1600];
const RASTER = /\.(png|jpe?g)$/i;

// Embedded raster images in an SVG are kept at this multiple of the size they
// are drawn at, so they stay sharp when the diagram is expanded to full width
// on a high-density screen.
const EMBEDDED_SCALE = 4;

// After a production build, make the homepage feature images lighter:
//
// - Raster screenshots get WebP copies at each width, written next to the
//   original as `<image>.w<width>.webp`. The homepage references them through
//   srcset for the inline previews. The originals are untouched and are still
//   what the full-width (expanded) view loads.
// - SVG diagrams exported from Excalidraw embed every logo as a full-size PNG.
//   Each embedded PNG is re-encoded as WebP at EMBEDDED_SCALE times the largest
//   size it is drawn at. Only the copy in the build output is changed, so a
//   fresh export from Excalidraw is optimised on the next build as well.
module.exports = function pluginHomepageImages() {
  return {
    name: 'docusaurus-plugin-homepage-images',

    async postBuild({ outDir }) {
      const sharp = require('sharp');
      const dir = path.join(outDir, 'img', 'homepage');
      if (!fs.existsSync(dir)) return;

      let thumbnails = 0;
      let svgSaved = 0;
      for (const file of fs.readdirSync(dir)) {
        const input = path.join(dir, file);

        if (RASTER.test(file)) {
          for (const width of WIDTHS) {
            await sharp(input)
              .resize({ width, withoutEnlargement: true })
              .webp({ quality: 80 })
              .toFile(`${input}.w${width}.webp`);
            thumbnails++;
          }
        } else if (file.toLowerCase().endsWith('.svg')) {
          svgSaved += await shrinkEmbeddedImages(sharp, input);
        }
      }

      console.log(
        `[homepage-images] Generated ${thumbnails} WebP images; ` +
          `embedded images in SVGs reduced by ${Math.round(svgSaved / 1024)} KB`,
      );
    },
  };
};

// Re-encode the PNG and JPEG images embedded in an SVG as WebP, sized to how
// large they are drawn. Returns the number of bytes saved.
async function shrinkEmbeddedImages(sharp, file) {
  const svg = fs.readFileSync(file, 'utf-8');

  // Excalidraw defines each image once as a <symbol> and draws it with <use>
  // elements, each with its own width and height in the SVG's user units.
  const drawnSize = new Map();
  for (const [, id, w, h] of svg.matchAll(
    /<use href="#([^"]+)" width="([\d.]+)" height="([\d.]+)"/g,
  )) {
    const size = drawnSize.get(id) ?? { width: 0, height: 0 };
    size.width = Math.max(size.width, Number(w));
    size.height = Math.max(size.height, Number(h));
    drawnSize.set(id, size);
  }

  const symbols = [
    ...svg.matchAll(
      /<symbol id="([^"]+)"><image href="(data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/=]+))"/g,
    ),
  ];
  if (symbols.length === 0) return 0;

  let output = svg;
  for (const [, id, dataUri, base64] of symbols) {
    const size = drawnSize.get(id);
    // Leave images that are never drawn, or whose size is unknown, as they are.
    if (!size) continue;

    const webp = await sharp(Buffer.from(base64, 'base64'))
      .resize({
        width: Math.ceil(size.width * EMBEDDED_SCALE),
        height: Math.ceil(size.height * EMBEDDED_SCALE),
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const encoded = webp.toString('base64');
    if (encoded.length >= base64.length) continue;

    output = output.split(dataUri).join(`data:image/webp;base64,${encoded}`);
  }

  fs.writeFileSync(file, output);
  return svg.length - output.length;
}
