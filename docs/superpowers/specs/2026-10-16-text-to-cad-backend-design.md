# text-to-cad backend migration

The user requested inspection and direct replacement of the project's FreeCAD backend. This is an architectural migration, authorized for implementation in this checkout. Existing production, model editing, publishing, and quality workflows must remain usable.

## Design

Replace FreeCAD GUI/XML-RPC/MCP execution with bounded, headless Python subprocesses running pinned cadgen and build123d. Only server-owned templates compiled from validated structured specifications may execute. Preserve units, dimensional checks, STEP read-back, exclusive claims, unknown-outcome handling, revision ownership, hashes, and publication transactions.

New models export STEP, STL and standalone editable `model.py`. Durable documents additionally retain a validated `model.json` containing object identities, geometry sources, placements, labels, and visibility. Existing FCStd artifacts remain readable historical downloads; editing migrates from trusted specifications/snapshots where possible and otherwise returns an explicit migration error.

Expose `/api/cad/text-to-cad` as the canonical API and retain `/api/cad/freecad` as a compatibility alias. Preserve historical `FC-` identifiers, database schema labels, Redis namespaces, and existing document IDs to avoid data migration or loss. Compatibility names never execute FreeCAD. Display the actual text-to-cad provider and available capabilities.

Port the currently supported primitives, boolean operations, tetrahedron, loft, fillet/chamfer, involute gear, experimental thread, assembly/motion, wall/slab/opening geometry, single-bend sheet metal, and projected drawings. Validate each against real geometry; a missing feature or failed computation must never produce a successful artifact.

## Constraints

- cadgen[snapshot]==0.7.10 initially matches the installed skill contract.
- No FreeCAD application, GUI, RPC service, or add-on is required for new execution.
- No removal of user artifacts, runtime installations, or persisted records.
- Source and document artifacts remain server-owned; user input cannot supply executable Python or filesystem paths.
- New artifact paths and old read-only routes retain authentication and ownership checks.

## Verification

Exercise actual cadgen/build123d solids and saved STEP round trips, subprocess failure/timeout semantics, durable edits and publication, API aliases, frontend file validation, startup and container configuration. Run affected backend/frontend suites and the project aggregate suite; report environmental failures separately from functional failures.
