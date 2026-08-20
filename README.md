# Presupuestos APU — v8

Aplicación web estática para estructurar y recalcular presupuestos por precio unitario.

## Cambio principal de v8

Los catálogos extensos ya no descargan un único `matrices.json` de 12–16 MB.

Las matrices de:

- Constructor
- Concursos
- Desarrollador
- Remodelador

se fragmentaron por partida y se cargan bajo demanda.

Ejemplo:

```text
data/
└── constructor/
    ├── meta.json
    ├── structure.json
    ├── matrix-manifest.json
    └── matrices/
        ├── 103.json
        ├── 104.json
        ├── 105.json
        └── ...
```

La aplicación descarga únicamente las partidas necesarias para los conceptos seleccionados.

## Ventajas

- Menor transferencia de datos en celular.
- Menor uso de memoria del navegador.
- Evita archivos grandes en la carga web del repositorio.
- Mantiene la aplicación compatible con GitHub Pages.
- No modifica la lógica de cálculo de la v7.

## Actualización en GitHub

Reemplaza:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `data/` completa

Elimina previamente la carpeta `data/` de la versión anterior para evitar que permanezcan archivos `matrices.json` obsoletos en los cuatro catálogos extensos.

## Nota

Los Excel originales no se publican. La base web contiene datos procesados en JSON.
