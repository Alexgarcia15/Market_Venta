const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// REQUISITO CRÍTICO: Tus datos de contacto exclusivos para proteger tu comisión
const MI_TELEFONO_INTERMEDIARIO = "1829XXXXXXX"; // <-- Aquí pones tu WhatsApp real más adelante

// Ruta de prueba para ver los artículos del mercado (Escondiendo al dueño real)
app.get('/api/publicaciones', (req, res) => {
    
    // Así simulará el backend la información cuando conectemos PostgreSQL
    const publicacionesEjemplo = [
        {
            id: 1,
            titulo: "Camion Mack Pinnacle 2011 MP7",
            precio: 45000,
            categoria: "Vehiculos",
            descripcion: "Excelente estado, transmisión de 10 velocidades, diferenciales 2.64.",
            contacto_vendedor: MI_TELEFONO_INTERMEDIARIO // El comprador solo te ve a ti
        },
        {
            id: 2,
            titulo: "Diferencial Mack relacion 2.64",
            precio: 2500,
            categoria: "Repuestos",
            descripcion: "Como nuevo, listo para montar.",
            contacto_vendedor: MI_TELEFONO_INTERMEDIARIO // Volvemos a proteger tu comisión
        },
        {
            id: 3,
            titulo: "Solar sembrado de Cocos",
            precio: 120000,
            categoria: "Agricultura",
            descripcion: "Finca hermosa en producción activa.",
            contacto_vendedor: MI_TELEFONO_INTERMEDIARIO // Intermediario exclusivo
        }
    ];
    
    res.json(publicacionesEjemplo);
});

// Levantar el servidor en el puerto 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Motor del mercado corriendo en el puerto ${PORT}`);
});