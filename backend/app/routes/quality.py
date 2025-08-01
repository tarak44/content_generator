from fastapi import APIRouter
from pydantic import BaseModel
from textblob import TextBlob
import random

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/quality/grammar")
async def grammar_check(request: TextRequest):
    blob = TextBlob(request.text)
    corrected = str(blob.correct())
    return {"corrected_text": corrected}

@router.post("/quality/plagiarism")
async def plagiarism_check(request: TextRequest):
    score = random.randint(0, 20)  # Dummy plagiarism % 0-20%
    return {"plagiarism_score": score}

@router.post("/quality/sentiment")
async def sentiment_analysis(request: TextRequest):
    blob = TextBlob(request.text)
    polarity = blob.sentiment.polarity
    sentiment = "neutral"
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    return {
        "sentiment": sentiment,
        "polarity": polarity
    }
