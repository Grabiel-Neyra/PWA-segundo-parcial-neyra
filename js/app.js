import { guardarSalida, obtenerSalidas, guardarPersona, obtenerPersonasPorSalida, guardarGasto, obtenerGastosPorSalida, eliminarGasto } from './storage.js'
import { obtenerUbicacion } from './api.js'



let salidaActivaId = null


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            console.log('SW registrado con exito')
        })
        .catch(error => {
            console.error('Error al registrar el SW', error)
        })
}

const punto = document.querySelector('.punto')
const textoConexion = document.querySelector('#textoConexion')

if (!navigator.onLine) {
    punto.classList.add('offline');
    textoConexion.textContent = 'Offline'
}

window.addEventListener('offline', () => {
    punto.classList.add('offline')
    textoConexion.textContent = 'Offline'
})


window.addEventListener('online', () => {
    punto.classList.remove('offline')
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

        // Si toca "Resumen" actualizamos los datos
        if (btn.dataset.vista === 'vista-resumen') {
            await renderizarResumenGeneral()
        }
    })
})
// Botón "Nueva Salida" → va a la vista de crear
document.querySelector('#btnNuevaSalida').addEventListener('click', () => {
    mostrarVista('#vista-crearsalidas')
})

// Botón "Volver" desde crear salida → vuelve a la lista
document.querySelector('#btnVolverDesdeCrear').addEventListener('click', () => {
    mostrarVista('#vista-salidas')
})

// Botón "Volver" desde admin salida → vuelve a la lista
document.querySelector('#btnVolverDesdeAdmin').addEventListener('click', () => {
    mostrarVista('#vista-salidas')
})

// Botón "Dividir" → va al resumen de deudas
document.querySelector('#btnDividir').addEventListener('click', async () => {
    await renderizarResumenDeudas()
    mostrarVista('#vista-dividirgastos')
})

// Botón "Volver" desde dividir → vuelve al admin de la salida
document.querySelector('#btnVolverDesdeDividir').addEventListener('click', () => {
    mostrarVista('#vista-adminsalida')
})

let personasNuevas = []

// Botón "+" para agregar personas al array temporal
document.querySelector('#btnAgregarPersona').addEventListener('click', () => {
    const input = document.querySelector('#personas')
    const nombre = input.value.trim()

    // trim() saca los espacios en blanco al principio y al final
    if (nombre === '') return  // si está vacío no hace nada

    personasNuevas.push(nombre)
    input.value = ''  // limpia el input

    // Mostramos los nombres agregados como chips
    renderizarPersonasNuevas()
})


document.querySelector('#btnUsarUbicacion').addEventListener('click', async () => {
    console.log('click en ubicacion')
    const btn = document.querySelector('#btnUsarUbicacion')
    btn.textContent = 'Obteniendo ubicación...'
    btn.disabled = true

    try {
        const ubicacion = await obtenerUbicacion()
        document.querySelector('#ubicacion').value = `${ubicacion.lat}, ${ubicacion.lng}`
    } catch (error) {
        alert(error)
    } finally {
        btn.textContent = 'Usar mi ubicación actual'
        btn.disabled = false
    }
})

// Muestra los nombres en el div de chips
function renderizarPersonasNuevas() {
    const contenedor = document.querySelector('#listaPersonasNuevas')
    contenedor.innerHTML = ''  // limpia lo que había

    personasNuevas.forEach((nombre, index) => {
        const chip = document.createElement('span')
        chip.textContent = nombre + ' ✕'
        chip.addEventListener('click', () => {
            // Al tocar el chip lo eliminamos del array
            personasNuevas.splice(index, 1)
            renderizarPersonasNuevas()
        })
        contenedor.appendChild(chip)
    })
}

// Submit del formulario de crear salida
document.querySelector('#formSalida').addEventListener('submit', async (e) => {
    e.preventDefault()  // evita que la página se recargue

    const nombre = document.querySelector('#nombre-salida').value.trim()
    const fecha = document.querySelector('#fecha-salida').value
    const ubicacion = document.querySelector('#ubicacion').value.trim()

    if (nombre === '' || fecha === '' || personasNuevas.length === 0) {
        alert('Completá el nombre, la fecha y agregá al menos una persona')
        return
    }

    // Guardamos la salida en IndexedDB
    const salidaId = await guardarSalida({ nombre, fecha, ubicacion })

    // Guardamos cada persona asociada a esa salida
    for (const nombrePersona of personasNuevas) {
        await guardarPersona({ salidaId, nombre: nombrePersona })
    }

    // Limpiamos el form y el array
    personasNuevas = []
    document.querySelector('#formSalida').reset()
    renderizarPersonasNuevas()

    // Volvemos a la lista y la actualizamos
    mostrarVista('#vista-salidas')
    await renderizarSalidas()
})

