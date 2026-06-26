import api from "./api";

export const getTransactions = (params) =>
  api.get("/transactions", {
    params,
  });

export const deleteTransaction = (id) => {
  return api.delete(`/transactions/${id}`);
};

export const updateTransaction = (id, data) => {
  return api.put(`/transactions/${id}`, data);
};