// services/r2.service.js - UNIFIED VERSION WITH DEBUGGING
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Initialize R2 Client using your .env variables
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

console.log("🔧 R2 Client initialized");
console.log("Endpoint:", process.env.R2_ENDPOINT);
console.log("Bucket:", process.env.R2_BUCKET_NAME);
console.log("Public URL:", process.env.R2_PUBLIC_URL);

/**
 * Upload file to R2 (GLB, images, JSON, etc.)
 */
async function uploadToR2(file, category) {
  try {
    console.log("📤 Starting R2 upload...");
    console.log("📋 File object received:", {
      hasOriginalname: !!file.originalname,
      hasBuffer: !!file.buffer,
      hasMimetype: !!file.mimetype,
      hasSize: !!file.size,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      bufferType: file.buffer ? typeof file.buffer : 'undefined',
      bufferLength: file.buffer ? file.buffer.length : 0
    });
    console.log("Category:", category);

    // Validate required fields
    if (!file.originalname) {
      throw new Error("file.originalname is required but was undefined");
    }
    if (!file.buffer) {
      throw new Error("file.buffer is required but was undefined");
    }

    // Warn if multer-reported size and actual buffer length disagree
    if (file.size && file.buffer.length !== file.size) {
      console.warn(
        `⚠️ Size mismatch! file.size=${file.size} but file.buffer.length=${file.buffer.length}`
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    console.log("📝 File extension extracted:", fileExtension);

    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    console.log("📝 Unique filename generated:", uniqueFilename);

    const key = `${category}/${uniqueFilename}`;
    console.log("🔑 R2 Key:", key);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
      // ContentLength intentionally omitted — the SDK computes this directly
      // from file.buffer.length. Manually setting it caused a mismatch with
      // the signed request for larger files (videos), producing R2's
      // "signature does not match" error.
      Metadata: {
        originalName: file.originalname,
        category: category,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log("📤 Sending upload command to R2...");
    const result = await r2Client.send(command);
    console.log("✅ File uploaded to R2 successfully");
    console.log("📊 Upload result:", {
      ETag: result.ETag,
      VersionId: result.VersionId
    });

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log("🌐 Public URL:", publicUrl);

    return {
      url: publicUrl,
      key: key,
      size: file.buffer.length,
      mimetype: file.mimetype,
      originalName: file.originalname,
    };
  } catch (error) {
    console.error("❌ R2 Upload Error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("File object at error:", {
      originalname: file?.originalname,
      hasBuffer: !!file?.buffer,
      mimetype: file?.mimetype
    });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Get JSON data from R2
 */
async function getJsonFromR2(key) {
  try {
    console.log("📥 Fetching JSON from R2:", key);

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    console.log("✅ JSON file found in R2");

    const bodyString = await streamToString(response.Body);
    console.log("📄 JSON content length:", bodyString.length);

    const parsed = JSON.parse(bodyString);
    console.log("✅ JSON parsed successfully");
    console.log("Products count:", Object.keys(parsed.products || parsed.testimonials || {}).length);
    
    return parsed;
  } catch (error) {
    // Check for "file not found" errors
    if (
      error.name === "NoSuchKey" || 
      error.name === "NotFound" ||
      error.Code === "NoSuchKey" ||
      error.$metadata?.httpStatusCode === 404
    ) {
      console.log("⚠️ JSON file not found - will create new one");
      return null;
    }
    
    // For other errors, log but still return null to allow creation
    console.error("⚠️ R2 Get JSON Error:", error.message);
    console.log("⚠️ Returning null to allow creation");
    return null;
  }
}

/**
 * Put JSON data to R2
 */
async function putJsonToR2(key, data) {
  try {
    console.log("💾 Saving JSON to R2:", key);
    console.log("Products count:", Object.keys(data.products || data.testimonials || {}).length);

    const jsonString = JSON.stringify(data, null, 2);
    console.log("JSON size:", jsonString.length, "bytes");

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: jsonString,
      ContentType: "application/json",
      Metadata: {
        lastUpdated: new Date().toISOString(),
      },
    });

    const result = await r2Client.send(command);
    console.log("✅ JSON saved to R2");
    console.log("ETag:", result.ETag);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to save JSON:", error.message);
    throw new Error(`Failed to save JSON: ${error.message}`);
  }
}

/**
 * Delete file from R2
 */
async function deleteFromR2(fileUrl) {
  try {
    let key;
    if (fileUrl.startsWith("http")) {
      const url = new URL(fileUrl);
      key = url.pathname.substring(1);
    } else {
      key = fileUrl;
    }

    console.log("🗑️ Deleting from R2:", key);

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log("✅ File deleted from R2");
    
    return true;
  } catch (error) {
    console.error("❌ R2 Delete Error:", error.message);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Helper: Convert stream to string
 */
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

module.exports = {
  uploadToR2,
  getJsonFromR2,
  putJsonToR2,
  deleteFromR2,
};
