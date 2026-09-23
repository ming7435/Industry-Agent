from app.a2a.requests import A2ARequests


def test_orchestration_methods_are_public_and_internal_builders_remain_private():
    public = {
        "diagnose", "retrieve_knowledge", "retrieve_cad", "create_maintenance_plan",
        "execute_workorder", "inspect_quality", "access_memory",
        "request_knowledge_for_diagnosis", "request_knowledge_for_maintenance",
        "request_cad_for_maintenance",
    }
    for name in public:
        assert callable(getattr(A2ARequests, name))
        assert not name.startswith("_")
