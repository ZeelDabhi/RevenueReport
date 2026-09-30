import {
  useEffect,
  useState,
} from "react";

import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import api from "../services/api";

import "./OccupancyUploadPage.css";


type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


type UnitOption = {
  code: UnitCode;
  name: string;
};


type OccupancyUnitRecord = {
  id: number | null;
  unitId: number;
  unitCode: string;
  unitName: string;
  occupancyDate: string;
  occupancyCount: number;
  available: boolean;
  entryType?: string | null;
};


type OccupancyData = {
  occupancyDate: string;
  totalUnits: number;
  savedUnits: number;
  totalOccupancy: number;
  complete: boolean;
  units: OccupancyUnitRecord[];
};


type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};


const UNITS: UnitOption[] = [
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


function createEmptyOccupancy():
  Record<UnitCode, string> {

  return {
    MB: "",
    OS: "",
    SV: "",
    MS: "",
    BJ: "",
    JN: "",
    SM: "",
  };

}


// ======================================================
// INDIA TODAY
// ======================================================

function getIndiaTodayDate(): string {

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );


  const parts =
    formatter.formatToParts(
      new Date()
    );


  const year =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "year"
    )?.value ??
    "";


  const month =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "month"
    )?.value ??
    "";


  const day =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "day"
    )?.value ??
    "";


  return `${year}-${month}-${day}`;

}


