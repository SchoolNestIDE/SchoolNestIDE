import Link from 'next/link';
import { motion } from 'framer-motion';
import { SidebarLink } from "@/app/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconCoffee,
  IconPackage,
  IconTemplate,
} from "@tabler/icons-react";

export const Logo = () => (
  <Link
    href="/"
    className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
  >
    <div className="h-6 w-6 bg-[#6A4028] rounded-lg shadow-lg shadow-[#6A4028]/30 flex-shrink-0" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-semibold text-white whitespace-pre bg-gradient-to-r from-[#6A4028] to-white bg-clip-text text-transparent"
    >
      SchoolNest
    </motion.span>
  </Link>
);

export const LogoIcon = () => (
  <Link
    href="#"
    className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
  >
    <div className="h-6 w-6 bg-[#6A4028] rounded-lg shadow-lg shadow-[#6A4028]/30 flex-shrink-0" />
  </Link>
);

export const NavigationLinks = () => {
  const links = [
    { label: "Home", href: "/studenthome/", icon: <IconBrandTabler className="text-slate-400 h-5 w-5" /> },
    { label: "Profile", href: "#", icon: <IconUserBolt className="text-slate-400 h-5 w-5" /> },
    { label: "Dashboard", href: "/studenthome/java", icon: <IconCoffee className="text-slate-400 h-5 w-5" /> },
    { label: "Dependencies", href: "/studenthome/java/dependencies", icon: <IconPackage className="text-slate-400 h-5 w-5" /> },
    { label: "Templates", href: "/studenthome/java/templates", icon: <IconTemplate className="text-slate-400 h-5 w-5" /> },
    { label: "Account Settings", href: "#", icon: <IconSettings className="text-slate-400 h-5 w-5" /> },
    { label: "Logout", href: "", icon: <IconArrowLeft className="text-slate-400 h-5 w-5" /> },
  ];

  return (
    <div className="mt-8 flex flex-col gap-2">
      {links.map((link, idx) => (
        <SidebarLink key={idx} link={link} />
      ))}
    </div>
  );
};