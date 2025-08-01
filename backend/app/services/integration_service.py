import requests
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def export_to_wordpress(content: str, title: str, wp_base_url: str, token: str):
    wp_api_url = f"{wp_base_url.rstrip('/')}/wp-json/wp/v2/posts"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "content": content,
        "status": "publish"
    }
    response = requests.post(wp_api_url, headers=headers, json=data)
    response.raise_for_status()
    return response.json()

def send_via_sendgrid(to_email: str, subject: str, content: str, api_key: str):
    message = Mail(
        from_email='your_verified_email@domain.com',  # Replace or load from env
        to_emails=to_email,
        subject=subject,
        html_content=content
    )
    sg = SendGridAPIClient(api_key)
    response = sg.send(message)
    return response.status_code, response.body
