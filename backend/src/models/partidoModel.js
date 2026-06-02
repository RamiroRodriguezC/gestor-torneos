import mongoose from 'mongoose';

// Subdocumento para registrar incidencias en tiempo real (Cronología del árbitro)
const EventoPartidoSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Ej: 'GOL', 'TARJETA_AMARILLA', 'TRIPLE', 'FALTA'
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  playerName: { type: String }, // Desnormalizado para evitar búsquedas offline en caliente
  minute: { type: Number }      // Minuto de la incidencia o set/periodo
}, { _id: false });

const MatchSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournaments', required: true },
  dateId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID de la jornada embebida en Torneo
  jornadaNumero: { type: Number, required: true }, // Ej: Fecha 1, Fecha 2

  // Copia de los datos clave de los equipos para renderizado rápido sin populates
  homeTeam: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    name: { type: String, required: true },
    logoURL: { type: String }
  },
  awayTeam: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    name: { type: String, required: true },
    logoURL: { type: String }
  },

  status: { 
    type: String, 
    enum: ['PROGRAMADO', 'EN_CURSO', 'FINALIZADO'], 
    default: 'PROGRAMADO' 
  },

  field: {
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field' },
    name: { type: String }
  },

  // MOTOR MULTIDEPORTE: Guardado libre a través de Schema.Types.Mixed
  // Si es fútbol: { homeGoals: 2, awayGoals: 1 }
  // Si es tenis: { sets: [{home: 6, away: 4}, {home: 3, away: 6}] }
  result: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Eventos acumulativos cargados por el árbitro en la planilla minuto a minuto
  keyEvents: [EventoPartidoSchema],

  startAt: { type: Date, required: true },
  
  // Bandera de sincronización para identificar planillas cerradas en modo offline
  esOffline: { type: Boolean, default: false }

}, { 
  timestamps: true 
});

export default mongoose.model('matches', MatchSchema);