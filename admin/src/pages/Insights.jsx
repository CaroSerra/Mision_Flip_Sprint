
import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import { loadCSV } from '../utils/csv'

export default function Insights(){
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run(){
      try{
        const cli = await loadCSV('/data/clientes_datos.csv')
        setRows(cli.slice(0, 10))
      } catch(e){
        setError(e?.message || 'Error loading clientes_datos.csv')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="container">
      <h1>Insights</h1>
      <Card title="Muestra de clientes (primeras 10 filas)">
        {loading && <div>Cargando...</div>}
        {error && <div>Error: {error}</div>}
        {!loading && !error && (
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                {rows[0] && (
                  <tr>
                    {Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>)}
                  </tr>
                )}
              </thead>
              <tbody>
                {rows.map((r,i) => (
                  <tr key={i}>
                    {Object.keys(rows[0] || {}).map((k) => <td key={k}>{String(r[k])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{marginTop:12}}>
          <a href="/data/clientes_datos.csv" target="_blank" rel="noreferrer">Descargar clientes_datos.csv</a>
        </div>
      </Card>
    </div>
  )
}
