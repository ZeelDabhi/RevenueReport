import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  Camera,
  ChevronDown,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  LogOut,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

import api from "../services/api";

import "./DashboardPage.css";


type StoredUser = {
  id?: number;
  name?: string;
  username?: string;
  role?: string;
};


type RevenueItem = {
  importId: number;
  businessDate: string;
  fromDate: string;
  toDate: string;
  fileName: string;
  totalNetAmount: number;
  valueLakhs: number;
  available: boolean;
  updatedAt: string | null;
};


type TargetItem = {
  valueLakhs: number;
  available: boolean;
};


type ProjectionItem = {
  valueLakhs: number;
  selectedDay: number;
  totalDaysInMonth: number;
  formula: string;
};


type OccupancyItem = {
  value: number;
  occupancyDate: string | null;
  available: boolean;
  sourceFileName: string | null;
  updatedAt: string | null;
};


type GapItem = {
  valueLakhs: number;
  formula: string;
};


type DashboardUnit = {
  unitId: number;
  unitCode: string;
  unitName: string;

  FTD: RevenueItem | null;
  MTD: RevenueItem | null;
  LMTD: RevenueItem | null;

  TGT: TargetItem;
  PROJ: ProjectionItem;
  CURR_OCC: OccupancyItem;
  GAP: GapItem;
};


type DashboardData = {
  filters: {
    date: string;
    year: number;
    month: number;
    monthName: string;
    day: number;
  };

  dataStatus: {
    totalUnits: number;
    revenueCompleteUnits: number;
    occupancyCompleteUnits: number;
    revenueComplete: boolean;
    occupancyComplete: boolean;
  };

  grandTotal: {
    FTD: number;
    MTD: number;
    LMTD: number;
    TGT: number;
    PROJ: number;
    CURR_OCC: number;
    unitTargetSum: number;
    groupTargetAvailable: boolean;
    GAP: number;
  };

  units: DashboardUnit[];
};


type DashboardResponse = {
  success: boolean;
  selectedDate: string;
  data: DashboardData;
};


type RangeDay = DashboardData & {
  date: string;
};


type DashboardRangeResponse = {
  success: boolean;
  fromDate: string;
  toDate: string;

  data: {
    filters: {
      fromDate: string;
      toDate: string;
      totalCalendarDays: number;
      availableDatesCount: number;
    };

    availableDates: string[];
    days: RangeDay[];
  };
};


type ApiErrorResponse = {
  success?: boolean;
  message?: string;
};


type ReportMode =
  | "DAILY"
  | "RANGE"
  | "MONTH"
  | "YEAR";


type DownloadFormat =
  | "EXCEL"
  | "CSV"
  | "PDF"
  | "PNG";


type PeriodSelection = {
  fromDate: string;
  toDate: string;
  label: string;
  fileLabel: string;
};


const REPORT_MODE_OPTIONS: {
  value: ReportMode;
  label: string;
}[] = [
  {
    value: "DAILY",
    label: "Daily",
  },
  {
    value: "RANGE",
    label: "Date Range",
  },
  {
    value: "MONTH",
    label: "Month",
  },
  {
    value: "YEAR",
    label: "Year",
  },
];


function getYesterdayDate(): string {

  const date =
    new Date();


  date.setDate(
    date.getDate() - 1
  );


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function getStoredUser(): StoredUser {

  const storedUser =
    localStorage.getItem(
      "revenue_user"
    );


  if (
    !storedUser
  ) {

    return {};

  }


  try {

    return JSON.parse(
      storedUser
    ) as StoredUser;

  }
  catch {

    return {};

  }

}


function formatValue(
  value:
    number |
    null |
    undefined
): string {

  if (
    value === null ||
    value === undefined
  ) {

    return "-";

  }


  return value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  );

}


function formatDisplayDate(
  dateValue: string
): string {

  const [
    year,
    month,
    day,
  ] =
    dateValue.split(
      "-"
    );


  if (
    !year ||
    !month ||
    !day
  ) {

    return dateValue;

  }


  return `${day}/${month}/${year}`;

}


function formatRelativeUploadTime(
  timestamp: string | null | undefined
): string {

  if (!timestamp) {
    return "Not uploaded";
  }


  const uploadedAt =
    new Date(timestamp);


  if (
    Number.isNaN(
      uploadedAt.getTime()
    )
  ) {
    return "Unknown";
  }


  const now =
    new Date();


  const diffMs =
    now.getTime() -
    uploadedAt.getTime();


  if (diffMs < 0) {
    return "Updated just now";
  }


  const minutes =
    Math.floor(
      diffMs / 60000
    );


  if (minutes < 1) {
    return "Updated just now";
  }


  if (minutes < 60) {

    return `Updated ${minutes} min${minutes === 1 ? "" : "s"} ago`;

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (hours < 24) {

    return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;

  }


  const formatted =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          true,
      }
    ).format(
      uploadedAt
    );


  return `Uploaded ${formatted}`;

}


function safeFileName(
  value: string
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
      /^-+|-+$/g,
      ""
    );

}


function getMonthStartEnd(
  monthValue: string
): {
  fromDate: string;
  toDate: string;
} {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        monthValue
      );


  if (
    !match
  ) {

    throw new Error(
      "Please select a valid month."
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


  const totalDays =
    new Date(
      Date.UTC(
        year,
        month,
        0
      )
    ).getUTCDate();


  return {
    fromDate:
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-01`,

    toDate:
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        totalDays
      ).padStart(
        2,
        "0"
      )}`,
  };

}


function getMonthDisplayName(
  monthValue: string
): string {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        monthValue
      );


  if (
    !match
  ) {

    return monthValue;

  }


  const year =
    Number(
      match[1]
    );


  const month =
    Number(
      match[2]
    );


  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "long",
      year:
        "numeric",
      timeZone:
        "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        1
      )
    )
  );

}


