//@ts-nocheck

const ee = require('@google/earthengine');
const privateKey = require('../../../credentials.json');
const EooAooCalc = require('@vicentecalfo/eoo-aoo-calc')

function calcArea(coordinates: any) {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            privateKey,
            async () => {

                ee.initialize()

                const eoo = new EooAooCalc.EOO({ coordinates })
                const eooObj = eoo.calculate()
                const eooGeoJson = eooObj.convexHullPolygon
                const featureCollectionEOO = ee.FeatureCollection(eooGeoJson.features)

                var EOOgeometry = featureCollectionEOO.geometry();

                const aoo = new EooAooCalc.AOO({ coordinates })
                const aooObj = aoo.calculate({ gridWidthInKm: 2 })
                const aooGeoJson = aooObj.occupiedGrids
                const featureCollectionAOO = ee.FeatureCollection(aooGeoJson.features);

                var AOOgeometry = featureCollectionAOO.geometry();

                var image1 = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');
                var image2 = ee.Image('projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1');
                var image3 = ee.Image('projects/MapBiomas_Pampa/public/collection2/mapbiomas_pampa_collection2_integration_v1');
                var image4 = ee.Image('projects/mapbiomas-chaco/public/collection4/mapbiomas_chaco_collection4_integration_v1');
                var image5 = ee.Image('projects/mapbiomas_af_trinacional/public/collection2/mapbiomas_atlantic_forest_collection20_integration_v1');
                var image6 = ee.Image('projects/mapbiomas-public/assets/peru/collection1/mapbiomas_peru_collection1_integration_v1');

                var image1bandNames = image1.bandNames().getInfo();
                var image4bandNames = image4.bandNames().getInfo();
                
                image4 = image4.select(image4bandNames.filter(function(band) { return band !== 'classification_2022'; }));

                var mosaic = ee.ImageCollection([image1, image2, image3, image5, image6, image4]).mosaic();

                var image = mosaic;
                var bandNames = image1bandNames;

                var EOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(EOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    EOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                var AOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(AOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    AOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                Promise.all([
                    Promise.all(EOOresult.map(({ band, areaKm2 }: {band: any, areaKm2: any}) => areaKm2)),
                    Promise.all(AOOresult.map(({ band, areaKm2 }: {band: any, areaKm2: any}) => areaKm2))
                ]).then(([EOOareas, AOOareas]) => {
                    EOOresult = EOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: EOOareas[i],
                    }));
                
                    AOOresult = AOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: AOOareas[i],
                    }));
                
                    resolve({ EOO: EOOresult, AOO: AOOresult });
                
                }).catch((err) => console.log(err));
                
            },
            (error: any) => {
                console.log(error.message)
            }
        )
    })
}

export { calcArea };