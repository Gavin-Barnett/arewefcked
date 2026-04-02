import { starterCountries } from "../lib/countries/starter-countries";
import { verdictMessages } from "../lib/verdicts/catalog";
import { prisma } from "../lib/db/prisma";

async function main() {
  for (const country of starterCountries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        region: country.region,
        latitude: country.latitude,
        longitude: country.longitude,
        enabled: true
      },
      create: {
        code: country.code,
        name: country.name,
        region: country.region,
        latitude: country.latitude,
        longitude: country.longitude,
        enabled: true
      }
    });
  }

  for (const message of verdictMessages) {
    await prisma.verdictMessage.upsert({
      where: { id: message.id },
      update: {
        band: message.band,
        tone: message.tone,
        text: message.text,
        allowedScopes: message.allowedScopes,
        minConfidence: message.minConfidence,
        tags: message.tags ?? []
      },
      create: {
        id: message.id,
        band: message.band,
        tone: message.tone,
        text: message.text,
        allowedScopes: message.allowedScopes,
        minConfidence: message.minConfidence,
        tags: message.tags ?? []
      }
    });
  }

  console.log(`Seeded ${starterCountries.length} countries and ${verdictMessages.length} verdict messages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
