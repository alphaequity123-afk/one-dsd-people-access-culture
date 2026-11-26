"use client";
import Link from "@/components/app-link";
import { useEffect, useState } from "react";
import { ROLE_FAMILY_LABEL, type RoleFamily } from "@/lib/domains";

/**
 * v2 rebuild (owner direction 2026-11-26): a quiet role choice under the menu, on every page. It only suggests where
 * to begin; it never hides anything. The choice stays in this browser and is never sent anywhere.
 */
const KEY = "pac.role";
const ROLES = Object.entries(ROLE_FAMILY_LABEL) as [RoleFamily, string][];

export function RoleBar() {
  const [role, setRole] = useState<RoleFamily | "">("");
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    // Reading browser storage after the first render keeps the server and browser markup the same.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && saved in ROLE_FAMILY_LABEL) setRole(saved as RoleFamily);
  }, []);
  function choose(value: string) {
    const next = value in ROLE_FAMILY_LABEL ? value as RoleFamily : "";
    setRole(next);
    if (next) window.localStorage.setItem(KEY, next); else window.localStorage.removeItem(KEY);
  }
  return <div className="dsd-shell dsd-role-bar">
    <label>Your role <select value={role} onChange={event => choose(event.target.value)}>
      <option value="">Choose your role</option>
      {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    {role ? <Link href={`/growth/${role}`}>What fits your role</Link> : <span>Pick a role to see where to begin. Everything stays open to everyone.</span>}
  </div>;
}
