"use client";

import { useEffect } from "react";
import Background from "../components/Background.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import ChatView from "../components/ChatView.jsx";
import MindmapView from "../components/MindmapView.jsx";
import ContextMenus from "../components/ContextMenus.jsx";
import MindmapBottomBar from "../components/MindmapBottomBar.jsx";
import WebSearchPanel from "../components/WebSearchPanel.jsx";
import Overlays from "../components/Overlays.jsx";

export default function Page() {
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("app_mode");
      if (storedMode === "hackathon") {
        document.body.classList.add("theme-hackathon");
      } else {
        document.body.classList.remove("theme-hackathon");
        localStorage.setItem("app_mode", "light");
      }
    } catch (e) {
      document.body.classList.remove("theme-hackathon");
    }

    Promise.all([import("../lib/boot"), import("../lib/main")]);
  }, []);

  return (
    <>
      <Background />
      <Sidebar />
      <TopBar />
      <main className="w-full h-full relative">
        <ChatView />
        <MindmapView>
          <ContextMenus />
          <MindmapBottomBar />
          <WebSearchPanel />
        </MindmapView>
      </main>
      <Overlays />
    </>
  );
}
