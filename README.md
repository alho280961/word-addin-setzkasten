# Setzkasten Markdown — Word-Add-in (ALHO-Edition)

Markdown direkt in Microsoft Word: **.md-Dateien importieren**, Dokumente
oder Markierungen **als Markdown exportieren** und rohen Markdown-Text
**formatiert einfügen** (Copy & Paste über das Seitenfenster).
Oberfläche dreisprachig (DE / FR / EN, automatische Spracherkennung),
Design in den ALHO-Farben.

> **Status: produktiv.** Gehostet über GitHub Pages
> (`https://alho280961.github.io/word-addin-setzkasten`), in Word im Web
> getestet und unternehmensweit über das Microsoft-365-Admin-Center
> verteilt (Integrierte Apps). Das Manifest in diesem Repository ist
> bereits auf die Pages-Adresse konfiguriert.

## Projektinhalt

```
word-addin-setzkasten/
├── manifest.xml          ← Add-in-Beschreibung (URLs auf GitHub Pages konfiguriert)
├── src/
│   ├── taskpane.html     ← das komplette Add-in (UI + Konverter)
│   └── commands.html     ← Pflicht-Hilfsdatei (FunctionFile)
├── assets/
│   ├── icon-16.png
│   ├── icon-32.png
│   └── icon-80.png
└── README.md
```

## Funktionsweise

Das Seitenfenster (Taskpane) bietet drei Bereiche:

1. **Markdown importieren** — .md/.markdown/.txt-Datei wählen; sie wird in
   formatierten Word-Text umgewandelt und an der Cursorposition eingefügt
   (Überschriften → echte Word-Überschriften, Tabellen → Word-Tabellen,
   Checkboxen → ☐/☑-Symbole).
2. **Markdown einfügen** — rohen Markdown-Text ins Feld einfügen (Strg+V),
   „Formatiert einfügen" setzt ihn an der Cursorposition ins Dokument.
3. **Als Markdown exportieren** — Markierung oder ganzes Dokument wird zu
   Markdown konvertiert; Ergebnis kopieren oder als .md herunterladen.

Die Konverter sind aus dem Setzkasten-Editor portiert (gleiche
Markdown-Syntax inkl. Farb-Spans und Checkboxen).

## Hosting (aktueller Stand)

Die Dateien werden über **GitHub Pages** ausgeliefert
(Repo-Einstellungen → Pages → Branch `main`, Ordner `/ (root)`):

```
https://alho280961.github.io/word-addin-setzkasten
```

Alle URLs in `manifest.xml` zeigen bereits dorthin. **Updates am Add-in**
(z. B. an `src/taskpane.html`) genügt es, hier im Repo zu committen —
das Taskpane wird bei jedem Öffnen frisch geladen, ein erneutes Deployment
ist nur bei Manifest-Änderungen (Name, Icons, Buttons, URLs) nötig.

Bei einem Umzug auf einen anderen Host: alle URL-Vorkommen in
`manifest.xml` ersetzen und das Manifest neu verteilen. Für lokale
Entwicklung alternativ: `npx office-addin-dev-certs install` und
`npx http-server . -p 3000 -S -C <crt> -K <key>`, Manifest-URLs auf
`https://localhost:3000` stellen.

## Verteilung (aktueller Stand: zentral via Microsoft 365)

Das Add-in ist über das **Microsoft-365-Admin-Center** verteilt
(*Einstellungen → Integrierte Apps → Benutzerdefinierte Apps hochladen* →
`manifest.xml`). Es erscheint damit automatisch bei allen zugewiesenen
Nutzern in Word für Windows, Mac und Web — ohne Sideloading.
Die Erstverteilung kann bis zu 24 Stunden dauern.
**Manifest-Updates** werden am selben Ort eingespielt (App auswählen →
Aktualisieren).

## Alternativ: manuelles Sideloading (nur für Tests nötig)

**Word im Browser (einfachster Test):**
Dokument öffnen → *Start* (bzw. *Einfügen*) → **Add-Ins** →
**Mein Add-In hochladen** → `manifest.xml` wählen.
Der Button „Setzkasten" erscheint im Start-Ribbon.

**Word für Windows:**
*Datei → Optionen → Trust Center → Einstellungen für das Trust Center →
Kataloge vertrauenswürdiger Add-Ins* → Pfad einer Netzwerkfreigabe mit der
`manifest.xml` eintragen, Haken „Im Menü anzeigen" → Word neu starten →
*Einfügen → Meine Add-Ins → Freigegebener Ordner*.

**Word für Mac:**
`manifest.xml` kopieren nach
`~/Library/Containers/com.microsoft.Word/Data/Documents/wef`
(Ordner ggf. anlegen) → Word neu starten →
*Einfügen → Meine Add-Ins → ⌄ → Setzkasten*.

Eine Veröffentlichung im öffentlichen **AppSource**-Store wäre zusätzlich
möglich, erfordert aber ein Microsoft-Partnerkonto und den
Validierungsprozess — für den internen Einsatz nicht nötig.

## Bekannte Grenzen (by design)

- **Kein Abfangen von Strg+V im Dokument** — Office-Add-ins dürfen das
  native Einfügen nicht umleiten; der Weg führt über das Taskpane-Feld.
- **Export ist verlustbehaftet**: Word-Elemente ohne Markdown-Gegenstück
  (Spalten, Textfelder, Kommentare, Kopf-/Fußzeilen) entfallen.
  Word-Desktop liefert Listen teils als Spezial-Absätze; der Konverter
  erkennt sie heuristisch (`MsoListParagraph`/`mso-list`) — bei exotischen
  Listen kann Nacharbeit nötig sein.
- **Checkboxen** werden in Word als ☐/☑-Textsymbole dargestellt (Word-HTML
  kennt keine interaktiven Inputs) und beim Export wieder zu `- [ ]`/`- [x]`.
- `[TOC]`, Fußnoten-Sprungmarken und ```mermaid```-Diagramme aus dem
  Setzkasten-Editor werden beim Import als Text/Codeblock übernommen,
  nicht als aktive Elemente.
- Das Add-in benötigt Word 2016+ bzw. Microsoft 365 (Office.js,
  WordApi 1.1).

## Anpassung

- **Farben:** CSS-Variablen am Anfang von `src/taskpane.html`
  (`--accent: #61a60e` = ALHO-Grün).
- **Sprachen:** `I18N`-Objekt in `taskpane.html`; neue Schlüssel immer in
  allen drei Sprachen ergänzen.
- **Add-in-ID:** Die GUID in `manifest.xml` ist einmalig generiert; bei
  einem Fork bitte eine neue GUID einsetzen.
