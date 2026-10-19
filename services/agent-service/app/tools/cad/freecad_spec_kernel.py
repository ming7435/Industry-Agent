"""Trusted build123d source used by versioned CAD documents."""
from pathlib import Path


def kernel_source(spec=None):
    directory = Path(__file__).parent
    features = (directory / 'text_to_cad_features.py').read_text(encoding='utf-8')
    features += '\n' + (directory / 'text_to_cad_assembly.py').read_text(encoding='utf-8')
    kernel = (directory / 'text_to_cad_kernel.py').read_text(encoding='utf-8')
    kernel = kernel.split('# HOST_ONLY_SOURCE_COMPILER')[0]
    kernel = '\n'.join(line for line in kernel.splitlines() if not line.startswith(('from .text_to_cad_features import', 'from .text_to_cad_assembly import')))
    return features + '\n' + kernel
