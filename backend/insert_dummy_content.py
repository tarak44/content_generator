from app.database import SessionLocal
from app.models import GeneratedContent
from datetime import datetime

def insert_dummy_content():
    db = SessionLocal()
    new_content = GeneratedContent(
        text="This is a dummy generated text for export testing.",
        model_used="test-model",
        created_at=datetime(2025, 7, 5, 10, 0, 0),
        owner_id=1  # Ensure this user exists in your DB
    )
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    print(f"✅ Inserted generated content with ID: {new_content.id}")
    db.close()

if __name__ == "__main__":
    insert_dummy_content()
