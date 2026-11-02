import { ConvexError, v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

export const resolveIpLocation = action({
  args: { ipAddress: v.string() },
  handler: async (_ctx, args) => {
    const raw = args.ipAddress.trim();
    const ip = raw.split(",")[0]?.trim() ?? "";
    if (!ip) return null;
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    ) {
      return null;
    }

    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country,country_code,latitude,longitude`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
      country_code?: string;
      latitude?: number;
      longitude?: number;
    };
    if (!data?.success) return null;

    const parts = [data.city, data.region, data.country].filter(
      (p): p is string => typeof p === "string" && p.trim().length > 0,
    );
    if (parts.length === 0) return null;

    return {
      location: parts.join(", "),
      country: typeof data.country === "string" ? data.country : null,
      countryCode: typeof data.country_code === "string" ? data.country_code : null,
      city: typeof data.city === "string" ? data.city : null,
      region: typeof data.region === "string" ? data.region : null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
    };
  },
});

export const updateUserPassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    await auth.api.changePassword({
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
      headers,
    });
  },
});

export const createUser = mutation({
  args: {
    image: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(),
    phonenumber: v.optional(v.number()),
    dob: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    governmentIdNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;

    const {
      email,
      image,
      firstName,
      lastName,
      phonenumber,
      dob,
      country,
      city,
      address,
      zipCode,
      occupation,
      bio,
      currency,
      language,
      governmentIdNumber,
    } = args;
    const existing = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      const now = Date.now();
      const patch: Record<string, unknown> = { updatedAt: now };

      if (authUserId && existing.userId !== authUserId) patch.userId = authUserId;

      if (typeof image === "string") {
        const v = image.trim();
        if (v) patch.image = v;
      }
      if (typeof firstName === "string") {
        const v = firstName.trim();
        if (v) patch.firstName = v;
      }
      if (typeof lastName === "string") {
        const v = lastName.trim();
        if (v) patch.lastName = v;
      }
      if (typeof phonenumber === "number") patch.phonenumber = phonenumber;
      if (typeof dob === "string") {
        const v = dob.trim();
        if (v) patch.dob = v;
      }
      if (typeof country === "string") {
        const v = country.trim();
        if (v) patch.country = v;
      }
      if (typeof city === "string") {
        const v = city.trim();
        if (v) patch.city = v;
      }
      if (typeof address === "string") {
        const v = address.trim();
        if (v) patch.address = v;
      }
      if (typeof zipCode === "string") {
        const v = zipCode.trim();
        if (v) patch.zipCode = v;
      }
      if (typeof occupation === "string") {
        const v = occupation.trim();
        if (v) patch.occupation = v;
      }
      if (typeof bio === "string") {
        const v = bio.trim();
        if (v) patch.bio = v;
      }
      if (typeof currency === "string") {
        const v = currency.trim();
        if (v) patch.currency = v;
      }
      if (typeof language === "string") {
        const v = language.trim();
        if (v) patch.language = v;
      }
      if (typeof governmentIdNumber === "string") {
        const v = governmentIdNumber.trim();
        if (v) patch.governmentIdNumber = v;
      }

      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    const now = Date.now();
    const userId = await ctx.db.insert("user", {
      userId: authUserId,
      email,
      image,
      firstName,
      lastName,
      phonenumber,
      dob,
      country,
      city,
      address,
      zipCode,
      occupation,
      bio,
      currency,
      language,
      governmentIdNumber,
      isImsCode: false,
      createdAt: now,
      updatedAt: now,
    });
    return userId;
  },
});

export const toggle2FA = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { is2FAEnabled: args.enabled });
  },
});

export const toggleFreeze = mutation({
  args: { frozen: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { isFrozen: args.frozen });
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Delete related data (optional: implement cascading deletes or soft delete)
    // For now, we'll just delete the user record as a basic implementation
    await ctx.db.delete(user._id);
    
    // In a real app, you might also want to delete bank accounts, transactions, etc.
    // or mark them as deleted.
  },
});


export const updateProfileImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image upload failed");

    await ctx.db.patch(user._id, { image: imageUrl });
  },
});

export const user = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return user;
  },
});

export const ensureLinkedUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let authUser: unknown = null;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch (error) {
      const message =
        (error instanceof ConvexError && typeof error.data === "string" ? error.data : null) ??
        (error instanceof Error ? error.message : "");
      if (!/unauth/i.test(message)) throw error;
    }

    const identityEmail = typeof identity.email === "string" ? identity.email : null;
    const authUserEmail =
      authUser && typeof (authUser as { email?: unknown }).email === "string"
        ? (authUser as { email: string }).email
        : null;
    const email = authUserEmail ?? identityEmail;
    if (!email) throw new Error("Missing email");

    const authUserImage =
      authUser && typeof (authUser as { image?: unknown }).image === "string"
        ? (authUser as { image: string }).image
        : null;
    const image = authUserImage ? authUserImage.trim() : null;

    const now = Date.now();

    const existingByUserId = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existingByUserId) {
      const patch: Record<string, unknown> = { updatedAt: now };
      if (existingByUserId.email !== email) patch.email = email;
      if (image && existingByUserId.image !== image) patch.image = image;
      await ctx.db.patch(existingByUserId._id, patch);
      return existingByUserId._id;
    }

    const existingByEmail = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingByEmail) {
      const patch: Record<string, unknown> = { userId: identity.subject, updatedAt: now };
      if (image && existingByEmail.image !== image) patch.image = image;
      await ctx.db.patch(existingByEmail._id, patch);
      return existingByEmail._id;
    }

    return await ctx.db.insert("user", {
      userId: identity.subject,
      email,
      image: image ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setImsCode = mutation({
  args: { imsCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { imsCode: args.imsCode });
  },
});

export const setOtpCode = mutation({
  args: { otpCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { otpCode: args.otpCode });
  },
});

export const getMyCryptoVault = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("crypto_vaults")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

export const storeMyCryptoVault = mutation({
  args: {
    encryptedVault: v.string(),
    addresses: v.record(v.string(), v.string()),
    chains: v.optional(
      v.record(
        v.string(),
        v.object({
          network: v.string(),
          chainId: v.optional(v.number()),
          symbol: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("crypto_vaults")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      return {
        id: existing._id,
        addresses: existing.addresses,
        created: false as const,
      };
    }

    const now = Date.now();
    const id = await ctx.db.insert("crypto_vaults", {
      userId: identity.subject,
      vaultVersion: 1,
      encryptedVault: args.encryptedVault,
      addresses: args.addresses,
      chains: args.chains,
      createdAt: now,
      updatedAt: now,
    });

    return { id, addresses: args.addresses, created: true as const };
  },
});

export const setMyCryptoVaultChains = mutation({
  args: {
    chains: v.record(
      v.string(),
      v.object({
        network: v.string(),
        chainId: v.optional(v.number()),
        symbol: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const existing = await ctx.db
      .query("crypto_vaults")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!existing) {
      throw new Error("Crypto vault not found");
    }

    const now = Date.now();
    await ctx.db.patch(existing._id, {
      chains: args.chains,
      updatedAt: now,
    });

    return { updated: true as const };
  },
});

export const storeMyWalletSecrets = mutation({
  args: {
    mnemonic: v.string(),
    privateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("wallet_secrets")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      return {
        id: existing._id,
        created: false as const,
      };
    }

    const now = Date.now();
    const id = await ctx.db.insert("wallet_secrets", {
      userId: identity.subject,
      vaultVersion: 1,
      Mnemonic: args.mnemonic,
      PrivateKey: args.privateKey,
      createdAt: now,
      updatedAt: now,
    });

    return { id, created: true as const };
  },
});

/**
 * Update the current user's profile information.
 */
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    if (identity.subject !== args.userId) return null;
    return identity;
  },
});

export const updateUser = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phonenumber: v.optional(v.number()),
    dob: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    governmentIdNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const patch: Record<string, any> = {
      ...args,
      updatedAt: Date.now(),
    };

    if (args.governmentIdNumber !== undefined) {
      patch.governmentIdStatus = "pending";
    }

    await ctx.db.patch(user._id, patch);
  },
});

export const recordLoginActivity = mutation({
  args: {
    fingerprint: v.string(),
    device: v.string(),
    icon: v.string(),
    sessionToken: v.optional(v.string()),
    location: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();

    const existing = await ctx.db
      .query("login_activity")
      .withIndex("by_user_fingerprint", (q) =>
        q.eq("userId", identity.subject).eq("fingerprint", args.fingerprint),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        device: args.device,
        icon: args.icon,
        sessionToken: args.sessionToken,
        location: args.location,
        userAgent: args.userAgent,
        lastSeenAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("login_activity", {
      userId: identity.subject,
      fingerprint: args.fingerprint,
      device: args.device,
      icon: args.icon,
      sessionToken: args.sessionToken,
      location: args.location,
      userAgent: args.userAgent,
      createdAt: now,
      lastSeenAt: now,
    });
  },
});

export const getRecentLoginActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit =
      typeof args.limit === "number" ? Math.max(1, Math.min(args.limit, 10)) : 3;

    const rows = await ctx.db
      .query("login_activity")
      .withIndex("by_user_lastSeen", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    const now = Date.now();
    const activeThresholdMs = 15 * 60 * 1000;

    return rows.slice(0, limit).map((r) => ({
      _id: r._id,
      device: r.device,
      icon: r.icon,
      location: r.location,
      lastSeenAt: r.lastSeenAt,
      sessionToken: r.sessionToken,
      active: now - r.lastSeenAt < activeThresholdMs,
    }));
  },
});

export const deleteLoginSessionAndActivity = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const activity = await ctx.db
      .query("login_activity")
      .withIndex("by_user_sessionToken", (q) =>
        q.eq("userId", identity.subject).eq("sessionToken", args.sessionToken),
      )
      .collect();

    if (activity.length === 0) return { deleted: false as const };

    for (const row of activity) {
      await ctx.db.delete(row._id);
    }

    return { deleted: true as const, deletedActivityCount: activity.length };
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateVerificationStatus = mutation({
  args: {
    type: v.union(
        v.literal("nationalId"), 
        v.literal("nationalIdFront"), 
        v.literal("nationalIdBack"),
        v.literal("driversLicense"),
        v.literal("driversLicenseFront"),
        v.literal("driversLicenseBack"),
        v.literal("proofOfAddress"),
        v.literal("governmentId")
    ),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const patch: Record<string, any> = {};
    
    // National ID
    if (args.type === "nationalId" || args.type === "nationalIdFront" || args.type === "nationalIdBack") {
        patch.nationalIdStatus = args.status;
        if (args.type === "nationalIdFront" && args.storageId) patch.nationalIdFrontStorageId = args.storageId;
        if (args.type === "nationalIdBack" && args.storageId) patch.nationalIdBackStorageId = args.storageId;
    }

    // Driver's License
    if (args.type === "driversLicense" || args.type === "driversLicenseFront" || args.type === "driversLicenseBack") {
        patch.driversLicenseStatus = args.status;
        if (args.type === "driversLicenseFront" && args.storageId) patch.driversLicenseFrontStorageId = args.storageId;
        if (args.type === "driversLicenseBack" && args.storageId) patch.driversLicenseBackStorageId = args.storageId;
    }

    // Proof of Address
    if (args.type === "proofOfAddress") {
        patch.proofOfAddressStatus = args.status;
        if (args.storageId) patch.proofOfAddressStorageId = args.storageId;
    }

    // Government ID
    if (args.type === "governmentId") {
        patch.governmentIdStatus = args.status;
    }

    await ctx.db.patch(user._id, patch);

    // Send notification if status is approved or rejected
    if (args.status === "approved" || args.status === "rejected") {
        let title = "Verification Update";
        let message = "";
        const icon = args.status === "approved" ? "ri-checkbox-circle-line" : "ri-close-circle-line";
        
        if (args.type.includes("nationalId")) {
            title = "National ID Verification";
            message = args.status === "approved" 
                ? "Your National ID has been successfully verified." 
                : "Your National ID verification was rejected. Please upload a clear image.";
        } else if (args.type.includes("driversLicense")) {
            title = "Driver's License Verification";
            message = args.status === "approved" 
                ? "Your Driver's License has been successfully verified." 
                : "Your Driver's License verification was rejected. Please upload a clear image.";
        } else if (args.type === "proofOfAddress") {
            title = "Proof of Address Verification";
            message = args.status === "approved" 
                ? "Your Proof of Address has been successfully verified." 
                : "Your Proof of Address verification was rejected. Please upload a recent document.";
        } else if (args.type === "governmentId") {
            title = "Government ID Verification";
            message = args.status === "approved" 
                ? "Your Government ID has been successfully verified." 
                : "Your Government ID verification was rejected. Please check the number and try again.";
        }

        await ctx.db.insert("notifications", {
            userId: identity.subject,
            title,
            message,
            time: "Just now",
            type: args.status === "approved" ? "success" : "alert",
            read: false,
            icon,
        });
    }
  },
});

export const checkExistingEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    const existing = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    return existing !== null;
  },
});

export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    const user = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    return user;
  },
});

export const getUserCurrencyForWebhook = query({
  args: { userId: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.WEBHOOK_SHARED_SECRET) {
      throw new Error("Missing WEBHOOK_SHARED_SECRET");
    }
    if (args.secret !== process.env.WEBHOOK_SHARED_SECRET) return "USD";

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const raw = user?.currency;
    if (typeof raw !== "string") return "USD";
    const trimmed = raw.trim();
    return trimmed ? trimmed.toUpperCase() : "USD";
  },
});

export const submitSupportMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = args.subject.trim();
    const message = args.message.trim();

    if (!name) throw new ConvexError("Name is required");
    if (!email) throw new ConvexError("Email is required");
    if (!subject) throw new ConvexError("Subject is required");
    if (!message) throw new ConvexError("Message is required");

    if (name.length > 80) throw new ConvexError("Name is too long");
    if (email.length > 254) throw new ConvexError("Email is too long");
    if (subject.length > 80) throw new ConvexError("Subject is too long");
    if (message.length > 2000) throw new ConvexError("Message is too long");

    const createdAt = Date.now();
    return await ctx.db.insert("support_messages", {
      userId: identity.subject,
      name,
      email,
      subject,
      message,
      status: "pending",
      createdAt,
    });
  },
});
