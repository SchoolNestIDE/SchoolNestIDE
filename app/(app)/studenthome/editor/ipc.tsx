import type * as q from  '@xterm/xterm';
let dmaBufferAddress = 0;
interface Connection {
    connId: number,
    disconnect: () => void,
    ondisconnect: () => void,
    send: (buf: Uint8Array | string) => void,
    handle: (buf: Uint8Array) => void
}
interface ExtendedWebViewerConnection extends Connection {
    id: number
}
const ConnectionContext = {
    msgId: 0
}
function createConnectPacket(msgId: number, port: number) {
    let dv = new DataView(new ArrayBuffer(4 + 4 + 4));
    let id = ConnectionContext.msgId;
    ConnectionContext.msgId += 1;
    dv.setInt32(0, 0, true);
    dv.setInt32(4, id, true);
    let ConnectionPkt = new DataView(dv.buffer, 8);

    ConnectionPkt.setUint32(0, port, true);
    return [id, dv];
}


function open_webviewer(msgLoop: MessageLoop) {
    let viewable_url = `${location.protocol}//${location.host}:8080/bootstrap.html`;

    let w = open(viewable_url, "web_ipc");
    setTimeout(() => {
        let mc = new MessageChannel();
        let p1 = mc.port1;

        p1.onmessage = (ev) => {
            // console.log(ev.data['id']);
            let buffers: Uint8Array[] = [];
            let totalLen = 0;
            function lf(e: Uint8Array) {

                // console.log(new TextDecoder().decode(ev));
                // console.log(this.id);
                buffers.push(e.slice());
                // console.log(e.length);
                totalLen += e.length;

                // p1.postMessage({ id: this.id, real: e.slice() }, []);
                // conn?.disconnect();
            }
            lf.id = ev.data['id'];
            let conn = send_connect_packet(msgLoop, 6061, lf, function (f) {

                // console.log(this.id);
                if (!conn) { return; }
                conn.send(ev.data.str + "\nexit 0\n");

            }) as ExtendedWebViewerConnection;

            if (!conn) {
                throw new Error("Could not attain connection to the server running in the VM");
            }
            conn.ondisconnect = function () {
                // console.log(totalLen);
                let ua = new Uint8Array(totalLen);
                let offset = 0;
                for (let buf of buffers) {
                    ua.set(buf, offset);
                    offset += buf.length;
                }
                p1.postMessage({ id: this.id, real: ua.slice() }, []);
            }
            conn.id = ev.data['id']



        };
        p1.start();
        w?.postMessage(mc.port2, '*', [mc.port2]);
    }, 200);

}
enum NestProtocol {
    DATA = 2,
    DISCONNECT = 1,

}
class MessageLoop {
    emulator: any;
    handlers: ((...args: any[]) => void)[];
    ids: ((...args: any[]) => void)[];
    buffers: [];
    totalSize: number;
    rx_addr: number;
    static _instance: MessageLoop;
    static get instance() {

        this._instance ??= new MessageLoop();
        
        return this._instance;
        
    }
    static onEmulatorLoaded(emulator: any) {
    }
    onEmulatorEnabled(emulator: any, terminal: q.Terminal) {

        this.emulator  = emulator;
        let collector = new Uint8Array(8192);
        let cursor = 0;
        terminal.onData((byte)=>{
            emulator.serial0_send(byte);
        })
       emulator.add_listener("serial0-output-byte", (byte: number) => {
        collector[cursor] = byte;
        cursor++;
        if (String.fromCharCode(byte) === "\n") {
          this.onSerialLine(new TextDecoder().decode(collector.slice(0, cursor - 1)));
          cursor = 0;
        }
        terminal.write(new Uint8Array([byte]));
      });
    }
    constructor() {
        this.handlers = [];
        this.ids = [];
        this.emulator = null;
        this.buffers = [];
        this.totalSize = 0;
        this.rx_addr = 0;
    }
    
