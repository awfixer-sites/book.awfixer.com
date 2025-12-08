"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { trpc } from "@calcom/trpc/react";

import { dismissBanner } from "../components/FeatureOptInBanner";
import type { EligibleOptInFeature } from "../services/FeatureManagementService";

export interface UseFeatureOptInBannerResult {
  featureToShow: EligibleOptInFeature | null;
  isLoading: boolean;
  dismissCurrentFeature: () => void;
  onOptInSuccess: () => void;
}

/**
 * Hook to manage the feature opt-in banner.
 * 
 * The banner is shown when:
 * 1. A feature slug is provided via URL parameter (?feature=bookings-v3)
 * 2. The feature is in the opt-in allowlist
 * 3. The user hasn't already opted in
 * 4. The user hasn't dismissed the banner (stored in localStorage)
 * 5. The feature is globally enabled
 */
export function useFeatureOptInBanner(): UseFeatureOptInBannerResult {
  const searchParams = useSearchParams();
  const featureParam = searchParams?.get("feature");
  
  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>([]);
  const [featureToShow, setFeatureToShow] = useState<EligibleOptInFeature | null>(null);

  const { data: eligibleFeatures, isLoading } = trpc.viewer.featureManagement.getEligibleOptInFeatures.useQuery(
    undefined,
    {
      enabled: !!featureParam,
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cal_feature_banners_dismissed");
      setDismissedFeatures(stored ? JSON.parse(stored) : []);
    }
  }, []);

  useEffect(() => {
    if (!featureParam || !eligibleFeatures) {
      setFeatureToShow(null);
      return;
    }

    if (dismissedFeatures.includes(featureParam)) {
      setFeatureToShow(null);
      return;
    }

    const feature = eligibleFeatures.find((f) => f.slug === featureParam);
    setFeatureToShow(feature || null);
  }, [featureParam, eligibleFeatures, dismissedFeatures]);

  const dismissCurrentFeature = useCallback(() => {
    if (featureToShow) {
      dismissBanner(featureToShow.slug);
      setDismissedFeatures((prev) => [...prev, featureToShow.slug]);
      setFeatureToShow(null);
    }
  }, [featureToShow]);

  const onOptInSuccess = useCallback(() => {
    setFeatureToShow(null);
  }, []);

  return {
    featureToShow,
    isLoading,
    dismissCurrentFeature,
    onOptInSuccess,
  };
}
