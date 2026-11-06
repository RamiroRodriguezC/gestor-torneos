import { Schema, model } from 'mongoose';
import { FIELD_TYPE } from '../constants/enums.js';

const FieldSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', index: true },
  name: { type: String, required: true }, // Ej: "Cancha 1", "Mesa 2", "Pista Central"
  type: { type: String, enum: FIELD_TYPE, default: 'CANCHA' },
  location: { type: String, default: '' }, // Ubicación interna o predio, ej: "Sede Central", "Planta Baja"
  address: { type: String, default: '' }, // Dirección física
  sportConfigId: { type: Schema.Types.ObjectId, ref: 'SportsConfig' },
  geoLocalization: {
    lat: { type: Number },
    lng: { type: Number }
  },
  amenities: [{ type: String, default: [] }], // Ej: ["Techada", "Iluminación LED", "Estacionamiento"]
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Field', FieldSchema);
