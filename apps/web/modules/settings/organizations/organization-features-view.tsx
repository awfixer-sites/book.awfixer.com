"use client";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { SettingsToggle } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { SkeletonContainer, SkeletonText } from "@calcom/ui/components/skeleton";

interface OrganizationFeaturesViewProps {
  organizationId: number;
}

const SkeletonLoader = () => {
  return (
    <SkeletonContainer>
      <div className="border-subtle space-y-6 border-x px-4 py-8 sm:px-6">
        <SkeletonText className="h-8 w-full" />
        <SkeletonText className="h-8 w-full" />
        <SkeletonText className="h-8 w-full" />
      </div>
    </SkeletonContainer>
  );
};

const OrganizationFeaturesView = ({ organizationId }: OrganizationFeaturesViewProps) => {
  const { t } = useLocale();
  const utils = trpc.useUtils();

  const { data: features, isLoading } = trpc.viewer.featureManagement.listForOrganization.useQuery({
    organizationId,
  });

  const setFeatureEnabledMutation = trpc.viewer.featureManagement.setOrganizationFeatureEnabled.useMutation({
    onSuccess: () => {
      utils.viewer.featureManagement.listForOrganization.invalidate({ organizationId });
      showToast(t("settings_updated_successfully"), "success");
    },
    onError: () => {
      showToast(t("error_updating_settings"), "error");
    },
  });

  if (isLoading) {
    return (
      <SettingsHeader
        title={t("features")}
        description={t("organization_features_description")}
        borderInShellHeader={true}>
        <SkeletonLoader />
      </SettingsHeader>
    );
  }

  const orgControlledFeatures = features?.filter((f) => f.globallyEnabled) ?? [];

  return (
    <SettingsHeader
      title={t("features")}
      description={t("organization_features_description")}
      borderInShellHeader={true}>
      <div className="border-subtle border-x px-4 py-8 sm:px-6">
        {orgControlledFeatures.length === 0 ? (
          <p className="text-subtle text-sm">{t("no_features_available")}</p>
        ) : (
          <div className="space-y-6">
            {orgControlledFeatures.map((feature) => (
              <SettingsToggle
                key={feature.slug}
                toggleSwitchAtTheEnd={true}
                title={feature.slug}
                description={feature.description || t("no_description_available")}
                disabled={setFeatureEnabledMutation.isPending}
                checked={feature.enabled}
                onCheckedChange={(checked) => {
                  setFeatureEnabledMutation.mutate({
                    organizationId,
                    featureSlug: feature.slug,
                    enabled: checked,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </SettingsHeader>
  );
};

export default OrganizationFeaturesView;
