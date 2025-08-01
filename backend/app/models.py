from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Viewer")
    email = Column(String, unique=True, index=True, nullable=True)
    bio = Column(Text, nullable=True)
    profile_pic_url = Column(String, nullable=True)

    templates = relationship("Template", back_populates="owner")
    prompts = relationship("Prompt", back_populates="owner")
    analytics = relationship("Analytics", back_populates="owner")
    exports = relationship("Export", back_populates="owner")
    generated_contents = relationship("GeneratedContent", back_populates="owner")
    memory_embeddings = relationship("MemoryEmbedding", back_populates="owner")
    chat_history = relationship("ChatHistory", back_populates="owner")
    chat_sessions = relationship("ChatSession", back_populates="owner")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    prompt_text = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="templates")


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="prompts")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    engagement_score = Column(Float, nullable=True)  # For dashboard metric
    response_time = Column(Float, nullable=True)  # ✅ Added for dashboard metric
    prompt_effectiveness = Column(Float, nullable=True)  # ✅ Added for dashboard metric

    owner = relationship("User", back_populates="analytics")




class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="exports")


class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    model_used = Column(String, nullable=False)  # e.g., "mistral (LM Studio)"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="generated_contents")


class MemoryEmbedding(Base):
    __tablename__ = "memory_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    faiss_id = Column(Integer, unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    text = Column(String, nullable=True)

    owner = relationship("User", back_populates="memory_embeddings")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False)  # Added session ID for chat tabs
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="chat_history")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String, nullable=False)  # "user" or "bot"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
