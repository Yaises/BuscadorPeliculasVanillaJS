// Variables
cont = document.getElementById("peliculas");
let contPags = 1;
let buscarTitulo = "";
let elegirAno = "";
let peticionActiva = false;
let tiempo = false;
let tipoFinal = "";
const miKey = "d2c182f9";
let modoFavoritos = false; 

// Funciones

function maquetarPelis(lista) {
    if (!lista || lista.length === 0) {
        console.log("No hay resultados");
    } else {
        for (const pelicula of lista) {
            // Creamos el div con la clase 'movie-card'
            const div = document.createElement("div");
            div.classList.add("movie-card"); 
            div.addEventListener("click", () => lanzaDetalles(pelicula.imdbID));
            
            const imagen = document.createElement("img");
            imagen.onerror = (e) => e.target.src = "./img/error.jpg"; //    En caso de no existir la imagen de la API, se lanza una imagen por defecto
            imagen.src = pelicula.Poster !== "N/A" ? pelicula.Poster : "./img/error.jpg"; //    Aquí se muestra
            
            const infoDiv = document.createElement("div"); //   Creo los div para cada cosa que quiero que salga por peli
            infoDiv.style.padding = "10px";

            const texto = document.createElement("h3");
            texto.textContent = pelicula.Title;
            
            const anio = document.createElement("p");
            anio.style.color = "#aaa";
            anio.style.fontSize = "0.9rem";
            anio.textContent = pelicula.Year;

            infoDiv.appendChild(texto); 
            infoDiv.appendChild(anio);
            div.appendChild(imagen);
            div.appendChild(infoDiv);
            cont.appendChild(div);
            //  Lo meto todo como divs,h3,p,img hijos 
        }  
    }  
}

function lanzaDetalles(id) {
    const modal = document.getElementById("detalle-overlay");
    modal.classList.remove("oculto"); // Le quito la clase 'oculto' para que se muestre la ventana de detalles

    fetch("https://www.omdbapi.com/?i=" + id + "&plot=full&apikey=" + miKey) // Hago el fetch y los .then para traerme lo que quiero de la API
    .then(response => response.json())
    .then(data => {
        const imgPoster = document.getElementById("detalle-poster");
        imgPoster.src = data.Poster !== "N/A" ? data.Poster : "./img/error.jpg";
        imgPoster.style.display = "block"; //   Estilos

        document.getElementById("detalle-titulo").textContent = data.Title; //  Aquí cojo los datos de la API y los asocio con sus id respectivamente
        document.getElementById("detalle-year").textContent = data.Year;
        document.getElementById("detalle-runtime").textContent = data.Runtime;
        document.getElementById("detalle-genre").textContent = data.Genre;
        
        document.getElementById("detalle-director").querySelector("span").textContent = data.Director;
        document.getElementById("detalle-actores").querySelector("span").textContent = data.Actors;
        document.getElementById("detalle-plot").textContent = data.Plot;

        const ratingsDiv = document.getElementById("detalle-ratings");
        ratingsDiv.innerHTML = ""; 
        if(data.Ratings){ //    Solo si hay valoraciones las muestro
            data.Ratings.forEach(rat => {
                const span = document.createElement("span");
                span.className = "tag";
                span.style.marginRight = "5px";
                span.textContent = rat.Source + ": " + rat.Value;
                ratingsDiv.appendChild(span);
            });
        }

        gestionarBotonFavorito(data);
    });
}

//  Esta función sirve para gestionar los favoritos, añadir, eliminar
//  Lo más importante es que está hecho con el localStorage, si no, no funcionaría

function gestionarBotonFavorito(data) {
    const btnFav = document.getElementById("detalle-fav-btn");
    
    // Leemos los favoritos que ya tenemos
    let favoritos = JSON.parse(localStorage.getItem("misFavoritos")) || [];
    // Comprobamos si esta peli ya está guardada
    let existe = favoritos.some(f => f.imdbID === data.imdbID);

    // Pintamos el botón según toque (Rojo o Gris)
    if (existe) {
        btnFav.textContent = "💔 Eliminar de Favoritos";
        btnFav.style.background = "#555";
    } else {
        btnFav.textContent = "❤️ Añadir a Favoritos";
        btnFav.style.background = "#e91e63";
    }

    // Clonamos el botón para limpiar eventos viejos
    const nuevoBtn = btnFav.cloneNode(true);
    btnFav.parentNode.replaceChild(nuevoBtn, btnFav);

    nuevoBtn.addEventListener("click", () => {
        // Volvemos a leer la lista por si acaso
        favoritos = JSON.parse(localStorage.getItem("misFavoritos")) || [];
        existe = favoritos.some(f => f.imdbID === data.imdbID);

        if (existe) {
            // SI YA ESTABA: La borramos (filtramos todas menos esa)
            favoritos = favoritos.filter(f => f.imdbID !== data.imdbID);
            alert("Eliminado de favoritos");
            
            // Cmabio el botón (su texto y color)
            nuevoBtn.textContent = "❤️ Añadir a Favoritos";
            nuevoBtn.style.background = "#e91e63";
            
            // Si estamos en la pantalla de favoritos, recargamos para que desaparezca (le pongo la clase oculto)
            if(modoFavoritos) {
                document.getElementById("detalle-overlay").classList.add("oculto");
                verFavoritos();
            }
        } else {
            favoritos.push(data); 
            alert("¡Añadida a favoritos!");
            
            nuevoBtn.textContent = "💔 Eliminar de Favoritos";
            nuevoBtn.style.background = "#555";
        }
        //  Guardo todo en el localStorage para que se guarde la lista de favs
        localStorage.setItem("misFavoritos", JSON.stringify(favoritos));
    });
}

