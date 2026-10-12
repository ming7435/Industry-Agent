"""Preserve inspection JSON bytes without changing any domain validation rules.

MySQL's binary JSON representation can round floats when extracting an object.
Keep the complete record as a JSON string, as virtual production already does.
The service independently validates its original standards and batch digests.
"""
import json

KINDS = {'simulated_quality_basis', 'simulated_quality_batch', 'simulated_quality_request'}
SCHEMA = 'simulated-quality-record-v1'
MAX_BYTES = 8 * 1024 * 1024


def reject_nonfinite(_):
    raise ValueError('检测记录包含非有限数值')


class ExactInspectionRecords:
    def __init__(self, raw):
        self.raw = raw

    def __getattr__(self, name):
        return getattr(self.raw, name)

    @staticmethod
    def decode(value):
        if value is None:
            return None
        if not isinstance(value, dict):
            raise ValueError('已保存检测记录格式无效，请复核')
        if 'payload_json' not in value:
            return value  # Legacy records must still pass every original domain gate.
        try:
            if (set(value) != {'schema', 'actor_id', 'payload_json'} or value['schema'] != SCHEMA
                    or not isinstance(value['actor_id'], str) or not value['actor_id'].strip()
                    or len(value['actor_id']) > 128
                    or not isinstance(value['payload_json'], str)
                    or len(value['payload_json'].encode('utf-8')) > MAX_BYTES):
                raise ValueError('invalid envelope')
            record = json.loads(value['payload_json'], parse_constant=reject_nonfinite)
            if not isinstance(record, dict):
                raise ValueError('invalid record')
            if record.get('actor_id') != value['actor_id']:
                raise ValueError('record owner mismatch')
            return record
        except (ValueError, TypeError, RecursionError):
            raise ValueError('已保存检测记录格式无效，请复核') from None

    def get_record(self, kind, identity):
        value = self.raw.get_record(kind, identity)
        return self.decode(value) if kind in KINDS else value

    def list_records(self, kind):
        values = self.raw.list_records(kind)
        return [self.decode(value) for value in values] if kind in KINDS else values

    def list_actor_records(self, kind, actor):
        # Filter the opaque owner's string before decoding. Another user's broken
        # envelope must not prevent this user from reading their own valid designs.
        values = self.raw.list_records(kind)
        return [self.decode(value) for value in values
                if isinstance(value, dict) and value.get('actor_id') == actor]

    def save_record(self, kind, identity, value):
        if kind not in KINDS:
            return self.raw.save_record(kind, identity, value)
        if not isinstance(value, dict):
            raise ValueError('检测记录必须是有效对象')
        actor = value.get('actor_id')
        if not isinstance(actor, str) or not actor.strip() or len(actor) > 128:
            raise ValueError('检测记录用户身份无效')
        text = json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
        if len(text.encode('utf-8')) > MAX_BYTES:
            raise ValueError('检测记录超过存储上限')
        envelope = {'schema': SCHEMA, 'actor_id': actor, 'payload_json': text}
        self.raw.save_record(kind, identity, envelope)
        return self.decode(envelope)
