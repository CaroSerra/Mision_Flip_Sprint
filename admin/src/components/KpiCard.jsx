import React from 'react'
export default function KpiCard({ title, value, sub, trend }){
  return (
    <div className="kpi">
      <div className="title">{title}</div>
      <div className="value">{value}</div>
      <div className="sub">{sub}</div>
      <div className="trend">{trend}</div>
    </div>
  )
}
