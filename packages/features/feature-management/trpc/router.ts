import { z } from "zod";

import { FeaturesRepository } from "@calcom/features/flags/features.repository";
import { prisma } from "@calcom/prisma";
import authedProcedure from "@calcom/trpc/server/procedures/authedProcedure";
import { router } from "@calcom/trpc/server/trpc";

import { FeatureManagementService } from "../services/FeatureManagementService";

const getFeatureManagementService = () => {
  const featuresRepository = new FeaturesRepository(prisma);
  return new FeatureManagementService(featuresRepository);
};

export const featureManagementRouter = router({
  /**
   * List all features for the current user with their enabled status.
   */
  listForUser: authedProcedure.query(async ({ ctx }) => {
    const service = getFeatureManagementService();
    return service.listFeaturesForUser(ctx.user.id);
  }),

  /**
   * List all features for a team with their enabled status.
   */
  listForTeam: authedProcedure
    .input(
      z.object({
        teamId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const service = getFeatureManagementService();
      return service.listFeaturesForTeam(input.teamId);
    }),

  /**
   * List all features for an organization with their enabled status.
   */
  listForOrganization: authedProcedure
    .input(
      z.object({
        organizationId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const service = getFeatureManagementService();
      return service.listFeaturesForOrganization(input.organizationId);
    }),

  /**
   * Set the enabled status of a feature for the current user.
   * Users can always control their own features - no PBAC check needed.
   */
  setUserFeatureEnabled: authedProcedure
    .input(
      z.object({
        featureSlug: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = getFeatureManagementService();
      await service.setUserFeatureEnabled(
        ctx.user.id,
        input.featureSlug,
        input.enabled,
        `user:${ctx.user.id}`
      );
      return { success: true };
    }),

  /**
   * Set the enabled status of a feature for a team.
   * Requires appropriate PBAC permissions.
   */
  setTeamFeatureEnabled: authedProcedure
    .input(
      z.object({
        teamId: z.number(),
        featureSlug: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = getFeatureManagementService();
      await service.setTeamFeatureEnabled(
        input.teamId,
        input.featureSlug,
        input.enabled,
        `user:${ctx.user.id}`
      );
      return { success: true };
    }),

  /**
   * Set the enabled status of a feature for an organization.
   * Requires appropriate PBAC permissions.
   */
  setOrganizationFeatureEnabled: authedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        featureSlug: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = getFeatureManagementService();
      await service.setOrganizationFeatureEnabled(
        input.organizationId,
        input.featureSlug,
        input.enabled,
        `user:${ctx.user.id}`
      );
      return { success: true };
    }),

  /**
   * Get features that are eligible for opt-in via the banner system.
   */
  getEligibleOptInFeatures: authedProcedure.query(async ({ ctx }) => {
    const service = getFeatureManagementService();
    return service.getEligibleOptInFeatures(ctx.user.id);
  }),

  /**
   * Check if a user has opted into a specific feature.
   */
  hasUserOptedIn: authedProcedure
    .input(
      z.object({
        featureSlug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = getFeatureManagementService();
      return service.hasUserOptedIn(ctx.user.id, input.featureSlug);
    }),

  /**
   * Opt into a feature via the banner system.
   * This is a convenience endpoint that enables the feature for the current user.
   */
  optInToFeature: authedProcedure
    .input(
      z.object({
        featureSlug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = getFeatureManagementService();

      if (!service.isFeatureInOptInAllowlist(input.featureSlug)) {
        throw new Error("Feature is not available for opt-in");
      }

      await service.setUserFeatureEnabled(ctx.user.id, input.featureSlug, true, `user:${ctx.user.id}`);
      return { success: true };
    }),
});
