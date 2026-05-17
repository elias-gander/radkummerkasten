<template>
  <div class="map" ref="mapContainer"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const props = defineProps({
  issues: { type: Array, required: true },
  newIssueLocation: { type: [{ latitude: Number, longitude: Number }, null], required: true },
  newIssueTypeId: { type: String, required: true },
  selectedIssueId: { type: [Number, null], required: true },
});
const emits = defineEmits(["doneLoading", "selectIssue", "mapClick"]);

const mapContainer = ref(null);
let map;
const ISSUES_SOURCE_ID = "issues";
const CREATE_SOURCE_ID = "create";

function buildFeature(issue) {
  return {
    type: "Feature",
    properties: {
      id: issue.id,
      issue_type_id: issue.issue_type_id,
      selected: issue.id === props.selectedIssueId,
    },
    geometry: {
      type: "Point",
      coordinates: [Number(issue.longitude), Number(issue.latitude)],
    },
  };
}

function updateSource() {
  const features = props.issues.map(buildFeature);
  map.getSource(ISSUES_SOURCE_ID)?.setData({ type: "FeatureCollection", features });
}

function updateCreateMarker() {
  if (props.newIssueLocation) {
    map.getSource(CREATE_SOURCE_ID).setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            issue_type_id: props.newIssueTypeId,
          },
          geometry: {
            type: "Point",
            coordinates: [
              Number(props.newIssueLocation.longitude),
              Number(props.newIssueLocation.latitude),
            ],
          },
        },
      ],
    });
  } else {
    map.getSource(CREATE_SOURCE_ID).setData({
      type: "FeatureCollection",
      features: [],
    });
  }
}

async function loadIcons() {
  const icons = import.meta.glob("/assets/markers/*/*.png", {
    eager: true,
    as: "url",
  });

  for (const [path, url] of Object.entries(icons)) {
    const fileName = path.split('/').pop().replace('.png', '');
    const status = path.split('/').slice(-2, -1)[0];
    const imageId = `${status}-${fileName}`;
    await new Promise((resolve, reject) => {
      map.loadImage(url, (error, image) => {
        if (error) {
          reject(error);
          return;
        }
        map.addImage(imageId, image);
        resolve();
      });
    });
  }
}

onMounted(() => {
  const style = {
    version: 8,
    glyphs: "https://fonts.undpgeohub.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      basemap: {
        type: "raster",
        tiles: ["https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png"],
        tileSize: 256,
        attribution: "&copy; basemap.at",
      },
    },
    layers: [
      {
        id: "basemap",
        type: "raster",
        source: "basemap",
      },
    ],
  };

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: style,
    center: [16.3738, 48.2082],
    zoom: 11,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: [
      [16.0, 47.95],
      [16.7, 48.4],
    ],
  });

  map.on("load", async () => {
    map.addSource(ISSUES_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addSource(CREATE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: ISSUES_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#004c67",
        "circle-opacity": 0.75,
        "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 30, 36],
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: ISSUES_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count}",
        "text-size": 20,
        "text-font": ["Open Sans Bold"],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#fff",
      },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "symbol",
      source: ISSUES_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["case", ["get", "selected"], ["concat", "selected-", ["get", "issue_type_id"]], ["concat", "default-", ["get", "issue_type_id"]]],
        "icon-allow-overlap": true,
      },
    });

    map.addLayer({
      id: "create-marker",
      type: "symbol",
      source: CREATE_SOURCE_ID,
      layout: {
        "icon-image": ["concat", "selected-", ["get", "issue_type_id"]],
        "icon-offset": [20, -16],
        "icon-allow-overlap": true,
      },
    });

    map.on("mouseenter", "unclustered-point", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "unclustered-point", () => {
      map.getCanvas().style.cursor = "crosshair";
    });

    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "crosshair";
    });

    map.on("click", "clusters", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      map
        .getSource(ISSUES_SOURCE_ID)
        .getClusterExpansionZoom(feature.properties.cluster_id, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
    });

    map.on("click", "unclustered-point", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;

      emits("selectIssue", Number(feature.properties.id));
    });

    map.on("click", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters", "unclustered-point"],
      });
      if (!features.length) {
        emits("mapClick", {
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
      }
    });

    map.getCanvas().style.cursor = "crosshair";

    await loadIcons();
    updateSource();
    updateCreateMarker();
  });

  map.on("idle", () => {
    emits("doneLoading");
  });
});


watch(() => props.issues, updateSource, { deep: true });
watch(() => props.selectedIssueId, (newSelectedIssueId) => {
  updateSource();
  if (map?.getZoom() < 15) {
    const newSelectedIssue = props.issues.find(issue => issue.id === newSelectedIssueId);
    map?.easeTo({
      center: [newSelectedIssue.longitude, newSelectedIssue.latitude], zoom: 15
    });
  }
});
watch(
  [() => props.newIssueLocation, () => props.newIssueTypeId],
  updateCreateMarker,
  { deep: true },
);

onBeforeUnmount(() => {
  map?.remove();
});
</script>
