"""Launch installed Chrome against the real built app; no routes or CAD replies intercepted."""
import json
import os
from pathlib import Path
import subprocess


def browser_probe(stack,document_id):
    env={**os.environ,'CAD_LIVE_URL':stack['monitor_url'],'CAD_LIVE_ACTOR':stack['actor']['user_id'],
         'CAD_LIVE_DOCUMENT':document_id,'CAD_LIVE_COOKIE':stack['client'].cookies.get('maintenance_session')}
    result=subprocess.run(['node','tests/browser/freecad-document-live.mjs'],env=env,capture_output=True,text=True,encoding='utf-8',timeout=300)
    if result.returncode:raise AssertionError('Real browser probe failed: '+result.stderr[-8000:])
    return json.loads(result.stdout.strip().splitlines()[-1])
