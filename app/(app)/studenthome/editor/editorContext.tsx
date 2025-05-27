import { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import dynamic from 'next/dynamic';
import * as React from 'react';
import { useMemoryContext } from './filesystem';
const mimeType = require('mime-types');
const ps = require('path');
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorContextType {
    monaco?: Monaco;
    onChange: (val?:string)=>void;
    load: ()=>void;
    path?: string| null;
    _fs: typeof import('fs') | null;
    get fs(): typeof import('fs') | null;
    set fs(fs: typeof import('fs'));
    editor?: editor.IStandaloneCodeEditor
}

const EditorContextTypeContext = React.createContext<EditorContextType|undefined>(undefined);
function Editor() {
  let ec = React.useContext(EditorContextTypeContext);
  if (!ec) {
    return (
      <h1>Ensure this is wrapped in a EditorContextProvider</h1>
    );
  }

  return (
    <MonacoEditor beforeMount={(mon)=>{ec.monaco = mon}} onMount={(ed)=>ec.editor=ed} onChange={ec.onChange.bind(ec)}></MonacoEditor>
  )
}
function EditorContextProvider({children}: {children: React.ReactNode}) {
    const editorContext: EditorContextType = {
      monaco: undefined,
  onChange: function (value?: string) {
    // console.log(this.editor);
    if (!this.path) return;
    let m = this.path;
    this.fs?.writeFile(m, value??"", () => { })
  },
  load: function () {
    if (!this.path || !this.monaco || !this.editor) return;
    // console.log(ps.extname(this.path));
    // console.log(mimeType.lookup(ps.extname(this.path)));
    this.monaco.editor.setModelLanguage(this.editor.getModel() as editor.ITextModel, mimeType.lookup(ps.extname(this.path)));
    this.fs?.readFile(this.path, (err, val) => {
      // console.log(val);
      if (!this.monaco) {return;}
      this.monaco.editor.getEditors()[1].getModel()?.setValue(new TextDecoder().decode(val));

    })
  },
  path: null,
  _fs: null,
  set fs(fs: typeof import('fs')) {
    this._fs = fs;
  },
  get fs() {
    return this._fs as any;
  }
}
  return (
    <EditorContextTypeContext.Provider value={editorContext}>
      {children}
    </EditorContextTypeContext.Provider>
  )

}
function useEditorContext() {
  return React.useContext(EditorContextTypeContext);
}
export {EditorContextProvider, Editor,useEditorContext}