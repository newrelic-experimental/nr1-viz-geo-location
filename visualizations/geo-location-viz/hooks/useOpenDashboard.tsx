import { navigation } from "nr1";

type Location = {
  dash_guid: string | null;
  dash_filter: string | null;
  dash_variables: string | null;
};

const useOpenDashboard = () => {
  return (location: Location) => {
    if (!location.dash_guid) return;

    let selectedVars = {};
    try {
      if (location.dash_variables) {
        selectedVars = JSON.parse(location.dash_variables);
      }
    } catch (e) {
      console.error("Error parsing dash_variables:", e);
    }

    navigation.openStackedNerdlet({
      id: "dashboards.detail",
      urlState: {
        entityGuid: location.dash_guid,
        filters: location.dash_filter || "",
        useDefaultTimeRange: false,
        selectedVariables: selectedVars,
      },
    });
  };
};

export { useOpenDashboard };
