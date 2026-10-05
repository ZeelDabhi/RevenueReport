import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import * as XLSX
  from "xlsx";

import jsPDF
  from "jspdf";

import html2canvas
  from "html2canvas";

import api
  from "../services/api";

import "./SpecialityTrendPage.css";


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


type TrendMode =
  | "7D"
  | "THIS_MONTH"
  | "LAST_MONTH";


type SpecialityMetric =
  | "FTD"
  | "MTD"
  | "LMTD"
  | "LM"
  | "PROJ"
  | "VARIATION";


type DownloadFormat =
  | "EXCEL"
  | "PDF";


type ApiErrorResponse = {

  message?: string;

};


// ======================================================
// TREND API TYPES
// ======================================================

type TrendSpecialityRow = {

  serialNo: number;

  speciality: string;

  FTD: number;

};


type TrendDay = {

  date: string;

  available: boolean;

  importId:
    number |
    null;

  totalFTD: number;

  specialities:
    TrendSpecialityRow[];

};


type TrendData = {

  mode:
    "SPECIALITY_TREND";

  fromDate: string;

  toDate: string;

  rangeDays: number;

  amountUnit:
    "RUPEES";

  source:
    "FTD";

  masterOnly: boolean;

  aliasMapping: boolean;

  unit: {

    unitId: number;

    unitCode: string;

    unitName: string;

  };

  specialities:
    string[];

  daysWithData: number;

  days:
    TrendDay[];

};


type TrendResponse = {

  success: boolean;

  message?: string;

  data?:
    TrendData;

};


// ======================================================
// DAILY SPECIALITY TYPES
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

  units:
    DailyUnit[];

};


type DailyResponse = {

  success: boolean;

  message?: string;

  data?:
    DailyData;

};


// ======================================================
// UNITS
// ======================================================

const UNITS: {
  code: UnitCode;
  name: string;
}[] = [

  {
    code:
      "MB",
    name:
      "Morbi",
  },

  {
    code:
      "OS",
    name:
      "Oswal",
  },

  {
    code:
      "SV",
    name:
      "Surendranagar",
  },

  {
    code:
      "MS",
    name:
      "Mehsana",
  },

  {
    code:
      "BJ",
    name:
      "Bhuj",
  },

  {
    code:
      "JN",
    name:
      "Junagadh",
  },

  {
    code:
      "SM",
    name:
      "Samarpan",
  },

];


// ======================================================
// ACCESS
// ======================================================

const FULL_ACCESS_ROLES:
  UserRole[] = [

  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",

];


// ======================================================
// METRICS
// ======================================================

