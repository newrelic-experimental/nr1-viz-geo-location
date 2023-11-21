import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

import { DEFAULT_ZOOM, DEFAULT_CENTER } from "../contstants";

// Define the shape of your context data
interface StoreMapContextData {
  zoom: number;
  center: number[]; // Center is an array of two numbers (latitude and longitude)
}

// Extending the provider's props to include zoom and center
interface StoreMapProviderProps {
  children: ReactNode;
  zoom?: number; // Zoom is optional
  center?: string; // Center is a string
}

// Create the context
const StoreMapContext = createContext<StoreMapContextData | undefined>(
  undefined
);

// Modify the provider component to accept zoom and center as props
export const StoreMapProvider: React.FC<StoreMapProviderProps> = ({
  children,
  zoom = DEFAULT_ZOOM,
  center = DEFAULT_CENTER,
}) => {
  // Initialize state with default or provided values
  const [currentZoom, setZoom] = useState<number>(zoom);
  // Parse the string value of center into an array of two numbers
  const [currentCenter, setCenter] = useState<number[]>(JSON.parse(center));

  // Update state when props change
  useEffect(() => {
    setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    setCenter(JSON.parse(center));
  }, [center]);

  return (
    <StoreMapContext.Provider
      value={{ zoom: currentZoom, center: currentCenter }}
    >
      {children}
    </StoreMapContext.Provider>
  );
};

// Custom hook to use the context
export const useStoreMap = () => {
  const context = useContext(StoreMapContext);
  if (!context) {
    throw new Error("useStoreMap must be used within a StoreMapProvider");
  }
  return context;
};

export default StoreMapContext;
