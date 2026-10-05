import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Activity,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";

import autoTable
  from "jspdf-autotable";

import html2canvas
  from "html2canvas";

import api
  from "../services/api";

import "./SpecialityRevenuePage.css";


// ======================================================
// TYPES
// ======================================================

type UserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR"
  | "HO_USER";


type StoredUser = {

  role?: UserRole;

  unit?: {

    code?: string;

    name?: string;

  } | null;

};


type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


type ReportMode =
  | "DAILY"
  | "RANGE"
  | "MONTH"
  | "YEAR";


type ApiReportMode =
  | "DAILY"
  | "DATE_RANGE"
  | "MONTH"
  | "YEAR";


type DownloadFormat =
  | "EXCEL"
  | "CSV"
  | "PDF"
  | "PNG"
  | "ALL_EXCEL"
  | "ALL_PDF";


type VariationSort =
  | "MASTER"
  | "HIGH_TO_LOW"
  | "LOW_TO_HIGH";


type ApiErrorResponse = {

  message?: string;

};


// ======================================================
// DAILY TYPES
// ======================================================

type DailySpecialityRow = {

  serialNo: number;

  speciality: string;

  FTD: number;

  MTD: number;

  LMTD: number;

  LM: number;

  projection?: number;

};


type DailyUnit = {

  unitId: number;

  unitCode: string;

  unitName: string;

  totalSpecialities: number;

  totals: {

    FTD: number;

    MTD: number;

    LMTD: number;

    LM: number;

    projection?: number;

  };

  projectionMeta?: {

    selectedDay: number;

    daysInMonth: number;

    formula: string;

  };

  specialities:
    DailySpecialityRow[];

};


type DailyData = {

  mode?:
    "DAILY";

  selectedDate: string;

  previousMonthEndDate: string;

  selectedDay?: number;

  daysInMonth?: number;

  projectionFormula?: string;

  projectionSource?: string;

  units:
    DailyUnit[];

};


// ======================================================
// DATE RANGE TYPES
// ======================================================

type AmountSpecialityRow = {

  serialNo: number;

  speciality: string;

  amount: number;

};


type RangeUnit = {

  unitId: number;

  unitCode: string;

  unitName: string;

  totalSpecialities: number;

  expectedDays: number;

  daysWithData: number;

  total: number;

  specialities:
    AmountSpecialityRow[];

};


type RangeData = {

  mode:
    "DATE_RANGE";

  fromDate: string;

  toDate: string;

  days: number;

  units:
    RangeUnit[];

};


// ======================================================
// MONTH TYPES
// ======================================================

type MonthUnit = {

  unitId: number;

  unitCode: string;

  unitName: string;

  totalSpecialities: number;

  sourceBusinessDate:
    string |
    null;

  total: number;

  specialities:
    AmountSpecialityRow[];

};


type MonthData = {

  mode:
    "MONTH";

  year: number;

  month: number;

  monthName: string;

  fromDate: string;

  toDate: string;

  units:
    MonthUnit[];

};


// ======================================================
// YEAR TYPES
// ======================================================

type YearMonthAmount = {

  month: number;

  monthName: string;

  amount: number;

};


type YearSpecialityRow = {

  serialNo: number;

  speciality: string;

  monthly?:
    YearMonthAmount[];

  total: number;

};


type YearMonthSummary = {

  month: number;

  monthName: string;

  available: boolean;

  sourceBusinessDate:
    string |
    null;

  total: number;

};


type YearUnit = {

  unitId: number;

  unitCode: string;

  unitName: string;

  totalSpecialities: number;

  total: number;

  months?:
    YearMonthSummary[];

  specialities:
    YearSpecialityRow[];

};


type YearData = {

  mode:
    "YEAR";

  year: number;

  fromDate: string;

  toDate: string;

  units:
    YearUnit[];

};


type SpecialityData =
  | DailyData
  | RangeData
  | MonthData
  | YearData;


type DashboardResponse = {

  success: boolean;

  message?: string;

  data?:
    SpecialityData;

};


// ======================================================
// UNITS
// ======================================================

const UNITS = [

  [
    "MB",
    "Morbi",
  ],

  [
    "OS",
    "Oswal",
  ],

  [
    "SV",
    "Surendranagar",
  ],

  [
    "MS",
    "Mehsana",
  ],

  [
    "BJ",
    "Bhuj",
  ],

  [
    "JN",
    "Junagadh",
  ],

  [
    "SM",
    "Samarpan",
  ],

] as const;


// ======================================================
// REPORT OPTIONS
// ======================================================

const REPORT_OPTIONS: {
  value: ReportMode;
  label: string;
}[] = [

  {
    value:
      "DAILY",

    label:
      "Daily",
  },

  {
    value:
      "RANGE",

    label:
      "Date Range",
  },

  {
    value:
      "MONTH",

    label:
      "Month",
  },

  {
    value:
      "YEAR",

    label:
      "Year",
  },

];


// ======================================================
// VARIATION SORT OPTIONS
// ======================================================

const VARIATION_SORT_OPTIONS: {
  value: VariationSort;
  label: string;
  caption: string;
}[] = [

  {
    value:
      "MASTER",

    label:
      "Master Order",

    caption:
      "Original speciality order",
  },

  {
    value:
      "HIGH_TO_LOW",

    label:
      "Highest to Smallest",

    caption:
      "Highest variation first",
  },

  {
    value:
      "LOW_TO_HIGH",

    label:
      "Smallest to Highest",

    caption:
      "Lowest variation first",
  },

];


// ======================================================
// FULL ACCESS
// ======================================================

const FULL_ACCESS_ROLES:
  UserRole[] = [

  "SUPER_ADMIN",

  "MASTER_ADMIN",

  "ADMIN",

  "DIRECTOR",

];


// ======================================================
// YESTERDAY
// ======================================================

function getYesterdayDate():
  string {

  const date =
    new Date();


  date.setDate(
    date.getDate() -
    1
  );


  return `${date.getFullYear()}-${String(
    date.getMonth() +
    1
  ).padStart(
    2,
    "0"
  )}-${String(
    date.getDate()
  ).padStart(
    2,
    "0"
  )}`;

}


// ======================================================
// USER
// ======================================================

function getStoredUser():
  StoredUser {

  try {

    const value =
      localStorage.getItem(
        "revenue_user"
      );


    return value
      ? JSON.parse(
          value
        )
      : {};

  }
  catch {

    return {};

  }

}


// ======================================================
// MONEY
// ======================================================

function formatMoney(
  value:
    number |
    undefined
): string {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ??
      0
    )
  );

}


// ======================================================
// EXPORT MONEY
// ======================================================

function formatExportMoney(
  value:
    number |
    undefined
): string {

  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ??
      0
    )
  );

}


// ======================================================
// DATE
// ======================================================

function formatDate(
  value:
    string |
    null |
    undefined
): string {

  if (
    !value
  ) {

    return "-";

  }


  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        value
      );


  if (
    !match
  ) {

    return value;

  }


  return `${match[3]}/${match[2]}/${match[1]}`;

}


// ======================================================
// MONTH NAME FROM DATE
// ======================================================

function formatMonthFromDate(
  value:
    string |
    undefined
): string {

  if (
    !value
  ) {

    return "Last Month";

  }


  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        value
      );


  if (
    !match
  ) {

    return value;

  }


  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) - 1,
      1
    )
  );

}


// ======================================================
// MONTH INPUT LABEL
// ======================================================

function formatMonthInput(
  value:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        value
      );


  if (
    !match
  ) {

    return value;

  }


  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) - 1,
      1
    )
  );

}


// ======================================================
// FILE NAME
// ======================================================

function safeFileName(
  value:
    string
): string {

  return value
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );

}


// ======================================================
// VARIATION
//
// Formula:
// Variation = Projection - Last Month
// ======================================================

function calculateVariation(
  projection:
    number |
    undefined,
  lastMonth:
    number |
    undefined
): number {

  const projectionValue =
    Number(
      projection ??
      0
    );


  const lastMonthValue =
    Number(
      lastMonth ??
      0
    );


  return Number(
    (
      projectionValue -
      lastMonthValue
    )
      .toFixed(
        2
      )
  );

}


// ======================================================
// SIGNED MONEY
// ======================================================

function formatSignedMoney(
  value:
    number |
    undefined
): string {

  const amount =
    Number(
      value ??
      0
    );


  if (
    amount >
    0
  ) {

    return `+${formatMoney(
      amount
    )}`;

  }


  return formatMoney(
    amount
  );

}


// ======================================================
// VARIATION CLASS
// ======================================================

function getVariationClass(
  value:
    number
): string {

  if (
    value >
    0
  ) {

    return "is-positive";

  }


  if (
    value <
    0
  ) {

    return "is-negative";

  }


  return "is-zero";

}


// ======================================================
// EXPECTED API MODE
// ======================================================

function getExpectedApiMode(
  reportMode:
    ReportMode
): ApiReportMode {

  if (
    reportMode ===
    "RANGE"
  ) {

    return "DATE_RANGE";

  }


  return reportMode;

}


// ======================================================
// DETECT RESPONSE MODE
//
// Supports:
// 1. New backend with data.mode
// 2. Old Daily backend response without data.mode
// ======================================================

function detectResponseMode(
  data:
    SpecialityData |
    null
): ApiReportMode | null {

  if (
    !data
  ) {

    return null;

  }


  if (
    data.mode ===
    "DAILY" ||
    data.mode ===
    "DATE_RANGE" ||
    data.mode ===
    "MONTH" ||
    data.mode ===
    "YEAR"
  ) {

    return data.mode;

  }


  if (
    "selectedDate" in
      data &&
    "previousMonthEndDate" in
      data
  ) {

    return "DAILY";

  }


  if (
    "days" in
      data &&
    "fromDate" in
      data &&
    "toDate" in
      data
  ) {

    return "DATE_RANGE";

  }


  if (
    "month" in
      data &&
    "monthName" in
      data
  ) {

    return "MONTH";

  }


  if (
    "year" in
      data
  ) {

    return "YEAR";

  }


  return null;

}


