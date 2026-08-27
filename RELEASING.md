# Releasing AiEditor

## One-time setup

1. Push the current repository history to `aieditor-team/aieditor` on GitHub and make `main` the default branch.
2. Create a protected GitHub Environment named `npm` for the publish job.
3. On npmjs.com, add a trusted publisher for the `aieditor` package with repository `aieditor-team/aieditor`, workflow `release.yml`, and environment `npm`.
4. Do not configure an `NPM_TOKEN`; the workflow publishes through GitHub OIDC.
5. Require the CI workflow to pass before changes can merge into `main`.
6. Enable private vulnerability reporting and CodeQL code scanning for the GitHub repository.

## Release checklist

1. Update `package.json` and `package-lock.json` to the release version.
2. Move the matching changelog section out of `Unreleased` and add the release date.
3. Run `npm ci`, `npm run ci`, and `npm publish --dry-run` with the Node.js version in `.nvmrc`.
4. Commit the release preparation and merge it into `main`.
5. Create and push tag `v<package version>` from that commit. Do not move or reuse a published tag.
6. Wait for the `Publish npm` workflow to succeed and verify the version on npmjs.com.
7. Create the GitHub Release for the same tag only after npm publication succeeds.

The tag push starts the release workflow. It verifies that the tag is exactly `v<package version>` and that the
tagged commit is contained in `main`. Prerelease versions publish under the npm `next` tag; stable versions publish
under `latest`. npm provenance is attached automatically.

The workflow intentionally publishes with lifecycle scripts disabled after `npm run ci` has built and verified the exact package contents. This prevents a second build from producing artifacts different from those already tested.

If the workflow fails before npm publication, fix the cause and publish a new version from a new tag. npm versions are
immutable; never overwrite a version that reached the registry. A GitHub Release is deliberately not created by the
workflow so a failed npm publication cannot leave a public release that points to an unavailable package.
