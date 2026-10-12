import React from 'react';
import {splitInlineMarkdown,splitResultBlocks} from './textFormatting.mjs';
import './resultPresentation.css';

const inline=value=>splitInlineMarkdown(value).map((part,index)=>part.type==='strong'?<strong key={index}>{part.text}</strong>
  :part.type==='code'?<code key={index}>{part.text}</code>:<React.Fragment key={index}>{part.text}</React.Fragment>);

export default function ResultText({value,className='',headingLevel=4}){
  const blocks=splitResultBlocks(value);if(!blocks.length)return null;
  const Heading=`h${Math.min(6,Math.max(3,headingLevel))}`;
  const fields=items=><dl className="result-fields">{items.map((item,index)=><div key={index}><dt>{inline(item.label)}</dt><dd>{inline(item.value)}</dd></div>)}</dl>;
  return <div className={`result-prose ${className}`.trim()}>{blocks.map((block,index)=>{
    if(block.type==='heading')return <Heading key={index}>{inline(block.text)}</Heading>;
    if(block.type==='list'){
      const List=block.ordered?'ol':'ul';
      return <List key={index} {...(block.ordered?{start:block.start}:{})}>{block.items.map((item,i)=><li key={i}>{inline(item)}</li>)}</List>;
    }
    if(block.type==='fields')return <React.Fragment key={index}>{fields(block.items)}</React.Fragment>;
    if(block.type==='table')return <div className="result-data-cards" key={index}>{block.rows.map((row,i)=><div className="result-data-card" key={i}>{fields(row.map((value,k)=>({label:block.headers[k],value})))}</div>)}</div>;
    if(block.type==='code')return <pre key={index}><code>{block.text}</code></pre>;
    return <p key={index}>{inline(block.text)}</p>;
  })}</div>;
}
