"""Capability registry for existing Agents; it does not create Agents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Capability:
    agent: str
    name: str
    description: str = ""


class CapabilityRegistry:
    def __init__(self, entries: Iterable[Capability] | None = None) -> None:
        self._by_agent: dict[str, list[Capability]] = {}
        for entry in entries or []:
            self.register(entry.agent, entry.name, entry.description)

    def register(self, agent: str, capability: str, description: str = "") -> None:
        values = self._by_agent.setdefault(str(agent), [])
        if not any(item.name == capability for item in values):
            values.append(Capability(str(agent), str(capability), str(description)))

    def for_agent(self, agent: str) -> list[str]:
        return [item.name for item in self._by_agent.get(str(agent), [])]

    def find(self, capability: str) -> list[str]:
        return [agent for agent, values in self._by_agent.items() if any(item.name == capability for item in values)]

    def lookup(self, capability: str) -> list[str]:
        """Return existing Agents that advertise a capability."""

        return self.find(capability)

    def agents(self) -> list[str]:
        return sorted(self._by_agent)

    def snapshot(self) -> dict[str, list[str]]:
        return {agent: self.for_agent(agent) for agent in self.agents()}


def build_capability_registry() -> CapabilityRegistry:
    registry = CapabilityRegistry()
    defaults = {
        "router": ["intent_routing"],
        "diagnosis": ["fault_analysis", "hypothesis_generation"],
        "knowledge": ["document_search", "case_retrieval"],
        "cad": ["bom_query", "drawing_search"],
        "maintenance": ["repair_planning", "risk_assessment"],
        "workorder": ["workorder_create", "workorder_update"],
        "quality": ["quality_inspection", "quality_review"],
        "report": ["case_reporting"],
        "memory": ["experience_learning", "experience_retrieval"],
    }
    for agent, capabilities in defaults.items():
        for capability in capabilities:
            registry.register(agent, capability)
    return registry


__all__ = ["Capability", "CapabilityRegistry", "build_capability_registry"]
