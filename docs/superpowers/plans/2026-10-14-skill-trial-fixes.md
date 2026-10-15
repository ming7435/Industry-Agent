# Skill trial fixes implementation plan

**Goal:** Fix the four reproduced trial/runtime/publication inconsistencies from `output/skill-test-audit-20261014/REPORT.md`.

**Architecture:** Preserve existing trial modes and human publication. Persist review activation in server-controlled skill metadata; support no-alarm virtual scenarios with active-scenario and actual skill-selection checks; make knowledge samples query-sensitive and compare explicit expected evidence; revise recovered machine assessments and synchronize their versions with metrics.

**Tech stack:** Python, pytest, React, node:test, Playwright.

**Constraints:** Work in the current checkout; preserve pre-existing staged/unstaged changes. Back up touched sources. Use temporary skills, local receipts and model/business adapters in tests. No real factory actions, paid models, production storage or deployment.

## Tasks

- [x] Promote the four audit counterexamples into the agent-service suite and confirm failures; add negative cases for fresh/default review rules, unrelated no-alarm events, incorrect evidence expectations and rejected machine assessments.
- [x] Review activation: update `skills/management.py`, `skills/review.py` and draft preparation in `skills/testing.py`. Publication adds `review_enabled: true` in metadata after validated review trials. Preserve legacy automatic candidates; unchanged stock skills remain inactive.
- [x] No-alarm trials: update `skills/machine_testing.py` to expose no-alarm scenarios and normalize missing alarm codes. Claim events only for the active requested virtual scenario, matching device/time and actual diagnosis selector. Verify a no-alarm trial reaches the real publication gate.
- [x] Knowledge samples: update `skills/task_testing.py` to score/filter local reference documents using existing query token coverage; compare optional expected document IDs when supplied, fail completed samples with no query-relevant evidence. Add structured evidence expectations to `SkillTaskSample.jsx` and verify payload/browser behavior. Keep expectation fields out of model input.
- [x] Machine assessment consistency: recompute failed assessments after terminal recovery, version updates and reject incomplete/failed/mismatched assessments on publication. `skills/north_star.py` uses CAS to replace older versions without duplicate counts or stale overwrites. Update old synthetic receipt fixtures to the stricter contract.
- [x] Run the focused regression files, skill suite and affected frontend checks; review diffs, document results and any remaining limitations.

## Review focus

- A manually published rule must stay enabled after a fresh registry reload; an untested/default rule must not add a model call.
- An unrelated event without an alarm must not consume the test's draft.
- Irrelevant references, incorrect expected IDs and contradictory expected status must fail; valid evidence and missing-evidence cases must still work.
- A recovered receipt must update a previously collected metric once; a stale collector must not regress it.
- Missing/false assessment fields, changed dependencies, cancellation, expiry and service restart must continue to prevent publication.

The user has authorized all four fixes. Implement and verify in this session.

## Verification and review results

- The initial four audit counterexamples failed before the fixes. The new regression file is `services/agent-service/tests/test_skill_trial_regressions.py` (23 isolated cases, including parameterized cases).
- Final skill/expert/model-call-economy suite: **516 passed in 64.80s**. Log: `output/skill-test-audit-20261014/final-skill-results.txt`.
- Affected browser coverage: **40 passed**, covering expert editing, multi-skill validation and evolution/review displays. Log: `output/skill-test-audit-20261014/browser-results.txt`.
- Vite build passed; generated monitor entry and new assets are updated. Existing assets were retained. `git diff --check` passed.
- The broader agent-service run during implementation reported **2562 passed, 3 skipped, 1 failed**. Failure: `test_real_http_timeout_recovers_actual_api_result_with_one_submission` in `test_diagnosis_result_recovery.py`. Running that entire file independently then passed **15/15** in 4.52s. The broader run is not reported as fully passing; its intermittent failure's cause was not established. Log: `output/skill-test-audit-20261014/agent-suite-results.txt`.
- Independent review exposed two related defects, both reproduced before fixing: stale concurrent reconciliation could overwrite recovered receipts; old knowledge receipts could permanently block metric synchronization. Final writes now compare the entire pre-query receipt under the file lock. Valid old knowledge receipts are excluded as legacy; corrupt ones still block synchronization. The reviewer reran the three related cases successfully and found no remaining actionable issues.
- Draft metadata now matches publication metadata when goal/version changes. Evolution readiness and the final publication gate share the same complete-assessment check.

## Validation boundaries

Knowledge samples validate lexical query coverage and optional exact expected document IDs. This does not establish semantic correctness or improvement over the previous skill. Tests use isolated model/business adapters and temporary skill/receipt storage; no live factory or paid-model acceptance was performed. No production restart, deployment or Git commit was performed by this task.
