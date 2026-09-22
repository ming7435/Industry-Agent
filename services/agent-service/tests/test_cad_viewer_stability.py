from pathlib import Path


CAD_VIEWER = Path(r"C:\Users\12587\Downloads\TC820si\TC820si.html")
FRONTEND = Path(__file__).resolve().parents[3] / "frontend" / "monitor-react" / "src" / "main.jsx"


def test_cad_viewer_does_not_repaint_model_on_a_fixed_interval():
    source = CAD_VIEWER.read_text(encoding="utf-8")

    assert "window.setInterval(keepModelHighlight, 700)" not in source
    assert "scheduleModelHighlight" in source


def test_workorder_cad_panel_sends_one_initial_focus_command():
    source = FRONTEND.read_text(encoding="utf-8")

    assert "[150, 600, 1400, 2600]" not in source
    assert "    }, 180);" in source
