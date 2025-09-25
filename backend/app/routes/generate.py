from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.services.memory_service import add_embedding, search_embedding  # ← This must use sklearn internally
from app.routes.memory import BufferMemory
from app import models, dependencies
from pydantic import BaseModel
import requests
import json
import time
import os
from app.routes.memory_store import generate_embedding
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# ✅ GROQ API Setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set.")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

# ✅ Use a model you're authorized for
MODEL_NAME = "llama-3.1-8b-instant"  

buffer_memory = BufferMemory(buffer_size=6)

class PromptRequest(BaseModel):
    prompt: str
    session_id: str

def stream_content(messages: list):
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0.7,
        "stream": True,
    }

    response = requests.post(GROQ_API_URL, headers=HEADERS, json=payload, stream=True)

    if response.status_code != 200:
        raise Exception(f"GROQ API Error: {response.text}")

    def event_stream():
        for line in response.iter_lines():
            if line:
                if line.strip() == b"data: [DONE]":
                    break
                if line.startswith(b"data: "):
                    data = line.removeprefix(b"data: ").decode("utf-8")
                    try:
                        chunk = json.loads(data)
                        content_piece = chunk["choices"][0]["delta"].get("content", "")
                        yield content_piece
                    except Exception:
                        continue

    return event_stream()

@router.post("/generate/")
async def generate(
    request: PromptRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    prompt = request.prompt
    session_id = request.session_id

    # Add to buffer memory
    buffer_memory.add_message(session_id, "user", prompt)

    # Search semantic memory
    embedding = generate_embedding(prompt)

    memories = search_embedding(db, embedding)  # <- This now uses sklearn under the hood

    semantic_memory_msgs = [{"role": "user", "content": m.text} for m in memories.matches] if memories.matches else []
    buffer_messages = buffer_memory.get_messages(session_id)

    # Combine context
    messages = semantic_memory_msgs + buffer_messages

    content_collector = []
    start_time = time.time()

    def stream_and_save():
        for chunk in stream_content(messages):
            content_collector.append(chunk)
            yield chunk

    def save_data():
        content = "".join(content_collector)
        response_time = round(time.time() - start_time, 3)
        try:
            prompt_effectiveness = round(len(content) / max(len(prompt), 1), 2)
        except Exception:
            prompt_effectiveness = 0.0
        engagement_score = round(len(content) / 100.0, 2)

        db.add(models.GeneratedContent(
            text=content,
            model_used=f"{MODEL_NAME} (groq)",
            owner_id=current_user.id
        ))

        db.add(models.ChatHistory(
            session_id=session_id,
            prompt=prompt,
            response=content,
            owner_id=current_user.id
        ))

        add_embedding(db, embedding, prompt, current_user.id)

        db.add(models.Analytics(
            event_type="generate",
            details=f"Generated content using Groq ({MODEL_NAME})",
            owner_id=current_user.id,
            response_time=response_time,
            prompt_effectiveness=prompt_effectiveness,
            engagement_score=engagement_score
        ))

        db.commit()

    background_tasks.add_task(save_data)

    # ✅ Store empty string for assistant before content is streamed
    buffer_memory.add_message(session_id, "assistant", "")

    return StreamingResponse(stream_and_save(), media_type="text/plain")
