import express from 'express';
import cors from 'cors';    
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const Usuario = require('./models/Usuario');
const Equipo = require('./models/Equipo');
const Torneo = require('./models/Torneo');
const Match = require('./models/Partido');
const SportsConfig = require('./models/SportsConfig');
