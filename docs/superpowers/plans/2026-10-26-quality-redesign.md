# Quality workspace redesign implementation plan

**Goal:** Redesign only the quality workspace so operators can see batch qualification, run either inspection and act on the same sample's combined decision.

**Architecture:** Preserve APIs, evidence identity, model settings and mounted tab state. JointQualityPanel keeps its existing request ownership and provides an overview plus a two-column workspace around its children. Styles are scoped to the quality workspace.

**Tech Stack:** Existing React 18, Vite, CSS, Playwright fixtures. No new dependencies or subagents.

**Design:** Light neutral background, white work panels, dark teal primary action; green qualified, amber unqualified, blue-gray pending, with explicit text labels. Four batch metrics lead. A shared sample selector precedes the inspection tabs. Detection occupies the left; selected-sample decision, handling and defect distribution occupy the right. Source and simulation context remain visible. No invented metrics, trends or device readiness.

## Tasks

- [x] Restructure JointQualityPanel and QualityWorkspace around the overview, sample association and two-column desk. Keep each tab mounted and hidden when inactive.
- [x] Compact visual setup into a horizontal upload workflow; collapse single-image statistics and cause investigation details. Preserve model controls, calibration, error handling and previews.
- [x] Apply scoped type, spacing, status, focus and responsive styles; verify empty, detected, qualified, unqualified and narrow-screen states.
- [x] Run quality browser regressions, adapt assertions only for intentional layout changes, build, and verify served HTML/JS/CSS through HTTP. Capture desktop/mobile fixture states. No backend change or restart.

## Review focus

Empty/loading/error must not display made-up percentages. Switching samples must clear the previous image. Source identity, simulation notices and unconfirmed root causes must stay visible or accessible. Tablet and mobile must not overflow. Collapsed controls must remain reachable by keyboard.

## Verification

75 frontend/browser checks passed; production build passed. Tests cover persistence across navigation/reload, identity changes, incomplete evidence, known and unknown defects, missing models, source scoping, disclosure access, desktop panel placement and 390px overflow. Screenshots use isolated test fixtures and do not represent live account production metrics. Evidence is in `output/quality-classification-20261026/redesign-frontend-final.txt`, `redesign-build.txt`, and the existing fixture screenshot paths.

Live HTML, JavaScript and CSS returned HTTP 200 and the stylesheet contains the new layout. Automatic approval review blocked the separate live-browser screenshot command with only `blocked by policy`; no live screenshot or authenticated account inspection is claimed. Backend and model behavior were preserved.
