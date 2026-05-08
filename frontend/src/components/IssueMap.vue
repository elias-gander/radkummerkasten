<template>
  <div class="issue-map" ref="mapContainer"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const props = defineProps({
  issues: { type: Array, default: () => [] },
  selectedIssueId: Number,
  createLocation: Object,
  createOpen: Boolean,
});
const emits = defineEmits(["selectIssue", "mapClick"]);

const mapContainer = ref(null);
let map;
let sourceId = "issue-source";

function buildFeature(issue) {
  return {
    type: "Feature",
    properties: {
      id: issue.id,
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
  if (!map || !map.getSource(sourceId)) {
    return;
  }
  const features = props.issues.map(buildFeature);
  map.getSource(sourceId).setData({ type: "FeatureCollection", features });
}

function updateCreateMarker() {
  if (!map || !map.getSource("create-source")) {
    return;
  }
  if (props.createOpen && props.createLocation) {
    map.getSource("create-source").setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
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
    map.getSource("create-source").setData({
      type: "FeatureCollection",
      features: [],
    });
  }
}

onMounted(() => {
  const wienStyle = {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
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
    style: wienStyle,
    center: [16.3738, 48.2082],
    zoom: 12,
    minZoom: 10,
    maxZoom: 16,
    maxBounds: [
      [16.0, 47.95],
      [16.7, 48.4],
    ],
  });

  map.addControl(new maplibregl.NavigationControl(), "top-left");

  map.on("load", () => {
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

      map.addSource("create-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#ff6600",
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 30, 36],
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0077cc",
          "circle-radius": 10,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "create-marker",
        type: "circle",
        source: "create-source",
        paint: {
          "circle-color": "#2a9d8f",
          "circle-radius": 12,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: "create-marker-symbol",
        type: "symbol",
        source: "create-source",
        layout: {
          "text-field": "+",
          "text-size": 18,
          "text-offset": [0, 0.2],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

    map.on("click", "clusters", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"],
      });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource(sourceId)
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
  });
});

watch(() => props.issues, updateSource, { deep: true });
watch(
  () => [props.createLocation, props.createOpen],
  updateCreateMarker,
  { deep: true },
);

onBeforeUnmount(() => {
  map?.remove();
});
</script>
