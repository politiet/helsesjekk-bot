import os
import requests
import json
from bs4 import BeautifulSoup

# Hent Slack webhook-URL fra miljøvariabel
webhook_url = os.getenv("SLACK_WEBHOOK_URL")

# Sjekk at URL-en finnes
if not webhook_url:
    raise ValueError("🚨 Feil: Webhook-URL er ikke satt! Sett miljøvariabelen SLACK_WEBHOOK_URL før du kjører scriptet.")

# Slack-varsling
def send_slack_message(message):
    if not webhook_url:
        print("🚨 Ingen webhook-URL funnet. Varsling ikke sendt.")
        return

    payload = {"text": message}
    response = requests.post(webhook_url, data=json.dumps(payload))

    if response.status_code == 200:
        print("✅ Slack-varsling sendt!")
    else:
        print(f"❌ Feil ved Slack-varsling: {response.status_code}, {response.text}")

# Funksjon for scraping av forskning.no
def scrape_forskning():
    url = "https://www.forskning.no/tag/teknologi"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    articles = soup.find_all("article")

    if not articles:
        send_slack_message("🚫 Ingen artikler funnet!")  # 🔥 FIKSET HER!
        return

    message = "📰 *Nye artikler fra forskning.no:*\n"

    for article in articles[:5]:  # Begrens til 5 artikler
        headline = article.find("h2").text.strip()
        link = article.find("a")["href"]
        date = article.find("time")["datetime"]

        message += f"- {headline} ({date})\n{link}\n\n"

    # Sender melding til Slack
    send_slack_message(message)  

# Kjør scraperen
if __name__ == "__main__":
    scrape_forskning()
