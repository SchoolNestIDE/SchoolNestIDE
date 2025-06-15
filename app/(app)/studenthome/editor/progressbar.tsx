/*
 * Copyright (C) 2025 SchoolNest
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { Progress } from "@nextui-org/react";
import { useEmulatorCtx } from "./emulator";
import { useEffect, useState } from "react";

export function DownloadProgressBar(props: any) {
    let ctx = useEmulatorCtx();
    let [state, setState] = useState(0);
    
    useEffect(()=>{
        ctx.addProgressListener((loaded, total)=>{
            setState(loaded * 100/total);
        })
    },[])
    return (
        <Progress value={state}></Progress>
    )
}