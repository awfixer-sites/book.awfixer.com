import type { FeaturesRepository } from "@calcom/features/flags/features.repository";

import { getOptInFeatureConfig, isFeatureInOptInAllowlist, getOptInFeatureSlugs } from "../config/feature-management.config";

export interface FeatureWithStatus {
  slug: string;
  enabled: boolean;
  globallyEnabled: boolean;
  description: string | null;
  type: string;
}

export interface EligibleOptInFeature {
  slug: string;
  titleI18nKey: string;
  descriptionI18nKey: string;
  learnMoreUrl?: string;
}

/**
 * Service for managing feature opt-in/opt-out functionality.
 * This service handles the business logic for feature management
 * and delegates database operations to the FeaturesRepository.
 */
export class FeatureManagementService {
  constructor(private featuresRepository: FeaturesRepository) {}

  /**
   * Get all features for a user with their enabled status.
   */
  async listFeaturesForUser(userId: number): Promise<FeatureWithStatus[]> {
    const userFeatures = await this.featuresRepository.getUserFeatures(userId);
    const allFeatures = await this.featuresRepository.getAllFeatures();

    return allFeatures.map((feature) => {
      const userFeature = userFeatures.find((uf) => uf.feature.slug === feature.slug);
      return {
        slug: feature.slug,
        enabled: userFeature?.enabled ?? false,
        globallyEnabled: feature.enabled,
        description: feature.description,
        type: feature.type,
      };
    });
  }

  /**
   * Get all features for a team with their enabled status.
   */
  async listFeaturesForTeam(teamId: number): Promise<FeatureWithStatus[]> {
    const teamFeatures = await this.featuresRepository.getTeamFeaturesWithDetails(teamId);
    const allFeatures = await this.featuresRepository.getAllFeatures();

    return allFeatures.map((feature) => {
      const teamFeature = teamFeatures.find((tf) => tf.feature.slug === feature.slug);
      return {
        slug: feature.slug,
        enabled: teamFeature?.enabled ?? false,
        globallyEnabled: feature.enabled,
        description: feature.description,
        type: feature.type,
      };
    });
  }

  /**
   * Get all features for an organization with their enabled status.
   * Organizations are teams with isOrganization = true, so we use the same logic.
   */
  async listFeaturesForOrganization(organizationId: number): Promise<FeatureWithStatus[]> {
    return this.listFeaturesForTeam(organizationId);
  }

  /**
   * Set the enabled status of a feature for a user.
   */
  async setUserFeatureEnabled(
    userId: number,
    featureSlug: string,
    enabled: boolean,
    assignedBy: string
  ): Promise<void> {
    await this.featuresRepository.setUserFeatureEnabled(userId, featureSlug, enabled, assignedBy);
  }

  /**
   * Set the enabled status of a feature for a team.
   */
  async setTeamFeatureEnabled(
    teamId: number,
    featureSlug: string,
    enabled: boolean,
    assignedBy: string
  ): Promise<void> {
    await this.featuresRepository.setTeamFeatureEnabled(teamId, featureSlug, enabled, assignedBy);
  }

  /**
   * Set the enabled status of a feature for an organization.
   * Organizations are teams, so we use the same method.
   */
  async setOrganizationFeatureEnabled(
    organizationId: number,
    featureSlug: string,
    enabled: boolean,
    assignedBy: string
  ): Promise<void> {
    await this.featuresRepository.setTeamFeatureEnabled(organizationId, featureSlug, enabled, assignedBy);
  }

  /**
   * Get features that are eligible for opt-in via the banner system.
   * A feature is eligible if:
   * 1. It's in the opt-in allowlist
   * 2. The user hasn't already opted in (UserFeatures.enabled !== true)
   * 3. The feature is globally enabled
   */
  async getEligibleOptInFeatures(userId: number): Promise<EligibleOptInFeature[]> {
    const eligibleFeatures: EligibleOptInFeature[] = [];
    const optInSlugs = getOptInFeatureSlugs();

    for (const slug of optInSlugs) {
      const config = getOptInFeatureConfig(slug);
      if (!config) continue;

      const userFeature = await this.featuresRepository.getUserFeature(userId, slug);

      if (userFeature && userFeature.enabled === true) {
        continue;
      }

      const isGloballyEnabled = await this.featuresRepository.checkIfFeatureIsEnabledGlobally(
        slug as Parameters<typeof this.featuresRepository.checkIfFeatureIsEnabledGlobally>[0]
      );
      if (!isGloballyEnabled) continue;

      eligibleFeatures.push({
        slug: config.slug,
        titleI18nKey: config.titleI18nKey,
        descriptionI18nKey: config.descriptionI18nKey,
        learnMoreUrl: config.learnMoreUrl,
      });
    }

    return eligibleFeatures;
  }

  /**
   * Check if a feature is in the opt-in allowlist.
   */
  isFeatureInOptInAllowlist(slug: string): boolean {
    return isFeatureInOptInAllowlist(slug);
  }

  /**
   * Get the opt-in configuration for a specific feature.
   */
  getOptInFeatureConfig(slug: string) {
    return getOptInFeatureConfig(slug);
  }

  /**
   * Check if a user has opted into a specific feature.
   */
  async hasUserOptedIn(userId: number, featureSlug: string): Promise<boolean> {
    const userFeature = await this.featuresRepository.getUserFeature(userId, featureSlug);
    return userFeature?.enabled === true;
  }
}
