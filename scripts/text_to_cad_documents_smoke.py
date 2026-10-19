"""Evidence validation for real native/HTTP/browser checks; no mock may mark manual readiness."""
import json
from pathlib import Path

def validate_report(report,version_fingerprint,adapter_digest):
    if (not version_fingerprint or version_fingerprint=='unknown' or report.get('version_fingerprint')!=version_fingerprint
            or report.get('adapter_digest')!=adapter_digest or not report.get('command_coverage')
            or any(report.get(key,{}).get('passed') is not True for key in ['native_checks','api_checks','browser_checks'])
            or not report.get('artifacts') or any(a.get('verified') is not True for a in report['artifacts'])):
        raise ValueError('原生、接口、页面或文件证据缺失／版本不匹配')
    return True

def verify(output_dir:Path,transport,fixture_backend):
    # Callers supply actual probes, not a mode that silently falls back to an offline kernel.
    from app.cad_documents.capabilities import local_inventory
    inventory=local_inventory();report=transport(fixture_backend)
    validate_report(report,inventory['version_fingerprint'],inventory['adapter_digest'])
    output_dir=Path(output_dir);output_dir.mkdir(parents=True,exist_ok=True)
    temporary=output_dir/'text-to-cad-documents.tmp';temporary.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    temporary.replace(output_dir/'text-to-cad-documents.json');return report
