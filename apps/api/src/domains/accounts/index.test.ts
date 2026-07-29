import { afterEach, describe, expect, it, vi } from "vitest"
import * as accounts from "./index.ts"
import * as accountsRepo from "./repository.ts"
import { createProfileForAccount, createUserAccount } from "../../test/factories.ts"

describe("accounts domain", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getAuthScope", () => {
    it("returns unauthorized when the user does not exist", async () => {
      const result = await accounts.getAuthScope("missing_user")
      expect(result).toEqual({ ok: false, reason: "unauthorized" })
    })

    it("returns no_membership when the user has no membership", async () => {
      const user = await accountsRepo.createUser({
        authId: "auth_orphan",
        email: "orphan@example.com",
        name: "Orphan",
      })

      const result = await accounts.getAuthScope(user.id)
      expect(result).toEqual({ ok: false, reason: "no_membership" })
    })

    it("returns the user, account, and membership when fully provisioned", async () => {
      const { user, account, membership } = await createUserAccount({
        email: "owner@example.com",
        name: "Owner",
      })

      const result = await accounts.getAuthScope(user.id)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.scope.user.id).toBe(user.id)
      expect(result.scope.account.id).toBe(account.id)
      expect(result.scope.membership.id).toBe(membership.id)
      expect(result.scope.membership.role).toBe("owner")
    })
  })

  describe("ensureUserFromWorkOS", () => {
    it("creates a user, individual account, and owner membership", async () => {
      const user = await accounts.ensureUserFromWorkOS({
        authId: "auth_new",
        email: "new@example.com",
        name: "New User",
      })

      expect(user).toMatchObject({
        authId: "auth_new",
        email: "new@example.com",
        name: "New User",
      })

      const scope = await accounts.getAuthScope(user!.id)
      expect(scope.ok).toBe(true)
      if (!scope.ok) return

      expect(scope.scope.account.type).toBe("individual")
      expect(scope.scope.membership.role).toBe("owner")
      expect(scope.scope.membership.profiles).toEqual(["all"])
    })

    it("updates an existing user instead of creating a duplicate", async () => {
      const first = await accounts.ensureUserFromWorkOS({
        authId: "auth_existing",
        email: "old@example.com",
        name: "Old Name",
      })

      const second = await accounts.ensureUserFromWorkOS({
        authId: "auth_existing",
        email: "new@example.com",
        name: "New Name",
      })

      expect(second?.id).toBe(first?.id)

      const refreshed = await accounts.getUserById(first!.id)
      expect(refreshed).toMatchObject({
        email: "new@example.com",
        name: "New Name",
      })

      const memberships = await accountsRepo.listMembershipsByUser(first!.id)
      expect(memberships).toHaveLength(1)
    })
  })

  describe("normalizeMemberPermissions", () => {
    it("returns all for owner and admin roles", async () => {
      const { account } = await createUserAccount()

      await expect(
        accounts.normalizeMemberPermissions(account.id, "owner", ["anything"]),
      ).resolves.toEqual(["all"])
      await expect(
        accounts.normalizeMemberPermissions(account.id, "admin", []),
      ).resolves.toEqual(["all"])
    })

    it("accepts explicit profile ids that belong to the account", async () => {
      const { account, user } = await createUserAccount()
      const { profile } = await createProfileForAccount({
        accountId: account.id,
        userId: user.id,
        username: "team-page",
      })

      await expect(
        accounts.normalizeMemberPermissions(account.id, "member", [profile.id]),
      ).resolves.toEqual([profile.id])
    })

    it("rejects empty or mixed all selections for members", async () => {
      const { account } = await createUserAccount()

      await expect(
        accounts.normalizeMemberPermissions(account.id, "member", []),
      ).rejects.toThrow("Choose all pages or at least one selected page")

      await expect(
        accounts.normalizeMemberPermissions(account.id, "member", [
          "all",
          "prof_1",
        ]),
      ).rejects.toThrow("Choose all pages or at least one selected page")
    })

    it("rejects profile ids outside the account", async () => {
      const { account } = await createUserAccount()

      await expect(
        accounts.normalizeMemberPermissions(account.id, "member", [
          "missing_profile",
        ]),
      ).rejects.toThrow("One or more selected pages do not belong to this team")
    })
  })

  describe("invitations", () => {
    it("creates, previews, and accepts an invitation", async () => {
      const owner = await createUserAccount({
        email: "owner@example.com",
        name: "Owner",
        accountType: "team",
      })
      const invitee = await createUserAccount({
        email: "invitee@example.com",
        name: "Invitee",
      })

      const { invitation, token } = await accounts.createInvitation({
        accountId: owner.account.id,
        invitedByUserId: owner.user.id,
        email: "invitee@example.com",
        role: "admin",
        profiles: ["all"],
      })

      expect(invitation.status).toBe("pending")
      expect(invitation.email).toBe("invitee@example.com")

      const preview = await accounts.getInvitationPreview(token)
      expect(preview).toMatchObject({
        status: "valid",
        email: "invitee@example.com",
        role: "admin",
        invitedByName: "Owner",
      })

      await accounts.acceptInvitation({
        token,
        userId: invitee.user.id,
      })

      const inviteeScope = await accounts.getAuthScope(invitee.user.id)
      expect(inviteeScope.ok).toBe(true)
      if (!inviteeScope.ok) return

      expect(inviteeScope.scope.account.id).toBe(owner.account.id)
      expect(inviteeScope.scope.membership.role).toBe("admin")
      expect(inviteeScope.scope.account.type).toBe("team")

      const accepted = await accountsRepo.getInvitationById(invitation.id)
      expect(accepted?.status).toBe("accepted")
    })

    it("prevents duplicate pending invitations for the same email", async () => {
      const owner = await createUserAccount({ accountType: "team" })

      await accounts.createInvitation({
        accountId: owner.account.id,
        invitedByUserId: owner.user.id,
        email: "dup@example.com",
        role: "member",
        profiles: ["all"],
      })

      await expect(
        accounts.createInvitation({
          accountId: owner.account.id,
          invitedByUserId: owner.user.id,
          email: "DUP@example.com",
          role: "member",
          profiles: ["all"],
        }),
      ).rejects.toThrow("An invitation is already pending for this email")
    })

    it("revokes a pending invitation", async () => {
      const owner = await createUserAccount({ accountType: "team" })
      const { invitation } = await accounts.createInvitation({
        accountId: owner.account.id,
        invitedByUserId: owner.user.id,
        email: "revoke@example.com",
        role: "member",
        profiles: ["all"],
      })

      await accounts.revokeInvitation({
        invitationId: invitation.id,
        accountId: owner.account.id,
      })

      const revoked = await accountsRepo.getInvitationById(invitation.id)
      expect(revoked?.status).toBe("revoked")
    })

    it("marks expired invitations as invalid", async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))

      const owner = await createUserAccount({ accountType: "team" })
      const { token } = await accounts.createInvitation({
        accountId: owner.account.id,
        invitedByUserId: owner.user.id,
        email: "expired@example.com",
        role: "member",
        profiles: ["all"],
      })

      vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"))

      const preview = await accounts.getInvitationPreview(token)
      expect(preview).toEqual({
        status: "invalid",
        message: "This invitation has expired.",
      })

      await expect(
        accounts.acceptInvitation({
          token,
          userId: owner.user.id,
        }),
      ).rejects.toThrow("Invitation has expired")
    })
  })
})
