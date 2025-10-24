
import React from 'react'

export default function CorrTable({ matrix, order }){
  if(!matrix || !order || order.length === 0) return null

  const min = -1, max = 1
  const color = (v) => {
    // map -1..1 to red..white..blue
    const t = (v+1)/2
    const r = Math.round(255*(1-t))
    const g = Math.round(255*(1-Math.abs(v)))
    const b = Math.round(255*t)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div style={{overflowX:'auto'}}>
      <table className="table" style={{borderCollapse:'collapse', minWidth: 500}}>
        <thead>
          <tr>
            <th style={{position:'sticky', left:0, background:'#fff'}}>Var</th>
            {order.map((c) => (<th key={c}>{c}</th>))}
          </tr>
        </thead>
        <tbody>
          {order.map((r) => (
            <tr key={r}>
              <th style={{position:'sticky', left:0, background:'#fff', textAlign:'left'}}>{r}</th>
              {order.map((c) => {
                const v = Number(matrix?.[r]?.[c] ?? 0)
                return (
                  <td key={c} title={v.toFixed(2)} style={{textAlign:'center', padding:'8px', background: color(v)}}>
                    {v.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
