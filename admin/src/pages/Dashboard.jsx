
import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { loadCSV, toNumberLoose } from '../utils/csv'
import CorrTable from '../components/CorrTable'

export default function Dashboard(){
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [kpis, setKpis] = useState([])
  const [meansByVar, setMeansByVar] = useState([])
  const [corr, setCorr] = useState({ mat:{}, order:[] })

  useEffect(() => {
    async function run(){
      const newErrors = []
      try{
        const [total, det, corrRaw] = await Promise.all([
          loadCSV('/data/analisis_total.csv'),
          loadCSV('/data/analisis_detallado.csv'),
          loadCSV('/data/analisis_correlaciones.csv'),
        ])

        // ----- KPIs (Spanish headers from Notebook) -----
        try{
          const row = total?.[0] || {}
          const totalClientes = toNumberLoose(row['total_clientes'])
          const edadMedia = toNumberLoose(row['edad_media'])
          const edadStd = toNumberLoose(row['edad_desviacion'])
          const gastoMedio = toNumberLoose(row['gasto_medio'])
          const gastoStd = toNumberLoose(row['gasto_desviacion'])
          const predMedio = toNumberLoose(row['prediccion_gasto_cliente_medio'])
          const accClasif = toNumberLoose(row['accuracy_clasificacion'])

          const entries = [
            { label: 'Clientes', value: totalClientes, suffix:'', trend:'total' },
            { label: 'Edad media', value: edadMedia, suffix:'', trend:'edad' },
            { label: 'Edad desv.', value: edadStd, suffix:'', trend:'edad' },
            { label: 'Gasto medio', value: gastoMedio, suffix:'€', trend:'gasto' },
            { label: 'Gasto desv.', value: gastoStd, suffix:'', trend:'gasto' },
          ]
          // Only show accuracy if it exists
          if (!isNaN(accClasif)) {
            entries.unshift({ label: 'Accuracy', value: accClasif*100, suffix:'%', trend:'model' })
          }
          setKpis(entries)
        }catch(e){
          console.error('KPI parse error', e)
          newErrors.push('No se pudieron leer los KPIs (analisis_total.csv).')
        }

        // ----- Means from describe() table (analisis_detallado) -----
        // Shape example:
        // Unnamed: 0 | gasto_total | numero_compras | edad
        // count      | ...
        // mean       | ...
        // std        | ...
        try{
          const indexKey = Object.keys(det[0] || {})[0] // 'Unnamed: 0'
          const meanRow = det.find(r => String(r[indexKey]).toLowerCase() === 'mean')
          if (meanRow){
            const vars = Object.keys(meanRow).filter(k => k !== indexKey)
            const chartData = vars.map(v => ({ variable: v, media: toNumberLoose(meanRow[v]) }))
            setMeansByVar(chartData)
          }else{
            newErrors.push('No se encontró la fila "mean" en analisis_detallado.csv.')
          }
        }catch(e){
          console.error('Detallado parse error', e)
          newErrors.push('No se pudo construir el gráfico de medias (analisis_detallado.csv).')
        }

        // ----- Correlation matrix with 'Unnamed: 0' as row index -----
        try{
          const headersAll = Object.keys(corrRaw[0] || {})
          const rowLabelKey = headersAll[0] // 'Unnamed: 0'
          const headers = headersAll.slice(1)
          const mat = {}
          for(const row of corrRaw){
            const rname = String(row[rowLabelKey]).trim()
            if(!rname) continue
            mat[rname] = {}
            for(const c of headers){
              mat[rname][c] = toNumberLoose(row[c])
            }
          }
          setCorr({ mat, order: headers })
        }catch(e){
          console.error('Correlation parse error', e)
          newErrors.push('No se pudo leer la matriz de correlaciones (analisis_correlaciones.csv).')
        }
      }catch(e){
        console.error(e)
        newErrors.push(e?.message || 'Error cargando CSVs')
      }finally{
        setErrors(newErrors)
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="container">
      <h1>Panel de Control</h1>
      {loading && <div className="card"><div className="card-body">Cargando...</div></div>}
      {errors.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div style={{fontWeight:600, marginBottom:8}}>Se encontraron problemas:</div>
            <ul>{errors.map((e,i) => <li key={i}>{e}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="grid grid-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} title={k.label} value={isNaN(k.value)?'-':(k.label==='Clientes'?k.value:Number(k.value).toFixed(1))} suffix={k.suffix} trend={k.trend} />
        ))}
      </div>

      <Card title="Medias por variable (desde analisis_detallado.csv)">
        <div style={{width:'100%', height:320}}>
          <ResponsiveContainer>
            <BarChart data={meansByVar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="variable" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="media" name="Media" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Matriz de correlaciones">
        <CorrTable matrix={corr.mat} order={corr.order} />
      </Card>
    </div>
  )
}
