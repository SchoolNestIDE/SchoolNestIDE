import * as React from 'react';
import ReactDOM from 'react-dom';
interface ContextMenuItemProps {
    isAvailable: () => boolean,
    children: React.ReactNode
}
interface ContextProps {
    children?: React.ReactNode
}
interface ContextMenuContextType {
    onContextMenu: (ev: PointerEvent) => void;
}
let ContextMenuContext = React.createContext<ContextMenuContextType | undefined>(undefined);
export function ContextMenuProvider({ children }: { children: any }) {
    const CtxMenuContext: ContextMenuContextType = {
        onContextMenu: function (ev) {

        }
    }
    return (
        <ContextMenuContext.Provider value={CtxMenuContext}>
            {children}
        </ContextMenuContext.Provider>
    )
}
export function ContextMenuItem({
    isAvailable,
    children
}: ContextMenuItemProps) {

    return (

        <div style={{ display: isAvailable() ? "block" : "none", fontSize: "18px" }}>
            {children}
        </div>
    )
}
export default function ContextMenu({
    children
}: ContextProps) {
    let cc = React.useContext(ContextMenuContext);

    if (cc) {
        cc.onContextMenu = function (ev) {
            let compPath = ev.composedPath();
            
        }
    }

    const [contextMenuVisibility, setContextMenuVisibility] = React.useState(false);

    const onContextMenu = function (ev: MouseEvent) {
        
        
    }
    document.oncontextmenu = onContextMenu;
    return (
        <>
            {children}
        </>
    )
}