function lanzarPeticion(url) {
    if(!peticionActiva) {
        peticionActiva = true;

        fetch(url).then(response => response.json()).then(data => {
            if(data.Search && data.Search.length > 0) {
                maquetarPelis(data.Search);
                contPags++;
            } else {
                console.log("Fin de resultados o error");
            }
            peticionActiva = false;
        }).catch(err => {
            console.log(err);
            peticionActiva = false;
        });
    }
}

function verTipo() {   
    if (modoFavoritos) return;

    tipo = document.getElementsByName("tipo");

    for(let i = 0; i < tipo.length; i++) {
        if(tipo[i].checked) {
            tipoFinal = tipo[i].value;
        }
    }

    let url = "https://www.omdbapi.com/?s=" + buscarTitulo + "&apikey=" + miKey + "&page=" + contPags + "&y=" + elegirAno;

    if(tipoFinal != "") url += "&type=" + tipoFinal;

    lanzarPeticion(url);
}

function buscarPeli() {
    modoFavoritos = false; 
    document.getElementById("intro").style.display = "none"; 

    buscarTitulo = document.getElementById("input-titulo").value.trim().replaceAll(" ", "+");
    elegirAno = document.getElementById("input-ano").value.trim();
        
    if(buscarTitulo.length >= 3) {
        cont.innerHTML = "";
        contPags = 1;
        verTipo();
    } else if (buscarTitulo.length === 0) {
        cont.innerHTML = "";
        document.getElementById("intro").style.display = "block";
    }
}

function verFavoritos() {
    modoFavoritos = true;
    cont.innerHTML = "";
    document.getElementById("intro").style.display = "none";
    document.getElementById("input-titulo").value = ""; 

    const favoritos = JSON.parse(localStorage.getItem("misFavoritos")) || [];
    
    if (favoritos.length > 0) {
        maquetarPelis(favoritos);
    } else {
        cont.innerHTML = '<p style="text-align:center; width:100%;">No tienes favoritos guardados aún.</p>';
    }
}

// Eventos

window.onload = function() {
    document.getElementById("form-busqueda").addEventListener("input", (e) => {
        if(e.target.id === "input-titulo" || e.target.id === "input-ano") {
            clearTimeout(tiempo);
            tiempo = setTimeout(() => {
                buscarPeli();
            }, 500);
        }
    });

    const radios = document.getElementsByName("tipo");
    for(let i=0; i<radios.length; i++) {
        radios[i].addEventListener("change", () => {
             if(document.getElementById("input-titulo").value.trim().length >= 3){
                 buscarPeli();
             }
        });
    }
    
    document.getElementById("form-busqueda").addEventListener("submit", (event) => {
        event.preventDefault();
        clearTimeout(tiempo);
        buscarPeli();
    });

    document.getElementById("cerrar-detalle").addEventListener("click", () => {
        document.getElementById("detalle-overlay").classList.add("oculto");
        setTimeout(() => document.getElementById("detalle-poster").src = "", 300);
    });

    // Ver mis favoritos 
    const form = document.getElementById("form-busqueda");
    const btnFavs = document.createElement("button");
    btnFavs.type = "button";
    btnFavs.className = "btn-buscar"; 
    btnFavs.style.background = "#4caf50"; 
    btnFavs.style.marginLeft = "10px";
    btnFavs.textContent = "⭐ Favoritos";
    btnFavs.addEventListener("click", verFavoritos);
    form.appendChild(btnFavs);
}

// Scroll infinito

window.onscroll = () => {
    if(modoFavoritos) return;

    let cercaFin = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
    
    if (cercaFin && !peticionActiva && buscarTitulo.length >= 3) {
        verTipo();
    }
};