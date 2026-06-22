import { Schema, model } from 'mongoose';

const FieldSchema = new Schema({
  name: { type: String, required: true }, // Ej: "Cancha 1 - Predio UTN", "Complejo Alto Botánico"
  address: { type: String, required: true }, // Dirección física
  geoLocalization: {
    lat: { type: Number },
    lng: { type: Number }
  },
  amenities: [{ type: String }], // Ej: ["Techada", "Iluminación LED", "Estacionamiento"]
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Field', FieldSchema);