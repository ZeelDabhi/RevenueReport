import {
  prisma,
} from "../config/database.ts";


async function seedUnits() {

  const activeUnits = [
    {
      code: "MB",
      name: "Morbi",
    },
    {
      code: "OS",
      name: "Oswal",
    },
    {
      code: "SV",
      name: "Surendranagar",
    },
    {
      code: "MS",
      name: "Mehsana",
    },
    {
      code: "BJ",
      name: "Bhuj",
    },
    {
      code: "JN",
      name: "Junagadh",
    },
    {
      code: "SM",
      name: "Samarpan",
    },
  ];


  // ======================================================
  // CREATE / UPDATE ACTIVE 7 UNITS
  // ======================================================

  for (
    const unit
    of activeUnits
  ) {

    await prisma.unit.upsert({

      where: {
        code:
          unit.code,
      },

      update: {
        name:
          unit.name,

        isActive:
          true,
      },

      create: {
        code:
          unit.code,

        name:
          unit.name,

        isActive:
          true,
      },

    });

  }


  // ======================================================
  // DEACTIVATE RAJKOT
  //
  // Historical revenue / target / occupancy data
  // will remain safely stored in database.
  // ======================================================

  await prisma.unit.updateMany({

    where: {
      code:
        "RJ",
    },

    data: {
      isActive:
        false,
    },

  });


  console.log(
    "7 active units configured successfully"
  );

  console.log(
    "Rajkot (RJ) marked as inactive"
  );


  await prisma.$disconnect();

}


seedUnits().catch(
  async (
    error
  ) => {

    console.error(
      "Unit seed failed:",
      error
    );


    await prisma.$disconnect();


    process.exit(1);

  }
);