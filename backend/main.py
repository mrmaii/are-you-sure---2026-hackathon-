# FastAPI 入口：立项 / 脑图 / 文档解析 / 静态前端
from __future__ import annotations

import base64
import io
import logging
import os
import re
from typing import List, Optional

import httpx
from dotenv import load_dotenv
load_dotenv()

from fastapi import Body, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from .ai_client import AIClient
from .db import get_session, init_db
from .models import ContextLink, Node, NodeAnswer, Project
from .schemas import (
  AnswerSuggestRequest,
  AnswerSuggestResponse,
  ContextLinkCreateRequest,
  ContextLinkOut,
  DraftCreateRequest,
  DraftCreateResponse,
  DraftMessageRequest,
  DraftMessageResponse,
  FromDraftRequest,
  MaterialCreateRequest,
  MergeResponse,
  NodeAnswerRequest,
  NodeAnswerResponse,
  NodeOut,
  NodeWithAnswers,
  ProgressOut,
  ProjectInitRequest,
  ProjectListItem,
  ProjectOut,
  ShortTitleResponse,
  TipsCandidatesRequest,
  TipsCandidatesResponse,
  TipsChooseRequest,
  WebSearchResponse,
  WebSearchResult,
)
from .services import (
  answer_node_and_trace,
  calc_progress,
  create_draft,
  create_project_from_draft,
  create_project_from_idea,
  draft_append_message,
  flatten_nodes,
  get_linked_context_for_node,
  get_skill_content_for_node,
  create_material_node,
  spawn_followup_node,
  spawn_section_question,
  spawn_tips_node,
)
from .skills import get_skill_content, list_skills


async def fetch_url_content(url: str, max_chars: int = 50000) -> str:
  """抓取 URL 正文（去 HTML 标签），失败返回空或错误说明。"""
  try:
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
      r = await client.get(url)
      r.raise_for_status()
      html = r.text
  except Exception as e:
    return f"(无法获取该网页内容：{getattr(e, 'message', str(e))[:100]})"
  text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
  text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
  text = re.sub(r"<[^>]+>", " ", text)
  text = re.sub(r"\s+", " ", text).strip()
  return (text or "(无正文)")[:max_chars]


app = FastAPI(title="AI Mindmap Backend")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


# 项目根目录，用来挂前端静态文件
_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


@app.on_event("startup")
def on_startup() -> None:
  init_db()


@app.get("/health")
def health() -> dict:
  return {"status": "ok"}


@app.get("/api/skills")
def api_list_skills() -> dict:
  """列出所有可用 Agent Skills（skills/*.md）。"""
  return {"skills": list_skills()}


def _project_to_out(
  project: Project,
  nodes: List[Node],
  context_links: Optional[List[ContextLinkOut]] = None,
) -> ProjectOut:
  flat = flatten_nodes(nodes)
  materials = [n for n in nodes if getattr(n, "node_type", "") == "material"]
  all_nodes_out = flat + materials
  total, green, percent = calc_progress(flat)
  return ProjectOut(
    id=project.id,
    name=project.name,
    ideaText=project.idea_text,
    status=project.status,
    created_at=project.created_at,
    updated_at=project.updated_at,
    nodes=[
      NodeOut(
        id=n.id,
        project_id=n.project_id,
        parent_id=n.parent_id,
        level=n.level,
        title=n.title,
        question=n.question,
        status=n.status,
        order_index=n.order_index,
        node_type=getattr(n, "node_type", "question"),
        skill_id=getattr(n, "skill_id", None),
      )
      for n in all_nodes_out
    ],
    progress=ProgressOut(total=total, green=green, percent=percent),
    skill_id=getattr(project, "skill_id", None),
    context_links=context_links or [],
  )


