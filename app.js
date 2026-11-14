/* =========================================================
   REGISTRO DE USO DE IA
   Herramienta: Claude (Anthropic), asistente de IA.
   Fecha: 14/11/2026.
   Uso: la IA generó el código de index.html, styles.css y app.js
   a partir de los pedidos paso a paso del Práctico 3 (estructura,
   estilos, visor 3D, fichas con localStorage, formulario con
   validaciones, favoritos y vistas, exportar e importar).
   También generó los tres modelos 3D de la carpeta "modelos"
   (tiranosaurio, corazón y vasija), que son modelos propios
   simplificados con licencia CC0.
   Revisión: el código fue probado en el navegador y cada parte
   está comentada para poder explicarla.
   ========================================================= */


/* =========================================================
   1. CONSTANTES
   ========================================================= */

// Nombre de la "caja" de localStorage donde guardamos todo
const CLAVE_ALMACENAMIENTO = "web3d-datos";

// Lista de las secciones de la página (coinciden con los id del HTML)
const SECCIONES = ["seccion-animales", "seccion-cuerpo", "seccion-historia"];


/* =========================================================
   2. FICHAS INICIALES
   Se usan solo la primera vez (cuando localStorage está vacío).
   Los tres modelos son propios (generados para este proyecto),
   con licencia CC0. Si cambiás un modelo por uno descargado,
   actualizá autor, licencia y fuente en su ficha.
   ========================================================= */
const fichasIniciales = [
  {
    id: 1,
    seccionId: "seccion-animales",
    titulo: "Tiranosaurio rex",
    modelo: "modelos/tiranosaurio.glb",
    descripcion: "Dinosaurio carnívoro que vivió hace unos 68 a 66 millones de años, a fines del período Cretácico, en lo que hoy es América del Norte.",
    datosCuriosos: [
      "Podía medir unos 12 metros de largo.",
      "Sus brazos eran cortos, pero muy musculosos.",
      "Tenía una de las mordidas más fuertes de todos los animales terrestres conocidos."
    ],
    autorModelo: "Modelo propio (generado para este proyecto)",
    licencia: "CC0",
    fuente: ""
  },
  {
    id: 2,
    seccionId: "seccion-cuerpo",
    titulo: "Corazón humano",
    modelo: "modelos/corazon.glb",
    descripcion: "Órgano muscular que bombea la sangre por todo el cuerpo. Tiene cuatro cavidades: dos aurículas y dos ventrículos.",
    datosCuriosos: [
      "Tiene un tamaño parecido al de un puño cerrado.",
      "Late en promedio entre 60 y 100 veces por minuto en reposo.",
      "Late más de 100.000 veces por día."
    ],
    autorModelo: "Modelo propio (generado para este proyecto)",
    licencia: "CC0",
    fuente: ""
  },
  {
    id: 3,
    seccionId: "seccion-historia",
    titulo: "Vasija de cerámica antigua",
    modelo: "modelos/vasija.glb",
    descripcion: "Recipiente de barro cocido usado por pueblos antiguos para guardar agua, granos y otros alimentos.",
    datosCuriosos: [
      "La cerámica es una de las tecnologías más antiguas de la humanidad.",
      "Los dibujos de las vasijas ayudan a identificar qué pueblo las hizo.",
      "Muchas se reconstruyen uniendo fragmentos encontrados en excavaciones."
    ],
    autorModelo: "Modelo propio (generado para este proyecto)",
    licencia: "CC0",
    fuente: ""
  }
];


/* =========================================================
   3. GUARDAR Y CARGAR DATOS (localStorage)
   ========================================================= */

// Progreso del alumno: listas con los id de las fichas vistas y favoritas
function crearProgresoVacio() {
  return { vistas: [], favoritas: [] };
}

// Guarda fichas y progreso juntos, en un solo objeto.
// localStorage solo guarda texto, por eso usamos JSON.stringify.
function guardarDatos() {
  const datos = { fichas: fichas, progreso: progreso };
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(datos));
}

