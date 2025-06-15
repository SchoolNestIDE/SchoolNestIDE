import { FitAddon } from '@xterm/addon-fit';
import React from 'react';
import { useEmulatorCtx } from './emulator';
import { useMemoryContext } from './filesystem';
import { MessageLoop } from './ipc';
import { Terminal } from '@xterm/xterm';
export type EnabledOverride = (emu: any, terminal: Terminal) => void;

function XTermComponent({ evtTarget, onEmEnableOverride }: { onEmEnableOverride?: EnabledOverride, evtTarget: EventTarget }) {

  const terminalRef = React.useRef(null);


  const [downloadProgress, setDownloadProgressUI] = React.useState(0);
  const [fitAddon, setFitAddon] = React.useState<FitAddon | null>(null);
  let emuCtx = useEmulatorCtx();
  let memoryContextSettings = useMemoryContext();
  // debugger;

  React.useEffect(() => {
    let temr: Terminal;
    console.log(terminalRef.current);

    setTimeout((async () => {

      if (!terminalRef.current) {
        // This should not happen
        console.error("UseEffect triggered with unloaded terminal");
        return;
      }


      let em = await emuCtx.emulator;
      var fs;
      console.log(em);
      const xterm = await import('@xterm/xterm');
      let fitAddon = await import("@xterm/addon-fit");
      console.log(terminalRef);

      /* eslint-disable */
      let fadd = new fitAddon.FitAddon();
      if (!memoryContextSettings) {
        return;
      }

      console.log(fadd);
      fs = memoryContextSettings.fs;



      temr = new xterm.Terminal({});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    let curtheme = temr.options.theme;
    if (event.matches) {
      curtheme.background = "black";
    curtheme.foreground = "white";
        curtheme.black = "black";
    curtheme.white = "white";
    curtheme.cursorAccent = "white"
    curtheme.cursor = "white"
    }else {
      curtheme.background = "white";
    curtheme.foreground = "black";
    curtheme.black = "black";
    curtheme.white = "black";
    curtheme.cursorAccent = "black"
    curtheme.cursor = "black"
    }
    temr.options.theme = {...curtheme};
});
let curtheme = temr.options.theme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      curtheme.background = "black";
    curtheme.foreground = "white";
        curtheme.black = "black";
    curtheme.white = "white";
    curtheme.cursorAccent = "white"
    curtheme.cursor = "white"
    }else {
      curtheme.background = "white";
    curtheme.foreground = "black";
    curtheme.black = "black";
    curtheme.white = "black";
    curtheme.cursorAccent = "black"
    curtheme.cursor = "black"
    }
    temr.options.cursorStyle = "bar";
    temr.options.theme = {...curtheme};


      temr.options.fontSize = 14;
      temr.options.lineHeight = 1;
      console.log(terminalRef)
      temr.open(terminalRef.current);
      temr.loadAddon(fadd);
      setFitAddon(fadd);

      evtTarget.addEventListener('resize', () => {
        fadd.fit();
      })
      if (onEmEnableOverride) {
        onEmEnableOverride(em.emulator, temr);
        fadd.fit();
        return;
      }
      let msgLoop = new MessageLoop();
      em.msgLoop = msgLoop;
      msgLoop.onEmulatorEnabled(em.emulator, temr);
      MessageLoop.virtio_console_bus((await emuCtx.emulator).emulator);

      await emuCtx.waitTillDiskIsSaved();
      fadd.fit()
    }));
  }, []);
  // debugger;




  let placeholder = (
    <div className={`relative flex flex-grow flex-row items-center justify-items-center`}>


    </div>
  )
  function switchToEditor() {

  }

  const mouseState = { down: false, cb: null };

  function a(am: any) {
    if (!fitAddon) {
      return;
    }
    console.log(am);
    fitAddon.fit();

  }

  return (
    <div style={{ height: "100%" }} ref={terminalRef}></div>

  );
}
export {XTermComponent}