
import React, { useState } from 'react'
import Card from '../components/Card'
import { loadCSV } from '../utils/csv'

/**
 * Customer lookup with 3 strategies:
 *  1) POST { clientID } to API_URL
 *  2) GET  ?clientID=...  to API_URL
 *  3) Fallback: read /data/clientes_datos.csv and filter locally
 *
 * Set API URL via Vite env: VITE_API_URL, or it will default to the original value.
 */
const API_URL = import.meta.env.VITE_API_URL || 'https://kr44v8tqe0.execute-api.eu-west-3.amazonaws.com/dev/client'

async function tryPost(clientID){
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientID }),
    mode: 'cors',
    credentials: 'omit',
  })
  if(!res.ok) throw new Error(`POST ${res.status} ${res.statusText}`)
  return await res.json()
}

async function tryGet(clientID){
  const url = `${API_URL}?clientID=${encodeURIComponent(clientID)}`
  const res = await fetch(url, { method:'GET', mode:'cors', credentials:'omit' })
  if(!res.ok) throw new Error(`GET ${res.status} ${res.statusText}`)
  return await res.json()
}

async function tryLocalCSV(clientID){
  const rows = await loadCSV('/data/clientes_datos.csv')
  // Normalize header names from your CSV
  const row = rows.find(r => String(r['cliente_id'] || r['clientID']).trim() === String(clientID).trim())
  if(!row) throw new Error(`Cliente ${clientID} no encontrado en clientes_datos.csv`)
  // Map to API-like shape expected by UI
  return {
    clientID: row['cliente_id'] || row['clientID'],
    genero: row['genero'],
    edad: row['edad'],
    numeroCompras: row['numero_compras'] || row['numeroCompras'],
    gastoTotal: row['gasto_total'] || row['gastoTotal'],
    direccion: row['direccion'],
    discordWebhook: row['discordWebhook'],
    categoriaGasto: row['categoria_gasto'] ?? row['categoriaGasto'],
  }
}

async function fetchClient(clientID){
  // Strategy 1: POST
  try{
    const data = await tryPost(clientID)
    return data
  }catch(e1){
    console.warn('POST failed:', e1?.message)
    // Strategy 2: GET
    try{
      const data = await tryGet(clientID)
      return data
    }catch(e2){
      console.warn('GET failed:', e2?.message)
      // Strategy 3: Local fallback
      const data = await tryLocalCSV(clientID)
      return data
    }
  }
}

export default function Customers(){
  const [clientID, setClientID] = useState('client002')
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onLoad(){
    setLoading(true); setError(''); setClient(null)
    try{
      const data = await fetchClient(clientID.trim())
      setClient(data)
    }catch(e){
      setError(e?.message || 'Failed to fetch')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Customers</h1>

      <div className="card" style={{marginBottom:12}}>
        <div className="card-body">
          <div className="field" style={{display:'flex', gap:8}}>
            <input
              className="input"
              placeholder="clientID"
              value={clientID}
              onChange={(e)=>setClientID(e.target.value)}
              style={{flex:1, padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8}}
            />
            <button onClick={onLoad} disabled={loading} style={{padding:'10px 16px', borderRadius:8}}>
              {loading ? 'Loading...' : 'Load Client'}
            </button>
          </div>
          <div style={{marginTop:8, fontSize:12, color:'#6b7280'}}>
            Tip: set <code>VITE_API_URL</code> in a <code>.env.local</code> to point at your API. This page will fallback to <code>clientes_datos.csv</code> if the API call fails (CORS/403/timeout).
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{border:'1px solid #fca5a5', background:'#fff5f5'}}>
          <div className="card-body">
            <div style={{fontWeight:600, marginBottom:6}}>Error: {error}</div>
            <div style={{fontSize:14, color:'#6b7280'}}>
              Common causes: CORS not allowed for your origin, wrong method (GET vs POST), or API Gateway not deployed.
            </div>
          </div>
        </div>
      )}

      {client && (
        <Card title={`Cliente ${client.clientID || clientID}`}>
          <div style={{display:'grid', gap:8}}>
            <div><div className="badge">Género</div> <div>{client.genero ?? '-'}</div></div>
            <div><div className="badge">Edad</div> <div>{client.edad ?? '-'}</div></div>
            <div><div className="badge"># Compras</div> <div>{client.numeroCompras ?? '-'}</div></div>
            <div><div className="badge">Gasto total</div> <div>{client.gastoTotal ?? '-'}</div></div>
            <div><div className="badge">Dirección</div> <div>{client.direccion ?? '-'}</div></div>
            {client.discordWebhook && (
              <div><div className="badge">Webhook</div> <div style={{overflowWrap:'anywhere'}}>{client.discordWebhook}</div></div>
            )}
            {client.categoriaGasto !== undefined && (
              <div><div className="badge">Categoría gasto</div> <div>{String(client.categoriaGasto)}</div></div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
