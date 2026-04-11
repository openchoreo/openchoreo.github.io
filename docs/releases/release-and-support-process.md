---
title: Release and Support Process
---

# Overview

OpenChoreo uses an open, community-first release model. Version numbers are expressed using the `x.y.z` format, where `x` represents the major version, `y` the minor version, and `z` the patch version, in accordance with [semantic versioning](https://semver.org/) terminology.

We publish minor releases on a regular basis and maintain community support for the most recent **three** minor release lines. Patch releases are published on a cadence-based schedule for supported release lines, with additional out-of-band patch releases when required for critical issues.

This page describes release cadence, supported versions, planned future releases, patching policy, maintenance mode, and end-of-life expectations for community-supported versions.

# Release Status Definitions

| Status | Meaning |
| :---- | :---- |
| Actively Supported | The release line is eligible for regular patch releases. Applicable fixes may be backported based on severity, risk, and feasibility. |
| Maintenance Mode | The release line is nearing end of life. Patch releases may still be published, but only for a narrow set of issues such as critical security vulnerabilities, dependency or base-image updates, and critical core issues. |
| End of Life (EOL) | The release line is no longer supported. No further patch releases are planned. Users should upgrade to a newer supported minor release. |

# Release Cadence

OpenChoreo aims to publish new minor releases as and when needed during the early phase of the project. Release cadence will be more regular once the project enters the mature phase. Once a new minor release becomes generally available, community support continues for the latest three minor release lines.

This "latest three minors" rule is the controlling rule for community support. When a new minor release is published, the oldest previously supported minor release line exits active support and moves to end-of-life according to the published schedule. The project will keep the EOL dates updated well in advance with future release planning.

# Supported Minor Releases

Community support is provided for the latest three minor release lines. Publish exact dates for each supported line so users can plan upgrades confidently.

| Minor release | GA date | Latest patch | Status | Maintenance mode starts | End of life |
| :---- | :---- | :---- | :---- | :---- | :---- |
| v1.0 | 2026-Mar-23 | v1.0.0 | Actively Supported | TBD | TBD |

# Planned Future Minor Releases

Planned dates are targets and may move based on release readiness. Any date changes should be reflected on this page and in release announcements.

| Upcoming release | Target release date | Status |
| :---- | :---- | :---- |
| v1.1 | 2026-May | Planning |

# Patch Releases

Patch releases are intended to deliver targeted important bug fixes, including security fixes, for supported release lines.

Patch releases are normally published on a **monthly** cadence. The earliest patch releases after a new minor release may happen faster. Additional out-of-band patch pre-releases (postfixed with `-hotfix.n`) may be published when required to address critical issues. Support for these pre-releases will end once the next patch release is released.

Patch release timing may also be adjusted around major holiday periods, release readiness concerns, or urgent security needs.

# Upgrade Guidance

Users are encouraged to stay current with supported minor releases and to adopt the latest available patch release on their chosen supported minor line. To reduce upgrade risk, users should upgrade to the latest patch release of their current minor version before moving to the next minor version.
