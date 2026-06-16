/* Gemeinsame Markdown-Konverter für Taskpane und Ribbon-Befehle.
   Aus taskpane.html ausgelagert — bei Änderungen hier pflegen. */

/* ════════ Markdown → HTML (portiert aus dem Setzkasten) ════════ */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function mdInline(s) {
  s = escapeHtml(s);
  s = s.replace(/&lt;span style=&quot;color:\s*(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})&quot;&gt;([\s\S]*?)&lt;\/span&gt;/g,
    '<span style="color:$1">$2</span>');
  s = s.replace(/`([^`]+)`/g, '<code style="font-family:Consolas,monospace;background:#f0f1f2">$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return s;
}
function mdToHtml(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  let html = '', i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const fence = line.slice(3).trim().toLowerCase();
      let buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      if (fence === 'mermaid') {
        // Platzhalter; das Taskpane ersetzt ihn durch ein gerendertes PNG
        // (Fallback: Code-Block). Quelltext base64-kodiert mitführen.
        const code = buf.join('\n');
        const enc = (typeof btoa === 'function')
          ? btoa(unescape(encodeURIComponent(code)))
          : Buffer.from(code, 'utf8').toString('base64');
        html += '<div data-mermaid="' + enc + '">' +
                '<pre style="font-family:Consolas,monospace;background:#f0f1f2;padding:8pt">' +
                escapeHtml(code) + '</pre></div>';
      } else {
        html += '<pre style="font-family:Consolas,monospace;background:#f0f1f2;padding:8pt">' +
                escapeHtml(buf.join('\n')) + '</pre>';
      }
      continue;
    }
    // Inhaltsverzeichnis-Platzhalter
    if (/^\[TOC\]$/i.test(line.trim())) { html += '<div data-toc="1"></div>'; i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) { const l = h[1].length; html += `<h${l}>${mdInline(h[2])}</h${l}>`; i++; continue; }
    if (/^(\s*)(---+|\*\*\*+|___+)\s*$/.test(line)) { html += '<hr>'; i++; continue; }
    if (/^>\s?/.test(line)) {
      let buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      html += '<blockquote style="border-left:3pt solid #61a60e;padding-left:10pt;color:#555">' +
              mdToHtml(buf.join('\n')) + '</blockquote>';
      continue;
    }
    if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(line); i += 2;
      let rows = [];
      while (i < lines.length && /\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      html += '<table border="1" style="border-collapse:collapse"><thead><tr>' +
        head.map(c => '<th style="padding:4pt 8pt">' + mdInline(c) + '</th>').join('') + '</tr></thead><tbody>';
      rows.forEach(r => { html += '<tr>' + r.map(c => '<td style="padding:4pt 8pt">' + mdInline(c) + '</td>').join('') + '</tr>'; });
      html += '</tbody></table>';
      continue;
    }
    const ulM = /^(\s*)[-*+]\s+(.*)/, olM = /^(\s*)\d+\.\s+(.*)/;
    if (ulM.test(line) || olM.test(line)) {
      const ordered = olM.test(line);
      const re = ordered ? olM : ulM, tag = ordered ? 'ol' : 'ul';
      html += `<${tag}>`;
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].match(re)[2];
        // Checkboxen: Word kennt keine HTML-Inputs -> Unicode-Symbole
        const task = !ordered && item.match(/^\[( |x|X)\]\s+(.*)$/);
        if (task) item = (task[1].toLowerCase() === 'x' ? '☑ ' : '☐ ') + task[2];
        html += '<li>' + mdInline(item) + '</li>';
        i++;
      }
      html += `</${tag}>`;
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    let buf = [line]; i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{1,6}\s|>|```|[-*+]\s|\d+\.\s|---|\*\*\*)/.test(lines[i])) { buf.push(lines[i]); i++; }
    html += '<p>' + mdInline(buf.join(' ')) + '</p>';
  }
  return html;
}