// Lee los datos guardados. Devuelve un objeto { fichas, progreso }.
// Si no hay nada (o está dañado), devuelve los datos iniciales.
function cargarDatos() {
  const datosIniciales = {
    fichas: structuredClone(fichasIniciales),
    progreso: crearProgresoVacio()
  };

  const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);

  // Primera vez: no hay nada guardado
  if (texto === null) {
    return datosIniciales;
  }

  // try/catch evita que la página se rompa si el texto guardado no es JSON válido
  try {
    const datos = JSON.parse(texto);
    if (Array.isArray(datos.fichas)) {
      // Limpieza: las primeras versiones guardaron créditos de ejemplo
      // (enlaces a "ejemplo.com" que no existen). Los reemplazamos por
      // los créditos reales de las fichas iniciales.
      datos.fichas.forEach(function (ficha) {
        if (typeof ficha.fuente === "string" && ficha.fuente.includes("ejemplo.com")) {
          const original = fichasIniciales.find(function (f) { return f.id === ficha.id; });
          ficha.fuente = "";
          if (original !== undefined) {
            ficha.autorModelo = original.autorModelo;
            ficha.licencia = original.licencia;
          }
        }
      });

      // Si los datos son de antes de que existiera el progreso, lo creamos vacío
      const progresoGuardado = datos.progreso || {};
      return {
        fichas: datos.fichas,
        progreso: {
          vistas: Array.isArray(progresoGuardado.vistas) ? progresoGuardado.vistas : [],
          favoritas: Array.isArray(progresoGuardado.favoritas) ? progresoGuardado.favoritas : []
        }
      };
    }
  } catch (error) {
    console.warn("Los datos guardados están dañados. Se cargan los datos iniciales.");
  }
  return datosIniciales;
}

// Cargamos todo al iniciar y lo guardamos (por si era la primera vez)
const datosCargados = cargarDatos();
let fichas = datosCargados.fichas;
let progreso = datosCargados.progreso;
guardarDatos();


/* =========================================================
   4. ÍNDICE ACTUAL DE CADA SECCIÓN
   Recuerda qué ficha se está mostrando en cada sección.
   ========================================================= */
const indiceActual = {
  "seccion-animales": 0,
  "seccion-cuerpo": 0,
  "seccion-historia": 0
};

// true cuando está tildado "Ver solo favoritas" en la portada
let soloFavoritas = false;


/* =========================================================
   5. FUNCIONES AUXILIARES
   ========================================================= */

// Devuelve solo las fichas de una sección
function obtenerFichasDeSeccion(seccionId) {
  return fichas.filter(function (ficha) {
    return ficha.seccionId === seccionId;
  });
}

// Devuelve las fichas que se pueden recorrer en la sección:
// todas, o solo las favoritas si el filtro está activo
function obtenerFichasVisibles(seccionId) {
  const fichasSeccion = obtenerFichasDeSeccion(seccionId);
  if (!soloFavoritas) {
    return fichasSeccion;
  }
  return fichasSeccion.filter(function (ficha) {
    return esFavorita(ficha.id);
  });
}

// Convierte "seccion-animales" en "animales" (para armar los id del HTML)
function obtenerSufijo(seccionId) {
  return seccionId.replace("seccion-", "");
}

// Busca el <model-viewer> de una sección. Si no existe, lo crea
// con los mismos atributos que el del tiranosaurio.
function obtenerVisor(sufijo) {
  let visor = document.getElementById("modelo-" + sufijo);

  if (visor === null) {
    visor = document.createElement("model-viewer");
    visor.id = "modelo-" + sufijo;
    visor.setAttribute("camera-controls", "");
    visor.setAttribute("auto-rotate", "");
    visor.setAttribute("touch-action", "pan-y");
    visor.setAttribute("camera-orbit", "0deg 75deg 105%");
    document.getElementById("visor-" + sufijo).appendChild(visor);
  }
  return visor;
}


// Limpia la ficha y el visor cuando no hay fichas para mostrar
function mostrarSeccionVacia(seccionId, sufijo) {
  const titulo = document.getElementById("titulo-" + sufijo);
  const descripcion = document.getElementById("descripcion-" + sufijo);

  // Distinguimos "no hay fichas" de "no hay favoritas"
  if (soloFavoritas && obtenerFichasDeSeccion(seccionId).length > 0) {
    titulo.textContent = "No tenés favoritas en esta sección";
    descripcion.textContent = "Desactivá el filtro en la portada o marcá alguna ficha con ⭐.";
  } else {
    titulo.textContent = "Todavía no hay fichas";
    descripcion.textContent = "Creá una desde el formulario de Administrar fichas.";
  }

  document.getElementById("curiosidades-" + sufijo).innerHTML = "";
  document.getElementById("creditos-" + sufijo).textContent = "";
  document.getElementById("vista-" + sufijo).hidden = true;
  document.getElementById("favorito-" + sufijo).hidden = true;

  const visor = document.getElementById("modelo-" + sufijo);
  if (visor !== null) {
    visor.removeAttribute("src"); // saca el modelo anterior
  }
}


