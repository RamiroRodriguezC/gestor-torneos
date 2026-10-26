import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../src/models/TournamentsModel.js';
import Match from '../src/models/MatchesModel.js';

dotenv.config();

/**
 * Migración ADR-008 opción 1 — Backfill y sincronización bidireccional de _id en rounds embebidos y matches
 *
 * 1. Asegura que cada round de Tournament.rounds tenga un _id. Si los partidos ya usaban un roundId para esa jornada,
 *    se reutiliza para preservar la integridad referencial.
 * 2. Si los partidos del torneo tenían un roundId diferente al _id del round del torneo para la misma jornada,
 *    se actualizan los partidos para que apunten al _id real del round.
 *
 * Uso: node scripts/migrate-rounds-adr008.js [--dry-run]
 */

const dryRun = process.argv.includes('--dry-run');

const run = async () => {
  const dbUri = process.env.NODE_ENV === 'production' ? process.env.MONGO_URI : process.env.MONGO_URI_DEV;
  if (!dbUri) {
    console.error('Falta MONGO_URI / MONGO_URI_DEV en .env');
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log(`Conectado a MongoDB [${process.env.NODE_ENV}]`);

  const tournaments = await Tournament.find({}).lean();
  console.log(`Torneos encontrados: ${tournaments.length}`);

  let touchedTournaments = 0;
  let touchedMatches = 0;

  for (const t of tournaments) {
    const rounds = t.rounds || [];
    if (rounds.length === 0) continue;

    const matches = await Match.find({ tournamentId: t._id, isDeleted: false }).lean();
    const matchRoundIdByNumber = {};
    for (const m of matches) {
      if (m.round?.number && m.round?.roundId) {
        matchRoundIdByNumber[m.round.number] = m.round.roundId.toString();
      }
    }

    let tournamentMutated = false;
    const newRounds = rounds.map((r) => {
      let roundId = r._id ? r._id.toString() : null;
      if (!roundId) {
        roundId = matchRoundIdByNumber[r.roundNumber] || new mongoose.Types.ObjectId().toString();
        tournamentMutated = true;
      }
      return { ...r, _id: new mongoose.Types.ObjectId(roundId) };
    });

    if (tournamentMutated) {
      touchedTournaments++;
      console.log(`  Torneo ${t._id} "${t.title}" — rounds sincronizados con _id`);
      if (!dryRun) {
        await Tournament.updateOne({ _id: t._id }, { $set: { rounds: newRounds } });
      }
    }

    // Sincronizar matches cuyo round.roundId difiera del _id del round correspondiente
    const roundMap = {};
    newRounds.forEach((r) => {
      roundMap[r.roundNumber] = r._id.toString();
    });

    for (const m of matches) {
      const correctRoundId = roundMap[m.round?.number];
      if (correctRoundId && String(m.round?.roundId) !== correctRoundId) {
        touchedMatches++;
        if (!dryRun) {
          await Match.updateOne(
            { _id: m._id },
            { $set: { 'round.roundId': new mongoose.Types.ObjectId(correctRoundId) } }
          );
        }
      }
    }
  }

  if (dryRun) {
    console.log(`[DRY-RUN] Se tocarían ${touchedTournaments} torneos y ${touchedMatches} partidos desincronizados`);
  } else {
    console.log(`Migración completada: ${touchedTournaments} torneos y ${touchedMatches} partidos sincronizados`);
  }

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error('Error migración:', e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
