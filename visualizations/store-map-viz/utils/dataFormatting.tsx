
export const  deriveStatus = (location) => {
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
    Object.keys(location).forEach((key) => {
      const isTooltip = key.includes("tooltip_");
      const isIconLabel = key === "icon_label" && !key.includes("_precision");
  
      if (isTooltip || isIconLabel) {
        const precisionKey = `${key}_precision`;
        const prefixKey = `${key}_prefix`;
        const suffixKey = `${key}_suffix`;
  
        if (location[precisionKey] !== undefined) {
          try {
            location[key] = location[key].toFixed(
              parseInt(location[precisionKey])
            );
            delete location[precisionKey];
          } catch (error) {
            console.warn(
              `Value for ${key} does not appear to be numeric, can't change precision`
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
  };