// Only generate markup from escaped text; source HTML and pasted HTML are never executed.
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function inline(value) {
  const token = /(`+)([\s\S]*?)\1|\[([^\]]+)\]\(((?:[^()\s]|\([^()\n]*\))+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|(?<![\p{L}\p{N}])_([^_]+)_(?![\p{L}\p{N}])/gu;
  let html = '', start = 0, match;
  while ((match = token.exec(value))) {
    html += escapeHtml(value.slice(start, match.index));
    if (match[1]) html += `<code>${escapeHtml(match[2])}</code>`;
    else if (match[3]) html += `<span class="expert-reference" data-expert-href="${escapeHtml(match[4])}">${inline(match[3])}</span>`;
    else if (match[5] || match[6]) html += `<strong>${inline(match[5] || match[6])}</strong>`;
    else html += `<em>${inline(match[7] || match[8])}</em>`;
    start = token.lastIndex;
  }
  return html + escapeHtml(value.slice(start));
}

const listItem = line => /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(line);
const tableCells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
const tableDivider = line => line.includes('|') && tableCells(line).every(cell => /^:?-{3,}:?$/.test(cell));

export function expertDocumentHtml(value) {
  const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
  let index = 0;
  function list(indent) {
    const first = listItem(lines[index]), ordered = /^\d/.test(first[2]);
    const tag = ordered ? 'ol' : 'ul';
    const start = ordered && parseInt(first[2], 10) !== 1 ? ` start="${parseInt(first[2], 10)}"` : '';
    let html = `<${tag}${start}>`;
    while (index < lines.length) {
      const item = listItem(lines[index]);
      if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
      html += `<li>${inline(item[3])}`; index++;
      while (index < lines.length) {
        const nested = listItem(lines[index]);
        if (nested && nested[1].length > indent) { html += list(nested[1].length); continue; }
        if (lines[index].trim() && !nested && /^\s/.test(lines[index])) {
          html += `<br>${inline(lines[index].trim())}`; index++; continue;
        }
        break;
      }
      html += '</li>';
    }
    return html + `</${tag}>`;
  }
  const special = i => /^\s*(?:#{1,6}\s|`{3,}|~{3,}|>|(?:[-*_]\s*){3,}$)/.test(lines[i]) ||
    listItem(lines[i]) || (i + 1 < lines.length && lines[i].includes('|') && tableDivider(lines[i + 1]));
  let html = '';
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    const heading = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+)?$/.exec(line);
    const fence = /^\s*(`{3,}|~{3,})(\S*)\s*$/.exec(line);
    if (heading) {
      html += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`; index++;
    } else if (fence) {
      const content = []; index++;
      while (index < lines.length && !new RegExp(`^\\s*${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[index])) content.push(lines[index++]);
      index++;
      html += `<pre data-expert-language="${escapeHtml(fence[2])}"><code>${escapeHtml(content.join('\n'))}</code></pre>`;
    } else if (/^\s*(?:[-*_]\s*){3,}$/.test(line)) {
      html += '<hr>'; index++;
    } else if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ''));
      html += `<blockquote>${expertDocumentHtml(quote.join('\n'))}</blockquote>`;
    } else if (listItem(line)) {
      html += list(listItem(line)[1].length);
    } else if (index + 1 < lines.length && line.includes('|') && tableDivider(lines[index + 1])) {
      html += '<table><thead><tr>' + tableCells(line).map(cell => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>';
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        html += '<tr>' + tableCells(lines[index++]).map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>';
      }
      html += '</tbody></table>';
    } else {
      const paragraph = [line]; index++;
      while (index < lines.length && lines[index].trim() && !special(index)) paragraph.push(lines[index++]);
      html += `<p>${paragraph.map(inline).join('<br>')}</p>`;
    }
  }
  return html;
}

// Convert the ordinary editor document back to the existing skill storage format.
// This is called on a real edit only, so merely opening or testing never rewrites source.
export function expertDocumentMarkdown(root) {
  if (!root.textContent.trim()) return '';
  const children = node => Array.from(node.childNodes).map(serialize).join('');
  const fenceFor = text => '`'.repeat(Math.max(3, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)));
  function list(node, depth = 0) {
    let number = Number(node.getAttribute('start')) || 1;
    return Array.from(node.children).filter(child => child.tagName === 'LI').map(item => {
      const body = Array.from(item.childNodes).filter(child => !['UL', 'OL'].includes(child.nodeName)).map(serialize).join('').trim();
      const nested = Array.from(item.children).filter(child => ['UL', 'OL'].includes(child.tagName)).map(child => list(child, depth + 1)).join('\n');
      const prefix = node.tagName === 'OL' ? `${number++}. ` : '- ';
      return `${'  '.repeat(depth)}${prefix}${body.replace(/\n+/g, '\n' + '  '.repeat(depth + 1))}${nested ? '\n' + nested : ''}`;
    }).join('\n');
  }
  function serialize(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\u00a0/g, ' ');
    if (node.nodeType !== 1) return '';
    const tag = node.tagName;
    if (tag === 'BR') return '\n';
    if (tag === 'HR') return '\n\n---\n\n';
    if (tag === 'PRE') {
      const text = node.textContent, fence = fenceFor(text);
      return `\n\n${fence}${node.dataset.expertLanguage || ''}\n${text}\n${fence}\n\n`;
    }
    if (tag === 'UL' || tag === 'OL') return '\n\n' + list(node) + '\n\n';
    if (tag === 'TABLE') {
      const rows = Array.from(node.rows).map(row => '| ' + Array.from(row.cells).map(cell => children(cell).trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ')).join(' | ') + ' |');
      if (!rows.length) return '';
      rows.splice(1, 0, '| ' + Array.from(node.rows[0].cells, () => '---').join(' | ') + ' |');
      return '\n\n' + rows.join('\n') + '\n\n';
    }
    const text = children(node);
    if (/^H[1-6]$/.test(tag)) return text.trim() ? `\n\n${'#'.repeat(Number(tag[1]))} ${text.trim()}\n\n` : '';
    if (tag === 'P' || tag === 'DIV') return '\n\n' + text.trim() + '\n\n';
    if (tag === 'BLOCKQUOTE') return '\n\n' + text.trim().split('\n').map(line => '> ' + line).join('\n') + '\n\n';
    if (tag === 'STRONG' || tag === 'B') return text ? `**${text}**` : '';
    if (tag === 'EM' || tag === 'I') return text ? `*${text}*` : '';
    if (tag === 'CODE') {
      const ticks = '`'.repeat(Math.max(1, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)));
      return ticks + text + ticks;
    }
    if (node.dataset.expertHref) return `[${text}](${node.dataset.expertHref})`;
    return text;
  }
  return children(root).trim();
}
