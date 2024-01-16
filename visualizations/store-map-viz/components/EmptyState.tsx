import React from "react";
import { Card, CardBody, HeadingText } from "nr1";

const EmptyState: React.FC = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
   
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide NRQL query that returns geo data in the correct format.
      </HeadingText>
      <div className="queryHelpText">
      The query should include the columns (as required):<br /><br />
        <ul>
          <li>latitude - the latitude of the marker</li>
          <li>longitude - the longitude of the marker</li>
          <li>icon_label - the value to show on the marker</li>
          <li>value - the value to evaluate against thresholds</li>
          <li>threshold_warning - the threshold to cause warning colour</li>
          <li>threshold_critical - the threshold to cause critical colour</li>
          <li>tooltip_any_field_name - A value to appear in the tool tip, inlcude as many as you like.</li>
          <li>link - URL to link to on click.</li>
        </ul>
        <br /><br />Example:<br/>
        <code>FROM myGeoEvents SELECT count(*) AS 'icon_label',
latest(latitude) AS 'latitude',
latest(longitude) AS 'longitude',          
count(*) AS 'value',
50 as 'threshold_warning', 
70 as 'threshold_critical',
average(sales) AS 'tooltip_sales' 
FACET location AS 'name' </code>
      </div>
      
    </CardBody>
  </Card>
);

export default EmptyState;
