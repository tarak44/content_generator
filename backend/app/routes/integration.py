from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from app.services.integration_service import export_to_wordpress, send_via_sendgrid
from app.dependencies import get_current_user

router = APIRouter(prefix="/integrate", tags=["Integration"])

class WPRequest(BaseModel):
    title: str
    content: str
    wp_api_url: HttpUrl
    token: str

@router.post("/wordpress", operation_id="post_to_wordpress")
def integrate_wordpress(req: WPRequest, current_user=Depends(get_current_user)):
    try:
        result = export_to_wordpress(req.content, req.title, str(req.wp_api_url), req.token)
        return {"message": "Posted to WordPress", "response": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class SendGridRequest(BaseModel):
    to_email: str
    subject: str
    content: str
    api_key: str

@router.post("/sendgrid", operation_id="send_via_sendgrid")
def integrate_sendgrid(req: SendGridRequest, current_user=Depends(get_current_user)):
    try:
        status_code, body = send_via_sendgrid(req.to_email, req.subject, req.content, req.api_key)
        return {"message": "Email sent", "status_code": status_code, "body": body}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cms/export", operation_id="export_cms_content")
def export_cms(current_user=Depends(get_current_user)):
    return {"message": "CMS export initiated (WordPress, Webflow)"}

@router.post("/email/connect", operation_id="connect_email_marketing")
def connect_email_platform(current_user=Depends(get_current_user)):
    return {"message": "Email marketing platform connected (Mailchimp, SendGrid)"}

@router.get("/enterprise/api-docs", operation_id="get_enterprise_api_docs")
def get_api_docs(current_user=Depends(get_current_user)):
    return {"message": "Enterprise API docs available at /docs or provided URL"}
