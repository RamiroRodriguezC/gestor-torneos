import mongoose from 'mongoose';

const SportsConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Ej: "Fútbol 11", "Básquet"
  
  basicRules: {
    participantType: { type: String, enum: ['INDIVIDUAL', 'EQUIPO'], required: true },
    maxPlayersOnGame: { type: Number, required: true },
    resultType: { type: String, enum: ['GOLES', 'PUNTOS', 'SETS'], required: true }
  },
  
  // Eventos permitidos en este deporte. Alimenta la botonera del árbitro dinámicamente
  // Ej: ["GOL", "AMARILLA", "ROJA"] o ["TRIPLE", "DOBLE", "LIBRE", "FALTA"]
  validEvents: [{ type: String }]
}, { 
  timestamps: true 
});

export default mongoose.model('SportsConfig', SportsConfigSchema);