import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Station } from "../../../models/station.model.js";
import { Company } from "../../../models/company.models.js";
import { RegionalAdmin } from "../../../models/regional_admin.model.js";
import { sendEmail } from "../../../utils/helper.js";

const createStation = asyncHandler(async (req, res) => {
  const {
    station_name,
    station_address,
    regional_admin_id,
    company_id,
  } = req.body;

  if ([station_name, station_address, regional_admin_id, company_id].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const requiredAddressFields = ["address_line1", "address_line2", "city", "state", "pin_code", "nearby_landmark"];
  const missingAddressField = requiredAddressFields.find(
    (key) => !station_address?.[key] || `${station_address[key]}`.trim() === ""
  );

  if (missingAddressField) {
    throw new ApiError(400, `station_address.${missingAddressField} is required`);
  }

  const existingCompany = await Company.findById(company_id);
  if (!existingCompany) {
    throw new ApiError(404, "Company not found");
  }

  const existingRegionalAdmin = await RegionalAdmin.findById(regional_admin_id);
  if (!existingRegionalAdmin) {
    throw new ApiError(404, "Regional admin not found");
  }

  if (existingRegionalAdmin.company_id?.toString() !== company_id) {
    throw new ApiError(400, "Regional admin does not belong to this company");
  }

  const duplicateStation = await Station.findOne({
    company_id,
    station_name: station_name.trim(),
  });

  if (duplicateStation) {
    throw new ApiError(409, "A station with this name already exists in this company");
  }

  const newStation = await Station.create({
    station_name: station_name.trim(),
    station_address,
    regional_admin_id,
    company_id,
  });

  const email_subject = "New Station Assigned: " + station_name;
  const email_body = `
<h3>NavSwap</h3>

<p>Dear ${existingRegionalAdmin.full_name},</p>

<p>
You have been assigned as the <strong>Regional Admin</strong> for the new station 
"<strong>${station_name}</strong>".
</p>

<p>
In this role, you will be responsible for overseeing operations and managing activities within your assigned region.
</p>

<p>
Please log in to your account to review the station details and proceed with the necessary actions.
</p>

<p>Best regards,<br>Team NavSwap</p>

<p>---</p>

<p>This is an automated email. Please do not reply.</p>
`;
  await sendEmail(existingRegionalAdmin.email, email_subject, email_body);

  return res
    .status(201)
    .json(new ApiResponse(201, { station: newStation }, "Station created successfully"));
});

export { createStation };
