import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import SportsConfig from './models/SportsConfigModel.js';
import User from './models/UsersModels.js';
import Team from './models/TeamsModel.js';
import Field from './models/FieldModel.js';
import Tournament from './models/TournamentsModel.js';
import Application from './models/ApplicationsModel.js';
import Match from './models/MatchesModel.js';

dotenv.config();

const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

const __dirname = dirname(fileURLToPath(import.meta.url));

const seedFolders = [
  { dir: 'sports',       model: SportsConfig },
  { dir: 'users',        model: User },
  { dir: 'teams',        model: Team },
  { dir: 'fields',       model: Field },
  { dir: 'tournaments',  model: Tournament },
  { dir: 'applications', model: Application },
  { dir: 'matches',      model: Match },
];

const seedsPath = join(__dirname, 'seeds');

const runSeed = async () => {
  try {
    const dbUri = process.env.NODE_ENV === 'production'
      ? process.env.MONGO_URI
      : process.env.MONGO_URI_DEV;

    await mongoose.connect(dbUri);
    console.log(`🔌 Conectado a MongoDB [${process.env.NODE_ENV}]`);

    if (shouldReset) {
      for (const { model } of seedFolders) {
        await model.deleteMany({});
      }
      console.log('🧹 Todas las colecciones limpiadas');
    }

    for (const { dir, model } of seedFolders) {
      const folderPath = join(seedsPath, dir);

      if (!existsSync(folderPath)) {
        console.log(`⚠️  Carpeta ${dir}/ no encontrada, se saltea`);
        continue;
      }

      const files = readdirSync(folderPath).filter(f => f.endsWith('.json'));

      if (files.length === 0) {
        console.log(`📂 ${dir}/ — vacía, se saltea`);
        continue;
      }

      for (const file of files) {
        const filePath = join(folderPath, file);
        const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
        const docs = Array.isArray(raw) ? raw : [raw];

        for (const doc of docs) {
          await model.findOneAndUpdate(
            { _id: doc._id },
            doc,
            { upsert: true, new: true }
          );

          const label = doc.name || doc.title || file;
          console.log(`✅ ${dir}/${label} — insertado/actualizado`);
        }
      }
    }

    console.log('🎉 Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
