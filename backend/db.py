import os

from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mindmap.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
  """建表；会顺带 import models 把表结构注册上。已有表时补缺列（如 skill_id）。"""
  from . import models  # noqa: F401

  SQLModel.metadata.create_all(engine)
  # 兼容旧库：为 project 表补 skill_id 列（若已存在则忽略）
  if "sqlite" in DATABASE_URL:
    try:
      with engine.connect() as conn:
        conn.execute(text("ALTER TABLE project ADD COLUMN skill_id TEXT"))
        conn.commit()
    except Exception:
      pass


def get_session() -> Session:
  with Session(engine) as session:
    yield session


