## What changed

<!-- Describe the user-visible outcome and any important implementation choices. -->

## Verification

<!-- List the tests, simulator/device checks, or Maestro flow you ran. -->

- [ ] Tests pass locally or in CI
- [ ] Fresh install still starts empty (no demo data)

## Release title

The PR title controls tagless releases when this PR lands on `main` (squash merge so the title becomes the commit subject):

- `fix: ...` bumps the patch version.
- `feat: ...` bumps the minor version.
- `feat!: ...` (or `feat(scope)!: ...`) bumps the major version.
- Every other title creates no release.

Every PR also gets an ephemeral `pr-<number>` preview release (APK + unsigned IPA) with an Autoloader install bot comment. That tag is deleted when the PR closes. Merges with a release title publish a new `main-latest` build with its own Autoloader link.
