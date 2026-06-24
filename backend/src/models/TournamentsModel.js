import { Schema, model } from 'mongoose';
import {
  FINISHING_CRITERIA_TYPE, FINISHING_CRITERIA_UNIT,
  TOURNAMENT_FORMAT, TOURNAMENT_STATUS, APPLICATION_STATUS,
} from '../constants/enums.js';

// guarda una snapshot del jugador dentro del equipo al momento de inscribirse en el torneo para mantener un registro histórico inmutable aunque el jugador cambie su nombre, foto u otros datos posteriormente.
const ParticipantLineUpSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fullName: { type: String, required: true },
  url_profile_photo: { type: String, default: '' }
}, { _id: false });

// Guarda una snapshot del participante (equipo o jugador) al momento de inscribirse en el torneo para mantener un registro histórico inmutable aunque el equipo o jugador cambie su nombre, logo u otros datos posteriormente.
const ParticipantSnapshotSchema = new Schema({
  id: { type: Schema.Types.ObjectId, required: true }, // Id del Equipo o Usuario
  name: { type: String, required: true },
  logoURL: { type: String, default: '' },
  lineUp: [ParticipantLineUpSchema] // Lista congelada inmutable
}, { _id: false });

const dateSchema = new Schema({
  roundName: { type: String, required: true, unique: true }, // Podria ser numeral en caso de una liga (como jornada 1,2,3) pero sirve para nombrar las fechas en caso de torneos eliminatorios (ej: Semifinales, Final, etc)
  roundNumber: { type: Number, required: true }, // Para ordenar las fechas en caso de torneos eliminatorios (ej: Semifinales = 1, Final = 2)
  startDate: { type: Date },
  endDate: { type: Date },
  matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }]
}, { _id: false });

const TournamentSchema = new Schema({
  title: { type: String, required: true },
  url_logo: { type: String, default: '' },
  description: { type: String, default: '' },
  organizerId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  sportConfigId: { type: Schema.Types.ObjectId, ref: 'SportsConfig', required: true },
  rules: {
    scoringSystem: {
        winPoints: { type: Number, default: 3, required: true },
        drawPoints: { type: Number, default: 1, required: true },
        lossPoints: { type: Number, default: 0, required: true }
    },
    finishingCriteria: {
        type: { type: String, enum: FINISHING_CRITERIA_TYPE, default: 'POINTS' },
        value: { type: Number, default: 0 },
        unit: { type: String, enum: FINISHING_CRITERIA_UNIT, default: 'POINTS' }
    },
    subsLimit: { type: Number, default: 0 }, // Cantidad de subs permitidos por equipo en cada partido (solo para deportes en equipo)
    tieBreakerRules: { type: [String], default: [] }, // Reglas para desempates (ej: diferencia de goles, goles a favor, enfrentamiento directo, etc)
    specialRules:[
        {
        ruleName: { type: String },
        description: { type: String },
        }
    ], // Cualquier regla adicional específica del torneo (ej: reglas de desempate, criterios de clasificación, etc)
    format: { type: String, enum: TOURNAMENT_FORMAT, default: 'SINGLE_ELIMINATION' },
  },

  status: { type: String, enum: TOURNAMENT_STATUS, default: 'BORRADOR' },
  isOnline: { type: Boolean, default: false },
  
  location:{
    city: { type: String, default: '' },
    country: { type: String, default: '' }
  },

  maxRegistrations: { type: Number, default: 0 }, // 0 para sin límite
  startDate: { type: Date },
  endDate: { type: Date },
  entryFee: { type: Number, default: 0 },
  prizes: { type: String, default: '' },
  bannerURL: { type: String, default: '' },
  contactMail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  registrationCloseAt: { type: Date },

  manifestInscripcion: {
    requiresDigitalDoc: { type: Boolean, default: false },
    requiresPhysicalDoc: { type: Boolean, default: false },
    instructions: { type: String, default: '' }
  },

  participantes: [ParticipantSnapshotSchema],
  
  applications: {
    applicationIds: [{ type: Schema.Types.ObjectId, ref: 'Solicitud' }],
    applicantIds: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }], // Para facilitar consultas de usuario a sus solicitudes sin necesidad de hacer populate en el arreglo de applications, contiene el usuario que aplico
    participantIds: [{ type: Schema.Types.ObjectId }], // Para facilitar consultas de usuario a sus solicitudes sin necesidad de hacer populate en el arreglo de applications. Puede contener UserIds o TeamIds dependiendo del tipo de torneo
    status: [{ type: String, enum: APPLICATION_STATUS }]
},
  
  dates: [dateSchema],

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Tournament', TournamentSchema);