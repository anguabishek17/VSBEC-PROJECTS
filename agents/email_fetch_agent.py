import os
import base64
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Gmail read-only scope
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def fetch_spam_emails(max_results=5):
    creds = None

    # 1️⃣ Load token.json if exists
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    # 2️⃣ If no valid credentials, do OAuth ONCE
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save token.json
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    # 3️⃣ Build Gmail service
    service = build("gmail", "v1", credentials=creds)

    # 4️⃣ Fetch spam messages
    results = service.users().messages().list(
        userId="me",
        labelIds=["SPAM"],
        maxResults=max_results
    ).execute()

    messages = results.get("messages", [])
    emails = []

    for msg in messages:
        msg_data = service.users().messages().get(
            userId="me", id=msg["id"], format="full"
        ).execute()

        headers = msg_data["payload"].get("headers", [])
        sender = "Unknown"
        for h in headers:
            if h["name"].lower() == "from":
                sender = h["value"]

        body = ""
        parts = msg_data["payload"].get("parts", [])
        for part in parts:
            if part["mimeType"] == "text/plain" and "data" in part["body"]:
                body = base64.urlsafe_b64decode(
                    part["body"]["data"]
                ).decode("utf-8", errors="ignore")

        emails.append({
            "sender": sender,
            "email_text": body
        })

    return emails
