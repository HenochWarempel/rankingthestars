# Ranking The Stars

Simpele rating-app: iedereen selecteert zijn eigen naam en geeft de andere spelers een
rating van 1 t/m 10 sterren. Alle ratings worden opgeslagen in een Google Sheet, die je
direct kunt inzien en met één klik kunt exporteren naar Excel.

## Spelen

Open `index.html` (bijvoorbeeld via GitHub Pages, of lokaal in de browser).

## Opslag instellen (Google Sheets) — eenmalig, ~5 minuten

De app zelf is een statische pagina zonder eigen server, dus de ratings worden via een
gratis Google Apps Script-webhook naar een Google Sheet gestuurd.

1. Maak een nieuwe Google Sheet aan op [sheets.google.com](https://sheets.google.com).
2. Ga naar **Extensies → Apps Script**.
3. Verwijder de standaardcode in `Code.gs` en plak hier de inhoud van [`apps-script.gs`](./apps-script.gs) uit deze repo.
4. Klik rechtsboven op **Implementeren → Nieuwe implementatie**.
   - Type: **Webapp**
   - Uitvoeren als: **Ik (jouw account)**
   - Toegang: **Iedereen**
5. Klik op **Implementeren**, geef de gevraagde machtigingen, en kopieer de **webapp-URL**
   die je te zien krijgt (eindigt op `/exec`).
6. Plak die URL in [`config.js`](./config.js) van deze repo:
   ```js
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
   ```
7. Commit & push. Klaar — elke rating komt nu automatisch in het tabblad **Ratings**
   van je Google Sheet terecht (één rij per persoon; opnieuw ranken overschrijft je
   eigen rij, dus geen dubbele data).

### Ratings bekijken / exporteren naar Excel

Open gewoon de Google Sheet. Voor Excel: **Bestand → Downloaden → Microsoft Excel (.xlsx)**.

## Spelers

Arhan, David, Henoch, Jan, Jasper, John, Just, Mathew, Mesach, Stephan, Tom B, Tom P
