from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from . import models, database
from app.routes import (
    users,
    templates,
    generate,
    analytics,
    exports,
    prompts,
    quality,
    memory,
    integration,
    docs,
    user,
    chat_history
)
from app.database import SessionLocal
from fastapi.staticfiles import StaticFiles
import os

load_dotenv()
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Content Generator Backend",
    description="FastAPI backend using Groq API (LLM in the cloud)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    # No need to initialize index unless you are persisting it
    db.close()

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")),
    name="static"
)

app.include_router(users.router)
app.include_router(templates.router)
app.include_router(generate.router)
app.include_router(analytics.router)
app.include_router(exports.router)
app.include_router(prompts.router)
app.include_router(quality.router)
app.include_router(memory.router)
app.include_router(integration.router)
app.include_router(docs.router)
app.include_router(user.router)
app.include_router(chat_history.router)

@app.get("/")
def read_root():
    return {"message": "✅ Content Generator Backend using Groq API is running successfully!"}
