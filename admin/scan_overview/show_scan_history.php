<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scan History Visualization</title>
    
    <!-- Load Cesium from local path -->
    <script src="../../js/Cesium/Cesium.js"></script>
    <link href="../../js/Cesium/Widgets/widgets.css" rel="stylesheet">
    
    <!-- Vue.js -->
    <script src="https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js"></script>

    <!-- Lodash -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
    
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: absolute;
        }
        #app {
            width: 100%;
            height: 100%;
            position: relative;
        }
        #cesiumContainer {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }
        #controlPanel {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background: #fffa;
        }

        .scan-popup, .cluster-popup {
            padding: 10px;
            max-width: 300px;
        }

        .scan-popup h3, .cluster-popup h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #333;
        }

        .scan-popup table {
            width: 100%;
            border-collapse: collapse;
        }

        .scan-popup td {
            padding: 4px;
        }

        .scan-popup td:first-child {
            width: 100px;
        }

        .cluster-popup .scan-item {
            padding: 8px 0;
        }

        .cluster-popup .scan-item p {
            margin: 4px 0;
        }

        .cluster-popup hr {
            border: none;
            border-top: 1px solid #eee;
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div id="app">
        <div id="cesiumContainer"></div>
        <div id="controlPanel">
        <div class="date-controls">
            <label>From: <input type="date" v-model="dateRange.from" @input="fetchData(true)"></label>
            <label>To: <input type="date" v-model="dateRange.to" @input="fetchData(true)"></label>
            <button @click="fetchData(true)">Refresh Data</button>
        </div>
            <div class="stats-panel">
                <h3>Statistics</h3>
                <p>Total Scans: {{ totalScans }}</p>
                <p>Unique Locations: {{ uniqueLocations }}</p>
                <p>Most Active Country: {{ mostActiveCountry }}</p>
            </div>
        </div>
    </div>

    <!-- Import helper functions -->
    <script src="../../components/helper_functions.js" type="module"></script>
    
    <!-- Your Vue app script -->
    <script src="scan_history.js" type="module"></script>
</body>
</html>