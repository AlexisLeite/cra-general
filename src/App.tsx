import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { InvoicesComponent } from './Invoices/index'
import './App.css'
import { Diagrams } from './Diagrams'

function Home() {
  return (
    <ul>
      <li>
        <Link to="/diagrams">Diagrams</Link>
      </li>
      <li>
        <Link to="/invoices">Invoices</Link>
      </li>
    </ul>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoices" element={<InvoicesComponent />} />
        <Route path="/diagrams" element={<Diagrams />} />
      </Routes>
    </Router>
  )
}
