import mongoose from 'mongoose';

// Subdocumento embebido para los torneos jugados por este equipo
const TorneoEquipoSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournaments', required: true },
  title: { type: String, required: true },
  url_logo: { type: String }
}, { _id: false });

// Subdocumento embebido para el listado de jugadores en el plantel
const MiembroEquipoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fullName: { type: String, required: true },
  url_profile_photo: { type: String }
}, { _id: false });

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  url_photo: { type: String },
  discipline: { 
    type: String, 
    enum: ['FUTBOL', 'BASQUET', 'TENIS', 'PADDLE', 'VOLLEY'], 
    required: true 
  },
  
  // Capitán del equipo (quien puede postular al equipo a torneos)
  capitanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Listas embebidas optimizadas para el rendimiento offline de Dexie.js
  tournaments: [TorneoEquipoSchema],
  members: [MiembroEquipoSchema]
}, { 
  timestamps: true 
});

export default mongoose.model('Team', TeamSchema);