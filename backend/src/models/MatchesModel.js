import { Schema, model } from 'mongoose';
import { COMPETITOR_SIDE, MATCH_STATUS } from '../constants/enums.js';

const MatchCompetitorSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, required: true },
  side: { type: String, enum: COMPETITOR_SIDE, default: 'NONE' },
  displayNameSnapshot: { type: String, default: '' },
  logoURLSnapshot: { type: String, default: '' },
  lineUp: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String },
    photoURL: { type: String, default: '' },
  }]
}, { _id: false });

const MatchEventSchema = new Schema({
  eventType: { type: String, required: true },
  competitorId: { type: Schema.Types.ObjectId, required: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'User' },
  minute: { type: Number, default: 0 },
  incrementScore: { type: Number, default: 0 },
  value: { type: Schema.Types.Mixed }
}, { _id: false });

const MatchSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  status: { type: String, enum: MATCH_STATUS, default: 'PROGRAMADO' },
  round: {
    // roundId referencia a Tournament.rounds[]._id (subdocumento embebido, PK compuesta lógica tournamentId+roundId — ver ADR-008 opción 1)
    roundId: { type: Schema.Types.ObjectId, required: true },
    number: { type: Number, required: true }
  },
  field: {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    name: { type: String, required: true },
  },
  sportConfigId: { type: Schema.Types.ObjectId, ref: 'SportsConfig', required: true },
  competitors: [MatchCompetitorSchema],
  keyEvents: [MatchEventSchema],
  startAt: { type: Date },
  isOffline: { type: Boolean, default: false },
  result: { type: Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Match', MatchSchema);