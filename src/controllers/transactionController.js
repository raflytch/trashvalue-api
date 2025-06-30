import {
  getAllTransactionsService,
  getTransactionsByUserIdService,
  getTransactionByIdService,
  createWithdrawalService,
  createTopupTransactionService,
  handlePaymentNotificationService,
  updateTransactionStatusService,
  getPaymentStatusService,
  cancelTransactionService,
} from "../services/transactionService.js";
import { response } from "../core/response.js";
import { USER_ROLE } from "../core/constant.js";

export const getTransactionsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;

    if (req.user.role !== USER_ROLE.ADMIN) {
      return response.error(res, "Unauthorized access", 403);
    }

    const result = await getAllTransactionsService(page, limit, status, type);

    return response.success(
      res,
      result.data,
      "Successfully retrieved transactions",
      200,
      result.metadata
    );
  } catch (error) {
    console.error("Get transactions error:", error);
    return response.error(res, error.message);
  }
};

export const getUserTransactionsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;

    if (req.user.role !== USER_ROLE.ADMIN && req.user.id !== userId) {
      return response.error(res, "Unauthorized access", 403);
    }

    const result = await getTransactionsByUserIdService(
      userId,
      page,
      limit,
      status,
      type
    );

    return response.success(
      res,
      result.data,
      "Successfully retrieved user transactions",
      200,
      result.metadata
    );
  } catch (error) {
    console.error("Get user transactions error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const getTransactionByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await getTransactionByIdService(id);

    if (
      req.user.role !== USER_ROLE.ADMIN &&
      req.user.id !== transaction.userId
    ) {
      return response.error(res, "Unauthorized access", 403);
    }

    return response.success(res, transaction, "Transaction found successfully");
  } catch (error) {
    console.error("Get transaction by ID error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const createWithdrawalController = async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    const transactionData = {
      amount,
      paymentMethod,
      description,
    };

    const transaction = await createWithdrawalService(
      req.user.id,
      transactionData
    );

    return response.success(
      res,
      transaction,
      "Withdrawal request created successfully",
      201
    );
  } catch (error) {
    console.error("Create withdrawal error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Insufficient balance")) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const createTopupController = async (req, res) => {
  try {
    const { amount, paymentMethod, specificMethod } = req.body;

    const transactionData = {
      amount,
      paymentMethod,
      specificMethod,
    };

    const result = await createTopupTransactionService(
      req.user.id,
      transactionData
    );

    return response.success(
      res,
      result,
      "Topup transaction created successfully",
      201
    );
  } catch (error) {
    console.error("Create topup error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (
      error.message.includes("Midtrans") ||
      error.message.includes("authentication failed")
    ) {
      return response.error(res, error.message, 500);
    }
    return response.error(res, error.message);
  }
};

export const handlePaymentNotificationController = async (req, res) => {
  try {
    console.log("Received payment notification");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));

    const notificationData = req.body;

    const updatedTransaction = await handlePaymentNotificationService(
      notificationData
    );

    return response.success(
      res,
      updatedTransaction,
      "Notification processed successfully"
    );
  } catch (error) {
    console.error("Payment notification error:", error);
    return response.success(res, null, "Notification received");
  }
};

export const updateTransactionStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return response.validation(res, {
        message: "Status is required",
      });
    }

    if (req.user.role !== USER_ROLE.ADMIN) {
      return response.error(res, "Unauthorized access", 403);
    }

    const updatedTransaction = await updateTransactionStatusService(id, status);

    return response.success(
      res,
      updatedTransaction,
      "Transaction status updated successfully"
    );
  } catch (error) {
    console.error("Update transaction status error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Invalid status")) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const getPaymentStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await getTransactionByIdService(id);

    if (
      req.user.role !== USER_ROLE.ADMIN &&
      req.user.id !== transaction.userId
    ) {
      return response.error(res, "Unauthorized access", 403);
    }

    const status = await getPaymentStatusService(id);

    return response.success(
      res,
      status,
      "Payment status retrieved successfully"
    );
  } catch (error) {
    console.error("Get payment status error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (
      error.message.includes("Midtrans") ||
      error.message.includes("authentication failed")
    ) {
      return response.error(res, error.message, 500);
    }
    return response.error(res, error.message);
  }
};

export const cancelTransactionController = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await getTransactionByIdService(id);

    if (
      req.user.role !== USER_ROLE.ADMIN &&
      req.user.id !== transaction.userId
    ) {
      return response.error(res, "Unauthorized access", 403);
    }

    const updatedTransaction = await cancelTransactionService(id);

    return response.success(
      res,
      updatedTransaction,
      "Transaction cancelled successfully"
    );
  } catch (error) {
    console.error("Cancel transaction error:", error);
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (
      error.message.includes("Midtrans") ||
      error.message.includes("authentication failed")
    ) {
      return response.error(res, error.message, 500);
    }
    return response.error(res, error.message);
  }
};
