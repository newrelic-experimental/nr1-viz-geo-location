import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  CardSection,
  CardSectionBody,
  CardSectionHeader,
  List,
  ListItem,
} from "nr1";

const EmptyState: React.FC = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide NRQL query that returns geo data in the correct format.
      </HeadingText>
      <CardSection className="EmptyState-cardSection">
        <CardSectionHeader>
          <HeadingText type={HeadingText.TYPE.HEADING_4}>
            The query should include the columns (as required):
          </HeadingText>
        </CardSectionHeader>
        <CardSectionBody>
          <List fullWidth={true} rowHeight={20}>
            <ListItem>
              • <code className="inline">latitude</code> - the latitude of the
              marker
            </ListItem>
            <ListItem>
              • <code className="inline">longitude</code> - the longitude of the
              marker
            </ListItem>
            <ListItem>
              • <code className="inline">icon_label</code> - the value to show
              on the marker
            </ListItem>
            <ListItem>
              • <code className="inline">value</code> - the value to evaluate
              against thresholds
            </ListItem>
            <ListItem>
              • <code className="inline">threshold_warning</code> - the
              threshold to cause warning colour
            </ListItem>
            <ListItem>
              • <code className="inline">threshold_critical</code> - the
              threshold to cause critical colour
            </ListItem>
            <ListItem>
              • <code className="inline">tooltip_any_field_name</code> - A value
              to appear in the tool tip, inlcude as many as you like
            </ListItem>
            <ListItem>
              • <code className="inline">link</code> - URL to link to on click
            </ListItem>
          </List>
        </CardSectionBody>
      </CardSection>
      <CardSection className="EmptyState-cardSection">
        <CardSectionHeader>
          <HeadingText type={HeadingText.TYPE.HEADING_4}>Example:</HeadingText>
        </CardSectionHeader>
        <CardSectionBody>
          <code>
            FROM myGeoEvents SELECT count(*) AS 'icon_label', latest(latitude)
            AS 'latitude', latest(longitude) AS 'longitude', count(*) AS
            'value', 50 as 'threshold_warning', 70 as 'threshold_critical',
            average(sales) AS 'tooltip_sales' FACET location AS 'name'{" "}
          </code>
        </CardSectionBody>
      </CardSection>
    </CardBody>
  </Card>
);

export default EmptyState;
