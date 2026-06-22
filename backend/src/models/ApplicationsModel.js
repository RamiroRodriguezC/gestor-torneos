import { Schema, model } from 'mongoose';
import { APPLICATION_STATUS } from '../constants/enums.js';

const SolicitudSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  applicantId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  participantId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, enum: APPLICATION_STATUS, default: 'PENDIENTE' },
  comprobantURL: { type: String, default: '' },
  notesCapitan: { type: String, default: '' },
  notesOrganizador: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Solicitud', SolicitudSchema);