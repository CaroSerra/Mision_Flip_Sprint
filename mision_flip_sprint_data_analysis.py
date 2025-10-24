import requests
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix

# --- URL API
URL = "https://kr44v8tqe0.execute-api.eu-west-3.amazonaws.com/dev/client"
response = requests.get(URL)
if response.status_code != 200:
    raise Exception(f"Error al obtener los datos: {response.status_code}")
clientes = response.json()

# Crear DF
df = pd.DataFrame(clientes)
df = df.rename(columns={
    'clientID': 'cliente_id',
    'sexo': 'genero',
    'edad': 'edad',
    'numeroCompras': 'numero_compras',
    'gastoTotal': 'gasto_total',
    'direccion': 'direccion'
})

# Convertir columnas numéricas
df['edad'] = pd.to_numeric(df['edad'], errors='coerce')
df['numero_compras'] = pd.to_numeric(df['numero_compras'], errors='coerce')
df['gasto_total'] = pd.to_numeric(df['gasto_total'], errors='coerce')

# --- Análisis descriptivo ---
# Estadísticas generales
resumen_general = df.describe()

# Media y desviación del gasto por género
media_por_genero = df.groupby('genero')['gasto_total'].mean()
desviacion_por_genero = df.groupby('genero')['gasto_total'].std()

# Correlaciones entre variables numéricas
correlacion = df[['edad', 'numero_compras', 'gasto_total']].corr()

# Medias generales
edad_media = df['edad'].mean()
gasto_medio = df['gasto_total'].mean()

# --- Clasificación de clientes por nivel de gasto ---
# 1 = alto gasto, 0 = bajo gasto
df['categoria_gasto'] = df['gasto_total'].apply(lambda x: 1 if x > gasto_medio else 0)

# Variables predictoras y objetivo
X_clf = df[['edad', 'numero_compras']]
y_clf = df['categoria_gasto']

# Escalado
scaler = StandardScaler()
X_clf_scaled = scaler.fit_transform(X_clf)

# División entrenamiento/prueba
X_train, X_test, y_train, y_test = train_test_split(X_clf_scaled, y_clf, test_size=0.2, random_state=42)

# Entrenamiento del modelo de clasificación
clf = LogisticRegression()
if len(df) > 2: # No hacer análisis si menos de dos
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
else:
    acc, cm = np.nan, np.nan

# --- Predicción del gasto de un cliente medio ---
X_reg = df[['edad', 'numero_compras']]
y_reg = df['gasto_total']

modelo_reg = LinearRegression()
if len(df) > 2 and not y_reg.isna().all():
    modelo_reg.fit(X_reg, y_reg)
    # Cliente medio: promedio de edad y número de compras
    cliente_medio = df[['edad', 'numero_compras']].mean().values.reshape(1, -1)
    pred_gasto_medio = modelo_reg.predict(cliente_medio)[0]
else:
    pred_gasto_medio = np.nan

# DF con todos los resultados
analisis = {
    'total_clientes': [len(df)],
    'edad_media': [edad_media],
    'edad_desviacion': [df['edad'].std()],
    'gasto_medio': [gasto_medio],
    'gasto_desviacion': [df['gasto_total'].std()],
    'prediccion_gasto_cliente_medio': [pred_gasto_medio],
    'accuracy_clasificacion': [acc]
}

df_analisis = pd.DataFrame(analisis)

# Exportar CSVs
df_analisis.to_csv('analisis_total.csv', index=False)
resumen_general.to_csv('analisis_detallado.csv')
correlacion.to_csv('analisis_correlaciones.csv')
df.to_csv('clientes_datos.csv', index=False)

print("Archivos generados:")
print("- analisis_total.csv (resumen general de todo lo que hemos hecho)")
print("- analisis_detallado.csv (estadísticas descriptivas)")
print("- analisis_correlaciones.csv (correlaciones entre variables)")
print("- clientes_datos.csv (datos originales con etiquetas)")
print()
print(f"Media de gasto por género:\n{media_por_genero}")
print(f"\nDesviación del gasto por género:\n{desviacion_por_genero}")
print(f"\nCorrelaciones:\n{correlacion}")
print(f"\nMatriz de confusión (clasificación):\n{cm}")