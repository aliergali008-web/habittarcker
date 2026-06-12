import { useState } from "react";
import TabBar, { type Tab } from "./components/TabBar";
import Exams from "./screens/Exams";
import Focus from "./screens/Focus";
import Insights from "./screens/Insights";
import Log from "./screens/Log";
import Today from "./screens/Today";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="app">
      <div className="bg-blobs" aria-hidden>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>
      {tab === "today" && <Today go={setTab} />}
      {tab === "focus" && <Focus />}
      {tab === "log" && <Log go={setTab} />}
      {tab === "insights" && <Insights />}
      {tab === "exams" && <Exams />}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
