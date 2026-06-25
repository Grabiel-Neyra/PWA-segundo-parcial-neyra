import { guardarSalida, obtenerSalidas, guardarPersona, obtenerPersonasPorSalida, guardarGasto, obtenerGastosPorSalida, eliminarGasto } from './storage.js'
import { obtenerUbicacion } from './api.js'


let salidaActivaId = null
let personasNuevas = []


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('SW registrado con exito'))
        .catch(error => console.error('Error al registrar el SW', error))
}

const contenedorEstado = document.querySelector('.estado-conexion')
const punto = document.querySelector('.punto')
const textoConexion = document.querySelector('#textoConexion')

if (!navigator.onLine) {
    contenedorEstado.classList.add('offline-contenedor')
    punto.classList.add('offline')
    textoConexion.classList.add('offline-p')
    textoConexion.textContent = 'Offline'
}

window.addEventListener('offline', () => {
    contenedorEstado.classList.add('offline-contenedor')
    punto.classList.add('offline')
    textoConexion.classList.add('offline-p')
    textoConexion.textContent = 'Offline'
})

window.addEventListener('online', () => {
    contenedorEstado.classList.remove('offline-contenedor')
    punto.classList.remove('offline')
    textoConexion.classList.remove('offline-p')
    textoConexion.textContent = 'Online'
})


const vistas = document.querySelectorAll('section')

function mostrarVista(idVista) {
    vistas.forEach(vista => vista.classList.add('hiden'))
    document.querySelector(idVista).classList.remove('hiden')
}


document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('activo'))
        btn.classList.add('activo')
        mostrarVista('#' + btn.dataset.vista)

        if (btn.dataset.vista === 'vista-resumen') {
            await renderizarResumenGeneral()
        }
    })
})


document.querySelector('#btnNuevaSalida').addEventListener('click', () => mostrarVista('#vista-crearsalidas'))
document.querySelector('#btnVolverDesdeCrear').addEventListener('click', () => mostrarVista('#vista-salidas'))
document.querySelector('#btnVolverDesdeAdmin').addEventListener('click', () => mostrarVista('#vista-salidas'))
document.querySelector('#btnVolverDesdeDividir').addEventListener('click', () => mostrarVista('#vista-adminsalida'))

document.querySelector('#btnDividir').addEventListener('click', async () => {
    await renderizarResumenDeudas()
    mostrarVista('#vista-dividirgastos')
})

function crearCardSalida(salida, total) {
    const card = document.createElement('div')
    card.classList.add('card-salida')

    card.innerHTML = `
        <div class="card-salida-top">
            <h3>${salida.nombre}</h3>
            <span class="card-total">
                $${total.toLocaleString('es-AR')}
            </span>
        </div>

        <div class="card-salida-meta">
            <span class="fecha">
                ${salida.fecha}
            </span>

            <span>
                ${salida.ubicacion || 'Sin ubicación'}
            </span>
        </div>
    `

    return card
}


async function renderizarSalidas() {
    const salidas = await obtenerSalidas()
    const contenedor = document.querySelector('#listaSalidas')
    contenedor.innerHTML = ''

    if (salidas.length === 0) {
        contenedor.innerHTML = '<p>No hay salidas todavia</p>'
        return
    }

    for (const salida of salidas) {
        // Calculamos el total de gastos de esta salida
        const gastos = await obtenerGastosPorSalida(salida.id)
        const total = gastos.reduce((acc, g) => acc + g.monto, 0)

        const card = crearCardSalida(salida, total)
        contenedor.appendChild(card)
        card.addEventListener('click', () => abrirDetalleSalida(salida))
    }
}

renderizarSalidas()


document.querySelector('#btnAgregarPersona').addEventListener('click', () => {
    const input = document.querySelector('#personas')
    const nombre = input.value.trim()
    if (nombre === '') return
    personasNuevas.push(nombre)
    input.value = ''
    renderizarPersonasNuevas()
})


function renderizarPersonasNuevas() {
    const contenedor = document.querySelector('#listaPersonasNuevas')
    contenedor.innerHTML = ''
    personasNuevas.forEach((nombre, index) => {
        const chip = document.createElement('span')
        chip.textContent = nombre + ' x'
        chip.addEventListener('click', () => {
            personasNuevas.splice(index, 1)
            renderizarPersonasNuevas()
        })
        contenedor.appendChild(chip)
    })
}


document.querySelector('#btnUsarUbicacion').addEventListener('click', async () => {
    const btn = document.querySelector('#btnUsarUbicacion')
    btn.disabled = true

    try {
        const ubicacion = await obtenerUbicacion()
        document.querySelector('#ubicacion').value = `${ubicacion.lat}, ${ubicacion.lng}`
    } catch (error) {
        alert(error)
    } finally {
        btn.disabled = false
    }
})


