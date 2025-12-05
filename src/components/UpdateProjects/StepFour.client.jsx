"use client";

import React from "react";
import { FiDownload } from "react-icons/fi";
import MonthlyScheduleTable from "./MonthlyScheduleTable.client";
import { useAuth } from "../../context/AuthProvider.client";
import { getStatusBgColor } from "./utils.client";

const StepFour = ({
  formData,
  getStatusBgColor: _getStatusBgColor,
  getFinanceStatusColor,
  handleFinanceChange,
  handleTopLevelFinanceChange,
  handleStatusChange,
  formatDate,
  downloadAllAttachments,
  projectData,
  editable,
  onMonthlyFixedAmountChange,
  onFinancialDetailsChange,
}) => {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? user?.id ?? null;

  const statusBg = _getStatusBgColor || getStatusBgColor;

  return (
    <div className="pj-step-four">
      {formData.payment_type === "Monthly Scheduled" ? (
        <MonthlyScheduleTable
          initialFinancialDetails={formData.financialDetails}
          monthlyFixedAmount={formData.monthly_fixed_amount}
          service_description={formData.service_description}
          onFinancialDetailsChange={onFinancialDetailsChange}
          onMonthlyFixedAmountChange={onMonthlyFixedAmountChange}
          downloadAllAttachments={downloadAllAttachments}
          projectData={projectData}
          editable={editable}
        />
      ) : (
        <>
          <div className="project-finance-main">
            <div className="project-finance">
              <div className="project-finance-group">
                <label>Project Amount</label>
                <input
                  type="number"
                  name="project_amount"
                  value={formData?.project_amount || ""}
                  onChange={(e) =>
                    handleTopLevelFinanceChange(
                      "project_amount",
                      e.target.value
                    )
                  }
                  readOnly={!editable}
                />
              </div>
              <div className="project-finance-group">
                <label>TDS</label>
                <div className="step-four-group">
                  <div className="small-input">
                    <input
                      type="number"
                      name="tds_percentage"
                      value={formData?.tds_percentage || ""}
                      onChange={(e) =>
                        handleTopLevelFinanceChange(
                          "tds_percentage",
                          e.target.value
                        )
                      }
                      readOnly={!editable}
                    />
                  </div>
                  <span>%</span>
                  <input
                    type="number"
                    name="tds_amount"
                    value={formData?.tds_amount || ""}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
              <div className="project-finance-group">
                <label>GST</label>
                <div className="step-four-group">
                  <div className="small-input">
                    <input
                      type="number"
                      name="gst_percentage"
                      value={formData?.gst_percentage || ""}
                      onChange={(e) =>
                        handleTopLevelFinanceChange(
                          "gst_percentage",
                          e.target.value
                        )
                      }
                      readOnly={!editable}
                    />
                  </div>
                  <span>%</span>
                  <input
                    type="number"
                    name="gst_amount"
                    value={formData?.gst_amount || ""}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
              <div className="project-finance-group">
                <label>Total Amount</label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData?.total_amount || ""}
                  onChange={() => {}}
                  readOnly
                />
              </div>
              {projectData && projectData.id && (
                <div className="project-finance-group">
                  <label>Project Docs</label>
                  <FiDownload
                    className="pj-download"
                    onClick={() =>
                      downloadAllAttachments(projectData.id, employeeId)
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="main-finance">
            <h5 className="payout-details">Payout Details</h5>
            <div className="finance-table-container">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th>Sl no</th>
                    <th>Milestone Details</th>
                    <th>Amount (Excl tax)</th>
                    <th>TDS</th>
                    <th>GST</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Received Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(formData.financialDetails) &&
                    formData.financialDetails.map((finance, index) => {
                      const mActualAmountNum =
                        Number(finance.m_actual_amount) || 0;
                      const mTdsAmountRaw = finance.m_tds_amount;
                      const mTdsAmountNum =
                        mTdsAmountRaw === "" ||
                        mTdsAmountRaw === null ||
                        typeof mTdsAmountRaw === "undefined"
                          ? NaN
                          : Number(mTdsAmountRaw);

                      const hasTdsAmount = !Number.isNaN(mTdsAmountNum);

                      const derivedTdsPercentage =
                        hasTdsAmount && mActualAmountNum > 0
                          ? (mTdsAmountNum / mActualAmountNum) * 100
                          : null;

                      const displayTdsPercentage =
                        derivedTdsPercentage !== null
                          ? Number(derivedTdsPercentage.toFixed(2))
                          : finance.m_tds_percentage ?? "";

                      return (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: statusBg(
                              formData.milestones?.[index]?.status
                            ),
                          }}
                        >
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={finance.milestone_details || ""}
                              onChange={(e) => handleFinanceChange(index, e)}
                              readOnly={!editable}
                            />
                          </td>
                          <td>
                            <div className="step-four-group2">
                              <div className="small-input2">
                                <input
                                  type="number"
                                  name="m_actual_percentage"
                                  value={finance.m_actual_percentage ?? ""}
                                  onChange={(e) =>
                                    handleFinanceChange(index, e)
                                  }
                                  readOnly={!editable}
                                />
                              </div>
                              <span>%</span>
                              <input
                                type="number"
                                name="m_actual_amount"
                                value={finance.m_actual_amount ?? ""}
                                onChange={(e) => handleFinanceChange(index, e)}
                                readOnly
                              />
                            </div>
                          </td>
                          <td>
                            <div className="step-four-group2">
                              <div className="small-input2">
                                <input
                                  type="number"
                                  name="m_tds_percentage"
                                  value={displayTdsPercentage}
                                  onChange={(e) =>
                                    handleFinanceChange(index, e)
                                  }
                                  readOnly={!editable}
                                />
                              </div>
                              <span>%</span>
                              <input
                                type="number"
                                name="m_tds_amount"
                                value={
                                  finance.m_tds_amount === null ||
                                  typeof finance.m_tds_amount === "undefined"
                                    ? ""
                                    : finance.m_tds_amount
                                }
                                onChange={(e) => handleFinanceChange(index, e)}
                                readOnly={!editable}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="step-four-group2">
                              <div className="small-input2">
                                <input
                                  type="number"
                                  name="m_gst_percentage"
                                  value={finance.m_gst_percentage ?? ""}
                                  onChange={(e) =>
                                    handleFinanceChange(index, e)
                                  }
                                  readOnly={!editable}
                                />
                              </div>
                              <span>%</span>
                              <input
                                type="number"
                                name="m_gst_amount"
                                value={finance.m_gst_amount ?? ""}
                                onChange={(e) => handleFinanceChange(index, e)}
                                readOnly
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              name="m_total_amount"
                              value={finance.m_total_amount ?? ""}
                              onChange={(e) => handleFinanceChange(index, e)}
                              readOnly={!editable}
                            />
                          </td>
                          <td>
                            <select
                              value={finance.status || "not Initiated"}
                              onChange={(e) =>
                                handleStatusChange(index, e.target.value)
                              }
                              disabled={!editable}
                            >
                              <option value="not Initiated">
                                not Initiated
                              </option>
                              <option value="Pending">Pending</option>
                              <option value="Received">Received</option>
                            </select>
                          </td>
                          <td>
                            {finance.status === "Received" &&
                            finance.completed_date ? (
                              <span className="completed-date">
                                📅 {finance.completed_date}
                              </span>
                            ) : (
                              ""
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8" className="summary-row">
                      <span>
                        Total Amount Claiming:{" "}
                        <strong>₹{formData.total_amount || 0}</strong>
                      </span>{" "}
                      |
                      <span>
                        Amount Received:{" "}
                        <strong>
                          ₹
                          {(formData.financialDetails || []).reduce(
                            (acc, finance) =>
                              finance.status === "Received"
                                ? acc + parseFloat(finance.m_total_amount || 0)
                                : acc,
                            0
                          )}
                        </strong>
                      </span>{" "}
                      |
                      <span>
                        Amount Pending:{" "}
                        <strong>
                          ₹
                          {(
                            parseFloat(formData.total_amount || 0) -
                            (formData.financialDetails || []).reduce(
                              (acc, finance) =>
                                finance.status === "Received"
                                  ? acc +
                                    parseFloat(finance.m_total_amount || 0)
                                  : acc,
                              0
                            )
                          ).toFixed(2)}
                        </strong>
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StepFour;
