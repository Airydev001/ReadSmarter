import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Break from "./components/Break";
import Home from "./pages/Home";
import Read from "./pages/Read";
import Focus from "./pages/Focus";
import Music from "./pages/Music";
import Library from "./pages/Library";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Nav />
      <main className="wrap">
        {/* The reader stays mounted so your PDF and reading keep going while you browse. */}
        <div hidden={pathname !== "/read"}><Read active={pathname === "/read"} /></div>
        <Routes>
          <Route path="/read" element={null} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/music" element={<Music />} />
          <Route path="/library" element={<Library />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Break />
    </>
  );
}
