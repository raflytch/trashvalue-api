import {
  findAllTransactionsModel,
  findTransactionsByUserIdModel,
  findTransactionByIdModel,
  createTransactionModel,
  updateTransactionStatusModel,
  updateTransactionPaymentIdModel,
  findTransactionByPaymentIdModel,
} from "../models/transaction.model.js";
import { findUserById } from "../models/user.model.js";
import { STATUS, TRANSACTION_TYPE, PAYMENT_METHOD } from "../core/constant.js";
import prisma from "../config/prisma.js";
import { snap, core } from "../utils/midtrans.js";

export const getAllTransactionsService = async (
  page = 1,
  limit = 10,
  status,
  type
) => {
  const { transactions, totalTransactions } = await findAllTransactionsModel(
    page,
    limit,
    status,
    type
  );

  return {
    data: transactions,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    },
  };
};

export const getTransactionsByUserIdService = async (
  userId,
  page = 1,
  limit = 10,
  status,
  type
) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const { transactions, totalTransactions } =
    await findTransactionsByUserIdModel(userId, page, limit, status, type);

  return {
    data: transactions,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    },
  };
};

export const getTransactionByIdService = async (id) => {
  const transaction = await findTransactionByIdModel(id);

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

export const createWithdrawalService = async (userId, transactionData) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const { amount, paymentMethod, description } = transactionData;

  if (!amount || !paymentMethod) {
    throw new Error("Amount and payment method are required");
  }

  if (parseFloat(amount) <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (user.balance < parseFloat(amount)) {
    throw new Error("Insufficient balance for withdrawal");
  }

  const paymentMethodFormatted = paymentMethod.toUpperCase();

  if (!Object.values(PAYMENT_METHOD).includes(paymentMethodFormatted)) {
    throw new Error(
      `Invalid payment method. Valid options are: ${Object.values(
        PAYMENT_METHOD
      ).join(", ")}`
    );
  }

  const transaction = await prisma.$transaction(async (prisma) => {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type: TRANSACTION_TYPE.WITHDRAWAL,
        status: STATUS.PENDING,
        paymentMethod: paymentMethodFormatted,
        description: description || "Balance withdrawal",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: parseFloat(amount),
        },
      },
    });

    return transaction;
  });

  return transaction;
};

export const createTopupTransactionService = async (
  userId,
  transactionData
) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { amount, paymentMethod, specificMethod } = transactionData;

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Valid amount is required");
    }

    const paymentMethodFormatted = paymentMethod
      ? paymentMethod.toUpperCase()
      : null;

    if (
      paymentMethodFormatted &&
      !Object.values(PAYMENT_METHOD).includes(paymentMethodFormatted)
    ) {
      throw new Error(
        `Invalid payment method. Valid options are: ${Object.values(
          PAYMENT_METHOD
        ).join(", ")}`
      );
    }

    const transaction = await createTransactionModel({
      userId,
      amount: parseFloat(amount),
      type: TRANSACTION_TYPE.DEPOSIT,
      status: STATUS.PENDING,
      paymentMethod: paymentMethodFormatted,
      description: "Wallet topup",
    });

    try {
      if (
        !process.env.MIDTRANS_SERVER_KEY ||
        !process.env.MIDTRANS_CLIENT_KEY
      ) {
        throw new Error("Midtrans credentials not configured");
      }

      const parameter = {
        transaction_details: {
          order_id: transaction.id,
          gross_amount: parseInt(amount),
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        },
      };

      if (paymentMethodFormatted === PAYMENT_METHOD.E_WALLET) {
        if (specificMethod === "qris") {
          parameter.enabled_payments = ["qris"];
          parameter.payment_type = "qris";
        } else if (specificMethod === "gopay") {
          parameter.enabled_payments = ["gopay"];
          parameter.payment_type = "gopay";
        } else {
          parameter.enabled_payments = ["gopay", "shopeepay", "qris"];
        }
      } else if (paymentMethodFormatted === PAYMENT_METHOD.BANK_TRANSFER) {
        parameter.enabled_payments = [
          "bca_va",
          "bni_va",
          "permata_va",
          "bri_va",
          "other_va",
        ];

        if (specificMethod === "bca") {
          parameter.bank_transfer = {
            bank: "bca",
          };
        } else if (specificMethod === "bni") {
          parameter.bank_transfer = {
            bank: "bni",
          };
        } else if (specificMethod === "permata") {
          parameter.bank_transfer = {
            bank: "permata",
          };
        } else if (specificMethod === "bri") {
          parameter.bank_transfer = {
            bank: "bri",
          };
        }
      }

      console.log("Sending request to Midtrans:", JSON.stringify(parameter));

      const midtransResponse = await snap.createTransaction(parameter);

      console.log("Midtrans response:", JSON.stringify(midtransResponse));

      await updateTransactionPaymentIdModel(
        transaction.id,
        midtransResponse.token
      );

      return {
        transaction,
        redirectUrl: midtransResponse.redirect_url,
        token: midtransResponse.token,
      };
    } catch (midtransError) {
      console.error("Midtrans error details:", midtransError);
      if (midtransError.ApiResponse) {
        console.error("Midtrans API Response:", midtransError.ApiResponse);
      }

      await updateTransactionStatusModel(transaction.id, STATUS.REJECTED);

      if (midtransError.httpStatusCode === 401) {
        throw new Error(
          "Midtrans authentication failed. Please check your server key and client key configuration."
        );
      }

      throw new Error(
        `Midtrans error: ${midtransError.message || "Unknown error occurred"}`
      );
    }
  } catch (error) {
    console.error("Create topup transaction error:", error);
    throw error;
  }
};