// Si la página se abrió con doble clic (file://), el navegador no deja
// cargar archivos .glb. En ese caso usamos la copia embebida del modelo
// (modelos/modelos-embebidos.js), si existe. Con Live Server se usa el archivo.
function obtenerRutaModelo(ruta) {
  const hayCopias = typeof MODELOS_EMBEBIDOS !== "undefined";
  if (location.protocol === "file:" && hayCopias && MODELOS_EMBEBIDOS[ruta]) {
    return MODELOS_EMBEBIDOS[ruta];
  }
  return ruta;
}


/* =========================================================
   6. MOSTRAR UNA FICHA
   Cambia el modelo 3D y completa la ficha informativa.
   ========================================================= */
function mostrarFicha(seccionId, indice) {
  const fichasSeccion = obtenerFichasVisibles(seccionId);
  const sufijo = obtenerSufijo(seccionId);

  // Si no hay fichas para mostrar (o no hay favoritas con el filtro), lo avisamos
  if (fichasSeccion.length === 0) {
    mostrarSeccionVacia(seccionId, sufijo);
    return;
  }

  // Hace que el índice "dé la vuelta":
  // después de la última vuelve a la primera, y antes de la primera va a la última
  const total = fichasSeccion.length;
  const indiceCorregido = ((indice % total) + total) % total;
  indiceActual[seccionId] = indiceCorregido;

  const ficha = fichasSeccion[indiceCorregido];

  // --- Modelo 3D ---
  const visor = obtenerVisor(sufijo);
  // setAttribute funciona aunque la librería todavía no haya terminado de cargar
  visor.setAttribute("src", obtenerRutaModelo(ficha.modelo));
  visor.setAttribute("alt", "Modelo 3D: " + ficha.titulo);

  // --- Título y descripción ---
  // Usamos textContent (y no innerHTML) para que el texto no se interprete como código
  document.getElementById("titulo-" + sufijo).textContent = ficha.titulo;
  document.getElementById("descripcion-" + sufijo).textContent = ficha.descripcion;

  // --- Datos curiosos ---
  const lista = document.getElementById("curiosidades-" + sufijo);
  lista.innerHTML = ""; // vaciamos la lista anterior
  ficha.datosCuriosos.forEach(function (dato) {
    const elemento = document.createElement("li");
    elemento.textContent = dato;
    lista.appendChild(elemento);
  });

  // --- Créditos: autor, licencia y enlace a la fuente ---
  const creditos = document.getElementById("creditos-" + sufijo);
  creditos.textContent = "Modelo: " + ficha.autorModelo + " · Licencia: " + ficha.licencia;

  // El enlace a la fuente se agrega solo si la ficha tiene una
  if (ficha.fuente) {
    creditos.append(" · ");
    const enlace = document.createElement("a");
    enlace.href = ficha.fuente;
    enlace.textContent = "Ver fuente";
    enlace.target = "_blank";           // abre en una pestaña nueva
    enlace.rel = "noopener noreferrer"; // por seguridad al abrir otra pestaña
    creditos.appendChild(enlace);
  }

  // --- Vista y favorito ---
  // Solo se marca como vista si la sección está abierta (no oculta)
  if (!document.getElementById(seccionId).hidden) {
    marcarComoVista(ficha.id);
  }
  actualizarEstadoFicha(sufijo, ficha);
}


/* =========================================================
   6 b. PROGRESO: VISTAS Y FAVORITAS
   ========================================================= */

function estaVista(id) {
  return progreso.vistas.includes(id);
}

function esFavorita(id) {
  return progreso.favoritas.includes(id);
}

// Agrega la ficha a las vistas (si todavía no estaba) y guarda
function marcarComoVista(id) {
  if (!estaVista(id)) {
    progreso.vistas.push(id);
    guardarDatos();
    actualizarContadores();
  }
}

// Si era favorita la saca; si no, la agrega
function alternarFavorito(id) {
  if (esFavorita(id)) {
    progreso.favoritas = progreso.favoritas.filter(function (idFav) {
      return idFav !== id;
    });
  } else {
    progreso.favoritas.push(id);
  }
  guardarDatos();
  actualizarContadores();
}

// Muestra el "✓ Vista" y pinta el botón Favorito según el estado
function actualizarEstadoFicha(sufijo, ficha) {
  const indicadorVista = document.getElementById("vista-" + sufijo);
  const botonFavorito = document.getElementById("favorito-" + sufijo);
  const favorita = esFavorita(ficha.id);

  indicadorVista.hidden = !estaVista(ficha.id);

  botonFavorito.hidden = false;
  botonFavorito.dataset.id = ficha.id; // el botón "recuerda" de qué ficha es
  botonFavorito.setAttribute("aria-pressed", favorita ? "true" : "false");
  botonFavorito.textContent = favorita ? "⭐ En favoritos" : "⭐ Favorito";
}

