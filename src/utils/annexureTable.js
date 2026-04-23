export const getAnnexureTableHtml = () => {
  return `

<div class="annexure-break"></div>

<br><br>

<table id="annexure-table"
  border="1"
  cellspacing="0"
  cellpadding="5"
  style="border-collapse: collapse; width: 100%;">

<thead>

<tr>
<th colspan="3"
style="text-align:center; font-weight:bold;">
Annexure-I
</th>
</tr>

<tr>
<th>Components</th>
<th>Monthly</th>
<th>Yearly</th>
</tr>

</thead>

<tbody>

<tr>
<td><strong>Basic</strong></td>
<td>[basic_monthly]</td>
<td>[basic_yearly]</td>
</tr>

<tr>
<td><strong>House Rent Allowance (HRA)</strong></td>
<td>[hra_monthly]</td>
<td>[hra_yearly]</td>
</tr>

<tr>
<td><strong>Bonus</strong></td>
<td>[bonus_monthly]</td>
<td>[bonus_yearly]</td>
</tr>

<tr>
<td><strong>Other Allowance</strong></td>
<td>[other_allowance_monthly]</td>
<td>[other_allowance_yearly]</td>
</tr>

<tr>
<td><strong>Gross (A)</strong></td>
<td>[gross_monthly]</td>
<td>[gross_yearly]</td>
</tr>

<tr>
<td colspan="3"></td>
</tr>

<tr>
<td colspan="3">
<strong>EMPLOYER CONTRIBUTIONS</strong>
</td>
</tr>

<tr>
<td>Employer PF Contribution</td>
<td>[employer_pf_monthly]</td>
<td>[employer_pf_yearly]</td>
</tr>

<tr>
<td>Insurance</td>
<td>[insurance_monthly]</td>
<td>[insurance_yearly]</td>
</tr>

<tr>
<td>ESI</td>
<td>[employer_esi_monthly]</td>
<td>[employer_esi_yearly]</td>
</tr>

<tr>
<td>Gratuity</td>
<td>[gratuity_monthly]</td>
<td>[gratuity_yearly]</td>
</tr>

<tr>
<td><strong>Sub Total (B)</strong></td>
<td>[subtotal_b_monthly]</td>
<td>[subtotal_b_yearly]</td>
</tr>

<tr>
<td colspan="3"></td>
</tr>

<tr>
<td>
<strong>Cost to Company (CTC) - (A + B)</strong>
</td>
<td>[ctc_monthly]</td>
<td>[ctc_yearly]</td>
</tr>

<tr>
<td colspan="3"></td>
</tr>

<tr>
<td colspan="3">
<strong>EMPLOYEE CONTRIBUTIONS</strong>
</td>
</tr>

<tr>
<td>Employee PF Contribution</td>
<td>[employee_pf_monthly]</td>
<td>[employee_pf_yearly]</td>
</tr>

<tr>
<td>Professional Tax</td>
<td>[pt_monthly]</td>
<td>[pt_yearly]</td>
</tr>

<tr>
<td>ESI</td>
<td>[employee_esi_monthly]</td>
<td>[employee_esi_yearly]</td>
</tr>

<tr>
<td><strong>Sub Total (C)</strong></td>
<td>[subtotal_c_monthly]</td>
<td>[subtotal_c_yearly]</td>
</tr>

<tr>
<td>
<strong>Net Salary (A - C)</strong>
</td>
<td>[net_salary_monthly]</td>
<td>[net_salary_yearly]</td>
</tr>

</tbody>

</table>

  `;
};