    onSerialLine(line: string) {
        if (line.indexOf("ptr") === 0) {
            // console.log("here");
            console.log(line.substring(3, line.indexOf(" ")));
            dmaBufferAddress = parseInt(line.substring(3, line.indexOf(" ")));
            this.rx_addr = parseInt(line.substring(line.indexOf(" ") + 1));

            setInterval(this.everyTick.bind(this), 10);
        }
    }
    everyTick() {
        const dmaBufferSize = 1024 * 1024 * 4;
        const { emulator, rx_addr } = this;
        if (emulator.read_memory(rx_addr, 1)[0] == 1) {

            let buf = emulator.read_memory(rx_addr + 1, dmaBufferSize) as Uint8Array

            let dv = new DataView(buf.buffer, buf.byteOffset, dmaBufferSize);
            // console.log(dv.getUint32(0, true));

            if (dv.getUint32(0, true) === NestProtocol.DATA || dv.getUint32(0, true) === NestProtocol.DISCONNECT) /* DATA or DISCONNECT*/ {
                if (dv.getUint32(0, true) === 1) {
                    this.handlers[dv.getUint32(8, true)]("disconnect");
                }
                let kOffset = 16;
                let realdat = dv.byteOffset + kOffset;
                let datLen = dv.getUint32(12, true);
                if (this.handlers[dv.getUint32(8, true)]) {
                    this.handlers[dv.getUint32(8, true)](new Uint8Array(dv.buffer, realdat, datLen));
                }
            } else {
                let msgId = dv.getUint32(4, true);
                // console.log(msgId);
                if (this.ids[msgId]) {
                    this.ids[msgId](new Uint8Array(dv.buffer, dv.byteOffset + 8, dmaBufferSize - 8));
                    //delete msg_loop.ids[msgId];
                }
            }
            emulator.write_memory([0], rx_addr);
        }
    }
}

// typedef struct {
//   int connId;
//   size_t msgLen;
//   char data[];
// } DataPkt;

function create_data_pkt(connid: number, buffer: Uint8Array) {
    let dv = new DataView(new ArrayBuffer(4 + 4 + 4 + 4 + buffer.length));
    let id = ConnectionContext.msgId;
    ConnectionContext.msgId += 1;
    dv.setInt32(0, 2, true);
    dv.setInt32(4, id, true);
    let DataPkt = new DataView(dv.buffer, 8);

    DataPkt.setUint32(0, connid, true);
    DataPkt.setUint32(4, buffer.length, true);
    new Uint8Array(dv.buffer).set(buffer, 8 + 8);

    return [id, dv];
}
// typedef struct {
//     int id;
// } Disconnect;
function create_disconnect_pkt(connid: number) {

    let dv = new DataView(new ArrayBuffer(4 + 4 + 4));
    let id = ConnectionContext.msgId;
    ConnectionContext.msgId += 1;
    dv.setInt32(0, 1, true); // Disocnnect msg type
    dv.setInt32(4, id, true);
    let DiconnectPacket = new DataView(dv.buffer, 8);

    DiconnectPacket.setUint32(0, connid, true);
    // DiconnectPacket.setUint32(4, buffer.length, true);
    return [id, dv];
}
function send_disconnect_packet(msgLoop: MessageLoop, connid: number) {
    let c = create_disconnect_pkt(connid);
    msgLoop.emulator.write_memory(new Uint8Array((c[1] as DataView<ArrayBuffer>).buffer), dmaBufferAddress + 1);
    msgLoop.emulator.write_memory([1], dmaBufferAddress);
    return;
}
function send_data_pkt(msgLoop: MessageLoop, connid: number, buffer: Uint8Array) {
    let c = create_data_pkt(connid, buffer);
    msgLoop.emulator.write_memory(new Uint8Array((c[1] as DataView<ArrayBuffer>).buffer), dmaBufferAddress + 1);
    msgLoop.emulator.write_memory([1], dmaBufferAddress);
    return;
}

function send_connect_packet(msgLoop: MessageLoop, port: number, handler: (buffer: Uint8Array) => void, connectionId = (num: number) => { }): Connection | undefined {
    let c = createConnectPacket(0, port);
    if (!msgLoop.emulator) {
        return;
    }
    let result: Connection = {
        connId: -1,
        disconnect() {
            send_disconnect_packet(msgLoop, this.connId);
        },
        ondisconnect() {
            console.error("IP Disconnected");
        },
        send(buf: string | Uint8Array) {
            if (typeof buf === "string") {
                send_data_pkt(msgLoop, this.connId, new TextEncoder().encode(buf));

            } else {

                send_data_pkt(msgLoop, this.connId, buf);

            }
        },
        handle: handler
    }
    msgLoop.ids[c[0] as number] = (buf) => {
        if (buf === "disconnect") {
            result.ondisconnect();
        }
        let connId = new Uint32Array(buf)[0];
        let error = new Uint32Array(buf)[1];
        result.connId = connId;
        connectionId.apply(result, [connId]);
        msgLoop.handlers[connId] = (d) => {
            if (d === "disconnect") {
                return result.ondisconnect();
            }
            return result.handle(d);
        };
    }

    msgLoop.emulator.write_memory(new Uint8Array((c[1] as DataView).buffer), dmaBufferAddress + 1);
    msgLoop.emulator.write_memory([1], dmaBufferAddress);
    return result;
}
export {MessageLoop};