# Repair cloud lockfile build

- **Date:** 2026-07-31 14:30
- **Developer:** Codex
- **Topic:** deployment

## Request
Investigate and repair the cloud deployment failure where npm 10 rejects the committed lockfile because `gcp-metadata@5.3.0` is missing.

## What was done
Read the relevant project decisions and the previous foundation session. Confirmed the deployment fails during dependency installation, before the application build starts. Found that the MongoDB driver declares `gcp-metadata` as an optional peer dependency and the current lockfile does not include it. Ran npm 10.9.7 lockfile regeneration and clean-install dry run locally; neither changed nor rejected the current lockfile.

## Notable findings
The cloud log reports `engines.node` as unspecified, but the current local `package.json` declares `>=20.19.0`. More decisively, the local Git branch has no commits and every project file is untracked, so the deployment cannot be building this workspace state. The logged failure belongs to an older or different remote revision.

## Open threads
Commit and push the current project state to the branch configured in the deployment service, then trigger a new deployment. Confirm the deployment service is connected to `debojyoti/webhook-switchboard` and the expected branch.