/* ════════ Word-HTML → Markdown ════════ */
function styleOf(el) {
  return (el.getAttribute && el.getAttribute('style')) || '';
}
function isBoldEl(el) {
  const s = styleOf(el);
  return el.tagName === 'B' || el.tagName === 'STRONG' ||
         /font-weight:\s*(bold|[6-9]00)/i.test(s);
}
function isItalicEl(el) {
  return el.tagName === 'I' || el.tagName === 'EM' || /font-style:\s*italic/i.test(styleOf(el));
}
function isStrikeEl(el) {
  return el.tagName === 'S' || el.tagName === 'DEL' || el.tagName === 'STRIKE' ||
         /text-decoration[^;]*line-through/i.test(styleOf(el));
}
function inlineToMd(el) {
  let out = '';
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) { out += n.nodeValue.replace(/\u00a0/g, ' '); continue; }
    if (n.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = n.tagName;
    if (tag === 'O:P' || tag === 'STYLE' || tag === 'META') continue;
    const inner = () => inlineToMd(n);
    if (tag === 'BR') { out += '\n'; continue; }
    if (tag === 'CODE') { out += '`' + n.textContent + '`'; continue; }
    if (tag === 'A') {
      const href = n.getAttribute('href') || '';
      const txt = inner().trim();
      out += txt ? '[' + txt + '](' + href + ')' : '';
      continue;
    }
    if (tag === 'IMG') {
      out += '![' + (n.getAttribute('alt') || '') + '](' + (n.getAttribute('src') || '') + ')';
      continue;
    }
    let body = inner();
    if (!body.trim()) { out += body; continue; }
    if (isStrikeEl(n)) body = '~~' + body.trim() + '~~';
    if (isItalicEl(n)) body = '*' + body.trim() + '*';
    if (isBoldEl(n)) body = '**' + body.trim() + '**';
    out += body;
  }
  return out;
}
/* Word-Desktop-Listenabsatz erkennen und zerlegen.
   Desktop-HTML rendert Listen NICHT als <ul>/<ol>, sondern als einzelne
   <p class="MsoListParagraph..."> mit:
   - Einrückungstiefe in style "mso-list:lN levelM lfoK"  (M = Ebene, 1-basiert)
   - einem führenden Marker-Span (•, o, ▪ oder "1.", "a.", "i." …)
   Diese Funktion liefert {level, ordered, text} oder null. */
function parseWordListItem(node) {
  const cls = node.getAttribute('class') || '';
  const sty = styleOf(node);
  if (!/MsoListParagraph/i.test(cls) && !/mso-list/i.test(sty)) return null;
  // Ebene aus "mso-list: lN levelM ..."; sonst aus margin-left grob schätzen
  let level = 1;
  const lvlMatch = sty.match(/level(\d+)/i);
  if (lvlMatch) {
    level = Math.max(1, parseInt(lvlMatch[1], 10));
  } else {
    const ml = sty.match(/margin-left:\s*([\d.]+)\s*(pt|in|cm)/i);
    if (ml) {
      const v = parseFloat(ml[1]), unit = ml[2].toLowerCase();
      const pt = unit === 'in' ? v * 72 : unit === 'cm' ? v * 28.35 : v;
      level = Math.max(1, Math.round(pt / 36) + 1); // ~0.5in pro Ebene
    }
  }
  let txt = inlineToMd(node).replace(/\s+/g, ' ').trim();
  // Führenden Marker entfernen und Listenart bestimmen
  let ordered = false;
  const om = txt.match(/^(\d+|[a-z]|[ivxlcdm]+)[.)]\s+(.*)$/i);
  const bm = txt.match(/^[•·▪◦‣o\u2022\u25aa\u25cb\u00b7-]\s+(.*)$/);
  if (om && !/^[•·▪◦‣]/.test(txt)) { ordered = true; txt = om[2]; }
  else if (bm) { txt = bm[1]; }
  else { txt = txt.replace(/^[•·▪◦‣o\u2022\u25aa\u25cb\u00b7-]\s*/, ''); }
  return { level, ordered, text: txt };
}

function listItemMd(item, counters) {
  const indent = '  '.repeat(item.level - 1);
  const cb = item.text.match(/^([☐☑✓])\s*(.*)$/);
  if (!item.ordered && cb) return indent + '- [' + (cb[1] === '☐' ? ' ' : 'x') + '] ' + cb[2] + '\n';
  if (item.ordered) {
    counters[item.level] = (counters[item.level] || 0) + 1;
    for (const k in counters) if (+k > item.level) delete counters[k];
    return indent + counters[item.level] + '. ' + item.text + '\n';
  }
  return indent + '- ' + item.text + '\n';
}

