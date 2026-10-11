"""Typed commands reject script injection and bind stable identities, not labels."""
import importlib
import math

import pytest


def contracts():
    assert importlib.util.find_spec('shared.freecad_documents'), 'typed document contracts missing'
    return importlib.import_module('shared.freecad_documents')


def command(kind='create_primitive', **params):
    return dict(command_id='CMD-a', document_id='DOC-12345678-1234-4234-8234-123456789abc',
                expected_revision=0, command_type=kind, parameters=params)


def box(**changes):
    return command(primitive_type='box', length=40, width=20, height=changes.pop('height', 10), **changes)


def test_strict_dimensions_and_identity():
    c = contracts()
    value = c.parse_command(box())
    assert value.parameters.length == 40
    first = c.command_digest('USER-a', value)
    assert first != c.command_digest('USER-b', value)
    other = value.model_copy(update={'document_id': 'DOC-22345678-1234-4234-8234-123456789abc'})
    assert first != c.command_digest('USER-a', other)


def test_unicode_labels_are_not_object_ids():
    c = contracts()
    a = c.parse_command(command('set_label', label='安装底板', object_id='OBJ-a'))
    b = c.parse_command(command('set_label', label='安装底板', object_id='OBJ-b'))
    assert a.parameters.object_id == 'OBJ-a'
    assert c.command_digest('USER-a', a) != c.command_digest('USER-a', b)


@pytest.mark.parametrize('height', [True, float('nan'), float('inf'), 0, -1, 10001, '10'])
def test_reject_nonfinite_dimensions(height):
    with pytest.raises(ValueError):
        contracts().parse_command(box(height=height))


@pytest.mark.parametrize('payload', [
    command(primitive_type='box', length=10, width=10, height=10, code='print(1)'),
    command(primitive_type='unknown', length=10),
    command('set_label', object_id='OBJ-a', label='a\nb'),
    command('set_placement', object_id='OBJ-a', position=[0, 0, 0], rotation={'axis':[0,0,0], 'angle':0}),
    command('execute_code', code='print(1)'),
])
def test_reject_nonfinite_or_extra_fields(payload):
    with pytest.raises(ValueError):
        contracts().parse_command(payload)


@pytest.mark.parametrize('primitive', [
    dict(primitive_type='box', length=20, width=10, height=5),
    dict(primitive_type='cylinder', diameter=20, length=10),
    dict(primitive_type='sphere', diameter=20),
    dict(primitive_type='cone', bottom_diameter=20, top_diameter=0, height=10),
])
def test_four_primitives(primitive):
    assert contracts().parse_command(command(**primitive)).parameters.primitive_type == primitive['primitive_type']


def test_standard_digest_cannot_be_changed():
    c = contracts()
    body = dict(schema_version='freecad_document_parameters_v1', document_id=command()['document_id'],
                revision=1, run_id='FC-'+'a'*64, extractor_version='native-1', parameters=[], uncovered=[])
    body['digest'] = c.canonical_digest(body)
    assert c.verify_document_standard(body).revision == 1
    body['revision'] = 2
    with pytest.raises(ValueError):
        c.verify_document_standard(body)
