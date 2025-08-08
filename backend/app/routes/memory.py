# app/routes/memory.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas import AddMemoryRequest, SearchMemoryRequest, AddMemoryResponse, SearchResponse
from app.services.memory_service import add_embedding, search_embedding
from app.routes.memory_store import generate_embedding  # ✅ updated import
from typing import Dict, List

router = APIRouter()

# 🔹 FAISS-Based Vector Memory Endpoints
@router.post("/memory/add", response_model=AddMemoryResponse)
def add_memory(
    request: AddMemoryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    embedding = generate_embedding(request.text).tolist()  # ✅ updated call
    return add_embedding(db, embedding, request.text, current_user.id)

@router.post("/memory/search", response_model=SearchResponse)
def search_memory(
    request: SearchMemoryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    embedding = generate_embedding(request.query).tolist()  # ✅ updated call
    return search_embedding(db, embedding, request.k)

# 🔸 Buffer Memory Logic (Per-Session Sliding Window)
class BufferMemory:
    def __init__(self, buffer_size: int = 6):
        self.buffer_size = buffer_size
        self.buffer: Dict[str, List[Dict[str, str]]] = {}

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.buffer:
            self.buffer[session_id] = []
        self.buffer[session_id].append({"role": role, "content": content})
        if len(self.buffer[session_id]) > self.buffer_size:
            self.buffer[session_id].pop(0)

    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        return self.buffer.get(session_id, [])
