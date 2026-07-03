import { Schema, model } from 'mongoose';

const TeamSchema = new Schema({
  name: { type: String, required: true },
  logoURL: { type: String, default: '' },
  discipline: { type: String, required: true },
  capitanId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' } }],
  tournaments: [{ tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' } }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Team', TeamSchema);