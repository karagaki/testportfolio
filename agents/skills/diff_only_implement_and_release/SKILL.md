# Skill: diff_only_implement_and_release

## Purpose
- Guarantee a minimal surface-area implementation that respects the READ ONLY/DIFF ONLY practices, brings UI updates along with logic, and closes with the required manifest bump and release output.

## Inputs
- files: <comma-separated list of the 2~3 target files>
- goal: <summary of desired change in 1 line>
- check: <optional verification steps or smoke tests>

## Workflow
1. Confirm the listed files and their current behavior before editing.
2. Apply the requested changes in DIFF ONLY mode, keeping the touch set to the approved files.
3. If the change affects UI, finish both the logic and UI parts in the same pass.
4. When `manifest.json` exists, increment the patch version by one (keep `version_name` aligned).
5. Present the git diff for review.
6. Write a DONE summary covering the change, verification, and impact.

## Success checklist
- [ ] Changed files are limited to the provided scope (≤3 files).
- [ ] No unrequested refactors, formatting, or deletions were performed.
- [ ] Git diff is shown clearly.
- [ ] `manifest.json` received a patch bump (if the file exists).
- [ ] START/DONE commits follow the naming conventions.
