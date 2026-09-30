import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CircleX,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import api from "../services/api";

import "./UploadStatusPage.css";


type ItemStatus = {
  uploaded: number;
  pending: number;
  complete: boolean;
};


type UploadStatusUnit = {
  unitId: number;
  unitCode: string;
  unitName: string;

  FTD: boolean;
  MTD: boolean;
  LMTD: boolean;
  CURR_OCC: boolean;

  complete: boolean;

  missing: string[];
};


type UploadStatusResponse = {
  success: boolean;

  data: {
    date: string;

    summary: {
      totalUnits: number;
      completeUnits: number;
      pendingUnits: number;

      totalRequiredItems: number;
      totalUploadedItems: number;
      totalPendingItems: number;

      completionPercentage: number;

      FTD: ItemStatus;
      MTD: ItemStatus;
      LMTD: ItemStatus;
      CURR_OCC: ItemStatus;

      allComplete: boolean;
    };

    units: UploadStatusUnit[];
  };
};


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


function UploadStatusPage() {

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
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);


  const [
    statusData,
    setStatusData,
  ] =
    useState<UploadStatusResponse["data"] | null>(
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


  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      api.get<UploadStatusResponse>(
        "/revenue/upload-status",
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


            setStatusData(
              response.data.data
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
                "Unable to load upload status."
              );

              return;

            }


            setError(
              "Unable to load upload status."
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


      setSelectedDate(
        value
      );

    };


  const handleRefresh =
    () => {

      setLoading(
        true
      );


      setRefreshKey(
        (
          current
        ) =>
          current + 1
      );

    };


  const summary =
    statusData?.summary;


  return (

    <div className="upload-status-page">

      <div className="upload-status-header">

        <div>

          <p className="upload-status-eyebrow">
            Aayush Group of Hospitals
          </p>

          <h1>
            Upload Status
          </h1>

          <p className="upload-status-subtitle">
            Track daily Revenue and Occupancy uploads for all 7 units.
          </p>

        </div>


        <div className="upload-status-actions">

          <div className="upload-status-date">

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


          <button
            type="button"
            className="upload-status-refresh"
            onClick={
              handleRefresh
            }
            disabled={
              loading
            }
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "upload-status-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </div>


      {
        error && (

          <div className="upload-status-error">

            {error}

          </div>

        )
      }


      {
        loading &&
        !statusData
          ? (

            <div className="upload-status-loading">

              <RefreshCw
                size={24}
                className="upload-status-spin"
              />

              Loading upload status...

            </div>

          )
          : statusData &&
            summary && (

              <>

                <div className="upload-status-summary">

                  <SummaryCard
                    label="Complete Units"
                    value={`${summary.completeUnits}/${summary.totalUnits}`}
                    complete={
                      summary.completeUnits ===
                      summary.totalUnits
                    }
                  />


                  <SummaryCard
                    label="Uploaded Items"
                    value={`${summary.totalUploadedItems}/${summary.totalRequiredItems}`}
                    complete={
                      summary.totalUploadedItems ===
                      summary.totalRequiredItems
                    }
                  />


                  <SummaryCard
                    label="Pending Items"
                    value={
                      String(
                        summary.totalPendingItems
                      )
                    }
                    complete={
                      summary.totalPendingItems ===
                      0
                    }
                  />


                  <SummaryCard
                    label="Completion"
                    value={`${summary.completionPercentage}%`}
                    complete={
                      summary.allComplete
                    }
                  />

                </div>


                <div className="upload-status-type-grid">

                  <TypeStatusCard
                    label="FTD"
                    status={
                      summary.FTD
                    }
                  />


                  <TypeStatusCard
                    label="MTD"
                    status={
                      summary.MTD
                    }
                  />


                  <TypeStatusCard
                    label="LMTD"
                    status={
                      summary.LMTD
                    }
                  />


                  <TypeStatusCard
                    label="Occupancy"
                    status={
                      summary.CURR_OCC
                    }
                  />

                </div>


                <div className="upload-status-table-card">

                  <div className="upload-status-table-heading">

                    <div>

                      <h2>
                        Unit Wise Upload Status
                      </h2>

                      <p>
                        {
                          statusData.date
                        }
                      </p>

                    </div>

                  </div>


                  <div className="upload-status-table-wrap">

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
                            OCCUPANCY
                          </th>

                          <th>
                            STATUS
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          statusData.units.map(
                            (
                              unit
                            ) => (

                              <tr
                                key={
                                  unit.unitId
                                }
                              >

                                <td>

                                  <div className="upload-status-unit">

                                    <span>
                                      {
                                        unit.unitCode
                                      }
                                    </span>

                                    <strong>
                                      {
                                        unit.unitName
                                      }
                                    </strong>

                                  </div>

                                </td>


                                <StatusCell
                                  value={
                                    unit.FTD
                                  }
                                />


                                <StatusCell
                                  value={
                                    unit.MTD
                                  }
                                />


                                <StatusCell
                                  value={
                                    unit.LMTD
                                  }
                                />


                                <StatusCell
                                  value={
                                    unit.CURR_OCC
                                  }
                                />


                                <td>

                                  {
                                    unit.complete
                                      ? (

                                        <span className="upload-status-badge complete">

                                          <CheckCircle2
                                            size={14}
                                          />

                                          Complete

                                        </span>

                                      )
                                      : (

                                        <span className="upload-status-badge pending">

                                          <CircleX
                                            size={14}
                                          />

                                          Pending

                                        </span>

                                      )
                                  }

                                </td>

                              </tr>

                            )
                          )
                        }

                      </tbody>

                    </table>

                  </div>

                </div>

              </>

            )
      }

    </div>

  );

}


type SummaryCardProps = {
  label: string;
  value: string;
  complete: boolean;
};


function SummaryCard(
  {
    label,
    value,
    complete,
  }: SummaryCardProps
) {

  return (

    <div className="upload-status-summary-card">

      <p>
        {label}
      </p>

      <strong>
        {value}
      </strong>

      <span
        className={
          complete
            ? "complete"
            : "pending"
        }
      >
        {
          complete
            ? "Complete"
            : "In Progress"
        }
      </span>

    </div>

  );

}


type TypeStatusCardProps = {
  label: string;
  status: ItemStatus;
};


function TypeStatusCard(
  {
    label,
    status,
  }: TypeStatusCardProps
) {

  return (

    <div className="upload-status-type-card">

      <div>

        <p>
          {label}
        </p>

        <strong>
          {status.uploaded}/7
        </strong>

      </div>


      {
        status.complete
          ? (

            <CheckCircle2
              size={21}
              className="upload-status-ok"
            />

          )
          : (

            <CircleX
              size={21}
              className="upload-status-not-ok"
            />

          )
      }

    </div>

  );

}


type StatusCellProps = {
  value: boolean;
};


function StatusCell(
  {
    value,
  }: StatusCellProps
) {

  return (

    <td>

      {
        value
          ? (

            <span className="upload-status-file uploaded">

              <CheckCircle2
                size={15}
              />

              Uploaded

            </span>

          )
          : (

            <span className="upload-status-file missing">

              <CircleX
                size={15}
              />

              Pending

            </span>

          )
      }

    </td>

  );

}


export default UploadStatusPage;