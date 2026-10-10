"""Keep immutable factory JSON bytes inside a text field of the business JSON row.

MySQL binary JSON may reformat floating-point values during extraction. The
envelope makes that representation an opaque string; all domain checks still
independently recompile and verify the original digests after decoding.
"""
import json
from shared.virtual_turning import require, VirtualProductionError

KINDS = {'sim_production_job', 'sim_produced_part', 'sim_quality_check'}
SCHEMA = 'virtual-production-record-v1'

class ExactVirtualRecords:
    def __init__(self, raw): self.raw = raw
    def __getattr__(self, name): return getattr(self.raw, name)

    @staticmethod
    def decode(value):
        if value is None or 'payload_json' not in value: return value  # previous rows remain subject to all domain gates
        require(set(value) == {'schema', 'payload_json'} and value['schema'] == SCHEMA
                and isinstance(value['payload_json'], str) and len(value['payload_json'].encode()) <= 8 * 1024 * 1024,
                'saved_record_integrity', '保存的模拟记录格式无效')
        try:
            result = json.loads(value['payload_json'], parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
        except (ValueError, TypeError, RecursionError):
            raise VirtualProductionError('saved_record_integrity', '保存的模拟记录格式无效') from None
        require(isinstance(result, dict), 'saved_record_integrity')
        return result

    def get_record(self, kind, identity):
        value = self.raw.get_record(kind, identity)
        return self.decode(value) if kind in KINDS else value

    def list_records(self, kind):
        values = self.raw.list_records(kind)
        return [self.decode(value) for value in values] if kind in KINDS else values

    def save_record(self, kind, identity, value):
        if kind not in KINDS: return self.raw.save_record(kind, identity, value)
        text = json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
        require(len(text.encode()) <= 8 * 1024 * 1024, 'saved_record_too_large', status=413)
        self.raw.save_record(kind, identity, {'schema': SCHEMA, 'payload_json': text})
        return self.decode({'schema': SCHEMA, 'payload_json': text})
