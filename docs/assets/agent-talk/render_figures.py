"""从同一绘图定义生成讲解稿 SVG 和 PNG，不调用模型或任何业务接口。

运行：L:/anaconda/python.exe docs/assets/agent-talk/render_figures.py
需要现有 Pillow 和 Windows 微软雅黑字体，不安装新的项目依赖。
"""

from __future__ import annotations

import math
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
REGULAR = Path("C:/Windows/Fonts/msyh.ttc")
BOLD = Path("C:/Windows/Fonts/msyhbd.ttc")
INK = "#17383f"
MUTED = "#526f75"
TEAL = "#087f79"
BLUE = "#306da6"
AMBER = "#95601a"
BORDER = "#d5e3e5"


class Figure:
    """使用同一组几何和文字绘制矢量原稿及高清位图。"""

    scale = 2

    def __init__(self, name: str, height: int, title: str, subtitle: str):
        self.name, self.width, self.height = name, 1600, height
        self.image = Image.new("RGB", (self.width * self.scale, height * self.scale), "#f5f9fa")
        self.draw = ImageDraw.Draw(self.image)
        self.svg = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="{height}" viewBox="0 0 1600 {height}" role="img">',
            f"<title>{escape(title)}</title><desc>{escape(subtitle)}</desc>",
            f'<rect x="0" y="0" width="1600" height="{height}" fill="#f5f9fa"/>',
        ]
        self.text(60, 68, title, 38, INK, True)
        self.text(60, 111, subtitle, 22, MUTED)
        self.line([(60, 128), (1540, 128)], BORDER, 2)

    def rect(self, x, y, w, h, fill="#ffffff", stroke=BORDER, radius=16):
        assert 0 <= x < x + w <= self.width and 0 <= y < y + h <= self.height
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        self.draw.rounded_rectangle(tuple(v * self.scale for v in (x, y, x + w, y + h)), radius=radius * self.scale, fill=fill, outline=stroke, width=2 * self.scale)

    def text(self, x, y, value, size=24, color=INK, bold=False):
        font = ImageFont.truetype(str(BOLD if bold else REGULAR), size * self.scale)
        # 同时校验文字实际宽度，避免在导出的图中越界。
        bbox = self.draw.textbbox((x * self.scale, y * self.scale), value, font=font, anchor="ls")
        assert bbox[0] >= 0 and bbox[2] <= self.width * self.scale, (self.name, value)
        assert bbox[1] >= 0 and bbox[3] <= self.height * self.scale, (self.name, value)
        self.draw.text((x * self.scale, y * self.scale), value, font=font, fill=color, anchor="ls")
        weight = "700" if bold else "400"
        self.svg.append(f'<text x="{x}" y="{y}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>')

    def line(self, points, color=TEAL, width=3, arrow=False, dashed=False):
        for x, y in points:
            assert 0 <= x <= self.width and 0 <= y <= self.height
        dash = ' stroke-dasharray="8 7"' if dashed else ""
        encoded = " ".join(f"{x},{y}" for x, y in points)
        self.svg.append(f'<polyline points="{encoded}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"{dash}/>')
        if dashed:
            for start, end in zip(points, points[1:]):
                distance = math.dist(start, end)
                for offset in range(0, math.ceil(distance), 15):
                    p1 = tuple(a + (b - a) * offset / distance for a, b in zip(start, end))
                    p2 = tuple(a + (b - a) * min(offset + 8, distance) / distance for a, b in zip(start, end))
                    self.draw.line([(x * self.scale, y * self.scale) for x, y in (p1, p2)], fill=color, width=width * self.scale)
        else:
            self.draw.line([(x * self.scale, y * self.scale) for x, y in points], fill=color, width=width * self.scale, joint="curve")
        if arrow:
            x, y = points[-1]
            px, py = points[-2]
            length = math.hypot(x - px, y - py)
            ux, uy = (x - px) / length, (y - py) / length
            triangle = [(x, y), (x - ux * 13 - uy * 6, y - uy * 13 + ux * 6), (x - ux * 13 + uy * 6, y - uy * 13 - ux * 6)]
            self.draw.polygon([(a * self.scale, b * self.scale) for a, b in triangle], fill=color)
            vertices = " ".join(f"{a:.2f},{b:.2f}" for a, b in triangle)
            self.svg.append(f'<polygon points="{vertices}" fill="{color}"/>')

    def card(self, x, y, w, h, title, lines, tint="#ffffff", accent=TEAL):
        self.rect(x, y, w, h, tint)
        self.rect(x + 16, y + 22, 5, 30, accent, accent, 2)
        title_size = 27
        while ImageFont.truetype(str(BOLD), title_size * self.scale).getlength(title) > (w - 54) * self.scale:
            title_size -= 1
            assert title_size >= 18, (self.name, title)
        self.text(x + 34, y + 47, title, title_size, INK, True)
        for index, value in enumerate(lines):
            self.text(x + 34, y + 83 + index * 33, value, 21, MUTED)

    def save(self):
        self.svg.append("</svg>")
        # 这里写入的是生成产物；原稿本身使用 apply_patch 维护。
        (ROOT / f"{self.name}.svg").write_text("\n".join(self.svg) + "\n", encoding="utf-8")
        self.image.save(ROOT / f"{self.name}.png")
        print(f"{self.name}: SVG + PNG {self.image.width}x{self.image.height}")


