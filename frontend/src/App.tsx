import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PuzzlePage } from "./pages/PuzzlePage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/puzzle/:id" element={<PuzzlePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
