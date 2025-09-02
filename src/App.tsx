import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { InvoicesComponent } from './Invoices/index';
import './App.css';

function Home() {
  return (
    <ul>
      <li>
        <Link to="/invoices">Invoices</Link>
      </li>
    </ul>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoices" element={<InvoicesComponent />} />
      </Routes>
    </Router>
  );
}