def system_architecture():
    f = Figure("system-architecture", 1110, "Industry-Agent｜五服务与数据边界", "依据当前本地源码；箭头表示主要调用/输入方向，响应沿调用路径返回。端口不是存活证明。")
    f.card(60, 165, 400, 120, "浏览器工作台", ["问题、当前故障、维修反馈"], accent=BLUE)
    f.card(530, 150, 540, 150, "监控 / Web 工作台  :8001", ["设备采样 → 规则 → 异常事件", "React 页面 + 本地 API 代理"], "#eaf6f3")
    f.card(1140, 165, 400, 120, "虚拟工厂  :4529", ["设备身份、报警、指标、状态"], "#eef4fb", BLUE)
    f.line([(460, 225), (530, 225)], BLUE, arrow=True)
    f.line([(1140, 225), (1070, 225)], BLUE, arrow=True)
    f.line([(800, 300), (800, 360)], arrow=True)
    f.text(835, 335, "GoalEvent / 业务请求", 20)
    f.card(400, 360, 800, 170, "Agent 服务  :8010", ["Runtime：规划 → 授权 → 调度 → 执行 → 评估", "9 个领域 Agent；Skill / Tool / Evidence / Trace"], "#eaf6f3")
    for start, end in [(620, 280), (800, 800), (980, 1320)]:
        f.line([(start, 530), (start, 575), (end, 575), (end, 620)], arrow=True)
    f.card(60, 620, 440, 180, "Backend  :8030", ["工单 / 团队 / 质检 / 报告", "状态迁移、审计、业务持久化", "真实适配器缺失 → 明确不可用"])
    f.card(580, 620, 440, 180, "RAG  :8020", ["文档 → 片段 → 检索 → 证据", "关键词 + 向量 + 重排", "文档目录 / Whoosh / Milvus"])
    f.card(1100, 620, 440, 180, "Document-CAD  :8050", ["图纸 / BOM / 装配 / 部件位置", "设备 + 机型 + 编号范围", "工程归属校验，不用无关模型"])
    f.line([(800, 800), (800, 870)], BLUE, arrow=True)
    f.text(825, 842, "向量 / 重排", 20, BLUE)
    f.line([(1200, 425), (1570, 425), (1570, 930), (1040, 930)], BLUE, arrow=True)
    f.text(1225, 857, "Agent 模型请求", 22, BLUE)
    f.card(560, 870, 480, 125, "Model 服务  :8040", ["统一路由：聊天 / 向量 / 重排"], "#eef4fb", BLUE)
    f.text(60, 1042, "聊天默认：DeepSeek 官方接口；辅助能力按各自供应商配置。图中没有密钥，也未进行收费模型探测。", 22, MUTED)
    f.text(60, 1080, "虚拟整线控制是显式模式下的独立控制分支，不由模型直接向 PLC 发指令。", 22, AMBER)
    f.save()


