import mongoose from 'mongoose';

// --- SUBDOCUMENTO: SOLICITUDES DE INSCRIPCIÓN (Ex registrationAplications en tu .mml) ---
const SolicitudInscripcionSchema = new mongoose.Schema({
  capitanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type: { type: String, enum: ['INDIVIDUAL', 'EQUIPO'], required: true },
  status: { type: String, enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'], default: 'PENDIENTE' },
  
  // Lista de jugadores que el capitán inscribe para este torneo en particular
  members: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    memberFullName: { type: String, required: true }
  }],

  // RESPUESTAS AL MANIFIESTO DE ADMISIÓN (Filtro para control de aptos físicos)
  comprobanteUrl: { type: String },  // Enlace de Drive/Dropbox con la documentación digital
  notasCapitan: { type: String },    // Ejemplo: "Dejé los papeles físicos en portería el lunes"
  notasOrganizador: { type: String }, // Feedback de rechazo: "Falta firma en el folio de deslinde"
  
  submittedAt: { type: Date, default: Date.now }
});

// --- SUBDOCUMENTO: JORNADAS DEL FIXTURE (Ex dates en tu .mml) ---
const JornadaSchema = new mongoose.Schema({
  number: { type: Number, required: true }, // Ej: Fecha 1, Fecha 2
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  matchesCount: { type: Number, default: 0 },
  
  // Copia liviana de partidos para pintar el calendario de fechas súper rápido sin populate
  matches: [{
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    homeTeamName: { type: String },
    awayTeamName: { type: String },
    homeLogo: { type: String },
    awayLogo: { type: String },
    status: { type: String, enum: ['PROGRAMADO', 'EN_CURSO', 'FINALIZADO'] },
    result: {
      homeGoals: { type: String, default: '0' },
      awayGoals: { type: String, default: '0' }
    }
  }]
});

// --- ESQUEMA CORE DEL TORNEO ---
const TournamentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url_logo: { type: String },
  descripcion: { type: String },
  sportConfigId: { type: mongoose.Schema.Types.ObjectId, ref: 'SportsConfig', required: true },
  
  // Reglas del Torneo y Puntos de la Tabla
  rules: {
    scoringSystem: {
      win: { type: Number, default: 3 },
      draw: { type: Number, default: 1 },
      lose: { type: Number, default: 0 }
    },
    finishCondition: {
      finishType: { type: String, enum: ['PUNTOS', 'FECHAS', 'ELIMINACION_DIRECTA'], default: 'FECHAS' },
      value: { type: String },
      unit: { type: String }
    },
    subsLimit: { type: Number, default: 5 },
    tieBreaker: { type: String, enum: ['DIFERENCIA_GOLES', 'RESULTADO_DIRECTO', 'SORTEO'], default: 'DIFERENCIA_GOLES' },
    specialRules: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  status: { 
    type: String, 
    enum: ['INSCRIPCION_ABIERTA', 'PLANIFICACION', 'EN_CURSO', 'FINALIZADO'], 
    default: 'INSCRIPCION_ABIERTA' 
  },
  isOnline: { type: Boolean, default: true },
  
  location: {
    country: { type: String, default: 'Argentina' },
    city: { type: String }
  },

  maxRegistrations: { type: Number, default: 16 },
  startDate: { type: Date },
  endDate: { type: Date },
  entryFee: { type: String }, 
  prizes: { type: String },    
  bannerUrl: { type: String },
  contactMail: { type: String },
  contactPhone: { type: String },
  registrationCloseAt: { type: Date },
  format: { type: String, enum: ['LIGA', 'ELIMINATORIA', 'GRUPOS_Y_PLAYOFF'], default: 'LIGA' },

  // MANIFIESTO DINÁMICO DE INSCRIPCIÓN (Configurable por el Organizador)
  manifiestoInscripcion: {
    requiereDocumentoDigital: { type: Boolean, default: false },
    instruccionesDocumento: { type: String }, // Instrucciones de carga
    requiereEntregaFisica: { type: Boolean, default: false },
    instruccionesFisicas: { type: String }   // Instrucciones para deslindes en papel
  },

  // Equipos aceptados formalmente (Migran aquí desde solicitudes aprobadas)
  equiposParticipantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],

  // Unificación NoSQL de Solicitudes y Fechas (dates) para soporte offline fluido
  solicitudesInscripcion: [SolicitudInscripcionSchema],
  dates: [JornadaSchema]

}, { 
  timestamps: true 
});

export default mongoose.model('Tournaments', TournamentSchema);