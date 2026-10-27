import React from 'react';
const paths={
  camera:<><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/></>,
  ruler:<><path d="m4 16 12-12 4 4L8 20zM12 8l3 3M9 11l2 2M6 14l3 3"/></>,
  check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  alert:<><path d="m12 3 10 18H2zM12 9v5M12 17v1"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  box:<><path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7 5.5l10 5.5"/></>,
  arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
  shield:<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
};
export default function QualityIcon({name,size=20}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.box}</svg>;
}