def agent_loop():
    f = Figure("agent-loop", 1110, "Agent Loop｜外层编排 + 三类内部循环", "图中为真实代码主干的讲解视图，不把 51 个图节点等同于 51 次模型请求。")
    f.rect(60, 155, 1480, 250, "#eaf6f3")
    f.text(85, 195, "外层 RuntimeCoordinator", 27, TEAL, True)
    cards = [
        (85, "输入归一化", "GoalEvent / 当前上下文"),
        (375, "Planner", "能力计划 / Action"),
        (665, "Dispatcher + Policy", "选择 Agent / 动作授权"),
        (955, "ExecutionManager", "执行 / 超时 / 对账"),
        (1245, "Evaluator", "完成 / 补证 / 阻断"),
    ]
    for x, title, body in cards:
        f.card(x, 220, 270, 100, title, [body])
    for x in [355, 645, 935, 1225]:
        f.line([(x, 270), (x + 20, 270)], arrow=True)
    f.line([(1380, 320), (1380, 368), (510, 368), (510, 320)], BLUE, arrow=True)
    f.text(685, 359, "有界重规划；审批 / 数据不足 / 不确定状态可结束当前请求", 20, BLUE)
    f.rect(60, 450, 970, 540)
    f.text(90, 494, "Diagnosis 内部：7 个图节点，原子子步骤保留", 27, TEAL, True)
    f.card(90, 535, 240, 100, "prepare", ["初始化 + Skill 加载"])
    f.card(400, 535, 240, 100, "reason", ["读取观察 → 模型推理"])
    f.card(710, 535, 280, 100, "tool_guard", ["原名权限 / 参数 / 重复"])
    f.line([(330, 585), (400, 585)], arrow=True)
    f.line([(640, 585), (710, 585)], arrow=True)
    f.card(710, 700, 280, 100, "execute_observe", ["工具执行 + Observation"])
    f.card(400, 700, 240, 100, "loop_guard", ["预算 / 证据进展 / 停止"])
    f.line([(850, 635), (850, 700)], arrow=True)
    f.line([(710, 750), (640, 750)], arrow=True)
    f.line([(520, 700), (520, 635)], BLUE, arrow=True)
    f.text(90, 686, "无工具调用 → 验证候选", 21, MUTED)
    f.line([(400, 585), (360, 585), (360, 817), (210, 817), (210, 835)], arrow=True)
    f.card(90, 835, 240, 110, "validate", ["领域规则 / 证据校验"])
    f.card(560, 835, 430, 110, "finish", ["正常结果或明确降级 / 不足"])
    f.line([(330, 910), (560, 910)], arrow=True)
    f.text(90, 975, "省略若干失败回边：不通过可补证；预算耗尽进入降级，而非伪造成功。", 20, MUTED)
    f.card(1080, 450, 460, 155, "Knowledge 内部循环", ["检索 → 评估 → 有界细化", "空结果返回不足，不抛 max() 异常"], "#eef4fb", BLUE)
    f.card(1080, 650, 460, 155, "CAD 内部循环", ["结构化查询 → 归属校验 → 补查", "指定设备不悄悄退化成全库查询"], "#eef4fb", BLUE)
    f.card(1080, 850, 460, 140, "其余领域 Agent", ["按阶段图完成任务，不要求有回边", "运行记录保留真实调用与失败"], "#fff4e3", AMBER)
    f.text(60, 1040, "循环位置：runtime/coordinator.py；agents/diagnosis/graph.py；knowledge/graph.py；cad/graph.py。", 22, MUTED)
    f.text(60, 1080, "Skill 映射不是授权；Tool 白名单、业务门禁、身份与审批分别检查。", 22, AMBER)
    f.save()


