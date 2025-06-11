// components/ResizableSidebar.tsx
import React, { ReactNode, Dispatch, SetStateAction } from 'react';
import { Sidebar, SidebarBody } from "@/app/components/ui/sidebar";
import { Logo, LogoIcon } from './SidebarNavigation';

interface ResizableSidebarProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}

export const ResizableSidebar = ({ 
  open, 
  setOpen, 
  children 
}: ResizableSidebarProps) => (
  <Sidebar open={open} setOpen={setOpen}>
    <SidebarBody className="justify-between gap-10 bg-slate-900">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ml-1 mb-2 pb-6">
        {open ? <Logo /> : <LogoIcon />}
        {children}
      </div>
    </SidebarBody>
  </Sidebar>
);