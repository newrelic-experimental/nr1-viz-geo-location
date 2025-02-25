import { navigation } from "nr1";

type Location = {
  dash_guid?: string | null;
  dash_filter?: string | null;
  dash_variables?: string | null;
};

const useOpenDashboard = () => {
  return ({ dash_guid, dash_filter = "", dash_variables }: Location) => {
    if (!dash_guid) return;

    let selectedVariables = {};
    if (dash_variables) {
      try {
        selectedVariables = JSON.parse(dash_variables);
      } catch (e) {
        console.error("Error parsing dash_variables:", e);
      }
    }

    navigation.openStackedNerdlet({
      id: "dashboards.detail",
      urlState: {
        entityGuid: dash_guid,
        filters: dash_filter,
        useDefaultTimeRange: false,
        selectedVariables,
      },
    });
  };
};

export { useOpenDashboard };
