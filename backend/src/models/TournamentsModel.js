import { Schema, model } from 'mongoose';
import {
  FINISHING_CRITERIA_TYPE, FINISHING_CRITERIA_UNIT,
  TOURNAMENT_FORMAT, TOURNAMENT_STATUS, APPLICATION_STATUS,
  ROUND_TYPE, ROUND_STATUS, PARTICIPANT_TYPE,
} from '../constants/enums.js';

// Snapshot del participante dentro del torneo (ADR-006 + ADR-012).
// participantId es polimórfico: apunta a un Team (deporte TEAM) o a un User (deporte INDIVIDUAL).
// Legado: docs creados antes de ADR-012 pueden tener teamId en lugar de participantId —
// los lectores deben usar participantId ?? teamId (ver frontend/src/utils/participant.js).
const ParticipantSnapshotSchema = new Schema({
  participantId: { type: Schema.Types.ObjectId },
  teamId: { type: Schema.Types.ObjectId },
  participantType: { type: String, enum: PARTICIPANT_TYPE, default: 'TEAM' },
  displayNameSnapshot: { type: String, default: '' },
  logoURL: { type: String, default: '' },
}, { _id: false });

const ApplicationSummarySchema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participantId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, enum: APPLICATION_STATUS, default: 'PENDIENTE' }
}, { _id: false });

const ChampionSchema = new Schema({
  participantId: { type: Schema.Types.ObjectId, required: true },
  displayNameSnapshot: { type: String, default: '' },
  logoURL: { type: String, default: '' },
  participantType: { type: String, enum: PARTICIPANT_TYPE, default: 'TEAM' },
  crownedAt: { type: Date, default: Date.now },
}, { _id: false });

const ScheduleConfigSchema = new Schema({
  matchDays: { type: [Number], default: [6, 0] }, // 0: Dom, 1: Lun, ..., 6: Sab
  startTime: { type: String, default: '14:00' },
  endTime: { type: String, default: '21:00' },
  slotDurationMinutes: { type: Number, default: 90 },
  restDaysBetweenRounds: { type: Number, default: 6 },
  fieldIds: [{ type: Schema.Types.ObjectId, ref: 'Field' }],
}, { _id: false });

const roundSchema = new Schema({
  roundName: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  type: { type: String, enum: ROUND_TYPE, default: 'ROUND_ROBIN' },
  status: { type: String, enum: ROUND_STATUS, default: 'SCHEDULED' },
  matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }]
});

const TournamentSchema = new Schema({
  title: { type: String, required: true },
  url_logo: { type: String, default: '' },
  description: { type: String, default: '' },
  organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    subsLimit: { type: Number, default: 0 },
    tieBreakerRules: { type: [String], default: [] },
    specialRules:[
        {
        ruleName: { type: String },
        description: { type: String },
        }
    ],
    format: { type: String, enum: TOURNAMENT_FORMAT, default: 'SINGLE_ELIMINATION' },
    rounds: { type: String, enum: ['single', 'double'], default: 'single' },
  }, 

  status: { type: String, enum: TOURNAMENT_STATUS, default: 'BORRADOR' },
  isOnline: { type: Boolean, default: false },
  
  location:{
    city: { type: String, default: '' },
    country: { type: String, default: '' }
  },

  maxRegistrations: { type: Number, default: 0 },
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
  applications: [ApplicationSummarySchema],
  scheduleConfig: { type: ScheduleConfigSchema, default: () => ({}) },
  rounds: [roundSchema],
  champion: { type: ChampionSchema, default: null },

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Tournament', TournamentSchema);