def fault_lifecycle():
    f = Figure("fault-lifecycle", 1360, "故障闭环｜事实、门禁、执行、验收", "业务主干示意，不代表每个异常都会开工单，也不代表一轮只产生一个 HTTP 请求或 Trace。")
    f.card(60, 155, 1000, 110, "① Monitor：确认本设备异常事件", ["设备身份 + event_id + 报警 + 当前快照；持续同一异常去重"])
    f.card(1130, 155, 410, 265, "虚拟整线停机分支", ["仅显式虚拟控制模式", "故障确认后触发", "命令 + 账本 + 状态读回", "与诊断分支独立，不等模型"], "#fff4e3", AMBER)
    f.line([(1060, 210), (1130, 210)], AMBER, arrow=True, dashed=True)
    f.line([(560, 265), (560, 315)], arrow=True)
    f.card(60, 315, 1000, 110, "② Diagnosis：分析 + 补查证据", ["RAG 文档与 CAD 工程归属；不足 / 低置信度 / 人工复核不自动派工"])
    f.line([(560, 425), (560, 475)], arrow=True)
    f.card(60, 475, 1480, 145, "③ Maintenance Plan：方案独立展示，执行前门禁", ["故障分析 / 步骤 / 工具 / 备件 / Evidence", "maintenance_required + 配置置信度门槛 + 证据状态 + 非演示来源 + 方案就绪"], "#eaf6f3")
    f.line([(800, 620), (800, 670)], arrow=True)
    f.card(60, 670, 1480, 140, "④ WorkOrder：创建、自动派工、维修人员执行与反馈", ["创建 / 派工（open） → 维修执行（in_progress） → 提交结果（awaiting_verification）", "拒绝、超时、重开及同状态幂等，分别由后端迁移规则处理"])
    f.line([(800, 810), (800, 860)], arrow=True)
    f.card(60, 860, 1480, 150, "⑤ 恢复验收：通过后 completed，再按关闭条件 closed", ["核对设备 / 时间 / 状态 / 报警 / 指标；不能只提交 passed=true，失败回处理", "被派工人员确认 + 实际反馈；虚拟复机另做整线检查、账本核对与启动后读回"], "#fff4e3", AMBER)
    f.line([(800, 1010), (800, 1060)], arrow=True)
    f.card(60, 1060, 1480, 115, "⑥ 后续闭环：报告中心与经验总结", ["Report 汇总已有记录；Memory 对关闭案例做经验准入，保存失败不冒充成功"])
    f.rect(60, 1210, 1480, 105, "#eef4fb")
    f.text(90, 1255, "独立质检失败路径：五类检测 → FAIL → 整改任务 → 复检 → 放行 → 关闭", 26, BLUE, True)
    f.text(90, 1292, "数据不足和 synthetic/degraded 不能当作真实合格；仪器可信度及产品验收标准仍需业务接入。", 22, MUTED)
    f.save()


def workbench_effects():
    f = Figure("workbench-effects", 1160, "工作台效果地图｜页面怎样消费结果", "依据 React 与视图转换代码整理的功能示意，不是运行截图，不包含编造的故障记录。")
    rows = [
        ("监控中心", "设备快照 / 规则观察", "逐设备状态、告警原因、指标；证据缺失显示待复核"),
        ("智能诊断", "当前设备 + 当前报警的诊断", "结论 → 根因 → 建议 → 证据；新报警不继续显示旧结论"),
        ("维修方案", "Maintenance Plan / 历史方案快照", "单列分析、步骤、工具、备件与 Evidence"),
        ("工单系统", "工单 + 当前设备图纸 + 执行反馈", "故障定位在上，人员 / 状态 / 反馈在下；不重复方案全文"),
        ("质检系统", "零件编号 + 规格 + 检测结果", "尺寸、外观、材料、功能、工艺；数据不足不能默认合格"),
        ("知识问答", "问题 + 活动报警检索范围", "活动报警附设备 / 报警条件；没有活动报警使用全库范围"),
        ("日志系统", "所选 run + agent_run_id + 调用事件", "运行记录 → 每次 Agent → 输入 / 上下文 / 工具 / 输出"),
        ("报告中心", "持久化报告 + 结构化章节", "中文摘要与章节；PDF 生成、打开、下载和错误反馈入口"),
    ]
    for number, (page, data, effect) in enumerate(rows):
        y = 158 + number * 112
        f.rect(60, y, 1480, 98, "#ffffff" if number % 2 else "#eaf6f3")
        f.text(85, y + 40, f"{number + 1:02d}", 22, TEAL, True)
        f.text(140, y + 40, page, 28, INK, True)
        f.text(355, y + 35, f"输入：{data}", 21, MUTED)
        f.text(355, y + 70, effect, 23, INK)
        f.text(85, y + 78, "页面", 18, MUTED)
    f.text(60, 1100, "讲解时点击文档中的源码链接；本轮视图 / 数据转换测试 24 项通过，不等于在线 UI 联调通过。", 22, MUTED)
    f.save()


if __name__ == "__main__":
    if not REGULAR.is_file() or not BOLD.is_file():
        raise SystemExit("缺少微软雅黑字体，停止导出，避免中文变为方框。")
    system_architecture()
    agent_loop()
    fault_lifecycle()
    workbench_effects()
