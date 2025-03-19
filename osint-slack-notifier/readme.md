# OSINT Slack Notifier (Forskning.no)

Denne modulen henter automatisk nye artikler fra forskning.no og sender varslinger til Slack. Dette kan være nyttig for automatisk overvåkning av nyheter og hendelser.

## Installasjon
1. Klon repoet og naviger til riktig mappe:
   ```bash
   git clone https://github.com/politiet/helsesjekk-bot.git
   cd helsesjekk-bot/osint-slack-notifier
   ```

2. Installer nødvendige pakker:
   ```bash
   pip install -r requirements.txt
   ```

3. Konfigurer miljøvariabler:
   - Lag en `.env`-fil basert på `.env.example`.
   - Legg til din Slack Webhook-URL:
     ```
     SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/XXX/XXX
     ```

4. Kjør scriptet:
   ```bash
   python scrape_forskning.py
   ```

## Funksjoner
- Automatisk web scraping fra forskning.no  
- Slack-varsler for nye artikler  
- Bruker miljøvariabler for sikker API-håndtering  
- Klar til utvidelse for flere OSINT-kilder  

Denne funksjonaliteten kan enkelt utvides til å hente data fra andre kilder og sende videre til Slack eller andre varslingstjenester.