export const handlePaymentNotificationService = async (notificationData) => {
  try {
    console.log(
      "Received Midtrans notification:",
      JSON.stringify(notificationData)
    );

    const orderId = notificationData.order_id;
    const transactionStatus = notificationData.transaction_status;
    const fraudStatus = notificationData.fraud_status;

    console.log(
      `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`
    );

    const transaction = await findTransactionByIdModel(orderId);
    if (!transaction) {
      throw new Error(`Transaction not found with ID: ${orderId}`);
    }

    let newStatus;

    if (transactionStatus == "capture") {
      if (fraudStatus == "challenge") {
        newStatus = STATUS.PROCESSING;
      } else if (fraudStatus == "accept") {
        newStatus = STATUS.COMPLETED;
      }
    } else if (transactionStatus == "settlement") {
      newStatus = STATUS.COMPLETED;
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      newStatus = STATUS.REJECTED;
    } else if (transactionStatus == "pending") {
      newStatus = STATUS.PROCESSING;
    }

    if (!newStatus) {
      console.log(
        `No status change needed for transaction status: ${transactionStatus}`
      );
      return transaction;
    }

    console.log(
      `Updating transaction ${orderId} from ${transaction.status} to ${newStatus}`
    );

    const updatedTransaction = await updateTransactionStatusModel(
      orderId,
      newStatus
    );

    if (
      newStatus === STATUS.COMPLETED &&
      transaction.type === TRANSACTION_TYPE.DEPOSIT &&
      transaction.status !== STATUS.COMPLETED
    ) {
      console.log(
        `Incrementing user balance for completed deposit: ${transaction.amount}`
      );
      await prisma.user.update({
        where: {
          id: transaction.userId,
        },
        data: {
          balance: {
            increment: parseFloat(transaction.amount),
          },
        },
      });
    }

    return updatedTransaction;
  } catch (error) {
    console.error("Notification processing error:", error);
    throw new Error(`Notification processing error: ${error.message}`);
  }
};

export const updateTransactionStatusService = async (id, status) => {
  const transaction = await findTransactionByIdModel(id);

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const validTransitions = {
    [STATUS.PENDING]: [STATUS.PROCESSING, STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.PROCESSING]: [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]: [],
    [STATUS.REJECTED]: [],
  };

  if (!validTransitions[transaction.status].includes(status)) {
    throw new Error(
      `Invalid status transition from ${transaction.status} to ${status}`
    );
  }

  const result = await prisma.$transaction(async (prisma) => {
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (
      transaction.type === TRANSACTION_TYPE.WITHDRAWAL &&
      transaction.status !== STATUS.COMPLETED &&
      status === STATUS.REJECTED
    ) {
      console.log(
        `Refunding withdrawal amount to user balance: ${transaction.amount}`
      );
      await prisma.user.update({
        where: {
          id: transaction.userId,
        },
        data: {
          balance: {
            increment: parseFloat(transaction.amount),
          },
        },
      });
    }

    return updatedTransaction;
  });

  return result;
};

