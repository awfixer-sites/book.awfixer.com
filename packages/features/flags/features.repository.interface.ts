import type { AppFlags } from "./config";

export interface IFeaturesRepository {
  checkIfFeatureIsEnabledGlobally(slug: keyof AppFlags): Promise<boolean>;
  checkIfUserHasFeature(userId: number, slug: string): Promise<boolean>;
  checkIfUserHasFeatureNonHierarchical(userId: number, slug: string): Promise<boolean>;
  checkIfTeamHasFeature(teamId: number, slug: keyof AppFlags): Promise<boolean>;
  getTeamsWithFeatureEnabled(slug: keyof AppFlags): Promise<number[]>;
  setUserFeatureEnabled(userId: number, featureId: string, enabled: boolean, assignedBy: string): Promise<void>;
  setTeamFeatureEnabled(teamId: number, featureId: string, enabled: boolean, assignedBy: string): Promise<void>;
  getUserFeature(userId: number, featureId: string): Promise<unknown>;
  getTeamFeature(teamId: number, featureId: string): Promise<unknown>;
  getUserFeatures(userId: number): Promise<unknown[]>;
  getTeamFeaturesWithDetails(teamId: number): Promise<unknown[]>;
}
