import pytest
from scripts.freecad_documents_smoke import validate_report

def test_report_cannot_promote_missing_or_mismatched_evidence():
    report={'version_fingerprint':'native-1','adapter_digest':'a','command_coverage':['publish'],'native_checks':{'passed':True},'api_checks':{'passed':True},'browser_checks':{'passed':True},'artifacts':[{'verified':True}]}
    assert validate_report(report,'native-1','a') is True
    for missing in ['native_checks','api_checks','browser_checks','artifacts']:
        incomplete={k:v for k,v in report.items() if k!=missing}
        with pytest.raises(ValueError):validate_report(incomplete,'native-1','a')
    with pytest.raises(ValueError):validate_report(report,'native-2','a')
    with pytest.raises(ValueError):validate_report({**report,'artifacts':[{'verified':False}]},'native-1','a')