export const getPaymentStatusService = async (id) => {
  try {
    const transaction = await findTransactionByIdModel(id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    try {
      console.log(`Checking payment status for transaction: ${id}`);
      const statusResponse = await snap.transaction.status(id);

      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status || null;

      let newStatus;

      if (transactionStatus == "capture") {
        if (fraudStatus == "challenge") {
          newStatus = STATUS.PROCESSING;
        } else if (fraudStatus == "accept") {
          newStatus = STATUS.COMPLETED;
        }
      } else if (transactionStatus == "settlement") {
        newStatus = STATUS.COMPLETED;
      } else if (
        transactionStatus == "cancel" ||
        transactionStatus == "deny" ||
        transactionStatus == "expire"
      ) {
        newStatus = STATUS.REJECTED;
      } else if (transactionStatus == "pending") {
        newStatus = STATUS.PROCESSING;
      }

      if (newStatus && transaction.status !== newStatus) {
        console.log(
          `Updating transaction status from ${transaction.status} to ${newStatus}`
        );
        await updateTransactionStatusModel(id, newStatus);

        if (
          newStatus === STATUS.COMPLETED &&
          transaction.type === TRANSACTION_TYPE.DEPOSIT &&
          transaction.status !== STATUS.COMPLETED
        ) {
          console.log(
            `Incrementing user balance for completed deposit: ${transaction.amount}`
          );
          await prisma.user.update({
            where: {
              id: transaction.userId,
            },
            data: {
              balance: {
                increment: parseFloat(transaction.amount),
              },
            },
          });
        }
      }

      return {
        order_id: statusResponse.order_id,
        transaction_status: statusResponse.transaction_status,
        fraud_status: statusResponse.fraud_status,
        status_code: statusResponse.status_code,
        payment_type: statusResponse.payment_type,
        currency: statusResponse.currency,
        gross_amount: statusResponse.gross_amount,
        transaction_time: statusResponse.transaction_time,
        transaction_id: statusResponse.transaction_id,
        status_message: statusResponse.status_message,
        merchant_id: statusResponse.merchant_id,
        payment_option_details: statusResponse.payment_option_details,
        bank: statusResponse.bank,
        va_numbers: statusResponse.va_numbers,
        permata_va_number: statusResponse.permata_va_number,
        bill_key: statusResponse.bill_key,
        biller_code: statusResponse.biller_code,
        actions: statusResponse.actions,
        expiry_time: statusResponse.expiry_time,
      };
    } catch (midtransError) {
      console.error("Midtrans payment status error:", midtransError);

      if (midtransError.httpStatusCode === 401) {
        throw new Error(
          "Midtrans authentication failed. Please check your server key and client key configuration."
        );
      }

      if (midtransError.httpStatusCode === 404) {
        throw new Error("Transaction not found in Midtrans system");
      }

      throw new Error(
        `Error fetching payment status: ${
          midtransError.message || "Unknown error occurred"
        }`
      );
    }
  } catch (error) {
    console.error("Get payment status error:", error);
    throw error;
  }
};

export const cancelTransactionService = async (id) => {
  try {
    const transaction = await findTransactionByIdModel(id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== STATUS.PENDING) {
      throw new Error("Only pending transactions can be canceled");
    }

    if (!transaction.paymentId) {
      const updatedTransaction = await updateTransactionStatusService(
        id,
        STATUS.REJECTED
      );
      return updatedTransaction;
    }

    try {
      console.log(`Cancelling transaction in Midtrans: ${id}`);
      await snap.transaction.cancel(id);

      const updatedTransaction = await updateTransactionStatusService(
        id,
        STATUS.REJECTED
      );

      return updatedTransaction;
    } catch (midtransError) {
      console.error("Midtrans cancel error:", midtransError);

      if (midtransError.httpStatusCode === 412) {
        const updatedTransaction = await updateTransactionStatusService(
          id,
          STATUS.REJECTED
        );
        return updatedTransaction;
      }

      if (midtransError.httpStatusCode === 401) {
        throw new Error(
          "Midtrans authentication failed. Please check your server key and client key configuration."
        );
      }

      throw new Error(
        `Error canceling transaction: ${
          midtransError.message || "Unknown error occurred"
        }`
      );
    }
  } catch (error) {
    console.log("Cancel transaction error:", error);
    throw error;
  }
};
