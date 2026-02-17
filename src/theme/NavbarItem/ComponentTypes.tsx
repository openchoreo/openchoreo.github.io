import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import GitHubStars from '@site/src/components/common/GitHubStars';
import VersionAwareModulesLink from '@site/src/components/common/VersionAwareModulesLink';

// Refer: https://github.com/facebook/docusaurus/issues/7227

export default {
  ...ComponentTypes,
  'custom-gitHubStars': GitHubStars,
  'custom-versionAwareModulesLink': VersionAwareModulesLink,
};