function DashboardPage() {

  const navigate =
    useNavigate();


  const dashboardSnapshotRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const downloadRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const [
    user,
  ] =
    useState<StoredUser>(
      getStoredUser
    );


  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    reportMode,
    setReportMode,
  ] =
    useState<ReportMode>(
      "DAILY"
    );


  const [
    rangeFromDate,
    setRangeFromDate,
  ] =
    useState(
      () => {

        const date =
          getYesterdayDate();


        return `${date.slice(
          0,
          8
        )}01`;

      }
    );


  const [
    rangeToDate,
    setRangeToDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      () =>
        getYesterdayDate()
          .slice(
            0,
            7
          )
    );


  const [
    selectedYear,
    setSelectedYear,
  ] =
    useState(
      () =>
        Number(
          getYesterdayDate()
            .slice(
              0,
              4
            )
        )
    );


  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);


  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardResponse | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    downloadOpen,
    setDownloadOpen,
  ] =
    useState(false);


  const [
    downloadLoading,
    setDownloadLoading,
  ] =
    useState(false);


  const [
    downloadError,
    setDownloadError,
  ] =
    useState("");


  // ======================================================
  // LOAD DAILY DASHBOARD
  //
  // The visible dashboard remains daily.
  // The period selector controls what gets downloaded.
  // ======================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      api.get<DashboardResponse>(
        "/revenue/dashboard",
        {
          params: {
            date:
              selectedDate,
          },

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


            setDashboard(
              response.data
            );


            setError(
              ""
            );

          }
        )
        .catch(
          (
            err: unknown
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


              setError(
                responseData?.message ||
                "Unable to load dashboard."
              );


              return;

            }


            setError(
              "Unable to load dashboard."
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
      selectedDate,
      refreshKey,
      navigate,
    ]
  );


  // ======================================================
  // DOWNLOAD MENU OUTSIDE CLICK
  // ======================================================

  useEffect(
    () => {

      const handleOutsideClick =
        (
          event: MouseEvent
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

        };


      const handleEscape =
        (
          event: KeyboardEvent
        ) => {

          if (
            event.key ===
            "Escape"
          ) {

            setDownloadOpen(
              false
            );

          }

        };


      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );


      document.addEventListener(
        "keydown",
        handleEscape
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          handleOutsideClick
        );


        document.removeEventListener(
          "keydown",
          handleEscape
        );

      };

    },
    []
  );


  const handleDateChange =
    (
      value: string
    ) => {

      if (
        !value
      ) {

        return;

      }


      setLoading(
        true
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


      if (
        reportMode ===
        "DAILY"
      ) {

        setRangeToDate(
          value
        );


        setSelectedMonth(
          value.slice(
            0,
            7
          )
        );


        setSelectedYear(
          Number(
            value.slice(
              0,
              4
            )
          )
        );

      }

    };


  const handleReportModeChange =
    (
      value: ReportMode
    ) => {

      setReportMode(
        value
      );


      setDownloadOpen(
        false
      );


      setDownloadError(
        ""
      );


      if (
        value ===
        "DAILY"
      ) {

        return;

      }


      if (
        value ===
        "RANGE"
      ) {

        setRangeToDate(
          selectedDate
        );


        setRangeFromDate(
          `${selectedDate.slice(
            0,
            8
          )}01`
        );


        return;

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


        return;

      }


      setSelectedYear(
        Number(
          selectedDate.slice(
            0,
            4
          )
        )
      );

    };


  const handleRefresh =
    () => {

      setLoading(
        true
      );


      setError(
        ""
      );


      setDownloadError(
        ""
      );


      setRefreshKey(
        (
          current
        ) =>
          current + 1
      );

    };


  const logout =
    () => {

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

    };


  const data =
    dashboard?.data;

  // ======================================================
  // DATA FRESHNESS
  // ======================================================

  const getLatestTimestamp =
    (
      timestamps:
        (
          string |
          null |
          undefined
        )[]
    ): string | null => {

      const validTimestamps =
        timestamps
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b
              ).getTime() -
              new Date(
                a
              ).getTime()
          );


      return validTimestamps[0] ??
        null;

    };


  const freshness =
    data
      ? {

          FTD: {

            uploaded:
              data.units.filter(
                (unit) =>
                  Boolean(
                    unit.FTD?.available
                  )
              ).length,

            missingUnits:
              data.units
                .filter(
                  (unit) =>
                    !unit.FTD?.available
                )
                .map(
                  (unit) =>
                    unit.unitCode
                ),

            updatedAt:
              getLatestTimestamp(
                data.units.map(
                  (unit) =>
                    unit.FTD?.updatedAt
                )
              ),

          },


          MTD: {

            uploaded:
              data.units.filter(
                (unit) =>
                  Boolean(
                    unit.MTD?.available
                  )
              ).length,

            missingUnits:
              data.units
                .filter(
                  (unit) =>
                    !unit.MTD?.available
                )
                .map(
                  (unit) =>
                    unit.unitCode
                ),

            updatedAt:
              getLatestTimestamp(
                data.units.map(
                  (unit) =>
                    unit.MTD?.updatedAt
                )
              ),

          },


          LMTD: {

            uploaded:
              data.units.filter(
                (unit) =>
                  Boolean(
                    unit.LMTD?.available
                  )
              ).length,

            missingUnits:
              data.units
                .filter(
                  (unit) =>
                    !unit.LMTD?.available
                )
                .map(
                  (unit) =>
                    unit.unitCode
                ),

            updatedAt:
              getLatestTimestamp(
                data.units.map(
                  (unit) =>
                    unit.LMTD?.updatedAt
                )
              ),

          },


          OCCUPANCY: {

            uploaded:
              data.units.filter(
                (unit) =>
                  unit.CURR_OCC.available
              ).length,

            missingUnits:
              data.units
                .filter(
                  (unit) =>
                    !unit.CURR_OCC.available
                )
                .map(
                  (unit) =>
                    unit.unitCode
                ),

            updatedAt:
              getLatestTimestamp(
                data.units.map(
                  (unit) =>
                    unit.CURR_OCC.updatedAt
                )
              ),

          },

        }
      : null;


  // ======================================================
  // PERIOD SELECTION
  // ======================================================

  const getPeriodSelection =
    (): PeriodSelection => {

      if (
        reportMode ===
        "DAILY"
      ) {

        return {
          fromDate:
            selectedDate,
          toDate:
            selectedDate,
          label:
            `Date - ${formatDisplayDate(
              selectedDate
            )}`,
          fileLabel:
            `Date-${selectedDate}`,
        };

      }


      if (
        reportMode ===
        "RANGE"
      ) {

        if (
          !rangeFromDate ||
          !rangeToDate
        ) {

          throw new Error(
            "Please select From Date and To Date."
          );

        }


        if (
          rangeFromDate >
          rangeToDate
        ) {

          throw new Error(
            "From Date cannot be after To Date."
          );

        }


        const from =
          new Date(
            `${rangeFromDate}T00:00:00Z`
          );


        const to =
          new Date(
            `${rangeToDate}T00:00:00Z`
          );


        const totalDays =
          Math.floor(
            (
              to.getTime() -
              from.getTime()
            ) /
            (
              24 *
              60 *
              60 *
              1000
            )
          ) +
          1;


        if (
          totalDays >
          366
        ) {

          throw new Error(
            "Maximum Date Range is 366 days."
          );

        }


        return {
          fromDate:
            rangeFromDate,
          toDate:
            rangeToDate,
          label:
            `${formatDisplayDate(
              rangeFromDate
            )} to ${formatDisplayDate(
              rangeToDate
            )}`,
          fileLabel:
            `Range-${rangeFromDate}-to-${rangeToDate}`,
        };

      }


      if (
        reportMode ===
        "MONTH"
      ) {

        const bounds =
          getMonthStartEnd(
            selectedMonth
          );


        return {
          fromDate:
            bounds.fromDate,
          toDate:
            bounds.toDate,
          label:
            getMonthDisplayName(
              selectedMonth
            ),
          fileLabel:
            `Month-${selectedMonth}`,
        };

      }


      if (
        !Number.isInteger(
          selectedYear
        ) ||
        selectedYear <
          2000 ||
        selectedYear >
          2100
      ) {

        throw new Error(
          "Please select a valid year."
        );

      }


      return {
        fromDate:
          `${selectedYear}-01-01`,
        toDate:
          `${selectedYear}-12-31`,
        label:
          `Year ${selectedYear}`,
        fileLabel:
          `Year-${selectedYear}`,
      };

    };


  const getPeriodPreview =
    (): string => {

      try {

        return getPeriodSelection()
          .label;

      }
      catch {

        return "Select report period";

      }

    };


  // ======================================================
  // LOAD EXPORT DAYS
  //
  // Daily:
  // Uses current visible dashboard.
  //
  // Range / Month / Year:
  // Uses one optimized dashboard-range API call.
  // ======================================================

  const getExportDays =
    async (
      selection: PeriodSelection
    ): Promise<RangeDay[]> => {

      if (
        reportMode ===
        "DAILY"
      ) {

        if (
          !data
        ) {

          throw new Error(
            "Dashboard data is not available."
          );

        }


        return [
          {
            date:
              data.filters.date,
            ...data,
          },
        ];

      }


      const response =
        await api.get<DashboardRangeResponse>(
          "/revenue/dashboard-range",
          {
            params: {
              fromDate:
                selection.fromDate,
              toDate:
                selection.toDate,
            },
          }
        );


      return response.data.data.days ??
        [];

    };


  // ======================================================
  // FLAT EXPORT ROWS
  // ======================================================

  const buildFlatRows =
    (
      days: RangeDay[]
    ) => {

      const rows:
        (
          string |
          number
        )[][] =
        [];


      for (
        const day
        of days
      ) {

        for (
          const unit
          of day.units
        ) {

          rows.push([
            day.date,
            unit.unitCode,
            unit.unitName,

            unit.FTD?.available
              ? unit.FTD.valueLakhs
              : "",

            unit.MTD?.available
              ? unit.MTD.valueLakhs
              : "",

            unit.LMTD?.available
              ? unit.LMTD.valueLakhs
              : "",

            unit.TGT.available
              ? unit.TGT.valueLakhs
              : "",

            unit.PROJ.valueLakhs,

            unit.CURR_OCC.available
              ? unit.CURR_OCC.value
              : "",

            unit.GAP.valueLakhs,
          ]);

        }


        rows.push([
          day.date,
          "TOTAL",
          "TOTAL",

          day.grandTotal.FTD,
          day.grandTotal.MTD,
          day.grandTotal.LMTD,
          day.grandTotal.TGT,
          day.grandTotal.PROJ,
          day.grandTotal.CURR_OCC,
          day.grandTotal.GAP,
        ]);

      }


      return rows;

    };


  const buildDailySummaryRows =
    (
      days: RangeDay[]
    ) => {

      return days.map(
        (
          day
        ) => ([
          day.date,
          day.grandTotal.FTD,
          day.grandTotal.MTD,
          day.grandTotal.LMTD,
          day.grandTotal.TGT,
          day.grandTotal.PROJ,
          day.grandTotal.CURR_OCC,
          day.grandTotal.GAP,

          `${day.dataStatus.revenueCompleteUnits}/${day.dataStatus.totalUnits}`,

          `${day.dataStatus.occupancyCompleteUnits}/${day.dataStatus.totalUnits}`,
        ])
      );

    };


  // ======================================================
  // EXCEL EXPORT
  // ======================================================

  const exportExcel =
    (
      days: RangeDay[],
      selection: PeriodSelection
    ) => {

      const workbook =
        XLSX.utils.book_new();


      const summaryData =
        [
          [
            "Aayush Group of Hospitals",
          ],
          [
            "Revenue Dashboard",
          ],
          [
            "Report Period",
            selection.label,
          ],
          [
            "From Date",
            selection.fromDate,
          ],
          [
            "To Date",
            selection.toDate,
          ],
          [
            "Available Dashboard Dates",
            days.length,
          ],
          [],
          [
            "DATE",
            "FTD",
            "MTD",
            "LMTD",
            "TGT",
            "PROJ",
            "CURR OCC",
            "GAP",
            "REVENUE UPLOADED",
            "OCCUPANCY UPLOADED",
          ],
          ...buildDailySummaryRows(
            days
          ),
        ];


      const summarySheet =
        XLSX.utils.aoa_to_sheet(
          summaryData
        );


      summarySheet["!cols"] = [
        {
          wch:
            15,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            20,
        },
        {
          wch:
            22,
        },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Daily Summary"
      );


      const detailData =
        [
          [
            "DATE",
            "UNIT CODE",
            "UNIT NAME",
            "FTD",
            "MTD",
            "LMTD",
            "TGT",
            "PROJ",
            "CURR OCC",
            "GAP",
          ],
          ...buildFlatRows(
            days
          ),
        ];


      const detailSheet =
        XLSX.utils.aoa_to_sheet(
          detailData
        );


      detailSheet["!cols"] = [
        {
          wch:
            15,
        },
        {
          wch:
            12,
        },
        {
          wch:
            24,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
        {
          wch:
            14,
        },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        detailSheet,
        "Unit Detail"
      );


      XLSX.writeFile(
        workbook,
        `Revenue-Dashboard-${safeFileName(
          selection.fileLabel
        )}.xlsx`
      );

    };


  // ======================================================
  // CSV EXPORT
  // ======================================================

  const exportCsv =
    (
      days: RangeDay[],
      selection: PeriodSelection
    ) => {

      const csvData =
        [
          [
            "REPORT PERIOD",
            selection.label,
          ],
          [
            "FROM DATE",
            selection.fromDate,
          ],
          [
            "TO DATE",
            selection.toDate,
          ],
          [],
          [
            "DATE",
            "UNIT CODE",
            "UNIT NAME",
            "FTD",
            "MTD",
            "LMTD",
            "TGT",
            "PROJ",
            "CURR OCC",
            "GAP",
          ],
          ...buildFlatRows(
            days
          ),
        ];


      const worksheet =
        XLSX.utils.aoa_to_sheet(
          csvData
        );


      const csv =
        XLSX.utils.sheet_to_csv(
          worksheet
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
        `Revenue-Dashboard-${safeFileName(
          selection.fileLabel
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


  // ======================================================
  // PDF EXPORT
  // ======================================================

  const exportPdf =
    (
      days: RangeDay[],
      selection: PeriodSelection
    ) => {

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
        14
      );


      pdf.text(
        "Aayush Group of Hospitals - Revenue Dashboard",
        14,
        13
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        `Report Period: ${selection.label}`,
        14,
        20
      );


      pdf.text(
        `Available Dates: ${days.length}`,
        220,
        20
      );


      const body:
        string[][] =
        [];


      for (
        const day
        of days
      ) {

        for (
          const unit
          of day.units
        ) {

          body.push([
            formatDisplayDate(
              day.date
            ),

            unit.unitCode,

            unit.unitName,

            unit.FTD?.available
              ? formatValue(
                  unit.FTD.valueLakhs
                )
              : "-",

            unit.MTD?.available
              ? formatValue(
                  unit.MTD.valueLakhs
                )
              : "-",

            unit.LMTD?.available
              ? formatValue(
                  unit.LMTD.valueLakhs
                )
              : "-",

            unit.TGT.available
              ? formatValue(
                  unit.TGT.valueLakhs
                )
              : "-",

            formatValue(
              unit.PROJ.valueLakhs
            ),

            unit.CURR_OCC.available
              ? String(
                  unit.CURR_OCC.value
                )
              : "-",

            formatValue(
              unit.GAP.valueLakhs
            ),
          ]);

        }


        body.push([
          formatDisplayDate(
            day.date
          ),
          "TOTAL",
          "TOTAL",

          formatValue(
            day.grandTotal.FTD
          ),

          formatValue(
            day.grandTotal.MTD
          ),

          formatValue(
            day.grandTotal.LMTD
          ),

          formatValue(
            day.grandTotal.TGT
          ),

          formatValue(
            day.grandTotal.PROJ
          ),

          String(
            day.grandTotal.CURR_OCC
          ),

          formatValue(
            day.grandTotal.GAP
          ),
        ]);

      }


      autoTable(
        pdf,
        {
          startY:
            26,

          head: [[
            "DATE",
            "UNIT",
            "UNIT NAME",
            "FTD",
            "MTD",
            "LMTD",
            "TGT",
            "PROJ",
            "CURR OCC",
            "GAP",
          ]],

          body,

          theme:
            "grid",

          styles: {
            fontSize:
              6.6,
            cellPadding:
              1.45,
          },

          headStyles: {
            fontStyle:
              "bold",
          },

          columnStyles: {
            0: {
              cellWidth:
                20,
            },
            1: {
              cellWidth:
                15,
            },
            2: {
              cellWidth:
                33,
            },
          },

          didParseCell:
            (
              hookData
            ) => {

              if (
                hookData.section ===
                  "body" &&
                hookData.row.raw &&
                Array.isArray(
                  hookData.row.raw
                ) &&
                hookData.row.raw[1] ===
                  "TOTAL"
              ) {

                hookData.cell.styles.fontStyle =
                  "bold";

              }

            },
        }
      );


      pdf.save(
        `Revenue-Dashboard-${safeFileName(
          selection.fileLabel
        )}.pdf`
      );

    };


  // ======================================================
  // PNG SNAPSHOT
  //
  // Captures the complete visible Daily Dashboard report
  // as a high-resolution PNG.
  //
  // Navigation controls, user/logout area and download
  // controls are excluded from the snapshot.
  // ======================================================

  const exportPngSnapshot =
    async () => {

      const element =
        dashboardSnapshotRef.current;


      if (
        !element
      ) {

        throw new Error(
          "Dashboard snapshot area is not available."
        );

      }


      // Close the dropdown before capture.
      setDownloadOpen(
        false
      );


      // Wait for React/DOM to paint the closed menu state.
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


      const canvas =
        await html2canvas(
          element,
          {
            backgroundColor:
              "#f3f6fb",

            scale:
              3,

            useCORS:
              true,

            logging:
              false,

            // Snapshot layout width is intentionally kept
            // slightly narrower than the normal desktop view
            // so text occupies more of the exported image.
            windowWidth:
              1280,

            onclone:
              (
                clonedDocument
              ) => {

                const style =
                  clonedDocument.createElement(
                    "style"
                  );


                style.textContent = `
                  .revenue-dashboard {
                    background: #f3f8f9 !important;
                  }

                  .rd-main {
                    padding-left: 26px !important;
                    padding-right: 26px !important;
                  }

                  .rd-brand p {
                    font-size: 13px !important;
                    font-weight: 900 !important;
                  }

                  .rd-brand h1 {
                    font-size: 31px !important;
                    font-weight: 900 !important;
                  }

                  .rd-toolbar h2 {
                    font-size: 28px !important;
                    font-weight: 900 !important;
                  }

                  .rd-toolbar p {
                    font-size: 15px !important;
                    font-weight: 600 !important;
                  }

                  .rd-selected-period {
                    min-height: 52px !important;
                  }

                  .rd-selected-period > span {
                    font-size: 12px !important;
                    font-weight: 900 !important;
                  }

                  .rd-selected-period > strong {
                    font-size: 16px !important;
                    font-weight: 900 !important;
                  }

                  .rd-summary-card {
                    min-height: 118px !important;
                    padding: 20px !important;
                  }

                  .rd-summary-card p {
                    font-size: 15px !important;
                    font-weight: 800 !important;
                  }

                  .rd-summary-card strong {
                    font-size: 27px !important;
                    font-weight: 900 !important;
                  }

                  .rd-status-row > div {
                    min-height: 76px !important;
                  }

                  .rd-status-row span {
                    font-size: 14px !important;
                    font-weight: 800 !important;
                  }

                  .rd-status-row strong {
                    font-size: 20px !important;
                    font-weight: 900 !important;
                  }

                  .rd-table-heading {
                    min-height: 78px !important;
                  }

                  .rd-table-heading h3 {
                    font-size: 21px !important;
                    font-weight: 900 !important;
                  }

                  .rd-table-heading p {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                  }

                  .rd-table-wrap th {
                    padding: 17px 12px !important;
                    font-size: 17px !important;
                    font-weight: 900 !important;
                  }

                  .rd-table-wrap td {
                    height: 70px !important;
                    padding: 12px 10px !important;
                    font-size: 19px !important;
                    font-weight: 900 !important;
                  }

                  .rd-unit > span {
                    width: 50px !important;
                    height: 42px !important;
                    font-size: 14px !important;
                    font-weight: 900 !important;
                  }

                  .rd-gap {
                    font-size: 19px !important;
                    font-weight: 900 !important;
                  }

                  .rd-total-row td {
                    height: 72px !important;
                    font-size: 20px !important;
                    font-weight: 900 !important;
                  }
                `;


                clonedDocument.head.appendChild(
                  style
                );

              },

            ignoreElements:
              (
                node
              ) => {

                const elementNode =
                  node as HTMLElement;


                return (
                  elementNode.classList?.contains(
                    "rd-user-area"
                  ) ||
                  elementNode.classList?.contains(
                    "rd-toolbar-actions"
                  ) ||
                  elementNode.classList?.contains(
                    "rd-download-menu"
                  )
                );

              },
          }
        );


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
                      "Unable to create PNG snapshot."
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
        `Revenue-Dashboard-Snapshot-${selectedDate}.png`;


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


  // ======================================================
  // DOWNLOAD HANDLER
  // ======================================================

  const handleDownload =
    async (
      format: DownloadFormat
    ) => {

      setDownloadError(
        ""
      );


      try {

        setDownloadLoading(
          true
        );


        if (
          format ===
          "PNG"
        ) {

          await exportPngSnapshot();

          return;

        }


        const selection =
          getPeriodSelection();


        const days =
          await getExportDays(
            selection
          );


        if (
          days.length ===
          0
        ) {

          setDownloadError(
            "No dashboard data is available for the selected period."
          );


          setDownloadOpen(
            false
          );


          return;

        }


        if (
          format ===
          "EXCEL"
        ) {

          exportExcel(
            days,
            selection
          );

        }
        else if (
          format ===
          "CSV"
        ) {

          exportCsv(
            days,
            selection
          );

        }
        else {

          exportPdf(
            days,
            selection
          );

        }


        setDownloadOpen(
          false
        );

      }
      catch (
        err
      ) {

        if (
          axios.isAxiosError(
            err
          )
        ) {

          const responseData =
            err.response?.data as
              | ApiErrorResponse
              | undefined;


          setDownloadError(
            responseData?.message ||
            "Unable to prepare download."
          );

        }
        else if (
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


  return (

    <div
      className="revenue-dashboard"
      ref={
        dashboardSnapshotRef
      }
    >

      <header className="rd-header">

        <div className="rd-brand">

          <p>
            Aayush Group of Hospitals
          </p>

          <h1>
            Revenue Dashboard
          </h1>

        </div>


        <div className="rd-user-area">

          <div className="rd-user-details">

            <strong>

              {
                user.name ||
                user.username ||
                "User"
              }

            </strong>


            <span>

              {
                user.role
                  ?.replaceAll(
                    "_",
                    " "
                  ) ||
                ""
              }

            </span>

          </div>


          <button
            type="button"
            className="rd-logout"
            onClick={
              logout
            }
          >

            <LogOut
              size={17}
            />

            Logout

          </button>

        </div>

      </header>


      <main className="rd-main">

        <section className="rd-toolbar">

          <div className="rd-toolbar-copy">

            <h2>
              Revenue Flash
            </h2>

            <p>
              Revenue values are shown in Lakhs. Select Daily, Date Range, Month or Year for download.
            </p>

          </div>


          <div className="rd-toolbar-actions">

            <div className="rd-period-selector">

              <div className="rd-period-mode">

                <label>
                  Report
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
                    REPORT_MODE_OPTIONS.map(
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


              {
                reportMode ===
                  "DAILY" && (

                  <div className="rd-period-control">

                    <label>
                      Date
                    </label>

                    <div className="rd-date-control">

                      <CalendarDays
                        size={17}
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


              {
                reportMode ===
                  "RANGE" && (

                  <div className="rd-range-controls">

                    <div className="rd-period-control">

                      <label>
                        From
                      </label>

                      <div className="rd-date-control">

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
                            ) => {

                              setRangeFromDate(
                                event.target.value
                              );


                              setDownloadError(
                                ""
                              );

                            }
                          }
                        />

                      </div>

                    </div>


                    <span className="rd-range-separator">
                      to
                    </span>


                    <div className="rd-period-control">

                      <label>
                        To
                      </label>

                      <div className="rd-date-control">

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
                            ) => {

                              setRangeToDate(
                                event.target.value
                              );


                              setDownloadError(
                                ""
                              );

                            }
                          }
                        />

                      </div>

                    </div>

                  </div>

                )
              }


              {
                reportMode ===
                  "MONTH" && (

                  <div className="rd-period-control">

                    <label>
                      Month
                    </label>

                    <div className="rd-date-control">

                      <CalendarDays
                        size={17}
                      />

                      <input
                        type="month"
                        value={
                          selectedMonth
                        }
                        onChange={
                          (
                            event
                          ) => {

                            setSelectedMonth(
                              event.target.value
                            );


                            setDownloadError(
                              ""
                            );

                          }
                        }
                      />

                    </div>

                  </div>

                )
              }


              {
                reportMode ===
                  "YEAR" && (

                  <div className="rd-period-control">

                    <label>
                      Year
                    </label>

                    <select
                      className="rd-year-select"
                      value={
                        selectedYear
                      }
                      onChange={
                        (
                          event
                        ) => {

                          setSelectedYear(
                            Number(
                              event.target.value
                            )
                          );


                          setDownloadError(
                            ""
                          );

                        }
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

                )
              }

            </div>


            <button
              type="button"
              className="rd-refresh"
              onClick={
                handleRefresh
              }
              disabled={
                loading
              }
              title="Refresh visible daily dashboard"
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


            <div
              className="rd-download-wrap"
              ref={
                downloadRef
              }
            >

              <button
                type="button"
                className="rd-download-button"
                onClick={
                  () =>
                    setDownloadOpen(
                      (
                        current
                      ) =>
                        !current
                    )
                }
                disabled={
                  loading ||
                  downloadLoading ||
                  !data
                }
                aria-expanded={
                  downloadOpen
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
                      ? "rd-download-chevron open"
                      : "rd-download-chevron"
                  }
                />

              </button>


              {
                downloadOpen &&
                data && (

                  <div className="rd-download-menu">

                    <div className="rd-download-menu-header">

                      <span>
                        Download Period
                      </span>

                      <strong>
                        {getPeriodPreview()}
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

                      <span className="csv">

                        <Camera
                          size={18}
                        />

                      </span>

                      <div>

                        <strong>
                          PNG Snapshot
                        </strong>

                        <small>
                          Current dashboard .png
                        </small>

                      </div>

                    </button>

                  </div>

                )
              }

            </div>

          </div>

        </section>


        <div className="rd-selected-period">

          <span>
            Download Selection
          </span>

          <strong>
            {getPeriodPreview()}
          </strong>

          {
            reportMode !==
              "DAILY" && (

              <small>
                Dashboard below remains the selected Daily Dashboard. Download uses the period selected above.
              </small>

            )
          }

        </div>


        {
          error && (

            <div className="rd-error">

              {error}

            </div>

          )
        }


        {
          downloadError && (

            <div className="rd-error">

              {downloadError}

            </div>

          )
        }


        {
          loading &&
          !dashboard
            ? (

              <div className="rd-loading">

                <RefreshCw
                  size={24}
                  className="spin"
                />

                Loading dashboard...

              </div>

            )
            : data && (

              <>

                <section className="rd-summary-grid">

                  <div className="rd-summary-card">

                    <span className="rd-summary-icon blue">

                      <WalletCards
                        size={19}
                      />

                    </span>


                    <div>

                      <p>
                        FTD Revenue
                      </p>

                      <strong>

                        ₹{" "}

                        {
                          formatValue(
                            data.grandTotal.FTD
                          )
                        }

                        {" "}L

                      </strong>

                    </div>

                  </div>


                  <div className="rd-summary-card">

                    <span className="rd-summary-icon teal">

                      <TrendingUp
                        size={19}
                      />

                    </span>


                    <div>

                      <p>
                        MTD Revenue
                      </p>

                      <strong>

                        ₹{" "}

                        {
                          formatValue(
                            data.grandTotal.MTD
                          )
                        }

                        {" "}L

                      </strong>

                    </div>

                  </div>


                  <div className="rd-summary-card">

                    <span className="rd-summary-icon violet">

                      <TrendingUp
                        size={19}
                      />

                    </span>


                    <div>

                      <p>
                        Projection
                      </p>

                      <strong>

                        ₹{" "}

                        {
                          formatValue(
                            data.grandTotal.PROJ
                          )
                        }

                        {" "}L

                      </strong>

                    </div>

                  </div>


                  <div className="rd-summary-card">

                    <span
                      className={
                        data.grandTotal.GAP >=
                        0
                          ? "rd-summary-icon green"
                          : "rd-summary-icon red"
                      }
                    >

                      {
                        data.grandTotal.GAP >=
                        0
                          ? (

                            <TrendingUp
                              size={19}
                            />

                          )
                          : (

                            <TrendingDown
                              size={19}
                            />

                          )
                      }

                    </span>


                    <div>

                      <p>
                        GAP
                      </p>

                      <strong
                        className={
                          data.grandTotal.GAP >=
                          0
                            ? "positive"
                            : "negative"
                        }
                      >

                        ₹{" "}

                        {
                          formatValue(
                            data.grandTotal.GAP
                          )
                        }

                        {" "}L

                      </strong>

                    </div>

                  </div>

                </section>


                {
                  freshness && (

                    <section className="rd-data-health">

                      <div
                        className={
                          freshness.FTD.missingUnits.length === 0
                            ? "rd-health-cell"
                            : "rd-health-cell has-missing"
                        }
                      >

                        <div className="rd-health-main">

                          <span className="rd-health-title">

                            <i
                              className={
                                freshness.FTD.missingUnits.length === 0
                                  ? "rd-health-dot ok"
                                  : "rd-health-dot warning"
                              }
                            />

                            FTD

                          </span>

                          <strong>
                            {freshness.FTD.uploaded}/{data.dataStatus.totalUnits}
                          </strong>

                        </div>

                        <small>
                          {formatRelativeUploadTime(freshness.FTD.updatedAt)}
                        </small>

                        {
                          freshness.FTD.missingUnits.length > 0 && (

                            <em>
                              Missing: {freshness.FTD.missingUnits.join(", ")}
                            </em>

                          )
                        }

                      </div>


                      <div
                        className={
                          freshness.MTD.missingUnits.length === 0
                            ? "rd-health-cell"
                            : "rd-health-cell has-missing"
                        }
                      >

                        <div className="rd-health-main">

                          <span className="rd-health-title">

                            <i
                              className={
                                freshness.MTD.missingUnits.length === 0
                                  ? "rd-health-dot ok"
                                  : "rd-health-dot warning"
                              }
                            />

                            MTD

                          </span>

                          <strong>
                            {freshness.MTD.uploaded}/{data.dataStatus.totalUnits}
                          </strong>

                        </div>

                        <small>
                          {formatRelativeUploadTime(freshness.MTD.updatedAt)}
                        </small>

                        {
                          freshness.MTD.missingUnits.length > 0 && (

                            <em>
                              Missing: {freshness.MTD.missingUnits.join(", ")}
                            </em>

                          )
                        }

                      </div>


                      <div
                        className={
                          freshness.LMTD.missingUnits.length === 0
                            ? "rd-health-cell"
                            : "rd-health-cell has-missing"
                        }
                      >

                        <div className="rd-health-main">

                          <span className="rd-health-title">

                            <i
                              className={
                                freshness.LMTD.missingUnits.length === 0
                                  ? "rd-health-dot ok"
                                  : "rd-health-dot warning"
                              }
                            />

                            LMTD

                          </span>

                          <strong>
                            {freshness.LMTD.uploaded}/{data.dataStatus.totalUnits}
                          </strong>

                        </div>

                        <small>
                          {formatRelativeUploadTime(freshness.LMTD.updatedAt)}
                        </small>

                        {
                          freshness.LMTD.missingUnits.length > 0 && (

                            <em>
                              Missing: {freshness.LMTD.missingUnits.join(", ")}
                            </em>

                          )
                        }

                      </div>


                      <div
                        className={
                          freshness.OCCUPANCY.missingUnits.length === 0
                            ? "rd-health-cell"
                            : "rd-health-cell has-missing"
                        }
                      >

                        <div className="rd-health-main">

                          <span className="rd-health-title">

                            <i
                              className={
                                freshness.OCCUPANCY.missingUnits.length === 0
                                  ? "rd-health-dot ok"
                                  : "rd-health-dot warning"
                              }
                            />

                            Occupancy

                          </span>

                          <strong>
                            {freshness.OCCUPANCY.uploaded}/{data.dataStatus.totalUnits}
                          </strong>

                        </div>

                        <small>
                          {formatRelativeUploadTime(freshness.OCCUPANCY.updatedAt)}
                        </small>

                        {
                          freshness.OCCUPANCY.missingUnits.length > 0 && (

                            <em>
                              Missing: {freshness.OCCUPANCY.missingUnits.join(", ")}
                            </em>

                          )
                        }

                      </div>


                      <div className="rd-health-cell rd-health-metric">

                        <span>
                          Group Target
                        </span>

                        <strong>
                          {"\u20B9 "}
                          {formatValue(data.grandTotal.TGT)}
                          {" L"}
                        </strong>

                        <small>
                          Monthly Target
                        </small>

                      </div>


                      <div className="rd-health-cell rd-health-metric">

                        <span>
                          Current Occupancy
                        </span>

                        <strong>
                          {data.grandTotal.CURR_OCC}
                        </strong>

                        <small>
                          Current Beds
                        </small>

                      </div>

                    </section>

                  )
                }


                <section className="rd-table-card">

                  <div className="rd-table-heading">

                    <div>

                      <h3>
                        Unit Wise Revenue
                      </h3>

                      <p>

                        {
                          data.filters.monthName
                        }

                        {" "}

                        {
                          data.filters.day
                        }

                        ,

                        {" "}

                        {
                          data.filters.year
                        }

                      </p>

                    </div>

                  </div>


                  <div className="rd-table-wrap">

                    <table>

                      <thead>

                        <tr>

                          <th>
                            UNIT
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
                            TGT
                          </th>

                          <th>
                            PROJ
                          </th>

                          <th>
                            CURR OCC
                          </th>

                          <th>
                            GAP
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          data.units.map(
                            (
                              unit
                            ) => (

                              <tr
                                key={
                                  unit.unitId
                                }
                              >

                                <td>

                                  <div className="rd-unit">

                                    <span>

                                      {
                                        unit.unitCode
                                      }

                                    </span>


                                    <div>

                                      <strong>

                                        {
                                          unit.unitName
                                        }

                                      </strong>

                                    </div>

                                  </div>

                                </td>


                                <td>

                                  {
                                    unit.FTD?.available
                                      ? formatValue(
                                          unit.FTD.valueLakhs
                                        )
                                      : "-"
                                  }

                                </td>


                                <td>

                                  {
                                    unit.MTD?.available
                                      ? formatValue(
                                          unit.MTD.valueLakhs
                                        )
                                      : "-"
                                  }

                                </td>


                                <td>

                                  {
                                    unit.LMTD?.available
                                      ? formatValue(
                                          unit.LMTD.valueLakhs
                                        )
                                      : "-"
                                  }

                                </td>


                                <td>

                                  {
                                    unit.TGT.available
                                      ? formatValue(
                                          unit.TGT.valueLakhs
                                        )
                                      : "-"
                                  }

                                </td>


                                <td>

                                  {
                                    formatValue(
                                      unit.PROJ.valueLakhs
                                    )
                                  }

                                </td>


                                <td>

                                  {
                                    unit.CURR_OCC.available
                                      ? unit.CURR_OCC.value
                                      : "-"
                                  }

                                </td>


                                <td>

                                  <span
                                    className={
                                      unit.GAP.valueLakhs >=
                                      0
                                        ? "rd-gap positive"
                                        : "rd-gap negative"
                                    }
                                  >

                                    {
                                      formatValue(
                                        unit.GAP.valueLakhs
                                      )
                                    }

                                  </span>

                                </td>

                              </tr>

                            )
                          )
                        }


                        <tr className="rd-total-row">

                          <td>
                            TOTAL
                          </td>


                          <td>
                            {
                              formatValue(
                                data.grandTotal.FTD
                              )
                            }
                          </td>


                          <td>
                            {
                              formatValue(
                                data.grandTotal.MTD
                              )
                            }
                          </td>


                          <td>
                            {
                              formatValue(
                                data.grandTotal.LMTD
                              )
                            }
                          </td>


                          <td>
                            {
                              formatValue(
                                data.grandTotal.TGT
                              )
                            }
                          </td>


                          <td>
                            {
                              formatValue(
                                data.grandTotal.PROJ
                              )
                            }
                          </td>


                          <td>
                            {
                              data.grandTotal.CURR_OCC
                            }
                          </td>


                          <td>

                            <span
                              className={
                                data.grandTotal.GAP >=
                                0
                                  ? "rd-gap positive"
                                  : "rd-gap negative"
                              }
                            >

                              {
                                formatValue(
                                  data.grandTotal.GAP
                                )
                              }

                            </span>

                          </td>

                        </tr>

                      </tbody>

                    </table>

                  </div>

                </section>

              </>

            )
        }

      </main>

    </div>

  );

}


export default DashboardPage;