const METRICS: {
  value: SpecialityMetric;
  label: string;
}[] = [

  {
    value:
      "FTD",
    label:
      "FTD",
  },

  {
    value:
      "MTD",
    label:
      "MTD",
  },

  {
    value:
      "LMTD",
    label:
      "LMTD",
  },

  {
    value:
      "LM",
    label:
      "LM",
  },

  {
    value:
      "PROJ",
    label:
      "Projection",
  },

  {
    value:
      "VARIATION",
    label:
      "Variation",
  },

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
// STORED USER
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
// DATE HELPERS
// ======================================================

function parseLocalDate(
  value:
    string
): Date {

  const [
    year,
    month,
    day,
  ] =
    value
      .split(
        "-"
      )
      .map(
        Number
      );


  return new Date(
    year,
    month -
    1,
    day
  );

}


function toDateInputValue(
  date:
    Date
): string {

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


function getRangeBounds(
  selectedDate:
    string,
  mode:
    TrendMode
): {
  fromDate: string;
  toDate: string;
} {

  const anchor =
    parseLocalDate(
      selectedDate
    );


  if (
    mode ===
    "7D"
  ) {

    const from =
      new Date(
        anchor
      );


    from.setDate(
      from.getDate() -
      6
    );


    return {

      fromDate:
        toDateInputValue(
          from
        ),

      toDate:
        selectedDate,

    };

  }


  if (
    mode ===
    "THIS_MONTH"
  ) {

    const from =
      new Date(
        anchor.getFullYear(),
        anchor.getMonth(),
        1
      );


    return {

      fromDate:
        toDateInputValue(
          from
        ),

      toDate:
        selectedDate,

    };

  }


  const previousMonthStart =
    new Date(
      anchor.getFullYear(),
      anchor.getMonth() -
      1,
      1
    );


  const previousMonthEnd =
    new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      0
    );


  return {

    fromDate:
      toDateInputValue(
        previousMonthStart
      ),

    toDate:
      toDateInputValue(
        previousMonthEnd
      ),

  };

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDisplayDate(
  value:
    string
): string {

  if (
    !value
  ) {

    return "-";

  }


  const date =
    parseLocalDate(
      value
    );


  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  ).format(
    date
  );

}


// ======================================================
// RUPEES -> LAKHS
// ======================================================

function toLakhs(
  value:
    number |
    undefined
): number {

  return Number(
    value ??
    0
  ) /
  100000;

}


// ======================================================
// FORMAT LAKHS
// ======================================================

function formatLakhs(
  value:
    number
): string {

  return `${Number(
    value
  ).toFixed(
    2
  )} L`;

}


// ======================================================
// METRIC VALUE
// ======================================================

function getMetricValue(
  row:
    DailySpecialityRow,
  metric:
    SpecialityMetric
): number {

  switch (
    metric
  ) {

    case "FTD":

      return row.FTD;


    case "MTD":

      return row.MTD;


    case "LMTD":

      return row.LMTD;


    case "LM":

      return row.LM;


    case "PROJ":

      return row.projection ??
        0;


    case "VARIATION":

      return (
        row.projection ??
        0
      ) -
      row.LM;


    default:

      return 0;

  }

}


// ======================================================
// SAFE FILE NAME
// ======================================================

function safeFileName(
  value:
    string
): string {

  return value
    .replace(
      /[^a-zA-Z0-9-_]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );

}


// ======================================================
// PERIOD LABEL
// ======================================================

function getPeriodLabel(
  mode:
    TrendMode
): string {

  if (
    mode ===
    "7D"
  ) {

    return "Last 7 Days";

  }


  if (
    mode ===
    "THIS_MONTH"
  ) {

    return "This Month";

  }


  return "Last Month";

}


// ======================================================
// PAGE
// ======================================================

function SpecialityTrendPage() {

  const navigate =
    useNavigate();


  const reportRef =
    useRef<HTMLDivElement>(
      null
    );


  const storedUser =
    useMemo(
      () =>
        getStoredUser(),
      []
    );


  const hasFullAccess =
    Boolean(
      storedUser.role &&
      FULL_ACCESS_ROLES.includes(
        storedUser.role
      )
    );


  const inchargeUnitCode =
    (
      storedUser.unit?.code ??
      ""
    )
      .trim()
      .toUpperCase() as
        UnitCode;


  const initialUnit =
    hasFullAccess
      ? "MB"
      : (
          UNITS.some(
            (
              item
            ) =>
              item.code ===
              inchargeUnitCode
          )
            ? inchargeUnitCode
            : "MB"
        );


  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    comparisonDate,
    setComparisonDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    selectedUnit,
    setSelectedUnit,
  ] =
    useState<UnitCode>(
      initialUnit
    );


  const [
    trendMode,
    setTrendMode,
  ] =
    useState<TrendMode>(
      "7D"
    );


  const [
    selectedSpeciality,
    setSelectedSpeciality,
  ] =
    useState(
      ""
    );


  const [
    selectedMetric,
    setSelectedMetric,
  ] =
    useState<SpecialityMetric>(
      "FTD"
    );


  const [
    trendData,
    setTrendData,
  ] =
    useState<
      TrendData |
      null
    >(
      null
    );


  const [
    dailyData,
    setDailyData,
  ] =
    useState<
      DailyData |
      null
    >(
      null
    );


  const [
    selectedTrendPoint,
    setSelectedTrendPoint,
  ] =
    useState<{
      date: string;
      valueLakhs: number;
    } | null>(
      null
    );


  const [
    loadingTrend,
    setLoadingTrend,
  ] =
    useState(
      false
    );


  const [
    loadingDaily,
    setLoadingDaily,
  ] =
    useState(
      false
    );


  const [
    trendError,
    setTrendError,
  ] =
    useState(
      ""
    );


  const [
    dailyError,
    setDailyError,
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
    exportLoading,
    setExportLoading,
  ] =
    useState<
      DownloadFormat |
      null
    >(
      null
    );


  const [
    exportError,
    setExportError,
  ] =
    useState(
      ""
    );


  const [
    exportNotice,
    setExportNotice,
  ] =
    useState<{
      type:
        "working" |
        "success";
      message:
        string;
    } | null>(
      null
    );


  // ====================================================
  // TREND API
  // ====================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      const range =
        getRangeBounds(
          selectedDate,
          trendMode
        );


      queueMicrotask(
        () => {

          if (
            active
          ) {

            setLoadingTrend(
              true
            );


            setTrendError(
              ""
            );

          }

        }
      );


      const params: {
        fromDate: string;
        toDate: string;
        unit?: string;
      } = {

        fromDate:
          range.fromDate,

        toDate:
          range.toDate,

      };


      if (
        hasFullAccess
      ) {

        params.unit =
          selectedUnit;

      }


      api.get<TrendResponse>(
        "/speciality/trend",
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


              setTrendData(
                nextData
              );


              setSelectedSpeciality(
                (
                  current
                ) => {

                  if (
                    current &&
                    nextData.specialities.includes(
                      current
                    )
                  ) {

                    return current;

                  }


                  return nextData.specialities[0] ??
                    "";

                }
              );


              return;

            }


            setTrendData(
              null
            );


            setTrendError(
              response.data.message ??
              "Unable to load speciality trend."
            );

          }
        )
        .catch(
          (
            error:
              unknown
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                error
              )
            ) {

              if (
                error.code ===
                "ERR_CANCELED"
              ) {

                return;

              }


              if (
                error.response?.status ===
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
                error.response?.data as
                  | ApiErrorResponse
                  | undefined;


              setTrendError(
                responseData?.message ??
                "Unable to load speciality trend."
              );


              setTrendData(
                null
              );


              return;

            }


            setTrendError(
              "Unable to load speciality trend."
            );


            setTrendData(
              null
            );

          }
        )
        .finally(
          () => {

            if (
              active
            ) {

              setLoadingTrend(
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
      selectedDate,
      selectedUnit,
      trendMode,
      refreshKey,
      hasFullAccess,
      navigate,
    ]
  );


  // ====================================================
  // DAILY COMPARISON API
  // ====================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      queueMicrotask(
        () => {

          if (
            active
          ) {

            setLoadingDaily(
              true
            );


            setDailyError(
              ""
            );

          }

        }
      );


      const params: {
        mode: "DAILY";
        date: string;
        unit?: string;
      } = {

        mode:
          "DAILY",

        date:
          comparisonDate,

      };


      if (
        hasFullAccess
      ) {

        params.unit =
          selectedUnit;

      }


      api.get<DailyResponse>(
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

              setDailyData(
                response.data.data
              );


              return;

            }


            setDailyData(
              null
            );


            setDailyError(
              response.data.message ??
              "Unable to load speciality comparison."
            );

          }
        )
        .catch(
          (
            error:
              unknown
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                error
              )
            ) {

              if (
                error.code ===
                "ERR_CANCELED"
              ) {

                return;

              }


              if (
                error.response?.status ===
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
                error.response?.data as
                  | ApiErrorResponse
                  | undefined;


              setDailyError(
                responseData?.message ??
                "Unable to load speciality comparison."
              );


              setDailyData(
                null
              );


              return;

            }


            setDailyError(
              "Unable to load speciality comparison."
            );


            setDailyData(
              null
            );

          }
        )
        .finally(
          () => {

            if (
              active
            ) {

              setLoadingDaily(
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
      comparisonDate,
      selectedUnit,
      refreshKey,
      hasFullAccess,
      navigate,
    ]
  );


  // ====================================================
  // TREND POINTS
  // ====================================================

  const trendPoints =
    useMemo(
      () => {

        if (
          !trendData ||
          !selectedSpeciality
        ) {

          return [];

        }


        return trendData.days.map(
          (
            day
          ) => {

            const row =
              day.specialities.find(
                (
                  item
                ) =>
                  item.speciality ===
                  selectedSpeciality
              );


            return {

              date:
                day.date,

              available:
                day.available,

              valueLakhs:
                toLakhs(
                  row?.FTD ??
                  0
                ),

            };

          }
        );

      },
      [
        trendData,
        selectedSpeciality,
      ]
    );


  const availableTrendPoints =
    trendPoints.filter(
      (
        point
      ) =>
        point.available
    );


  const latestTrendValue =
    availableTrendPoints.length >
    0
      ? availableTrendPoints[
          availableTrendPoints.length -
          1
        ].valueLakhs
      : 0;


  const averageTrendValue =
    availableTrendPoints.length >
    0
      ? availableTrendPoints.reduce(
          (
            sum,
            point
          ) =>
            sum +
            point.valueLakhs,
          0
        ) /
        availableTrendPoints.length
      : 0;


  const peakTrendValue =
    availableTrendPoints.length >
    0
      ? Math.max(
          ...availableTrendPoints.map(
            (
              point
            ) =>
              point.valueLakhs
          )
        )
      : 0;


  // ====================================================
  // SELECTED TREND DAY
  // ====================================================

  const selectedTrendDay =
    useMemo(
      () => {

        if (
          !trendData ||
          !selectedTrendPoint
        ) {

          return null;

        }


        return trendData.days.find(
          (
            day
          ) =>
            day.date ===
            selectedTrendPoint.date
        ) ??
        null;

      },
      [
        trendData,
        selectedTrendPoint,
      ]
    );


  // ====================================================
  // LINE CHART DIMENSIONS
  // ====================================================

  const chartWidth =
    1000;


  const chartHeight =
    290;


  const chartPadding = {

    top:
      34,

    right:
      28,

    bottom:
      54,

    left:
      64,

  };


  const plotWidth =
    chartWidth -
    chartPadding.left -
    chartPadding.right;


  const plotHeight =
    chartHeight -
    chartPadding.top -
    chartPadding.bottom;


  const chartMax =
    Math.max(
      peakTrendValue *
      1.15,
      1
    );


  const getPointX =
    (
      index:
        number
    ) => {

      if (
        trendPoints.length <=
        1
      ) {

        return chartPadding.left +
          plotWidth /
          2;

      }


      return chartPadding.left +
        (
          index /
          (
            trendPoints.length -
            1
          )
        ) *
        plotWidth;

    };


  const getPointY =
    (
      value:
        number
    ) =>
      chartPadding.top +
      plotHeight -
      (
        value /
        chartMax
      ) *
      plotHeight;


  const polylinePoints =
    trendPoints
      .map(
        (
          point,
          index
        ) =>
          point.available
            ? `${getPointX(
                index
              )},${getPointY(
                point.valueLakhs
              )}`
            : ""
      )
      .filter(
        Boolean
      )
      .join(
        " "
      );


  // ====================================================
  // DAILY UNIT
  // ====================================================

  const dailyUnit =
    dailyData?.units?.[0] ??
    null;


  const comparisonRows =
    useMemo(
      () => {

        if (
          !dailyUnit
        ) {

          return [];

        }


        return dailyUnit.specialities.map(
          (
            row
          ) => ({

            row,

            valueLakhs:
              toLakhs(
                getMetricValue(
                  row,
                  selectedMetric
                )
              ),

          })
        );

      },
      [
        dailyUnit,
        selectedMetric,
      ]
    );


  const maxComparisonValue =
    Math.max(
      ...comparisonRows.map(
        (
          item
        ) =>
          Math.abs(
            item.valueLakhs
          )
      ),
      1
    );


  const highestValue =
    comparisonRows.length >
    0
      ? Math.max(
          ...comparisonRows.map(
            (
              item
            ) =>
              item.valueLakhs
          )
        )
      : 0;


  const lowestValue =
    comparisonRows.length >
    0
      ? Math.min(
          ...comparisonRows.map(
            (
              item
            ) =>
              item.valueLakhs
          )
        )
      : 0;


  const hasSpread =
    comparisonRows.length >
      1 &&
    highestValue !==
      lowestValue;


  const metricLabel =
    METRICS.find(
      (
        item
      ) =>
        item.value ===
        selectedMetric
    )?.label ??
    selectedMetric;


  // ====================================================
  // MODE CHANGE
  // ====================================================

  const handleTrendModeChange =
    (
      nextMode:
        TrendMode
    ) => {

      setTrendMode(
        nextMode
      );


      setSelectedTrendPoint(
        null
      );


      const nextRange =
        getRangeBounds(
          selectedDate,
          nextMode
        );


      setComparisonDate(
        nextRange.toDate
      );

    };


  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    () => {

      setRefreshKey(
        (
          current
        ) =>
          current +
          1
      );

    };


  // ====================================================
  // EXPORT EXCEL
  // ====================================================

  const exportExcel =
    () => {

      if (
        !trendData ||
        !dailyUnit ||
        !selectedSpeciality
      ) {

        throw new Error(
          "Speciality trend data is not available for export."
        );

      }


      const workbook =
        XLSX.utils.book_new();


      const summarySheet =
        XLSX.utils.json_to_sheet([
          {
            Field:
              "Unit",
            Value:
              `${trendData.unit.unitCode} - ${trendData.unit.unitName}`,
          },
          {
            Field:
              "Trend Period",
            Value:
              `${formatDisplayDate(
                trendData.fromDate
              )} - ${formatDisplayDate(
                trendData.toDate
              )}`,
          },
          {
            Field:
              "Trend Mode",
            Value:
              getPeriodLabel(
                trendMode
              ),
          },
          {
            Field:
              "Selected Speciality",
            Value:
              selectedSpeciality,
          },
          {
            Field:
              "Comparison Date",
            Value:
              formatDisplayDate(
                comparisonDate
              ),
          },
          {
            Field:
              "Selected Comparison Metric",
            Value:
              metricLabel,
          },
          {
            Field:
              "Data Days",
            Value:
              `${trendData.daysWithData}/${trendData.rangeDays}`,
          },
        ]);


      summarySheet["!cols"] = [
        {
          wch:
            28,
        },
        {
          wch:
            38,
        },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );


      const trendRows =
        trendData.days.map(
          (
            day
          ) => {

            const row =
              day.specialities.find(
                (
                  item
                ) =>
                  item.speciality ===
                  selectedSpeciality
              );


            const specialityFtd =
              row?.FTD ??
              0;


            return {
              Date:
                day.date,
              Available:
                day.available
                  ? "Yes"
                  : "No",
              Speciality:
                selectedSpeciality,
              "Speciality FTD (Rs)":
                specialityFtd,
              "Speciality FTD (Lakhs)":
                toLakhs(
                  specialityFtd
                ),
              "Unit Total FTD (Rs)":
                day.totalFTD,
              "Unit Total FTD (Lakhs)":
                toLakhs(
                  day.totalFTD
                ),
            };

          }
        );


      const trendSheet =
        XLSX.utils.json_to_sheet(
          trendRows
        );


      trendSheet["!cols"] = [
        {
          wch:
            14,
        },
        {
          wch:
            12,
        },
        {
          wch:
            28,
        },
        {
          wch:
            22,
        },
        {
          wch:
            24,
        },
        {
          wch:
            21,
        },
        {
          wch:
            23,
        },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        trendSheet,
        "Trend"
      );


      const comparisonExportRows =
        dailyUnit.specialities.map(
          (
            row
          ) => {

            const projection =
              row.projection ??
              0;


            return {
              "SR No":
                row.serialNo,
              Speciality:
                row.speciality,
              "FTD (Rs)":
                row.FTD,
              "MTD (Rs)":
                row.MTD,
              "LMTD (Rs)":
                row.LMTD,
              "LM (Rs)":
                row.LM,
              "Projection (Rs)":
                projection,
              "Variation (Rs)":
                projection -
                row.LM,
              "FTD (Lakhs)":
                toLakhs(
                  row.FTD
                ),
              "MTD (Lakhs)":
                toLakhs(
                  row.MTD
                ),
              "LMTD (Lakhs)":
                toLakhs(
                  row.LMTD
                ),
              "LM (Lakhs)":
                toLakhs(
                  row.LM
                ),
              "Projection (Lakhs)":
                toLakhs(
                  projection
                ),
              "Variation (Lakhs)":
                toLakhs(
                  projection -
                  row.LM
                ),
            };

          }
        );


      const comparisonSheet =
        XLSX.utils.json_to_sheet(
          comparisonExportRows
        );


      comparisonSheet["!cols"] = [
        {
          wch:
            8,
        },
        {
          wch:
            30,
        },
        ...Array.from(
          {
            length:
              12,
          },
          () => ({
            wch:
              20,
          })
        ),
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        comparisonSheet,
        "Comparison"
      );


      const fileName =
        `Speciality-Trend-${safeFileName(
          trendData.unit.unitCode
        )}-${safeFileName(
          selectedSpeciality
        )}-${comparisonDate}.xlsx`;


      XLSX.writeFile(
        workbook,
        fileName
      );

    };


  // ====================================================
  // EXPORT PDF
  //
  // Captures the current Speciality Trend page so the
  // line chart, selected-date breakup and comparison bars
  // are included exactly as shown on screen.
  // ====================================================

  const exportPdf =
    async () => {

      if (
        !trendData ||
        !dailyUnit ||
        !selectedSpeciality
      ) {

        throw new Error(
          "Speciality trend data is not available for export."
        );

      }


      const element =
        reportRef.current;


      if (
        !element
      ) {

        throw new Error(
          "Speciality trend report is not available."
        );

      }


      const headerElement =
        element.querySelector<HTMLElement>(
          ".str-header"
        );


      const cardElements =
        Array.from(
          element.querySelectorAll<HTMLElement>(
            ".str-card"
          )
        );


      if (
        !headerElement ||
        cardElements.length <
          2
      ) {

        throw new Error(
          "Speciality trend PDF sections are not available."
        );

      }


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


        const captureElement =
          async (
            target:
              HTMLElement
          ) => {

            return html2canvas(
              target,
              {
                backgroundColor:
                  "#ffffff",
                scale:
                  2,
                useCORS:
                  true,
                logging:
                  false,
                scrollX:
                  0,
                scrollY:
                  -window.scrollY,
                windowWidth:
                  Math.max(
                    1500,
                    target.scrollWidth +
                    40
                  ),
              }
            );

          };


        const [
          headerCanvas,
          trendCanvas,
          comparisonCanvas,
        ] =
          await Promise.all([
            captureElement(
              headerElement
            ),
            captureElement(
              cardElements[0]
            ),
            captureElement(
              cardElements[1]
            ),
          ]);


        const pdf =
          new jsPDF({
            orientation:
              "landscape",
            unit:
              "mm",
            format:
              "a4",
          });


        const pageWidth =
          pdf.internal.pageSize.getWidth();


        const pageHeight =
          pdf.internal.pageSize.getHeight();


        const margin =
          8;


        const contentWidth =
          pageWidth -
          margin *
          2;


        const contentHeight =
          pageHeight -
          margin *
          2;


        const addCanvas =
          (
            canvas:
              HTMLCanvasElement,
            y:
              number,
            maxHeight:
              number
          ): number => {

            const naturalHeight =
              (
                canvas.height *
                contentWidth
              ) /
              canvas.width;


            const renderHeight =
              Math.min(
                naturalHeight,
                maxHeight
              );


            const renderWidth =
              (
                canvas.width *
                renderHeight
              ) /
              canvas.height;


            const x =
              (
                pageWidth -
                renderWidth
              ) /
              2;


            pdf.addImage(
              canvas.toDataURL(
                "image/png",
                1
              ),
              "PNG",
              x,
              y,
              renderWidth,
              renderHeight,
              undefined,
              "FAST"
            );


            return renderHeight;

          };


        // ==================================================
        // PAGE 1
        // Header + complete trend card.
        // No card is split across PDF pages.
        // ==================================================

        const headerMaxHeight =
          28;


        const headerHeight =
          addCanvas(
            headerCanvas,
            margin,
            headerMaxHeight
          );


        const gap =
          4;


        const trendY =
          margin +
          headerHeight +
          gap;


        const trendAvailableHeight =
          pageHeight -
          margin -
          trendY;


        addCanvas(
          trendCanvas,
          trendY,
          trendAvailableHeight
        );


        // ==================================================
        // PAGE 2
        // Complete comparison card.
        // ==================================================

        pdf.addPage();


        addCanvas(
          comparisonCanvas,
          margin,
          contentHeight
        );


        // ==================================================
        // PAGE NUMBERS
        // ==================================================

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
            8
          );


          pdf.setTextColor(
            120,
            132,
            150
          );


          pdf.text(
            `Page ${pageNumber} of ${totalPages}`,
            pageWidth -
            margin,
            pageHeight -
            3,
            {
              align:
                "right",
            }
          );

        }


        const fileName =
          `Speciality-Trend-${safeFileName(
            trendData.unit.unitCode
          )}-${safeFileName(
            selectedSpeciality
          )}-${comparisonDate}.pdf`;


      pdf.save(
        fileName
      );

    };


  // ====================================================
  // HANDLE EXPORT
  // ====================================================

  const handleExport =
    async (
      format:
        DownloadFormat
    ) => {

      const formatLabel =
        format ===
          "EXCEL"
          ? "Excel"
          : "PDF";


      setExportError(
        ""
      );


      setExportNotice({
        type:
          "working",
        message:
          `Preparing ${formatLabel} report...`,
      });


      try {

        setExportLoading(
          format
        );


        // Let React paint the loading state before
        // the export work starts.
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


        if (
          format ===
          "EXCEL"
        ) {

          exportExcel();

        }
        else {

          await exportPdf();

        }


        setExportNotice({
          type:
            "success",
          message:
            `${formatLabel} downloaded successfully.`,
        });


        window.setTimeout(
          () => {

            setExportNotice(
              null
            );

          },
          2800
        );

      }
      catch (
        error:
          unknown
      ) {

        setExportNotice(
          null
        );


        setExportError(
          error instanceof Error
            ? error.message
            : "Unable to export speciality trend report."
        );

      }
      finally {

        setExportLoading(
          null
        );

      }

    };


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div
      className="str-page"
      ref={
        reportRef
      }
    >

      {
        exportNotice && (

          <div
            className={`str-export-toast ${exportNotice.type}`}
            role="status"
            aria-live="polite"
          >

            {
              exportNotice.type ===
                "working"
                ? (
                  <RefreshCw
                    size={17}
                    className="spin"
                  />
                )
                : (
                  <span className="str-export-toast-check">
                    ✓
                  </span>
                )
            }


            <span>
              {exportNotice.message}
            </span>

          </div>

        )
      }

      <section className="str-header">

        <div>

          <p className="str-eyebrow">
            AAYUSH GROUP OF HOSPITALS
          </p>


          <h1>
            Speciality Revenue Trend
          </h1>


          <p className="str-subtitle">
            Speciality-wise revenue trend and exact comparison in Lakhs.
          </p>

        </div>


        <div className="str-header-actions">

          {
            hasFullAccess && (

              <label className="str-control">

                <span>
                  Unit
                </span>


                <div>

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
                      ) => {

                        const nextUnit =
                          event.target.value as
                            UnitCode;


                        setSelectedUnit(
                          nextUnit
                        );


                        setSelectedSpeciality(
                          ""
                        );


                        setSelectedTrendPoint(
                          null
                        );


                        const nextRange =
                          getRangeBounds(
                            selectedDate,
                            trendMode
                          );


                        setComparisonDate(
                          nextRange.toDate
                        );

                      }
                    }
                  >

                    {
                      UNITS.map(
                        (
                          unit
                        ) => (

                          <option
                            key={
                              unit.code
                            }
                            value={
                              unit.code
                            }
                          >
                            {unit.code} - {unit.name}
                          </option>

                        )
                      )
                    }

                  </select>

                </div>

              </label>

            )
          }


          <label className="str-control">

            <span>
              Trend Through
            </span>


            <div>

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
                  ) => {

                    const value =
                      event.target.value;


                    setSelectedDate(
                      value
                    );


                    const nextRange =
                      getRangeBounds(
                        value,
                        trendMode
                      );


                    setComparisonDate(
                      nextRange.toDate
                    );


                    setSelectedTrendPoint(
                      null
                    );

                  }
                }
              />

            </div>

          </label>


          <button
            type="button"
            className="str-refresh"
            data-html2canvas-ignore="true"
            onClick={
              handleRefresh
            }
          >

            <RefreshCw
              size={16}
              className={
                loadingTrend ||
                loadingDaily
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            className="str-export-action excel"
            data-html2canvas-ignore="true"
            disabled={
              Boolean(
                exportLoading
              ) ||
              !trendData ||
              !dailyUnit
            }
            onClick={
              () =>
                void handleExport(
                  "EXCEL"
                )
            }
          >

            {
              exportLoading ===
                "EXCEL"
                ? (
                  <RefreshCw
                    size={16}
                    className="spin"
                  />
                )
                : (
                  <FileSpreadsheet
                    size={16}
                  />
                )
            }

            {
              exportLoading ===
                "EXCEL"
                ? "Preparing..."
                : "Excel"
            }

          </button>


          <button
            type="button"
            className="str-export-action pdf"
            data-html2canvas-ignore="true"
            disabled={
              Boolean(
                exportLoading
              ) ||
              !trendData ||
              !dailyUnit
            }
            onClick={
              () =>
                void handleExport(
                  "PDF"
                )
            }
          >

            {
              exportLoading ===
                "PDF"
                ? (
                  <RefreshCw
                    size={16}
                    className="spin"
                  />
                )
                : (
                  <FileDown
                    size={16}
                  />
                )
            }

            {
              exportLoading ===
                "PDF"
                ? "Preparing..."
                : "PDF"
            }

          </button>

        </div>

      </section>


      {
        exportError && (

          <div className="str-message error str-export-error">
            {exportError}
          </div>

        )
      }


      <section className="str-card">

        <div className="str-card-header">

          <div>

            <div className="str-title-with-icon">

              <span className="str-icon-badge">

                <TrendingUp
                  size={18}
                />

              </span>


              <div>

                <h2>
                  {selectedSpeciality || "Speciality"} FTD Revenue Trend
                </h2>


                <p>
                  {trendData?.unit.unitCode ?? selectedUnit} · {getPeriodLabel(
                    trendMode
                  )} · Daily FTD
                </p>

              </div>

            </div>

          </div>


          <div className="str-card-tools">

            <label className="str-speciality-select">

              <span>
                Speciality
              </span>


              <select
                value={
                  selectedSpeciality
                }
                disabled={
                  !trendData ||
                  trendData.specialities.length ===
                    0
                }
                onChange={
                  (
                    event
                  ) => {

                    setSelectedSpeciality(
                      event.target.value
                    );


                    setSelectedTrendPoint(
                      null
                    );

                  }
                }
              >

                {
                  trendData?.specialities.map(
                    (
                      speciality
                    ) => (

                      <option
                        key={
                          speciality
                        }
                        value={
                          speciality
                        }
                      >
                        {speciality}
                      </option>

                    )
                  )
                }

              </select>

            </label>


            <div className="str-period-switch">

              <button
                type="button"
                className={
                  trendMode ===
                  "7D"
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    handleTrendModeChange(
                      "7D"
                    )
                }
              >
                7 Days
              </button>


              <button
                type="button"
                className={
                  trendMode ===
                  "THIS_MONTH"
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    handleTrendModeChange(
                      "THIS_MONTH"
                    )
                }
              >
                This Month
              </button>


              <button
                type="button"
                className={
                  trendMode ===
                  "LAST_MONTH"
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    handleTrendModeChange(
                      "LAST_MONTH"
                    )
                }
              >
                Last Month
              </button>

            </div>

          </div>

        </div>


        {
          trendError
            ? (

              <div className="str-message error">
                {trendError}
              </div>

            )
            : loadingTrend &&
              !trendData
              ? (

                <div className="str-message">
                  Loading speciality trend...
                </div>

              )
              : (

                <>

                  <div className="str-summary">

                    <div>

                      <span>
                        Period
                      </span>

                      <strong>
                        {trendData
                          ? `${formatDisplayDate(
                              trendData.fromDate
                            )} - ${formatDisplayDate(
                              trendData.toDate
                            )}`
                          : "-"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Latest FTD
                      </span>

                      <strong>
                        {formatLakhs(
                          latestTrendValue
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Average FTD
                      </span>

                      <strong>
                        {formatLakhs(
                          averageTrendValue
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Peak FTD
                      </span>

                      <strong>
                        {formatLakhs(
                          peakTrendValue
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Data Days
                      </span>

                      <strong>
                        {trendData?.daysWithData ?? 0}/{trendData?.rangeDays ?? 0}
                      </strong>

                    </div>

                  </div>


                  <div className="str-line-chart-wrap">

                    {
                      trendPoints.length >
                      0
                        ? (

                          <svg
                            className="str-line-chart"
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            role="img"
                            aria-label={`${selectedSpeciality} FTD revenue trend`}
                          >

                            {
                              [
                                0,
                                0.25,
                                0.5,
                                0.75,
                                1,
                              ].map(
                                (
                                  fraction
                                ) => {

                                  const value =
                                    chartMax *
                                    (
                                      1 -
                                      fraction
                                    );


                                  const y =
                                    chartPadding.top +
                                    plotHeight *
                                    fraction;


                                  return (

                                    <g
                                      key={
                                        fraction
                                      }
                                    >

                                      <line
                                        x1={
                                          chartPadding.left
                                        }
                                        x2={
                                          chartWidth -
                                          chartPadding.right
                                        }
                                        y1={
                                          y
                                        }
                                        y2={
                                          y
                                        }
                                        className="str-grid-line"
                                      />


                                      <text
                                        x={
                                          chartPadding.left -
                                          12
                                        }
                                        y={
                                          y +
                                          4
                                        }
                                        textAnchor="end"
                                        className="str-y-label"
                                      >
                                        {value.toFixed(
                                          1
                                        )}
                                      </text>

                                    </g>

                                  );

                                }
                              )
                            }


                            {
                              selectedTrendPoint && (

                                <line
                                  x1={
                                    getPointX(
                                      trendPoints.findIndex(
                                        (
                                          point
                                        ) =>
                                          point.date ===
                                          selectedTrendPoint.date
                                      )
                                    )
                                  }
                                  x2={
                                    getPointX(
                                      trendPoints.findIndex(
                                        (
                                          point
                                        ) =>
                                          point.date ===
                                          selectedTrendPoint.date
                                      )
                                    )
                                  }
                                  y1={
                                    chartPadding.top
                                  }
                                  y2={
                                    chartPadding.top +
                                    plotHeight
                                  }
                                  className="str-selected-guide"
                                />

                              )
                            }


                            <polyline
                              points={
                                polylinePoints
                              }
                              fill="none"
                              className="str-line"
                            />


                            {
                              trendPoints.map(
                                (
                                  point,
                                  index
                                ) => {

                                  const x =
                                    getPointX(
                                      index
                                    );


                                  const y =
                                    getPointY(
                                      point.valueLakhs
                                    );


                                  const selected =
                                    selectedTrendPoint?.date ===
                                    point.date;


                                  const shouldShowDate =
                                    trendPoints.length <=
                                      10 ||
                                    index ===
                                      0 ||
                                    index ===
                                      trendPoints.length -
                                      1 ||
                                    index %
                                      Math.ceil(
                                        trendPoints.length /
                                        7
                                      ) ===
                                      0;


                                  return (

                                    <g
                                      key={
                                        point.date
                                      }
                                      className={
                                        point.available
                                          ? "str-point-group"
                                          : "str-point-group missing"
                                      }
                                    >

                                      {
                                        point.available && (

                                          <circle
                                            cx={
                                              x
                                            }
                                            cy={
                                              y
                                            }
                                            r={
                                              selected
                                                ? 7
                                                : 5
                                            }
                                            className={
                                              selected
                                                ? "str-point selected"
                                                : "str-point"
                                            }
                                            onClick={
                                              () => {

                                                setSelectedTrendPoint({

                                                  date:
                                                    point.date,

                                                  valueLakhs:
                                                    point.valueLakhs,

                                                });


                                                setComparisonDate(
                                                  point.date
                                                );

                                              }
                                            }
                                          />

                                        )
                                      }


                                      {
                                        selected && (

                                          <g>

                                            <rect
                                              x={
                                                Math.max(
                                                  10,
                                                  Math.min(
                                                    chartWidth -
                                                    120,
                                                    x -
                                                    45
                                                  )
                                                )
                                              }
                                              y={
                                                Math.max(
                                                  4,
                                                  y -
                                                  44
                                                )
                                              }
                                              width="90"
                                              height="28"
                                              rx="8"
                                              className="str-point-callout"
                                            />


                                            <text
                                              x={
                                                Math.max(
                                                  55,
                                                  Math.min(
                                                    chartWidth -
                                                    75,
                                                    x
                                                  )
                                                )
                                              }
                                              y={
                                                Math.max(
                                                  22,
                                                  y -
                                                  25
                                                )
                                              }
                                              textAnchor="middle"
                                              className="str-point-callout-text"
                                            >
                                              {formatLakhs(
                                                point.valueLakhs
                                              )}
                                            </text>

                                          </g>

                                        )
                                      }


                                      {
                                        shouldShowDate && (

                                          <text
                                            x={
                                              x
                                            }
                                            y={
                                              chartHeight -
                                              18
                                            }
                                            textAnchor="middle"
                                            className="str-x-label"
                                          >
                                            {new Intl.DateTimeFormat(
                                              "en-GB",
                                              {
                                                day:
                                                  "2-digit",
                                                month:
                                                  "short",
                                              }
                                            ).format(
                                              parseLocalDate(
                                                point.date
                                              )
                                            )}
                                          </text>

                                        )
                                      }

                                    </g>

                                  );

                                }
                              )
                            }

                          </svg>

                        )
                        : (

                          <div className="str-empty-chart">
                            No trend data available.
                          </div>

                        )
                    }

                  </div>


                  {
                    selectedTrendPoint &&
                    selectedTrendDay &&
                    trendData && (

                      <div className="str-selected-detail">

                        <button
                          type="button"
                          className="str-selected-detail-close"
                          onClick={
                            () => {

                              setSelectedTrendPoint(
                                null
                              );

                            }
                          }
                          aria-label="Close selected date details"
                        >
                          ×
                        </button>


                        <div className="str-selected-detail-head">

                          <div>

                            <span className="str-selected-detail-kicker">
                              SELECTED DATE SPECIALITY BREAKUP
                            </span>


                            <h3>
                              {formatDisplayDate(
                                selectedTrendDay.date
                              )}
                            </h3>


                            <p>
                              {trendData.unit.unitCode} - {trendData.unit.unitName}
                            </p>

                          </div>


                          <div className="str-selected-detail-summary">

                            <div>

                              <span>
                                Unit Total FTD
                              </span>

                              <strong>
                                {formatLakhs(
                                  toLakhs(
                                    selectedTrendDay.totalFTD
                                  )
                                )}
                              </strong>

                            </div>


                            <div>

                              <span>
                                {selectedSpeciality} FTD
                              </span>

                              <strong>
                                {formatLakhs(
                                  selectedTrendPoint.valueLakhs
                                )}
                              </strong>

                            </div>

                          </div>

                        </div>


                        <div className="str-selected-breakup-grid">

                          {
                            selectedTrendDay.specialities.map(
                              (
                                row
                              ) => {

                                const active =
                                  row.speciality ===
                                  selectedSpeciality;

                                return (

                                  <div
                                    key={
                                      row.speciality
                                    }
                                    className={
                                      active
                                        ? "str-selected-breakup-item active"
                                        : "str-selected-breakup-item"
                                    }
                                  >

                                    <div>

                                      <span className="str-selected-breakup-number">
                                        #{row.serialNo}
                                      </span>


                                      <strong>
                                        {row.speciality}
                                      </strong>

                                    </div>


                                    <span className="str-selected-breakup-value">
                                      {formatLakhs(
                                        toLakhs(
                                          row.FTD
                                        )
                                      )}
                                    </span>

                                  </div>

                                );

                              }
                            )
                          }

                        </div>

                      </div>

                    )
                  }

                </>

              )
        }

      </section>


      <section className="str-card">

        <div className="str-card-header">

          <div className="str-title-with-icon">

            <span className="str-icon-badge secondary">

              <BarChart3
                size={18}
              />

            </span>


            <div>

              <h2>
                Speciality Wise Revenue Comparison
              </h2>


              <p>
                {dailyUnit?.unitCode ?? selectedUnit} · Exact values for {formatDisplayDate(
                  comparisonDate
                )}
              </p>

            </div>

          </div>


          <div className="str-metric-switch">

            {
              METRICS.map(
                (
                  metric
                ) => (

                  <button
                    key={
                      metric.value
                    }
                    type="button"
                    className={
                      selectedMetric ===
                      metric.value
                        ? "active"
                        : ""
                    }
                    onClick={
                      () =>
                        setSelectedMetric(
                          metric.value
                        )
                    }
                  >
                    {metric.label}
                  </button>

                )
              )
            }

          </div>

        </div>


        {
          dailyError
            ? (

              <div className="str-message error">
                {dailyError}
              </div>

            )
            : loadingDaily &&
              !dailyUnit
              ? (

                <div className="str-message">
                  Loading speciality comparison...
                </div>

              )
              : comparisonRows.length >
                0
                ? (

                  <div className="str-bars">

                    {
                      comparisonRows.map(
                        (
                          item
                        ) => {

                          const value =
                            item.valueLakhs;


                          const width =
                            Math.max(
                              2,
                              Math.min(
                                100,
                                (
                                  Math.abs(
                                    value
                                  ) /
                                  maxComparisonValue
                                ) *
                                100
                              )
                            );


                          const isHighest =
                            hasSpread &&
                            value ===
                              highestValue;


                          const isLowest =
                            hasSpread &&
                            value ===
                              lowestValue;


                          const valueClass =
                            selectedMetric ===
                              "VARIATION"
                              ? value >
                                0
                                ? "positive"
                                : value <
                                  0
                                  ? "negative"
                                  : "neutral"
                              : "";


                          return (

                            <div
                              key={
                                item.row.speciality
                              }
                              className="str-bar-row"
                            >

                              <div className="str-bar-label">

                                <div>

                                  <strong>
                                    {item.row.speciality}
                                  </strong>


                                  <span>
                                    #{item.row.serialNo}
                                  </span>

                                </div>


                                <div className="str-bar-badges">

                                  {
                                    isHighest && (

                                      <span className="highest">
                                        Highest
                                      </span>

                                    )
                                  }


                                  {
                                    isLowest && (

                                      <span className="lowest">
                                        Lowest
                                      </span>

                                    )
                                  }

                                </div>

                              </div>


                              <div className="str-bar-track">

                                <div
                                  className={`str-bar-fill ${valueClass}`}
                                  style={{
                                    width:
                                      `${width}%`,
                                  }}
                                />

                              </div>


                              <strong
                                className={`str-bar-value ${valueClass}`}
                              >
                                {formatLakhs(
                                  value
                                )}
                              </strong>

                            </div>

                          );

                        }
                      )
                    }

                  </div>

                )
                : (

                  <div className="str-empty-chart">
                    No comparison data available.
                  </div>

                )
        }


        <div className="str-footer-note">

          <Activity
            size={15}
          />


          <span>
            {metricLabel} values use the existing Speciality Revenue dashboard calculations. Variation = Projection - LM.
          </span>

        </div>

      </section>

    </div>

  );

}


export default SpecialityTrendPage;
