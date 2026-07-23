import {
  createUser,
  getUsersByIds,
  deleteUser,
  getUsersForExport,
  listUsers,
  updateProfile,
  updateUserRole
} from "../services/user.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { buildCsv, parseIdsQuery, sendCsv } from "../utils/csv.js";
import { buildPdf, sendPdf } from "../utils/pdf.js";

export const listUsersController = catchAsync(async (req, res) => {
  const data = await listUsers(req.user.id, req.query);
  return sendResponse(res, 200, "Users fetched successfully", data);
});

export const deleteUserController = catchAsync(async (req, res) => {
  await deleteUser(Number(req.params.id), req.user.id);
  return sendResponse(res, 200, "User deleted successfully");
});

export const createUserController = catchAsync(async (req, res) => {
  const data = await createUser(req.validatedBody, req.user.id);
  return sendResponse(res, 201, "User created successfully", data);
});

export const updateUserRoleController = catchAsync(async (req, res) => {
  const data = await updateUserRole(
    Number(req.params.id),
    req.validatedBody.role,
    req.user.id
  );

  return sendResponse(res, 200, "User role updated successfully", data);
});

export const updateProfileController = catchAsync(async (req, res) => {
  const data = await updateProfile(req.user.id, req.validatedBody);
  return sendResponse(res, 200, "Profile updated successfully", data);
});

export const exportUsersController = catchAsync(async (req, res) => {
  const data = await getUsersForExport(req.user.id, req.query, parseIdsQuery(req.query.ids));
  const csv = buildCsv(data, [
    { label: "ID", value: (user) => user.id },
    { label: "Name", value: (user) => user.name },
    { label: "Email", value: (user) => user.email },
    { label: "Role", value: (user) => user.role },
    { label: "Gender", value: (user) => user.gender || "" },
    { label: "Mobile Number", value: (user) => user.mobileNumber || "" },
    {
      label: "Created At",
      value: (user) => new Date(user.createdAt).toISOString()
    }
  ]);

  return sendCsv(res, "users.csv", csv);
});

export const exportUsersPdfController = catchAsync(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const data = ids.length
    ? await getUsersByIds(req.user.id, ids)
    : await getUsersForExport(req.user.id, req.body || {}, []);
  const pdf = buildPdf("Users Export", data, [
    { label: "ID", value: (user) => user.id, width: 6 },
    { label: "Name", value: (user) => user.name, width: 18 },
    { label: "Email", value: (user) => user.email, width: 24 },
    { label: "Role", value: (user) => user.role, width: 8 },
    { label: "Mobile", value: (user) => user.mobileNumber || "", width: 16 },
    { label: "Created", value: (user) => new Date(user.createdAt).toISOString().slice(0, 10), width: 12 }
  ]);

  return sendPdf(res, "users.pdf", pdf);
});
