# Setzkasten Markdown — Word-Add-in (ALHO-Edition)

Markdown direkt in Microsoft Word: **.md-Dateien importieren**, Dokumente
oder Markierungen **als Markdown exportieren** und rohen Markdown-Text
**formatiert einfügen** (Copy & Paste über das Seitenfenster).
Oberfläche dreisprachig (DE / FR / EN, automatische Spracherkennung),
Design in den ALHO-Farben.

## Projektinhalt

```
word-addin-setzkasten/
├── manifest.xml          ← Add-in-Beschreibung für Word (URLs anpassen!)
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

## Schritt 1: Dateien hosten (HTTPS erforderlich)

Office lädt Add-ins ausschließlich über HTTPS. Zwei bewährte Wege:

### Variante A — GitHub Pages (empfohlen, dauerhaft, kostenlos)

1. Diesen Ordner in ein GitHub-Repository hochladen.
2. In den Repo-Einstellungen **Pages** aktivieren (Branch `main`, Ordner `/`).
3. Die entstehende Adresse notieren, z. B.
   `https://DEINNAME.github.io/word-addin-setzkasten`.
4. In `manifest.xml` **alle** Vorkommen von `https://localhost:3000` durch
   diese Adresse ersetzen (IconUrl, AppDomain, SourceLocation, Resources).

### Variante B — lokaler Entwicklungsserver (zum schnellen Testen)

```bash
# Einmalig: vertrauenswürdiges Localhost-Zertifikat installieren
npx office-addin-dev-certs install

# Im Projektordner starten (Port 3000, HTTPS):
npx http-server . -p 3000 -S \
  -C ~/.office-addin-dev-certs/localhost.crt \
  -K ~/.office-addin-dev-certs/localhost.key
```

Dann kann das Manifest unverändert bleiben (`https://localhost:3000`).

## Schritt 2: Add-in in Word laden (Sideloading)

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

## Schritt 3 (optional): Verteilung im Unternehmen

Für alle Mitarbeitenden (z. B. bei ALHO): Microsoft-365-Admin-Center →
*Einstellungen → Integrierte Apps → Benutzerdefinierte Apps hochladen* →
`manifest.xml`. Das Add-in erscheint dann zentral verwaltet bei allen
zugewiesenen Nutzern — ohne Store-Veröffentlichung.

Eine Veröffentlichung im öffentlichen **AppSource**-Store ist möglich,
erfordert aber ein Microsoft-Partnerkonto und den Validierungsprozess.

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
