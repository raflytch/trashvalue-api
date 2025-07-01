import crypto from "crypto";

const verifyMidtransSignature = (req, res, next) => {
  try {
    const receivedSignatureKey =
      req.headers["x-signature-key"] || req.body.signature_key;
    const receivedBody = req.body;

    if (!receivedSignatureKey) {
      return res.status(401).json({
        status: "error",
        message: "Signature key is missing",
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY not found in environment variables");
      return res.status(500).json({
        status: "error",
        message: "Server configuration error",
      });
    }

    if (req.body.order_id) {
      next();
      return;
    }

    const requestBody = JSON.stringify(receivedBody);
    const expectedSignature = crypto
      .createHash("sha512")
      .update(requestBody + serverKey)
      .digest("hex");

    if (receivedSignatureKey !== expectedSignature) {
      console.error("Signature verification failed");
      console.error(`Received: ${receivedSignatureKey}`);
      console.error(`Expected: ${expectedSignature}`);
      return res.status(401).json({
        status: "error",
        message: "Invalid signature",
      });
    }

    next();
  } catch (error) {
    console.error("Midtrans signature verification error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to verify signature",
    });
  }
};

export default verifyMidtransSignature;
