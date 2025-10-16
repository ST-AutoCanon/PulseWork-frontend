"use client";

import React, { useEffect, useState } from "react";
import FileInput from "../EmployeeDetails/FileInput.client";
import { MdOutlineCancel } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if your auth provider is located elsewhere

const READ_ONLY_FIELDS = [
  "domain",
  "employee_type",
  "joining_date",
  "role",
  "department_id",
  "department",
  "position",
  "supervisor_id",
  "supervisor_name",
  "salary",
];

export default function StepProfessionalEmployee({
  data,
  onChange,
  departments = [],
}) {
  // auth available for components that need current user (if required)
  const { user } = useAuth(); // currently not used directly but kept for future needs
  const [roleOptions, setRoleOptions] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [prevSupervisor, setPrevSupervisor] = useState(null);
  const [historyFetched, setHistoryFetched] = useState(false);

  // Use Next.js public env variables
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const isReadOnly = (name) => READ_ONLY_FIELDS.includes(name);

  useEffect(() => {
    if (!data.employee_id) {
      setPrevSupervisor(null);
      setHistoryFetched(false);
      return;
    }
    setHistoryFetched(false);

    fetch(`${BASE_URL}/supervisor/history/${data.employee_id}`, {
      headers: { "x-api-key": API_KEY ?? "" },
    })
      .then((res) => res.json())
      .then((json) => {
        const entries =
          json && json.data && Array.isArray(json.data.history)
            ? json.data.history
            : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
            ? json
            : [];

        if (!entries.length) {
          setPrevSupervisor(null);
          setHistoryFetched(true);
          return;
        }

        entries.sort((a, b) => {
          const da = a.start_date ? new Date(a.start_date) : new Date(0);
          const db = b.start_date ? new Date(b.start_date) : new Date(0);
          return da - db;
        });

        let currentIndex = entries.findIndex((e) => e.end_date === null);
        if (currentIndex === -1) currentIndex = entries.length - 1;

        const currentSupId = entries[currentIndex]?.supervisor_id;
        let prev = null;
        for (let i = currentIndex - 1; i >= 0; i--) {
          const e = entries[i];
          if (!e) continue;
          if (!currentSupId || e.supervisor_id !== currentSupId) {
            prev = e;
            break;
          }
        }

        if (prev) {
          prev = {
            ...prev,
            start_date: prev.start_date ? prev.start_date.split("T")[0] : "",
            end_date: prev.end_date ? prev.end_date.split("T")[0] : null,
          };
        }
        setPrevSupervisor(prev);
        setHistoryFetched(true);
      })
      .catch((err) => {
        console.error("Failed to fetch supervisor history:", err);
        setPrevSupervisor(null);
        setHistoryFetched(true);
      });
  }, [data.employee_id, API_KEY, BASE_URL]);

  useEffect(() => {
    fetch(`${BASE_URL}/user_roles`, { headers: { "x-api-key": API_KEY ?? "" } })
      .then((r) => r.json())
      .then((json) => setRoleOptions(json.data || []))
      .catch((err) => {
        console.error("Failed to load role options:", err);
        setRoleOptions([]);
      });
  }, [API_KEY, BASE_URL]);

  useEffect(() => {
    if (!data.role) {
      setPositionsList([]);
      return;
    }
    const deptParam = data.department_id || "";
    const url = `${BASE_URL}/positions?role=${encodeURIComponent(
      data.role
    )}&department_id=${encodeURIComponent(deptParam)}`;
    fetch(url, { headers: { "x-api-key": API_KEY ?? "" } })
      .then((res) => res.json())
      .then((json) => setPositionsList(json.data || []))
      .catch((err) => {
        console.error("Failed to load positions list:", err);
        setPositionsList([]);
      });
  }, [data.role, data.department_id, API_KEY, BASE_URL]);

  useEffect(() => {
    if (!data.position) {
      setSupervisorsList([]);
      return;
    }
    const deptParam = data.department_id || "";
    const url = `${BASE_URL}/positions/supervisors?position=${encodeURIComponent(
      data.position
    )}&department_id=${encodeURIComponent(deptParam)}`;
    fetch(url, { headers: { "x-api-key": API_KEY ?? "" } })
      .then((res) => res.json())
      .then((json) => setSupervisorsList(json.data || []))
      .catch((err) => {
        console.error("Failed to load supervisors list:", err);
        setSupervisorsList([]);
      });
  }, [data.position, data.department_id, API_KEY, BASE_URL]);

  const expList = Array.isArray(data.experience) ? data.experience : [];

  const updateExperience = (idx, field, value) => {
    const newList = [...expList];
    newList[idx] = { ...newList[idx], [field]: value };
    onChange("experience", newList);
  };

  const addExperience = () => {
    onChange("experience", [
      ...expList,
      { company: "", role: "", start_date: "", end_date: "", doc: null },
    ]);
  };

  const removeExperience = (idx) => {
    const newList = expList.filter((_, i) => i !== idx);
    onChange("experience", newList);
  };

  const totalMonths = expList.reduce((sum, exp) => {
    if (exp.start_date && exp.end_date) {
      const start = new Date(exp.start_date);
      const end = new Date(exp.end_date);
      if (end > start) {
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        return sum + months;
      }
    }
    return sum;
  }, 0);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return (
    <div className="step-professional">
      <div className="step-personal">
        <label>
          Employee Type<span className="required">*</span>
          <select
            name="employee_type"
            value={data.employee_type || ""}
            onChange={(e) =>
              !isReadOnly("employee_type") &&
              onChange("employee_type", e.target.value)
            }
            required
            disabled={isReadOnly("employee_type")}
          >
            <option value="">Select</option>
            <option value="Permanent">Permanent</option>
            <option value="Consultant">Consultant</option>
          </select>
        </label>

        <label>
          Joining Date<span className="required">*</span>
          <input
            type="date"
            value={data.joining_date || ""}
            onChange={(e) =>
              !isReadOnly("joining_date") &&
              onChange("joining_date", e.target.value)
            }
            disabled={isReadOnly("joining_date")}
          />
        </label>

        <label>
          Role<span className="required">*</span>
          <select
            name="role"
            value={data.role || ""}
            onChange={(e) =>
              !isReadOnly("role") && onChange("role", e.target.value)
            }
            required
            disabled={isReadOnly("role")}
          >
            <option value="">Select</option>
            {roleOptions.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Department<span className="required">*</span>
          <select
            name="department_id"
            value={data.department_id || ""}
            onChange={(e) =>
              !isReadOnly("department_id") &&
              onChange("department_id", e.target.value)
            }
            required
            disabled={isReadOnly("department_id")}
          >
            <option value="">Select</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Position<span className="required">*</span>
          <select
            name="position"
            value={data.position || ""}
            onChange={(e) =>
              !isReadOnly("position") && onChange("position", e.target.value)
            }
            required
            disabled={isReadOnly("position")}
          >
            <option value="">Select</option>
            {positionsList.map((p, idx) => (
              <option key={idx} value={typeof p === "string" ? p : p.name || p}>
                {typeof p === "string" ? p : p.name || p}
              </option>
            ))}
          </select>
        </label>

        {historyFetched ? (
          prevSupervisor ? (
            <div className="previous-supervisor">
              <label>
                Previous Supervisor :
                <br />
                &nbsp;
                <strong>{prevSupervisor.supervisor_name}</strong>
                <br />
                &nbsp;({prevSupervisor.start_date} ↔{" "}
                {prevSupervisor.end_date || "Present"})
              </label>
            </div>
          ) : (
            <div className="previous-supervisor">
              <small>No previous supervisor on record.</small>
            </div>
          )
        ) : (
          <div className="previous-supervisor">
            <small>Loading previous supervisor…</small>
          </div>
        )}

        <label>
          Supervisor<span className="required">*</span>
          <select
            name="supervisor_id"
            value={data.supervisor_id || ""}
            onChange={(e) =>
              !isReadOnly("supervisor_id") &&
              onChange("supervisor_id", e.target.value)
            }
            required
            disabled={isReadOnly("supervisor_id")}
          >
            <option value="">Select</option>
            {supervisorsList.map((s) => (
              <option key={s.employee_id} value={s.employee_id}>
                {s.name}-{s.position}({s.department})
              </option>
            ))}
          </select>
        </label>

        <label>
          Salary (CTC)<span className="required">*</span>
          <input
            type="number"
            name="salary"
            value={data.salary || ""}
            onChange={(e) =>
              !isReadOnly("salary") && onChange("salary", e.target.value)
            }
            required
            disabled={isReadOnly("salary")}
          />
        </label>
      </div>

      <div className="edu-add-row">
        <button type="button" className="pj-next-btn" onClick={addExperience}>
          + Add Experience
        </button>
        <div className="total-experience" style={{ marginLeft: 12 }}>
          <strong>
            {years > 0 && `${years} yr${years > 1 ? "s" : ""} `}
            {months > 0 && `${months} mo${months > 1 ? "s" : ""}`}
            {years === 0 && months === 0 && "0"}
          </strong>
        </div>
      </div>

      <div className="exp-box">
        {expList.map((exp, idx) => (
          <div className="st-pro" key={idx}>
            <label>
              Company Name
              <input
                type="text"
                value={exp.company}
                onChange={(e) =>
                  updateExperience(idx, "company", e.target.value)
                }
              />
            </label>

            <label>
              Role / Designation
              <input
                type="text"
                value={exp.role}
                onChange={(e) => updateExperience(idx, "role", e.target.value)}
              />
            </label>

            <label>
              Start Date
              <input
                type="date"
                value={exp.start_date || ""}
                onChange={(e) =>
                  updateExperience(idx, "start_date", e.target.value)
                }
              />
            </label>

            <label>
              End Date
              <input
                type="date"
                value={exp.end_date || ""}
                onChange={(e) =>
                  updateExperience(idx, "end_date", e.target.value)
                }
              />
            </label>

            <FileInput
              name={`experience[${idx}][doc]`}
              label="Experience Letter"
              accept=".pdf,image/*"
              multiple
              existingUrl={exp.doc_url}
              onChange={(name, file) => updateExperience(idx, "doc", file)}
            />

            <MdOutlineCancel
              className="remove-qual-btn"
              onClick={() => removeExperience(idx)}
            />
          </div>
        ))}
      </div>

      <div className="st-pro">
        <FileInput
          name="resume"
          label="Resume Upload"
          accept=".pdf"
          existingUrl={data.resume_url}
          onChange={onChange}
          required
        />

        <FileInput
          name="other_docs"
          label="Other Documents"
          accept=".pdf,image/*"
          multiple
          existingUrl={data.other_docs}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
