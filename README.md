# SFC LuisterLab — Vercel + GitHub

Een afzonderlijke website naast SFC LeesLab, gebaseerd op dezelfde serverstructuur en AI-correctie. **Vervang je bestaande LeesLab-repository niet** met dit pakket. Gebruik een NIEUWE GitHub-repository en een NIEUW Vercel-project.

## Wat werkt in deze eerste versie?

- **Leerlingmodus:** YouTube- of VRT-link invoeren, rechtmatig verkregen ondertitelbestand (.srt/.vtt/.txt) automatisch inlezen of transcript plakken, 5/8/10 luistervragen op drie niveaus laten maken, antwoorden invullen, AI-verbetering per halve punt, feedback en afdrukken/opslaan als PDF via browser.
- **Leerkrachtmodus:** dezelfde invoer, zelf 1/2/3 toegestane kijkbeurten kiezen, vragen vooraf via AI genereren en een gedeelde leerlingenlink maken die standaard 30 dagen werkt. Vragen + antwoorden + transcript worden veilig *server-side* opgeslagen in Upstash; bij ophalen zien leerlingen de modelantwoorden en het transcript niet. Er is **geen leerkrachtenlogin**: iedereen die de site opent kan een oefening maken.
- **YouTube:** officiële IFrame Player API ingebed met eigen start/pauze-knoppen, voortgang en lokaal opgeslagen kijkbeurten. De eigen bediening heeft geen voor-/terugspoelknoppen en probeert afspeelsprongen terug te draaien.
- **VRT:** opent extern op de originele VRT-pagina; geen afspeelbeperking of automatisch ophalen. Niet alle VRT-links zullen voor iedere leerling toegankelijk zijn; een VRT-account kan nodig zijn.
- **AI-veiligheid:** API-sleutel op server; bestaande centrale, verplichte Upstash-daglimiet hergebruikt; geen namen of leerlingantwoorden opgeslagen. Voor een klasopdracht worden het transcript, vragen en voorbeeldantwoorden maximaal 30 dagen in Upstash bewaard. OpenAI verwerkt transcript en ingevoerde antwoorden om te genereren/verbeteren.

## Belangrijke grenzen

1. **Twee keer kijken is een didactische beperking, geen waterdichte toetsbeveiliging.** De teller staat in `localStorage` van de browser en is te omzeilen met een andere browser of door browsergegevens te wissen. Een video blijft ook rechtstreeks via YouTube toegankelijk. Geen garantie dat de speler iedere sprong kan detecteren. Voor een formele toets is schoolauthenticatie, serveropslag per leerling en toezicht nodig.
2. **Ondertitelimport (v1.1):** Je kunt een rechtmatig verkregen `.srt`-, `.vtt`- of `.txt`-bestand kiezen. De browser verwijdert tijdcodes, maakt er een transcript van en vult het tekstvak automatisch. Dit is GEEN rechtstreeks downloaden van YouTube- of VRT-ondertitels. De gebruiker kan ook nog steeds een transcript plakken. Het systeem beoordeelt alleen *tekstuele inhoud*; vragen die uitsluitend op beeld steunen zijn niet mogelijk.
3. **VRT MAX:** dit pakket downloadt/scrapet geen VRT-content of past de VRT-speler aan; gebruik van transcript en delen moet passen binnen de rechten en voorwaarden van de bron.
4. **Geen login / toegangsbeveiliging:** iedereen met de website-URL kan (binnen de daglimiet) AI-aanvragen doen. De leerlingenlink bevat een niet-raadbare code maar kan worden doorgestuurd. Laat school-IT de beveiliging, kosten en GDPR beoordelen vóór brede uitrol.
5. **Geen live end-to-end test uitgevoerd:** syntax en unit tests slagen, maar een echte Vercel-, Upstash-, YouTube- en AI-test is nog nodig.

## Installeren met GitHub en Vercel

