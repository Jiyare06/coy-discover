"use client";

import { useEffect, useState } from "react";
import Discover from "@/components/Discover";
import { CompassIcon, HomeIcon } from "@/components/icons";

type Tab = "home" | "discover";

export default function Page() {
  const [tab, setTab] = useState<Tab>("discover");

  // Keep the selected tab in the URL hash so a reload lands on the same tab.
  useEffect(() => {
    if (window.location.hash === "#home") setTab("home");
  }, []);
  const select = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div className="app">
      <main className="screen">
        {tab === "home" ? <section className="home" aria-label="Home" /> : <Discover />}
      </main>

      <nav className="tabbar" aria-label="Main">
        <button className={tab === "home" ? "tab active" : "tab"} onClick={() => select("home")} aria-current={tab === "home" ? "page" : undefined}>
          <HomeIcon />
          <span>Home</span>
        </button>
        <button className={tab === "discover" ? "tab active" : "tab"} onClick={() => select("discover")} aria-current={tab === "discover" ? "page" : undefined}>
          <CompassIcon />
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}
