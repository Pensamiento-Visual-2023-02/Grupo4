import gtfsToGeoJSON from 'gtfs-to-geojson';
import { readFile } from 'fs/promises';
const config = JSON.parse(
  await readFile(new URL('./config.json', import.meta.url))
);

gtfsToGeoJSON(config)
  .then(() => {
    console.log('GeoJSON Generation Successful');
  })
  .catch((err) => {
    console.error(err);
  });