async function renderizarSalidas() {
    const salidas = await obtenerSalidas()
    const contenedor = document.querySelector('#listaSalidas')
    contenedor.innerHTML = ''

    if (salidas.length === 0) {
        contenedor.innerHTML = '<p>No hay salidas todavía</p>'
        return
    }

    salidas.forEach(salida => {
        const card = document.createElement('div')
        card.classList.add('card-salida')
        card.innerHTML = `
            <div class="card-salida-top">
        <h3>${salida.nombre}</h3>
    </div>
    <div class="card-salida-meta">
        <span class="fecha"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>${salida.fecha}</span>
        <span>${salida.ubicacion || 'Sin ubicación'}</span>
        <span>${salida.total}</sapn>
    </div>
        `
        // Al tocar una card abrimos el detalle de esa salida
        card.addEventListener('click', () => {
            abrirDetalleSalida(salida)
        })
        contenedor.appendChild(card)
    })
}

// Llamamos a renderizarSalidas al cargar la página
renderizarSalidas()

async function abrirDetalleSalida(salida) {
    // Guardamos el id de la salida activa para usarlo después
    salidaActivaId = salida.id

    // Llenamos los datos de la vista de admin
    document.querySelector('#adminNombreSalida').textContent = salida.nombre
    document.querySelector('#adminFecha').textContent = salida.fecha
    document.querySelector('#adminUbicacion').textContent = salida.ubicacion || 'Sin ubicación'

    // Cargamos los participantes
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


document.querySelector('#btnAgregarGasto').addEventListener('click', async () => {
    // Cargamos las personas de la salida activa en el select y checkboxes
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    // Llenamos el select de "¿quién pagó?"
    const select = document.querySelector('#select-pagador')
    select.innerHTML = ''
    personas.forEach(persona => {
        const option = document.createElement('option')
        option.value = persona.id
        option.textContent = persona.nombre
        select.appendChild(option)
    })

    // Llenamos los checkboxes de participantes (todos marcados por defecto)
    const checkboxes = document.querySelector('#checkboxes-participantes')
    checkboxes.innerHTML = ''
    personas.forEach(persona => {
        const label = document.createElement('label')
        label.innerHTML = `
            <input type="checkbox" value="${persona.id}" checked>
            ${persona.nombre}
        `
        checkboxes.appendChild(label)
    })

    document.querySelector('#modalGasto').classList.remove('hiden')
})

// Cerrar modal
document.querySelector('#btnCerrarModal').addEventListener('click', () => {
    document.querySelector('#modalGasto').classList.add('hiden')
})

// Guardar gasto
document.querySelector('#formGasto').addEventListener('submit', async (e) => {
    e.preventDefault()

    const descripcion = document.querySelector('#descripcion-gasto').value.trim()
    const monto = parseFloat(document.querySelector('#monto-gasto').value)
    const pagadoPor = parseInt(document.querySelector('#select-pagador').value)

    // Agarramos los ids de los checkboxes marcados
    const checkboxes = document.querySelectorAll('#checkboxes-participantes input:checked')
    const participantes = Array.from(checkboxes).map(cb => parseInt(cb.value))

    if (descripcion === '' || isNaN(monto) || participantes.length === 0) {
        alert('Completá todos los campos')
        return
    }

    await guardarGasto({
        salidaId: salidaActivaId,
        descripcion,
        monto,
        pagadoPor,
        participantes
    })

    // Cerramos el modal y actualizamos la lista de gastos
    document.querySelector('#modalGasto').classList.add('hiden')
    document.querySelector('#formGasto').reset()
    await renderizarGastos()
})

async function renderizarGastos() {
    const gastos = await obtenerGastosPorSalida(salidaActivaId)
    const contenedor = document.querySelector('#listaGastosAdmin')
    const cantidadSpan = document.querySelector('#cantidadGastos')

    cantidadSpan.textContent = gastos.length

    // Limpiamos todo menos el párrafo del título
    contenedor.innerHTML = `<p>Gastos(<span id="cantidadGastos">${gastos.length}</span>)</p>`

    if (gastos.length === 0) {
        contenedor.innerHTML += '<p>No hay gastos todavía</p>'
        return
    }

    // Necesitamos las personas para mostrar el nombre de quién pagó
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    gastos.forEach(gasto => {
        // Buscamos el nombre de quien pagó
        const pagador = personas.find(p => p.id === gasto.pagadoPor)

        const card = document.createElement('div')
        card.classList.add('card-gasto')
        card.innerHTML = `
            <div>
                <h4>${gasto.descripcion}</h4>
                <span>$${gasto.monto}</span>
            </div>
            <p>Pagó: ${pagador ? pagador.nombre : 'Desconocido'}</p>
            <p>Dividido entre ${gasto.participantes.length} persona/s</p>
            <button class="btn-eliminar" data-id="${gasto.id}">Eliminar</button>
        `
        contenedor.appendChild(card)
    })

    // Botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async () => {
            await eliminarGasto(parseInt(btn.dataset.id))
            await renderizarGastos()
        })
    })

    // Actualizamos el total gastado
    const total = gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
    document.querySelector('#adminTotalGastado').textContent = '$' + total
}

