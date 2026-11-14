/* =========================================================
   SERVICE WORKER (sw.js)
   Un programa que el navegador ejecuta "por detrás" de la app.
   La primera vez guarda una copia de todos los archivos;
   después, si no hay internet, entrega esas copias.
   ========================================================= */

// Versión de la caché. Cambiala ("v2", "v3"...) cada vez que publiques cambios
const VERSION = "v3";

// Nombre de la caché. Lleva el nombre de la app adelante porque en GitHub Pages
// todas tus apps comparten el mismo sitio (tuusuario.github.io): así no se pisan.
const NOMBRE_CACHE = "explora3d-" + VERSION;

// Todos los archivos que la app necesita para funcionar sin internet
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png",
  // Modelos 3D y su copia en texto
  "./modelos/tiranosaurio.glb",
  "./modelos/corazon.glb",
  "./modelos/vasija.glb",
  "./modelos/modelos-embebidos.js",
  // Librería del visor 3D (se guarda la copia desde el sitio de Google)
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
];


// ---------- INSTALL: se ejecuta una sola vez, al instalar esta versión ----------
self.addEventListener("install", function (evento) {
  // waitUntil le dice al navegador: "no termines de instalar hasta que esto acabe"
  evento.waitUntil(
    caches.open(NOMBRE_CACHE)              // abre (o crea) la caché de esta versión
      .then(function (cache) {
        return cache.addAll(ARCHIVOS);     // descarga y guarda todos los archivos
      })
  );
});


// ---------- ACTIVATE: se ejecuta cuando esta versión empieza a funcionar ----------
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {              // lista de todas las cachés
      return Promise.all(
        nombres
          // Solo las de ESTA app (empiezan con "explora3d-") que no sean la actual
          .filter(function (nombre) {
            return nombre.startsWith("explora3d-") && nombre !== NOMBRE_CACHE;
          })
          .map(function (nombre) {
            return caches.delete(nombre);                 // borra la caché vieja
          })
      );
    })
  );
});


// ---------- FETCH: se ejecuta cada vez que la app pide un archivo ----------
// Estrategia "primero la caché": si hay copia guardada, la usa; si no, va a internet.
self.addEventListener("fetch", function (evento) {
  // Solo atendemos pedidos de lectura (GET)
  if (evento.request.method !== "GET") {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then(function (copia) {
      if (copia) {
        return copia;                       // 1) hay copia guardada: la entregamos
      }
      return fetch(evento.request)          // 2) no hay copia: la buscamos en internet
        .catch(function () {
          // 3) sin internet y sin copia: si era una página, mostramos la app guardada
          if (evento.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Response.error();          // para otros archivos (ej.: tipografías) no hay nada
        });
    })
  );
});
