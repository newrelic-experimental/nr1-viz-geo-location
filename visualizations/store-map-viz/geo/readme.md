# GEO JSON Data


## World Data
This is referenced using the two or three letter ISO coutnry code. e.g. 'USA' or 'US'
> Source: https://github.com/datasets/geo-countries

## US States
This data refernced by 2 letter state code, number or name. e.g. 'AZ' / '04' / 'Arizona'. See [us-state-codes.json](./us-states/us-state-codes.json).
> Source: https://eric.clst.org/tech/usgeojson/

## UK Regions
This is referenced by region name.

- North East
- North West
- Yorkshire and The Humber
- East Midlands
- West Midlands
- Eastern
- London
- South East
- South West
- Wales
- Scotland
- Nothern Ireland
- Ireland


> Source : https://cartographyvectors.com/geo/united-kingdom

## Adding your own custom regions
We recommend follwing the pattern for the us-states. You'll need GeoJSON data for each of the regions and need to add the linking code in Regions.tsx.
