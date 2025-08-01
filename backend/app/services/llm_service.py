import httpx

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
MODEL_NAME = "mistralai/mistral-7b-instruct-v0.3"

def generate_content(topic: str) -> str:
    prompt = f"Write an article about {topic}."

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 512,
        "stream": False
    }

    try:
        response = httpx.post(LM_STUDIO_URL, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        raise Exception(f"LM Studio generation failed: {e.response.text}")
