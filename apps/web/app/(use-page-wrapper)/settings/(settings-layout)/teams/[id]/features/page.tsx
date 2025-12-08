import { _generateMetadata } from "app/_utils";

import TeamFeaturesView from "~/settings/teams/team-features-view";

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) =>
  await _generateMetadata(
    (t) => t("features"),
    (t) => t("team_features_description"),
    undefined,
    undefined,
    `/settings/teams/${(await params).id}/features`
  );

const Page = async () => {
  return <TeamFeaturesView />;
};

export default Page;
