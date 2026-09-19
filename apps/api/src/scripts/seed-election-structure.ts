import { prisma } from '../prisma';

/**
 * Complete election structure seeding for Phase 1-2
 * Seeds: States → LGAs → Wards → Polling Units (in hierarchy)
 */
async function seedElectionStructure() {
  console.log('🌱 Seeding complete election structure...\n');

  try {
    // Nigerian States (abbreviated for testing)
    const statesData = [
      { name: 'Ogun', code: 'OG' },
      { name: 'Lagos', code: 'LA' },
      { name: 'Osun', code: 'OS' },
      { name: 'Edo', code: 'ED' },
      { name: 'Kano', code: 'KN' },
    ];

    let totalPUs = 0;

    for (const stateData of statesData) {
      console.log(`📍 Seeding ${stateData.name}...`);

      // Create state
      const state = await prisma.state.upsert({
        where: { code: stateData.code },
        update: {},
        create: {
          name: stateData.name,
          code: stateData.code,
        },
      });

      // Create 3 LGAs per state
      for (let lgaIdx = 1; lgaIdx <= 3; lgaIdx++) {
        const lgaCode = `${stateData.code}-LGA-${lgaIdx}`;

        const lga = await prisma.localGovernmentArea.upsert({
          where: { code: lgaCode },
          update: {},
          create: {
            name: `${stateData.name} LGA ${lgaIdx}`,
            code: lgaCode,
            stateId: state.id,
          },
        });

        // Create 4 Wards per LGA
        for (let wardIdx = 1; wardIdx <= 4; wardIdx++) {
          const wardCode = `${lgaCode}-WARD-${wardIdx}`;

          const ward = await prisma.ward.upsert({
            where: { code: wardCode },
            update: {},
            create: {
              name: `Ward ${wardIdx}`,
              code: wardCode,
              lgaId: lga.id,
            },
          });

          // Create 5 Polling Units per Ward
          for (let puIdx = 1; puIdx <= 5; puIdx++) {
            const puCode = `${wardCode}-PU-${puIdx}`;

            await prisma.pollingUnit.upsert({
              where: { code: puCode },
              update: {},
              create: {
                name: `Polling Unit ${puIdx}`,
                code: puCode,
                wardId: ward.id,
              },
            });

            totalPUs++;
          }
        }
      }

      console.log(`  ✓ ${stateData.name}: 3 LGAs × 4 Wards × 5 PUs = 60 units`);
    }

    // Summary
    const stateCount = await prisma.state.count();
    const lgaCount = await prisma.localGovernmentArea.count();
    const wardCount = await prisma.ward.count();
    const puCount = await prisma.pollingUnit.count();

    console.log(`\n✅ Seeding complete:`);
    console.log(`   States: ${stateCount}`);
    console.log(`   LGAs: ${lgaCount}`);
    console.log(`   Wards: ${wardCount}`);
    console.log(`   Polling Units: ${puCount}`);
    console.log(`\n   Total hierarchy: ${stateCount} → ${lgaCount} → ${wardCount} → ${puCount}`);

    return {
      states: stateCount,
      lgas: lgaCount,
      wards: wardCount,
      pollingUnits: puCount,
    };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedElectionStructure()
  .then((result) => {
    console.log('\n🎉 Election structure seeded successfully');
    console.log(`\nPhase 1-2 can now display data from ${result.pollingUnits} polling units`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
