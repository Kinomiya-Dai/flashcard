import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import AddDeck from './pages/AddDeck';
import { EditCard } from './pages/EditCard';
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/addDeck" element={<AddDeck />} />
        <Route path="/card/:id" element={<EditCard />} />
      </Routes>
    </Router>
  );
}

export default App;
