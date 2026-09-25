# Ranking The Stars

Rating-app: iedereen krijgt een eigen, persoonlijke link en rate daarmee de andere
spelers van 1 t/m 10 sterren (halve sterren mogen ook — tik op de linkerhelft van een
ster voor een halve, rechts voor een hele). Alle stemmen worden gelogd in een Google
Sheet (met tijdstempel en rondenummer, dus je ziet ook hoe ratings veranderen over de
tijd) en je kunt de sheet met één klik exporteren naar Excel.

Er is ook een afgeschermde admin-pagina (`admin.html`) waar jij als organisator kunt
zien wie al gestemd heeft, welke ratings iedereen geeft, en het actuele gemiddelde per
speler — en van waaruit je een nieuwe stem-ronde kunt starten.

## Hoe het werkt

- **`index.html`** — de stempagina. Werkt alléén via een persoonlijke link
  (`index.html?t=<token>`); zonder geldig token zie je een melding dat je een link
  moet opvragen. Zo kan niemand namens iemand anders stemmen. Had je al eerder gestemd?
  Dan zie je je vorige ratings vast ingevuld staan, en kun je ze aanpassen.
- **`admin.html`** — alleen voor jou, achter een wachtwoord. Toont wie nog moet stemmen,
  ieders gegeven ratings, het gemiddelde per speler, en de historie per ronde. Hiervandaan
  start je ook een nieuwe ronde (iedereen kan dan opnieuw stemmen, met hun vorige stem als
  uitgangspunt), en beheer je de spelerslijst zelf (zie hieronder) — de lijst staat niet
  meer hardcoded in de code.
- **`apps-script.gs`** — de backend (gratis Google Apps Script), verbonden aan een Google
  Sheet. Bewaart alles server-side: welk token bij welke naam hoort, het admin-wachtwoord,
  het huidige rondenummer, en elke stem als een nieuwe rij (nooit overschreven).

## Opslag instellen (Google Sheets + Apps Script) — eenmalig

1. Maak een nieuwe Google Sheet aan op [sheets.google.com](https://sheets.google.com).
2. Ga naar **Extensies → Apps Script**.
3. Verwijder de standaardcode in `Code.gs` en plak hier de volledige inhoud van
   [`apps-script.gs`](./apps-script.gs) uit deze repo.
4. Pas bovenin het script `BASE_URL` en `ADMIN_URL` aan naar je eigen GitHub Pages-URL
   (bijvoorbeeld `https://<gebruiker>.github.io/rankingthestars/`).
5. Klik rechtsboven op **Implementeren → Nieuwe implementatie**.
   - Type: **Webapp**
   - Uitvoeren als: **Ik (jouw account)**
   - Toegang: **Iedereen**
6. Klik op **Implementeren**, geef de gevraagde machtigingen, en kopieer de **webapp-URL**
   (eindigt op `/exec`).
7. Plak die URL in [`config.js`](./config.js):
   ```js
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
   ```
8. Commit & push `config.js`.
9. Ga terug naar de Apps Script-editor, selecteer bovenin de functie **`setup`** en klik op
   **Run** (bij de eerste keer moet je nogmaals machtigingen geven). Dit maakt automatisch
   een admin-wachtwoord en een uniek token per speler aan (en migreert een eventueel
   bestaand sheet veilig naar het nieuwe schema, zonder data te verliezen).
10. Bekijk **Uitvoeringen → Logs** (of `View → Logs`) van die `setup`-run: daar staan het
    admin-wachtwoord en de persoonlijke link van elke speler. Deel elke link **alleen** met
    de betreffende speler.

Wil je het admin-wachtwoord later veranderen? Voer in de Apps Script-editor
`setAdminPassword("mijn-nieuwe-wachtwoord")` uit. Wil je de persoonlijke links nog
eens opvragen? Voer `getPersonalLinks()` uit en kijk in de logs.

> **Let op:** deze repository is publiek. Zet daarom nooit het admin-wachtwoord of de
> spelerslinks/tokens in een bestand dat je commit — die horen alleen in de Apps
> Script-eigenschappen (waar `setup()` ze automatisch neerzet) en in de berichten waarmee
> je ze persoonlijk deelt.

## Periodiek opnieuw laten stemmen

Open `admin.html`, log in met het admin-wachtwoord, en klik op **"Nieuwe ronde starten"**.
Vanaf dat moment tellen nieuwe stemmen mee voor de nieuwe ronde; de admin-pagina toont per
ronde het gemiddelde per speler, zodat je kunt zien hoe ratings zich ontwikkelen. Deel
gewoon dezelfde persoonlijke links opnieuw — iedereen ziet zijn vorige stem terug en hoeft
'm alleen aan te passen waar nodig.

## Spelers toevoegen

Ga naar `admin.html` → **"Spelers beheren"** → vul een naam in → **"Toevoegen"**. De app
maakt automatisch een persoonlijke link voor die speler aan (kopieer 'm meteen met de
knop ernaast, of later opnieuw via de "Link kopiëren"-knop naast elke naam). Bestaande
stemmen blijven ongewijzigd; de nieuwe speler telt vanaf dat moment mee.

Spelers verwijderen kan momenteel niet via de app.

### Ratings bekijken / exporteren naar Excel

Open de Google Sheet (tabblad **Ratings**) voor de ruwe, volledige geschiedenis van elke
stem. Voor Excel: **Bestand → Downloaden → Microsoft Excel (.xlsx)**. Voor een overzichtelijk
dashboard (gemiddeldes, wie mist, historie) gebruik je `admin.html`.

## Spelers

Startlijst (aan te passen via `admin.html`, zie "Spelers toevoegen" hierboven):
Arhan, David, Henoch, Jan, Jasper, John, Just, Mathew, Mesach, Stephan, Tom B, Tom P
