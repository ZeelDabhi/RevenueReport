import {

  prisma,

} from "../../config/database.ts";





// ======================================================

// TYPES

// ======================================================



export type SpecialityReportMode =

  | "DAILY"

  | "DATE_RANGE"

  | "MONTH"

  | "YEAR";





export type SpecialityReportOptions = {



  mode?:

    SpecialityReportMode;



  businessDate?:

    Date | string;



  fromDate?:

    Date | string;



  toDate?:

    Date | string;



  year?:

    number;



  month?:

    number;



  unitId?:

    number | null;



  unitCode?:

    string | null;



};





type CurrentReportType =

  | "FTD"

  | "MTD"

  | "LMTD";





type DailyAmountType =

  | "FTD"

  | "MTD"

  | "LMTD"

  | "LM";





type DepartmentRecord = {



  revenueOn:

    string | null;



  totalNetAmount:

    unknown;



};





type ImportValidation = {



  status:

    "MATCH" | "MISMATCH";



  importTotal:

    number;



  departmentTotal:

    number;



  mappedSpecialityTotal:

    number;



  unmappedTotal:

    number;



  importVsDepartmentDifference:

    number;



  departmentVsMappedDifference:

    number;



  unmappedSpecialities:

    string[];



};





type FileInfo = {



  available:

    boolean;



  importId:

    number | null;



  fileName:

    string | null;



  fromDate:

    string | null;



  toDate:

    string | null;



  validation:

    ImportValidation | null;



};





type MutableDailyRow = {



  speciality:

    string;



  sourceNames:

    Set<string>;



  amounts: {



    FTD:

      bigint;



    MTD:

      bigint;



    LMTD:

      bigint;



    LM:

      bigint;



  };



};





type MutableAmountRow = {



  speciality:

    string;



  sourceNames:

    Set<string>;



  amount:

    bigint;



};





type MutableYearRow = {



  speciality:

    string;



  sourceNames:

    Set<string>;



  months:

    bigint[];



};





// ======================================================

// SUPPORTED UNITS

// ======================================================



const SUPPORTED_UNIT_CODES = [

  "MB",

  "OS",

  "SV",

  "MS",

  "BJ",

  "JN",

  "SM",

] as const;





const UNIT_ORDER = [

  "MB",

  "OS",

  "SV",

  "MS",

  "BJ",

  "JN",

  "SM",

];





// ======================================================

// MASTER SPECIALITIES

// ======================================================



const MASTER_SPECIALITIES_BY_UNIT:

  Record<

    string,

    readonly string[]

  > = {



  MB: [

    "Orthopaedics",

    "Uro Surgery",

    "Cardiology",

    "Paediatrics",

    "Neuro Surgery",

    "General Surgery",

    "Medicine",

    "Gynecology",

  ],



  OS: [

    "General Surgery",

    "Paediatrics",

    "Neuro Surgery",

    "Cardiology",

    "Medicine",

    "Obstetrics & Gynaecology",

    "Orthopaedics",

    "Urology",

  ],



  SV: [

    "Neuro Surgery",

    "ENT",

    "Paediatrics",

    "Urology",

    "General Surgery",

    "Orthopaedics",

    "Obstetrics & Gynaecology",

    "Medicine",

  ],



  MS: [

    "Urology",

    "Medicine",

    "ENT",

    "Neuro Surgery",

    "Obstetrics & Gynaecology",

    "Paediatrics",

    "General Surgery",

    "Orthopaedics",

  ],



  BJ: [

    "Urology",

    "Cardiology",

    "Paediatrics",

    "Neuro Surgery",

    "General Surgery",

    "Orthopaedics",

    "Pulmonology",

    "ENT",

    "Medicine",

    "Obstetrics & Gynaecology",

  ],



  JN: [

    "Orthopaedics",

    "Neuro Surgery",

    "General Surgery",

    "Paediatrics",

    "ENT",

    "Urology",

    "Obstetrics & Gynaecology",

    "Medicine",

    "Cardiology",

  ],



  SM: [

    "Surgical Oncology",

    "Radiation Oncology",

    "Medical Oncology",

  ],



};





// ======================================================

// CONFIRMED ALIASES ONLY

// ======================================================



const GYNECOLOGY_ALIASES = [

  "Gynecology",

  "Gynaecology",

  "Obstetrics & Gynecology",

  "Obstetrics & Gynaecology",

  "Obstetrics and Gynecology",

  "Obstetrics and Gynaecology",

  "OBG",

  "OBGY",

  "OBGYN",

  "OB-GYN",

  "Gynae",

  "Gynec",

];





const UROLOGY_ALIASES = [

  "Uro Surgery",

  "Urology",

  "Urosurgery",

  "Uro-Surgery",

  "Urology Surgery",

  "Urological Surgery",

];





// ======================================================

// MONTH NAMES

// ======================================================



const MONTH_NAMES = [

  "January",

  "February",

  "March",

  "April",

  "May",

  "June",

  "July",

  "August",

  "September",

  "October",

  "November",

  "December",

];





// ======================================================

// CLEAN DISPLAY NAME

// ======================================================



function cleanDisplayName(

  value:

    string

): string {



  return value

    .replace(

      /\uFEFF/g,

      ""

    )

    .replace(

      /\s+/g,

      " "

    )

    .trim();



}





// ======================================================

// NORMALIZE LOOKUP KEY

// ======================================================



function normalizeLookupKey(

  value:

    string

): string {



  return cleanDisplayName(

    value

  )

    .toLowerCase()

    .replace(

      /[^a-z0-9]+/g,

      ""

    );



}





