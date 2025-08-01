from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.services.memory_service import add_embedding, search_embedding
from app.routes.memory_store import embedder
from app.routes.memory import BufferMemory  # ✅ Import buffer memory
from app import models, dependencies
from pydantic import BaseModel
import requests
import json
import time

router = APIRouter()

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
HEADERS = {"Content-Type": "application/json", "Authorization": "Bearer lm-studio"}
MODEL_NAME = "mistralai/mistral-7b-instruct-v0.3"

# ✅ Instantiate BufferMemory (global per server)
buffer_memory = BufferMemory(buffer_size=6)

class PromptRequest(BaseModel):
    prompt: str
    session_id: str

def stream_generate_content(messages: list):
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0.7,
        "stream": True
    }

    response = requests.post(LM_STUDIO_URL, headers=HEADERS, json=payload, stream=True)

    if response.status_code != 200:
        raise Exception(f"LM Studio API Error: {response.text}")

    def event_stream():
        for line in response.iter_lines():
            if line:
                try:
                    line_str = line.decode("utf-8")
                    if line_str.startswith("data: "):
                        line_str = line_str[6:]
                    if line_str.strip() == "[DONE]":
                        break
                    data = json.loads(line_str)
                    content = data["choices"][0]["delta"].get("content")
                    if content:
                        yield content
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

    # ✅ Add user prompt to buffer memory
    buffer_memory.add_message(session_id, "user", prompt)

    # 🔍 Search semantic memory
    embedding = embedder.encode(prompt, convert_to_numpy=True)
    memories = search_embedding(db, embedding)

    semantic_memory_msgs = [{"role": "user", "content": m.text} for m in memories.matches] if memories.matches else []

    # 🧠 Fetch recent buffer memory
    buffer_messages = buffer_memory.get_messages(session_id)

    # 🔗 Combine both memory types
    messages = semantic_memory_msgs + buffer_messages

    try:
        start_time = time.time()
        stream = stream_generate_content(messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {e}")

    final_content = []

    def wrapper():
        for chunk in stream:
            final_content.append(chunk)
            yield chunk

    def save_data():
        content = "".join(final_content)

        # ✅ Add assistant response to buffer
        buffer_memory.add_message(session_id, "assistant", content)

        # 📊 Save analytics
        response_time = round(time.time() - start_time, 3)
        try:
            prompt_effectiveness = round(len(content) / max(len(prompt), 1), 2)
        except Exception:
            prompt_effectiveness = 0.0
        engagement_score = round(len(content) / 100.0, 2)

        # 💾 Save to database
        generated = models.GeneratedContent(
            text=content,
            model_used="mistral (lmstudio-local)",
            owner_id=current_user.id
        )
        db.add(generated)

        chat = models.ChatHistory(
            session_id=session_id,
            prompt=prompt,
            response=content,
            owner_id=current_user.id
        )
        db.add(chat)

        add_embedding(db, embedding, prompt, current_user.id)

        analytics = models.Analytics(
            event_type="generate",
            details="Generated content using LM Studio (mistral)",
            owner_id=current_user.id,
            response_time=response_time,
            prompt_effectiveness=prompt_effectiveness,
            engagement_score=engagement_score
        )
        db.add(analytics)

        db.commit()

    background_tasks.add_task(save_data)

    return StreamingResponse(wrapper(), media_type="text/plain")
