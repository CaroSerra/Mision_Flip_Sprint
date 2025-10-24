
import Papa from 'papaparse'

// Normalize locale numbers: "73,5" -> 73.5 ; " 1 234 " -> 1234
export function toNumberLoose(v){
  if (v === null || v === undefined || v === '') return NaN
  if (typeof v === 'number') return v
  if (typeof v === 'string'){
    const s = v.trim().replace(/\s+/g,'').replace(',', '.')
    const n = Number(s)
    return isNaN(n) ? NaN : n
  }
  return Number(v)
}

export function loadCSV(url){
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: false, // we'll coerce manually to handle decimal commas
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    })
  })
}
