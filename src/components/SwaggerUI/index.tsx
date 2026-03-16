import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import "swagger-ui-react/swagger-ui.css";

interface SwaggerUIComponentProps {
  specUrl: string;
}

function SwaggerUIComponent({ specUrl }: SwaggerUIComponentProps) {
  return (
    <BrowserOnly fallback={<div>Loading API documentation...</div>}>
      {() => {
        const SwaggerUI = require("swagger-ui-react").default || require("swagger-ui-react");
        return <SwaggerUI url={specUrl} />;
      }}
    </BrowserOnly>
  );
}

export default SwaggerUIComponent;
