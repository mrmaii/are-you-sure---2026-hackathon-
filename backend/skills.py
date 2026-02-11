"""
Agent Skills：从项目根目录 skills/*.md 读取技能文档，供 AI 上下文使用。

黑客松特化：仅 6 分区 Skills + 1 总监督 Skills；总监督参与所有交互上下文。
"""
from pathlib import Path
from typing import Optional

# 总监督 Skills：参与所有 AI 交互的上下文（与分区 Skill 叠加）
HACKATHON_SUPERVISOR_SKILL_ID = "hackathon_supervisor"

# 黑客松 6 大分区：(id, 显示名)，顺序即脑图一级节点顺序
HACKATHON_SECTIONS = [
    ("hackathon_problem", "提出问题与机会"),
    ("hackathon_solution", "解决方案"),
    ("hackathon_tech", "技术实现"),
    ("hackathon_business", "商业模式"),
    ("hackathon_team", "团队与执行"),
    ("hackathon_risk", "风险与应对"),
]


def _skills_dir() -> Path:
    """项目根目录下的 skills 文件夹（与 backend 同级）。"""
    root = Path(__file__).resolve().parent.parent
    return root / "skills"


def list_skills() -> list[dict]:
    """黑客松特化：只返回单一模式，不再暴露其他 Skills。"""
    return [{"id": "hackathon", "name": "黑客松（六分区 + 总监督）"}]


def get_skill_content(skill_id: Optional[str]) -> str:
    """读取指定技能 Markdown 内容；skill_id 为空或文件不存在时返回空字符串。"""
    if not skill_id or not str(skill_id).strip():
        return ""
    sid = str(skill_id).strip()
    if sid == "hackathon":
        return get_skill_content(HACKATHON_SUPERVISOR_SKILL_ID)
    skills_path = _skills_dir()
    path = skills_path / f"{sid}.md"
    if not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def get_supervisor_content() -> str:
    """总监督 Skills 内容，参与所有交互。"""
    return get_skill_content(HACKATHON_SUPERVISOR_SKILL_ID)
