import {
  prisma,
} from "../config/database.ts";


// ======================================================
// JUNAGADH - SEPTEMBER 2026
// SPECIALITY-WISE LM
//
// Unit         : JN
// LM Month     : September 2026
// BusinessDate : 2026-09-30
// FromDate     : 2026-09-01
// ToDate       : 2026-09-30
//
// Used as LM for October 2026 Speciality Revenue.
// ======================================================


const UNIT_CODE =
  "JN";


const BUSINESS_DATE =
  new Date(
    Date.UTC(
      2026,
      8,
      30
    )
  );


const FROM_DATE =
  new Date(
    Date.UTC(
      2026,
      8,
      1
    )
  );


const TO_DATE =
  new Date(
    Date.UTC(
      2026,
      8,
      30
    )
  );


// ======================================================
// SPECIALITY-WISE LM DATA
//
// Values taken from the September LM values provided.
// ======================================================

const SPECIALITY_DATA = [

  {
    revenueOn:
      "Orthopaedics",

    totalNetAmount:
      7708259,
  },

  {
    revenueOn:
      "Neuro Surgery",

    totalNetAmount:
      1211129,
  },

  {
    revenueOn:
      "General Surgery",

    totalNetAmount:
      3443470,
  },

  {
    revenueOn:
      "Paediatrics",

    totalNetAmount:
      1564615,
  },

  {
    revenueOn:
      "ENT",

    totalNetAmount:
      432304,
  },

  {
    revenueOn:
      "Urology",

    totalNetAmount:
      2136065,
  },

  {
    revenueOn:
      "Obstetrics & Gynaecology",

    totalNetAmount:
      2471899,
  },

  {
    revenueOn:
      "Medicine",

    totalNetAmount:
      3275958,
  },

  {
    revenueOn:
      "Cardiology",

    totalNetAmount:
      8418056,
  },

];


// ======================================================
// TOTAL
// ======================================================

const TOTAL_NET_AMOUNT =
  SPECIALITY_DATA.reduce(
    (
      total,
      row
    ) =>
      total +
      row.totalNetAmount,
    0
  );


const TOTAL_NET_AMOUNT_LAKHS =
  TOTAL_NET_AMOUNT /
  100000;


// ======================================================
// MAIN
// ======================================================

async function main() {

  console.log(
    ""
  );

  console.log(
    "=============================================="
  );

  console.log(
    " JUNAGADH SEPTEMBER 2026 LM IMPORT"
  );

  console.log(
    "=============================================="
  );


  // ====================================================
  // FIND UNIT
  // ====================================================

  const unit =
    await prisma.unit.findUnique({

      where: {

        code:
          UNIT_CODE,

      },

    });


  if (
    !unit
  ) {

    throw new Error(
      `Unit ${UNIT_CODE} not found.`
    );

  }


  if (
    !unit.isActive
  ) {

    throw new Error(
      `Unit ${UNIT_CODE} is inactive.`
    );

  }


  console.log(
    `Unit: ${unit.code} - ${unit.name}`
  );


  console.log(
    `Specialities: ${SPECIALITY_DATA.length}`
  );


  console.log(
    `Total Revenue: ₹${TOTAL_NET_AMOUNT.toLocaleString(
      "en-IN"
    )}`
  );


  // ====================================================
  // SAVE IN ONE TRANSACTION
  //
  // Re-running the script is safe:
  // Existing JN September LM will be updated.
  // Old speciality rows will be replaced.
  // ====================================================

  const result =
    await prisma.$transaction(
      async (
        tx
      ) => {

        // ================================================
        // UPSERT LM IMPORT MASTER
        // ================================================

        const revenueImport =
          await tx.revenueImport.upsert({

            where: {

              unitId_reportType_businessDate: {

                unitId:
                  unit.id,

                reportType:
                  "LM",

                businessDate:
                  BUSINESS_DATE,

              },

            },


            update: {

              fromDate:
                FROM_DATE,

              toDate:
                TO_DATE,

              fileName:
                "MANUAL_JN_SEPTEMBER_2026_LM.csv",

              totalNetAmount:
                TOTAL_NET_AMOUNT,

              totalNetAmountLakhs:
                TOTAL_NET_AMOUNT_LAKHS,

              status:
                "COMPLETED",

              errorMessage:
                null,

            },


            create: {

              unitId:
                unit.id,

              reportType:
                "LM",

              businessDate:
                BUSINESS_DATE,

              fromDate:
                FROM_DATE,

              toDate:
                TO_DATE,

              fileName:
                "MANUAL_JN_SEPTEMBER_2026_LM.csv",

              totalNetAmount:
                TOTAL_NET_AMOUNT,

              totalNetAmountLakhs:
                TOTAL_NET_AMOUNT_LAKHS,

              status:
                "COMPLETED",

              errorMessage:
                null,

            },

          });


        // ================================================
        // REMOVE OLD DEPARTMENT/SPECIALITY DATA
        // ================================================

        await tx.revenueDepartment.deleteMany({

          where: {

            importId:
              revenueImport.id,

          },

        });


        // ================================================
        // INSERT SPECIALITY DATA
        // ================================================

        await tx.revenueDepartment.createMany({

          data:
            SPECIALITY_DATA.map(
              (
                row
              ) => ({

                importId:
                  revenueImport.id,

                revenueOn:
                  row.revenueOn,

                totalNetAmount:
                  row.totalNetAmount,

              })
            ),

        });


        return revenueImport;

      }
    );


  // ====================================================
  // VERIFY SAVED DATA
  // ====================================================

  const savedDepartments =
    await prisma.revenueDepartment.findMany({

      where: {

        importId:
          result.id,

      },

      orderBy: {

        id:
          "asc",

      },

      select: {

        revenueOn:
          true,

        totalNetAmount:
          true,

      },

    });


  console.log(
    ""
  );

  console.log(
    "Saved speciality data:"
  );


  for (
    const row
    of savedDepartments
  ) {

    console.log(
      `${row.revenueOn}: ₹${Number(
        row.totalNetAmount
      ).toLocaleString(
        "en-IN"
      )}`
    );

  }


  console.log(
    ""
  );

  console.log(
    "=============================================="
  );

  console.log(
    " IMPORT SUCCESSFUL"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Import ID: ${result.id}`
  );

  console.log(
    "Report Type: LM"
  );

  console.log(
    "Business Date: 30/09/2026"
  );

  console.log(
    "Period: 01/09/2026 - 30/09/2026"
  );

  console.log(
    `Total: ₹${TOTAL_NET_AMOUNT.toLocaleString(
      "en-IN"
    )}`
  );

  console.log(
    ""
  );

}


// ======================================================
// RUN
// ======================================================

main()
  .catch(
    (
      error
    ) => {

      console.error(
        ""
      );

      console.error(
        "IMPORT FAILED:"
      );

      console.error(
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