// ======================================================

// ALIAS KEYS

// ======================================================



const GYNECOLOGY_ALIAS_KEYS =

  new Set(

    GYNECOLOGY_ALIASES.map(

      normalizeLookupKey

    )

  );





const UROLOGY_ALIAS_KEYS =

  new Set(

    UROLOGY_ALIASES.map(

      normalizeLookupKey

    )

  );





// ======================================================

// RESOLVE SPECIALITY KEY

// ======================================================



function resolveSpecialityKey(

  value:

    string

): string {



  const normalized =

    normalizeLookupKey(

      value

    );





  if (

    GYNECOLOGY_ALIAS_KEYS.has(

      normalized

    )

  ) {



    return "ALIAS:GYNECOLOGY";



  }





  if (

    UROLOGY_ALIAS_KEYS.has(

      normalized

    )

  ) {



    return "ALIAS:UROLOGY";



  }





  return `RAW:${normalized}`;



}





// ======================================================

// CURRENT REPORT TYPE CHECK

// ======================================================



function isCurrentReportType(

  value:

    string

): value is CurrentReportType {



  return (

    value ===

      "FTD" ||

    value ===

      "MTD" ||

    value ===

      "LMTD"

  );



}





// ======================================================

// NORMALIZE DATE

// ======================================================



function normalizeDate(

  value:

    Date | string

): Date {



  if (

    value instanceof Date

  ) {



    const date =

      new Date(

        Date.UTC(

          value.getUTCFullYear(),

          value.getUTCMonth(),

          value.getUTCDate()

        )

      );





    if (

      Number.isNaN(

        date.getTime()

      )

    ) {



      throw new Error(

        "Invalid date."

      );



    }





    return date;



  }





  const text =

    String(

      value

    )

      .trim();





  const match =

    /^(\d{4})-(\d{2})-(\d{2})$/

      .exec(

        text

      );





  if (

    !match

  ) {



    throw new Error(

      "Invalid date. Expected YYYY-MM-DD."

    );



  }





  const year =

    Number(

      match[1]

    );





  const month =

    Number(

      match[2]

    );





  const day =

    Number(

      match[3]

    );





  const date =

    new Date(

      Date.UTC(

        year,

        month - 1,

        day

      )

    );





  if (

    date.getUTCFullYear() !==

      year ||

    date.getUTCMonth() !==

      month - 1 ||

    date.getUTCDate() !==

      day

  ) {



    throw new Error(

      "Invalid date."

    );



  }





  return date;



}





// ======================================================

// FORMAT DATE

// ======================================================



function formatDate(

  date:

    Date

): string {



  const year =

    date.getUTCFullYear();





  const month =

    String(

      date.getUTCMonth() +

      1

    )

      .padStart(

        2,

        "0"

      );





  const day =

    String(

      date.getUTCDate()

    )

      .padStart(

        2,

        "0"

      );





  return `${year}-${month}-${day}`;



}





// ======================================================

// PREVIOUS MONTH END

// ======================================================



function getPreviousMonthEnd(

  selectedDate:

    Date

): Date {



  return new Date(

    Date.UTC(

      selectedDate.getUTCFullYear(),

      selectedDate.getUTCMonth(),

      0

    )

  );



}





// ======================================================

// MONTH START

// ======================================================



function getMonthStart(

  year:

    number,

  month:

    number

): Date {



  return new Date(

    Date.UTC(

      year,

      month - 1,

      1

    )

  );



}





// ======================================================

// MONTH END

// ======================================================



function getMonthEnd(

  year:

    number,

  month:

    number

): Date {



  return new Date(

    Date.UTC(

      year,

      month,

      0

    )

  );



}





// ======================================================

// YEAR START

// ======================================================



function getYearStart(

  year:

    number

): Date {



  return new Date(

    Date.UTC(

      year,

      0,

      1

    )

  );



}





// ======================================================

// YEAR END

// ======================================================



function getYearEnd(

  year:

    number

): Date {



  return new Date(

    Date.UTC(

      year,

      11,

      31

    )

  );



}





// ======================================================

// DAYS IN SELECTED MONTH

// ======================================================



function getDaysInSelectedMonth(

  selectedDate:

    Date

): number {



  return new Date(

    Date.UTC(

      selectedDate.getUTCFullYear(),

      selectedDate.getUTCMonth() +

      1,

      0

    )

  ).getUTCDate();



}





// ======================================================

// PROJECTION

//

// Formula:

//

// Projection =

// MTD × Total Days In Month ÷ Yesterday (Selected Business Date)

//

// Example:

// Selected Date = 24 Sep

// Days In Month = 30

//

// Projection = MTD × 30 ÷ 24

//

// Calculation is done in paise and rounded

// to nearest paise.

// ======================================================



function calculateProjectionPaise(

  mtdPaise:

    bigint,

  selectedDay:

    number,

  daysInMonth:

    number

): bigint {



  if (

    selectedDay <=

      0 ||

    daysInMonth <=

      0

  ) {



    return 0n;



  }





  const numerator =

    mtdPaise *

    BigInt(

      daysInMonth

    );





  const denominator =

    BigInt(

      selectedDay

    );





  if (

    numerator ===

    0n

  ) {



    return 0n;



  }





  const negative =

    numerator <

    0n;





  const absoluteNumerator =

    negative

      ? -numerator

      : numerator;





  const quotient =

    absoluteNumerator /

    denominator;





  const remainder =

    absoluteNumerator %

    denominator;





  const rounded =

    remainder *

      2n >=

    denominator

      ? quotient +

        1n

      : quotient;





  return negative

    ? -rounded

    : rounded;



}





