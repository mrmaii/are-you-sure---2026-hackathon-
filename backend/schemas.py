from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel
from sqlmodel import SQLModel


class DialogMessage(BaseModel):
  role: str  # "user" | "system"
  text: str


class ProjectInitRequest(BaseModel):
  ideaText: str
  dialog: List[DialogMessage]
  skill_id: Optional[str] = None


class NodeOut(SQLModel):
  id: str
  project_id: str
  parent_id: Optional[str]
  level: int
  title: str
  question: str
  status: str
  order_index: int
  node_type: Optional[str] = "question"
  skill_id: Optional[str] = None


class ProgressOut(BaseModel):
  total: int
  green: int
  percent: int


class ContextLinkOut(BaseModel):
  node_a_id: str
  node_b_id: str


class ContextLinkCreateRequest(BaseModel):
  node_a_id: str
  node_b_id: str


class ProjectOut(BaseModel):
  id: str
  name: str
  ideaText: str
  status: str
  created_at: datetime
  updated_at: datetime
  nodes: List[NodeOut]
  progress: ProgressOut
  skill_id: Optional[str] = None
  context_links: List[ContextLinkOut] = []


class ProjectListItem(BaseModel):
  id: str
  name: str
  status: str
  progressPercent: int


class NodeAnswerRequest(BaseModel):
  content: str
  by_ai: bool = False


class NodeWithAnswers(BaseModel):
  id: str
  level: int
  title: str
  question: str
  status: str
  answers: List[str]


class NodeAnswerResponse(BaseModel):
  updatedNode: NodeWithAnswers
  projectProgress: ProgressOut
  nextNodeId: Optional[str] = None
  addedNodes: Optional[List[NodeOut]] = None


class MergeResponse(BaseModel):
  content: str


class ShortTitleResponse(BaseModel):
  title: str


class TipsCandidatesRequest(BaseModel):
  """可选：超级 Agent 等场景传入网页搜索摘要，拼入候选生成上下文"""
  web_snippets: Optional[List[str]] = None


class TipsCandidatesResponse(BaseModel):
  candidates: List[str]


class AnswerSuggestRequest(BaseModel):
  """可选：超级 Agent 等场景传入网页搜索摘要，拼入回答生成上下文"""
  web_snippets: Optional[List[str]] = None


class AnswerSuggestResponse(BaseModel):
  """自动模式用：针对节点问题生成的直接回答（追问+回答为主，非 Tips）"""
  content: str


class TipsChooseRequest(BaseModel):
  content: str


class WebSearchResult(BaseModel):
  title: str
  snippet: str
  url: str


class WebSearchResponse(BaseModel):
  results: List[WebSearchResult]
  hint: Optional[str] = None  # 未配置密钥等时提示用户


class MaterialCreateRequest(BaseModel):
  url: str
  title: Optional[str] = None


# ---------- Draft 立项对话 ----------


class DraftCreateResponse(BaseModel):
  draft_id: str


class DraftCreateRequest(BaseModel):
  mode: str = "detail"  # brief | detail | deep


class DraftMessageRequest(BaseModel):
  content: str
  skill_id: Optional[str] = None


class DraftMessageResponse(BaseModel):
  need_more: bool
  reply: str
  title: Optional[str] = None
  initial_questions: Optional[List[str]] = None


class FromDraftRequest(BaseModel):
  draft_id: str
  skill_id: Optional[str] = None


