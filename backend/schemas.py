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


class TipsCandidatesResponse(BaseModel):
  candidates: List[str]


class AnswerSuggestResponse(BaseModel):
  """自动模式用：针对节点问题生成的直接回答（追问+回答为主，非 Tips）"""
  content: str


class TipsChooseRequest(BaseModel):
  content: str


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