// ======================================================

// MONEY -> PAISE

// ======================================================



function moneyToPaise(

  value:

    unknown

): bigint {



  let text =

    String(

      value ??

      "0"

    )

      .replace(

        /,/g,

        ""

      )

      .trim();





  if (

    !text

  ) {



    return 0n;



  }





  let negative =

    false;





  if (

    text.startsWith(

      "-"

    )

  ) {



    negative =

      true;





    text =

      text.slice(

        1

      );



  }





  if (

    !/^\d+(\.\d+)?$/.test(

      text

    )

  ) {



    return 0n;



  }





  const [

    wholePart,

    decimalPart = "",

  ] =

    text.split(

      "."

    );





  const whole =

    BigInt(

      wholePart ||

      "0"

    );





  const paiseText =

    decimalPart

      .padEnd(

        2,

        "0"

      )

      .slice(

        0,

        2

      );





  let paise =

    whole *

    100n;





  paise +=

    BigInt(

      paiseText ||

      "0"

    );





  if (

    negative

  ) {



    paise =

      -paise;



  }





  return paise;



}





// ======================================================

// PAISE -> NUMBER

// ======================================================



function paiseToNumber(

  value:

    bigint

): number {



  return Number(

    value

  ) /

  100;



}





// ======================================================

// IMPORT VALIDATION
//
// Checks:
// 1. Import master total vs sum of all department rows.
// 2. Department total vs amount mapped into configured master specialities.
// 3. Lists unmapped speciality names.
//
// This does NOT change revenue amounts. It only exposes
// data-quality differences so incorrect source imports
// can be corrected instead of silently hidden.
// ======================================================



function buildImportValidation(

  importTotalNetAmount:

    unknown,

  departments:

    DepartmentRecord[],

  rowByKey:

    Map<

      string,

      MutableDailyRow

    >

): ImportValidation {



  const importTotalPaise =

    moneyToPaise(

      importTotalNetAmount

    );





  let departmentTotalPaise =

    0n;



  let mappedSpecialityTotalPaise =

    0n;



  const unmappedByName =

    new Map<

      string,

      bigint

    >();





  for (

    const department

    of departments

  ) {



    const rawSpeciality =

      cleanDisplayName(

        String(

          department.revenueOn ??

          ""

        )

      );





    const amountPaise =

      moneyToPaise(

        department.totalNetAmount

      );





    departmentTotalPaise +=

      amountPaise;





    if (

      !rawSpeciality

    ) {



      continue;



    }





    const key =

      resolveSpecialityKey(

        rawSpeciality

      );





    if (

      rowByKey.has(

        key

      )

    ) {



      mappedSpecialityTotalPaise +=

        amountPaise;



      continue;



    }





    const current =

      unmappedByName.get(

        rawSpeciality

      ) ??

      0n;





    unmappedByName.set(

      rawSpeciality,

      current +

      amountPaise

    );



  }





  const importVsDepartmentDifferencePaise =

    departmentTotalPaise -

    importTotalPaise;





  const departmentVsMappedDifferencePaise =

    departmentTotalPaise -

    mappedSpecialityTotalPaise;





  const unmappedSpecialities =

    Array.from(

      unmappedByName.entries()

    )

      .sort(

        (

          a,

          b

        ) =>

          a[0].localeCompare(

            b[0],

            "en",

            {

              sensitivity:

                "base",

            }

          )

      )

      .map(

        (

          [

            speciality,

            amountPaise,

          ]

        ) =>

          `${speciality} = ${paiseToNumber(

            amountPaise

          ).toFixed(

            2

          )}`

      );





  const exactImportDepartmentMatch =

    importVsDepartmentDifferencePaise ===

    0n;





  const allDepartmentsMapped =

    departmentVsMappedDifferencePaise ===

    0n;





  return {



    status:

      exactImportDepartmentMatch &&

      allDepartmentsMapped

        ? "MATCH"

        : "MISMATCH",



    importTotal:

      paiseToNumber(

        importTotalPaise

      ),



    departmentTotal:

      paiseToNumber(

        departmentTotalPaise

      ),



    mappedSpecialityTotal:

      paiseToNumber(

        mappedSpecialityTotalPaise

      ),



    unmappedTotal:

      paiseToNumber(

        departmentVsMappedDifferencePaise

      ),



    importVsDepartmentDifference:

      paiseToNumber(

        importVsDepartmentDifferencePaise

      ),



    departmentVsMappedDifference:

      paiseToNumber(

        departmentVsMappedDifferencePaise

      ),



    unmappedSpecialities,



  };



}





// ======================================================

// SORT UNITS

// ======================================================



function sortUnits<

  T extends {

    code:

      string;

  }

>(

  units:

    T[]

): T[] {



  return units.sort(

    (

      a,

      b

    ) => {



      const aIndex =

        UNIT_ORDER.indexOf(

          a.code

        );





      const bIndex =

        UNIT_ORDER.indexOf(

          b.code

        );





      return aIndex -

        bIndex;



    }

  );



}





// ======================================================

// GET SELECTED UNITS

// ======================================================



