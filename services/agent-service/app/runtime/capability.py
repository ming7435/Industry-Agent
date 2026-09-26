"""Canonical capability metadata and Agent resolution for the Runtime.

The registry is the single Runtime source for capability ownership and the
metadata needed by planning, dispatch, evaluation, and policy boundaries.
The small :class:`Capability` value object remains for callers that used the
original ``agent/name/description`` registration API.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Mapping


@dataclass(frozen=True)
class CapabilityDefinition:
    """Immutable Runtime metadata for one canonical capability."""

    name: str
    agent: str
    domain: str
    result_key: str
    description: str = ""
    side_effect: bool = False
    requires_approval: bool = False
    default_reason: str = ""
    aliases: tuple[str, ...] = ()
    replan_capabilities: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", str(self.name).strip())
        object.__setattr__(self, "agent", str(self.agent).strip())
        object.__setattr__(self, "domain", str(self.domain).strip())
        object.__setattr__(self, "result_key", str(self.result_key).strip())
        object.__setattr__(self, "aliases", tuple(str(item).strip() for item in self.aliases if str(item).strip()))
        object.__setattr__(self, "replan_capabilities", tuple(str(item).strip() for item in self.replan_capabilities if str(item).strip()))

    @property
    def reason(self) -> str:
        return self.default_reason


@dataclass(frozen=True)
class Capability:
    """Legacy registration shape retained for existing callers."""

    agent: str
    name: str
    description: str = ""


CAPABILITY_DEFINITIONS: tuple[CapabilityDefinition, ...] = (
    CapabilityDefinition("intent_routing", "router", "routing", "route", "classify and route a request", default_reason="route request"),
    CapabilityDefinition("fault_analysis", "diagnosis", "diagnosis", "diagnosis", "analyze abnormal event", default_reason="analyze abnormal event", aliases=("fault_diagnosis",), replan_capabilities=("document_search", "diagnosis_review")),
    CapabilityDefinition("hypothesis_generation", "diagnosis", "diagnosis", "diagnosis", "generate diagnostic hypotheses", default_reason="generate diagnostic hypotheses"),
    CapabilityDefinition("diagnosis_review", "diagnosis", "diagnosis", "diagnosis", "review diagnostic evidence", default_reason="review diagnostic evidence", replan_capabilities=("document_search", "diagnosis_review")),
    CapabilityDefinition("document_search", "knowledge", "knowledge", "knowledge", "retrieve supporting evidence", default_reason="retrieve supporting evidence", aliases=("knowledge_search",)),
    CapabilityDefinition("historical_case_search", "knowledge", "knowledge", "knowledge", "retrieve historical cases", default_reason="retrieve historical cases"),
    CapabilityDefinition("evidence_retrieval", "knowledge", "knowledge", "knowledge", "retrieve supporting evidence", default_reason="retrieve supporting evidence"),
    CapabilityDefinition("drawing_search", "cad", "cad", "cad", "resolve engineering context", default_reason="resolve engineering context", aliases=("drawing_lookup",)),
    CapabilityDefinition("bom_query", "cad", "cad", "cad", "resolve BOM context", default_reason="resolve BOM context"),
    CapabilityDefinition("component_relation", "cad", "cad", "cad", "resolve component relations", default_reason="resolve component relations"),
    CapabilityDefinition("repair_plan", "maintenance", "maintenance", "maintenance_plan", "prepare executable repair plan", default_reason="prepare executable repair plan", replan_capabilities=("maintenance_replan", "workorder_create")),
    CapabilityDefinition("repair_planning", "maintenance", "maintenance", "maintenance_plan", "prepare executable repair plan", default_reason="prepare executable repair plan", replan_capabilities=("maintenance_replan", "workorder_create")),
    CapabilityDefinition("maintenance_replan", "maintenance", "maintenance", "maintenance_plan", "replan an insufficient maintenance plan", default_reason="replan an insufficient maintenance plan", replan_capabilities=("maintenance_replan", "workorder_create")),
    CapabilityDefinition("workorder_create", "workorder", "workorder", "workorder", "create one idempotent work order", side_effect=True, default_reason="create one idempotent work order", aliases=("create_workorder",)),
    CapabilityDefinition("workorder_update", "workorder", "workorder", "workorder", "update an existing work order", side_effect=True, requires_approval=True, default_reason="update an existing work order"),
    CapabilityDefinition("quality_inspection", "quality", "quality", "quality", "verify the produced part when requested", default_reason="verify the produced part when requested"),
    CapabilityDefinition("quality_review", "quality", "quality", "quality", "review part quality", default_reason="review part quality"),
    CapabilityDefinition("case_reporting", "report", "report", "report", "compose a case report", default_reason="compose a case report"),
    CapabilityDefinition("experience_retrieval", "memory", "learning", "memory", "retrieve validated experience", default_reason="retrieve validated experience"),
    CapabilityDefinition("experience_learning", "memory", "learning", "memory", "persist validated repair experience", side_effect=True, default_reason="persist validated repair experience"),
)

DEFAULT_PLAN_CAPABILITIES: tuple[str, ...] = (
    "fault_analysis", "document_search", "drawing_search", "repair_planning", "workorder_create",
)


class CapabilityRegistry:
    """Resolve canonical capability metadata and concrete Agent instances."""

    def __init__(self, entries: Iterable[Capability | CapabilityDefinition] | None = None) -> None:
        self._definitions: dict[str, CapabilityDefinition] = {}
        self._aliases: dict[str, str] = {}
        self._by_agent: dict[str, list[str]] = {}
        self._agents: dict[str, Any] = {}
        self._catalog = {item.name: item for item in CAPABILITY_DEFINITIONS}
        self._catalog_aliases = {
            alias: item.name for item in CAPABILITY_DEFINITIONS for alias in item.aliases
        }
        for entry in entries or []:
            if isinstance(entry, CapabilityDefinition):
                self.register(entry)
            else:
                self.register(entry.agent, entry.name, entry.description)

    def register(
        self,
        agent: str | CapabilityDefinition,
        capability: str | None = None,
        description: str = "",
        *,
        domain: str = "",
        result_key: str = "",
        side_effect: bool = False,
        requires_approval: bool = False,
        default_reason: str = "",
        aliases: Iterable[str] = (),
    ) -> CapabilityDefinition:
        """Register a definition, or accept the legacy ``agent, capability`` form."""

        if isinstance(agent, CapabilityDefinition):
            definition = agent
        else:
            name = str(capability or "").strip()
            if not name:
                raise ValueError("capability must not be blank")
            catalog = self._catalog.get(name)
            if catalog is not None and catalog.agent == str(agent).strip() and not any((domain, result_key, aliases)):
                definition = catalog
            else:
                definition = CapabilityDefinition(
                    name=name,
                    agent=str(agent),
                    domain=domain or str(agent),
                    result_key=result_key or name.replace(".", "_"),
                    description=description,
                    side_effect=side_effect,
                    requires_approval=requires_approval,
                    default_reason=default_reason or description,
                    aliases=tuple(aliases),
                )

        existing = self._definitions.get(definition.name)
        if existing is not None:
            if existing.agent != definition.agent:
                raise ValueError("capability %s already belongs to %s" % (definition.name, existing.agent))
            definition = existing
        else:
            self._definitions[definition.name] = definition
        values = self._by_agent.setdefault(definition.agent, [])
        if definition.name not in values:
            values.append(definition.name)
        for alias in definition.aliases:
            owner = self._aliases.get(alias)
            if owner is not None and owner != definition.name:
                raise ValueError("capability alias %s is already registered" % alias)
            self._aliases[alias] = definition.name
        return definition

    def register_agent(self, agent: Any) -> None:
        """Register a concrete Agent and its declared capabilities."""

        name = str(getattr(agent, "name", "") or type(agent).__name__).strip()
        if not name:
            raise ValueError("agent must declare a name")
        capabilities = tuple(str(item).strip() for item in getattr(agent, "capabilities", ()) if str(item).strip())
        if not capabilities:
            raise ValueError("agent %s must declare capabilities" % name)
        self._agents[name] = agent
        for capability in capabilities:
            self.register(name, capability)

    def register_agents(self, agents: Iterable[Any] | Mapping[str, Any]) -> None:
        values = agents.values() if isinstance(agents, Mapping) else agents
        for agent in values:
            self.register_agent(agent)

    def get(self, capability: str) -> CapabilityDefinition | None:
        name = str(capability or "").strip()
        canonical = self._aliases.get(name, self._catalog_aliases.get(name, name))
        return self._definitions.get(canonical) or self._catalog.get(canonical)

    def canonical_name(self, capability: str) -> str:
        definition = self.get(capability)
        return definition.name if definition else str(capability or "").strip()

    def resolve_agent(self, capability: str) -> Any | None:
        definition = self.get(capability)
        return self._agents.get(definition.agent) if definition else None

    def agent(self, name: str) -> Any | None:
        return self._agents.get(str(name))

    def for_agent(self, agent: str) -> list[str]:
        return list(self._by_agent.get(str(agent), []))

    def find(self, capability: str) -> list[str]:
        definition = self.get(capability)
        return [definition.agent] if definition else []

    def lookup(self, capability: str) -> list[str]:
        return self.find(capability)

    def definitions(self) -> tuple[CapabilityDefinition, ...]:
        return tuple(self._definitions.values())

    def default_capabilities(self) -> list[str]:
        return [name for name in DEFAULT_PLAN_CAPABILITIES if self.get(name) is not None]

    def all_capabilities(self) -> list[str]:
        return list(self._definitions)

    def domain_for(self, capability: str) -> str:
        definition = self.get(capability)
        return definition.domain if definition else ""

    def result_key_for(self, capability: str) -> str:
        definition = self.get(capability)
        return definition.result_key if definition else str(capability or "").replace(".", "_")

    def side_effect_for(self, capability: str) -> bool:
        definition = self.get(capability)
        return bool(definition.side_effect) if definition else False

    def requires_approval_for(self, capability: str) -> bool:
        definition = self.get(capability)
        return bool(definition.requires_approval) if definition else False

    def reason_for(self, capability: str, fallback: str = "") -> str:
        definition = self.get(capability)
        return (definition.default_reason if definition else "") or fallback

    def agents(self) -> list[str]:
        return sorted(self._by_agent)

    def snapshot(self) -> dict[str, list[str]]:
        return {agent: self.for_agent(agent) for agent in self.agents()}


def build_capability_registry() -> CapabilityRegistry:
    """Build the canonical registry and bind the concrete nine Agents."""

    from app.agents.registry import CORE_AGENT_REGISTRY

    registry = CapabilityRegistry(CAPABILITY_DEFINITIONS)
    for name, agent_type in CORE_AGENT_REGISTRY.items():
        declared: list[str] = []
        for capability in getattr(agent_type, "capabilities", ()):
            if registry.get(str(capability)) is None:
                registry.register(name, str(capability))
            definition = registry.get(str(capability))
            if definition is not None:
                declared.append(definition.name)
        # Keep the compatibility snapshot in the Agent declaration order.
        registry._by_agent[name] = declared
    return registry


__all__ = [
    "CAPABILITY_DEFINITIONS", "DEFAULT_PLAN_CAPABILITIES", "Capability",
    "CapabilityDefinition", "CapabilityRegistry", "build_capability_registry",
]
