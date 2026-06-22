import { Schema, model } from 'mongoose';
import {
  PARTICIPANT_TYPE, MATCH_EXECUTION, SCORING_UNIT,
  SCORE_ORDER, FINISH_CONDITION, EVENT_TARGET,
} from '../constants/enums.js';

const basicRulesSchema = new Schema({
    participantType: { type: String, enum: PARTICIPANT_TYPE, required: true },
    minParticipants: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    matchExecution: { type: String, enum: MATCH_EXECUTION, required: true },
    scoringUnit: { type: String, enum: SCORING_UNIT, required: true },
    scoreOrder: { type: String, enum: SCORE_ORDER, required: true },
    finishCondition: { type: String, enum: FINISH_CONDITION, required: true },
    hasDraw: { type: Boolean, default: false },
}, { _id: false });

const validEventsSchema = new Schema({
    code: { type: String, required: true },
    label: { type: String, required: true },
    targetField: { type: String, enum: EVENT_TARGET, required: true },
    incrementScore: { type: Number, default: 0 },
}, { _id: false });

const SportsConfigSchema = new Schema({
  name: { type: String, required: true, unique: true }, // Ej: 'FUTBOL', 'TENIS', 'GOLF'
  basicRules: { type: basicRulesSchema, default: {} },
    validEvents: { type: [validEventsSchema], default: [] },
}, { timestamps: true });

export default model('SportsConfig', SportsConfigSchema);