document.querySelector('#formSalida').addEventListener('submit', async (e) => {
    e.preventDefault()

    const nombre = document.querySelector('#nombre-salida').value.trim()
    const fecha = document.querySelector('#fecha-salida').value
    const ubicacion = document.querySelector('#ubicacion').value.trim()

    if (nombre === '' || fecha === '' || personasNuevas.length === 0) {
        alert('Completa el nombre, la fecha y agrega al menos una persona')
        return
    }

    const salidaId = await guardarSalida({ nombre, fecha, ubicacion })

    for (const nombrePersona of personasNuevas) {
        await guardarPersona({ salidaId, nombre: nombrePersona })
    }

    personasNuevas = []
    document.querySelector('#formSalida').reset()
    renderizarPersonasNuevas()

    mostrarVista('#vista-salidas')
    await renderizarSalidas()
})



async function abrirDetalleSalida(salida) {
    salidaActivaId = salida.id

    document.querySelector('#adminNombreSalida').textContent = salida.nombre
    document.querySelector('#adminFecha').textContent = salida.fecha
    document.querySelector('#adminUbicacion').textContent = salida.ubicacion || 'Sin ubicacion'

    const personas = await obtenerPersonasPorSalida(salida.id)
    const contenedor = document.querySelector('#adminParticipantes')
    contenedor.innerHTML = ''
    personas.forEach(persona => {
        const chip = document.createElement('span')
        chip.textContent = persona.nombre
        contenedor.appendChild(chip)
    })

    await renderizarGastos()
    mostrarVista('#vista-adminsalida')
}

async function renderizarGastos() {
    const gastos = await obtenerGastosPorSalida(salidaActivaId)
    const contenedor = document.querySelector('#listaGastosAdmin')
    const cantidadSpan = document.querySelector('#cantidadGastos')

    cantidadSpan.textContent = gastos.length
    console.log(document.querySelector('#cantidadGastos'))
    contenedor.innerHTML = ''
    console.log(document.querySelector('#cantidadGastos'))

    if (gastos.length === 0) {
        contenedor.innerHTML = '<p>No hay gastos todavia</p>'
        return
    }

    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    gastos.forEach(gasto => {
        const pagador = personas.find(p => p.id === gasto.pagadoPor)
        const card = document.createElement('div')
        card.classList.add('card-gasto')
        card.innerHTML = `
            <div class="card-gasto-info">
                <div class="card-gasto-top">
                    <div>
                        <h4>${gasto.descripcion}</h4>
                        <p>Pago: ${pagador ? pagador.nombre : 'Desconocido'}</p>
                    </div>
                    <span class="card-gasto-monto">$${gasto.monto}</span>
                </div>
                <div class="card-gasto-meta">
                    Dividido entre ${gasto.participantes.length} persona/s
                </div>
                <button class="btn-eliminar" data-id="${gasto.id}">Eliminar</button>
            </div>
        `
        contenedor.appendChild(card)
    })

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async () => {
            await eliminarGasto(parseInt(btn.dataset.id))
            await renderizarGastos()
        })
    })

    const total = gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
    document.querySelector('#adminTotalGastado').textContent = '$' + total
}



document.querySelector('#btnAgregarGasto').addEventListener('click', async () => {
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    const select = document.querySelector('#select-pagador')
    select.innerHTML = ''
    personas.forEach(persona => {
        const option = document.createElement('option')
        option.value = persona.id
        option.textContent = persona.nombre
        select.appendChild(option)
    })

    const checkboxes = document.querySelector('#checkboxes-participantes')
    checkboxes.innerHTML = ''
    personas.forEach(persona => {
        const label = document.createElement('label')
        label.innerHTML = `<input type="checkbox" value="${persona.id}" checked> ${persona.nombre}`
        checkboxes.appendChild(label)
    })

    document.querySelector('#modalGasto').classList.remove('hiden')
})


document.querySelector('#btnCerrarModal').addEventListener('click', () => {
    document.querySelector('#modalGasto').classList.add('hiden')
})

document.querySelector('#formGasto').addEventListener('submit', async (e) => {
    e.preventDefault()

    const descripcion = document.querySelector('#descripcion-gasto').value.trim()
    const monto = parseFloat(document.querySelector('#monto-gasto').value)
    const pagadoPor = parseInt(document.querySelector('#select-pagador').value)
    const checkboxes = document.querySelectorAll('#checkboxes-participantes input:checked')
    const participantes = Array.from(checkboxes).map(cb => parseInt(cb.value))

    if (descripcion === '' || isNaN(monto) || participantes.length === 0) {
        alert('Completa todos los campos')
        return
    }

    await guardarGasto({ salidaId: salidaActivaId, descripcion, monto, pagadoPor, participantes })

    document.querySelector('#modalGasto').classList.add('hiden')
    document.querySelector('#formGasto').reset()
    await renderizarGastos()
})



