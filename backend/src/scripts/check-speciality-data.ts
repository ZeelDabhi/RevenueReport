import {
  prisma,
} from "../config/database.ts";


function money(
  value: unknown
): number {

  const n =
    Number(
      value ?? 0
    );

  return Number.isFinite(n)
    ? Number(
        n.toFixed(2)
      )
    : 0;

}


async function main() {

  const unitCode =
    "MB";


  const selectedDate =
    new Date(
      Date.UTC(
        2026,
        8,
        25
      )
    );


  const previousMonthEnd =
    new Date(
      Date.UTC(
        2026,
        7,
        31
      )
    );


  const unit =
    await prisma.unit.findUnique({

      where: {
        code:
          unitCode,
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
      `Unit ${unitCode} not found`
    );

  }


  const imports =
    await prisma.revenueImport.findMany({

      where: {

        unitId:
          unit.id,

        businessDate: {
          in: [
            selectedDate,
            previousMonthEnd,
          ],
        },

        status:
          "COMPLETED",

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

      select: {

        id:
          true,

        reportType:
          true,

        businessDate:
          true,

        fromDate:
          true,

        toDate:
          true,

        fileName:
          true,

        totalNetAmount:
          true,

        updatedAt:
          true,

        departments: {

          select: {

            revenueOn:
              true,

            totalNetAmount:
              true,

          },

        },

      },

    });


  console.log(
    "\n=============================================="
  );

  console.log(
    `UNIT: ${unit.code} - ${unit.name}`
  );

  console.log(
    "CHECK: 25/09/2026 DAILY + 31/08/2026 LM"
  );

  console.log(
    "==============================================\n"
  );


  if (
    imports.length ===
    0
  ) {

    console.log(
      "NO COMPLETED IMPORTS FOUND."
    );

    return;

  }


  for (
    const item
    of imports
  ) {

    const departmentTotal =
      item.departments.reduce(
        (
          total,
          row
        ) =>
          total +
          money(
            row.totalNetAmount
          ),
        0
      );


    console.log(
      "----------------------------------------------"
    );

    console.log(
      "Import ID      :",
      item.id
    );

    console.log(
      "Report Type    :",
      item.reportType
    );

    console.log(
      "Business Date  :",
      item.businessDate
        .toISOString()
        .slice(
          0,
          10
        )
    );

    console.log(
      "From Date      :",
      item.fromDate
        .toISOString()
        .slice(
          0,
          10
        )
    );

    console.log(
      "To Date        :",
      item.toDate
        .toISOString()
        .slice(
          0,
          10
        )
    );

    console.log(
      "File Name      :",
      item.fileName
    );

    console.log(
      "Import Total   :",
      money(
        item.totalNetAmount
      )
    );

    console.log(
      "Department Rows:",
      item.departments.length
    );

    console.log(
      "Department Sum :",
      Number(
        departmentTotal.toFixed(
          2
        )
      )
    );

    console.log(
      "Updated At     :",
      item.updatedAt
        .toISOString()
    );


    console.log(
      "\nTop Department Values:"
    );


    const topDepartments =
      [
        ...item.departments,
      ]
        .sort(
          (
            a,
            b
          ) =>
            money(
              b.totalNetAmount
            ) -
            money(
              a.totalNetAmount
            )
        )
        .slice(
          0,
          15
        );


    for (
      const row
      of topDepartments
    ) {

      console.log(
        `  ${String(
          row.revenueOn ??
          "(blank)"
        )} = ${money(
          row.totalNetAmount
        )}`
      );

    }


    console.log();

  }


  console.log(
    "=============================================="
  );

  console.log(
    "EXPECTED LOGIC"
  );

  console.log(
    "FTD/MTD/LMTD -> businessDate 2026-09-25"
  );

  console.log(
    "LM           -> businessDate 2026-08-31"
  );

  console.log(
    "==============================================\n"
  );

}


main()
  .catch(
    (
      error
    ) => {

      console.error(
        "\nCHECK FAILED:\n",
        error
      );

      process.exitCode =
        1;

    }
  )
  .finally(
    async () => {

      await prisma
        .$disconnect();

    }
  );


  