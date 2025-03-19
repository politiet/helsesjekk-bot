import requests
import json

def send_slack_message(webhook_url, message):
    payload = {"text": message}
    response = requests.post(webhook_url, data=json.dumps(payload))
    if response.status_code == 200:
        print("✅ Melding sendt til Slack!")
    else:
        print(f"🚫 Noe gikk galt: {response.status_code}, {response.text}")

# Bytt ut URL med webhook-URL du kopierte fra Slack
webhook_url = "https://hooks.slack.com/services/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"

# Testmelding
send_slack_message(webhook_url, "Hei! Dette er en testmelding fra scraperen din 🚀")