async function getSelectedUnits(

  unitId?:

    number | null,

  unitCode?:

    string | null

) {



  const supportedCodes =

    [

      ...SUPPORTED_UNIT_CODES,

    ];





  let units;





  if (

    unitId

  ) {



    units =

      await prisma.unit.findMany({



        where: {



          id:

            unitId,



          isActive:

            true,



          code: {

            in:

              supportedCodes,

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



  }

  else if (

    unitCode

  ) {



    units =

      await prisma.unit.findMany({



        where: {



          code:

            unitCode,



          isActive:

            true,



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



  }

  else {



    units =

      await prisma.unit.findMany({



        where: {



          isActive:

            true,



          code: {

            in:

              supportedCodes,

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



  }





  return sortUnits(

    units

  );



}





// ======================================================

// CREATE DAILY ROWS

// ======================================================



function createDailyRows(

  unitCode:

    string

) {



  const masterSpecialities =

    MASTER_SPECIALITIES_BY_UNIT[

      unitCode

    ] ??

    [];





  const rows:

    MutableDailyRow[] =

    masterSpecialities.map(

      (

        speciality

      ) => ({



        speciality,



        sourceNames:

          new Set<string>(),



        amounts: {



          FTD:

            0n,



          MTD:

            0n,



          LMTD:

            0n,



          LM:

            0n,



        },



      })

    );





  const rowByKey =

    new Map<

      string,

      MutableDailyRow

    >();





  for (

    const row

    of rows

  ) {



    rowByKey.set(

      resolveSpecialityKey(

        row.speciality

      ),

      row

    );



  }





  return {

    rows,

    rowByKey,

  };



}





// ======================================================

// CREATE SINGLE AMOUNT ROWS

// ======================================================



function createAmountRows(

  unitCode:

    string

) {



  const masterSpecialities =

    MASTER_SPECIALITIES_BY_UNIT[

      unitCode

    ] ??

    [];





  const rows:

    MutableAmountRow[] =

    masterSpecialities.map(

      (

        speciality

      ) => ({



        speciality,



        sourceNames:

          new Set<string>(),



        amount:

          0n,



      })

    );





  const rowByKey =

    new Map<

      string,

      MutableAmountRow

    >();





  for (

    const row

    of rows

  ) {



    rowByKey.set(

      resolveSpecialityKey(

        row.speciality

      ),

      row

    );



  }





  return {

    rows,

    rowByKey,

  };



}





// ======================================================

// CREATE YEAR ROWS

// ======================================================



function createYearRows(

  unitCode:

    string

) {



  const masterSpecialities =

    MASTER_SPECIALITIES_BY_UNIT[

      unitCode

    ] ??

    [];





  const rows:

    MutableYearRow[] =

    masterSpecialities.map(

      (

        speciality

      ) => ({



        speciality,



        sourceNames:

          new Set<string>(),



        months:

          Array.from(

            {

              length:

                12,

            },

            () =>

              0n

          ),



      })

    );





  const rowByKey =

    new Map<

      string,

      MutableYearRow

    >();





  for (

    const row

    of rows

  ) {



    rowByKey.set(

      resolveSpecialityKey(

        row.speciality

      ),

      row

    );



  }





  return {

    rows,

    rowByKey,

  };



}





// ======================================================

// DAILY DEPARTMENT AGGREGATION

// ======================================================



function addDailyDepartment(

  rowByKey:

    Map<

      string,

      MutableDailyRow

    >,

  department:

    DepartmentRecord,

  amountType:

    DailyAmountType

) {



  const rawSpeciality =

    cleanDisplayName(

      String(

        department.revenueOn ??

        ""

      )

    );





  if (

    !rawSpeciality

  ) {



    return;



  }





  const key =

    resolveSpecialityKey(

      rawSpeciality

    );





  const row =

    rowByKey.get(

      key

    );





  if (

    !row

  ) {



    return;



  }





  row.sourceNames.add(

    rawSpeciality

  );





  row.amounts[

    amountType

  ] +=

    moneyToPaise(

      department.totalNetAmount

    );



}





// ======================================================

// SINGLE AMOUNT AGGREGATION

// ======================================================



function addAmountDepartment(

  rowByKey:

    Map<

      string,

      MutableAmountRow

    >,

  department:

    DepartmentRecord

) {



  const rawSpeciality =

    cleanDisplayName(

      String(

        department.revenueOn ??

        ""

      )

    );





  if (

    !rawSpeciality

  ) {



    return;



  }





  const key =

    resolveSpecialityKey(

      rawSpeciality

    );





  const row =

    rowByKey.get(

      key

    );





  if (

    !row

  ) {



    return;



  }





  row.sourceNames.add(

    rawSpeciality

  );





  row.amount +=

    moneyToPaise(

      department.totalNetAmount

    );



}





// ======================================================

// YEAR AGGREGATION

// ======================================================



function addYearDepartment(

  rowByKey:

    Map<

      string,

      MutableYearRow

    >,

  department:

    DepartmentRecord,

  monthIndex:

    number

) {



  const rawSpeciality =

    cleanDisplayName(

      String(

        department.revenueOn ??

        ""

      )

    );





  if (

    !rawSpeciality

  ) {



    return;



  }





  const key =

    resolveSpecialityKey(

      rawSpeciality

    );





  const row =

    rowByKey.get(

      key

    );





  if (

    !row

  ) {



    return;



  }





  row.sourceNames.add(

    rawSpeciality

  );





  row.months[

    monthIndex

  ] +=

    moneyToPaise(

      department.totalNetAmount

    );



}





// ======================================================

// COMMON META

// ======================================================



function getCommonMeta() {



  return {



    amountUnit:

      "RUPEES",



    lakhConversion:

      false,



    aliasMapping:

      true,



    masterOnly:

      true,



    canonicalNames: {



      gynecology:

        "Obstetrics & Gynaecology",



      urology:

        "Urology",



    },



    aliases: {



      gynecology: [

        ...GYNECOLOGY_ALIASES,

      ],



      urology: [

        ...UROLOGY_ALIASES,

      ],



    },



  };



}





// ======================================================

// DAILY

// ======================================================



async function getDailyReport(

  options:

    SpecialityReportOptions

) {



  if (

    !options.businessDate

  ) {



    throw new Error(

      "businessDate is required for DAILY report"

    );



  }





  const selectedDate =

    normalizeDate(

      options.businessDate

    );





  // ====================================================

  // PROJECTION PERIOD

  // ====================================================



  const selectedDay =

    selectedDate.getUTCDate();





  const daysInMonth =

    getDaysInSelectedMonth(

      selectedDate

    );





  const previousMonthEnd =

    getPreviousMonthEnd(

      selectedDate

    );





  const previousMonthEndDate =

    formatDate(

      previousMonthEnd

    );





  const units =

    await getSelectedUnits(

      options.unitId,

      options.unitCode

    );





  const unitIds =

    units.map(

      (

        unit

      ) =>

        unit.id

    );





  const [

    currentImports,

    lastMonthImports,

  ] =

    await Promise.all([



      // ==================================================

      // DAILY FILES

      // FTD / MTD / LMTD come from the selected date.

      // No recalculation is done here; speciality values

      // are read directly from the uploaded Revenue On rows.

      // ==================================================

      prisma.revenueImport.findMany({



        where: {



          unitId: {

            in:

              unitIds,

          },



          businessDate:

            selectedDate,



          status:

            "COMPLETED",



          reportType: {

            in: [

              "FTD",

              "MTD",

              "LMTD",

            ],

          },



        },



        select: {



          id:

            true,



          unitId:

            true,



          reportType:

            true,



          businessDate:

            true,



          fileName:

            true,



          totalNetAmount:

            true,



          fromDate:

            true,



          toDate:

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



      }),



      // ==================================================

      // LAST MONTH FULL-MONTH FILE

      // LM comes only from the separately uploaded LM file

      // saved on the previous calendar month-end.

      // ==================================================

      prisma.revenueImport.findMany({



        where: {



          unitId: {

            in:

              unitIds,

          },



          businessDate:

            previousMonthEnd,



          status:

            "COMPLETED",



          reportType:

            "LM",



        },



        select: {



          id:

            true,



          unitId:

            true,



          reportType:

            true,



          businessDate:

            true,



          fileName:

            true,



          totalNetAmount:

            true,



          fromDate:

            true,



          toDate:

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



      }),



    ]);


  const unitReports =

    units.map(

      (

        unit

      ) => {



        const {

          rows,

          rowByKey,

        } =

          createDailyRows(

            unit.code

          );





        const files:

          Record<

            DailyAmountType,

            FileInfo

          > = {



          FTD: {

            available:

              false,

            importId:

              null,

            fileName:

              null,

            fromDate:

              null,

            toDate:

              null,

            validation:

              null,

          },



          MTD: {

            available:

              false,

            importId:

              null,

            fileName:

              null,

            fromDate:

              null,

            toDate:

              null,

            validation:

              null,

          },



          LMTD: {

            available:

              false,

            importId:

              null,

            fileName:

              null,

            fromDate:

              null,

            toDate:

              null,

            validation:

              null,

          },



          LM: {

            available:

              false,

            importId:

              null,

            fileName:

              null,

            fromDate:

              null,

            toDate:

              null,

            validation:

              null,

          },



        };





        const unitCurrentImports =

          currentImports.filter(

            (

              importRecord

            ) =>

              importRecord.unitId ===

              unit.id

          );





        for (

          const importRecord

          of unitCurrentImports

        ) {



          const reportType =

            String(

              importRecord.reportType

            );





          if (

            !isCurrentReportType(

              reportType

            )

          ) {



            continue;



          }





          files[

            reportType

          ] = {



            available:

              true,



            importId:

              importRecord.id,



            fileName:

              importRecord.fileName,



            fromDate:

              formatDate(

                importRecord.fromDate

              ),



            toDate:

              formatDate(

                importRecord.toDate

              ),



            validation:

              buildImportValidation(

                importRecord.totalNetAmount,

                importRecord.departments,

                rowByKey

              ),



          };





          for (

            const department

            of importRecord.departments

          ) {



            addDailyDepartment(

              rowByKey,

              department,

              reportType

            );



          }



        }





        // ==================================================

        // LM = PREVIOUS MONTH FULL-MONTH UPLOAD

        // ==================================================

        const lastMonthImport =

          lastMonthImports.find(

            (

              importRecord

            ) =>

              importRecord.unitId ===

              unit.id

          );





        if (

          lastMonthImport

        ) {



          files.LM = {



            available:

              true,



            importId:

              lastMonthImport.id,



            fileName:

              lastMonthImport.fileName,



            fromDate:

              formatDate(

                lastMonthImport.fromDate

              ),



            toDate:

              formatDate(

                lastMonthImport.toDate

              ),



            validation:

              buildImportValidation(

                lastMonthImport.totalNetAmount,

                lastMonthImport.departments,

                rowByKey

              ),



          };





          for (

            const department

            of lastMonthImport.departments

          ) {



            addDailyDepartment(

              rowByKey,

              department,

              "LM"

            );



          }



        }



        let totalFTD =

          0n;



        let totalMTD =

          0n;



        let totalLMTD =

          0n;



        let totalLM =

          0n;





        for (

          const row

          of rows

        ) {



          totalFTD +=

            row.amounts.FTD;



          totalMTD +=

            row.amounts.MTD;



          totalLMTD +=

            row.amounts.LMTD;



          totalLM +=

            row.amounts.LM;



        }





        const totalProjection =

          calculateProjectionPaise(

            totalMTD,

            selectedDay,

            daysInMonth

          );





        const specialities =

          rows.map(

            (

              row,

              index

            ) => {



              const projection =

                calculateProjectionPaise(

                  row.amounts.MTD,

                  selectedDay,

                  daysInMonth

                );





              return {



                serialNo:

                  index + 1,



                speciality:

                  row.speciality,



                isMaster:

                  true,



                isAutoDiscovered:

                  false,



                sourceNames:

                  Array

                    .from(

                      row.sourceNames

                    )

                    .sort(

                      (

                        a,

                        b

                      ) =>

                        a.localeCompare(

                          b,

                          "en",

                          {

                            sensitivity:

                              "base",

                          }

                        )

                    ),



                FTD:

                  paiseToNumber(

                    row.amounts.FTD

                  ),



                MTD:

                  paiseToNumber(

                    row.amounts.MTD

                  ),



                LMTD:

                  paiseToNumber(

                    row.amounts.LMTD

                  ),



                LM:

                  paiseToNumber(

                    row.amounts.LM

                  ),



                projection:

                  paiseToNumber(

                    projection

                  ),



              };



            }

          );





        return {



          unitId:

            unit.id,



          unitCode:

            unit.code,



          unitName:

            unit.name,



          masterSpecialityCount:

            specialities.length,



          discoveredSpecialityCount:

            0,



          totalSpecialities:

            specialities.length,



          previousMonthEndDate,



          projectionMeta: {



            selectedDay,



            daysInMonth,



            formula:

              "MTD * DAYS_IN_MONTH / SELECTED_DAY",



          },



          dataQuality: {



            allRequiredFilesAvailable:

              files.FTD.available &&

              files.MTD.available &&

              files.LMTD.available &&

              files.LM.available,



            allFilesMatched:

              (

                [

                  files.FTD,

                  files.MTD,

                  files.LMTD,

                  files.LM,

                ]

                  .filter(

                    (

                      file

                    ) =>

                      file.available

                  )

                  .every(

                    (

                      file

                    ) =>

                      file.validation?.status ===

                      "MATCH"

                  )

              ),



            mismatchedFiles:

              (

                [

                  [

                    "FTD",

                    files.FTD,

                  ],

                  [

                    "MTD",

                    files.MTD,

                  ],

                  [

                    "LMTD",

                    files.LMTD,

                  ],

                  [

                    "LM",

                    files.LM,

                  ],

                ] as const

              )

                .filter(

                  (

                    [

                      _,

                      file,

                    ]

                  ) =>

                    file.available &&

                    file.validation?.status ===

                    "MISMATCH"

                )

                .map(

                  (

                    [

                      reportType,

                    ]

                  ) =>

                    reportType

                ),



          },



          files,



          totals: {



            FTD:

              paiseToNumber(

                totalFTD

              ),



            MTD:

              paiseToNumber(

                totalMTD

              ),



            LMTD:

              paiseToNumber(

                totalLMTD

              ),



            LM:

              paiseToNumber(

                totalLM

              ),



            projection:

              paiseToNumber(

                totalProjection

              ),



          },



          specialities,



        };



      }

    );





  return {



    mode:

      "DAILY" as const,



    selectedDate:

      formatDate(

        selectedDate

      ),



    selectedDay,



    daysInMonth,



    projectionFormula:

      "MTD * DAYS_IN_MONTH / SELECTED_DAY",



    projectionSource:

      "MTD",



    previousMonthEndDate,



    lmSource:

      "PREVIOUS_MONTH_END_UPLOADED_LM",



    ...getCommonMeta(),



    totalUnits:

      unitReports.length,



    units:

      unitReports,



  };



}





// ======================================================

// DATE RANGE

//

// Only FTD is summed because MTD is cumulative.

// ======================================================



async function getDateRangeReport(

  options:

    SpecialityReportOptions

) {



  if (

    !options.fromDate ||

    !options.toDate

  ) {



    throw new Error(

      "fromDate and toDate are required for DATE_RANGE report"

    );



  }





  const fromDate =

    normalizeDate(

      options.fromDate

    );





  const toDate =

    normalizeDate(

      options.toDate

    );





  if (

    fromDate.getTime() >

    toDate.getTime()

  ) {



    throw new Error(

      "fromDate cannot be after toDate"

    );



  }





  const days =

    Math.floor(

      (

        toDate.getTime() -

        fromDate.getTime()

      ) /

      86400000

    ) +

    1;





  if (

    days >

    366

  ) {



    throw new Error(

      "Date range cannot exceed 366 days"

    );



  }





  const units =

    await getSelectedUnits(

      options.unitId,

      options.unitCode

    );





  const unitIds =

    units.map(

      (

        unit

      ) =>

        unit.id

    );





  const imports =

    await prisma.revenueImport.findMany({



      where: {



        unitId: {

          in:

            unitIds,

        },



        reportType:

          "FTD",



        status:

          "COMPLETED",



        businessDate: {



          gte:

            fromDate,



          lte:

            toDate,



        },



      },



      select: {



        id:

          true,



        unitId:

          true,



        businessDate:

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



      orderBy: {



        businessDate:

          "asc",



      },



    });





  const unitReports =

    units.map(

      (

        unit

      ) => {



        const {

          rows,

          rowByKey,

        } =

          createAmountRows(

            unit.code

          );





        const unitImports =

          imports.filter(

            (

              importRecord

            ) =>

              importRecord.unitId ===

              unit.id

          );





        const dateSet =

          new Set<string>();





        for (

          const importRecord

          of unitImports

        ) {



          dateSet.add(

            formatDate(

              importRecord.businessDate

            )

          );





          for (

            const department

            of importRecord.departments

          ) {



            addAmountDepartment(

              rowByKey,

              department

            );



          }



        }





        let total =

          0n;





        for (

          const row

          of rows

        ) {



          total +=

            row.amount;



        }





        const specialities =

          rows.map(

            (

              row,

              index

            ) => ({



              serialNo:

                index + 1,



              speciality:

                row.speciality,



              sourceNames:

                Array.from(

                  row.sourceNames

                ),



              amount:

                paiseToNumber(

                  row.amount

                ),



            })

          );





        return {



          unitId:

            unit.id,



          unitCode:

            unit.code,



          unitName:

            unit.name,



          totalSpecialities:

            specialities.length,



          source:

            "FTD_SUM",



          expectedDays:

            days,



          daysWithData:

            dateSet.size,



          total:

            paiseToNumber(

              total

            ),



          specialities,



        };



      }

    );





  return {



    mode:

      "DATE_RANGE" as const,



    fromDate:

      formatDate(

        fromDate

      ),



    toDate:

      formatDate(

        toDate

      ),



    days,



    source:

      "FTD_SUM",



    ...getCommonMeta(),



    totalUnits:

      unitReports.length,



    units:

      unitReports,



  };



}





// ======================================================

// MONTH

//

// Latest completed MTD in selected month.

// ======================================================



async function getMonthReport(

  options:

    SpecialityReportOptions

) {



  const year =

    Number(

      options.year

    );





  const month =

    Number(

      options.month

    );





  if (

    !Number.isInteger(

      year

    )

  ) {



    throw new Error(

      "year is required for MONTH report"

    );



  }





  if (

    !Number.isInteger(

      month

    ) ||

    month <

      1 ||

    month >

      12

  ) {



    throw new Error(

      "month must be between 1 and 12"

    );



  }





  const monthStart =

    getMonthStart(

      year,

      month

    );





  const monthEnd =

    getMonthEnd(

      year,

      month

    );





  const units =

    await getSelectedUnits(

      options.unitId,

      options.unitCode

    );





  const unitIds =

    units.map(

      (

        unit

      ) =>

        unit.id

    );





  const imports =

    await prisma.revenueImport.findMany({



      where: {



        unitId: {

          in:

            unitIds,

        },



        reportType:

          "MTD",



        status:

          "COMPLETED",



        businessDate: {



          gte:

            monthStart,



          lte:

            monthEnd,



        },



      },



      select: {



        id:

          true,



        unitId:

          true,



        businessDate:

          true,



        fileName:

          true,



        fromDate:

          true,



        toDate:

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



      orderBy: {



        businessDate:

          "desc",



      },



    });





  const unitReports =

    units.map(

      (

        unit

      ) => {



        const {

          rows,

          rowByKey,

        } =

          createAmountRows(

            unit.code

          );





        const latestImport =

          imports.find(

            (

              importRecord

            ) =>

              importRecord.unitId ===

              unit.id

          );





        if (

          latestImport

        ) {



          for (

            const department

            of latestImport.departments

          ) {



            addAmountDepartment(

              rowByKey,

              department

            );



          }



        }





        let total =

          0n;





        for (

          const row

          of rows

        ) {



          total +=

            row.amount;



        }





        const specialities =

          rows.map(

            (

              row,

              index

            ) => ({



              serialNo:

                index + 1,



              speciality:

                row.speciality,



              sourceNames:

                Array.from(

                  row.sourceNames

                ),



              amount:

                paiseToNumber(

                  row.amount

                ),



            })

          );





        return {



          unitId:

            unit.id,



          unitCode:

            unit.code,



          unitName:

            unit.name,



          totalSpecialities:

            specialities.length,



          source:

            "LATEST_MTD",



          sourceBusinessDate:

            latestImport

              ? formatDate(

                  latestImport.businessDate

                )

              : null,



          file: {



            available:

              Boolean(

                latestImport

              ),



            importId:

              latestImport?.id ??

              null,



            fileName:

              latestImport?.fileName ??

              null,



            fromDate:

              latestImport

                ? formatDate(

                    latestImport.fromDate

                  )

                : null,



            toDate:

              latestImport

                ? formatDate(

                    latestImport.toDate

                  )

                : null,



          },



          total:

            paiseToNumber(

              total

            ),



          specialities,



        };



      }

    );





  return {



    mode:

      "MONTH" as const,



    year,



    month,



    monthName:

      MONTH_NAMES[

        month -

        1

      ],



    fromDate:

      formatDate(

        monthStart

      ),



    toDate:

      formatDate(

        monthEnd

      ),



    source:

      "LATEST_COMPLETED_MTD",



    ...getCommonMeta(),



    totalUnits:

      unitReports.length,



    units:

      unitReports,



  };



}





// ======================================================

// YEAR

//

// Latest completed MTD for each month.

// ======================================================



async function getYearReport(

  options:

    SpecialityReportOptions

) {



  const year =

    Number(

      options.year

    );





  if (

    !Number.isInteger(

      year

    )

  ) {



    throw new Error(

      "year is required for YEAR report"

    );



  }





  const yearStart =

    getYearStart(

      year

    );





  const yearEnd =

    getYearEnd(

      year

    );





  const units =

    await getSelectedUnits(

      options.unitId,

      options.unitCode

    );





  const unitIds =

    units.map(

      (

        unit

      ) =>

        unit.id

    );





  const imports =

    await prisma.revenueImport.findMany({



      where: {



        unitId: {

          in:

            unitIds,

        },



        reportType:

          "MTD",



        status:

          "COMPLETED",



        businessDate: {



          gte:

            yearStart,



          lte:

            yearEnd,



        },



      },



      select: {



        id:

          true,



        unitId:

          true,



        businessDate:

          true,



        fileName:

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



      orderBy: {



        businessDate:

          "desc",



      },



    });





  // ====================================================

  // LATEST MTD PER UNIT / MONTH

  // ====================================================



  const latestImportByUnitMonth =

    new Map<

      string,

      (

        typeof imports

      )[number]

    >();





  for (

    const importRecord

    of imports

  ) {



    const month =

      importRecord.businessDate

        .getUTCMonth() +

      1;





    const key =

      `${importRecord.unitId}-${month}`;





    if (

      !latestImportByUnitMonth.has(

        key

      )

    ) {



      latestImportByUnitMonth.set(

        key,

        importRecord

      );



    }



  }





  const unitReports =

    units.map(

      (

        unit

      ) => {



        const {

          rows,

          rowByKey,

        } =

          createYearRows(

            unit.code

          );





        const monthMeta =

          Array.from(

            {

              length:

                12,

            },

            (

              _,

              index

            ) => ({



              month:

                index +

                1,



              monthName:

                MONTH_NAMES[

                  index

                ],



              available:

                false,



              sourceBusinessDate:

                null as

                  string |

                  null,



              importId:

                null as

                  number |

                  null,



              fileName:

                null as

                  string |

                  null,



              totalPaise:

                0n,



            })

          );





        for (

          let monthIndex =

            0;

          monthIndex <

            12;

          monthIndex +=

            1

        ) {



          const month =

            monthIndex +

            1;





          const key =

            `${unit.id}-${month}`;





          const latestImport =

            latestImportByUnitMonth.get(

              key

            );





          if (

            !latestImport

          ) {



            continue;



          }





          monthMeta[

            monthIndex

          ].available =

            true;





          monthMeta[

            monthIndex

          ].sourceBusinessDate =

            formatDate(

              latestImport.businessDate

            );





          monthMeta[

            monthIndex

          ].importId =

            latestImport.id;





          monthMeta[

            monthIndex

          ].fileName =

            latestImport.fileName;





          for (

            const department

            of latestImport.departments

          ) {



            addYearDepartment(

              rowByKey,

              department,

              monthIndex

            );



          }



        }





        for (

          let monthIndex =

            0;

          monthIndex <

            12;

          monthIndex +=

            1

        ) {



          let monthTotal =

            0n;





          for (

            const row

            of rows

          ) {



            monthTotal +=

              row.months[

                monthIndex

              ];



          }





          monthMeta[

            monthIndex

          ].totalPaise =

            monthTotal;



        }





        let yearTotal =

          0n;





        const specialities =

          rows.map(

            (

              row,

              index

            ) => {



              let specialityYearTotal =

                0n;





              const monthly =

                row.months.map(

                  (

                    amount,

                    monthIndex

                  ) => {



                    specialityYearTotal +=

                      amount;





                    return {



                      month:

                        monthIndex +

                        1,



                      monthName:

                        MONTH_NAMES[

                          monthIndex

                        ],



                      amount:

                        paiseToNumber(

                          amount

                        ),



                    };



                  }

                );





              yearTotal +=

                specialityYearTotal;





              return {



                serialNo:

                  index +

                  1,



                speciality:

                  row.speciality,



                sourceNames:

                  Array.from(

                    row.sourceNames

                  ),



                monthly,



                total:

                  paiseToNumber(

                    specialityYearTotal

                  ),



              };



            }

          );





        return {



          unitId:

            unit.id,



          unitCode:

            unit.code,



          unitName:

            unit.name,



          totalSpecialities:

            specialities.length,



          source:

            "LATEST_MTD_PER_MONTH",



          months:

            monthMeta.map(

              (

                item

              ) => ({



                month:

                  item.month,



                monthName:

                  item.monthName,



                available:

                  item.available,



                sourceBusinessDate:

                  item.sourceBusinessDate,



                importId:

                  item.importId,



                fileName:

                  item.fileName,



                total:

                  paiseToNumber(

                    item.totalPaise

                  ),



              })

            ),



          total:

            paiseToNumber(

              yearTotal

            ),



          specialities,



        };



      }

    );





  return {



    mode:

      "YEAR" as const,



    year,



    fromDate:

      formatDate(

        yearStart

      ),



    toDate:

      formatDate(

        yearEnd

      ),



    source:

      "LATEST_COMPLETED_MTD_PER_MONTH",



    ...getCommonMeta(),



    totalUnits:

      unitReports.length,



    units:

      unitReports,



  };



}





// ======================================================

// MAIN SERVICE

// ======================================================



export async function getSpecialityRevenueReport(

  options:

    SpecialityReportOptions

) {



  const mode =

    options.mode ??

    "DAILY";





  switch (

    mode

  ) {



    case "DAILY":



      return getDailyReport(

        options

      );





    case "DATE_RANGE":



      return getDateRangeReport(

        options

      );





    case "MONTH":



      return getMonthReport(

        options

      );





    case "YEAR":



      return getYearReport(

        options

      );





    default:



      throw new Error(

        `Unsupported speciality report mode: ${String(

          mode

        )}`

      );



  }



}