@app.post("/api/draft", response_model=DraftCreateResponse)
def api_create_draft(
  payload: DraftCreateRequest = Body(default=DraftCreateRequest()),
  session: Session = Depends(get_session),
) -> DraftCreateResponse:
  draft = create_draft(session, mode=payload.mode)
  return DraftCreateResponse(draft_id=draft.id)


@app.post("/api/draft/{draft_id}/message", response_model=DraftMessageResponse)
async def api_draft_message(
  draft_id: str,
  payload: DraftMessageRequest,
  session: Session = Depends(get_session),
) -> DraftMessageResponse:
  try:
    need_more, reply, title, initial_questions = await draft_append_message(
      session,
      draft_id,
      payload.content,
      ai_client=AIClient(),
      skill_id=payload.skill_id,
    )
  except ValueError as e:
    if str(e) == "draft_not_found":
      raise HTTPException(status_code=404, detail="draft_not_found")
    if str(e) == "draft_already_ready":
      raise HTTPException(status_code=400, detail="draft_already_ready")
    raise
  return DraftMessageResponse(
    need_more=need_more,
    reply=reply,
    title=title,
    initial_questions=initial_questions,
  )


@app.post("/api/projects/from-draft", response_model=ProjectOut)
async def api_create_project_from_draft(
  payload: FromDraftRequest,
  session: Session = Depends(get_session),
) -> ProjectOut:
  try:
    project = await create_project_from_draft(
      session,
      payload.draft_id,
      ai_client=AIClient(),
      skill_id=payload.skill_id,
    )
  except ValueError as e:
    if str(e) == "draft_not_found":
      raise HTTPException(status_code=404, detail="draft_not_found")
    if str(e) == "draft_not_ready":
      raise HTTPException(status_code=400, detail="draft_not_ready")
    raise
  nodes = session.exec(select(Node).where(Node.project_id == project.id)).all()
  return _project_to_out(project, nodes)


@app.post("/api/projects/init", response_model=ProjectOut)
async def init_project(
  payload: ProjectInitRequest,
  session: Session = Depends(get_session),
) -> ProjectOut:
  idea_text = payload.ideaText
  dialog_pairs = [(m.role, m.text) for m in payload.dialog]
  project = await create_project_from_idea(
    session,
    idea_text,
    dialog_pairs,
    ai_client=AIClient(),
    skill_id=payload.skill_id,
  )
  nodes = session.exec(select(Node).where(Node.project_id == project.id)).all()
  return _project_to_out(project, nodes)


@app.get("/api/projects", response_model=List[ProjectListItem])
def list_projects(session: Session = Depends(get_session)) -> List[ProjectListItem]:
  projects = session.exec(select(Project).order_by(Project.created_at.desc())).all()
  items: List[ProjectListItem] = []
  for p in projects:
    nodes = session.exec(select(Node).where(Node.project_id == p.id)).all()
    total, green, percent = calc_progress(flatten_nodes(nodes))
    items.append(
      ProjectListItem(
        id=p.id,
        name=p.name,
        status=p.status,
        progressPercent=percent,
      )
    )
  return items