async function calcularDeudas() {
    const gastos = await obtenerGastosPorSalida(salidaActivaId)
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    // Creamos un objeto donde guardamos cuánto pagó y cuánto le corresponde a cada persona
    // Ejemplo: { 1: { nombre: 'Ana', balance: 500 }, 2: { nombre: 'Juan', balance: -250 } }
    const balances = {}
    personas.forEach(persona => {
        balances[persona.id] = { nombre: persona.nombre, balance: 0 }
    })

    // Recorremos cada gasto
    gastos.forEach(gasto => {
        const partePorPersona = gasto.monto / gasto.participantes.length

        // El que pagó suma el monto completo (le deben eso)
        balances[gasto.pagadoPor].balance += gasto.monto

        // Cada participante resta su parte (debe eso)
        gasto.participantes.forEach(participanteId => {
            balances[participanteId].balance -= partePorPersona
        })
    })

    return balances
}

async function renderizarResumenDeudas() {
    const balances = await calcularDeudas()
    const personas = await obtenerPersonasPorSalida(salidaActivaId)

    // ---- Saldos por persona ----
    const contenedorSaldos = document.querySelector('#saldosPorPersona')
    contenedorSaldos.innerHTML = '<p>Saldos por persona</p>'

    Object.values(balances).forEach(persona => {
        const div = document.createElement('div')
        const balance = persona.balance.toFixed(2)

        if (persona.balance > 0) {
            div.innerHTML = `<p>${persona.nombre}: <span style="color:green">le deben $${balance}</span></p>`
        } else if (persona.balance < 0) {
            div.innerHTML = `<p>${persona.nombre}: <span style="color:red">debe $${Math.abs(balance)}</span></p>`
        } else {
            div.innerHTML = `<p>${persona.nombre}: <span>está al día</span></p>`
        }

        contenedorSaldos.appendChild(div)
    })

    // ---- Transacciones sugeridas ----
    // Separamos deudores (balance negativo) y acreedores (balance positivo)
    const deudores = Object.values(balances).filter(p => p.balance < 0)
    const acreedores = Object.values(balances).filter(p => p.balance > 0)

    const contenedorDeudas = document.querySelector('#listaDeudas')
    contenedorDeudas.innerHTML = '<p>Quiénes tienen que pagar</p>'

    deudores.forEach(deudor => {
        let deudaRestante = Math.abs(deudor.balance)

        acreedores.forEach(acreedor => {
            if (deudaRestante <= 0 || acreedor.balance <= 0) return

            const monto = Math.min(deudaRestante, acreedor.balance)
            deudaRestante -= monto
            acreedor.balance -= monto

            const p = document.createElement('p')
            p.textContent = `${deudor.nombre} le debe $${monto.toFixed(2)} a ${acreedor.nombre}`
            contenedorDeudas.appendChild(p)
        })
    })
}

async function renderizarResumenGeneral() {
    const salidas = await obtenerSalidas()

    // Total de salidas
    document.querySelector('#resumenTotalSalidas').textContent = salidas.length

    // Para cada salida calculamos el total gastado
    let totalGeneral = 0
    const contenedor = document.querySelector('#resumenListaSalidas')
    contenedor.innerHTML = '<p>Resumen de salidas</p>'

    for (const salida of salidas) {
        const gastos = await obtenerGastosPorSalida(salida.id)
        const totalSalida = gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
        totalGeneral += totalSalida

        const div = document.createElement('div')
        div.classList.add('card-salida')
        div.innerHTML = `
            <h3>${salida.nombre}</h3>
            <p>${salida.fecha}</p>
            <p>${salida.ubicacion || 'Sin ubicación'}</p>
            <p>Total: $${totalSalida}</p>
        `
        contenedor.appendChild(div)
    }

    document.querySelector('#resumenTotalGastado').textContent = '$' + totalGeneral
}

document.querySelector('#btnEscucharResumen').addEventListener('click', async () => {
    const balances = await calcularDeudas()
    const deudores = Object.values(balances).filter(p => p.balance < 0)
    const acreedores = Object.values(balances).filter(p => p.balance > 0)

    // Armamos el texto a leer
    let texto = 'Resumen de deudas. '

    if (deudores.length === 0) {
        texto += 'no hay deudas.'
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

    // Usamos la API de Speech Synthesis igual que el profe
    const mensaje = new SpeechSynthesisUtterance(texto)
    mensaje.lang = 'es-AR'
    mensaje.rate = 0.9
    mensaje.pitch = 1
    mensaje.volume = 1
    speechSynthesis.speak(mensaje)
})