// Escribe en cada tarjeta de la portada "X de Y vistas" y las favoritas
function actualizarContadores() {
  SECCIONES.forEach(function (seccionId) {
    const sufijo = obtenerSufijo(seccionId);
    const fichasSeccion = obtenerFichasDeSeccion(seccionId);

    const cantidadVistas = fichasSeccion.filter(function (f) { return estaVista(f.id); }).length;
    const cantidadFavoritas = fichasSeccion.filter(function (f) { return esFavorita(f.id); }).length;

    document.getElementById("progreso-" + sufijo).textContent =
      "✓ " + cantidadVistas + " de " + fichasSeccion.length + " vistas";
    document.getElementById("favoritas-" + sufijo).textContent =
      "⭐ " + cantidadFavoritas + (cantidadFavoritas === 1 ? " favorita" : " favoritas");
  });
}


/* =========================================================
   7. BOTONES ANTERIOR, SIGUIENTE Y FAVORITO
   ========================================================= */
SECCIONES.forEach(function (seccionId) {
  const sufijo = obtenerSufijo(seccionId);

  // Favorito: usa el id que mostrarFicha guardó en el botón
  document.getElementById("favorito-" + sufijo).addEventListener("click", function () {
    alternarFavorito(Number(this.dataset.id));
    // Volvemos a dibujar: si el filtro está activo y se quitó de favoritas, desaparece
    mostrarFicha(seccionId, indiceActual[seccionId]);
  });

  document.getElementById("anterior-" + sufijo).addEventListener("click", function () {
    mostrarFicha(seccionId, indiceActual[seccionId] - 1);
  });

  document.getElementById("siguiente-" + sufijo).addEventListener("click", function () {
    mostrarFicha(seccionId, indiceActual[seccionId] + 1);
  });

  // Mostramos la primera ficha de cada sección al cargar la página
  mostrarFicha(seccionId, 0);
});

// Escribimos los contadores de la portada al cargar
actualizarContadores();


/* =========================================================
   7 b. NAVEGACIÓN ENTRE PORTADA Y SECCIONES
   Hace falta para saber cuándo se "abre" una ficha.
   ========================================================= */
const portada = document.getElementById("portada");

// Oculta la portada y muestra solo la sección elegida
function abrirSeccion(seccionId) {
  portada.hidden = true;
  SECCIONES.forEach(function (id) {
    document.getElementById(id).hidden = (id !== seccionId);
  });
  // Ahora que la sección está visible, mostrarFicha la marca como vista
  mostrarFicha(seccionId, indiceActual[seccionId]);
  window.scrollTo(0, 0);
}

// Oculta las secciones y vuelve a mostrar la portada
function volverAPortada() {
  SECCIONES.forEach(function (id) {
    document.getElementById(id).hidden = true;
  });
  portada.hidden = false;
  actualizarContadores();
}

// Cada tarjeta abre la sección que indica su atributo data-seccion
document.querySelectorAll(".tarjeta").forEach(function (tarjeta) {
  tarjeta.addEventListener("click", function () {
    abrirSeccion(tarjeta.dataset.seccion);
  });
});

document.querySelectorAll(".boton-volver").forEach(function (boton) {
  boton.addEventListener("click", volverAPortada);
});

// Filtro "Ver solo favoritas"
document.getElementById("filtro-favoritas").addEventListener("change", function () {
  soloFavoritas = this.checked;
  // Al cambiar el filtro, cada sección arranca desde la primera ficha
  SECCIONES.forEach(function (id) {
    indiceActual[id] = 0;
    mostrarFicha(id, 0);
  });
});


/* =========================================================
   8. FORMULARIO: REFERENCIAS A LOS ELEMENTOS
   ========================================================= */

// Nombres "lindos" de cada sección, para mostrar en el listado
const NOMBRES_SECCIONES = {
  "seccion-animales": "🦁 Animales",
  "seccion-cuerpo": "🫀 Cuerpo humano",
  "seccion-historia": "🏛️ Historia"
};

const formulario = document.getElementById("formulario-ficha");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonCancelar = document.getElementById("boton-cancelar");
const mensajeExito = document.getElementById("mensaje-exito");
const listaFichas = document.getElementById("lista-fichas");

// Agrupamos los campos en un objeto. Las claves coinciden con los
// id de los errores: campos.titulo  ->  <p id="error-titulo">
const campos = {
  id: document.getElementById("campo-id"),
  seccion: document.getElementById("campo-seccion"),
  titulo: document.getElementById("campo-titulo"),
  modelo: document.getElementById("campo-modelo"),
  descripcion: document.getElementById("campo-descripcion"),
  curiosidades: document.getElementById("campo-curiosidades"),
  autor: document.getElementById("campo-autor"),
  licencia: document.getElementById("campo-licencia"),
  fuente: document.getElementById("campo-fuente")
};


