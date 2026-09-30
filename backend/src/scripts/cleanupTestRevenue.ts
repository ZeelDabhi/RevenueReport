import {
  prisma,
} from "../config/database.ts";


async function cleanupTestRevenue() {

  const unit =
    await prisma.unit.findUnique({

      where: {
        code:
          "MB",
      },

      select: {

        id:
          true,

        code:
          true,

        name:
          true,

      },

    });


  if (
    !unit
  ) {

    throw new Error(
      "MB - Morbi unit not found"
    );

  }


  const testDates = [

    new Date(
      Date.UTC(
        2026,
        8,
        19
      )
    ),

    new Date(
      Date.UTC(
        2026,
        8,
        20
      )
    ),

  ];


  // ======================================================
  // SHOW RECORDS BEFORE DELETE
  // ======================================================

  const records =
    await prisma.revenueImport.findMany({

      where: {

        unitId:
          unit.id,

        businessDate: {
          in:
            testDates,
        },

      },

      select: {

        id:
          true,

        reportType:
          true,

        businessDate:
          true,

        fileName:
          true,

        totalNetAmountLakhs:
          true,

      },

      orderBy: [

        {
          businessDate:
            "asc",
        },

        {
          reportType:
            "asc",
        },

      ],

    });


  console.log(
    `Unit: ${unit.code} - ${unit.name}`
  );


  console.log(
    `Matching test records found: ${records.length}`
  );


  for (
    const record
    of records
  ) {

    console.log({

      id:
        record.id,

      reportType:
        record.reportType,

      businessDate:
        record.businessDate
          .toISOString()
          .slice(
            0,
            10
          ),

      fileName:
        record.fileName,

      totalNetAmountLakhs:
        Number(
          record.totalNetAmountLakhs
        ),

    });

  }


  // ======================================================
  // DELETE ONLY MB TEST REVENUE
  // ======================================================

  const deleted =
    await prisma.revenueImport.deleteMany({

      where: {

        unitId:
          unit.id,

        businessDate: {
          in:
            testDates,
        },

      },

    });


  console.log(
    `Deleted test revenue records: ${deleted.count}`
  );


  console.log(
    "MB test revenue for 2026-09-19 and 2026-09-20 cleaned successfully."
  );

}


cleanupTestRevenue()
  .catch(
    (
      error
    ) => {

      console.error(
        "Cleanup failed:",
        error
      );


      process.exitCode =
        1;

    }
  )
  .finally(
    async () => {

      await prisma.$disconnect();

    }
  );