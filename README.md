# The Voyage — Yassine Ben Maktouf's portfolio

A one-page portfolio drawn as an antique sea chart. Scrolling sails a boat across five islands
(About me, Education, Experience, Projects, Skills & certifications); parchment scrolls unroll with the content.

## Edit the content
- All portfolio text lives in `content/content.json` (English `en` + French `fr` for each field).
  - Add a project: copy one object inside `islands[3].scrolls` and edit it. The island gets one more scroll automatically.
  - Add a certification: add an item to the `certifications` scroll in `islands[4]`.
  - If a French text is missing, the English one is shown.
- Interface wording (buttons, labels) lives in `content/i18n.json`.
- Photo: put it in `img/` (for example `img/photo.jpg`) and set `person.photo` to that path.
- CVs: put `CV-Yassine-Ben-Maktouf-EN.pdf` and `CV-Yassine-Ben-Maktouf-FR.pdf` in `cv/`.

## Run locally
    python -m http.server 8080
Then open http://localhost:8080. The layout follows the window width: below 1024px (phones, portrait tablets) you get the stacked list; resize the window to switch live. Visitors with reduced motion always get the list.

## Tests
    npm test
(Node 20+. No dependencies to install.)

## Deploy
Any static host works. GitHub Pages: push this folder to a repository, then Settings → Pages → deploy from the `main` branch root.
