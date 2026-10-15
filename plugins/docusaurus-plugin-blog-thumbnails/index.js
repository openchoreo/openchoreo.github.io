const fs = require('fs');
const path = require('path');

// Widths generated for every raster cover image on the blog index. Keep in sync
// with THUMBNAIL_WIDTHS in src/theme/BlogListPage/index.tsx.
const WIDTHS = [480, 960];
const RASTER = /\.(png|jpe?g|webp)$/i;

// After a production build, create WebP thumbnails for the cover images shown
// on /blog/ and its paginated pages. The blog index references them through srcset as
// `<image>.w<width>.webp`, next to the original. The originals are untouched,
// so blog posts and social previews keep using the full-size images.
module.exports = function pluginBlogThumbnails(context) {
  const baseUrl = context.siteConfig?.baseUrl || '/';

  return {
    name: 'docusaurus-plugin-blog-thumbnails',

    async postBuild({ outDir }) {
      const sharp = require('sharp');
      const blogDir = path.join(outDir, 'blog');
      const pagesDir = path.join(blogDir, 'page');
      // The blog index and its paginated pages (/blog/page/N/).
      const indexPages = [path.join(blogDir, 'index.html')];
      if (fs.existsSync(pagesDir)) {
        for (const page of fs.readdirSync(pagesDir)) {
          indexPages.push(path.join(pagesDir, page, 'index.html'));
        }
      }

      const sources = new Set();
      for (const indexHtml of indexPages.filter((p) => fs.existsSync(p))) {
        const html = fs.readFileSync(indexHtml, 'utf-8');
        for (const [, src] of html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)) {
          if (src.startsWith(baseUrl) && RASTER.test(src)) sources.add(src);
        }
      }

      let generated = 0;
      for (const src of sources) {
        const input = path.join(outDir, decodeURIComponent(src.slice(baseUrl.length)));
        // Fail the build rather than ship srcset entries that point at nothing.
        if (!fs.existsSync(input)) {
          throw new Error(`[blog-thumbnails] Image not found in build output: ${src}`);
        }
        for (const width of WIDTHS) {
          const output = `${input}.w${width}.webp`;
          await sharp(input)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(output);
          generated++;
        }
      }

      console.log(`[blog-thumbnails] Generated ${generated} thumbnails for ${sources.size} images`);
    },
  };
};
