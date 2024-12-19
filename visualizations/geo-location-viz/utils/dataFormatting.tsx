export const deriveStatus = (location) => {
  const {
    threshold_critical: critical,
    threshold_warning: warning,
    value,
  } = location;

  if (critical === undefined && warning === undefined) {
    location.status = "NONE";
    return;
  }

  const thresholdDirection =
    critical !== undefined && warning !== undefined && critical < warning
      ? "LESS"
      : "MORE";

  let status = "OK";

  if (thresholdDirection === "LESS") {
    if (critical !== undefined && value <= critical) {
      status = "CRITICAL";
    } else if (warning !== undefined && value >= critical && value <= warning) {
      status = "WARNING";
    }
  } else {
    if (critical !== undefined && value >= critical) {
      status = "CRITICAL";
    } else if (warning !== undefined && value < critical && value >= warning) {
      status = "WARNING";
    }
  }

  location.status = status;
};

export const formatValues = (location) => {
  const label_prefix = location.icon_label_prefix;
  const label_suffix = location.icon_label_suffix;
  const label_precision = location.icon_label_precision;

  //Format the icon value so it fits in the icon nicely
  location.formatted_value = location.value;
  if (location.value_precision !== undefined) {
    //precision for value was supplied in query
    location.formatted_value = location.value.toFixed(
      parseInt(location.value_precision),
    );
  } else {
    //precision of value needs to be determined
    if (!isNaN(location.value)) {
      //the value is a number (we dont try and fix its decimal places if its not)
      // We need to round to something sensible only if it has decimals already
      let isDecimal = location.value - Math.floor(location.value) !== 0;
      if (isDecimal) {
        location.formatted_value = location.value.toFixed(2);
      }
    }
  }

  Object.keys(location).forEach((key) => {
    const isClusterData = key.includes("cluster_");
    const isTooltip = key.includes("tooltip_");
    const isIconLabel = key === "icon_label" && !key.includes("_precision");

    if (!isClusterData && (isTooltip || isIconLabel)) {
      const precisionKey = `${key}_precision`;
      const prefixKey = `${key}_prefix`;
      const suffixKey = `${key}_suffix`;

      if (location[precisionKey] !== undefined) {
        try {
          location[key] = location[key].toFixed(
            parseInt(location[precisionKey]),
          );
          delete location[precisionKey];
        } catch (error) {
          console.warn(
            `Value for ${key} does not appear to be numeric, can't change precision`,
          );
        }
      }

      if (location[prefixKey] !== undefined) {
        location[key] = `${location[prefixKey]}${location[key]}`;
        delete location[prefixKey];
      }

      if (location[suffixKey] !== undefined) {
        location[key] = `${location[key]}${location[suffixKey]}`;
        delete location[suffixKey];
      }
    }
  });

  location.cluster_label_prefix = location.cluster_label_prefix
    ? location.cluster_label_prefix
    : label_prefix;
  location.cluster_label_suffix = location.cluster_label_suffix
    ? location.cluster_label_suffix
    : label_suffix;
  location.cluster_label_precision = location.cluster_label_precision
    ? location.cluster_label_precision
    : label_precision;
};
