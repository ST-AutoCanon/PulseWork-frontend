import axios from "axios";

export const calculateCurrentMonthIncentives = async (employees, meId) => {
  if (!Array.isArray(employees) || employees.length === 0) {
    console.error(
      "Invalid or empty employees array in calculateCurrentMonthIncentives"
    );
    return {
      totalIncentives: 0,
      employeesWithIncentives: [],
      perEmployeeIncentives: {},
      rawIncentiveRecords: [],
    };
  }
  if (!meId) {
    console.error("Invalid meId provided:", meId);
    return {
      totalIncentives: 0,
      employeesWithIncentives: [],
      perEmployeeIncentives: {},
      rawIncentiveRecords: [],
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const formattedMonthYear = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/incentives`,
      {
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          "x-employee-id": meId,
        },
      }
    );

    const incentiveRecords = Array.isArray(response.data.data)
      ? response.data.data
      : [];

    if (incentiveRecords.length === 0) {
      console.warn("No valid incentives data received");
      return {
        totalIncentives: 0,
        employeesWithIncentives: [],
        perEmployeeIncentives: {},
        rawIncentiveRecords: [],
      };
    }

    let totalIncentives = 0;
    const employeesWithIncentives = [];
    const perEmployeeIncentives = {};

    const employeeCtcMap = new Map(
      employees.map((emp) => [emp.employee_id, emp.ctc])
    );

    const validIncentives = incentiveRecords.filter((incentive) => {
      if (!incentive || !incentive.employee_id || !incentive.applicable_month) {
        console.warn(`Invalid incentive record: ${JSON.stringify(incentive)}`);
        return false;
      }

      const incentiveDate = new Date(incentive.applicable_month);
      const isValid =
        !isNaN(incentiveDate) &&
        incentiveDate.getFullYear() === currentYear &&
        String(incentiveDate.getMonth() + 1).padStart(2, "0") === currentMonth;

      return isValid;
    });

    for (const incentive of validIncentives) {
      const { employee_id, ctc_percentage, sales_amount } = incentive;
      if (!employeeCtcMap.has(employee_id)) {
        console.warn(
          `Employee ${employee_id} not found in employees list, skipping incentive`
        );
        continue;
      }

      const ctc = employeeCtcMap.get(employee_id) || 0;
      let amount = 0;

      if (
        incentive.incentive_type === "ctc" &&
        ctc_percentage &&
        !isNaN(parseFloat(ctc_percentage))
      ) {
        amount = (parseFloat(ctc_percentage) / 100) * (ctc / 12);
      } else if (
        incentive.incentive_type === "sales" &&
        sales_amount &&
        !isNaN(parseFloat(sales_amount))
      ) {
        amount = parseFloat(sales_amount);
      } else {
        continue;
      }

      totalIncentives += amount;
      if (!perEmployeeIncentives[employee_id]) {
        perEmployeeIncentives[employee_id] = 0;
        employeesWithIncentives.push(employee_id);
      }
      perEmployeeIncentives[employee_id] += amount;
    }

    return {
      totalIncentives,
      employeesWithIncentives,
      perEmployeeIncentives,
      rawIncentiveRecords: validIncentives,
      formattedMonthYear,
    };
  } catch (error) {
    console.error("Error fetching incentives:", error.message);
    return {
      totalIncentives: 0,
      employeesWithIncentives: [],
      perEmployeeIncentives: {},
      rawIncentiveRecords: [],
    };
  }
};
