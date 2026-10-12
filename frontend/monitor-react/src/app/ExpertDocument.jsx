import React, { useLayoutEffect, useRef } from 'react';
import { expertDocumentHtml, expertDocumentMarkdown } from './expertDocument.mjs';

const formats = [
  ['正文', 'formatBlock', 'p'], ['标题', 'formatBlock', 'h1'], ['小标题', 'formatBlock', 'h2'],
  ['加粗', 'bold'], ['项目列表', 'insertUnorderedList'], ['编号列表', 'insertOrderedList'],
];

export default function ExpertDocument({ value, onChange, label, readOnly = false, disabled = false }) {
  const element = useRef(null);
  const rendered = useRef(null);
  const editable = Boolean(onChange) && !readOnly && !disabled;
  useLayoutEffect(() => {
    if (rendered.current === value) return;
    element.current.innerHTML = expertDocumentHtml(value);
    rendered.current = value;
  }, [value]);

  function update() {
    if (!editable) return;
    const document = expertDocumentMarkdown(element.current);
    rendered.current = document;
    onChange(document);
  }
  function format(command, argument) {
    if (!editable) return;
    element.current.focus();
    // Native editing keeps the selection and the browser's undo history.
    element.current.ownerDocument.execCommand(command, false, argument);
    update();
  }
  function paste(event) {
    if (!editable) return;
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    element.current.ownerDocument.execCommand('insertHTML', false, expertDocumentHtml(text));
    update();
  }
  return <section className="expert-document-field">
    {onChange && <>
      <span className="expert-document-label">{label}</span>
      {!readOnly && <div className="expert-document-toolbar" role="toolbar" aria-label="正文排版">
        {formats.map(([name, command, argument]) => <button type="button" key={name} disabled={!editable}
          onMouseDown={event => event.preventDefault()} onClick={() => format(command, argument)}>{name}</button>)}
      </div>}
    </>}
    <div ref={element} className={`expert-document${onChange ? ' expert-document-editor' : ''}`}
      role={onChange ? 'textbox' : 'article'} aria-label={label} aria-multiline={onChange ? true : undefined}
      aria-readonly={onChange ? !editable : undefined} aria-disabled={onChange ? disabled : undefined}
      tabIndex={onChange ? 0 : undefined} contentEditable={editable} suppressContentEditableWarning
      spellCheck={false} onInput={update} onPaste={paste} />
  </section>;
}
