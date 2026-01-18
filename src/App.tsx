import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import AddDeck from './pages/AddDeck';
import { EditCard } from './pages/EditCard';
import { PlayDeck } from './pages/PlayDeck';
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/addDeck" element={<AddDeck />} />
        <Route path="/card/:id" element={<EditCard />} />
        <Route path="/play/:id" element={<PlayDeck />} />
      </Routes>
    </Router>
  );
}

export default App;
