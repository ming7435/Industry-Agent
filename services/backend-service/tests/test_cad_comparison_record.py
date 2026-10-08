from app.quality.inspection import PartInspectionService


class MemoryRepository:
    def __init__(self):
        self.records = {}

    def save_record(self, record_type, record_id, payload):
        self.records[(record_type, record_id)] = dict(payload)

    def get_record(self, record_type, record_id):
        return self.records.get((record_type, record_id))

    def list_records(self, record_type):
        return [item for (kind, _), item in self.records.items() if kind == record_type]


def test_manual_cad_comparison_preserves_design_and_measurement_provenance():
    repo = MemoryRepository()
    service = PartInspectionService(repository=repo)
    source = {
        'part_id': 'PART-NEW',
        'measurements': {'op_1_diameter': 30.01},
        'design_run_id': 'FC-' + 'a' * 64,
        'design_spec_digest': 'b' * 64,
        'comparison_status': 'consistent',
        'comparison_items': [{'key': 'op_1_diameter', 'nominal': 30,
                              'actual': 30.01, 'tolerance': 0.02, 'matched': True}],
        'comparison_checked_at': '2026-10-08T10:00:00+00:00',
        'tolerance_source': 'manual',
    }
    result = service.call('register_production_part', part=source, operator='operator-A')
    assert result['success'] is True
    record = service.call('get_production_part', part_id='PART-NEW')['part']
    assert record['design_run_id'] == source['design_run_id']
    assert record['comparison_status'] == 'consistent'
    assert record['comparison_items'][0]['actual'] == 30.01
    assert record['recorded_by'] == 'operator-A'
    assert record['source'] == 'manual-inspection'
