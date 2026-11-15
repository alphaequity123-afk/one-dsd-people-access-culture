// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {RecordWorkbench} from './record-workbench';
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear();});
describe('prefilled working record',()=>{
 it('keeps the draft visible and warns when initial browser storage fails',()=>{
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('Storage unavailable');});
  render(<RecordWorkbench kind="action-plan" prefill={{title:'Review access arrangements',source:'Learning course'}}/>);
  expect(screen.getByRole('status').textContent).toContain('could not save the new record');
  expect(screen.getByDisplayValue('Review access arrangements')).toBeTruthy();
  expect(screen.getByDisplayValue('Learning course')).toBeTruthy();
  expect(localStorage.length).toBe(0);
 });
});