function OccupancyUploadPage() {

  const navigate =
    useNavigate();


  const maxOccupancyDate =
    getIndiaTodayDate();


  const [
    occupancyDate,
    setOccupancyDate,
  ] =
    useState(
      getIndiaTodayDate
    );


  const [
    occupancies,
    setOccupancies,
  ] =
    useState<
      Record<UnitCode, string>
    >(
      createEmptyOccupancy
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  // ======================================================
  // GROUP BED OCCUPANCY
  // ======================================================

  const groupOccupancy =
    UNITS.reduce(
      (
        total,
        unit
      ) => {

        const value =
          Number(
            occupancies[
              unit.code
            ]
          );


        return (
          total +
          (
            Number.isFinite(
              value
            )
              ? value
              : 0
          )
        );

      },
      0
    );


  // ======================================================
  // LOAD SAVED OCCUPANCY
  // ======================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      api.get<
        ApiEnvelope<OccupancyData>
      >(
        "/revenue/occupancy",
        {
          params: {
            date:
              occupancyDate,
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


            const payload =
              response.data.data;


            const nextOccupancies =
              createEmptyOccupancy();


            for (
              const unit
              of payload?.units ??
              []
            ) {

              const code =
                unit.unitCode as
                  UnitCode;


              if (
                code in
                nextOccupancies
              ) {

                nextOccupancies[
                  code
                ] =
                  unit.available
                    ? String(
                        unit.occupancyCount
                      )
                    : "";

              }

            }


            setOccupancies(
              nextOccupancies
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


              const data =
                err.response?.data as
                  | {
                      message?: string;
                    }
                  | undefined;


              setError(
                data?.message ||
                "Unable to load Bed Occupancy."
              );


              return;

            }


            setError(
              "Unable to load Bed Occupancy."
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
      occupancyDate,
      refreshKey,
      navigate,
    ]
  );


  // ======================================================
  // CHANGE OCCUPANCY
  // ======================================================

  const handleOccupancyChange =
    (
      unitCode: UnitCode,
      value: string
    ) => {

      if (
        value !== "" &&
        !/^\d+$/.test(
          value
        )
      ) {

        return;

      }


      setOccupancies(
        (
          current
        ) => ({

          ...current,

          [unitCode]:
            value,

        })
      );


      setSuccessMessage(
        ""
      );


      setError(
        ""
      );

    };


  // ======================================================
  // DATE CHANGE
  //
  // Today allowed.
  // Future not allowed.
  // ======================================================

  const handleDateChange =
    (
      value: string
    ) => {

      if (
        !value
      ) {

        return;

      }


      if (
        value >
        maxOccupancyDate
      ) {

        setError(
          "Future Bed Occupancy date is not allowed."
        );

        return;

      }


      setLoading(
        true
      );


      setSuccessMessage(
        ""
      );


      setError(
        ""
      );


      setOccupancyDate(
        value
      );

    };


  // ======================================================
  // REFRESH
  // ======================================================

  const handleRefresh =
    () => {

      setLoading(
        true
      );


      setSuccessMessage(
        ""
      );


      setError(
        ""
      );


      setRefreshKey(
        (
          current
        ) =>
          current + 1
      );

    };


  // ======================================================
  // SAVE OCCUPANCY
  // ======================================================

  const handleSave =
    async () => {

      setError(
        ""
      );


      setSuccessMessage(
        ""
      );


      if (
        occupancyDate >
        maxOccupancyDate
      ) {

        setError(
          "Future Bed Occupancy date cannot be saved."
        );

        return;

      }


      const occupancyPayload =
        UNITS.map(
          (
            unit
          ) => {

            const rawValue =
              occupancies[
                unit.code
              ];


            return {

              unitCode:
                unit.code,

              rawValue,

              occupancyCount:
                Number(
                  rawValue
                ),

            };

          }
        );


      const missingOccupancy =
        occupancyPayload.find(
          (
            item
          ) =>
            item.rawValue ===
            ""
        );


      if (
        missingOccupancy
      ) {

        setError(
          `Bed Occupancy is required for ${missingOccupancy.unitCode}.`
        );

        return;

      }


      const invalidOccupancy =
        occupancyPayload.find(
          (
            item
          ) =>
            !Number.isInteger(
              item.occupancyCount
            ) ||
            item.occupancyCount <
              0
        );


      if (
        invalidOccupancy
      ) {

        setError(
          `Valid whole-number Bed Occupancy is required for ${invalidOccupancy.unitCode}.`
        );

        return;

      }


      try {

        setSaving(
          true
        );


        await api.post(
          "/revenue/occupancy/manual",
          {

            occupancyDate,

            occupancies:
              occupancyPayload.map(
                (
                  item
                ) => ({

                  unitCode:
                    item.unitCode,

                  occupancyCount:
                    item.occupancyCount,

                })
              ),

          }
        );


        setSuccessMessage(
          `Bed Occupancy saved successfully for ${occupancyDate}. Group Occupancy: ${groupOccupancy}`
        );


        setLoading(
          true
        );


        setRefreshKey(
          (
            current
          ) =>
            current + 1
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

          const data =
            err.response?.data as
              | {
                  message?: string;
                }
              | undefined;


          setError(
            data?.message ||
            "Unable to save Bed Occupancy."
          );

        }
        else {

          setError(
            "Unable to save Bed Occupancy."
          );

        }

      }
      finally {

        setSaving(
          false
        );

      }

    };


  return (

    <div className="occupancy-page">

      <div className="occupancy-page-header">

        <div>

          <p className="occupancy-page-eyebrow">
            Aayush Group of Hospitals
          </p>


          <h1>
            Bed Occupancy
          </h1>


          <p className="occupancy-page-subtitle">
            Enter current-date Bed Occupancy for each unit. Group Bed Occupancy is calculated automatically.
          </p>

        </div>


        <button
          type="button"
          className="occupancy-refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            loading ||
            saving
          }
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "occupancy-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>


      <div className="occupancy-filter-card">

        <div className="occupancy-filter-icon">

          <CalendarDays
            size={20}
          />

        </div>


        <div className="occupancy-filter-field">

          <label>
            Occupancy Date
          </label>


          <input
            type="date"
            value={
              occupancyDate
            }
            max={
              maxOccupancyDate
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


        <div className="occupancy-filter-summary">

          <span>
            Group Bed Occupancy
          </span>


          <strong>
            {groupOccupancy}
          </strong>

        </div>

      </div>


      {
        error && (

          <div className="occupancy-message error">

            {error}

          </div>

        )
      }


      {
        successMessage && (

          <div className="occupancy-message success">

            <CheckCircle2
              size={18}
            />

            {successMessage}

          </div>

        )
      }


      {
        loading
          ? (

            <div className="occupancy-loading">

              <RefreshCw
                size={24}
                className="occupancy-spin"
              />

              Loading Bed Occupancy...

            </div>

          )
          : (

            <div className="occupancy-content-grid">

              <div className="occupancy-unit-card">

                <div className="occupancy-card-heading">

                  <div className="occupancy-heading-icon">

                    <BedDouble
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Daily Bed Occupancy
                    </h2>

                    <p>
                      Enter current Bed Occupancy manually for all 7 units.
                    </p>

                  </div>

                </div>


                <div className="occupancy-unit-list">

                  {
                    UNITS.map(
                      (
                        unit
                      ) => (

                        <div
                          key={
                            unit.code
                          }
                          className="occupancy-unit-row"
                        >

                          <div className="occupancy-unit-name">

                            <span>
                              {unit.code}
                            </span>


                            <strong>
                              {unit.name}
                            </strong>

                          </div>


                          <div className="occupancy-input-wrap">

                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={
                                occupancies[
                                  unit.code
                                ]
                              }
                              disabled={
                                saving
                              }
                              onChange={
                                (
                                  event
                                ) =>
                                  handleOccupancyChange(
                                    unit.code,
                                    event.target.value
                                  )
                              }
                              placeholder="0"
                            />


                            <span>
                              Beds
                            </span>

                          </div>

                        </div>

                      )
                    )
                  }

                </div>


                <div className="occupancy-total-row">

                  <span>
                    Group Bed Occupancy
                  </span>


                  <strong>
                    {groupOccupancy}
                  </strong>

                </div>

              </div>


              <div className="occupancy-group-card">

                <div className="occupancy-card-heading">

                  <div className="occupancy-heading-icon group">

                    <BedDouble
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Group Bed Occupancy
                    </h2>

                    <p>
                      Automatically calculated from all 7 Unit Occupancy values.
                    </p>

                  </div>

                </div>


                <div className="occupancy-group-body">

                  <label>
                    Current Group Occupancy
                  </label>


                  <div className="occupancy-group-value">

                    <strong>
                      {groupOccupancy}
                    </strong>


                    <span>
                      Beds
                    </span>

                  </div>


                  <div className="occupancy-group-note">

                    Occupancy is saved against its actual date. The Revenue Dashboard will use the next day&apos;s occupancy for the previous business date.

                  </div>

                </div>


                <button
                  type="button"
                  className="occupancy-save-button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    loading
                  }
                >

                  {
                    saving
                      ? (

                        <>

                          <RefreshCw
                            size={17}
                            className="occupancy-spin"
                          />

                          Saving...

                        </>

                      )
                      : (

                        <>

                          <Save
                            size={17}
                          />

                          Save Occupancy

                        </>

                      )
                  }

                </button>

              </div>

            </div>

          )
      }

    </div>

  );

}


export default OccupancyUploadPage;