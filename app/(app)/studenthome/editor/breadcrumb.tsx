import React from 'react';
import  { useRef, useState } from 'react'
import rdom from 'react-dom'
export type WriteState = {
    q: [React.ReactNode[], (array: React.ReactNode[])=>void]
}
export function emplaceBreadcrumb(elm: WriteState, newElement: React.ReactNode, duration: number) {
    elm.q[1]([...elm.q[0], newElement]);
    let id = elm.q[0].length -1

    setTimeout(function () {
        
    }, duration);
}
export function BreadcrumItem({visibility, children}: {children: React.ReactNode, visibility: boolean}) {
    let displayState = visibility ? "block" : "none";
    return (
        <div style={{display: displayState}}>
            {children}
        </div>
    )
}
export default function Breadcrumb({ children, r }: {
    children: React.ReactNode,
    r: React.MutableRefObject<WriteState>
}) {
    
    const [state, setState] = useState([] as React.ReactNode[]);
    r.current = {
        q: [state, setState]
    };
        
    return (
        <div style={{ borderColor: "white", borderStyle: "solid", borderWidth: "2px", transform: "translate(-20px, -20px)" }}>
            {state}
        </div>
    )
}