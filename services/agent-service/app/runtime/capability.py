"""Compatibility entry point for the Runtime capability registry."""

from .capabilities import Capability, CapabilityRegistry, build_capability_registry

__all__ = ["Capability", "CapabilityRegistry", "build_capability_registry"]
