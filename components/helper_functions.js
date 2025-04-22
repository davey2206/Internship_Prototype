export function getAnimalIconUrl(pluginDirUrl, animal) {
  if (!animal || !animal.main_species) {
    return pluginDirUrl + 'media/animal_tracking_icons/turtle.webp';
  }

  const main_species = animal.main_species.toLowerCase();
  if (main_species.includes('dolphin')) {
    return pluginDirUrl + 'media/animal_tracking_icons/dolphin.webp';
  } else if (main_species.includes('bear')) {
    return pluginDirUrl + 'media/animal_tracking_icons/polar_bear.webp';
  } else if (main_species.includes('whale')) {
    return pluginDirUrl + 'media/animal_tracking_icons/whale.webp';
  } else if (main_species.includes('shark')) {
    return pluginDirUrl + 'media/animal_tracking_icons/shark.webp';
  } else if (main_species.includes('lion')) {
    return pluginDirUrl + 'media/animal_tracking_icons/lion.webp';
  } else if (main_species.includes('penguin')) {
    return pluginDirUrl + 'media/animal_tracking_icons/penguin.webp';
  } else {
    return pluginDirUrl + 'media/animal_tracking_icons/turtle.webp';
  }
}

export function getAnimalPictureUrl(pluginDirUrl, animal) {
  return pluginDirUrl + 'media/animal_pictures/' + animal.id + '.webp';
}

export function getAnimalShapeUrl(pluginDirUrl, animal) {
  if (!animal || !animal.main_species) {
    return pluginDirUrl + 'media/animal_masks/turtle.svg';
  }

  const main_species = animal.main_species.toLowerCase();
  const masksDir = pluginDirUrl + 'media/animal_masks/';

  if (main_species.includes('dolphin')) {
    return masksDir + 'dolphin.svg';
  } else if (main_species.includes('bear')) {
    return ''; // No shape for bear
  } else if (main_species.includes('whale')) {
    return masksDir + 'whale.svg';
  } else if (main_species.includes('shark')) {
    return masksDir + 'shark.svg';
  } else if (main_species.includes('lion')) {
    return ''; // No shape for lion
  } else if (main_species.includes('penguin')) {
    return masksDir + 'penguin.svg';
  } else if (main_species.includes('seal')) {
    return masksDir + 'seal.svg';
  } else {
    return masksDir + 'turtle.svg'; // Default shape
  }
}

export function generateImageryViewModels() {
  const imageryViewModels = [];

  /* Per Carto's website regarding basemap attribution: https://carto.com/help/working-with-data/attribution/#basemaps */
  let CartoAttribution =
    'Map tiles by <a href="https://carto.com">Carto</a>, under CC BY 3.0. Data by <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, under ODbL.';

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Esri World Imagery Satellite Basemap',
      iconUrl:
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/5/15/12',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: 'Tiles © Esri',
          minimumLevel: 0,
          maximumLevel: 21,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Esri World Ocean Basemap',
      iconUrl:
        'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/5/15/12',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
          credit: 'Tiles © Esri',
          minimumLevel: 0,
          maximumLevel: 12,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'OpenStreetMap',
      iconUrl: Cesium.buildModuleUrl(
        'Widgets/Images/ImageryProviders/openStreetMap.png'
      ),
      tooltip:
        'OpenStreetMap (OSM) is a collaborative project to create a free editable map of the world.\nhttp://www.openstreetmap.org',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: 'abc',
          minimumLevel: 0,
          maximumLevel: 19,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Positron',
      tooltip: 'CartoDB Positron basemap',
      iconUrl: 'http://a.basemaps.cartocdn.com/light_all/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Positron without labels',
      tooltip: 'CartoDB Positron without labels basemap',
      iconUrl:
        'http://a.basemaps.cartocdn.com/rastertiles/light_nolabels/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Dark Matter',
      tooltip: 'CartoDB Dark Matter basemap',
      iconUrl:
        'http://a.basemaps.cartocdn.com/rastertiles/dark_all/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Dark Matter without labels',
      tooltip: 'CartoDB Dark Matter without labels basemap',
      iconUrl:
        'http://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Voyager',
      tooltip: 'CartoDB Voyager basemap',
      iconUrl:
        'http://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Voyager without labels',
      tooltip: 'CartoDB Voyager without labels basemap',
      iconUrl:
        'http://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'National Map Satellite',
      iconUrl:
        'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/4/6/4',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
          credit:
            'Tile data from <a href="https://basemap.nationalmap.gov/">USGS</a>',
          minimumLevel: 0,
          maximumLevel: 16,
        });
      },
    })
  );

  imageryViewModels.push(
    new Cesium.ProviderViewModel({
      name: 'Light Labels Only',
      tooltip: 'CartoDB Positron labels only',
      iconUrl: 'http://a.basemaps.cartocdn.com/light_only_labels/5/15/12.png',
      creationFunction: function () {
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
          credit: CartoAttribution,
          minimumLevel: 0,
          maximumLevel: 18,
        });
      },
    })
  );

  return imageryViewModels;
}
