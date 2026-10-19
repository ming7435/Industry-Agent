"""Durable CAD worker; its process lock prevents duplicate document executors."""
from pathlib import Path
import os
import sys
import time
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'services/agent-service'))


def main():
    from app.cad_documents import documents_enabled
    if not documents_enabled():
        return 0
    from app.cad_documents.gateway import Gateway
    from app.cad_documents.coordinator import CadDocumentWorker
    from app.cad_documents.artifacts import ArtifactStore
    from app.clients.text_to_cad import TextToCadClient

    lock_path = Path(os.getenv('CAD_WORKER_LOCK') or os.getenv('FREECAD_WORKER_LOCK')
                     or str(ROOT / '.runtime/cad-document-worker.lock'))
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open('a+b') as lock:
        if os.name == 'nt':
            import msvcrt
            lock.seek(0)
            lock.write(b'0')
            lock.flush()
            lock.seek(0)
            try:
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError:
                return 0
        else:
            import fcntl
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:
                return 0
        # Retain the existing storage root so historical publications remain available.
        artifact_root = Path(os.getenv('TEXT_TO_CAD_DOCUMENT_ARTIFACT_ROOT')
                             or os.getenv('FREECAD_DOCUMENT_ARTIFACT_ROOT')
                             or str(ROOT / 'output/freecad-documents'))
        worker = CadDocumentWorker(Gateway(), TextToCadClient(), ArtifactStore(artifact_root),
                                   'worker-' + uuid4().hex)
        while True:
            try:
                result = worker.tick()
            except Exception:
                result = {'state': 'storage_unavailable'}
            if result.get('state') not in {'completed', 'failed'}:
                time.sleep(0.5)


if __name__ == '__main__':
    raise SystemExit(main())