function blockToMd(node, ctx) {
  ctx = ctx || {};
  if (node.nodeType === Node.TEXT_NODE) {
    const tx = node.nodeValue.trim();
    return tx ? tx + '\n\n' : '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const tag = node.tagName;
  if (tag === 'STYLE' || tag === 'META' || tag === 'O:P') return '';
  const h = tag.match(/^H([1-6])$/);
  if (h) return '#'.repeat(+h[1]) + ' ' + inlineToMd(node).trim() + '\n\n';
  switch (tag) {
    case 'P': case 'DIV': {
      // Word-Inhaltsverzeichnis (TOC-Feld) nicht als Fließtext exportieren.
      const cls = node.getAttribute('class') || '';
      const sty0 = styleOf(node);
      if (/MsoToc/i.test(cls) || /mso-element:\s*toc/i.test(sty0)) return '';
      const li = parseWordListItem(node);
      if (li && li.text) {
        if (!ctx.counters) ctx.counters = {};
        return listItemMd(li, ctx.counters);
      }
      const txt = inlineToMd(node).replace(/\s+/g, ' ').trim();
      if (!txt) return '';
      const cb = txt.match(/^([☐☑✓])\s*(.*)$/);
      if (cb) return '- [' + (cb[1] === '☐' ? ' ' : 'x') + '] ' + cb[2] + '\n';
      return txt + '\n\n';
    }
    case 'BLOCKQUOTE': {
      let inner = '';
      for (const c of node.childNodes) inner += blockToMd(c);
      return inner.trim().split('\n').map(l => '> ' + l).join('\n') + '\n\n';
    }
    case 'UL': case 'OL': {
      const depth = ctx.depth || 0;
      const indent = '  '.repeat(depth);
      let out = '', idx = 1;
      for (const li of node.children) {
        if (li.tagName !== 'LI') continue;
        // direkten Textinhalt ohne verschachtelte Listen erfassen
        let text = '', sub = '';
        for (const c of li.childNodes) {
          if (c.nodeType === Node.ELEMENT_NODE && (c.tagName === 'UL' || c.tagName === 'OL')) {
            sub += blockToMd(c, { depth: depth + 1 });
          } else if (c.nodeType === Node.ELEMENT_NODE) {
            text += inlineToMd({ childNodes: [c] });
          } else if (c.nodeType === Node.TEXT_NODE) {
            text += c.nodeValue;
          }
        }
        text = text.replace(/\s+/g, ' ').trim();
        const cb = text.match(/^([☐☑✓])\s*(.*)$/);
        if (tag === 'OL') out += indent + (idx++) + '. ' + text + '\n' + sub;
        else if (cb) out += indent + '- [' + (cb[1] === '☐' ? ' ' : 'x') + '] ' + cb[2] + '\n' + sub;
        else out += indent + '- ' + text + '\n' + sub;
      }
      return out + (depth ? '' : '\n');
    }
    case 'PRE': return '```\n' + node.textContent.replace(/\n$/, '') + '\n```\n\n';
    case 'HR': return '---\n\n';
    case 'TABLE': {
      const rows = [...node.querySelectorAll('tr')];
      if (!rows.length) return '';
      const cells = tr => [...tr.children].map(td =>
        inlineToMd(td).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|'));
      const head = cells(rows[0]);
      let out = '| ' + head.join(' | ') + ' |\n';
      out += '| ' + head.map(() => '---').join(' | ') + ' |\n';
      for (const tr of rows.slice(1)) out += '| ' + cells(tr).join(' | ') + ' |\n';
      return out + '\n';
    }
    default: {
      let out = '';
      let hasBlocks = false;
      for (const c of node.childNodes) {
        if (c.nodeType === Node.ELEMENT_NODE &&
            /^(P|DIV|H[1-6]|UL|OL|TABLE|BLOCKQUOTE|PRE|HR)$/.test(c.tagName)) { hasBlocks = true; break; }
      }
      if (hasBlocks) { for (const c of node.childNodes) out += blockToMd(c, ctx); return out; }
      const txt = inlineToMd(node).replace(/\s+/g, ' ').trim();
      return txt ? txt + '\n\n' : '';
    }
  }
}
function wordHtmlToMd(htmlStr) {
  const doc = new DOMParser().parseFromString(htmlStr, 'text/html');
  const ctx = {};
  let out = '';
  const nodes = [...doc.body.childNodes];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // Listenabsatz? gemeinsamen Zähler-Kontext nutzen, Blöcke ohne Leerzeile aneinanderreihen
    const isListItem = node.nodeType === Node.ELEMENT_NODE &&
      (node.tagName === 'P' || node.tagName === 'DIV') && parseWordListItem(node);
    if (isListItem) {
      out += blockToMd(node, ctx);
      // Folgt KEIN weiterer Listenabsatz, Liste mit Leerzeile abschließen und Zähler leeren
      const next = nodes[i + 1];
      const nextIsList = next && next.nodeType === Node.ELEMENT_NODE &&
        (next.tagName === 'P' || next.tagName === 'DIV') && parseWordListItem(next);
      if (!nextIsList) { out += '\n'; for (const k in ctx.counters || {}) delete ctx.counters[k]; }
    } else {
      out += blockToMd(node, {});
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