/* =========================================================
   9. MOSTRAR Y LIMPIAR ERRORES
   ========================================================= */

// Escribe el mensaje debajo del campo y le pone borde rojo
function mostrarError(nombreCampo, mensaje) {
  document.getElementById("error-" + nombreCampo).textContent = mensaje;
  campos[nombreCampo].classList.add("campo-invalido");
}

// Borra todos los errores del formulario
function limpiarErrores() {
  formulario.querySelectorAll(".mensaje-error").forEach(function (parrafo) {
    parrafo.textContent = "";
  });
  formulario.querySelectorAll(".campo-invalido").forEach(function (campo) {
    campo.classList.remove("campo-invalido");
  });
}

// Cuando el usuario corrige un campo, se le borra su error
Object.keys(campos).forEach(function (nombreCampo) {
  campos[nombreCampo].addEventListener("input", function () {
    const parrafoError = document.getElementById("error-" + nombreCampo);
    if (parrafoError !== null) {
      parrafoError.textContent = "";
    }
    campos[nombreCampo].classList.remove("campo-invalido");
  });
});


/* =========================================================
   10. LEER Y VALIDAR EL FORMULARIO
   ========================================================= */

// Junta los valores del formulario en un objeto.
// trim() saca los espacios del principio y del final.
function leerFormulario() {
  return {
    seccionId: campos.seccion.value,
    titulo: campos.titulo.value.trim(),
    modelo: campos.modelo.value.trim(),
    descripcion: campos.descripcion.value.trim(),
    // Cada renglón es un dato curioso; descartamos los renglones vacíos
    datosCuriosos: campos.curiosidades.value
      .split("\n")
      .map(function (renglon) { return renglon.trim(); })
      .filter(function (renglon) { return renglon !== ""; }),
    autorModelo: campos.autor.value.trim(),
    licencia: campos.licencia.value,
    fuente: campos.fuente.value.trim()
  };
}

// Revisa todas las reglas. Devuelve true si no hay errores.
// idEditando sirve para no compararse con la propia ficha al editar.
function validarFicha(datos, idEditando) {
  let esValida = true;

  // Sección
  if (datos.seccionId === "") {
    mostrarError("seccion", "Elegí una sección.");
    esValida = false;
  }

  // Título: no vacío y sin repetir dentro de la misma sección
  if (datos.titulo === "") {
    mostrarError("titulo", "El título no puede estar vacío.");
    esValida = false;
  } else {
    const repetida = fichas.some(function (ficha) {
      return ficha.seccionId === datos.seccionId &&
             ficha.titulo.trim().toLowerCase() === datos.titulo.toLowerCase() &&
             ficha.id !== idEditando;
    });
    if (repetida) {
      mostrarError("titulo", "Ya existe una ficha con ese título en esta sección.");
      esValida = false;
    }
  }

  // Ruta del modelo: empieza con "modelos/" y termina en ".glb"
  const rutaMinuscula = datos.modelo.toLowerCase();
  if (datos.modelo === "") {
    mostrarError("modelo", "Escribí la ruta del modelo.");
    esValida = false;
  } else if (!datos.modelo.startsWith("modelos/")) {
    mostrarError("modelo", "La ruta tiene que empezar con modelos/ (ej.: modelos/leon.glb).");
    esValida = false;
  } else if (!rutaMinuscula.endsWith(".glb")) {
    mostrarError("modelo", "La ruta tiene que terminar en .glb.");
    esValida = false;
  } else if (datos.modelo === "modelos/.glb") {
    mostrarError("modelo", "Falta el nombre del archivo.");
    esValida = false;
  }

  // Descripción
  if (datos.descripcion === "") {
    mostrarError("descripcion", "La descripción no puede estar vacía.");
    esValida = false;
  }

  // Créditos: autor y licencia
  if (datos.autorModelo === "") {
    mostrarError("autor", "Completá el autor: es obligatorio en los créditos.");
    esValida = false;
  }
  if (datos.licencia === "") {
    mostrarError("licencia", "Elegí la licencia del modelo.");
    esValida = false;
  }

  return esValida;
}


/* =========================================================
   11. CREAR, EDITAR Y BORRAR
   ========================================================= */

// Calcula un id nuevo: el mayor que exista + 1
function obtenerNuevoId() {
  let mayor = 0;
  fichas.forEach(function (ficha) {
    if (ficha.id > mayor) {
      mayor = ficha.id;
    }
  });
  return mayor + 1;
}

