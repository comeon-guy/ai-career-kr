/** Existing UI data-source switch. Not a review/design mode. */

export const DATA_CONTRACT_TASK_ROLE_FINAL = "task-role-final-candidate-v1";

export function isTaskRoleFinalDataContract(value) {
  return String(value || "").trim().toLowerCase() === DATA_CONTRACT_TASK_ROLE_FINAL;
}

/** Append data_contract to API query when present (data switch only). */
export function appendDataContractParam(params, search = "") {
  const qs = new URLSearchParams(
    search || (typeof window !== "undefined" ? window.location.search : ""),
  );
  const dc = qs.get("data_contract");
  if (isTaskRoleFinalDataContract(dc)) {
    params.set("data_contract", DATA_CONTRACT_TASK_ROLE_FINAL);
  }
  return params;
}
