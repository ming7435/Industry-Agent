# Agent App Cleanup Design

## Goal

Clean `services/agent-service/app` without removing required business capabilities, and make active Skill configuration fail fast when it references an unavailable tool.

## Functional retention

- Alarm parsing remains in `app/common/alarm.py`; the removed `app/alarm` source was migrated there without losing behavior.
- Experience extraction, admission, deduplication, storage, and RAG writing remain in `app/memory/`; the current implementation reflects the work order repair feedback closure model.
- Trace recording remains in `app/harness/trace.py`; the removed `app/trace` source was migrated there without behavior loss.
- Shared Pydantic contracts remain in `app/contracts.py`, with agent specific validation in each agent package; the current contracts add work order lifecycle and repair fields.
- All tools from the seven root level legacy Skill YAML files remain covered by the 32 active files under `app/skills/{agent}/*.yaml`.

## Cleanup scope

- Remove the ignored cache only directories `app/alarm`, `app/experience`, `app/trace`, and `app/validator`.
- Remove all ignored `__pycache__` directories under `app`.
- Remove the seven tracked legacy root Skill files: `cad_skill.yaml`, `diagnosis_skill.yaml`, `knowledge_skill.yaml`, `maintenance_skill.yaml`, `quality_skill.yaml`, `report_skill.yaml`, and `router_skill.yaml`.
- Keep `app/runtime/ARCHITECTURE_AUDIT.md` because it remains useful architecture documentation.
- Keep all current source directories because they participate in the application, monitor, tool, memory, closure, or work order execution paths.

## Skill validation

`SkillRegistry` will expose validation for the active per agent catalog. Validation will inspect only directories matching the existing `app/skills/{agent}/*.yaml` contract and will reject:

- duplicate Skill names within one agent;
- Skill tool names missing from the supplied Tool Registry tool set.

`AgentContainer` will run this validation after constructing `ToolRegistry`, before constructing agents. Errors must include the agent, Skill, source YAML, and missing tool so configuration failures can be repaired directly.

## Verification

- A focused test will first demonstrate that missing tools and duplicate names are currently not rejected.
- The same test will pass after validation is implemented.
- The real catalog will validate against all registered MCP handler names.
- The complete agent service pytest suite will pass.
- `git status` will show the seven intended tracked deletions and code/test/plan changes only; the user's existing root `README.md` change remains untouched.