// Vuelve a dibujar las tres secciones con los datos actuales
function actualizarSecciones() {
  SECCIONES.forEach(function (seccionId) {
    mostrarFicha(seccionId, indiceActual[seccionId]);
  });
  actualizarContadores(); // los totales pueden haber cambiado
}

// Deja el formulario vacío y en modo "Nueva ficha"
function reiniciarFormulario() {
  formulario.reset();
  campos.id.value = "";
  tituloFormulario.textContent = "Nueva ficha";
  botonCancelar.hidden = true;
  limpiarErrores();
}

// Copia los datos de una ficha al formulario para editarla
function cargarFichaEnFormulario(id) {
  const ficha = fichas.find(function (f) { return f.id === id; });
  if (ficha === undefined) {
    return;
  }

  limpiarErrores();
  mensajeExito.textContent = "";
  campos.id.value = ficha.id;
  campos.seccion.value = ficha.seccionId;
  campos.titulo.value = ficha.titulo;
  campos.modelo.value = ficha.modelo;
  campos.descripcion.value = ficha.descripcion;
  campos.curiosidades.value = ficha.datosCuriosos.join("\n"); // un dato por renglón
  campos.autor.value = ficha.autorModelo;
  campos.licencia.value = ficha.licencia;
  campos.fuente.value = ficha.fuente;

  tituloFormulario.textContent = "Editar ficha: " + ficha.titulo;
  botonCancelar.hidden = false;
  formulario.scrollIntoView({ behavior: "smooth" }); // lleva la pantalla al formulario
}

// Borra una ficha después de pedir confirmación
function borrarFicha(id) {
  const ficha = fichas.find(function (f) { return f.id === id; });
  if (ficha === undefined) {
    return;
  }

  // confirm() muestra un cuadro con Aceptar y Cancelar
  const confirmado = confirm('¿Seguro que querés borrar la ficha "' + ficha.titulo + '"? No se puede deshacer.');
  if (!confirmado) {
    return;
  }

  // Nos quedamos con todas las fichas menos la borrada
  fichas = fichas.filter(function (f) { return f.id !== id; });

  // También la sacamos del progreso (vistas y favoritas)
  progreso.vistas = progreso.vistas.filter(function (idVista) { return idVista !== id; });
  progreso.favoritas = progreso.favoritas.filter(function (idFav) { return idFav !== id; });

  // Si justo la estábamos editando, vaciamos el formulario
  if (campos.id.value !== "" && Number(campos.id.value) === id) {
    reiniciarFormulario();
  }

  guardarDatos();
  actualizarSecciones();
  dibujarListaFichas();
  mensajeExito.textContent = "🗑️ Ficha borrada.";
}

// Qué pasa al apretar "Guardar ficha"
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  limpiarErrores();
  mensajeExito.textContent = "";

  const datos = leerFormulario();
  const idEditando = campos.id.value === "" ? null : Number(campos.id.value);

  if (!validarFicha(datos, idEditando)) {
    // Llevamos el cursor al primer campo con error
    formulario.querySelector(".campo-invalido").focus();
    return;
  }

  if (idEditando === null) {
    // Crear: agregamos la ficha nueva al final del array
    datos.id = obtenerNuevoId();
    fichas.push(datos);
    mensajeExito.textContent = "✅ Ficha creada.";
  } else {
    // Editar: reemplazamos la ficha que tiene ese id
    const posicion = fichas.findIndex(function (f) { return f.id === idEditando; });
    datos.id = idEditando;
    fichas[posicion] = datos;
    mensajeExito.textContent = "✅ Cambios guardados.";
  }

  guardarDatos();
  actualizarSecciones();
  dibujarListaFichas();
  reiniciarFormulario();
});

// Botón "Cancelar edición"
botonCancelar.addEventListener("click", function () {
  reiniciarFormulario();
  mensajeExito.textContent = "";
});


/* =========================================================
   12. LISTADO DE FICHAS GUARDADAS
   ========================================================= */

