import streamlit as st

from agents.email_fetch_agent import fetch_spam_emails
from agents.content_agent import analyze_email
from agents.spam_type_agent import classify_spam_type
from agents.sender_agent import check_sender
from agents.phishing_agent import detect_phishing
from agents.decision_agent import decide
from agents.action_agent import take_action

st.set_page_config(
    page_title="Agentic AI Spam Detection",
    layout="wide"
)

st.title("📧 Agentic AI Email Spam Detection System")
st.markdown("Analyzing **real Gmail emails** using multiple AI agents")

if st.button("📥 Fetch & Analyze Emails"):
    with st.spinner("Fetching and analyzing emails..."):
        emails = fetch_spam_emails(max_results=5)

    for idx, e in enumerate(emails, start=1):
        sender = e["sender"]
        text = e["email_text"]

        phishing_status, links = detect_phishing(text)
        content_label, confidence = analyze_email(text)
        spam_type = classify_spam_type(text, links)
        sender_status = check_sender(sender)

        decision = decide(content_label, confidence, sender_status)

        if phishing_status == "phishing_suspected" and sender_status != "trusted":
            decision = "SPAM"

        action = take_action(decision)

        # UI CARD
        with st.expander(f"📧 Email {idx} — {sender}", expanded=True):
            col1, col2, col3 = st.columns(3)

            col1.metric("Content Label", content_label.upper())
            col2.metric("Confidence", f"{round(float(confidence),2)}")
            col3.metric("Spam Type", spam_type)

            col4, col5, col6 = st.columns(3)
            col4.metric("Sender Status", sender_status)
            col5.metric("Phishing Status", phishing_status)

            if decision == "SPAM":
                col6.error("🚫 SPAM")
            else:
                col6.success("✅ HAM")

            st.progress(min(float(confidence), 1.0))

            st.markdown("**Action Taken:**")
            if decision == "SPAM":
                st.error(action)
            else:
                st.success(action)

            st.markdown("**Email Preview:**")
            st.text(text[:800] if text else "No readable text (HTML email)")
