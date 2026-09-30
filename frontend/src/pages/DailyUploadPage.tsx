import {
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  FileText,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

import axios from "axios";

import api from "../services/api";

import "./DailyUploadPage.css";


type UnitOption = {
  code: string;
  name: string;
};


type UploadResponse = {
  success?: boolean;
  message?: string;
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


function DailyUploadPage() {

  const [
    unitCode,
    setUnitCode,
  ] =
    useState("");


  const [
    businessDate,
    setBusinessDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    ftdFile,
    setFtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    mtdFile,
    setMtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    lmtdFile,
    setLmtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const resetFiles =
    () => {

      setFtdFile(
        null
      );

      setMtdFile(
        null
      );

      setLmtdFile(
        null
      );

    };


  const handleUpload =
    async () => {

      setSuccessMessage(
        ""
      );

      setErrorMessage(
        ""
      );


      if (
        !unitCode
      ) {

        setErrorMessage(
          "Please select a unit."
        );

        return;

      }


      if (
        !businessDate
      ) {

        setErrorMessage(
          "Please select business date."
        );

        return;

      }


      if (
        !ftdFile ||
        !mtdFile ||
        !lmtdFile
      ) {

        setErrorMessage(
          "FTD, MTD and LMTD all three CSV files are required."
        );

        return;

      }


      const formData =
        new FormData();


      formData.append(
        "unitCode",
        unitCode
      );


      formData.append(
        "businessDate",
        businessDate
      );


      formData.append(
        "ftdFile",
        ftdFile
      );


      formData.append(
        "mtdFile",
        mtdFile
      );


      formData.append(
        "lmtdFile",
        lmtdFile
      );


      try {

        setLoading(
          true
        );


        const response =
          await api.post<UploadResponse>(
            "/revenue/upload-all",
            formData
          );


        setSuccessMessage(
          response.data.message ||
          "FTD, MTD and LMTD revenue files uploaded successfully."
        );


        resetFiles();

      }
      catch (
        error
      ) {

        if (
          axios.isAxiosError(
            error
          )
        ) {

          const data =
            error.response?.data as
              | UploadResponse
              | undefined;


          setErrorMessage(
            data?.message ||
            "Revenue upload failed."
          );

        }
        else {

          setErrorMessage(
            "Revenue upload failed."
          );

        }

      }
      finally {

        setLoading(
          false
        );

      }

    };


  return (

    <div className="daily-upload-page">

      <div className="daily-upload-heading">

        <div>

          <p className="daily-upload-eyebrow">
            Aayush Group of Hospitals
          </p>

          <h1>
            Daily Revenue Upload
          </h1>

          <p className="daily-upload-subtitle">
            Upload FTD, MTD and LMTD revenue CSV files unit-wise.
          </p>

        </div>

      </div>


      <div className="daily-upload-card">

        <div className="daily-upload-section-heading">

          <div className="daily-upload-section-icon">

            <UploadCloud
              size={20}
            />

          </div>

          <div>

            <h2>
              Revenue Files
            </h2>

            <p>
              Select unit and business date, then upload all three files.
            </p>

          </div>

        </div>


        <div className="daily-upload-form-grid">

          <div className="daily-upload-field">

            <label>
              Unit
            </label>

            <select
              value={unitCode}
              onChange={
                (
                  event
                ) =>
                  setUnitCode(
                    event.target.value
                  )
              }
            >

              <option value="">
                Select Unit
              </option>

              {
                UNITS.map(
                  (
                    unit
                  ) => (

                    <option
                      key={unit.code}
                      value={unit.code}
                    >
                      {unit.code} - {unit.name}
                    </option>

                  )
                )
              }

            </select>

          </div>


          <div className="daily-upload-field">

            <label>
              Business Date
            </label>

            <div className="daily-upload-date">

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={businessDate}
                onChange={
                  (
                    event
                  ) =>
                    setBusinessDate(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

        </div>


        <div className="daily-upload-files">

          <UploadFileBox
            title="FTD"
            description="Full Day Revenue"
            file={ftdFile}
            onChange={
              setFtdFile
            }
          />


          <UploadFileBox
            title="MTD"
            description="Month To Date Revenue"
            file={mtdFile}
            onChange={
              setMtdFile
            }
          />


          <UploadFileBox
            title="LMTD"
            description="Last Month To Date"
            file={lmtdFile}
            onChange={
              setLmtdFile
            }
          />

        </div>


        {
          errorMessage && (

            <div className="daily-upload-message error">

              {errorMessage}

            </div>

          )
        }


        {
          successMessage && (

            <div className="daily-upload-message success">

              <CheckCircle2
                size={18}
              />

              {successMessage}

            </div>

          )
        }


        <div className="daily-upload-actions">

          <button
            type="button"
            className="daily-upload-clear"
            onClick={
              resetFiles
            }
            disabled={
              loading
            }
          >

            Clear Files

          </button>


          <button
            type="button"
            className="daily-upload-submit"
            onClick={
              handleUpload
            }
            disabled={
              loading
            }
          >

            {
              loading
                ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="daily-upload-spin"
                    />

                    Uploading...
                  </>
                )
                : (
                  <>
                    <UploadCloud
                      size={17}
                    />

                    Upload Revenue
                  </>
                )
            }

          </button>

        </div>

      </div>

    </div>

  );

}


type UploadFileBoxProps = {

  title:
    string;

  description:
    string;

  file:
    File | null;

  onChange:
    (
      file: File | null
    ) => void;

};


function UploadFileBox(
  {
    title,
    description,
    file,
    onChange,
  }: UploadFileBoxProps
) {

  const inputId =
    `file-${title.toLowerCase()}`;


  return (

    <div className="daily-upload-file-box">

      <div className="daily-upload-file-header">

        <div>

          <strong>
            {title}
          </strong>

          <span>
            {description}
          </span>

        </div>

      </div>


      <label
        htmlFor={inputId}
        className={
          file
            ? "daily-upload-drop-zone selected"
            : "daily-upload-drop-zone"
        }
      >

        {
          file
            ? (

              <>

                <CheckCircle2
                  size={24}
                />

                <strong>
                  File Selected
                </strong>

                <span>
                  {file.name}
                </span>

              </>

            )
            : (

              <>

                <FileText
                  size={24}
                />

                <strong>
                  Select CSV File
                </strong>

                <span>
                  Click to browse
                </span>

              </>

            )
        }


        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          onChange={
            (
              event
            ) => {

              const selectedFile =
                event.target.files
                  ?.[0] ??
                null;


              onChange(
                selectedFile
              );

            }
          }
        />

      </label>

    </div>

  );

}


export default DailyUploadPage;
