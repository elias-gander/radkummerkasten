<template>
  <div class="map" ref="mapContainer"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const props = defineProps({
  issues: { type: Array },
  createLocation: Object,
});
const emits = defineEmits(["selectIssue", "mapClick"]);

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
      issue_type: issue.issue_type,
      beschreibung: issue.beschreibung,
      upvotes: issue.upvotes,
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
  if (props.createLocation) {
    map.getSource(CREATE_SOURCE_ID).setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            issue_type_id: props.createLocation.issue_type_id,
          },
          geometry: {
            type: "Point",
            coordinates: [
              Number(props.createLocation.longitude),
              Number(props.createLocation.latitude),
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
  const icons = import.meta.glob(`/assets/markers/*/*.png`, {
    eager: true, import: "default",
  });
  for (const [path, url] of Object.entries(icons)) {
    const fileName = path.split('/').pop().replace('.png', '');
    const status = path.split('/').slice(-2, -1)[0];
    const imageId = `${status}-${fileName}`;
    const image = await map.loadImage(url);
    map.addImage(imageId, image.data ?? image);
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

  map.on("load", () => {
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
        "circle-color": "#ff6600",
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
        "text-font": ["Open Sans Regular"],
      },
      paint: {
        "text-color": "#000000",
      },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "symbol",
      source: ISSUES_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["concat", "open-", ["get", "issue_type_id"]],
        "icon-size": 0.5,
        "icon-allow-overlap": true,
      },
    });

    map.addLayer({
      id: "create-marker",
      type: "symbol",
      source: CREATE_SOURCE_ID,
      layout: {
        "icon-image": ["concat", "new-", ["get", "issue_type_id"]],
        "icon-size": 0.5,
        "icon-allow-overlap": true,
      },
    });

    map.on("click", "clusters", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"],
      });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource(ISSUES_SOURCE_ID)
        .getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
    });

    map.on("click", "unclustered-point", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      emits("selectIssue", { id: Number(feature.properties.id) });
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

    updateSource();
    updateCreateMarker();
    loadIcons();
  });
});

watch(() => props.issues, updateSource, { deep: true });
watch(
  () => props.createLocation,
  updateCreateMarker,
  { deep: true },
);

onBeforeUnmount(() => {
  map?.remove();
});
</script>