// Dibuja una tarjeta por ficha, ordenadas por sección
function dibujarListaFichas() {
  listaFichas.innerHTML = "";

  if (fichas.length === 0) {
    const vacio = document.createElement("li");
    vacio.textContent = "Todavía no hay fichas guardadas.";
    listaFichas.appendChild(vacio);
    return;
  }

  SECCIONES.forEach(function (seccionId) {
    obtenerFichasDeSeccion(seccionId).forEach(function (ficha) {
      const elemento = document.createElement("li");

      const titulo = document.createElement("strong");
      titulo.textContent = ficha.titulo;

      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta-seccion";
      etiqueta.textContent = NOMBRES_SECCIONES[ficha.seccionId];

      // data-accion y data-id le dicen al clic qué hacer y con qué ficha
      const acciones = document.createElement("div");
      acciones.className = "acciones-ficha";
      acciones.innerHTML =
        '<button type="button" class="boton" data-accion="editar" data-id="' + ficha.id + '">✏️ Editar</button>' +
        '<button type="button" class="boton boton-peligro" data-accion="borrar" data-id="' + ficha.id + '">🗑️ Borrar</button>';

      elemento.append(titulo, etiqueta, acciones);
      listaFichas.appendChild(elemento);
    });
  });
}

// Un solo "escuchador" para todos los botones del listado
// (se llama delegación de eventos)
listaFichas.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (boton === null) {
    return; // el clic no fue en un botón
  }

  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "editar") {
    cargarFichaEnFormulario(id);
  } else if (boton.dataset.accion === "borrar") {
    borrarFicha(id);
  }
});

// Dibujamos el listado al cargar la página
dibujarListaFichas();


/* =========================================================
   13. EXPORTAR E IMPORTAR (archivo web3d.json)
   ========================================================= */
const botonExportar = document.getElementById("boton-exportar");
const botonImportar = document.getElementById("boton-importar");
const archivoImportar = document.getElementById("archivo-importar");
const mensajePie = document.getElementById("mensaje-pie");

// Muestra un mensaje en el pie: verde si salió bien, rojo si es un error
function mostrarMensajePie(texto, esError) {
  mensajePie.textContent = texto;
  mensajePie.classList.toggle("es-error", esError);
}

// ---------- EXPORTAR ----------
// Descarga el texto como archivo web3d.json (la forma de siempre)
function descargarJSON(texto) {
  // Un Blob es un "archivo en memoria" armado con nuestro texto
  const blob = new Blob([texto], { type: "application/json" });
  const url = URL.createObjectURL(blob); // dirección temporal hacia ese Blob

  // Enlace temporal: lo creamos, lo "clickeamos" y lo borramos
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "web3d.json"; // nombre del archivo que se descarga
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url); // liberamos la memoria
  mostrarMensajePie("📤 Se descargó web3d.json con " + fichas.length + " fichas.", false);
}

botonExportar.addEventListener("click", function () {
  const datos = { fichas: fichas, progreso: progreso };

  // null, 2 = con sangría de 2 espacios, para que se pueda leer
  const texto = JSON.stringify(datos, null, 2);

  // ¿Es un celular o tablet? (pantalla táctil como puntero principal)
  const esCelular = window.matchMedia("(pointer: coarse)").matches;

  // Armamos un archivo de verdad para poder compartirlo
  const archivo = new File([texto], "web3d.json", { type: "application/json" });

  // En celulares que permiten compartir archivos, abrimos el menú "Compartir"
  // (WhatsApp, correo, Drive...). Antes comprobamos con canShare que se pueda.
  if (esCelular && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({
      files: [archivo],
      title: "web3d.json",
      text: "Datos de Explorador 3D Educativo"
    })
      .then(function () {
        mostrarMensajePie("📤 Se compartió web3d.json con " + fichas.length + " fichas.", false);
      })
      .catch(function (error) {
        if (error.name === "AbortError") {
          // El usuario cerró el menú sin elegir nada
          mostrarMensajePie("Compartir cancelado.", false);
        } else {
          // Si compartir falla por otro motivo, lo descargamos como siempre
          descargarJSON(texto);
        }
      });
  } else {
    // En la compu (o si el celular no puede compartir): descarga normal
    descargarJSON(texto);
  }
});

// ---------- IMPORTAR ----------

// El botón Importar abre el selector de archivos (que está oculto)
botonImportar.addEventListener("click", function () {
  archivoImportar.value = ""; // permite elegir el mismo archivo dos veces seguidas
  archivoImportar.click();
});

