"""
Agent Skills：从预存或导入的 Markdown 文件加载「场景/专家指南」，在回答时注入为上下文。
技能文件放在项目根目录的 skills/ 下，每个 .md 文件为一个技能，文件名为技能 id。
"""
from __future__ import annotations

import os
import re
from typing import List, Optional

# 项目根目录：优先与 main 一致（backend 的上一级），若该路径下无 skills 则再试当前工作目录
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKILLS_DIR = os.path.join(_ROOT, "skills")


def _skills_dir() -> str:
    """返回实际使用的 skills 目录（若默认不存在则尝试 cwd/skills）。"""
    if os.path.isdir(SKILLS_DIR):
        return SKILLS_DIR
    cwd_skills = os.path.join(os.getcwd(), "skills")
    if os.path.isdir(cwd_skills):
        return cwd_skills
    return SKILLS_DIR


def list_skills() -> List[dict]:
    """列出所有可用技能：从 skills/*.md 读取，返回 [{ "id", "name" }]。"""
    result: List[dict] = []
    base = _skills_dir()
    if not os.path.isdir(base):
        return result
    for f in sorted(os.listdir(base)):
        if not f.endswith(".md"):
            continue
        skill_id = f[:-3]
        path = os.path.join(base, f)
        try:
            with open(path, "r", encoding="utf-8") as fp:
                first_lines = "".join(fp.readline() for _ in range(5))
            # 用第一个 # 标题作为展示名，否则用 id
            m = re.search(r"^#\s*(.+)$", first_lines, re.MULTILINE)
            name = m.group(1).strip() if m else skill_id.replace("_", " ").replace("-", " ")
        except Exception:
            name = skill_id
        result.append({"id": skill_id, "name": name})
    return result


def get_skill_content(skill_id: Optional[str]) -> str:
    """根据技能 id 返回 Markdown 正文；无 id 或文件不存在返回空字符串。"""
    if not skill_id or not skill_id.strip():
        return ""
    base = _skills_dir()
    path = os.path.join(base, f"{skill_id.strip()}.md")
    if not os.path.isfile(path):
        return ""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""
