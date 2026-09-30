import {
  prisma,
} from "../config/database.ts";


const UNIT_ORDER = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
];


function money(
  value: unknown
): number {

  const n =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    n
  )
    ? Number(
        n.toFixed(
          2
        )
      )
    : 0;

}


function formatDate(
  value: Date
): string {

  return value
    .toISOString()
    .slice(
      0,
      10
    );

}


async function main() {

  const augustMonthEnd =
    new Date(
      Date.UTC(
        2026,
        7,
        31
      )
    );


  const units =
    await prisma.unit.findMany({

      where: {
        code: {
          in:
            UNIT_ORDER,
        },
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


  const unitById =
    new Map(
      units.map(
        (
          unit
        ) => [
          unit.id,
          unit,
        ]
      )
    );


  const imports =
    await prisma.revenueImport.findMany({

      where: {

        unitId: {
          in:
            units.map(
              (
                unit
              ) =>
                unit.id
            ),
        },

        businessDate:
          augustMonthEnd,

        reportType: {
          in: [
            "MTD",
            "LM",
          ],
        },

      },

      orderBy: [
        {
          unitId:
            "asc",
        },
        {
          reportType:
            "asc",
        },
        {
          updatedAt:
            "desc",
        },
      ],

      select: {

        id:
          true,

        unitId:
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

        status:
          true,

        createdAt:
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
    "\n=============================================================="
  );

  console.log(
    "AUGUST 2026 MONTH-END CHECK"
  );

  console.log(
    "Business Date: 2026-08-31"
  );

  console.log(
    "Report Types : MTD + LM"
  );

  console.log(
    "==============================================================\n"
  );


  for (
    const unitCode
    of UNIT_ORDER
  ) {

    const unit =
      units.find(
        (
          row
        ) =>
          row.code ===
          unitCode
      );


    if (
      !unit
    ) {

      console.log(
        `${unitCode}: UNIT NOT FOUND`
      );

      console.log();

      continue;

    }


    const unitImports =
      imports.filter(
        (
          row
        ) =>
          row.unitId ===
          unit.id
      );


    console.log(
      `---------------- ${unit.code} - ${unit.name} ----------------`
    );


    if (
      unitImports.length ===
      0
    ) {

      console.log(
        "No MTD/LM record found for 2026-08-31."
      );

      console.log();

      continue;

    }


    for (
      const item
      of unitImports
    ) {

      const departmentSum =
        item.departments.reduce(
          (
            total:
              number,
            row
          ) =>
            total +
            money(
              row.totalNetAmount
            ),
          0
        );


      console.log(
        `Import ID       : ${item.id}`
      );

      console.log(
        `Report Type     : ${item.reportType}`
      );

      console.log(
        `Status          : ${item.status}`
      );

      console.log(
        `Business Date   : ${formatDate(
          item.businessDate
        )}`
      );

      console.log(
        `From Date       : ${formatDate(
          item.fromDate
        )}`
      );

      console.log(
        `To Date         : ${formatDate(
          item.toDate
        )}`
      );

      console.log(
        `File Name       : ${item.fileName ?? "-"}`
      );

      console.log(
        `Import Total    : ${money(
          item.totalNetAmount
        )}`
      );

      console.log(
        `Department Rows : ${item.departments.length}`
      );

      console.log(
        `Department Sum  : ${Number(
          departmentSum.toFixed(
            2
          )
        )}`
      );

      console.log(
        `Created At      : ${item.createdAt.toISOString()}`
      );

      console.log(
        `Updated At      : ${item.updatedAt.toISOString()}`
      );

      console.log(
        "Top Departments :"
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
            12
          );


      for (
        const department
        of topDepartments
      ) {

        console.log(
          `  ${String(
            department.revenueOn ??
            "(blank)"
          )} = ${money(
            department.totalNetAmount
          )}`
        );

      }


      console.log();

    }

  }


  console.log(
    "=============================================================="
  );

  console.log(
    "WHAT TO CHECK"
  );

  console.log(
    "1. LM should exist for each unit on 2026-08-31."
  );

  console.log(
    "2. Old MTD may also exist. That is okay if dashboard reads LM."
  );

  console.log(
    "3. Same Unit + LM + 2026-08-31 should normally be one record."
  );

  console.log(
    "==============================================================\n"
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
