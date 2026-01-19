# agents/sender_agent.py

# Domains that should NEVER be treated as spam senders
TRUSTED_DOMAINS = [
    "google.com",
    "accounts.google.com",
    "myaccount.google.com",
    "freecodecamp.org",
    "hack2skill.com",
    "github.com",
    "amazon.com"
]

# Memory to track how often unknown senders appear
sender_memory = {}

def extract_domain(sender_email):
    """
    Extract domain from sender email string
    Example: 'Google <no-reply@accounts.google.com>' -> accounts.google.com
    """
    if "<" in sender_email and ">" in sender_email:
        sender_email = sender_email.split("<")[1].split(">")[0]
    return sender_email.split("@")[-1].lower()

def check_sender(sender_email):
    domain = extract_domain(sender_email)

    # ✅ Trusted sender
    for trusted in TRUSTED_DOMAINS:
        if trusted in domain:
            return "trusted"

    # 🧠 Memory-based reputation for unknown senders
    sender_memory[domain] = sender_memory.get(domain, 0) + 1

    if sender_memory[domain] >= 3:
        return "suspicious"

    return "unknown"
