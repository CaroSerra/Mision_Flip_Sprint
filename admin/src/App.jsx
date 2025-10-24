
import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Insights from './pages/Insights'
import Customers from './pages/Customers'
import './styles.css'


class ErrorBoundary extends React.Component{
  constructor(props){ super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error('App ErrorBoundary', error, info) }
  render(){
    if(this.state.hasError){
      return <div className="container"><div className="card"><div className="card-body">
        <div style={{fontWeight:600}}>Something went wrong.</div>
        <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error)}</pre>
      </div></div></div>
    }
    return this.props.children
  }
}

export default function App(){
  return (
    <ErrorBoundary>
      <div style={{display:'flex', minHeight:'100vh'}}>
        <aside style={{width:220, borderRight:'1px solid #e5e7eb', padding:16}}>
          <div style={{fontWeight:800, marginBottom:16}}>Admin Panel</div>
          <nav style={{display:'grid', gap:8}}>
            <Link to="/">Dashboard</Link>
            <Link to="/insights">Insights</Link>
            <Link to="/customers">Customers</Link>
          </nav>
        </aside>
        <main style={{flex:1}}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  )
}