// ======================================================
// PAGE
// ======================================================

function SpecialityRevenuePage() {

  const navigate =
    useNavigate();


  const reportSnapshotRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const downloadRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const variationSortRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const specialityVisibilityRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const [
    user,
  ] =
    useState<StoredUser>(
      getStoredUser
    );


  const hasFullAccess =
    Boolean(
      user.role &&
      FULL_ACCESS_ROLES.includes(
        user.role
      )
    );


  const isIncharge =
    user.role ===
    "INCHARGE_DIRECTOR";


  const initialDate =
    getYesterdayDate();


  const [
    reportMode,
    setReportMode,
  ] =
    useState<ReportMode>(
      "DAILY"
    );


  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      initialDate
    );


  const [
    rangeFromDate,
    setRangeFromDate,
  ] =
    useState(
      `${initialDate.slice(
        0,
        8
      )}01`
    );


  const [
    rangeToDate,
    setRangeToDate,
  ] =
    useState(
      initialDate
    );


  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      initialDate.slice(
        0,
        7
      )
    );


  const [
    selectedYear,
    setSelectedYear,
  ] =
    useState(
      Number(
        initialDate.slice(
          0,
          4
        )
      )
    );


  const [
    selectedUnit,
    setSelectedUnit,
  ] =
    useState<UnitCode>(
      () => {

        const code =
          user.unit?.code as
            | UnitCode
            | undefined;


        return UNITS.some(
          (
            unit
          ) =>
            unit[0] ===
            code
        )
          ? code!
          : "MB";

      }
    );


  const [
    data,
    setData,
  ] =
    useState<SpecialityData | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(
      0
    );


  const [
    downloadOpen,
    setDownloadOpen,
  ] =
    useState(
      false
    );


  const [
    downloadLoading,
    setDownloadLoading,
  ] =
    useState(
      false
    );


  const [
    downloadError,
    setDownloadError,
  ] =
    useState(
      ""
    );


  const [
    variationSort,
    setVariationSort,
  ] =
    useState<VariationSort>(
      "MASTER"
    );


  const [
    variationSortOpen,
    setVariationSortOpen,
  ] =
    useState(
      false
    );


  const [
    specialityVisibilityOpen,
    setSpecialityVisibilityOpen,
  ] =
    useState(
      false
    );


  const [
    hiddenSpecialities,
    setHiddenSpecialities,
  ] =
    useState<string[]>(
      () => {

        try {

          const saved =
            localStorage.getItem(
              "speciality_hidden_specialities"
            );


          if (
            !saved
          ) {

            return [];

          }


          const parsed =
            JSON.parse(
              saved
            );


          return Array.isArray(
            parsed
          )
            ? parsed.filter(
                (
                  value
                ) =>
                  typeof value ===
                  "string"
              )
            : [];

        }
        catch {

          return [];

        }

      }
    );


  const expectedApiMode =
    getExpectedApiMode(
      reportMode
    );


  const responseMode =
    detectResponseMode(
      data
    );


  // ====================================================
  // SPECIALITY VISIBILITY
  // ====================================================

  const normalizeSpecialityKey =
    (
      value:
        string
    ) =>
      value
        .trim()
        .toLowerCase();


  const isSpecialityHidden =
    (
      speciality:
        string
    ) =>
      hiddenSpecialities.includes(
        normalizeSpecialityKey(
          speciality
        )
      );


  const filterVisibleSpecialities =
    <
      T extends {
        speciality:
          string;
      }
    >(
      rows:
        T[]
    ):
      T[] =>
      rows.filter(
        (
          row
        ) =>
          !isSpecialityHidden(
            row.speciality
          )
      );


  const toggleSpecialityVisibility =
    (
      speciality:
        string
    ) => {

      const key =
        normalizeSpecialityKey(
          speciality
        );


      setHiddenSpecialities(
        (
          current
        ) =>
          current.includes(
            key
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  key
              )
            : [
                ...current,
                key,
              ]
      );

    };


  const showAllSpecialities =
    () => {

      setHiddenSpecialities(
        []
      );

    };


  useEffect(
    () => {

      try {

        localStorage.setItem(
          "speciality_hidden_specialities",
          JSON.stringify(
            hiddenSpecialities
          )
        );

      }
      catch {

        // Ignore browser storage errors.

      }

    },
    [
      hiddenSpecialities,
    ]
  );


  // ====================================================
  // LOAD REPORT
  // ====================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      const params:
        Record<
          string,
          string |
          number
        > = {};


      const requestedMode =
        getExpectedApiMode(
          reportMode
        );


      if (
        reportMode ===
        "DAILY"
      ) {

        params.mode =
          "DAILY";

        params.date =
          selectedDate;

      }
      else if (
        reportMode ===
        "RANGE"
      ) {

        params.mode =
          "DATE_RANGE";

        params.fromDate =
          rangeFromDate;

        params.toDate =
          rangeToDate;

      }
      else if (
        reportMode ===
        "MONTH"
      ) {

        const [
          year,
          month,
        ] =
          selectedMonth.split(
            "-"
          );


        params.mode =
          "MONTH";

        params.year =
          Number(
            year
          );

        params.month =
          Number(
            month
          );

      }
      else {

        params.mode =
          "YEAR";

        params.year =
          selectedYear;

      }


      if (
        hasFullAccess
      ) {

        params.unit =
          selectedUnit;

      }


      api.get<DashboardResponse>(
        "/speciality/dashboard",
        {
          params,

          signal:
            controller.signal,
        }
      )
        .then(
          (
            response
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              response.data.success &&
              response.data.data
            ) {

              const nextData =
                response.data.data;


              const receivedMode =
                detectResponseMode(
                  nextData
                );


              if (
                !receivedMode
              ) {

                setData(
                  null
                );


                setError(
                  "Unable to identify speciality report response."
                );


                return;

              }


              if (
                receivedMode !==
                requestedMode
              ) {

                setData(
                  null
                );


                setError(
                  `Backend returned ${receivedMode} data while ${requestedMode} report was requested. Please restart the backend server and refresh.`
                );


                return;

              }


              setData(
                nextData
              );


              setError(
                ""
              );


              return;

            }


            setData(
              null
            );


            setError(
              response.data.message ||
              "Unable to load speciality revenue."
            );

          }
        )
        .catch(
          (
            err:
              unknown
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                err
              )
            ) {

              if (
                err.code ===
                "ERR_CANCELED"
              ) {

                return;

              }


              if (
                err.response?.status ===
                401
              ) {

                localStorage.removeItem(
                  "revenue_token"
                );


                localStorage.removeItem(
                  "revenue_user"
                );


                navigate(
                  "/login",
                  {
                    replace:
                      true,
                  }
                );


                return;

              }


              const responseData =
                err.response?.data as
                  | ApiErrorResponse
                  | undefined;


              setData(
                null
              );


              setError(
                responseData?.message ||
                "Unable to load speciality revenue."
              );


              return;

            }


            setData(
              null
            );


            setError(
              "Unable to load speciality revenue."
            );

          }
        )
        .finally(
          () => {

            if (
              active
            ) {

              setLoading(
                false
              );

            }

          }
        );


      return () => {

        active =
          false;


        controller.abort();

      };

    },
    [
      reportMode,
      selectedDate,
      rangeFromDate,
      rangeToDate,
      selectedMonth,
      selectedYear,
      selectedUnit,
      refreshKey,
      hasFullAccess,
      navigate,
    ]
  );


  // ====================================================
  // DOWNLOAD OUTSIDE CLICK
  // ====================================================

  useEffect(
    () => {

      const handleClickOutside =
        (
          event:
            MouseEvent
        ) => {

          if (
            downloadRef.current &&
            !downloadRef.current.contains(
              event.target as Node
            )
          ) {

            setDownloadOpen(
              false
            );

          }


          if (
            variationSortRef.current &&
            !variationSortRef.current.contains(
              event.target as Node
            )
          ) {

            setVariationSortOpen(
              false
            );

          }


          if (
            specialityVisibilityRef.current &&
            !specialityVisibilityRef.current.contains(
              event.target as Node
            )
          ) {

            setSpecialityVisibilityOpen(
              false
            );

          }

        };


      document.addEventListener(
        "mousedown",
        handleClickOutside
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );

      };

    },
    []
  );


  const currentUnit =
    data?.units?.[0] ??
    null;


  const currentSpecialityNames =
    currentUnit &&
    Array.isArray(
      currentUnit.specialities
    )
      ? Array.from(
          new Set(
            currentUnit.specialities
              .map(
                (
                  row
                ) =>
                  row.speciality
              )
              .filter(
                (
                  value
                ) =>
                  Boolean(
                    value
                  )
              )
          )
        )
          .sort(
            (
              a,
              b
            ) =>
              a.localeCompare(
                b
              )
          )
      : [];


  const currentHiddenSpecialityCount =
    currentSpecialityNames.filter(
      (
        speciality
      ) =>
        isSpecialityHidden(
          speciality
        )
    ).length;


  // ====================================================
  // MODE CHANGE
  // ====================================================

  const handleReportModeChange =
    (
      value:
        ReportMode
    ) => {

      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setDownloadOpen(
        false
      );


      if (
        value ===
        "RANGE"
      ) {

        setRangeFromDate(
          `${selectedDate.slice(
            0,
            8
          )}01`
        );


        setRangeToDate(
          selectedDate
        );

      }


      if (
        value ===
        "MONTH"
      ) {

        setSelectedMonth(
          selectedDate.slice(
            0,
            7
          )
        );

      }


      if (
        value ===
        "YEAR"
      ) {

        setSelectedYear(
          Number(
            selectedDate.slice(
              0,
              4
            )
          )
        );

      }


      setReportMode(
        value
      );

    };


  // ====================================================
  // DATE CHANGE
  // ====================================================

  const handleDateChange =
    (
      value:
        string
    ) => {

      if (
        !value
      ) {

        return;

      }


      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setSelectedDate(
        value
      );

    };


  // ====================================================
  // RANGE FROM CHANGE
  // ====================================================

  const handleRangeFromChange =
    (
      value:
        string
    ) => {

      if (
        !value
      ) {

        return;

      }


      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setRangeFromDate(
        value
      );

    };


  // ====================================================
  // RANGE TO CHANGE
  // ====================================================

  const handleRangeToChange =
    (
      value:
        string
    ) => {

      if (
        !value
      ) {

        return;

      }


      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setRangeToDate(
        value
      );

    };


  // ====================================================
  // MONTH CHANGE
  // ====================================================

  const handleMonthChange =
    (
      value:
        string
    ) => {

      if (
        !value
      ) {

        return;

      }


      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setSelectedMonth(
        value
      );

    };


  // ====================================================
  // YEAR CHANGE
  // ====================================================

  const handleYearChange =
    (
      value:
        number
    ) => {

      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setSelectedYear(
        value
      );

    };


  // ====================================================
  // UNIT CHANGE
  // ====================================================

  const handleUnitChange =
    (
      value:
        UnitCode
    ) => {

      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setSelectedUnit(
        value
      );

    };


  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    () => {

      setLoading(
        true
      );


      setData(
        null
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setRefreshKey(
        (
          value
        ) =>
          value +
          1
      );

    };


  // ====================================================
  // PERIOD LABEL
  // ====================================================

  const getPeriodLabel =
    (): string => {

      if (
        reportMode ===
        "DAILY"
      ) {

        return formatDate(
          selectedDate
        );

      }


      if (
        reportMode ===
        "RANGE"
      ) {

        return `${formatDate(
          rangeFromDate
        )} to ${formatDate(
          rangeToDate
        )}`;

      }


      if (
        reportMode ===
        "MONTH"
      ) {

        return formatMonthInput(
          selectedMonth
        );

      }


      return String(
        selectedYear
      );

    };


  // ====================================================
  // FILE PERIOD
  // ====================================================

  const getFilePeriod =
    (): string => {

      if (
        reportMode ===
        "DAILY"
      ) {

        return selectedDate;

      }


      if (
        reportMode ===
        "RANGE"
      ) {

        return `${rangeFromDate}-to-${rangeToDate}`;

      }


      if (
        reportMode ===
        "MONTH"
      ) {

        return selectedMonth;

      }


      return String(
        selectedYear
      );

    };


  // ====================================================
  // SORT DAILY SPECIALITIES BY VARIATION
  // ====================================================

  const sortDailySpecialities =
    (
      rows:
        DailySpecialityRow[]
    ): DailySpecialityRow[] => {

      const sortedRows =
        [
          ...rows,
        ];


      if (
        variationSort ===
        "HIGH_TO_LOW"
      ) {

        sortedRows.sort(
          (
            a,
            b
          ) =>
            calculateVariation(
              b.projection,
              b.LM
            ) -
            calculateVariation(
              a.projection,
              a.LM
            )
        );


        return sortedRows;

      }


      if (
        variationSort ===
        "LOW_TO_HIGH"
      ) {

        sortedRows.sort(
          (
            a,
            b
          ) =>
            calculateVariation(
              a.projection,
              a.LM
            ) -
            calculateVariation(
              b.projection,
              b.LM
            )
        );


        return sortedRows;

      }


      sortedRows.sort(
        (
          a,
          b
        ) =>
          a.serialNo -
          b.serialNo
      );


      return sortedRows;

    };


  // ====================================================
  // EXPORT DEFINITION
  // ====================================================

  const getExportDefinition =
    () => {

      if (
        !data ||
        !currentUnit ||
        !responseMode
      ) {

        return {

          headers:
            [] as string[],

          rows:
            [] as (
              string |
              number
            )[][],

          totalRow:
            [] as (
              string |
              number
            )[],

        };

      }


      if (
        responseMode ===
        "DAILY"
      ) {

        const unit =
          currentUnit as
            DailyUnit;


        const specialities =
          sortDailySpecialities(
            filterVisibleSpecialities(
              Array.isArray(
                unit.specialities
              )
                ? unit.specialities
                : []
            )
          );


        return {

          headers: [
            "SR_NO",
            "SPECIALITY",
            "FTD",
            "MTD",
            "LMTD",
            "LM",
            "PROJECTION",
            "VARIATION",
          ],

          rows:
            specialities.map(
              (
                row
              ) => [

                row.serialNo,

                row.speciality,

                row.FTD,

                row.MTD,

                row.LMTD,

                row.LM,

                row.projection ?? 0,

                calculateVariation(
                  row.projection,
                  row.LM
                ),

              ]
            ),

          totalRow: [

            "",

            "TOTAL",

            unit.totals?.FTD ??
              0,

            unit.totals?.MTD ??
              0,

            unit.totals?.LMTD ??
              0,

            unit.totals?.LM ??
              0,

            unit.totals?.projection ??
              0,

            calculateVariation(
              unit.totals?.projection,
              unit.totals?.LM
            ),

          ],

        };

      }


      if (
        responseMode ===
        "YEAR"
      ) {

        const unit =
          currentUnit as
            YearUnit;


        const specialities =
          filterVisibleSpecialities(
            Array.isArray(
              unit.specialities
            )
              ? unit.specialities
              : []
          );


        const months =
          Array.isArray(
            unit.months
          )
            ? unit.months
            : [];


        return {

          headers: [
            "SR_NO",
            "SPECIALITY",
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
            "TOTAL",
          ],

          rows:
            specialities.map(
              (
                row
              ) => {

                const monthly =
                  Array.isArray(
                    row.monthly
                  )
                    ? row.monthly
                    : [];


                return [

                  row.serialNo,

                  row.speciality,

                  ...Array.from(
                    {
                      length:
                        12,
                    },
                    (
                      _,
                      index
                    ) =>
                      monthly[
                        index
                      ]?.amount ??
                      0
                  ),

                  row.total ??
                    0,

                ];

              }
            ),

          totalRow: [

            "",

            "TOTAL",

            ...Array.from(
              {
                length:
                  12,
              },
              (
                _,
                index
              ) =>
                months[
                  index
                ]?.total ??
                0
            ),

            unit.total ??
              0,

          ],

        };

      }


      const unit =
        currentUnit as
          RangeUnit |
          MonthUnit;


      const specialities =
        filterVisibleSpecialities(
          Array.isArray(
            unit.specialities
          )
            ? unit.specialities
            : []
        );


      return {

        headers: [
          "SR_NO",
          "SPECIALITY",
          "REVENUE",
        ],

        rows:
          specialities.map(
            (
              row
            ) => [

              row.serialNo,

              row.speciality,

              row.amount,

            ]
          ),

        totalRow: [

          "",

          "TOTAL",

          unit.total ??
            0,

        ],

      };

    };


  // ====================================================
  // EXCEL
  // ====================================================

  const exportExcel =
    () => {

      if (
        !data ||
        !currentUnit
      ) {

        return;

      }


      const definition =
        getExportDefinition();


      const workbook =
        XLSX.utils.book_new();


      const summaryRows = [

        [
          "Field",
          "Value",
        ],

        [
          "Unit",
          `${currentUnit.unitCode} - ${currentUnit.unitName}`,
        ],

        [
          "Report",
          REPORT_OPTIONS.find(
            (
              item
            ) =>
              item.value ===
              reportMode
          )?.label ??
          reportMode,
        ],

        [
          "Period",
          getPeriodLabel(),
        ],

        [
          "Amount Unit",
          "INR",
        ],

      ];


      if (
        responseMode ===
        "DAILY"
      ) {

        const dailyData =
          data as
            DailyData;


        const dailyUnit =
          currentUnit as
            DailyUnit;


        summaryRows.push(
          [
            "Projection Formula",
            "MTD x Days In Month / Selected Day",
          ],
          [
            "Selected Day",
            String(
              dailyData.selectedDay ??
              dailyUnit.projectionMeta?.selectedDay ??
              "-"
            ),
          ],
          [
            "Days In Month",
            String(
              dailyData.daysInMonth ??
              dailyUnit.projectionMeta?.daysInMonth ??
              "-"
            ),
          ]
        );

      }


      const summarySheet =
        XLSX.utils.aoa_to_sheet(
          summaryRows
        );


      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );


      const detailSheet =
        XLSX.utils.aoa_to_sheet([

          definition.headers,

          ...definition.rows,

          definition.totalRow,

        ]);


      detailSheet["!cols"] =
        definition.headers.map(
          (
            header,
            index
          ) => ({

            wch:
              index ===
                1
                ? 30
                : Math.max(
                    12,
                    header.length +
                    4
                  ),

          })
        );


      XLSX.utils.book_append_sheet(
        workbook,
        detailSheet,
        "Speciality Revenue"
      );


      XLSX.writeFile(
        workbook,
        `Speciality-Revenue-${safeFileName(
          currentUnit.unitCode
        )}-${safeFileName(
          getFilePeriod()
        )}.xlsx`
      );

    };


  // ====================================================
  // CSV
  // ====================================================

  const exportCsv =
    () => {

      if (
        !currentUnit
      ) {

        return;

      }


      const definition =
        getExportDefinition();


      const rows = [

        definition.headers,

        ...definition.rows,

        definition.totalRow,

      ];


      const csv =
        rows
          .map(
            (
              row
            ) =>
              row
                .map(
                  (
                    cell
                  ) =>
                    `"${String(
                      cell
                    ).replaceAll(
                      "\"",
                      "\"\""
                    )}"`
                )
                .join(
                  ","
                )
          )
          .join(
            "\r\n"
          );


      const blob =
        new Blob(
          [
            "\uFEFF",
            csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const anchor =
        document.createElement(
          "a"
        );


      anchor.href =
        url;


      anchor.download =
        `Speciality-Revenue-${currentUnit.unitCode}-${safeFileName(
          getFilePeriod()
        )}.csv`;


      document.body.appendChild(
        anchor
      );


      anchor.click();


      document.body.removeChild(
        anchor
      );


      URL.revokeObjectURL(
        url
      );

    };


  // ====================================================
  // PDF
  // ====================================================

  const exportPdf =
    () => {

      if (
        !currentUnit
      ) {

        return;

      }


      const definition =
        getExportDefinition();


      const pdf =
        new jsPDF({

          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",

        });


      pdf.setFontSize(
        15
      );


      pdf.text(
        "Aayush Group of Hospitals - Speciality Revenue",
        14,
        14
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        `Unit: ${currentUnit.unitCode} - ${currentUnit.unitName}`,
        14,
        20
      );


      pdf.text(
        `Report: ${
          REPORT_OPTIONS.find(
            (
              item
            ) =>
              item.value ===
              reportMode
          )?.label ??
          reportMode
        } | Period: ${getPeriodLabel()}`,
        14,
        25
      );


      const body =
        definition.rows.map(
          (
            row
          ) =>
            row.map(
              (
                cell,
                index
              ) =>
                index >=
                  2 &&
                typeof cell ===
                  "number"
                  ? formatExportMoney(
                      cell
                    )
                  : String(
                      cell
                    )
            )
        );


      body.push(
        definition.totalRow.map(
          (
            cell,
            index
          ) =>
            index >=
              2 &&
            typeof cell ===
              "number"
              ? formatExportMoney(
                  cell
                )
              : String(
                  cell
                )
        )
      );


      autoTable(
        pdf,
        {
          startY:
            31,

          head: [
            definition.headers,
          ],

          body,

          theme:
            "grid",

          styles: {

            fontSize:
              reportMode ===
              "YEAR"
                ? 5.5
                : 8,

            cellPadding:
              reportMode ===
              "YEAR"
                ? 1.25
                : 2.1,

          },

          headStyles: {

            fontStyle:
              "bold",

          },

          didParseCell:
            (
              hookData
            ) => {

              if (
                hookData.section ===
                  "body" &&
                Array.isArray(
                  hookData.row.raw
                ) &&
                hookData.row.raw[
                  1
                ] ===
                  "TOTAL"
              ) {

                hookData.cell.styles.fontStyle =
                  "bold";

              }

            },

        }
      );


      pdf.save(
        `Speciality-Revenue-${currentUnit.unitCode}-${safeFileName(
          getFilePeriod()
        )}.pdf`
      );

    };


  // ====================================================
  // ALL UNITS DOWNLOAD DATA
  //
  // Full-access backend behavior:
  // when the unit query parameter is omitted,
  // the speciality dashboard returns all units.
  // ====================================================

  type ExportUnit =
    | DailyUnit
    | RangeUnit
    | MonthUnit
    | YearUnit;


  type ExportDefinition = {

    headers:
      string[];

    rows:
      (
        string |
        number
      )[][];

    totalRow:
      (
        string |
        number
      )[];

  };


  const getAllUnitsRequestParams =
    ():
      Record<
        string,
        string |
        number
      > => {

      const params:
        Record<
          string,
          string |
          number
        > = {};


      if (
        reportMode ===
        "DAILY"
      ) {

        params.mode =
          "DAILY";

        params.date =
          selectedDate;

      }
      else if (
        reportMode ===
        "RANGE"
      ) {

        params.mode =
          "DATE_RANGE";

        params.fromDate =
          rangeFromDate;

        params.toDate =
          rangeToDate;

      }
      else if (
        reportMode ===
        "MONTH"
      ) {

        const [
          year,
          month,
        ] =
          selectedMonth.split(
            "-"
          );


        params.mode =
          "MONTH";

        params.year =
          Number(
            year
          );

        params.month =
          Number(
            month
          );

      }
      else {

        params.mode =
          "YEAR";

        params.year =
          selectedYear;

      }


      return params;

    };


  const fetchAllUnitsData =
    async ():
      Promise<SpecialityData> => {

      if (
        !hasFullAccess
      ) {

        throw new Error(
          "All Units download is available only for full-access users."
        );

      }


      const response =
        await api.get<DashboardResponse>(
          "/speciality/dashboard",
          {
            params:
              getAllUnitsRequestParams(),
          }
        );


      if (
        !response.data.success ||
        !response.data.data
      ) {

        throw new Error(
          response.data.message ||
          "Unable to load All Units speciality revenue."
        );

      }


      const allUnitsData =
        response.data.data;


      const receivedMode =
        detectResponseMode(
          allUnitsData
        );


      if (
        !receivedMode ||
        receivedMode !==
          expectedApiMode
      ) {

        throw new Error(
          "Backend returned an unexpected speciality report response."
        );

      }


      if (
        !Array.isArray(
          allUnitsData.units
        ) ||
        allUnitsData.units.length ===
          0
      ) {

        throw new Error(
          "No All Units speciality revenue data is available for this period."
        );

      }


      return allUnitsData;

    };


  const sortExportUnits =
    (
      units:
        ExportUnit[]
    ):
      ExportUnit[] => {

      const order =
        new Map(
          UNITS.map(
            (
              unit,
              index
            ) => [
              unit[0],
              index,
            ]
          )
        );


      return [
        ...units,
      ].sort(
        (
          a,
          b
        ) => {

          const aOrder =
            order.get(
              a.unitCode as
                UnitCode
            ) ??
            999;


          const bOrder =
            order.get(
              b.unitCode as
                UnitCode
            ) ??
            999;


          return aOrder -
            bOrder;

        }
      );

    };


  const getExportDefinitionForUnit =
    (
      reportData:
        SpecialityData,

      unit:
        ExportUnit
    ):
      ExportDefinition => {

      const mode =
        detectResponseMode(
          reportData
        );


      if (
        mode ===
        "DAILY"
      ) {

        const dailyUnit =
          unit as
            DailyUnit;


        const specialities =
          sortDailySpecialities(
            filterVisibleSpecialities(
              Array.isArray(
                dailyUnit.specialities
              )
                ? dailyUnit.specialities
                : []
            )
          );


        return {

          headers: [
            "SR_NO",
            "SPECIALITY",
            "FTD",
            "MTD",
            "LMTD",
            "LM",
            "PROJECTION",
            "VARIATION",
          ],

          rows:
            specialities.map(
              (
                row
              ) => [

                row.serialNo,

                row.speciality,

                row.FTD,

                row.MTD,

                row.LMTD,

                row.LM,

                row.projection ??
                  0,

                calculateVariation(
                  row.projection,
                  row.LM
                ),

              ]
            ),

          totalRow: [

            "",

            "TOTAL",

            dailyUnit.totals?.FTD ??
              0,

            dailyUnit.totals?.MTD ??
              0,

            dailyUnit.totals?.LMTD ??
              0,

            dailyUnit.totals?.LM ??
              0,

            dailyUnit.totals?.projection ??
              0,

            calculateVariation(
              dailyUnit.totals?.projection,
              dailyUnit.totals?.LM
            ),

          ],

        };

      }


      if (
        mode ===
        "YEAR"
      ) {

        const yearUnit =
          unit as
            YearUnit;


        const specialities =
          filterVisibleSpecialities(
            Array.isArray(
              yearUnit.specialities
            )
              ? yearUnit.specialities
              : []
          );


        const months =
          Array.isArray(
            yearUnit.months
          )
            ? yearUnit.months
            : [];


        return {

          headers: [
            "SR_NO",
            "SPECIALITY",
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
            "TOTAL",
          ],

          rows:
            specialities.map(
              (
                row
              ) => {

                const monthly =
                  Array.isArray(
                    row.monthly
                  )
                    ? row.monthly
                    : [];


                return [

                  row.serialNo,

                  row.speciality,

                  ...Array.from(
                    {
                      length:
                        12,
                    },
                    (
                      _,
                      index
                    ) =>
                      monthly[
                        index
                      ]?.amount ??
                      0
                  ),

                  row.total ??
                    0,

                ];

              }
            ),

          totalRow: [

            "",

            "TOTAL",

            ...Array.from(
              {
                length:
                  12,
              },
              (
                _,
                index
              ) =>
                months[
                  index
                ]?.total ??
                0
            ),

            yearUnit.total ??
              0,

          ],

        };

      }


      const simpleUnit =
        unit as
          RangeUnit |
          MonthUnit;


      const specialities =
        filterVisibleSpecialities(
          Array.isArray(
            simpleUnit.specialities
          )
            ? simpleUnit.specialities
            : []
        );


      return {

        headers: [
          "SR_NO",
          "SPECIALITY",
          "REVENUE",
        ],

        rows:
          specialities.map(
            (
              row
            ) => [

              row.serialNo,

              row.speciality,

              row.amount,

            ]
          ),

        totalRow: [

          "",

          "TOTAL",

          simpleUnit.total ??
            0,

        ],

      };

    };


  const getAllUnitsSummaryDefinition =
    (
      reportData:
        SpecialityData
    ):
      ExportDefinition => {

      const mode =
        detectResponseMode(
          reportData
        );


      const units =
        sortExportUnits(
          reportData.units as
            ExportUnit[]
        );


      if (
        mode ===
        "DAILY"
      ) {

        const dailyUnits =
          units as
            DailyUnit[];


        const rows =
          dailyUnits.map(
            (
              unit
            ) => [

              `${unit.unitCode} - ${unit.unitName}`,

              unit.totals?.FTD ??
                0,

              unit.totals?.MTD ??
                0,

              unit.totals?.LMTD ??
                0,

              unit.totals?.LM ??
                0,

              unit.totals?.projection ??
                0,

              calculateVariation(
                unit.totals?.projection,
                unit.totals?.LM
              ),

            ]
          );


        return {

          headers: [
            "UNIT",
            "FTD",
            "MTD",
            "LMTD",
            "LM",
            "PROJECTION",
            "VARIATION",
          ],

          rows,

          totalRow: [

            "GROUP TOTAL",

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.totals?.FTD ??
                  0
                ),
              0
            ),

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.totals?.MTD ??
                  0
                ),
              0
            ),

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.totals?.LMTD ??
                  0
                ),
              0
            ),

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.totals?.LM ??
                  0
                ),
              0
            ),

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.totals?.projection ??
                  0
                ),
              0
            ),

            dailyUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                calculateVariation(
                  unit.totals?.projection,
                  unit.totals?.LM
                ),
              0
            ),

          ],

        };

      }


      if (
        mode ===
        "YEAR"
      ) {

        const yearUnits =
          units as
            YearUnit[];


        const rows =
          yearUnits.map(
            (
              unit
            ) => {

              const months =
                Array.isArray(
                  unit.months
                )
                  ? unit.months
                  : [];


              return [

                `${unit.unitCode} - ${unit.unitName}`,

                ...Array.from(
                  {
                    length:
                      12,
                  },
                  (
                    _,
                    index
                  ) =>
                    months[
                      index
                    ]?.total ??
                    0
                ),

                unit.total ??
                  0,

              ];

            }
          );


        return {

          headers: [
            "UNIT",
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
            "TOTAL",
          ],

          rows,

          totalRow: [

            "GROUP TOTAL",

            ...Array.from(
              {
                length:
                  12,
              },
              (
                _,
                monthIndex
              ) =>
                yearUnits.reduce(
                  (
                    total,
                    unit
                  ) => {

                    const months =
                      Array.isArray(
                        unit.months
                      )
                        ? unit.months
                        : [];


                    return total +
                      Number(
                        months[
                          monthIndex
                        ]?.total ??
                        0
                      );

                  },
                  0
                )
            ),

            yearUnits.reduce(
              (
                total,
                unit
              ) =>
                total +
                Number(
                  unit.total ??
                  0
                ),
              0
            ),

          ],

        };

      }


      const simpleUnits =
        units as
          (
            RangeUnit |
            MonthUnit
          )[];


      return {

        headers: [
          "UNIT",
          "REVENUE",
        ],

        rows:
          simpleUnits.map(
            (
              unit
            ) => [

              `${unit.unitCode} - ${unit.unitName}`,

              unit.total ??
                0,

            ]
          ),

        totalRow: [

          "GROUP TOTAL",

          simpleUnits.reduce(
            (
              total,
              unit
            ) =>
              total +
              Number(
                unit.total ??
                0
              ),
            0
          ),

        ],

      };

    };


  const formatExportRows =
    (
      definition:
        ExportDefinition,

      numericStartIndex:
        number
    ) => {

      const rows = [

        ...definition.rows,

        definition.totalRow,

      ];


      return rows.map(
        (
          row
        ) =>
          row.map(
            (
              cell,
              index
            ) =>
              index >=
                numericStartIndex &&
              typeof cell ===
                "number"
                ? formatExportMoney(
                    cell
                  )
                : String(
                    cell
                  )
          )
      );

    };


  const exportAllUnitsExcel =
    (
      reportData:
        SpecialityData
    ) => {

      const units =
        sortExportUnits(
          reportData.units as
            ExportUnit[]
        );


      const summary =
        getAllUnitsSummaryDefinition(
          reportData
        );


      const workbook =
        XLSX.utils.book_new();


      const summarySheet =
        XLSX.utils.aoa_to_sheet([

          [
            "AAYUSH GROUP OF HOSPITALS",
          ],

          [
            "ALL UNITS SPECIALITY REVENUE REPORT",
          ],

          [
            "Report",
            REPORT_OPTIONS.find(
              (
                item
              ) =>
                item.value ===
                reportMode
            )?.label ??
            reportMode,
          ],

          [
            "Period",
            getPeriodLabel(),
          ],

          [
            "Amount Unit",
            "INR",
          ],

          [],

          summary.headers,

          ...summary.rows,

          summary.totalRow,

        ]);


      summarySheet[
        "!cols"
      ] =
        summary.headers.map(
          (
            header,
            index
          ) => ({

            wch:
              index ===
                0
                ? 24
                : Math.max(
                    13,
                    header.length +
                    3
                  ),

          })
        );


      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Group Summary"
      );


      units.forEach(
        (
          unit
        ) => {

          const definition =
            getExportDefinitionForUnit(
              reportData,
              unit
            );


          const detailSheet =
            XLSX.utils.aoa_to_sheet([

              [
                "AAYUSH GROUP OF HOSPITALS",
              ],

              [
                "SPECIALITY REVENUE REPORT",
              ],

              [
                "Unit",
                `${unit.unitCode} - ${unit.unitName}`,
              ],

              [
                "Period",
                getPeriodLabel(),
              ],

              [],

              definition.headers,

              ...definition.rows,

              definition.totalRow,

            ]);


          detailSheet[
            "!cols"
          ] =
            definition.headers.map(
              (
                header,
                index
              ) => ({

                wch:
                  index ===
                    1
                    ? 30
                    : Math.max(
                        12,
                        header.length +
                        3
                      ),

              })
            );


          const sheetName =
            `${unit.unitCode} - ${unit.unitName}`
              .slice(
                0,
                31
              );


          XLSX.utils.book_append_sheet(
            workbook,
            detailSheet,
            sheetName
          );

        }
      );


      XLSX.writeFile(
        workbook,
        `Speciality-Revenue-All-Units-${safeFileName(
          getFilePeriod()
        )}.xlsx`
      );

    };


  const exportAllUnitsPdf =
    (
      reportData:
        SpecialityData
    ) => {

      const mode =
        detectResponseMode(
          reportData
        );


      if (
        !mode
      ) {

        throw new Error(
          "Unable to identify All Units speciality report."
        );

      }


      const units =
        sortExportUnits(
          reportData.units as
            ExportUnit[]
        );


      const summary =
        getAllUnitsSummaryDefinition(
          reportData
        );


      const pdf =
        new jsPDF({

          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",

        });


      // ================================================
      // PAGE 1 - GROUP SUMMARY
      // ================================================

      pdf.setFontSize(
        16
      );


      pdf.text(
        "Aayush Group of Hospitals - Speciality Revenue",
        14,
        14
      );


      pdf.setFontSize(
        11
      );


      pdf.text(
        "All Units - Group Summary",
        14,
        21
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        `Report: ${
          REPORT_OPTIONS.find(
            (
              item
            ) =>
              item.value ===
              reportMode
          )?.label ??
          reportMode
        } | Period: ${getPeriodLabel()} | Amount: INR`,
        14,
        27
      );


      autoTable(
        pdf,
        {
          startY:
            33,

          head: [
            summary.headers,
          ],

          body:
            formatExportRows(
              summary,
              1
            ),

          theme:
            "grid",

          styles: {

            fontSize:
              mode ===
              "YEAR"
                ? 6
                : 8,

            cellPadding:
              mode ===
              "YEAR"
                ? 1.4
                : 2.1,

          },

          headStyles: {

            fontStyle:
              "bold",

          },

          didParseCell:
            (
              hookData
            ) => {

              if (
                hookData.section ===
                  "body" &&
                Array.isArray(
                  hookData.row.raw
                ) &&
                hookData.row.raw[
                  0
                ] ===
                  "GROUP TOTAL"
              ) {

                hookData.cell.styles.fontStyle =
                  "bold";

              }

            },

        }
      );


      // ================================================
      // ONE UNIT PER SECTION / PAGE
      // ================================================

      units.forEach(
        (
          unit
        ) => {

          pdf.addPage();


          const definition =
            getExportDefinitionForUnit(
              reportData,
              unit
            );


          pdf.setFontSize(
            15
          );


          pdf.text(
            "Aayush Group of Hospitals - Speciality Revenue",
            14,
            14
          );


          pdf.setFontSize(
            10
          );


          pdf.text(
            `Unit: ${unit.unitCode} - ${unit.unitName}`,
            14,
            21
          );


          pdf.setFontSize(
            9
          );


          pdf.text(
            `Report: ${
              REPORT_OPTIONS.find(
                (
                  item
                ) =>
                  item.value ===
                  reportMode
              )?.label ??
              reportMode
            } | Period: ${getPeriodLabel()}`,
            14,
            27
          );


          autoTable(
            pdf,
            {
              startY:
                33,

              head: [
                definition.headers,
              ],

              body:
                formatExportRows(
                  definition,
                  2
                ),

              theme:
                "grid",

              styles: {

                fontSize:
                  mode ===
                  "YEAR"
                    ? 5.5
                    : 8,

                cellPadding:
                  mode ===
                  "YEAR"
                    ? 1.25
                    : 2.1,

              },

              headStyles: {

                fontStyle:
                  "bold",

              },

              didParseCell:
                (
                  hookData
                ) => {

                  if (
                    hookData.section ===
                      "body" &&
                    Array.isArray(
                      hookData.row.raw
                    ) &&
                    hookData.row.raw[
                      1
                    ] ===
                      "TOTAL"
                  ) {

                    hookData.cell.styles.fontStyle =
                      "bold";

                  }

                },

            }
          );

        }
      );


      const totalPages =
        pdf.getNumberOfPages();


      for (
        let pageNumber =
          1;
        pageNumber <=
          totalPages;
        pageNumber +=
          1
      ) {

        pdf.setPage(
          pageNumber
        );


        pdf.setFontSize(
          7
        );


        pdf.text(
          `Page ${pageNumber} of ${totalPages}`,
          282,
          204,
          {
            align:
              "right",
          }
        );

      }


      pdf.save(
        `Speciality-Revenue-All-Units-${safeFileName(
          getFilePeriod()
        )}.pdf`
      );

    };


  // ====================================================
  // PNG
  // ====================================================

  const exportPng =
    async () => {

      const element =
        reportSnapshotRef.current;


      if (
        !element
      ) {

        throw new Error(
          "Speciality report is not available."
        );

      }


      setDownloadOpen(
        false
      );


      const canvas =
        await (
          async () => {

            element.classList.add(
              "sr-exporting"
            );


            try {

              await new Promise<void>(
                (
                  resolve
                ) => {

                  requestAnimationFrame(
                    () => {

                      requestAnimationFrame(
                        () =>
                          resolve()
                      );

                    }
                  );

                }
              );


              return await html2canvas(
                element,
                {
                  backgroundColor:
                    "#f3f8f9",

                  scale:
                    2,

                  useCORS:
                    true,

                  logging:
                    false,

                  windowWidth:
                    reportMode ===
                    "YEAR"
                      ? 1800
                      : 1400,
                }
              );

            }
            finally {

              element.classList.remove(
                "sr-exporting"
              );

            }

          }
        )();


      const blob =
        await new Promise<Blob>(
          (
            resolve,
            reject
          ) => {

            canvas.toBlob(
              (
                createdBlob
              ) => {

                if (
                  !createdBlob
                ) {

                  reject(
                    new Error(
                      "Unable to create PNG."
                    )
                  );


                  return;

                }


                resolve(
                  createdBlob
                );

              },
              "image/png",
              1
            );

          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const anchor =
        document.createElement(
          "a"
        );


      anchor.href =
        url;


      anchor.download =
        `Speciality-Revenue-${currentUnit?.unitCode ?? "Unit"}-${safeFileName(
          getFilePeriod()
        )}.png`;


      document.body.appendChild(
        anchor
      );


      anchor.click();


      document.body.removeChild(
        anchor
      );


      URL.revokeObjectURL(
        url
      );

    };


  // ====================================================
  // DOWNLOAD
  // ====================================================

  const handleDownload =
    async (
      format:
        DownloadFormat
    ) => {

      setDownloadError(
        ""
      );


      if (
        !currentUnit
      ) {

        setDownloadError(
          "No speciality revenue data is available."
        );


        return;

      }


      try {

        setDownloadLoading(
          true
        );


        if (
          format ===
          "ALL_EXCEL" ||
          format ===
          "ALL_PDF"
        ) {

          const allUnitsData =
            await fetchAllUnitsData();


          if (
            format ===
            "ALL_EXCEL"
          ) {

            exportAllUnitsExcel(
              allUnitsData
            );

          }
          else {

            exportAllUnitsPdf(
              allUnitsData
            );

          }

        }
        else if (
          format ===
          "EXCEL"
        ) {

          exportExcel();

        }
        else if (
          format ===
          "CSV"
        ) {

          exportCsv();

        }
        else if (
          format ===
          "PDF"
        ) {

          exportPdf();

        }
        else {

          await exportPng();

        }


        setDownloadOpen(
          false
        );

      }
      catch (
        err:
          unknown
      ) {

        if (
          err instanceof Error
        ) {

          setDownloadError(
            err.message
          );

        }
        else {

          setDownloadError(
            "Unable to prepare download."
          );

        }

      }
      finally {

        setDownloadLoading(
          false
        );

      }

    };


  // ====================================================
  // YEAR OPTIONS
  // ====================================================

  const yearOptions =
    Array.from(
      {
        length:
          11,
      },
      (
        _,
        index
      ) =>
        new Date()
          .getFullYear() -
        5 +
        index
    );


  // ====================================================
  // SUMMARY
  // ====================================================

  const renderSummary =
    () => {

      if (
        !data ||
        !currentUnit ||
        !responseMode
      ) {

        return null;

      }


      if (
        responseMode ===
        "DAILY"
      ) {

        const dailyData =
          data as
            DailyData;


        const unit =
          currentUnit as
            DailyUnit;


        return (

          <section className="sr-summary-grid sr-summary-grid-five">

            <div className="sr-summary-card">

              <span>
                FTD Speciality Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.totals?.FTD
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                MTD Speciality Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.totals?.MTD
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                LMTD Speciality Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.totals?.LMTD
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                LM Speciality Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.totals?.LM
                  )
                }
              </strong>

              <small>
                Full {
                  formatMonthFromDate(
                    dailyData
                      .previousMonthEndDate
                  )
                }
              </small>

            </div>


            <div className="sr-summary-card sr-projection-card">

              <span>
                Projection Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.totals?.projection
                  )
                }
              </strong>

            </div>

          </section>

        );

      }


      if (
        responseMode ===
        "DATE_RANGE"
      ) {

        const rangeData =
          data as
            RangeData;


        const unit =
          currentUnit as
            RangeUnit;


        return (

          <section className="sr-summary-grid">

            <div className="sr-summary-card">

              <span>
                Range Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.total
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                From Date
              </span>

              <strong className="sr-summary-text">
                {
                  formatDate(
                    rangeData.fromDate
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                To Date
              </span>

              <strong className="sr-summary-text">
                {
                  formatDate(
                    rangeData.toDate
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                Days With Data
              </span>

              <strong>
                {
                  unit.daysWithData ??
                  0
                }/{
                  unit.expectedDays ??
                  rangeData.days ??
                  0
                }
              </strong>

            </div>

          </section>

        );

      }


      if (
        responseMode ===
        "MONTH"
      ) {

        const monthData =
          data as
            MonthData;


        const unit =
          currentUnit as
            MonthUnit;


        return (

          <section className="sr-summary-grid">

            <div className="sr-summary-card">

              <span>
                Month Revenue
              </span>

              <strong>
                {
                  formatMoney(
                    unit.total
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                Selected Month
              </span>

              <strong className="sr-summary-text">

                {
                  monthData.monthName
                } {
                  monthData.year
                }

              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                Data As Of
              </span>

              <strong className="sr-summary-text">
                {
                  formatDate(
                    unit.sourceBusinessDate
                  )
                }
              </strong>

            </div>


            <div className="sr-summary-card">

              <span>
                Specialities
              </span>

              <strong>
                {
                  unit.totalSpecialities ??
                  0
                }
              </strong>

            </div>

          </section>

        );

      }


      const yearData =
        data as
          YearData;


      const unit =
        currentUnit as
          YearUnit;


      const months =
        Array.isArray(
          unit.months
        )
          ? unit.months
          : [];


      const availableMonths =
        months.filter(
          (
            item
          ) =>
            item.available
        ).length;


      return (

        <section className="sr-summary-grid">

          <div className="sr-summary-card">

            <span>
              Year Revenue
            </span>

            <strong>
              {
                formatMoney(
                  unit.total
                )
              }
            </strong>

          </div>


          <div className="sr-summary-card">

            <span>
              Selected Year
            </span>

            <strong>
              {
                yearData.year
              }
            </strong>

          </div>


          <div className="sr-summary-card">

            <span>
              Months Available
            </span>

            <strong>
              {availableMonths}/12
            </strong>

          </div>


          <div className="sr-summary-card">

            <span>
              Specialities
            </span>

            <strong>
              {
                unit.totalSpecialities ??
                0
              }
            </strong>

          </div>

        </section>

      );

    };


  // ====================================================
  // TABLE
  // ====================================================

  const renderTable =
    () => {

      if (
        !data ||
        !currentUnit ||
        !responseMode
      ) {

        return null;

      }


      if (
        responseMode ===
        "DAILY"
      ) {

        const unit =
          currentUnit as
            DailyUnit;


        const rows =
          sortDailySpecialities(
            filterVisibleSpecialities(
              Array.isArray(
                unit.specialities
              )
                ? unit.specialities
                : []
            )
          );


        const totalVariation =
          calculateVariation(
            unit.totals?.projection,
            unit.totals?.LM
          );


        return (

          <table className="sr-daily-table">

            <thead>

              <tr>

                <th className="sr-col-number">
                  SR_NO
                </th>

                <th className="sr-col-speciality">
                  SPECIALITY
                </th>

                <th>
                  FTD
                </th>

                <th>
                  MTD
                </th>

                <th>
                  LMTD
                </th>

                <th>
                  LM
                </th>

                <th className="sr-projection-column">
                  PROJECTION
                </th>

                <th className="sr-variation-column">
                  VARIATION
                </th>

              </tr>

            </thead>


            <tbody>

              {
                rows.map(
                  (
                    row
                  ) => (

                    <tr
                      key={
                        `${row.serialNo}-${row.speciality}`
                      }
                    >

                      <td>
                        {row.serialNo}
                      </td>

                      <td className="sr-speciality-cell">

                        <strong>
                          {row.speciality}
                        </strong>

                      </td>

                      <td>
                        {
                          formatMoney(
                            row.FTD
                          )
                        }
                      </td>

                      <td>
                        {
                          formatMoney(
                            row.MTD
                          )
                        }
                      </td>

                      <td>
                        {
                          formatMoney(
                            row.LMTD
                          )
                        }
                      </td>

                      <td>
                        {
                          formatMoney(
                            row.LM
                          )
                        }
                      </td>

                      <td className="sr-projection-value">
                        {
                          formatMoney(
                            row.projection
                          )
                        }
                      </td>

                      <td
                        className={
                          `sr-variation-value ${getVariationClass(
                            calculateVariation(
                              row.projection,
                              row.LM
                            )
                          )}`
                        }
                      >
                        {
                          formatSignedMoney(
                            calculateVariation(
                              row.projection,
                              row.LM
                            )
                          )
                        }
                      </td>

                    </tr>

                  )
                )
              }


              <tr className="sr-total-row">

                <td />

                <td>
                  TOTAL
                </td>

                <td>
                  {
                    formatMoney(
                      unit.totals?.FTD
                    )
                  }
                </td>

                <td>
                  {
                    formatMoney(
                      unit.totals?.MTD
                    )
                  }
                </td>

                <td>
                  {
                    formatMoney(
                      unit.totals?.LMTD
                    )
                  }
                </td>

                <td>
                  {
                    formatMoney(
                      unit.totals?.LM
                    )
                  }
                </td>

                <td className="sr-projection-value">
                  {
                    formatMoney(
                      unit.totals?.projection
                    )
                  }
                </td>

                <td
                  className={
                    `sr-variation-value ${getVariationClass(
                      totalVariation
                    )}`
                  }
                >
                  {
                    formatSignedMoney(
                      totalVariation
                    )
                  }
                </td>

              </tr>

            </tbody>

          </table>

        );

      }


      if (
        responseMode ===
        "YEAR"
      ) {

        const unit =
          currentUnit as
            YearUnit;


        const rows =
          filterVisibleSpecialities(
            Array.isArray(
              unit.specialities
            )
              ? unit.specialities
              : []
          );


        const months =
          Array.isArray(
            unit.months
          )
            ? unit.months
            : [];


        return (

          <table className="sr-year-table">

            <thead>

              <tr>

                <th className="sr-col-number">
                  SR_NO
                </th>

                <th className="sr-col-speciality">
                  SPECIALITY
                </th>

                {
                  [
                    "JAN",
                    "FEB",
                    "MAR",
                    "APR",
                    "MAY",
                    "JUN",
                    "JUL",
                    "AUG",
                    "SEP",
                    "OCT",
                    "NOV",
                    "DEC",
                  ].map(
                    (
                      month
                    ) => (

                      <th
                        key={
                          month
                        }
                      >
                        {month}
                      </th>

                    )
                  )
                }

                <th>
                  TOTAL
                </th>

              </tr>

            </thead>


            <tbody>

              {
                rows.map(
                  (
                    row
                  ) => {

                    const monthly =
                      Array.isArray(
                        row.monthly
                      )
                        ? row.monthly
                        : [];


                    return (

                      <tr
                        key={
                          `${row.serialNo}-${row.speciality}`
                        }
                      >

                        <td>
                          {row.serialNo}
                        </td>

                        <td className="sr-speciality-cell">

                          <strong>
                            {row.speciality}
                          </strong>

                        </td>

                        {
                          Array.from(
                            {
                              length:
                                12,
                            },
                            (
                              _,
                              index
                            ) => (

                              <td
                                key={
                                  index
                                }
                              >
                                {
                                  formatMoney(
                                    monthly[
                                      index
                                    ]?.amount ??
                                    0
                                  )
                                }
                              </td>

                            )
                          )
                        }

                        <td className="sr-year-total">
                          {
                            formatMoney(
                              row.total
                            )
                          }
                        </td>

                      </tr>

                    );

                  }
                )
              }


              <tr className="sr-total-row">

                <td />

                <td>
                  TOTAL
                </td>

                {
                  Array.from(
                    {
                      length:
                        12,
                    },
                    (
                      _,
                      index
                    ) => (

                      <td
                        key={
                          index
                        }
                      >
                        {
                          formatMoney(
                            months[
                              index
                            ]?.total ??
                            0
                          )
                        }
                      </td>

                    )
                  )
                }

                <td>
                  {
                    formatMoney(
                      unit.total
                    )
                  }
                </td>

              </tr>

            </tbody>

          </table>

        );

      }


      const unit =
        currentUnit as
          RangeUnit |
          MonthUnit;


      const rows =
        filterVisibleSpecialities(
          Array.isArray(
            unit.specialities
          )
            ? unit.specialities
            : []
        );


      return (

        <table className="sr-simple-table">

          <thead>

            <tr>

              <th className="sr-col-number">
                SR_NO
              </th>

              <th className="sr-col-speciality">
                SPECIALITY
              </th>

              <th>
                REVENUE
              </th>

            </tr>

          </thead>


          <tbody>

            {
              rows.map(
                (
                  row
                ) => (

                  <tr
                    key={
                      `${row.serialNo}-${row.speciality}`
                    }
                  >

                    <td>
                      {row.serialNo}
                    </td>

                    <td className="sr-speciality-cell">

                      <strong>
                        {row.speciality}
                      </strong>

                    </td>

                    <td>
                      {
                        formatMoney(
                          row.amount
                        )
                      }
                    </td>

                  </tr>

                )
              )
            }


            <tr className="sr-total-row">

              <td />

              <td>
                TOTAL
              </td>

              <td>
                {
                  formatMoney(
                    unit.total
                  )
                }
              </td>

            </tr>

          </tbody>

        </table>

      );

    };


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="speciality-revenue-page">

      {/* HEADER */}

      <section className="sr-page-header">

        <div>

          <p className="sr-eyebrow">
            Aayush Group of Hospitals
          </p>


          <h1>
            Speciality Revenue
          </h1>



        </div>


        <div className="sr-header-icon">

          <Activity
            size={28}
          />

        </div>

      </section>


      {/* TOOLBAR */}

      <section className="sr-toolbar">

        <div className="sr-toolbar-actions">

          {/* REPORT */}

          <div className="sr-toolbar-field sr-report-field">

            <label>
              REPORT
            </label>


            <select
              value={
                reportMode
              }
              onChange={
                (
                  event
                ) =>
                  handleReportModeChange(
                    event.target.value as
                      ReportMode
                  )
              }
            >

              {
                REPORT_OPTIONS.map(
                  (
                    option
                  ) => (

                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>

                  )
                )
              }

            </select>

          </div>


          {/* DAILY DATE */}

          {
            reportMode ===
              "DAILY" && (

              <div className="sr-toolbar-field sr-date-field">

                <label>
                  DATE
                </label>


                <div className="sr-date-control">

                  <CalendarDays
                    size={16}
                  />


                  <input
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={
                      (
                        event
                      ) =>
                        handleDateChange(
                          event.target.value
                        )
                    }
                  />

                </div>

              </div>

            )
          }


          {/* DATE RANGE */}

          {
            reportMode ===
              "RANGE" && (

              <div className="sr-range-group">

                <div className="sr-toolbar-field sr-date-field">

                  <label>
                    FROM DATE
                  </label>


                  <div className="sr-date-control">

                    <CalendarDays
                      size={16}
                    />


                    <input
                      type="date"
                      value={
                        rangeFromDate
                      }
                      onChange={
                        (
                          event
                        ) =>
                          handleRangeFromChange(
                            event.target.value
                          )
                      }
                    />

                  </div>

                </div>


                <div className="sr-range-separator">
                  TO
                </div>


                <div className="sr-toolbar-field sr-date-field">

                  <label>
                    TO DATE
                  </label>


                  <div className="sr-date-control">

                    <CalendarDays
                      size={16}
                    />


                    <input
                      type="date"
                      value={
                        rangeToDate
                      }
                      onChange={
                        (
                          event
                        ) =>
                          handleRangeToChange(
                            event.target.value
                          )
                      }
                    />

                  </div>

                </div>

              </div>

            )
          }


          {/* MONTH */}

          {
            reportMode ===
              "MONTH" && (

              <div className="sr-toolbar-field sr-month-field">

                <label>
                  MONTH
                </label>


                <div className="sr-date-control">

                  <CalendarDays
                    size={16}
                  />


                  <input
                    type="month"
                    value={
                      selectedMonth
                    }
                    onChange={
                      (
                        event
                      ) =>
                        handleMonthChange(
                          event.target.value
                        )
                    }
                  />

                </div>

              </div>

            )
          }


          {/* YEAR */}

          {
            reportMode ===
              "YEAR" && (

              <div className="sr-toolbar-field sr-year-field">

                <label>
                  YEAR
                </label>


                <div className="sr-date-control">

                  <CalendarDays
                    size={16}
                  />


                  <select
                    value={
                      selectedYear
                    }
                    onChange={
                      (
                        event
                      ) =>
                        handleYearChange(
                          Number(
                            event.target.value
                          )
                        )
                    }
                  >

                    {
                      yearOptions.map(
                        (
                          year
                        ) => (

                          <option
                            key={
                              year
                            }
                            value={
                              year
                            }
                          >
                            {year}
                          </option>

                        )
                      )
                    }

                  </select>

                </div>

              </div>

            )
          }


          {/* UNIT */}

          {
            hasFullAccess && (

              <div className="sr-toolbar-field sr-unit-field">

                <label>
                  UNIT
                </label>


                <div className="sr-date-control">

                  <Building2
                    size={16}
                  />


                  <select
                    value={
                      selectedUnit
                    }
                    onChange={
                      (
                        event
                      ) =>
                        handleUnitChange(
                          event.target.value as
                            UnitCode
                        )
                    }
                  >

                    {
                      UNITS.map(
                        (
                          unit
                        ) => (

                          <option
                            key={
                              unit[0]
                            }
                            value={
                              unit[0]
                            }
                          >
                            {unit[0]} - {unit[1]}
                          </option>

                        )
                      )
                    }

                  </select>

                </div>

              </div>

            )
          }


          {/* INCHARGE UNIT */}

          {
            isIncharge && (

              <div className="sr-toolbar-field sr-unit-field">

                <label>
                  UNIT
                </label>


                <div className="sr-date-control">

                  <Building2
                    size={16}
                  />


                  <span className="sr-locked-value">

                    {
                      currentUnit
                        ? `${currentUnit.unitCode} - ${currentUnit.unitName}`
                        : user.unit?.code
                          ? `${user.unit.code} - ${user.unit.name ?? ""}`
                          : "Assigned Unit"
                    }

                  </span>

                </div>

              </div>

            )
          }


          {/* SPECIALITY VISIBILITY */}

          <div
            className="sr-speciality-visibility-wrap"
            ref={
              specialityVisibilityRef
            }
          >

            <button
              type="button"
              className="sr-speciality-visibility-button"
              disabled={
                !currentUnit ||
                currentSpecialityNames.length ===
                  0
              }
              onClick={
                () =>
                  setSpecialityVisibilityOpen(
                    (
                      current
                    ) =>
                      !current
                  )
              }
            >

              {
                currentHiddenSpecialityCount >
                0
                  ? (
                    <EyeOff
                      size={16}
                    />
                  )
                  : (
                    <Eye
                      size={16}
                    />
                  )
              }

              <span>
                Specialities
                {
                  currentHiddenSpecialityCount >
                  0
                    ? ` (${currentHiddenSpecialityCount} hidden)`
                    : ""
                }
              </span>

              <ChevronDown
                size={14}
                className={
                  specialityVisibilityOpen
                    ? "sr-download-chevron open"
                    : "sr-download-chevron"
                }
              />

            </button>


            {
              specialityVisibilityOpen && (
                <div className="sr-speciality-visibility-menu">

                  <div className="sr-speciality-visibility-header">

                    <div>

                      <strong>
                        Show / Hide Speciality
                      </strong>

                      <small>
                        Hidden items are removed from table and downloads.
                      </small>

                    </div>


                    <button
                      type="button"
                      onClick={
                        showAllSpecialities
                      }
                    >
                      Show All
                    </button>

                  </div>


                  <div className="sr-speciality-visibility-list">

                    {
                      currentSpecialityNames.map(
                        (
                          speciality
                        ) => {

                          const hidden =
                            isSpecialityHidden(
                              speciality
                            );


                          return (

                            <label
                              key={
                                speciality
                              }
                              className={
                                hidden
                                  ? "is-hidden"
                                  : ""
                              }
                            >

                              <input
                                type="checkbox"
                                checked={
                                  !hidden
                                }
                                onChange={
                                  () =>
                                    toggleSpecialityVisibility(
                                      speciality
                                    )
                                }
                              />

                              <span>
                                {speciality}
                              </span>

                              {
                                hidden
                                  ? (
                                    <EyeOff
                                      size={14}
                                    />
                                  )
                                  : (
                                    <Eye
                                      size={14}
                                    />
                                  )
                              }

                            </label>

                          );

                        }
                      )
                    }

                  </div>

                </div>
              )
            }

          </div>


          {/* REFRESH */}

          <button
            type="button"
            className="sr-toolbar-refresh"
            disabled={
              loading
            }
            onClick={
              handleRefresh
            }
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>


          {/* DOWNLOAD */}

          <div
            className="sr-download-wrap"
            ref={
              downloadRef
            }
          >

            <button
              type="button"
              className="sr-download-button"
              disabled={
                loading ||
                downloadLoading ||
                !currentUnit
              }
              onClick={
                () =>
                  setDownloadOpen(
                    (
                      current
                    ) =>
                      !current
                  )
              }
            >

              {
                downloadLoading
                  ? (

                    <RefreshCw
                      size={17}
                      className="spin"
                    />

                  )
                  : (

                    <Download
                      size={17}
                    />

                  )
              }


              {
                downloadLoading
                  ? "Preparing..."
                  : "Download"
              }


              <ChevronDown
                size={15}
                className={
                  downloadOpen
                    ? "sr-download-chevron open"
                    : "sr-download-chevron"
                }
              />

            </button>


            {
              downloadOpen &&
              currentUnit && (

                <div className="sr-download-menu">

                  <div className="sr-download-menu-header">

                    <span>
                      Current Unit
                    </span>


                    <strong>
                      {currentUnit.unitCode} {"\u00B7"} {getPeriodLabel()}
                    </strong>

                  </div>


                  <button
                    type="button"
                    onClick={
                      () =>
                        void handleDownload(
                          "EXCEL"
                        )
                    }
                  >

                    <span className="excel">

                      <FileSpreadsheet
                        size={18}
                      />

                    </span>


                    <div>

                      <strong>
                        Excel
                      </strong>

                      <small>
                        .xlsx
                      </small>

                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={
                      () =>
                        void handleDownload(
                          "CSV"
                        )
                    }
                  >

                    <span className="csv">

                      <FileText
                        size={18}
                      />

                    </span>


                    <div>

                      <strong>
                        CSV
                      </strong>

                      <small>
                        .csv
                      </small>

                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={
                      () =>
                        void handleDownload(
                          "PDF"
                        )
                    }
                  >

                    <span className="pdf">

                      <FileDown
                        size={18}
                      />

                    </span>


                    <div>

                      <strong>
                        PDF
                      </strong>

                      <small>
                        .pdf
                      </small>

                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={
                      () =>
                        void handleDownload(
                          "PNG"
                        )
                    }
                  >

                    <span className="png">

                      <Camera
                        size={18}
                      />

                    </span>


                    <div>

                      <strong>
                        PNG Snapshot
                      </strong>

                      <small>
                        .png
                      </small>

                    </div>

                  </button>


                  {
                    hasFullAccess && (

                      <>

                        <div className="sr-download-menu-header">

                          <span>
                            All Units
                          </span>


                          <strong>
                            Combined {"\u00B7"} {getPeriodLabel()}
                          </strong>

                        </div>


                        <button
                          type="button"
                          onClick={
                            () =>
                              void handleDownload(
                                "ALL_PDF"
                              )
                          }
                        >

                          <span className="pdf">

                            <FileDown
                              size={18}
                            />

                          </span>


                          <div>

                            <strong>
                              Combined PDF
                            </strong>

                            <small>
                              All units {"\u00B7"} one file
                            </small>

                          </div>

                        </button>


                        <button
                          type="button"
                          onClick={
                            () =>
                              void handleDownload(
                                "ALL_EXCEL"
                              )
                          }
                        >

                          <span className="excel">

                            <FileSpreadsheet
                              size={18}
                            />

                          </span>


                          <div>

                            <strong>
                              Combined Excel
                            </strong>

                            <small>
                              Summary + unit sheets
                            </small>

                          </div>

                        </button>

                      </>

                    )
                  }

                </div>

              )
            }

          </div>

        </div>

      </section>


      {/* DOWNLOAD ERROR */}

      {
        downloadError && (

          <div className="sr-message error">
            {downloadError}
          </div>

        )
      }


      {/* API ERROR */}

      {
        error && (

          <div className="sr-message error">
            {error}
          </div>

        )
      }


      {/* MODE MISMATCH SAFETY */}

      {
        data &&
        responseMode &&
        responseMode !==
          expectedApiMode && (

          <div className="sr-message error">

            Report response mismatch. Please restart backend and refresh.

          </div>

        )
      }


      {/* LOADING */}

      {
        loading &&
        !currentUnit && (

          <div className="sr-loading">

            <RefreshCw
              size={22}
              className="spin"
            />

            Loading speciality revenue...

          </div>

        )
      }


      {/* REPORT */}

      {
        currentUnit &&
        data &&
        responseMode ===
          expectedApiMode && (

          <div
            ref={
              reportSnapshotRef
            }
            className="sr-report-content"
          >

            <div className="sr-snapshot-header">

              <div className="sr-snapshot-brand">

                <span>
                  AAYUSH GROUP OF HOSPITALS
                </span>

                <h2>
                  Speciality Revenue Report
                </h2>

              </div>


              <div className="sr-snapshot-meta">

                <div>

                  <span>
                    UNIT
                  </span>

                  <strong>
                    {currentUnit.unitCode} - {currentUnit.unitName}
                  </strong>

                </div>


                <div>

                  <span>
                    {
                      reportMode ===
                      "DAILY"
                        ? "DATE"
                        : "PERIOD"
                    }
                  </span>

                  <strong>
                    {getPeriodLabel()}
                  </strong>

                </div>

              </div>

            </div>

            {
              renderSummary()
            }

            <section className="sr-table-card">

              <div className="sr-table-heading">

                <div>

                  <h2>
                    Speciality Wise Revenue
                  </h2>

                </div>

                {
                  responseMode ===
                    "DAILY" && (

                    <div className="sr-table-actions">

                    <div
                      className="sr-variation-sort"
                      ref={
                        variationSortRef
                      }
                    >

                      <label>
                        VARIATION SORT
                      </label>


                      <button
                        type="button"
                        className={
                          variationSortOpen
                            ? "sr-variation-sort-trigger open"
                            : "sr-variation-sort-trigger"
                        }
                        onClick={
                          () =>
                            setVariationSortOpen(
                              (
                                current
                              ) =>
                                !current
                            )
                        }
                      >

                      <span className="sr-variation-sort-icon">
                                {String.fromCharCode(8597)}
                      </span>


                        <span className="sr-variation-sort-current">

                          {
                            VARIATION_SORT_OPTIONS.find(
                              (
                                option
                              ) =>
                                option.value ===
                                variationSort
                            )?.label ??
                            "Master Order"
                          }

                        </span>


                        <ChevronDown
                          size={14}
                          className={
                            variationSortOpen
                              ? "sr-variation-sort-chevron open"
                              : "sr-variation-sort-chevron"
                          }
                        />

                      </button>


                      {
                        variationSortOpen && (

                          <div className="sr-variation-sort-menu">

                            {
                              VARIATION_SORT_OPTIONS.map(
                                (
                                  option
                                ) => {

                                  const active =
                                    option.value ===
                                    variationSort;


                                  return (

                                    <button
                                      key={
                                        option.value
                                      }
                                      type="button"
                                      className={
                                        active
                                          ? "sr-variation-sort-option active"
                                          : "sr-variation-sort-option"
                                      }
                                      onClick={
                                        () => {

                                          setVariationSort(
                                            option.value
                                          );


                                          setVariationSortOpen(
                                            false
                                          );

                                        }
                                      }
                                    >

                                      <span
                                        className={
                                          option.value ===
                                          "HIGH_TO_LOW"
                                            ? "sr-sort-direction positive"
                                            : option.value ===
                                              "LOW_TO_HIGH"
                                              ? "sr-sort-direction negative"
                                              : "sr-sort-direction neutral"
                                        }
                                      >

                                        {
                                          option.value ===
                                          "HIGH_TO_LOW"
                                            ? String.fromCharCode(8595)
                                            : option.value ===
                                              "LOW_TO_HIGH"
                                              ? String.fromCharCode(8593)
                                              : String.fromCharCode(8597)
                                        }

                                      </span>


                                      <span className="sr-sort-option-copy">

                                        <strong>
                                          {option.label}
                                        </strong>

                                        <small>
                                          {option.caption}
                                        </small>

                                      </span>


                                      {
                                        active && (

                                          <span className="sr-sort-selected">
                                            {"\u2713"}
                                          </span>

                                        )
                                      }

                                    </button>

                                  );

                                }
                              )
                            }

                          </div>

                        )
                      }

                    </div>

                    </div>

                  )
                }

              </div>


              <div className="sr-table-wrap">

                {
                  renderTable()
                }

              </div>

            </section>

          </div>

        )
      }

    </div>

  );

}


export default SpecialityRevenuePage;


