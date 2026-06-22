import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Importamos el conector

// Configuración de variables de entorno (SIEMPRE primero)
dotenv.config();

// 🔌 Importaciones de Modelos (Sintaxis moderna)
import User from './models/UsersModels.js';
import Team from './models/TeamsModel.js';
import Tournament from './models/TournamentsModel.js';
import Match from './models/MatchesModel.js';
import SportsConfig from './models/SportsConfigModel.js';
import Application from './models/ApplicationsModel.js';
import Field from './models/FieldModel.js'

import sportsRoutes from './routes/sports.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/sports', sportsRoutes);

// Conectar a la Base de Datos de forma centralizada
connectDB();

// Ruta de control de salud de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV,
    message: 'Servidor operativo y agnóstico' 
  });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
});