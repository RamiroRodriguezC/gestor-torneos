import { Schema, model } from 'mongoose';
import { MATCH_EXECUTION, COMPETITOR_SIDE, MATCH_STATUS } from '../constants/enums.js';

const MatchCompetitorSchema = new Schema({
  id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  logoURL: { type: String, default: '' },
  side: { type: String, enum: COMPETITOR_SIDE, default: 'NONE' },
  lineUp: [{
    userId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fullName: { type: String },
    photoURL: { type: String, default: '' },
  }]
}, { _id: false });

const MatchEventSchema = new Schema({
  eventType: { type: String, required: true },
  // CompetitorId y playerId no se embeben completos por que ya estan en la lista de competidores y lineUp, respectivamente. Se guardan solo los ids para relacionar el evento con el jugador o equipo correspondiente.
  competitorId: { type: Schema.Types.ObjectId, required: true }, // Jugador o equipo relacionado al evento
  playerId: { type: Schema.Types.ObjectId, ref: 'Usuario' }, // Jugador relacionado al evento, si (si el partido es entre equipos).
  minute: { type: Number, default: 0 },
  value: { type: Schema.Types.Mixed } // Flexible para distintos tipos de eventos (ej: goles, tarjetas, etc)
  
  
  
}, { _id: false });

const MatchSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  status: { type: String, enum: MATCH_STATUS, default: 'PROGRAMADO' },
  date: {  //Hace referencia a la id de las fechas del torneo
    dateId: { type: Schema.Types.ObjectId, ref: 'Date', required: true } ,
    number: { type: Number, required: true }
  }, 
  field: {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    name: { type: String, required: true },
  },
  sport: {
    sportId: { type: Schema.Types.ObjectId, ref: 'SportsConfig', required: true },
    name: { type: String, required: true },
    matchExecution: { type: String, enum: MATCH_EXECUTION, required: true }
  },
  competitors: [MatchCompetitorSchema],
  keyEvents: [MatchEventSchema],
  startAt: { type: Date },
  isOffline: { type: Boolean, default: false },
  result: { type: Schema.Types.Mixed, default: {} }, // Flexible: { golesHome: 2 } o [sets]
  
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Match', MatchSchema);