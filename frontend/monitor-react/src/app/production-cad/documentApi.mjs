import {request as defaultRequest} from '../apiRequest.mjs';
export function createDocumentApi(request=defaultRequest) {
  const prefix='/api/cad/freecad', id=encodeURIComponent;
  const call=async(path,options={})=>{
    try {return await request(prefix+path,{credentials:'same-origin',cache:'no-store',...options});}
    catch(error) {if(error.name!=='AbortError'&&options.method==='POST'&&(!error.status||error.status>=500)) error.outcomeUnknown=true; throw error;}
  };
  const get=(path,options)=>call(path,options), post=(path,body,options)=>call(path,{...options,method:'POST',body:JSON.stringify(body)});
  const doc=documentId=>`/documents/${id(documentId)}`;
  const directory=(path,options={})=>{const {cursor='',limit=50,...rest}=options;return get(`${path}?limit=${limit}&cursor=${id(cursor)}`,rest);};
  return {create:(body,options)=>post('/documents',body,options),documents:options=>directory('/documents',options),
    head:(documentId,options)=>get(doc(documentId),options),snapshot:(documentId,revision,options)=>get(`${doc(documentId)}/snapshots/${revision}`,options),
    submit:(documentId,body,options)=>post(`${doc(documentId)}/commands`,body,options),command:(documentId,commandId,options)=>get(`${doc(documentId)}/commands/${id(commandId)}`,options),
    publish:(documentId,body,options)=>post(`${doc(documentId)}/publish`,body,options),designs:options=>directory('/designs',options),
    propose:(documentId,body,options)=>post(`${doc(documentId)}/proposals`,body,options),capabilities:options=>get('/capabilities',options),
    catalog:options=>get('/catalog',options),discover:(body,options)=>post('/catalog/discover',body,options),discovery:(jobId,options)=>get(`/catalog/jobs/${id(jobId)}`,options)};
}