1. Maak op GitHub een **nieuwe repository**, bijvoorbeeld `sfc-luisterlab`.
2. Pak de ZIP uit en upload de **inhoud** (niet de ZIP zelf) naar de hoofdmap. Op GitHub zie je `api/`, `lib/`, `public/`, `tests/`, `package.json`, `vercel.json`.
3. Ga in Vercel naar **Add New → Project**, importeer deze NIEUWE GitHub-repository. Framework Preset: `Other` (automatisch bij deze opzet). Root Directory: `./`.
4. Stel in Vercel → Settings → Environment Variables de volgende variabelen in voor Production:
   - `OPENAI_API_KEY`: API-sleutel van OpenAI (geheim; niet in GitHub plaatsen)
   - `OPENAI_MODEL`: `gpt-4o-mini` (optioneel, standaard)
   - `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token
   - `DAILY_AI_LIMIT`: bv. `100` (gedeelde dagelijkse AI-aanvragenlimiet)
5. Je kan dezelfde Upstash-gegevens gebruiken als bij LeesLab; de sleutelprefix van LuisterLab is apart (`sfc-luisterlab:*`). Let op: je AI-budget blijft gedeeld over de projecten. Desgewenst maak je een aparte Upstash-database.
6. Deploy. Open `/api/status` op je nieuwe domein: `ai:true` betekent dat de API-sleutel bestaat, niet dat alle verbindingen getest zijn.
7. Test eerst met een korte openbaar insluitbare YouTube-video, een eigen transcript van minimaal 200 tekens en 5 vragen. Test daarna de leerlingenlink in een andere browser, beoordelen, afdrukken en herladen.

## Kosten en verbruik

Genereren = één AI-aanroep; nakijken = nog één AI-aanroep. In leerkrachtmodus wordt eenmaal gegenereerd, vervolgens één nakijkoproep per leerling. Onjuiste of mislukte AI-aanvragen kunnen meetellen in de daglimiet. De daglimiet is **geen gegarandeerde financiële bovengrens**: beperk het OpenAI-budget bij de provider.

## Lokaal controleren

`npm run check` en `npm test` (Node.js 20+). Voor volledige lokale API-integratietesten heb je een Vercel-ontwikkelomgeving en geldige secrets nodig.

## Structuur

- `public/index.html` — volledige leerling-/leerkracht-UI, CSS, ondertitelimport en YouTube-bediening
- `public/subtitles.js` — verwerking van SRT-, VTT- en TXT-bestanden in de browser; bestanden blijven lokaal tot de gebruiker zelf AI-vragen aanvraagt
- `api/generate.js`, `api/grade.js`, `api/status.js` — AI en status
- `api/lesson.js`, `api/assessment.js` — gedeelde les opslaan/ophalen en veilig nakijken
- `lib/luisterlab.js` — generatie, feedback, daglimiet
- `lib/lessons.js` — validatie en Upstash-opslag
- `tests/links.test.js` — basiscontroles videolinks

**Privacyadvies:** gebruik in het transcript geen leerlingnamen of andere persoonsgegevens, tenzij dit door schoolbeleid en toestemming geregeld is. Het delen van een leslink maakt de opdrachtinhoud bereikbaar voor iedereen met die link.

## Ondertitels automatisch verwerken (v1.1)

1. Plak de link naar een video van YouTube of VRT MAX.
2. Download of verkrijg, **alleen waar je daar toestemming voor hebt**, het ondertitelbestand `.srt`, `.vtt` of `.txt`.
3. Klik in LuisterLab op **Ondertitelbestand automatisch inlezen**. De tekst verschijnt automatisch in het transcriptvak, zonder tijdcodes.
4. Controleer de tekst, kies de moeilijkheidsgraad en genereer vragen.

**Belangrijk:** de officiële YouTube API laat het downloaden van ondertitels alleen toe aan personen met toestemming om de video te bewerken, na OAuth-autorisatie. Het automatisch ophalen van ondertitels van willekeurige YouTube-video's is niet geïmplementeerd. VRT verbiedt geautomatiseerd ophalen van haar content zonder voorafgaande toestemming; een VRT-link is dus evenmin een automatisch transcript. Ondertitelbestanden van een rechtmatige bron importeren is wel ondersteund.

Deze wijziging vereist geen nieuwe API-sleutels of Vercel-omgevingsvariabelen. Bij een bestaande LuisterLab-repository kun je de gewijzigde `public/index.html` en nieuwe `public/subtitles.js` toevoegen.
