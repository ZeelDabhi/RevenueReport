import {

  useEffect,

  useState,

} from "react";



import {

  BarChart3,

  CalendarDays,

  RefreshCw,

  TrendingUp,

} from "lucide-react";



import {

  useNavigate,

} from "react-router-dom";



import axios from "axios";



import api from "../services/api";



import "./RevenueTrendPage.css";





type TrendMode =

  | "7D"

  | "THIS_MONTH"

  | "LAST_MONTH";





type UnitMetric =

  | "FTD"

  | "MTD"

  | "LMTD"

  | "TGT"

  | "PROJ"

  | "GAP";





type RevenueItem = {

  valueLakhs: number;

  available: boolean;

};





type TargetItem = {

  valueLakhs: number;

  available: boolean;

};





type ProjectionItem = {

  valueLakhs: number;

};





type GapItem = {

  valueLakhs: number;

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



  grandTotal: {

    FTD: number;

    MTD: number;

    LMTD: number;

    TGT: number;

    PROJ: number;

    CURR_OCC: number;

    GAP: number;

  };



  units: DashboardUnit[];

};





type DashboardResponse = {

  success: boolean;

  selectedDate: string;

  data: DashboardData;

};





type RangeDay =

  DashboardData & {

    date: string;

  };





type DashboardRangeResponse = {

  success: boolean;



  data: {

    days: RangeDay[];

  };

};





type TrendPoint = {

  date: string;

  FTD: number;



  units: {

    unitCode: string;

    unitName: string;

    valueLakhs: number;

  }[];

};





