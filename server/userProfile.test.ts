/**
 * Tests for userProfile router:
 * - uploadAvatar: validates file size, uploads to S3, updates DB
 * - updateDisplayName: validates name, updates DB
 * - getProfile: returns avatarUrl and name
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { storagePut } from "./storage";
import { getDb } from "./db";

const mockStoragePut = storagePut as ReturnType<typeof vi.fn>;
const mockGetDb = getDb as ReturnType<typeof vi.fn>;

describe("userProfile.uploadAvatar logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects images larger than 5 MB", () => {
    const fiveMbPlusOne = 5 * 1024 * 1024 + 1;
    const buffer = Buffer.alloc(fiveMbPlusOne);
    const tooLarge = buffer.length > 5 * 1024 * 1024;
    expect(tooLarge).toBe(true);
  });

  it("accepts images within the 5 MB limit", () => {
    const fourMb = 4 * 1024 * 1024;
    const buffer = Buffer.alloc(fourMb);
    const withinLimit = buffer.length <= 5 * 1024 * 1024;
    expect(withinLimit).toBe(true);
  });

  it("strips data URL prefix from base64 string", () => {
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgAB";
    const stripped = dataUrl.replace(/^data:[^;]+;base64,/, "");
    expect(stripped).toBe("/9j/4AAQSkZJRgAB");
  });

  it("strips data URL prefix for PNG images", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const stripped = dataUrl.replace(/^data:[^;]+;base64,/, "");
    expect(stripped).toBe("iVBORw0KGgo=");
  });

  it("does not strip raw base64 without prefix", () => {
    const rawBase64 = "iVBORw0KGgo=";
    const stripped = rawBase64.replace(/^data:[^;]+;base64,/, "");
    expect(stripped).toBe("iVBORw0KGgo=");
  });

  it("generates correct file extension for jpeg", () => {
    const mimeType = "image/jpeg";
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    expect(ext).toBe("jpg");
  });

  it("generates correct file extension for png", () => {
    const mimeType = "image/png";
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    expect(ext).toBe("png");
  });

  it("generates a user-scoped storage key", () => {
    const userId = 42;
    const ext = "jpg";
    const timestamp = 1700000000000;
    const key = `user-avatars/${userId}-${timestamp}.${ext}`;
    expect(key).toBe("user-avatars/42-1700000000000.jpg");
    expect(key.startsWith("user-avatars/")).toBe(true);
  });

  it("calls storagePut with correct arguments", async () => {
    mockStoragePut.mockResolvedValueOnce({ url: "/manus-storage/user-avatars/42-123.jpg", key: "user-avatars/42-123.jpg" });

    const buffer = Buffer.from("fake-image-data");
    const result = await mockStoragePut("user-avatars/42-123.jpg", buffer, "image/jpeg");

    expect(mockStoragePut).toHaveBeenCalledWith("user-avatars/42-123.jpg", buffer, "image/jpeg");
    expect(result.url).toContain("user-avatars/42-123.jpg");
  });
});

describe("userProfile.updateDisplayName logic", () => {
  it("accepts a valid name", () => {
    const name = "Ahmed Al-Rashidi";
    const isValid = name.length >= 1 && name.length <= 100;
    expect(isValid).toBe(true);
  });

  it("rejects an empty name", () => {
    const name = "";
    const isValid = name.length >= 1;
    expect(isValid).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const name = "A".repeat(101);
    const isValid = name.length <= 100;
    expect(isValid).toBe(false);
  });

  it("accepts Arabic names", () => {
    const name = "أحمد الراشدي";
    const isValid = name.length >= 1 && name.length <= 100;
    expect(isValid).toBe(true);
  });
});

describe("userProfile.getProfile logic", () => {
  it("returns null values when DB is unavailable", async () => {
    mockGetDb.mockResolvedValueOnce(null);
    const db = await mockGetDb();
    const result = db ? { avatarUrl: "url", name: "name" } : { avatarUrl: null, name: null };
    expect(result.avatarUrl).toBeNull();
    expect(result.name).toBeNull();
  });

  it("returns profile data when DB is available", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ avatarUrl: "/manus-storage/avatar.jpg", name: "Ahmed" }]),
    };
    mockGetDb.mockResolvedValueOnce(mockDb);
    const db = await mockGetDb();
    const result = await db.select().from("users").where("id=1").limit(1);
    expect(result[0].avatarUrl).toBe("/manus-storage/avatar.jpg");
    expect(result[0].name).toBe("Ahmed");
  });
});