// Revisa que los datos tengan la forma correcta.
// Devuelve "" si está todo bien, o un texto explicando el problema.
function validarDatosImportados(datos) {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    return "El archivo no tiene el formato de esta página.";
  }
  if (!Array.isArray(datos.fichas)) {
    return "Falta la lista de fichas.";
  }
  if (typeof datos.progreso !== "object" || datos.progreso === null ||
      !Array.isArray(datos.progreso.vistas) || !Array.isArray(datos.progreso.favoritas)) {
    return "Falta el progreso (las listas de vistas y favoritas).";
  }

  const idsVistos = [];
  for (let i = 0; i < datos.fichas.length; i++) {
    const ficha = datos.fichas[i];
    const numero = "La ficha n.º " + (i + 1);

    if (typeof ficha !== "object" || ficha === null) {
      return numero + " no es válida.";
    }
    if (typeof ficha.id !== "number" || idsVistos.includes(ficha.id)) {
      return numero + " no tiene un id válido o está repetido.";
    }
    idsVistos.push(ficha.id);

    if (!SECCIONES.includes(ficha.seccionId)) {
      return numero + " tiene una sección que no existe.";
    }
    // Estos campos tienen que ser texto
    const camposTexto = ["titulo", "modelo", "descripcion", "autorModelo", "licencia"];
    for (const campo of camposTexto) {
      if (typeof ficha[campo] !== "string") {
        return numero + " no tiene el campo \"" + campo + "\".";
      }
    }
    if (!Array.isArray(ficha.datosCuriosos)) {
      return numero + " no tiene la lista de datos curiosos.";
    }
  }
  return ""; // sin problemas
}

// Cuando se elige un archivo
archivoImportar.addEventListener("change", function () {
  const archivo = archivoImportar.files[0];
  if (archivo === undefined) {
    return; // se cerró el selector sin elegir nada
  }

  if (!archivo.name.toLowerCase().endsWith(".json")) {
    mostrarMensajePie("⚠️ El archivo tiene que ser .json.", true);
    return;
  }

  // FileReader lee el archivo de la compu como texto
  const lector = new FileReader();

  lector.onload = function () {
    let datos;

    // 1) ¿Es JSON? Si no, JSON.parse da error y lo atrapamos
    try {
      datos = JSON.parse(lector.result);
    } catch (error) {
      mostrarMensajePie("⚠️ El archivo no es un JSON válido. No se cambió nada.", true);
      return;
    }

    // 2) ¿Tiene todas las listas y campos esperados?
    const problema = validarDatosImportados(datos);
    if (problema !== "") {
      mostrarMensajePie("⚠️ " + problema + " No se cambió nada.", true);
      return;
    }

    // 3) Pedimos confirmación antes de reemplazar
    const confirmado = confirm(
      "Se van a reemplazar tus " + fichas.length + " fichas y tu progreso por las " +
      datos.fichas.length + " fichas del archivo. ¿Continuar?"
    );
    if (!confirmado) {
      mostrarMensajePie("Importación cancelada. No se cambió nada.", false);
      return;
    }

    // 4) Reemplazamos los datos
    fichas = datos.fichas.map(function (ficha) {
      // Si falta la fuente, la dejamos vacía
      return Object.assign({ fuente: "" }, ficha);
    });

    // Del progreso nos quedamos solo con id de fichas que existen
    const idsExistentes = fichas.map(function (f) { return f.id; });
    progreso = {
      vistas: datos.progreso.vistas.filter(function (id) { return idsExistentes.includes(id); }),
      favoritas: datos.progreso.favoritas.filter(function (id) { return idsExistentes.includes(id); })
    };

    guardarDatos();

    // 5) Volvemos a dibujar toda la pantalla
    SECCIONES.forEach(function (id) {
      indiceActual[id] = 0;
    });
    reiniciarFormulario();
    actualizarSecciones();
    dibujarListaFichas();
    mostrarMensajePie("📥 Se importaron " + fichas.length + " fichas.", false);
  };

  lector.onerror = function () {
    mostrarMensajePie("⚠️ No se pudo leer el archivo. No se cambió nada.", true);
  };

  lector.readAsText(archivo);
});


/* =========================================================
   14. SERVICE WORKER (Práctico 11, paso 4)
   Registra sw.js para que la app funcione sin internet.
   ========================================================= */

// Solo si el navegador lo admite y la página NO se abrió con doble clic
// (con file:// el registro falla y daría un error en la consola)
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  // Esperamos a que la página termine de cargar para no demorarla
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js")
      .then(function () {
        console.log("Service worker registrado: la app ya funciona sin internet.");
      })
      .catch(function (error) {
        console.warn("No se pudo registrar el service worker:", error);
      });
  });
}


/* =========================================================
   15. AVISO "SIN CONEXIÓN" (Práctico 11, paso 7)
   ========================================================= */
const avisoSinConexion = document.getElementById("aviso-sin-conexion");

// Muestra el aviso si no hay internet y lo oculta si hay
function actualizarAvisoConexion() {
  avisoSinConexion.hidden = navigator.onLine;
}

// El navegador avisa cuando se pierde (offline) o vuelve (online) internet
window.addEventListener("offline", actualizarAvisoConexion);
window.addEventListener("online", actualizarAvisoConexion);

// Revisamos al abrir la app (por si ya arranca sin conexión)
actualizarAvisoConexion();

