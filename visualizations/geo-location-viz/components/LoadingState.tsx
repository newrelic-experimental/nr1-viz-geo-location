import React from "react";

const LoadingState = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #f3f3f3",
          borderTop: "2px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <span style={{ fontSize: "14px", color: "#333" }}>
        Loading map data...
      </span>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingState;
