const DB_NAME = 'DivisorGastosDB'
const DB_VERSION = 1

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (e) => {
            const db = e.target.result

            if (!db.objectStoreNames.contains('salidas')) {
                db.createObjectStore('salidas', { keyPath: 'id', autoIncrement: true })
            }

            if (!db.objectStoreNames.contains('personas')) {
                const storePersonas = db.createObjectStore('personas', { keyPath: 'id', autoIncrement: true })
                storePersonas.createIndex('por_salida', 'salidaId', { unique: false })
            }

            if (!db.objectStoreNames.contains('gastos')) {
                const storeGastos = db.createObjectStore('gastos', { keyPath: 'id', autoIncrement: true })
                storeGastos.createIndex('por_salida', 'salidaId', { unique: false })
            }
        }

        request.onsuccess = (e) => resolve(e.target.result)
        request.onerror = (e) => reject(e.target.error)
    })
}

abrirDB()

async function guardarSalida(salida) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('salidas', 'readwrite')
        const store = tx.objectStore('salidas')
        const request = store.add(salida)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function obtenerSalidas() {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('salidas', 'readonly')
        const store = tx.objectStore('salidas')
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function guardarPersona(persona) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('personas', 'readwrite')
        const store = tx.objectStore('personas')
        const request = store.add(persona)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function obtenerPersonasPorSalida(salidaId) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('personas', 'readonly')
        const store = tx.objectStore('personas')
        const index = store.index('por_salida')
        const request = index.getAll(salidaId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function guardarGasto(gasto) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('gastos', 'readwrite')
        const store = tx.objectStore('gastos')
        const request = store.add(gasto)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function obtenerGastosPorSalida(salidaId) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('gastos', 'readonly')
        const store = tx.objectStore('gastos')
        const index = store.index('por_salida')
        const request = index.getAll(salidaId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function eliminarGasto(id) {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('gastos', 'readwrite')
        const store = tx.objectStore('gastos')
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

export {
    guardarSalida,
    obtenerSalidas,
    guardarPersona,
    obtenerPersonasPorSalida,
    guardarGasto,
    obtenerGastosPorSalida,
    eliminarGasto
}