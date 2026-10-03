"""隔离进程执行真实 Backend 注册与维修确认，不导入 Agent 的同名 app 包。"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "services" / "backend-service"))

from app.team.repository import TeamRepository
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def main():
    order_path, team_path, device_id = sys.argv[1:]
    team = TeamService(TeamRepository(team_path), devices=lambda: [{"device_id": device_id}])
    service = BackendBusinessService(SQLiteRepository(order_path), team_service=team)
    command = json.loads(sys.stdin.read())
    action, values = command["action"], command.get("values", {})
    if action == "register":
        result = team.register("隔离测试维修人员", "test-only-password", "technician", device_id)
    elif action == "prestart":
        result = service.confirm_team_repair(values["workorder_id"], values["actor_id"], values["feedback"], values["snapshot"])
    elif action == "poststart":
        result = service.finalize_team_repair(values["workorder_id"], values["snapshot"])
    else:
        raise ValueError("未授权的测试动作")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
