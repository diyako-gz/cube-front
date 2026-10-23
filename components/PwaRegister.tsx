"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const secure = location.protocol === "https:" || location.hostname === "localhost";
    if ("serviceWorker" in navigator && secure) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
