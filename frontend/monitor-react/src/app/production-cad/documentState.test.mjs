import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentState, selectDocument, documentToken, applyDocumentSnapshot, documentPollDelay, beginDocumentCommand, reconcileDocumentCommand, readPendingCommand} from './documentState.mjs';
import {createDocumentApi} from './documentApi.mjs';

test('snapshots are bound to actor, document, generation and monotonic revision', () => {
  let state=selectDocument(createDocumentState('USER-a'),'DOC-a');
  const token=documentToken(state), snapshot={document_id:'DOC-a',revision:2,objects:[{object_id:'OBJ-a'}]};
  state=applyDocumentSnapshot(state,snapshot,token);
  assert.equal(state.snapshot.revision,2);
  for(const value of [{...token,actorId:'USER-b'},{...token,documentId:'DOC-b'},{...token,generation:0}]) assert.equal(applyDocumentSnapshot(state,snapshot,value),state);
  assert.equal(applyDocumentSnapshot(state,{...snapshot,revision:1},token),state);
  assert.equal(applyDocumentSnapshot(selectDocument(state,'DOC-b'),snapshot,token).snapshot,null);
  assert.equal(documentPollDelay(true),2000); assert.equal(documentPollDelay(false),null);
});
test('unknown write retains the original durable command identity; known terminal results remove it', () => {
  const values=new Map(), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const state=selectDocument(createDocumentState('USER-a'),'DOC-a');
  const command={command_id:'CMD-a',document_id:'DOC-a',expected_revision:0,command:'create_primitive',parameters:{}};
  const submitted=beginDocumentCommand(state,command,storage);
  const unknown=reconcileDocumentCommand(submitted,{command_id:'CMD-a',state:'outcome_unknown'},storage);
  assert.equal(unknown.pending.command_id,command.command_id);
  assert.equal(readPendingCommand(storage,'USER-a','DOC-a').command_id,'CMD-a');
  assert.equal(readPendingCommand(storage,'USER-b','DOC-a'),null);
  assert.equal(reconcileDocumentCommand(unknown,{command_id:'CMD-b',state:'completed'},storage),unknown);
  assert.equal(reconcileDocumentCommand(unknown,{command_id:'CMD-a',state:'completed'},storage).pending,null);
  assert.equal(readPendingCommand(storage,'USER-a','DOC-a'),null);
});
test('unavailable storage prevents a write with no recoverable command identity',()=>{
  const state=selectDocument(createDocumentState('USER-a'),'DOC-a');
  assert.throws(()=>beginDocumentCommand(state,{command_id:'CMD-a',document_id:'DOC-a'},null),/未提交/);
});
test('document API propagates aborts and 401; network writes are explicitly unknown', async()=>{
  const abort=Object.assign(new Error('cancelled'),{name:'AbortError'});
  const api=createDocumentApi(async()=>{throw abort;});
  await assert.rejects(api.head('DOC-a'),e=>e===abort);
  await assert.rejects(createDocumentApi(async()=>{throw Object.assign(new Error('login'),{status:401});}).head('DOC-a'),e=>e.status===401);
  await assert.rejects(createDocumentApi(async()=>{throw new TypeError('offline');}).submit('DOC-a',{}),e=>e.outcomeUnknown===true);
  const calls=[], controller=new AbortController();
  await createDocumentApi(async(...args)=>{calls.push(args);return {};}).snapshot('DOC-a',2,{signal:controller.signal});
  assert.equal(calls[0][1].signal,controller.signal);
});
