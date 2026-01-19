# agents/phishing_agent.py

import re

TRUSTED_DOMAINS = [
    "google.com",
    "accounts.google.com",
    "myaccount.google.com",
    "freecodecamp.org",
    "amazon.com",
    "github.com"
]

def detect_phishing(email_text):
    urls = re.findall(r'https?://\S+', email_text)

    if not urls:
        return "clean", []

    # If all links belong to trusted domains → safe
    safe_links = 0
    for url in urls:
        for domain in TRUSTED_DOMAINS:
            if domain in url:
                safe_links += 1

    if safe_links == len(urls):
        return "trusted_link", urls

    # Otherwise suspicious
    return "phishing_suspected", urls
