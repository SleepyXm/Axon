"use client";

import { ReactNode, Children, isValidElement, cloneElement, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/AxonNav";
import { checkAuth } from "./components/auth";

type ClientWrapperProps = {
  children: ReactNode; // <- allow any valid ReactNode
};

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth().then(setUser);
  }, []);

  const showNav = pathname.startsWith("/");

  return (
    <>
      {showNav && user !== null && <Navbar user={user} />}
      {children}
    </>
  );
}