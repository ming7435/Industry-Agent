"""Canonical capability registry for existing Agents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Mapping


@dataclass(frozen=True)
class Capability:
    agent: str
    name: str
    description: str = ""


class CapabilityRegistry:
    def __init__(self, entries: Iterable[Capability] | None = None) -> None:
        self._by_agent: dict[str, list[Capability]] = {}
        self._agents: dict[str, Any] = {}
        for entry in entries or []:
            self.register(entry.agent, entry.name, entry.description)

    def register(self, agent: str, capability: str, description: str = "") -> None:
        values = self._by_agent.setdefault(str(agent), [])
        if not any(item.name == capability for item in values):
            values.append(Capability(str(agent), str(capability), str(description)))

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

    def resolve_agent(self, capability: str) -> Any | None:
        matches = self.find(capability)
        return self._agents.get(matches[0]) if matches else None

    def agent(self, name: str) -> Any | None:
        return self._agents.get(str(name))

    def for_agent(self, agent: str) -> list[str]:
        return [item.name for item in self._by_agent.get(str(agent), [])]

    def find(self, capability: str) -> list[str]:
        return [agent for agent, values in self._by_agent.items() if any(item.name == capability for item in values)]

    def lookup(self, capability: str) -> list[str]:
        return self.find(capability)

    def agents(self) -> list[str]:
        return sorted(self._by_agent)

    def snapshot(self) -> dict[str, list[str]]:
        return {agent: self.for_agent(agent) for agent in self.agents()}


def build_capability_registry() -> CapabilityRegistry:
    """Build the registry from concrete Agent class declarations."""

    from app.agents.registry import CORE_AGENT_REGISTRY

    registry = CapabilityRegistry()
    for name, agent_type in CORE_AGENT_REGISTRY.items():
        for capability in getattr(agent_type, "capabilities", ()):
            registry.register(name, str(capability))
    return registry


__all__ = ["Capability", "CapabilityRegistry", "build_capability_registry"]
