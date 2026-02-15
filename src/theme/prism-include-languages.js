import siteConfig from '@generated/docusaurus.config';

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: {prism},
  } = siteConfig;
  const {additionalLanguages} = prism;

  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;

  // Static requires needed because Rspack (future.v4) can't resolve
  // dynamic require(`prismjs/components/prism-${lang}`) at build time.
  // Add a branch here for each language in additionalLanguages.
  additionalLanguages.forEach((lang) => {
    if (lang === 'bash') {
      require('prismjs/components/prism-bash');
    }
  });

  delete globalThis.Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismBefore;
  }
}