@app.get("/api/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, session: Session = Depends(get_session)) -> ProjectOut:
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  nodes = session.exec(select(Node).where(Node.project_id == project_id)).all()
  links = session.exec(
    select(ContextLink).where(ContextLink.project_id == project_id)
  ).all()
  context_links = [
    ContextLinkOut(node_a_id=l.node_a_id, node_b_id=l.node_b_id) for l in links
  ]
  return _project_to_out(project, nodes, context_links)


@app.post(
  "/api/projects/{project_id}/context-links",
  response_model=ContextLinkOut,
)
def add_context_link(
  project_id: str,
  payload: ContextLinkCreateRequest,
  session: Session = Depends(get_session),
) -> ContextLinkOut:
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  a, b = payload.node_a_id, payload.node_b_id
  if a == b:
    raise HTTPException(status_code=400, detail="same_node")
  node_a = session.get(Node, a)
  node_b = session.get(Node, b)
  if not node_a or node_a.project_id != project_id:
    raise HTTPException(status_code=404, detail="node_not_found")
  if not node_b or node_b.project_id != project_id:
    raise HTTPException(status_code=404, detail="node_not_found")
  node_a_id, node_b_id = (a, b) if a < b else (b, a)
  existing = session.exec(
    select(ContextLink).where(
      ContextLink.project_id == project_id,
      ContextLink.node_a_id == node_a_id,
      ContextLink.node_b_id == node_b_id,
    )
  ).first()
  if existing:
    return ContextLinkOut(node_a_id=node_a_id, node_b_id=node_b_id)
  link = ContextLink(project_id=project_id, node_a_id=node_a_id, node_b_id=node_b_id)
  session.add(link)
  session.commit()
  return ContextLinkOut(node_a_id=node_a_id, node_b_id=node_b_id)


def _web_search_query_for_node(
  project_idea_text: Optional[str],
  node: Node,
  all_nodes: List[Node],
) -> str:
  """按权重构建搜索 query：当前支点最高，路径上父节点次之（离当前越近权重越高），项目主体一句话带过。"""
  node_map = {n.id: n for n in all_nodes}
  parts: List[str] = []
  # 1. 当前支点权重最高：完整问题与标题
  q = (node.question or "").strip()
  t = (node.title or "").strip()
  if q:
    parts.append(q)
  if t and t != q:
    parts.append(t)
  # 2. 从父到根路径：离当前越近权重越高，总长限制避免抢戏
  ancestor_titles: List[str] = []
  cur = node
  while cur.parent_id:
    parent = node_map.get(cur.parent_id)
    if not parent:
      break
    at = (parent.title or parent.question or "").strip()
    if at and at not in ancestor_titles:
      ancestor_titles.append(at)
    cur = parent
  path_part = " ".join(ancestor_titles[:5])[:80]  # 最多 5 层、总长 80 字
  if path_part:
    parts.append(path_part)
  # 3. 项目主体权重最低：一句话带过（约 30 字）
  idea_brief = (project_idea_text or "").strip()[:30]
  if idea_brief:
    parts.append(idea_brief)
  query = " ".join(p for p in parts if p).strip()
  return query or (node.title or "相关案例")


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/web-search",
  response_model=WebSearchResponse,
)
async def web_search_for_node(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
) -> WebSearchResponse:
  """熵增·网页：按节点问题 + 路径上下文 + 项目构想（低权）搜最相关例子。需配置 SEARCH_API_KEY（如 Serper）。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  node = session.get(Node, node_id)
  if not node or node.project_id != project_id:
    raise HTTPException(status_code=404, detail="node_not_found")
  nodes = session.exec(select(Node).where(Node.project_id == project_id)).all()
  all_nodes = list(nodes)
  query = _web_search_query_for_node(project.idea_text, node, all_nodes)
  if not os.environ.get("SEARCH_API_KEY", "").strip():
    return WebSearchResponse(results=[], hint="请先在项目根目录 .env 中配置 SEARCH_API_KEY（如 Serper）以使用网页搜索")
  ai = AIClient()
  raw = await ai.search_web(query, max_results=5)
  results = [WebSearchResult(title=r["title"], snippet=r["snippet"], url=r["url"]) for r in raw]
  return WebSearchResponse(results=results)


@app.post(
  "/api/projects/{project_id}/materials",
  response_model=NodeOut,
)
async def create_material(
  project_id: str,
  payload: MaterialCreateRequest,
  session: Session = Depends(get_session),
) -> NodeOut:
  """空白右键·导入网站：抓取网页内容，创建为画布上的材料节点，可再通过「链接上下文」与其它节点关联，回答时会参考其内容。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  content = await fetch_url_content(payload.url.strip())
  new_node = create_material_node(
    session, project_id, payload.url.strip(), title=payload.title, content=content
  )
  return NodeOut(
    id=new_node.id,
    project_id=new_node.project_id,
    parent_id=new_node.parent_id,
    level=new_node.level,
    title=new_node.title,
    question=new_node.question,
    status=new_node.status,
    order_index=new_node.order_index,
    node_type=getattr(new_node, "node_type", "question"),
    skill_id=getattr(new_node, "skill_id", None),
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/answer",
  response_model=NodeAnswerResponse,
)
async def answer_node(
  project_id: str,
  node_id: str,
  payload: NodeAnswerRequest,
  session: Session = Depends(get_session),
) -> NodeAnswerResponse:
  try:
    node, nodes, next_node_id, added_nodes = await answer_node_and_trace(
      session, project_id, node_id, payload.content, ai_client=AIClient(), by_ai=payload.by_ai
    )
  except ValueError as e:  # noqa: B902
    if str(e) == "project_not_found":
      raise HTTPException(status_code=404, detail="project_not_found")
    if str(e) == "node_not_found":
      raise HTTPException(status_code=404, detail="node_not_found")
    raise

  flat = flatten_nodes(nodes)
  total, green, percent = calc_progress(flat)

  answers = (
    session.exec(select(NodeAnswer).where(NodeAnswer.node_id == node.id).order_by(NodeAnswer.created_at))
    .all()
  )

  node_with_answers = NodeWithAnswers(
    id=node.id,
    level=node.level,
    title=node.title,
    question=node.question,
    status=node.status,
    answers=[a.content for a in answers],
  )

  added_out = None
  if added_nodes:
    added_out = [
      NodeOut(
        id=n.id,
        project_id=n.project_id,
        parent_id=n.parent_id,
        level=n.level,
        title=n.title,
        question=n.question,
        status=n.status,
        order_index=n.order_index,
        node_type=getattr(n, "node_type", "question"),
        skill_id=getattr(n, "skill_id", None),
      )
      for n in added_nodes
    ]

  return NodeAnswerResponse(
    updatedNode=node_with_answers,
    projectProgress=ProgressOut(total=total, green=green, percent=percent),
    nextNodeId=next_node_id,
    addedNodes=added_out,
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/spawn",
  response_model=NodeOut,
)
async def spawn_node(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
  allow_fallback: bool = Query(True, description="无追问时是否使用兜底文案创建子节点；超级 Agent 传 false 以跳过无质量追问"),
) -> NodeOut:
  """
  基于已回答节点生成追问子节点。allow_fallback=True 时无追问用兜底；False 时无追问返回 400 no_followup。
  """
  try:
    new_node = await spawn_followup_node(
      session, project_id, node_id, ai_client=AIClient(), allow_fallback=allow_fallback
    )
  except ValueError as e:  # noqa: B902
    msg = str(e)
    if msg == "project_not_found":
      raise HTTPException(status_code=404, detail="project_not_found")
    if msg == "node_not_found":
      raise HTTPException(status_code=404, detail="node_not_found")
    if msg in {"no_answer", "no_followup"}:
      logging.getLogger("uvicorn.error").info("spawn 400: %s (project=%s node=%s)", msg, project_id, node_id)
      raise HTTPException(status_code=400, detail=msg)
    raise

  return NodeOut(
    id=new_node.id,
    project_id=new_node.project_id,
    parent_id=new_node.parent_id,
    level=new_node.level,
    title=new_node.title,
    question=new_node.question,
    status=new_node.status,
    order_index=new_node.order_index,
    node_type=getattr(new_node, "node_type", "question"),
    skill_id=getattr(new_node, "skill_id", None),
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/spawn-section-question",
  response_model=NodeOut,
)
async def spawn_section_question_endpoint(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
) -> NodeOut:
  """黑客松：在文件夹板块下生成一个由该板块 Skills 指导的新问题（仅追问）。"""
  try:
    new_node = await spawn_section_question(
      session, project_id, node_id, ai_client=AIClient()
    )
  except ValueError as e:  # noqa: B902
    msg = str(e)
    if msg == "project_not_found":
      raise HTTPException(status_code=404, detail="project_not_found")
    if msg == "node_not_found":
      raise HTTPException(status_code=404, detail="node_not_found")
    if msg == "not_section_node":
      raise HTTPException(status_code=400, detail="not_section_node")
    raise

  return NodeOut(
    id=new_node.id,
    project_id=new_node.project_id,
    parent_id=new_node.parent_id,
    level=new_node.level,
    title=new_node.title,
    question=new_node.question,
    status=new_node.status,
    order_index=new_node.order_index,
    node_type=getattr(new_node, "node_type", "question"),
    skill_id=getattr(new_node, "skill_id", None),
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/tips",
  response_model=NodeOut,
)
async def spawn_tips(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
) -> NodeOut:
  """
  基于已回答节点，生成一个 Tips 子节点（蓝色信息节点，不需要作答）。
  """
  try:
    new_node = await spawn_tips_node(session, project_id, node_id, ai_client=AIClient())
  except ValueError as e:  # noqa: B902
    msg = str(e)
    if msg == "project_not_found":
      raise HTTPException(status_code=404, detail="project_not_found")
    if msg == "node_not_found":
      raise HTTPException(status_code=404, detail="node_not_found")
    if msg == "no_answer":
      raise HTTPException(status_code=400, detail="no_answer")
    raise

  return NodeOut(
    id=new_node.id,
    project_id=new_node.project_id,
    parent_id=new_node.parent_id,
    level=new_node.level,
    title=new_node.title,
    question=new_node.question,
    status=new_node.status,
    order_index=new_node.order_index,
    node_type=new_node.node_type,
    skill_id=getattr(new_node, "skill_id", None),
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/answer/suggest",
  response_model=AnswerSuggestResponse,
)
async def suggest_node_answer(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
  payload: Optional[AnswerSuggestRequest] = Body(None),
) -> AnswerSuggestResponse:
  """自动模式用：针对节点问题生成直接回答。可选 body.web_snippets 注入网页搜索摘要。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  node = session.get(Node, node_id)
  if not node or node.project_id != project.id:
    raise HTTPException(status_code=404, detail="node_not_found")
  question = (getattr(node, "question", None) or "").strip()
  if not question:
    return AnswerSuggestResponse(content="")
  ai = AIClient()
  skill_content = get_skill_content_for_node(session, project_id, node_id)
  linked = get_linked_context_for_node(session, project_id, node_id)
  if linked:
    skill_content = (skill_content or "") + "\n\n关联上下文（供参考）：\n" + linked
  if payload and payload.web_snippets:
    snippet_block = "网页参考（供参考）：\n" + "\n\n".join(
      (s or "").strip() for s in payload.web_snippets[:5] if (s or "").strip()
    )[:4000]
    if snippet_block:
      skill_content = (skill_content or "") + "\n\n" + snippet_block
  content = await ai.generate_node_answer(
    project.idea_text or "", question, skill_content=skill_content
  )
  return AnswerSuggestResponse(content=(content or "").strip())


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/tips/candidates",
  response_model=TipsCandidatesResponse,
)
async def get_tips_candidates(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
  payload: Optional[TipsCandidatesRequest] = Body(None),
) -> TipsCandidatesResponse:
  """给 Tips 节点拉 2～3 条可选文案。可选 body.web_snippets 注入网页搜索摘要。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  node = session.get(Node, node_id)
  if not node or node.project_id != project.id:
    raise HTTPException(status_code=404, detail="node_not_found")

  ai = AIClient()
  skill_content = get_skill_content_for_node(session, project_id, node_id)
  linked = get_linked_context_for_node(session, project_id, node_id)
  if linked:
    skill_content = (skill_content or "") + "\n\n关联上下文（供参考）：\n" + linked
  if payload and payload.web_snippets:
    snippet_block = "网页参考（供参考）：\n" + "\n\n".join(
      (s or "").strip() for s in payload.web_snippets[:5] if (s or "").strip()
    )[:4000]
    if snippet_block:
      skill_content = (skill_content or "") + "\n\n" + snippet_block

  if getattr(node, "node_type", "question") == "tip":
    parent = session.get(Node, node.parent_id) if node.parent_id else None
    if not parent:
      raise HTTPException(status_code=400, detail="no_parent")
    latest_answer = session.exec(
      select(NodeAnswer).where(NodeAnswer.node_id == parent.id).order_by(NodeAnswer.created_at.desc())
    ).first()
    latest_answer_text = latest_answer.content if latest_answer else ""
    cands = await ai.make_tips_candidates(
      project.idea_text, parent.question, latest_answer_text, skill_content=skill_content
    )
  else:
    latest_answer = session.exec(
      select(NodeAnswer).where(NodeAnswer.node_id == node.id).order_by(NodeAnswer.created_at.desc())
    ).first()
    latest_answer_text = latest_answer.content if latest_answer else ""
    cands = await ai.make_tips_candidates(
      project.idea_text, node.question, latest_answer_text, skill_content=skill_content
    )
  return TipsCandidatesResponse(candidates=cands)


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/tips/choose",
  response_model=NodeOut,
)
async def choose_tip(
  project_id: str,
  node_id: str,
  payload: TipsChooseRequest,
  session: Session = Depends(get_session),
) -> NodeOut:
  """用户选一条 Tips 固化到节点上，顺便用 AI 起个短标题。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  node = session.get(Node, node_id)
  if not node or node.project_id != project.id:
    raise HTTPException(status_code=404, detail="node_not_found")
  if getattr(node, "node_type", "question") != "tip":
    raise HTTPException(status_code=400, detail="not_tip_node")

  content = (payload.content or "").strip()
  if not content:
    raise HTTPException(status_code=400, detail="empty_content")

  ai = AIClient()
  title = await ai.make_short_title(content)
  node.question = content
  node.title = title
  node.status = "tip"  # 仍作为信息节点
  session.add(node)
  session.commit()
  session.refresh(node)

  return NodeOut(
    id=node.id,
    project_id=node.project_id,
    parent_id=node.parent_id,
    level=node.level,
    title=node.title,
    question=node.question,
    status=node.status,
    order_index=node.order_index,
    node_type=node.node_type,
    skill_id=getattr(node, "skill_id", None),
  )


@app.post(
  "/api/projects/{project_id}/nodes/{node_id}/title",
  response_model=ShortTitleResponse,
)
async def make_node_title(
  project_id: str,
  node_id: str,
  session: Session = Depends(get_session),
) -> ShortTitleResponse:
  """给节点用 AI 起个 2～5 字短标题；前端在等的时候会显示「命名中…」。"""
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  node = session.get(Node, node_id)
  if not node or node.project_id != project.id:
    raise HTTPException(status_code=404, detail="node_not_found")
  ai = AIClient()
  new_title = await ai.make_short_title(node.question)
  node.title = new_title
  session.add(node)
  session.commit()
  session.refresh(node)
  return ShortTitleResponse(title=new_title)


@app.post("/api/projects/{project_id}/merge", response_model=MergeResponse)
async def merge_project(project_id: str, session: Session = Depends(get_session)) -> MergeResponse:
  project = session.get(Project, project_id)
  if not project:
    raise HTTPException(status_code=404, detail="project_not_found")
  nodes = session.exec(select(Node).where(Node.project_id == project_id)).all()
  flat = flatten_nodes(nodes)
  total, green, _ = calc_progress(flat)
  if not total or total != green:
    raise HTTPException(status_code=400, detail="project_not_completed")

  # 聚合节点问答
  sections: List[str] = []
  for n in flat:
    if n.level == 0:
      continue
    answers = (
      session.exec(select(NodeAnswer).where(NodeAnswer.node_id == n.id).order_by(NodeAnswer.created_at))
      .all()
    )
    if not answers:
      continue
    path_titles: List[str] = []
    cur = n
    # 通过 parent_id 向上追溯路径
    by_id = {x.id: x for x in flat}
    while cur:
      path_titles.append(cur.title)
      cur = by_id.get(cur.parent_id) if cur.parent_id else None
    path_titles.reverse()
    sections.append(f"### {' > '.join(path_titles)}")
    sections.append("")
    sections.append(f"**节点问题：** {n.question}")
    sections.append("")
    sections.append("**用户解答：**")
    for i, a in enumerate(answers, start=1):
      sections.append(f"- 解答 {i}：{a.content}")
    sections.append("")

  ai_client = AIClient()
  skill_content = get_skill_content(getattr(project, "skill_id", None))
  content = await ai_client.merge_project_doc(
    project.name, project.idea_text, sections, skill_content=skill_content
  )
  return MergeResponse(content=content)


# 文档解析：拖拽/上传 txt｜pdf｜docx｜md，用 JSON+Base64 传，不依赖 python-multipart

_ALLOWED_DOC_EXT = {".txt", ".pdf", ".docx", ".md"}
_MAX_DOC_BYTES = 5 * 1024 * 1024  # 5MB


def _parse_txt(content: bytes) -> str:
  for enc in ("utf-8", "gbk", "gb2312", "utf-8-sig"):
    try:
      return content.decode(enc)
    except Exception:
      continue
  return content.decode("utf-8", errors="replace")


def _parse_pdf(content: bytes) -> str:
  from pypdf import PdfReader
  reader = PdfReader(io.BytesIO(content))
  parts = []
  for page in reader.pages:
    t = page.extract_text()
    if t:
      parts.append(t)
  return "\n\n".join(parts) if parts else ""


def _parse_docx(content: bytes) -> str:
  from docx import Document
  doc = Document(io.BytesIO(content))
  return "\n".join(p.text for p in doc.paragraphs)


@app.post("/api/parse-document")
async def parse_document(payload: dict = Body(...)) -> dict:
  """解析上传的项目书，请求体 JSON：filename + content_base64，返回提取的 text。"""
  filename = (payload.get("filename") or "").strip()
  content_b64 = payload.get("content_base64") or ""
  if not filename:
    raise HTTPException(status_code=400, detail="missing_filename")
  if not content_b64:
    raise HTTPException(status_code=400, detail="missing_content_base64")
  ext = os.path.splitext(filename)[1].lower()
  if ext not in _ALLOWED_DOC_EXT:
    raise HTTPException(status_code=400, detail="unsupported_type")
  try:
    raw = base64.b64decode(content_b64, validate=True)
  except Exception as e:
    raise HTTPException(status_code=400, detail="invalid_base64")
  if len(raw) > _MAX_DOC_BYTES:
    raise HTTPException(status_code=400, detail="file_too_large")
  if ext == ".txt" or ext == ".md":
    text = _parse_txt(raw)
  elif ext == ".pdf":
    try:
      text = _parse_pdf(raw)
    except Exception as e:
      raise HTTPException(status_code=400, detail=f"pdf_parse_error:{e!s}")
  elif ext == ".docx":
    try:
      text = _parse_docx(raw)
    except Exception as e:
      raise HTTPException(status_code=400, detail=f"docx_parse_error:{e!s}")
  else:
    raise HTTPException(status_code=400, detail="unsupported_type")
  text = (text or "").strip()
  if not text:
    raise HTTPException(status_code=400, detail="empty_content")
  return {"text": text[:50000]}


# 挂前端：访问 http://localhost:8000/ 即可用，别用 file:// 开页面
app.mount("/", StaticFiles(directory=_ROOT_DIR, html=True), name="frontend")
