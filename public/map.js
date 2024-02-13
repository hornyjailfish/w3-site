// Importing necessary modules from esm, a CDN for NPM packages that provides ES Module versions of the packages
import { Collection, Map, View } from "https://esm.sh/ol?dts";
import {
    click,
    pointerMove,
    singleClick,
} from "https://esm.sh/ol/events/condition.js?dts";
import {
    Vector as VectorLayer,
    // VectorTile as VectorTileLayer,
} from "https://esm.sh/ol/layer?dts";
import {
    Vector as VectorSource,
    // VectorTile as VectorTileSource,
} from "https://esm.sh/ol/source?dts";
import { Fill, Stroke, Style } from "https://esm.sh/ol/style?dts";
// BUG: GeoJson and Select selection works only from skypack but not from esm
import {
    defaults as defaultIntegrations,
    Select,
} from "https://cdn.skypack.dev/ol/interaction.js?dts";
import GeoJSON from "https://cdn.skypack.dev/ol/format/GeoJSON?dts";

const wall_style = new Style({
    stroke: new Stroke({
        color: "rgba(128, 69, 200, 0.8)",
        width: 3,
    }),
    fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
    }),
    zIndex: 50,
});

const outter_style = new Style({
    stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 0.5,
    }),
    fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
    }),
    zIndex: 1,
});

const inner_style = new Style({
    stroke: new Stroke({
        color: "rgba(0, 200, 200, 0.1)",
        width: 0,
    }),
    fill: new Fill({
        color: "rgba(0, 200, 200, 0.5)",
    }),
    zIndex: 100,
});

const selectStyle = new Style({
    fill: new Fill({
        color: "rgba(50, 50, 50, 0.6)",
    }),
    stroke: new Stroke({
        color: "rgba(255, 255, 255, 0.7)",
        width: 2,
    }),
});

const out = new VectorLayer({
    className: "outside",
    declutter: true,
    source: new VectorSource({
        format: new GeoJSON(),
        url: "static/outside.json",
    }),
    style: function (feature) {
        return outter_style;
    },
});

const wall = new VectorLayer({
    className: "walls",
    source: new VectorSource({
        url: "static/walls.json",
        format: new GeoJSON(),
    }),
    style: function (feature) {
        return wall_style;
    },
});

const indoorSource = new VectorSource({
    url: "static/try_it.json",
    // url: "/static/test.geojson",
    useSpatialIndex: false,
    format: new GeoJSON(),
});
const indoorLayer = new VectorLayer({
    className: "level1",
    source: indoorSource,
    style: function (feature) {
        return selectStyle;
    },
});

const selected = new Collection();
const select_interation = new Select({
    multi: false,
    layers: [indoorLayer],
    condition: click,
    style: null,
    // filter: function (feature, layer) {
    //   // Only select features of the 'indoorLayer'
    //   return layer === indoorLayer;
    // },
    features: selected,
});

// const selectedLayer = new VectorLayer({
//   className: "selected",
//   source: select_interation.getFeatures(),
//   style: function (feature) {
//     return inner_style;
//   },
// });

// I add this to window because it ez to debug
window.rio = new Map({
    target: "canvas",
    layers: [out, wall, indoorLayer],
    view: new View({
        // can get it with window.rio.getView().getViewStateAndExtent()
        center: [4178960.1582484944, 7540331.402377126],
        zoom: 17,
        // Bound box of view
        extent: [
            4177849.7786315638,
            7539801.200416635,
            4180161.0895338333,
            7540907.198797603,
        ],
        // constrainOnlyCenter: true,
        // ok'ish zoom level
        minZoom: 16,
        maxZoom: 21,
    }),
    // interactions: defaultIntegrations().extend([select_interation]),
});
window.rio.addInteraction(select_interation);

select_interation.on("select", function (e) {
    e.deselected.forEach((f) => {
        // INFO: this triggers when selection is cleared
        f.setStyle(null);
    });

    e.selected.forEach((f) => {
        f.setStyle(inner_style);
        htmx.ajax("GET", "/search?q=" + f.get("name"), "div#search-result")
            .then(() => {
                w3_open();
                window.rio.updateSize();
            });
    });
});