async function calcularDeudas() {
    const gastos = await obtenerGastosPorSalida(salidaActivaId)
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    const balances = {}
    personas.forEach(persona => {
        balances[persona.id] = { nombre: persona.nombre, balance: 0 }
    })

    gastos.forEach(gasto => {
        const partePorPersona = gasto.monto / gasto.participantes.length
        balances[gasto.pagadoPor].balance += gasto.monto
        gasto.participantes.forEach(id => {
            balances[id].balance -= partePorPersona
        })
    })

    return balances
}

async function renderizarResumenDeudas() {
    const balances = await calcularDeudas()

    const contenedorSaldos = document.querySelector('#saldosPorPersona')
    contenedorSaldos.innerHTML = ''

    Object.values(balances).forEach(persona => {
        const div = document.createElement('div')
        const balance = persona.balance.toFixed(2)

        if (persona.balance > 0) {
            div.classList.add('saldo-card', 'positivo')
            div.innerHTML = `
                <div class="saldo-card-info">
                    <h4>${persona.nombre}</h4>
                    <span class="saldo-estado positivo">le deben</span>
                </div>
                <span class="saldo-monto positivo">$${balance}</span>
            `
        } else if (persona.balance < 0) {
            div.classList.add('saldo-card', 'negativo')
            div.innerHTML = `
                <div class="saldo-card-info">
                    <h4>${persona.nombre}</h4>
                    <span class="saldo-estado negativo">debe</span>
                </div>
                <span class="saldo-monto negativo">$${Math.abs(balance)}</span>
            `
        } else {
            div.classList.add('saldo-card')
            div.innerHTML = `
                <div class="saldo-card-info">
                    <h4>${persona.nombre}</h4>
                    <span class="saldo-estado">esta al dia</span>
                </div>
                <span class="saldo-monto">$0</span>
            `
        }
        contenedorSaldos.appendChild(div)
    })

    const deudores = Object.values(balances).filter(p => p.balance < 0)
    const acreedores = Object.values(balances).filter(p => p.balance > 0)
    const contenedorDeudas = document.querySelector('#listaDeudas')
    contenedorDeudas.innerHTML = ''

    deudores.forEach(deudor => {
        let deudaRestante = Math.abs(deudor.balance)
        acreedores.forEach(acreedor => {
            if (deudaRestante <= 0 || acreedor.balance <= 0) return
            const monto = Math.min(deudaRestante, acreedor.balance)
            deudaRestante -= monto
            acreedor.balance -= monto

            const item = document.createElement('div')
            item.classList.add('transaccion-item')
            item.innerHTML = `
                <div class="transaccion-texto">
                    <span class="nombre">${deudor.nombre}</span>
                    <span class="label"> le debe </span>
                    <span class="monto">$${monto.toFixed(2)}</span>
                    <span class="label"> a </span>
                    <span class="nombre">${acreedor.nombre}</span>
                </div>
            `
            contenedorDeudas.appendChild(item)
        })
    })
}

document.querySelector('#btnEscucharResumen').addEventListener('click', async () => {
    const balances = await calcularDeudas()
    const deudores = Object.values(balances).filter(p => p.balance < 0)
    const acreedores = Object.values(balances).filter(p => p.balance > 0)

    let texto = 'Resumen de deudas. '

    if (deudores.length === 0) {
        texto += 'No hay deudas, todos estan al dia.'
    } else {
        deudores.forEach(deudor => {
            let deudaRestante = Math.abs(deudor.balance)
            acreedores.forEach(acreedor => {
                if (deudaRestante <= 0 || acreedor.balance <= 0) return
                const monto = Math.min(deudaRestante, acreedor.balance)
                deudaRestante -= monto
                texto += `${deudor.nombre} le debe ${monto.toFixed(0)} pesos a ${acreedor.nombre}. `
            })
        })
    }

    const mensaje = new SpeechSynthesisUtterance(texto)
    mensaje.lang = 'es-AR'
    mensaje.rate = 0.9
    mensaje.pitch = 1
    mensaje.volume = 1
    speechSynthesis.speak(mensaje)
})



async function renderizarResumenGeneral() {
    const salidas = await obtenerSalidas()

    document.querySelector('#resumenTotalSalidas').textContent = salidas.length

    let totalGeneral = 0
    const contenedor = document.querySelector('#resumenListaSalidas')
    contenedor.innerHTML = ''

    for (const salida of salidas) {
        const gastos = await obtenerGastosPorSalida(salida.id)
        const total = gastos.reduce((acc, g) => acc + g.monto, 0)

        totalGeneral += total

        const card = crearCardSalida(salida, total)
        contenedor.appendChild(card)

        card.addEventListener('click', () => abrirDetalleSalida(salida))

        contenedor.appendChild(card)
    }

    document.querySelector('#resumenTotalGastado').textContent =
        '$' + totalGeneral.toLocaleString('es-AR')
}