

export const getAvinyaQuotationHtml = () => {
  return `

<div class="quotation-wrapper">

<style>

  .quotation-wrapper {
    width: 100%;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #000;
  }

  /* =========================
     HEADER TABLE
  ========================= */

  #quotation-header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }

  #quotation-header-table td {
    border: 1px solid #000;
    padding: 12px;
    vertical-align: top;
  }

  .quotation-title {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .quotation-description {
    line-height: 1.8;
    font-size: 13px;
  }

  /* =========================
     MAIN TABLE
  ========================= */

 #quotation-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: Arial, sans-serif;
  font-size: 10px;
}

  #quotation-table th,
#quotation-table td {
  border: 1px solid #000;
  padding: 4px 4px;
  text-align: center;
  vertical-align: middle;
  word-wrap: break-word;
  line-height: 1.2;
}

 #quotation-table th {
  background: #f2f2f2;
  font-weight: bold;
  font-size: 10px;
  white-space: normal;
  line-height: 1.1;
}
  #quotation-table td.description {
    text-align: left;
    padding-left: 10px;
  }

  /* COLUMN WIDTHS */

  .col-id {
    width: 5%;
  }

  .col-description {
    width: 23%;
  }

  .col-snap {
    width: 8%;
  }

  .col-tooling {
    width: 10%;
  }

  .col-cost {
    width: 10%;
  }

  .col-qty {
    width: 6%;
  }

  .col-total {
    width: 10%;
  }

  .col-cgst {
    width: 8%;
  }

  .col-sgst {
    width: 8%;
  }

  .col-amount {
    width: 12%;
  }

  /* =========================
     TERMS SECTION
  ========================= */
.terms-section {
  margin-top: 12px;
  font-size: 11px;
  line-height: 1.5;
}

  .terms-section ol {
    margin-top: 8px;
    padding-left: 20px;
  }

  .terms-section li {
  margin-bottom: 3px;
}

</style>

<!-- =========================
     HEADER TABLE
========================= -->

<table id="quotation-header-table" style="
  width:100%;
  border-collapse:collapse;
  margin-bottom:8px;
  font-family:Arial,sans-serif;
">

  <tr>
    <td colspan="10" style="
      border:1px solid #000;
      padding:5px;
      text-align:center;
      font-size:16px;
      font-weight:bold;
      line-height:1.2;
    ">
      QUOTATION
    </td>
  </tr>

  <tr>
    <td colspan="10" style="
      border:1px solid #000;
      padding:6px 8px;
      font-size:12px;
      line-height:1.4;
      text-align:left;
    ">
      Dear Sir,<br><br>

      Please find the below Quotation for Front Face,
      Rear Face & Front Windshield Fixture development.
    </td>
  </tr>

</table>

<!-- =========================
     MAIN QUOTATION TABLE
========================= -->

<table id="quotation-table">

<thead>

<tr>

  <th class="col-id">ID</th>

  <th class="col-description">
    Description
  </th>

  <th class="col-snap">
    Snap
  </th>

  <th class="col-tooling">
    Tooling
  </th>

  <th class="col-cost">
    Cost/Unit
  </th>

  <th class="col-qty">
    Qty
  </th>

  <th class="col-total">
    Total Cost
  </th>

  <th class="col-cgst">
    CGST
  </th>

  <th class="col-sgst">
    SGST
  </th>

  <th class="col-amount">
    Total Amount
  </th>

</tr>

</thead>

<tbody>

<tr>

  <td>1</td>

  <td class="description">
    Pattern Front Face - ELON 3X
  </td>

  <td></td>

  <td>534095</td>

  <td>534095</td>

  <td>1</td>

  <td>534095</td>

  <td>48069</td>

  <td>48069</td>

  <td>630233</td>

</tr>

<tr>

  <td>2</td>

  <td class="description">
    Mould Rear Face - ELON 3X
  </td>

  <td></td>

  <td>332630</td>

  <td>320050</td>

  <td>1</td>

  <td>332630</td>

  <td>29937</td>

  <td>28805</td>

  <td>392504</td>

</tr>

<tr>

  <td>3</td>

  <td class="description">
    Front Windshield Fixture
  </td>

  <td></td>

  <td>215625</td>

  <td>46200</td>

  <td>1</td>

  <td>254437</td>

  <td>4158</td>

  <td>4158</td>

  <td>54516</td>

</tr>

</tbody>

</table>

<!-- =========================
     TERMS SECTION
========================= -->

<div class="terms-section">

<strong>TERMS AND CONDITIONS:</strong>

<ol>

  <li>
    PACKING COST AS PER ACTUALS
  </li>

  <li>
    DELIVERY TIME FOR COMPONENT 6-8 WEEKS
  </li>

  <li>
    PAYMENT TERMS - 70% advance with PO and
    30% balance against Performa invoice
  </li>

  <li>
    TRANSPORTATION COST EXTRA
  </li>

  <li>
    VALIDITY: The quote is valid for 5 days
  </li>

</ol>

<br>

<strong>Note:</strong>

<ol>

  <li>
    MDF pattern may get damaged in the process
    and is not a deliverable
  </li>

</ol>

<br><br>

Thanking you,<br><br>

<strong>Avinya Motors</strong>

</div>

</div>

  `;
};