const METRICS: {

  value: UnitMetric;

  label: string;

}[] = [

  {

    value: "FTD",

    label: "FTD",

  },

  {

    value: "MTD",

    label: "MTD",

  },

  {

    value: "LMTD",

    label: "LMTD",

  },

  {

    value: "TGT",

    label: "Target",

  },

  {

    value: "PROJ",

    label: "Projection",

  },

  {

    value: "GAP",

    label: "GAP",

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

  value: string

): string {



  const [

    year,

    month,

    day,

  ] =

    value.split(

      "-"

    );



  if (

    !year ||

    !month ||

    !day

  ) {

    return value;

  }



  return `${day}/${month}/${year}`;



}





function getRangeBounds(

  selectedDate: string,

  mode: TrendMode

): {

  fromDate: string;

  toDate: string;

} {



  const selected =

    new Date(

      `${selectedDate}T00:00:00Z`

    );





  if (

    mode ===

    "7D"

  ) {



    const start =

      new Date(

        selected

      );



    start.setUTCDate(

      start.getUTCDate() - 6

    );



    return {

      fromDate:

        start

          .toISOString()

          .slice(

            0,

            10

          ),



      toDate:

        selectedDate,

    };



  }





  if (

    mode ===

    "THIS_MONTH"

  ) {



    return {

      fromDate:

        `${selectedDate.slice(

          0,

          7

        )}-01`,



      toDate:

        selectedDate,

    };



  }





  const year =

    Number(

      selectedDate.slice(

        0,

        4

      )

    );





  const month =

    Number(

      selectedDate.slice(

        5,

        7

      )

    );





  const firstDay =

    new Date(

      Date.UTC(

        year,

        month - 2,

        1

      )

    );





  const lastDay =

    new Date(

      Date.UTC(

        year,

        month - 1,

        0

      )

    );





  return {

    fromDate:

      firstDay

        .toISOString()

        .slice(

          0,

          10

        ),



    toDate:

      lastDay

        .toISOString()

        .slice(

          0,

          10

        ),

  };



}





function getUnitMetricValue(

  unit: DashboardUnit,

  metric: UnitMetric

): number {



  switch (

    metric

  ) {



    case "FTD":

      return unit.FTD?.available

        ? unit.FTD.valueLakhs

        : 0;





    case "MTD":

      return unit.MTD?.available

        ? unit.MTD.valueLakhs

        : 0;





    case "LMTD":

      return unit.LMTD?.available

        ? unit.LMTD.valueLakhs

        : 0;





    case "TGT":

      return unit.TGT.available

        ? unit.TGT.valueLakhs

        : 0;





    case "PROJ":

      return unit.PROJ.valueLakhs;





    case "GAP":

      return unit.GAP.valueLakhs;





    default:

      return 0;



  }



}





function isUnitMetricAvailable(

  unit: DashboardUnit,

  metric: UnitMetric

): boolean {



  switch (

    metric

  ) {



    case "FTD":

      return Boolean(

        unit.FTD?.available

      );





    case "MTD":

      return Boolean(

        unit.MTD?.available

      );





    case "LMTD":

      return Boolean(

        unit.LMTD?.available

      );





    case "TGT":

      return unit.TGT.available;





    case "PROJ":

      return true;


    case "GAP":

      return true;





    default:

      return false;



  }



}





function RevenueTrendPage() {



  const navigate =

    useNavigate();





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

    trendMode,

    setTrendMode,

  ] =

    useState<TrendMode>(

      "7D"

    );





  const [

    selectedMetric,

    setSelectedMetric,

  ] =

    useState<UnitMetric>(

      "FTD"

    );





  const [

    trendData,

    setTrendData,

  ] =

    useState<TrendPoint[]>(

      []

    );





  const [

    selectedTrendPoint,

    setSelectedTrendPoint,

  ] =

    useState<TrendPoint | null>(

      null

    );





  const [

    dashboard,

    setDashboard,

  ] =

    useState<DashboardData | null>(

      null

    );





  const [

    loadingTrend,

    setLoadingTrend,

  ] =

    useState(

      true

    );





  const [

    loadingDashboard,

    setLoadingDashboard,

  ] =

    useState(

      true

    );





  const [

    trendError,

    setTrendError,

  ] =

    useState(

      ""

    );





  const [

    dashboardError,

    setDashboardError,

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





  // ======================================================

  // LOAD GROUP TREND

  // ======================================================



  useEffect(

    () => {



      let active =

        true;





      const controller =

        new AbortController();





      const loadTrend =

        async () => {



          try {



            setLoadingTrend(

              true

            );



            setTrendError(

              ""

            );





            const range =

              getRangeBounds(

                selectedDate,

                trendMode

              );





            const response =

              await api.get<DashboardRangeResponse>(

                "/revenue/dashboard-range",

                {

                  params: {

                    fromDate:

                      range.fromDate,



                    toDate:

                      range.toDate,

                  },



                  signal:

                    controller.signal,

                }

              );





            if (

              !active

            ) {

              return;

            }





            const points =

              (

                response.data.data.days ??

                []

              )

                .map(

                  (

                    day

                  ) => ({

                    date:

                      day.date,



                    FTD:

                      day.grandTotal.FTD,



                    units:

                      day.units.map(

                        (

                          unit

                        ) => ({

                          unitCode:

                            unit.unitCode,



                          unitName:

                            unit.unitName,



                          valueLakhs:

                            unit.FTD?.available

                              ? unit.FTD.valueLakhs

                              : 0,

                        })

                      ),

                  })

                )

                .sort(

                  (

                    a,

                    b

                  ) =>

                    a.date.localeCompare(

                      b.date

                    )

                );





            setTrendData(

              points

            );



          }

          catch (

            error: unknown

          ) {



            if (

              !active

            ) {

              return;

            }





            if (

              axios.isAxiosError(

                error

              ) &&

              error.code ===

                "ERR_CANCELED"

            ) {

              return;

            }





            if (

              axios.isAxiosError(

                error

              ) &&

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





            setTrendData(

              []

            );



            setTrendError(

              "Unable to load revenue trend."

            );



          }

          finally {



            if (

              active

            ) {



              setLoadingTrend(

                false

              );



            }



          }



        };





      loadTrend();





      return () => {



        active =

          false;



        controller.abort();



      };



    },

    [

      selectedDate,

      trendMode,

      refreshKey,

      navigate,

    ]

  );





  // ======================================================

  // LOAD SELECTED-DATE UNIT DATA

  // ======================================================



  useEffect(

    () => {



      let active =

        true;





      const controller =

        new AbortController();





      const loadDashboard =

        async () => {



          try {



            setLoadingDashboard(

              true

            );



            setDashboardError(

              ""

            );





            const response =

              await api.get<DashboardResponse>(

                "/revenue/dashboard",

                {

                  params: {

                    date:

                      comparisonDate,

                  },



                  signal:

                    controller.signal,

                }

              );





            if (

              !active

            ) {

              return;

            }





            setDashboard(

              response.data.data

            );



          }

          catch (

            error: unknown

          ) {



            if (

              !active

            ) {

              return;

            }





            if (

              axios.isAxiosError(

                error

              ) &&

              error.code ===

                "ERR_CANCELED"

            ) {

              return;

            }





            if (

              axios.isAxiosError(

                error

              ) &&

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





            setDashboard(

              null

            );



            setDashboardError(

              "Unable to load unit revenue data."

            );



          }

          finally {



            if (

              active

            ) {



              setLoadingDashboard(

                false

              );



            }



          }



        };





      loadDashboard();





      return () => {



        active =

          false;



        controller.abort();



      };



    },

    [

      comparisonDate,

      refreshKey,

      navigate,

    ]

  );





  // ======================================================

  // TREND CALCULATIONS

  // ======================================================



  const trendLatest =

    trendData.length > 0

      ? trendData[

          trendData.length - 1

        ].FTD

      : 0;





  const trendAverage =

    trendData.length > 0

      ? trendData.reduce(

          (

            total,

            point

          ) =>

            total +

            point.FTD,

          0

        ) /

        trendData.length

      : 0;





  const trendPeak =

    trendData.length > 0

      ? Math.max(

          ...trendData.map(

            (

              point

            ) =>

              point.FTD

          )

        )

      : 0;





  const trendMax =

    trendPeak > 0

      ? trendPeak *

        1.15

      : 1;





  const chartWidth =

    1280;





  const chartHeight =

    340;





  const chartLeft =

    76;





  const chartRight =

    34;





  const chartTop =

    34;





  const chartBottom =

    54;





  const plotWidth =

    chartWidth -

    chartLeft -

    chartRight;





  const plotHeight =

    chartHeight -

    chartTop -

    chartBottom;





  const plotPoints =

    trendData.map(

      (

        point,

        index

      ) => {



        const x =

          trendData.length === 1

            ? chartLeft +

              plotWidth /

              2

            : chartLeft +

              (

                index /

                (

                  trendData.length -

                  1

                )

              ) *

              plotWidth;





        const y =

          chartTop +

          plotHeight -

          (

            point.FTD /

            trendMax

          ) *

          plotHeight;





        return {

          ...point,

          x,

          y,

        };



      }

    );





  const linePoints =

    plotPoints

      .map(

        (

          point

        ) =>

          `${point.x},${point.y}`

      )

      .join(

        " "

      );





  const areaPoints =

    plotPoints.length > 0

      ? `${plotPoints[0].x},${

          chartTop +

          plotHeight

        } ${linePoints} ${

          plotPoints[

            plotPoints.length - 1

          ].x

        },${

          chartTop +

          plotHeight

        }`

      : "";





  const dateLabelStep =

    trendData.length <= 10

      ? 1

      : trendData.length <= 20

        ? 2

        : 5;





  const valueLabelStep =

    trendData.length <= 10

      ? 1

      : trendData.length <= 20

        ? 4

        : 7;





  // ======================================================

  // UNIT CHART CALCULATIONS

  // ======================================================



  const unitValues =

    dashboard?.units.map(

      (

        unit

      ) => ({

        unit,

        value:

          getUnitMetricValue(

            unit,

            selectedMetric

          ),

        available:

          isUnitMetricAvailable(

            unit,

            selectedMetric

          ),

      })

    ) ??

    [];





  const unitMaxValue =

    Math.max(

      ...unitValues

        .filter(

          (

            item

          ) =>

            item.available

        )

        .map(

          (

            item

          ) =>

            Math.abs(

              item.value

            )

        ),

      1

    );





  const availableUnitValues =

    unitValues.filter(

      (

        item

      ) =>

        item.available

    );





  const highestUnitValue =

    availableUnitValues.length > 0

      ? Math.max(

          ...availableUnitValues.map(

            (

              item

            ) =>

              item.value

          )

        )

      : 0;





  const lowestUnitValue =

    availableUnitValues.length > 0

      ? Math.min(

          ...availableUnitValues.map(

            (

              item

            ) =>

              item.value

          )

        )

      : 0;





  const hasUnitSpread =

    availableUnitValues.length > 1 &&

    highestUnitValue !==

      lowestUnitValue;





  const metricLabel =

    METRICS.find(

      (

        item

      ) =>

        item.value ===

        selectedMetric

    )?.label ??

    selectedMetric;





  const periodLabel =

    trendMode ===

      "7D"

      ? "Last 7 Days"

      : trendMode ===

          "THIS_MONTH"

        ? "This Month"

        : "Last Month";





  const handleRefresh =

    () => {



      setRefreshKey(

        (

          current

        ) =>

          current + 1

      );



    };





  return (



    <div className="rt-page">



      <section className="rt-header">



        <div>



          <p className="rt-eyebrow">

            AAYUSH GROUP OF HOSPITALS

          </p>



          <h1>

            Revenue Trend

          </h1>



          <p className="rt-subtitle">

            Group and unit-wise revenue trend analysis in Lakhs.

          </p>



        </div>





        <div className="rt-header-actions">



          <label className="rt-date-control">



            <span>

              Date

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



                    setComparisonDate(

                      value

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

            className="rt-refresh"

            onClick={

              handleRefresh

            }

          >



            <RefreshCw

              size={16}

              className={

                loadingTrend ||

                loadingDashboard

                  ? "spin"

                  : ""

              }

            />



            Refresh



          </button>



        </div>



      </section>





      <section className="rt-card">



        <div className="rt-card-header">



          <div>



            <h2>

              Group FTD Revenue Trend

            </h2>



            <p>

              Daily group revenue movement

            </p>



          </div>





          <div className="rt-period-switch">



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

                  setTrendMode(

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

                  setTrendMode(

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

                  setTrendMode(

                    "LAST_MONTH"

                  )

              }

            >

              Last Month

            </button>



          </div>



        </div>





        <div className="rt-summary">



          <div>



            <span>

              Period

            </span>



            <strong>

              {periodLabel}

            </strong>



          </div>





          <div>



            <span>

              Latest FTD

            </span>



            <strong>

              ₹ {formatValue(

                trendLatest

              )} L

            </strong>



          </div>





          <div>



            <span>

              Average FTD

            </span>



            <strong>

              ₹ {formatValue(

                trendAverage

              )} L

            </strong>



          </div>





          <div>



            <span>

              Peak FTD

            </span>



            <strong>

              ₹ {formatValue(

                trendPeak

              )} L

            </strong>



          </div>



        </div>





        {

          loadingTrend

            ? (



              <div className="rt-state">



                <RefreshCw

                  size={20}

                  className="spin"

                />



                Loading trend...



              </div>



            )

            : trendError

              ? (



                <div className="rt-state error">

                  {trendError}

                </div>



              )

              : trendData.length ===

                  0

                ? (



                  <div className="rt-state">

                    No trend data available.

                  </div>



                )

                : (



                  <div className="rt-line-chart-wrap">



                    <svg

                      className="rt-line-chart"

                      viewBox={

                        `0 0 ${chartWidth} ${chartHeight}`

                      }

                    >



                      {

                        [

                          1,

                          0.75,

                          0.5,

                          0.25,

                          0,

                        ].map(

                          (

                            ratio

                          ) => {



                            const y =

                              chartTop +

                              (

                                1 -

                                ratio

                              ) *

                              plotHeight;



                            return (



                              <g

                                key={

                                  ratio

                                }

                              >



                                <line

                                  x1={

                                    chartLeft

                                  }

                                  y1={

                                    y

                                  }

                                  x2={

                                    chartWidth -

                                    chartRight

                                  }

                                  y2={

                                    y

                                  }

                                  className="rt-grid-line"

                                />





                                <text

                                  x={

                                    chartLeft -

                                    10

                                  }

                                  y={

                                    y + 4

                                  }

                                  textAnchor="end"

                                  className="rt-axis-label"

                                >

                                  {

                                    formatValue(

                                      trendMax *

                                      ratio

                                    )

                                  }

                                </text>



                              </g>



                            );



                          }

                        )

                      }





                      <polygon

                        points={

                          areaPoints

                        }

                        className="rt-line-area"

                      />





                      <polyline

                        points={

                          linePoints

                        }

                        className="rt-line-path"

                      />





                      {

                        plotPoints.map(

                          (

                            point,

                            index

                          ) => {



                            const isSelected =

                              selectedTrendPoint?.date ===

                                point.date;





                            const showDateLabel =

                              index === 0 ||

                              index ===

                                plotPoints.length -

                                1 ||

                              index %

                                dateLabelStep ===

                                0;





                            const showValueLabel =

                              trendData.length <= 10

                                ? true

                                : index === 0 ||

                                  index ===

                                    plotPoints.length -

                                    1 ||

                                  point.FTD ===

                                    trendPeak ||

                                  index %

                                    valueLabelStep ===

                                    0;





                            const calloutX =

                              Math.min(

                                Math.max(

                                  point.x,

                                  chartLeft + 48

                                ),

                                chartWidth -

                                  chartRight -

                                  48

                              );





                            return (



                              <g

                                key={

                                  point.date

                                }

                              >



                                {

                                  isSelected && (

                                    <line

                                      x1={

                                        point.x

                                      }

                                      y1={

                                        chartTop

                                      }

                                      x2={

                                        point.x

                                      }

                                      y2={

                                        chartTop +

                                        plotHeight

                                      }

                                      className="rt-selected-guide"

                                    />

                                  )

                                }





                                <circle

                                  cx={

                                    point.x

                                  }

                                  cy={

                                    point.y

                                  }

                                  r="14"

                                  className="rt-line-hit"

                                  onClick={

                                    () => {

                                      setSelectedTrendPoint(

                                        point

                                      );



                                      setComparisonDate(

                                        point.date

                                      );

                                    }

                                  }

                                />





                                <circle

                                  cx={

                                    point.x

                                  }

                                  cy={

                                    point.y

                                  }

                                  r={

                                    isSelected

                                      ? 7

                                      : 6

                                  }

                                  className={

                                    isSelected

                                      ? "rt-line-point selected"

                                      : "rt-line-point"

                                  }

                                  onClick={

                                    () => {

                                      setSelectedTrendPoint(

                                        point

                                      );



                                      setComparisonDate(

                                        point.date

                                      );

                                    }

                                  }

                                >



                                  <title>

                                    {

                                      `${formatDisplayDate(

                                        point.date

                                      )} - ₹ ${formatValue(

                                        point.FTD

                                      )} L`

                                    }

                                  </title>



                                </circle>





                                {

                                  !isSelected &&

                                  showValueLabel && (

                                    <text

                                      x={

                                        point.x

                                      }

                                      y={

                                        point.y -

                                        14

                                      }

                                      textAnchor="middle"

                                      className="rt-point-value"

                                    >

                                      {

                                        formatValue(

                                          point.FTD

                                        )

                                      }

                                    </text>

                                  )

                                }





                                {

                                  isSelected && (

                                    <g className="rt-selected-callout">

                                      <rect

                                        x={

                                          calloutX -

                                          46

                                        }

                                        y={

                                          Math.max(

                                            point.y -

                                              38,

                                            4

                                          )

                                        }

                                        width="92"

                                        height="24"

                                        rx="7"

                                      />



                                      <text

                                        x={

                                          calloutX

                                        }

                                        y={

                                          Math.max(

                                            point.y -

                                              22,

                                            20

                                          )

                                        }

                                        textAnchor="middle"

                                      >

                                        ₹ {formatValue(

                                          point.FTD

                                        )} L

                                      </text>

                                    </g>

                                  )

                                }





                                {

                                  showDateLabel && (



                                    <text

                                      x={

                                        point.x

                                      }

                                      y={

                                        chartHeight -

                                        12

                                      }

                                      textAnchor="middle"

                                      className="rt-axis-label"

                                    >

                                      {

                                        `${point.date.slice(

                                          8,

                                          10

                                        )}/${point.date.slice(

                                          5,

                                          7

                                        )}`

                                      }

                                    </text>



                                  )

                                }



                              </g>



                            );



                          }

                        )

                      }



                    </svg>



                  </div>



                )

        }





        {

          selectedTrendPoint && (



            <div className="rt-point-detail">



              <div className="rt-point-detail-header">



                <div>



                  <span>

                    Selected Date

                  </span>



                  <strong>

                    {formatDisplayDate(

                      selectedTrendPoint.date

                    )}

                  </strong>



                </div>





                <div>



                  <span>

                    Group FTD

                  </span>



                  <strong>

                    ₹ {formatValue(

                      selectedTrendPoint.FTD

                    )} L

                  </strong>



                </div>





                <button

                  type="button"

                  onClick={

                    () =>

                      setSelectedTrendPoint(

                        null

                      )

                  }

                >

                  ×

                </button>



              </div>





              <div className="rt-point-unit-grid">



                {

                  selectedTrendPoint.units.map(

                    (

                      unit

                    ) => (



                      <div

                        key={

                          unit.unitCode

                        }

                      >



                        <span>

                          {unit.unitCode}

                        </span>



                        <strong>

                          ₹ {formatValue(

                            unit.valueLakhs

                          )} L

                        </strong>



                      </div>



                    )

                  )

                }



              </div>



            </div>



          )

        }



      </section>





      <section className="rt-card">



        <div className="rt-card-header">



          <div>



            <h2>

              Unit Wise Revenue Comparison

            </h2>



            <p>

              Exact values for {formatDisplayDate(

                comparisonDate

              )}

            </p>



          </div>





          <div className="rt-metric-switch">



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





        <div className="rt-unit-title">



          <span>



            <BarChart3

              size={17}

            />



            {metricLabel} Revenue by Unit



          </span>





          <strong>



            <TrendingUp

              size={15}

            />



            Values in Lakhs



          </strong>



        </div>





        {

          loadingDashboard

            ? (



              <div className="rt-state">



                <RefreshCw

                  size={20}

                  className="spin"

                />



                Loading unit revenue...



              </div>



            )

            : dashboardError

              ? (



                <div className="rt-state error">

                  {dashboardError}

                </div>



              )

              : unitValues.length ===

                  0

                ? (



                  <div className="rt-state">

                    No unit data available.

                  </div>



                )

                : (



                  <div className="rt-unit-chart">



                    {

                      unitValues.map(

                        (

                          item

                        ) => {



                          const percentage =

                            Math.abs(

                              item.value

                            ) /

                            unitMaxValue *

                            100;





                          const isNegative =

                            item.value <

                            0;





                          const isHighest =

                            hasUnitSpread &&

                            item.available &&

                            item.value ===

                              highestUnitValue;





                          const isLowest =

                            hasUnitSpread &&

                            item.available &&

                            item.value ===

                              lowestUnitValue;





                          const rowClassName =

                            !item.available

                              ? "rt-unit-row unavailable"

                              : isHighest

                                ? "rt-unit-row highest"

                                : isLowest

                                  ? "rt-unit-row lowest"

                                  : "rt-unit-row";





                          return (



                            <div

                              className={

                                rowClassName

                              }

                              key={

                                item.unit.unitId

                              }

                            >



                              <div className="rt-unit-name">



                                <span>

                                  {item.unit.unitCode}

                                </span>



                                <div className="rt-unit-meta">

                                  <small>

                                    {item.unit.unitName}

                                  </small>



                                  {

                                    isHighest && (

                                      <em className="rt-rank-badge highest">

                                        Highest

                                      </em>

                                    )

                                  }





                                  {

                                    isLowest && (

                                      <em className="rt-rank-badge lowest">

                                        Lowest

                                      </em>

                                    )

                                  }





                                  {

                                    !item.available && (

                                      <em className="rt-rank-badge unavailable">

                                        Not uploaded

                                      </em>

                                    )

                                  }



                                </div>



                              </div>





                              <div className="rt-bar-area">



                                <div className="rt-bar-track">



                                  <div

                                    className={

                                      isNegative

                                        ? "rt-bar negative"

                                        : selectedMetric ===
                                            "GAP"

                                          ? "rt-bar gap-positive"

                                          : "rt-bar positive"

                                    }

                                    style={{

                                      width:

                                        item.available

                                          ? `${Math.max(

                                              percentage,

                                              item.value ===

                                                0

                                                ? 0

                                                : 2

                                            )}%`

                                          : "0%",

                                    }}

                                  />



                                </div>



                              </div>





                              <div

                                className={

                                  isNegative

                                    ? "rt-unit-value negative"

                                    : "rt-unit-value"

                                }

                              >



                                {

                                  item.available

                                    ? `₹ ${formatValue(

                                        item.value

                                      )} L`

                                    : "-"

                                }



                              </div>



                            </div>



                          );



                        }

                      )

                    }



                  </div>



                )

        }








      </section>



    </div>



  );



}





export default RevenueTrendPage;


